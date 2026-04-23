/**
 * Per-contact meeting-prep generator.
 *
 * POST /api/founder-hub/design-partners/[id]/contacts/[contactId]/generate-prep
 *
 * Streams a Gemini-generated meeting-prep plan scoped to a specific
 * contact at a specific design partner. Unlike the ad-hoc
 * /api/founder-hub/meeting-prep (which is fire-and-forget), this route
 * persists the final accumulated plan to PartnerContact.generatedPrep so
 * the founder can re-read, re-open on a different device, and never
 * re-spend tokens on the same plan.
 *
 * System prompt is shared in spirit with /api/founder-hub/meeting-prep
 * but additionally carries the partner's rich-profile context (what
 * they do, wedges, offer, positioning) so the plan is grounded in the
 * specific partner's world, not generic founder context.
 *
 * Auth: x-founder-pass header.
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getRequiredEnvVar, getOptionalEnvVar } from '@/lib/env';
import { formatSSE } from '@/lib/sse';
import { createLogger } from '@/lib/utils/logger';
import { verifyFounderPass } from '@/lib/utils/founder-auth';
import { FOUNDER_CONTEXT } from '@/app/api/founder-hub/founder-context';
import type { PartnerRichProfile } from '@/types/partner-profile';

const log = createLogger('PartnerContactPrep');
const ENCODER = new TextEncoder();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedModel: any = null;
function getModel() {
  if (cachedModel) return cachedModel;
  const apiKey = getRequiredEnvVar('GOOGLE_API_KEY');
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = getOptionalEnvVar('GEMINI_MODEL_NAME', 'gemini-3-flash-preview');
  const model = genAI.getGenerativeModel({
    model: modelName,
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ],
    generationConfig: { maxOutputTokens: 6144, temperature: 0.35 },
  });
  cachedModel = model;
  return model;
}

const PARTNER_PREP_SYSTEM_PROMPT = `
You are Decision Intel's executive meeting-preparation strategist. You write ONE custom plan per request. No templates, no generic advice. The founder has a specific meeting coming up with a specific person at a specific design partner; return the plan he will use in the room.

=== WHAT YOU HAVE ===
Two bodies of context are loaded above:
1. FOUNDER CONTEXT — everything about Decision Intel, the founder's profile, positioning, assets, voice discipline.
2. PARTNER CONTEXT — structured briefing on THIS specific design partner (what they do, the wedges that fit, the offer spec, the positioning frame, the intro context, the risks, the strategic value). Ground every section of the plan in this partner's world, not generic founder context.

=== THE FRAME ===
Use Aristotle's three modes of persuasion, ethos pathos logos, and Cialdini's six influence principles where they apply. Name them where you use them so the founder sees the architecture. Ethos = why trust him now (Wiz advisor, shipped codebase, academic anchors). Pathos = what THIS person feels about their domain right now (extract from their LinkedIn). Logos = the logical case (case corpus, regulatory tailwinds, unit economics).

=== OUTPUT SHAPE ===
Use these sections in this order, with UPPERCASE headers. Plain prose, short paragraphs or numbered items. No markdown bullets. No em dashes. No markdown bold.

WHO THEY ARE
Three to five sentences based on their LinkedIn info. What MATTERS for this meeting. One specific signal if the info permits. If sparse, say so.

WHAT A WIN LOOKS LIKE (IN THEIR LANGUAGE)
One to two sentences restating the founder's ask in language THEY will accept, not the language he framed it in.

THE OPENING 60 SECONDS (ETHOS ANCHOR)
One sentence he says out loud as the meeting starts. Grounded in the partner's heritage / values / language. Write the exact sentence. Then one sentence on WHY that anchor for this person.

PATHOS MOVES
Two to three numbered items. Emotional currents to meet them in. Each item: mental note PLUS the sentence he actually says.

LOGOS MOVES
Three claims ranked easiest-to-hardest to defend. Each with: the claim, the supporting fact from Decision Intel's real asset library (no invention), and the follow-up question that deepens their engagement. Third claim should invoke scarcity or social proof (the five-seat cohort works well if true).

THE THREE QUESTIONS THEY WILL LIKELY ASK
Predict the three sharpest questions for THIS specific person based on their role at this specific partner. Each gets the question, the founder's one-paragraph answer, and the Cialdini lever at play.

THE ASK
One paragraph. Specific, small, reciprocal. What he wants from them by when, and what he offers in exchange before they say yes. Reciprocity first.

PRE-MEETING PREP (20 MINUTES, THE MORNING OF)
Six to eight numbered items. Specific to this meeting. Last item is always "breathe, walk around the block, arrive calm."

THE CLOSE
One paragraph. Specific verbal ask + specific next artifact + specific calendar move. Never open-ended.

AFTER THE MEETING
Three numbered items. Send-back email, artifact attached, CRM / Decision Log update. Always include logging the call + a Brier-calibrated probability in the Decision Log so we eat our own dogfood.

=== STYLE RULES ===
No markdown bold. No em dashes. Use commas or sentence breaks. No "you might consider" hedging. Use "he" for the founder. Never invent facts about Decision Intel beyond what's in FOUNDER CONTEXT. Never invent facts about the partner beyond what's in PARTNER CONTEXT. If in doubt, use the softer honest framing. Length: 900-1,300 words.
`.trim();

function verify(req: NextRequest): boolean {
  return verifyFounderPass(req.headers.get('x-founder-pass')).ok;
}

function buildPartnerContextBlock(
  profile: PartnerRichProfile | null,
  partnerCompany: string,
  partnerFounderNotes: string | null
): string {
  const parts: string[] = [];
  parts.push(`PARTNER: ${partnerCompany}`);

  if (profile?.whatTheyDo) {
    const w = profile.whatTheyDo;
    if (w.summary) parts.push(`\nWhat they do: ${w.summary}`);
    if (w.heritage) parts.push(`\nHeritage framing: ${w.heritage}`);
    if (w.philosophy) parts.push(`\nPhilosophy: ${w.philosophy}`);
    if (w.scale) {
      const s = w.scale;
      const scaleLines = [
        s.aum && `AUM ${s.aum}`,
        s.teamSize && `Team ${s.teamSize}`,
        s.founded && `Founded ${s.founded}`,
        s.regulator && `Regulator: ${s.regulator}`,
        s.licenses && s.licenses.length ? `Licences: ${s.licenses.join(', ')}` : null,
      ].filter(Boolean);
      if (scaleLines.length) parts.push(`\nScale: ${scaleLines.join(' | ')}`);
    }
    if (w.keyPeople && w.keyPeople.length) {
      parts.push(
        `\nKey people: ${w.keyPeople.map(p => `${p.name} (${p.role})${p.note ? ` — ${p.note}` : ''}`).join('; ')}`
      );
    }
  }

  if (profile?.wedges && profile.wedges.length) {
    parts.push('\nFit wedges:');
    profile.wedges.forEach((w, i) => {
      parts.push(`${i + 1}. ${w.title} — ${w.description} [DI intersect: ${w.diIntersect}]`);
    });
  }

  if (profile?.offerSpec) {
    const o = profile.offerSpec;
    if (o.pricing?.rate) {
      parts.push(`\nOffer: ${o.pricing.rate}${o.pricing.label ? ` (${o.pricing.label})` : ''}.`);
    }
    if (o.ask?.long) parts.push(`\nThe ask: ${o.ask.long}`);
  }

  if (profile?.positioning) {
    const p = profile.positioning;
    if (p.categoryAnchor) parts.push(`\nCategory anchor: ${p.categoryAnchor}`);
    if (p.openingLine) parts.push(`\nOpening line (reference): ${p.openingLine}`);
    if (p.avoidFraming && p.avoidFraming.length) {
      parts.push(`\nBanned framing: ${p.avoidFraming.join(' | ')}`);
    }
  }

  if (profile?.introContext) {
    const i = profile.introContext;
    const introLines = [i.source, i.depth, i.rule].filter(Boolean);
    if (introLines.length) parts.push(`\nIntro context: ${introLines.join(' / ')}`);
  }

  if (profile?.risks && profile.risks.length) {
    parts.push('\nRisks to watch:');
    profile.risks.forEach((r, i) => parts.push(`${i + 1}. ${r.title} — ${r.detail}`));
  }

  if (partnerFounderNotes && partnerFounderNotes.trim().length > 0) {
    parts.push(`\nFreeform founder notes on this partner:\n${partnerFounderNotes.trim()}`);
  }

  return parts.join('\n');
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  if (!verify(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id, contactId } = await params;

  const contact = await prisma.partnerContact.findFirst({
    where: { id: contactId, partnerAppId: id },
  });
  if (!contact) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
  }

  const partner = await prisma.designPartnerApplication.findUnique({
    where: { id },
    select: { company: true, richProfile: true, founderNotes: true },
  });
  if (!partner) {
    return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
  }

  const profile = (partner.richProfile as unknown as PartnerRichProfile) ?? null;
  const partnerContextBlock = buildPartnerContextBlock(
    profile,
    partner.company,
    partner.founderNotes
  );

  const meetingContext =
    (contact.meetingContext && contact.meetingContext.trim().length > 0
      ? contact.meetingContext
      : `Upcoming meeting with ${contact.name}, ${contact.role} at ${partner.company}. Warm intro already made; this is the conversion conversation for the design-partner pilot.`) ??
    '';
  const founderAsk =
    (contact.founderAsk && contact.founderAsk.trim().length > 0
      ? contact.founderAsk
      : `Secure agreement to a 30-day design-partner pilot at the founding rate, or at minimum a commitment to run one historical memo through the Decision Provenance Record within 7 days so the pilot has proof before the contract.`) ??
    '';

  const userPayload = [
    `MEETING CONTACT: ${contact.name} — ${contact.role}${contact.linkedInUrl ? ` (${contact.linkedInUrl})` : ''}`,
    '',
    'CONTACT LINKEDIN INFO (raw paste):',
    contact.linkedInInfo,
    '',
    'MEETING CONTEXT:',
    meetingContext,
    '',
    'FOUNDER ASK (what a win looks like):',
    founderAsk,
    '',
    'Write the full meeting-prep plan per the system-prompt structure, tailored to this specific person at this specific partner.',
  ].join('\n');

  try {
    const model = getModel();
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: FOUNDER_CONTEXT }] },
        {
          role: 'model',
          parts: [
            {
              text: 'Founder context loaded. Ready for the partner-specific context and then the meeting brief.',
            },
          ],
        },
        {
          role: 'user',
          parts: [
            { text: `PARTNER CONTEXT BEGINS\n\n${partnerContextBlock}\n\nPARTNER CONTEXT ENDS` },
          ],
        },
        {
          role: 'model',
          parts: [
            {
              text: "Partner context loaded. Every section of the plan will ground in this partner's world.",
            },
          ],
        },
        { role: 'user', parts: [{ text: PARTNER_PREP_SYSTEM_PROMPT }] },
        {
          role: 'model',
          parts: [
            {
              text: 'Ready. Share the contact info, the meeting context, and the desired outcome and I will return the custom plan.',
            },
          ],
        },
      ],
    });

    const result = await chat.sendMessageStream(userPayload);

    const stream = new ReadableStream({
      async start(controller) {
        let accumulated = '';
        let carry = '';
        const sanitize = (raw: string): string => {
          let s = carry + raw;
          carry = '';
          if (s.endsWith('*') && !s.endsWith('**')) {
            carry = '*';
            s = s.slice(0, -1);
          } else if (s.endsWith('_') && !s.endsWith('__')) {
            carry = '_';
            s = s.slice(0, -1);
          }
          return s.replace(/\*\*/g, '').replace(/__/g, '').replace(/[—–]/g, ', ');
        };
        try {
          for await (const chunk of result.stream) {
            const text = sanitize(chunk.text());
            if (text) {
              accumulated += text;
              controller.enqueue(ENCODER.encode(formatSSE({ type: 'chunk', text })));
            }
          }
          if (carry) {
            accumulated += carry;
            controller.enqueue(ENCODER.encode(formatSSE({ type: 'chunk', text: carry })));
          }

          // Persist the final plan so the founder can re-read without
          // re-spending tokens. Fire-and-forget on failure; the client
          // already has the streamed text either way.
          try {
            await prisma.partnerContact.update({
              where: { id: contactId },
              data: {
                generatedPrep: accumulated,
                generatedAt: new Date(),
                // If the user typed meetingContext / founderAsk inside
                // the generate form, persist those too so the UI stays
                // in sync next time.
                meetingContext: meetingContext || null,
                founderAsk: founderAsk || null,
              } as Prisma.PartnerContactUpdateInput,
            });
          } catch (persistErr) {
            log.warn('Failed to persist generatedPrep (non-fatal):', persistErr);
          }

          controller.enqueue(ENCODER.encode(formatSSE({ type: 'done' })));
        } catch (err) {
          log.error('Partner prep stream error:', err);
          controller.enqueue(
            ENCODER.encode(
              formatSSE({ type: 'error', message: 'Generation failed. Please retry.' })
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    log.error('Partner prep setup failed:', err);
    return NextResponse.json({ error: 'Failed to start generation.' }, { status: 500 });
  }
}
