/**
 * Team Intelligence API
 *
 * GET /api/team/intelligence — Returns team cognitive profile,
 * causal weights (which biases hurt this org), and maturity score.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { computeMaturityScore } from '@/lib/learning/maturity-score';
import { brierCategory, type BrierCategory } from '@/lib/learning/brier-scoring';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('TeamIntelligenceAPI');

const BRIER_WINDOW_DAYS = 90;
const BRIER_MIN_SAMPLE = 3;

interface BrierChip {
  avgBrier: number;
  category: BrierCategory;
  sampleSize: number;
  windowDays: number;
}

interface OutcomesPending {
  pending: number;
  overdue: number;
}

/** Roll the last BRIER_WINDOW_DAYS of outcome rows into a single
 *  org-level calibration signal. Returns null when the sample is too
 *  small to be defensible — we would rather show nothing than a chip
 *  built from one data point. */
async function computeOrgBrierChip(
  orgId: string | null,
  userId: string
): Promise<BrierChip | null> {
  try {
    const since = new Date(Date.now() - BRIER_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const rows = await prisma.decisionOutcome.findMany({
      where: {
        reportedAt: { gte: since },
        brierScore: { not: null },
        ...(orgId ? { orgId } : { userId }),
      },
      select: { brierScore: true },
    });
    if (rows.length < BRIER_MIN_SAMPLE) return null;
    const sum = rows.reduce((acc, r) => acc + (r.brierScore ?? 0), 0);
    const avg = sum / rows.length;
    return {
      avgBrier: Number(avg.toFixed(3)),
      category: brierCategory(avg),
      sampleSize: rows.length,
      windowDays: BRIER_WINDOW_DAYS,
    };
  } catch (err) {
    log.warn('Brier chip computation failed (non-fatal):', err);
    return null;
  }
}

/** Count analyses awaiting outcome — the "flywheel hasn't closed" backlog
 *  the sidebar chip surfaces. Splits `pending_outcome` from
 *  `outcome_overdue` so the UI can colour the overdue subset. */
async function computeOutcomesPending(
  orgId: string | null,
  userId: string
): Promise<OutcomesPending> {
  try {
    const scopeClause = orgId ? { document: { orgId } } : { document: { userId } };
    const [pending, overdue] = await Promise.all([
      prisma.analysis.count({
        where: { ...scopeClause, outcomeStatus: 'pending_outcome' },
      }),
      prisma.analysis.count({
        where: { ...scopeClause, outcomeStatus: 'outcome_overdue' },
      }),
    ]);
    return { pending, overdue };
  } catch (err) {
    log.warn('Outcomes-pending count failed (non-fatal):', err);
    return { pending: 0, overdue: 0 };
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve org
    let orgId: string | null = null;
    try {
      const membership = await prisma.teamMember.findFirst({
        where: { userId: user.id },
        select: { orgId: true },
      });
      orgId = membership?.orgId ?? null;
    } catch {
      // Schema drift
    }

    if (!orgId) {
      // Personal scope — org-gated signals are empty but flywheel signals
      // (Brier, outcomes-pending) still render off the user's own analyses.
      const [brierChip, outcomesPending] = await Promise.all([
        computeOrgBrierChip(null, user.id),
        computeOutcomesPending(null, user.id),
      ]);
      return NextResponse.json({
        profile: null,
        causalWeights: [],
        maturityScore: null,
        brierChip,
        outcomesPending,
        _message: 'Personal scope — team-level signals require org membership.',
      });
    }

    // Parallel fetch: profile, causal weights, maturity score, flywheel
    const [profile, causalEdges, maturity, brierChip, outcomesPending] = await Promise.all([
      prisma.teamCognitiveProfile
        .findFirst({
          where: { orgId },
          orderBy: { periodEnd: 'desc' },
        })
        .catch(() => null),

      // Fetch org-specific causal edges directly from the CausalEdge table
      prisma.causalEdge
        .findMany({
          where: { orgId },
          orderBy: { confidence: 'desc' },
          take: 20,
        })
        .catch(() => []),

      computeMaturityScore(orgId).catch(() => null),

      computeOrgBrierChip(orgId, user.id),
      computeOutcomesPending(orgId, user.id),
    ]);

    // Transform causal edges into weights the frontend can display
    const causalWeights = (
      causalEdges as Array<{
        fromVar: string;
        toVar: string;
        strength: number;
        confidence: number;
        sampleSize: number;
      }>
    )
      .filter(
        e => e.toVar === 'outcome' || e.toVar === 'noise_score' || e.toVar === 'overall_score'
      )
      .map(e => ({
        biasType: e.fromVar,
        outcomeCorrelation: e.strength,
        dangerMultiplier:
          e.strength < 0 ? Math.abs(e.strength) * 3 + 1 : Math.max(0.1, 1 - e.strength),
        sampleSize: e.sampleSize,
        confidence: e.confidence,
      }))
      .sort((a, b) => b.dangerMultiplier - a.dangerMultiplier)
      .slice(0, 10);

    // Parse JSON fields safely
    const profileData = profile
      ? {
          avgDecisionQuality: profile.avgDecisionQuality,
          avgNoiseScore: profile.avgNoiseScore,
          totalDecisions: profile.totalDecisions,
          topBiases: profile.topBiases as Array<{
            biasType: string;
            count: number;
            avgSeverity: string;
          }> | null,
          nudgeEffectiveness: profile.nudgeEffectiveness as {
            sent: number;
            acknowledged: number;
            helpfulRate: number;
          } | null,
          consistencyTrend: profile.consistencyTrend as Array<{
            date: string;
            score: number;
          }> | null,
        }
      : null;

    return NextResponse.json(
      {
        profile: profileData,
        causalWeights,
        maturityScore: maturity
          ? {
              score: maturity.score,
              grade: maturity.grade,
              breakdown: maturity.breakdown,
              peerBenchmark: maturity.peerBenchmark,
            }
          : null,
        brierChip,
        outcomesPending,
      },
      {
        headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=60' },
      }
    );
  } catch (error) {
    log.error('Team Intelligence API failed:', error);
    return NextResponse.json({ error: 'Failed to fetch team intelligence' }, { status: 500 });
  }
}
