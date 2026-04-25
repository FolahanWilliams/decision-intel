import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { generateText } from '@/lib/ai/providers/gemini';
import { parseJSON } from '@/lib/utils/json';
import { getDocumentContent } from '@/lib/utils/encryption';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { createLogger } from '@/lib/utils/logger';
import { buildStructuralAssumptionsPrompt } from '@/lib/agents/prompts';
import { DALIO_DETERMINANTS } from '@/lib/constants/dalio-determinants';
import { resolveAnalysisAccess } from '@/lib/utils/document-access';
import { Prisma } from '@prisma/client';

const log = createLogger('StructuralAssumptionsAPI');

// Dalio structural-assumptions audit — runs on-demand from the analysis detail
// page as a SECONDARY layer alongside cognitive-bias detection. Deliberately
// NOT in the 12-node pipeline so existing DQI scores do not drift. Cost is
// ~£0.03-0.06 per run (one gemini-3-flash-preview call on the memo body).
//
// Access policy matches /api/analysis/[id]/risk-score: user owns the document
// OR is a member of the document's org.

const MAX_MEMO_CHARS = 24000;
const RATE_LIMIT_KEY = 'structural-assumptions';

type StructuralAssumption = {
  determinantId: string;
  determinantLabel?: string;
  category?: string;
  assumption: string;
  defensibility: 'well_supported' | 'partially_supported' | 'unsupported' | 'contradicted';
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidenceFromMemo?: string;
  hardeningQuestion?: string;
};

type StructuralAudit = {
  structuralAssumptions: StructuralAssumption[];
  summary: string;
  framework: 'dalio-18-determinants';
  generatedAt: string;
};

function normaliseDefensibility(v: unknown): StructuralAssumption['defensibility'] {
  const s = String(v ?? '').toLowerCase();
  if (s === 'well_supported' || s === 'well-supported' || s === 'supported') return 'well_supported';
  if (s === 'partially_supported' || s === 'partial' || s === 'partially-supported')
    return 'partially_supported';
  if (s === 'contradicted' || s === 'contradictory') return 'contradicted';
  return 'unsupported';
}

