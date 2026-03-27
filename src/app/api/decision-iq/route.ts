/**
 * Decision IQ API — Composite endpoint for the north-star metric
 *
 * GET /api/decision-iq — Returns maturity score, accuracy improvement,
 * quarterly impact, and trend data in a single call. Auto-resolves
 * the user's org from their team membership.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { computeMaturityScore } from '@/lib/learning/maturity-score';
import { getAccuracyImprovement, getQuarterlyImpact } from '@/lib/learning/outcome-scoring';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('DecisionIQAPI');

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
      // Schema drift — no team tables yet
    }

    if (!orgId) {
      // Fallback: compute a simplified personal score
      const totalAnalyses = await prisma.document.count({ where: { userId: user.id } });
      let outcomeCount = 0;
      try {
        outcomeCount = await prisma.decisionOutcome.count({ where: { userId: user.id } });
      } catch {
        // Schema drift
      }

      const personalScore = totalAnalyses > 0
        ? Math.min(100, Math.round((outcomeCount / totalAnalyses) * 50 + 25))
        : 0;

      return NextResponse.json({
        score: personalScore,
        grade: personalScore >= 85 ? 'A' : personalScore >= 70 ? 'B' : personalScore >= 55 ? 'C' : personalScore >= 40 ? 'D' : 'F',
        breakdown: null,
        peerBenchmark: null,
        totalDecisions: totalAnalyses,
        accuracyImprovement: null,
        quarterlyImpact: null,
        trend: [],
        isPersonal: true,
      }, {
        headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=60' },
      });
    }

    // Parallel fetch all data
    const [maturity, accuracy, impact, profile] = await Promise.all([
      computeMaturityScore(orgId),
      getAccuracyImprovement(orgId).catch(() => null),
      getQuarterlyImpact(orgId).catch(() => null),
      prisma.teamCognitiveProfile.findFirst({
        where: { orgId },
        orderBy: { periodEnd: 'desc' },
        select: { consistencyTrend: true },
      }).catch(() => null),
    ]);

    // Extract trend sparkline data from TeamCognitiveProfile
    const trend: number[] = [];
    if (profile?.consistencyTrend && Array.isArray(profile.consistencyTrend)) {
      for (const pt of profile.consistencyTrend as Array<{ score?: number }>) {
        if (typeof pt.score === 'number') trend.push(pt.score);
      }
    }

    return NextResponse.json({
      score: maturity.score,
      grade: maturity.grade,
      breakdown: maturity.breakdown,
      peerBenchmark: maturity.peerBenchmark,
      totalDecisions: maturity.totalDecisions,
      accuracyImprovement: accuracy,
      quarterlyImpact: impact,
      trend,
      isPersonal: false,
    }, {
      headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=60' },
    });
  } catch (error) {
    log.error('Decision IQ API failed:', error);
    return NextResponse.json({ error: 'Failed to compute Decision IQ' }, { status: 500 });
  }
}
