/**
 * POST /api/decisions/[id]/deal-fever-premortem — Kyle-Price-overlay
 * Deal-Fever pre-mortem for acquisition-mode containers (N1 ship 2026-05-11).
 *
 * Anchor (master KB source #23): Kyle Price, Roblox Head of Corp Dev, on
 * the M&A Science podcast: "There's no cure for Deal Fever. The only
 * countermeasure is a red team exercise — somebody pitches the case for
 * why this is a horrible idea." We don't position DI as a red team
 * (banned per Tier 3.1 — political-capital framing), but we use Kyle's
 * insight as the operational template: 3 brutal pre-mortem questions
 * targeted at the 3 deadliest M&A failure patterns (Deal Fever / Winner's
 * Curse / Synergy Mirage). Same dissent, zero political capital spent.
 *
 * Gating: acquisition-mode containers only. Caller must own / share-org
 * the container. Cached 24h per container — the questions don't change
 * meaningfully until new documents land.
 *
 * Cost: one MODEL_CHEAP (gemini-3.1-flash-lite) call per container per
 * day. ~$0.0005 per call. Fire-and-forget for cost; the UI cache absorbs
 * the latency.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { generateText } from '@/lib/ai/providers/gateway';
import { MODEL_CHEAP } from '@/lib/ai/gateway-models';
import { parseJSON } from '@/lib/utils/json';
import { cacheGet, cacheSet } from '@/lib/utils/cache';

const log = createLogger('DealFeverPremortem');

const SYSTEM_PROMPT = `You are running a Deal Fever pre-mortem on an acquisition memo.

Kyle Price (Head of Corp Dev at Roblox) named the structural failure mode
on the M&A Science podcast: "There's no cure for Deal Fever. The only
countermeasure is a red team exercise — somebody pitches the case for
why this is a horrible idea."

You ARE that someone. But you operate as the system, not a person — so
you cost the corp dev professional NO political capital. The audit fires
before the IC memo can hide what the deal sponsor doesn't want to see.

Return exactly THREE brutal questions, each targeting one of the three
deadliest M&A failure patterns:

1. **Deal Fever / Escalation of Commitment** — sunk-cost reasoning,
   "we've come too far to walk away", IC-presentation anchoring, the
   sponsor's reputation being implicit collateral.
2. **Winner's Curse / Auction Dynamics** — competitive-bidding language,
   "preempting competitor X", "strategic necessity", premium-paying
   logic that doesn't hold without the auction frame.
3. **Synergy Mirage** — synergy claims without named operational
   mechanism, accountable executive owner, or measurable 90-day milestone.
   BCG framework: every synergy claim must answer mechanism + owner +
   milestone or it's mirage.

Each question must:
- Be SPECIFIC to the memo (cite the actual claim being challenged).
- Phrase the question so the sponsor can't answer with rhetoric — they
  have to produce a number, a mechanism, or a named owner.
- Be the kind of question that would make the IC committee delay the
  vote if asked aloud at the table.

Return ONLY valid JSON (no markdown, no prose):
{
  "questions": [
    {
      "pattern": "deal_fever" | "winners_curse" | "synergy_mirage",
      "question": "string — the brutal question, sponsor-facing",
      "evidence": "string — verbatim citation from the memo that prompted this question",
      "demand": "string — what the sponsor must produce to answer (number / mechanism / owner / milestone)"
    },
    { ... },
    { ... }
  ]
}`;

interface MemberDoc {
  document: {
    id: string;
    filename: string;
    documentType: string | null;
    content: string | null;
  };
}

async function resolveOrgId(userId: string): Promise<string | null> {
  try {
    const m = await prisma.teamMember.findFirst({
      where: { userId },
      select: { orgId: true },
    });
    return m?.orgId ?? null;
  } catch {
    return null;
  }
}

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrgId(user.id);

    const container = await prisma.decisionContainer.findFirst({
      where: {
        id,
        OR: orgId ? [{ ownerUserId: user.id }, { orgId }] : [{ ownerUserId: user.id }],
      },
      select: {
        id: true,
        kind: true,
        name: true,
        targetCompany: true,
        ticketSize: true,
        documents: {
          select: {
            document: {
              select: {
                id: true,
                filename: true,
                documentType: true,
                content: true,
              },
            },
          },
          take: 6,
        },
      },
    });

    if (!container) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 });
    }
    if (container.kind !== 'acquisition') {
      return NextResponse.json(
        { error: 'Deal Fever pre-mortem is scoped to acquisition-mode containers' },
        { status: 400 }
      );
    }

    // Find the CIM (or fall back to ic_memo / any analyzed doc with substance).
    const members = container.documents as MemberDoc[];
    const cim =
      members.find(m => m.document.documentType === 'cim') ??
      members.find(m => m.document.documentType === 'ic_memo') ??
      members.find(m => m.document.content && m.document.content.length > 500);

    if (!cim?.document.content) {
      return NextResponse.json(
        {
          error:
            'No CIM / IC memo with content found on this container. Upload one to run the Deal Fever pre-mortem.',
        },
        { status: 404 }
      );
    }

    // 24h cache per container — questions don't change meaningfully day-over-day.
    const cacheKey = `deal-fever:${id}:${cim.document.id}`;
    const cached = await cacheGet(cacheKey).catch(() => null);
    if (cached) {
      return NextResponse.json({ fromCache: true, ...JSON.parse(cached) });
    }

    const memoForPrompt = cim.document.content.slice(0, 6000);
    const context = [
      container.targetCompany ? `Target: ${container.targetCompany}` : null,
      container.ticketSize ? `Ticket size: ${container.ticketSize}` : null,
      `Container: ${container.name}`,
      `Document type: ${cim.document.documentType ?? 'unknown'}`,
    ]
      .filter(Boolean)
      .join('\n');

    const prompt = `${SYSTEM_PROMPT}

DEAL CONTEXT:
${context}

MEMO:
<memo>
${memoForPrompt}
</memo>

Three Deal-Fever-targeting questions, JSON only.`;

    const result = await generateText(prompt, {
      model: MODEL_CHEAP,
      temperature: 0.35,
      maxOutputTokens: 900,
    });

    const parsed = parseJSON(result.text) as {
      questions?: Array<{
        pattern?: string;
        question?: string;
        evidence?: string;
        demand?: string;
      }>;
    } | null;

    const validPatterns = new Set(['deal_fever', 'winners_curse', 'synergy_mirage']);
    const raw = Array.isArray(parsed?.questions) ? parsed.questions : [];
    const questions = raw
      .slice(0, 3)
      .map(q => ({
        pattern: validPatterns.has(String(q.pattern ?? '')) ? (q.pattern as string) : 'deal_fever',
        question: String(q.question ?? '').trim(),
        evidence: String(q.evidence ?? '').trim(),
        demand: String(q.demand ?? '').trim(),
      }))
      .filter(q => q.question.length > 0);

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'Could not generate pre-mortem questions for this memo.' },
        { status: 502 }
      );
    }

    const response = {
      questions,
      anchorSource: 'Kyle Price (Roblox Head of Corp Dev) — M&A Science podcast',
      generatedFor: cim.document.filename,
      generatedAt: new Date().toISOString(),
    };

    // 24h cache
    cacheSet(cacheKey, JSON.stringify(response), 24 * 60 * 60).catch(err =>
      log.warn('cache set failed:', err)
    );

    log.info('deal-fever-premortem success', {
      containerId: id,
      documentId: cim.document.id,
      questionCount: questions.length,
    });

    return NextResponse.json({ fromCache: false, ...response });
  } catch (err) {
    log.error('deal-fever-premortem failed', { err: String(err) });
    return NextResponse.json({ error: 'Deal Fever pre-mortem failed' }, { status: 500 });
  }
}