function normaliseSeverity(v: unknown): StructuralAssumption['severity'] {
  const s = String(v ?? '').toLowerCase();
  if (s === 'critical') return 'critical';
  if (s === 'high' || s === 'severe') return 'high';
  if (s === 'medium' || s === 'moderate') return 'medium';
  return 'low';
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rate = await checkRateLimit(user.id, RATE_LIMIT_KEY, {
      windowMs: 60 * 60 * 1000,
      maxRequests: 10,
      failMode: 'closed',
    });
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Too many structural-assumption audits in the last hour.' },
        { status: 429 }
      );
    }

    const { id: analysisId } = await params;

    // RBAC (3.5): visibility-aware access via the parent document.
    const access = await resolveAnalysisAccess(analysisId, user.id);
    if (!access) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      select: {
        id: true,
        marketContextApplied: true,
        marketContextOverride: true,
        document: {
          select: {
            id: true,
            content: true,
            contentEncrypted: true,
            contentIv: true,
            contentTag: true,
            contentKeyVersion: true,
            deal: { select: { sector: true } },
          },
        },
      },
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    const memoText = getDocumentContent(
      analysis.document as Parameters<typeof getDocumentContent>[0]
    );
    if (!memoText || memoText.trim().length < 200) {
      return NextResponse.json(
        { error: 'Memo content too short for structural audit.' },
        { status: 400 }
      );
    }

    // Cap passed to the model to keep the token budget predictable. The
    // structural audit reads the memo holistically; the first ~24k chars are
    // enough context for the 18-determinant scan.
    const capped = memoText.slice(0, MAX_MEMO_CHARS);

    // 3.6 deep — feed the effective market context (override > applied)
    // into the structural-assumptions prompt so an overridden EM memo
    // gets EM-shaped Dalio prompts and a Lagos memo isn't audited
    // against developed-market baselines.
    const effectiveContext = (analysis.marketContextOverride ??
      analysis.marketContextApplied) as
      | {
          context?: 'emerging_market' | 'developed_market' | 'cross_border' | 'unknown';
          emergingMarketCountries?: string[];
          developedMarketCountries?: string[];
        }
      | null;
    const region = effectiveContext
      ? [
          ...(effectiveContext.emergingMarketCountries ?? []),
          ...(effectiveContext.developedMarketCountries ?? []),
        ]
          .slice(0, 3)
          .join(', ') || undefined
      : undefined;
    const prompt = buildStructuralAssumptionsPrompt(capped, {
      industry: analysis.document.deal?.sector ?? undefined,
      region,
      marketContext:
        effectiveContext?.context && effectiveContext.context !== 'unknown'
          ? effectiveContext.context
          : undefined,
    });

    const result = await generateText(prompt, {
      model: 'gemini-3-flash-preview',
      temperature: 0.2,
      maxTokens: 1800,
    });

    const parsed = parseJSON(result.text) as {
      structuralAssumptions?: StructuralAssumption[];
      summary?: string;
    } | null;

    const rawAssumptions = Array.isArray(parsed?.structuralAssumptions)
      ? parsed!.structuralAssumptions
      : [];

    const structuralAssumptions: StructuralAssumption[] = rawAssumptions
      .map(a => {
        const id = String(a.determinantId ?? '').trim();
        const determinant = DALIO_DETERMINANTS[id];
        return {
          determinantId: id,
          determinantLabel: determinant?.label,
          category: determinant?.category,
          assumption: String(a.assumption ?? '').trim().slice(0, 400),
          defensibility: normaliseDefensibility(a.defensibility),
          severity: normaliseSeverity(a.severity),
          evidenceFromMemo:
            typeof a.evidenceFromMemo === 'string' && a.evidenceFromMemo.trim().length > 0
              ? a.evidenceFromMemo.trim().slice(0, 240)
              : undefined,
          hardeningQuestion:
            typeof a.hardeningQuestion === 'string' && a.hardeningQuestion.trim().length > 0
              ? a.hardeningQuestion.trim().slice(0, 280)
              : undefined,
        };
      })
      // Keep only entries with a recognised determinant id and a non-empty
      // assumption line — the model occasionally hallucinates determinants.
      .filter(a => a.determinantLabel != null && a.assumption.length > 0);

    const payload: StructuralAudit = {
      structuralAssumptions,
      summary:
        typeof parsed?.summary === 'string' && parsed.summary.trim().length > 0
          ? parsed.summary.trim()
          : structuralAssumptions.length === 0
            ? 'No meaningful structural exposures detected.'
            : 'Structural assumptions flagged — see list.',
      framework: 'dalio-18-determinants',
      generatedAt: new Date().toISOString(),
    };

    // 1.3a deep — persist the run so subsequent reads (StructuralAssumptionsPanel,
    // org-level exposure aggregator) don't re-pay the LLM cost. Replace any
    // prior persisted set for this analysis to keep cardinality clean. Schema-
    // drift tolerant: if the table is missing the run still returns inline.
    const effectiveContextLabel =
      effectiveContext?.context && effectiveContext.context !== 'unknown'
        ? effectiveContext.context
        : null;
    try {
      await prisma.$transaction(async tx => {
        await tx.structuralAssumption.deleteMany({ where: { analysisId } });
        if (structuralAssumptions.length > 0) {
          await tx.structuralAssumption.createMany({
            data: structuralAssumptions.map(a => ({
              analysisId,
              determinantId: a.determinantId,
              determinantLabel: a.determinantLabel ?? null,
              category: a.category ?? null,
              assumption: a.assumption,
              defensibility: a.defensibility,
              severity: a.severity,
              evidenceFromMemo: a.evidenceFromMemo ?? null,
              hardeningQuestion: a.hardeningQuestion ?? null,
              framework: 'dalio-18-determinants',
              marketContext: effectiveContextLabel,
            })) satisfies Prisma.StructuralAssumptionCreateManyInput[],
          });
        }
      });
    } catch (persistErr) {
      log.warn(
        'structural-assumptions persistence failed (non-critical):',
        persistErr instanceof Error ? persistErr.message : String(persistErr)
      );
    }

    return NextResponse.json(payload);
  } catch (err) {
    log.error('structural-assumptions audit failed', err as Error);
    return NextResponse.json(
      { error: 'Structural assumptions audit failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analysis/:id/structural-assumptions
 *
 * Returns the persisted structural-assumptions run for the analysis, or
 * `{ structuralAssumptions: [], cached: false }` when nothing has run yet.
 * Used by the StructuralAssumptionsPanel to render previous results
 * without paying the Gemini cost again on every page load.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: analysisId } = await params;
    const access = await resolveAnalysisAccess(analysisId, user.id);
    if (!access) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    const rows = await prisma.structuralAssumption
      .findMany({
        where: { analysisId },
        orderBy: { generatedAt: 'desc' },
      })
      .catch(() => []);

    if (rows.length === 0) {
      return NextResponse.json({
        structuralAssumptions: [],
        summary: 'No structural-assumptions run on file. Run the audit to populate this layer.',
        framework: 'dalio-18-determinants',
        cached: false,
      });
    }

    const generatedAt = rows[0].generatedAt.toISOString();

    const payload: StructuralAudit & { cached: boolean } = {
      structuralAssumptions: rows.map(r => ({
        determinantId: r.determinantId,
        determinantLabel: r.determinantLabel ?? undefined,
        category: r.category ?? undefined,
        assumption: r.assumption,
        defensibility: normaliseDefensibility(r.defensibility),
        severity: normaliseSeverity(r.severity),
        evidenceFromMemo: r.evidenceFromMemo ?? undefined,
        hardeningQuestion: r.hardeningQuestion ?? undefined,
      })),
      summary: `${rows.length} structural assumption${rows.length === 1 ? '' : 's'} persisted from the most recent run.`,
      framework: 'dalio-18-determinants',
      generatedAt,
      cached: true,
    };

    return NextResponse.json(payload);
  } catch (err) {
    log.error('structural-assumptions GET failed', err as Error);
    return NextResponse.json(
      { error: 'Failed to load structural assumptions' },
      { status: 500 }
    );
  }
}
