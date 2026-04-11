import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { formatSSE } from '@/lib/sse';
import { createLogger } from '@/lib/utils/logger';
import { safeCompare } from '@/lib/utils/safe-compare';
import { prisma } from '@/lib/prisma';
import { fetchLinkedInProfile } from '@/lib/outreach/linkedin-parser';
import { extractProfile } from '@/lib/outreach/profile-extractor';
import { generateOutreach } from '@/lib/outreach/message-generator';
import { OUTREACH_INTENTS, type OutreachIntent, type OutreachStreamEvent } from '@/lib/outreach/types';

const log = createLogger('OutreachGenerate');
const ENCODER = new TextEncoder();

const FOUNDER_USER_ID = 'founder';

interface GenerateBody {
  url?: string;
  rawText?: string;
  intent: OutreachIntent;
  contactName?: string;
  contactTitle?: string;
  contactCompany?: string;
}

export async function POST(req: NextRequest) {
  const founderPass = process.env.NEXT_PUBLIC_FOUNDER_HUB_PASS;
  if (!founderPass) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }
  const headerPass = req.headers.get('x-founder-pass') || '';
  if (!safeCompare(headerPass, founderPass)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.intent || !OUTREACH_INTENTS.includes(body.intent)) {
    return NextResponse.json(
      { error: `intent must be one of: ${OUTREACH_INTENTS.join(', ')}` },
      { status: 400 }
    );
  }
  if (!body.url && !body.rawText) {
    return NextResponse.json(
      { error: 'Provide either `url` or `rawText`.' },
      { status: 400 }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: OutreachStreamEvent) => {
        controller.enqueue(ENCODER.encode(formatSSE(event)));
      };

      try {
        send({ type: 'step', step: 'parse', label: 'Parsing profile...' });
        const fetched = await fetchLinkedInProfile({ url: body.url, rawText: body.rawText });

        send({ type: 'step', step: 'analyze', label: 'Analyzing professional context...' });
        const profile = await extractProfile(fetched.rawText);
        send({ type: 'profile', profile });

        send({ type: 'step', step: 'match', label: 'Matching to founder positioning...' });
        // Small deliberate pause so the step visually registers even if the LLM is fast.
        await new Promise(resolve => setTimeout(resolve, 250));

        send({ type: 'step', step: 'draft', label: 'Drafting outreach...' });
        const outreach = await generateOutreach(profile, body.intent);

        let artifactId = '';
        try {
          const saved = await prisma.outreachArtifact.create({
            data: {
              userId: FOUNDER_USER_ID,
              intent: body.intent,
              contactName: body.contactName ?? profile.name ?? null,
              contactTitle: body.contactTitle ?? profile.role ?? null,
              contactCompany: body.contactCompany ?? profile.company ?? null,
              sourceUrl: body.url ?? null,
              sourceText: fetched.source === 'paste' ? fetched.rawText : null,
              extractedProfile: profile as unknown as Prisma.InputJsonValue,
              generatedMessage: outreach.message,
              talkingPoints: outreach.talkingPoints as unknown as Prisma.InputJsonValue,
              warmOpeners: outreach.warmOpeners as unknown as Prisma.InputJsonValue,
              intentCallouts: outreach.callouts as unknown as Prisma.InputJsonValue,
              status: 'draft',
            },
          });
          artifactId = saved.id;
        } catch (dbErr) {
          const code = (dbErr as { code?: string })?.code;
          if (code === 'P2021' || code === 'P2022') {
            log.warn('OutreachArtifact table missing — skipping persist', { code });
          } else {
            log.error('Failed to persist OutreachArtifact', dbErr);
          }
        }

        send({ type: 'result', outreach, artifactId });
        send({ type: 'done' });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        log.error('Outreach generation failed', err);
        send({ type: 'error', message: msg });
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
