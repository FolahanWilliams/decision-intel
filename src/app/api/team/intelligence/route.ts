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
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('TeamIntelligenceAPI');

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
      return NextResponse.json({
        profile: null,
        causalWeights: [],
        maturityScore: null,
        _message: 'Organization membership required for team intelligence.',
      });
    }

    // Parallel fetch: profile, causal weights, maturity score
    const [profile, causalEdges, maturity] = await Promise.all([
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
    ]);

    // Transform causal edges into weights the frontend can display
    const causalWeights = (causalEdges as Array<{
      fromVar: string;
      toVar: string;
      strength: number;
      confidence: number;
      sampleSize: number;
    }>)
      .filter(e => e.toVar === 'outcome' || e.toVar === 'noise_score' || e.toVar === 'overall_score')
      .map(e => ({
        biasType: e.fromVar,
        outcomeCorrelation: e.strength,
        dangerMultiplier: e.strength < 0 ? Math.abs(e.strength) * 3 + 1 : Math.max(0.1, 1 - e.strength),
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
          topBiases: profile.topBiases as Array<{ biasType: string; count: number; avgSeverity: string }> | null,
          nudgeEffectiveness: profile.nudgeEffectiveness as {
            sent: number;
            acknowledged: number;
            helpfulRate: number;
          } | null,
          consistencyTrend: profile.consistencyTrend as Array<{ date: string; score: number }> | null,
        }
      : null;

    return NextResponse.json(
      {
        profile: profileData,
        causalWeights,
        maturityScore: maturity
          ? { score: maturity.score, grade: maturity.grade, breakdown: maturity.breakdown, peerBenchmark: maturity.peerBenchmark }
          : null,
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
