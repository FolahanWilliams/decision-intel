/**
 * POST /api/founder-hub/outreach/onepager
 *
 * Phase C — generates a public-case-anchored 1-pager leave-behind for
 * a named prospect and persists it as an OutreachArtifact (so it
 * surfaces in the same pipeline as every other drafted message).
 *
 * Deliberately a sibling of /outreach/generate, not a branch inside
 * its SSE profile-extraction stream: a 1-pager has a different input
 * shape (no LinkedIn profile) and is a single synchronous generation.
 * It REUSES the OutreachArtifact table, the personal-social archetype
 * engine, and Phase B's canonical anchor helpers — zero rebuild — and
 * leaves the working generate stream untouched.
 *
 * Ego-threat lock is structural: the anchor is only ever a PUBLIC
 * 143-library case (selectOnepagerAnchor → ALL_CASES). The route is
 * given no prospect-decision input to leak; the instruction forbids
 * inventing one. Founder-facing, human-in-loop — nothing is sent.
 *
 * Auth: x-founder-pass header.
 */

import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { apiError, apiSuccess } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';
import {
  verifyFounderPass as checkFounderPass,
  checkFounderHubLlmRateLimit,
} from '@/lib/utils/founder-auth';
import { generateText } from '@/lib/ai/providers/gateway';
import { MODEL_CHEAP } from '@/lib/ai/gateway-models';
import { ALL_CASES, getSlugForCase } from '@/lib/data/case-studies';
import { buildPersonalSocialSystemPrompt } from '@/lib/data/personal-social-system-prompt';
import {
  selectOnepagerAnchor,
  pickOnepagerArchetypeId,
  buildOnepagerInstruction,
  type OnepagerRequest,
} from '@/lib/outreach/onepager';
import { FOUNDER_CONTEXT } from '../../founder-context';

const log = createLogger('OutreachOnepager');

const FOUNDER_USER_ID = 'founder';

function verifyFounderPass(req: NextRequest): boolean {
  return checkFounderPass(req.headers.get('x-founder-pass')).ok;
}

export async function POST(req: NextRequest) {
  if (!verifyFounderPass(req)) {
    return apiError({ error: 'Unauthorized', status: 401 });
  }

  // Cost-burn cap (2026-06-09 security sweep): pass-gated is not enough — the
  // UI credential is bundle-extractable and every call costs real LLM spend.
  if (!(await checkFounderHubLlmRateLimit('onepager'))) {
    return apiError({ error: 'Rate limit exceeded — try again in a minute.', status: 429 });
  }

  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) return apiError({ error: 'AI not configured', status: 503 });

  let body: Partial<OnepagerRequest>;
  try {
    body = (await req.json()) as Partial<OnepagerRequest>;
  } catch {
    // canonical req.json() body-parse exception
    return apiError({ error: 'Invalid JSON body', status: 400 });
  }

  const prospectCompany = String(body.prospectCompany ?? '').trim();
  const prospectRole = String(body.prospectRole ?? '').trim();
  const sector = String(body.sector ?? '').trim();
  if (!prospectCompany || !prospectRole || !sector) {
    return apiError({
      error: 'prospectCompany, prospectRole and sector are all required',
      status: 400,
    });
  }

  const anchor = selectOnepagerAnchor(sector, ALL_CASES);
  if (!anchor) {
    return apiError({
      error: `No public anchor case in the 143-case library for sector "${sector}". Pick a sector with library coverage rather than ship an unanchored 1-pager.`,
      status: 400,
    });
  }

  const request: OnepagerRequest = {
    prospectCompany,
    prospectRole,
    sector,
    personaId: body.personaId,
  };
  const archetypeId = pickOnepagerArchetypeId(sector, prospectRole, body.personaId);
  const { systemPrompt, archetype } = buildPersonalSocialSystemPrompt({
    founderContext: FOUNDER_CONTEXT,
    contentTypeInstructions: buildOnepagerInstruction(request, anchor),
    archetypeId,
  });

  try {
    const result = await generateText(
      `${systemPrompt}\n\nNow write the one-page leave-behind for ${prospectCompany} (${prospectRole}, ${sector}) using the "${archetype.name}" archetype shape and the PUBLIC ${anchor.company} anchor. Output ONLY the 1-pager prose — no preamble, no markdown headers.`,
      { model: MODEL_CHEAP }
    );
    const onepager = result.text.trim();
    if (!onepager) {
      return apiError({ error: 'Generation returned empty — retry', status: 502 });
    }

    let artifactId = '';
    try {
      const saved = await prisma.outreachArtifact.create({
        data: {
          userId: FOUNDER_USER_ID,
          intent: 'case_onepager',
          contactCompany: prospectCompany,
          contactTitle: prospectRole,
          extractedProfile: {
            prospectCompany,
            prospectRole,
            sector,
            anchorCaseCompany: anchor.company,
            anchorCaseSlug: getSlugForCase(anchor),
            archetypeId: archetype.id,
          } as unknown as Prisma.InputJsonValue,
          generatedMessage: onepager,
          talkingPoints: [] as unknown as Prisma.InputJsonValue,
          warmOpeners: [] as unknown as Prisma.InputJsonValue,
          intentCallouts: [] as unknown as Prisma.InputJsonValue,
          status: 'draft',
        },
      });
      artifactId = saved.id;
    } catch (dbErr) {
      const code = (dbErr as { code?: string })?.code;
      if (code === 'P2021' || code === 'P2022') {
        log.warn('OutreachArtifact table missing — skipping persist', { code });
      } else {
        log.error('Failed to persist 1-pager OutreachArtifact', dbErr);
      }
    }

    log.info(
      `1-pager generated for ${prospectCompany} (${prospectRole}) · anchor=${anchor.company} · archetype=${archetype.id}`
    );

    return apiSuccess({
      data: {
        artifactId,
        onepager,
        anchor: {
          company: anchor.company,
          title: anchor.title,
          slug: getSlugForCase(anchor),
          primaryBias: anchor.primaryBias,
        },
        archetype: { id: archetype.id, name: archetype.name },
      },
    });
  } catch (err) {
    log.error('1-pager generation failed', err);
    return apiError({ error: 'Generation failed', status: 500 });
  }
}
