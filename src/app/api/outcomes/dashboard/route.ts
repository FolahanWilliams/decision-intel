/**
 * Decision Accuracy Dashboard API
 *
 * GET /api/outcomes/dashboard?timeRange=30d
 *
 * Returns aggregated decision performance metrics for the Decision Accuracy
 * Dashboard — the moat strategy's "mandatory outcome tracking" feature.
 *
 * Sections:
 * 1. Overall accuracy stats (success rate, total tracked, avg impact)
 * 2. Confidence vs Reality (DecisionPrior confidence vs actual outcomes)
 * 3. Bias cost estimates (which biases correlated with failures)
 * 4. Decision Twin accuracy rankings
 * 5. Calibration trend over time (monthly buckets)
 * 6. Pending outcome reminders (analyses >30 days without outcomes)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('OutcomeDashboard');

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const timeRange = req.nextUrl.searchParams.get('timeRange') || '30d';

    // Compute date filter
    const endDate = new Date();
    const startDate = new Date();
    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case 'all':
        startDate.setFullYear(2020);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Resolve org context
    let orgId: string | null = null;
    try {
      const membership = await prisma.teamMember.findFirst({
        where: { userId: user.id },
        select: { orgId: true },
      });
      orgId = membership?.orgId ?? null;
    } catch {
      // Schema drift — TeamMember may not exist yet
    }

    const ownerFilter = orgId ? { orgId } : { userId: user.id };

    try {
      // ---------------------------------------------------------------
      // 1. Overall accuracy stats
      // ---------------------------------------------------------------
      const outcomes = await prisma.decisionOutcome.findMany({
        where: {
          ...ownerFilter,
          reportedAt: { gte: startDate, lte: endDate },
        },
        select: {
          analysisId: true,
          outcome: true,
          impactScore: true,
          confirmedBiases: true,
          falsPositiveBiases: true,
          mostAccurateTwin: true,
          reportedAt: true,
        },
      });

      const totalDecisions = outcomes.length;
      const successes = outcomes.filter(
        o => o.outcome === 'success' || o.outcome === 'partial_success'
      ).length;
      const successRate = totalDecisions > 0 ? Math.round((successes / totalDecisions) * 100) : 0;

      const withImpact = outcomes.filter(o => o.impactScore !== null);
      const avgImpactScore =
        withImpact.length > 0
          ? Math.round(
              withImpact.reduce((sum, o) => sum + (o.impactScore || 0), 0) / withImpact.length
            )
          : 0;

      const overallStats = {
        totalDecisions,
        successRate,
        avgImpactScore,
        byOutcome: {
          success: outcomes.filter(o => o.outcome === 'success').length,
          partialSuccess: outcomes.filter(o => o.outcome === 'partial_success').length,
          failure: outcomes.filter(o => o.outcome === 'failure').length,
          tooEarly: outcomes.filter(o => o.outcome === 'too_early').length,
        },
      };

      // ---------------------------------------------------------------
      // 2. Confidence vs Reality
      // ---------------------------------------------------------------
      const analysisIds = outcomes.map(o => o.analysisId);

      let confidenceVsReality: Array<{
        analysisId: string;
        confidence: number;
        outcome: string;
        impactScore: number | null;
        beliefDelta: number | null;
      }> = [];

      if (analysisIds.length > 0) {
        try {
          const priors = await prisma.decisionPrior.findMany({
            where: { analysisId: { in: analysisIds } },
            select: {
              analysisId: true,
              confidence: true,
              beliefDelta: true,
            },
          });

          const priorMap = new Map(priors.map(p => [p.analysisId, p]));

          confidenceVsReality = outcomes
            .filter(o => priorMap.has(o.analysisId))
            .map(o => {
              const prior = priorMap.get(o.analysisId)!;
              return {
                analysisId: o.analysisId,
                confidence: prior.confidence,
                outcome: o.outcome,
                impactScore: o.impactScore,
                beliefDelta: prior.beliefDelta,
              };
            });
        } catch (priorErr) {
          const code = (priorErr as { code?: string }).code;
          if (code !== 'P2021' && code !== 'P2022') throw priorErr;
          log.warn('Schema drift: DecisionPrior table not yet migrated');
        }
      }

      // Compute calibration score: how well confidence predicts success
      let calibrationScore: number | null = null;
      if (confidenceVsReality.length >= 3) {
        // Bucket by confidence range and compare predicted vs actual success rate
        const buckets: Record<string, { predicted: number; actual: number; count: number }> = {};
        for (const entry of confidenceVsReality) {
          const bucketKey = `${Math.floor(entry.confidence * 10) * 10}`;
          if (!buckets[bucketKey]) buckets[bucketKey] = { predicted: 0, actual: 0, count: 0 };
          buckets[bucketKey].predicted += entry.confidence;
          buckets[bucketKey].actual +=
            entry.outcome === 'success' || entry.outcome === 'partial_success' ? 1 : 0;
          buckets[bucketKey].count++;
        }

        let totalError = 0;
        let bucketCount = 0;
        for (const bucket of Object.values(buckets)) {
          if (bucket.count < 1) continue;
          const avgPredicted = bucket.predicted / bucket.count;
          const avgActual = bucket.actual / bucket.count;
          totalError += Math.abs(avgPredicted - avgActual);
          bucketCount++;
        }

        calibrationScore =
          bucketCount > 0 ? Math.round((1 - totalError / bucketCount) * 100) : null;
      }

      // ---------------------------------------------------------------
      // 3. Bias cost estimates
      // ---------------------------------------------------------------
      const biasCosts: Record<
        string,
        { occurrences: number; failureCorrelation: number; avgImpactWhenPresent: number }
      > = {};

      const failedOutcomes = outcomes.filter(o => o.outcome === 'failure');
      const successOutcomes = outcomes.filter(
        o => o.outcome === 'success' || o.outcome === 'partial_success'
      );

      // Count confirmed biases across all outcomes
      for (const o of outcomes) {
        for (const bias of o.confirmedBiases) {
          if (!biasCosts[bias]) {
            biasCosts[bias] = { occurrences: 0, failureCorrelation: 0, avgImpactWhenPresent: 0 };
          }
          biasCosts[bias].occurrences++;
          if (o.impactScore !== null) {
            biasCosts[bias].avgImpactWhenPresent += o.impactScore;
          }
        }
      }

      // Calculate failure correlation for each bias
      for (const bias of Object.keys(biasCosts)) {
        const inFailures = failedOutcomes.filter(o => o.confirmedBiases.includes(bias)).length;
        const inSuccesses = successOutcomes.filter(o => o.confirmedBiases.includes(bias)).length;
        const total = inFailures + inSuccesses;
        biasCosts[bias].failureCorrelation =
          total > 0 ? Math.round((inFailures / total) * 100) : 0;
        biasCosts[bias].avgImpactWhenPresent =
          biasCosts[bias].occurrences > 0
            ? Math.round(biasCosts[bias].avgImpactWhenPresent / biasCosts[bias].occurrences)
            : 0;
      }

      const biasCostRanking = Object.entries(biasCosts)
        .map(([biasType, stats]) => ({ biasType, ...stats }))
        .sort((a, b) => b.failureCorrelation - a.failureCorrelation);

      // ---------------------------------------------------------------
      // 4. Decision Twin accuracy rankings
      // ---------------------------------------------------------------
      const twinMap: Record<
        string,
        { predictions: number; correct: number; totalImpact: number }
      > = {};

      for (const o of outcomes) {
        if (!o.mostAccurateTwin) continue;
        const twin = o.mostAccurateTwin;
        if (!twinMap[twin]) twinMap[twin] = { predictions: 0, correct: 0, totalImpact: 0 };
        twinMap[twin].predictions++;
        if (o.outcome === 'success' || o.outcome === 'partial_success') {
          twinMap[twin].correct++;
        }
        if (o.impactScore !== null) {
          twinMap[twin].totalImpact += o.impactScore;
        }
      }

      const twinRankings = Object.entries(twinMap)
        .map(([twinName, stats]) => ({
          twinName,
          predictions: stats.predictions,
          accuracyRate: Math.round((stats.correct / stats.predictions) * 100),
          avgImpact:
            stats.predictions > 0 ? Math.round(stats.totalImpact / stats.predictions) : 0,
        }))
        .sort((a, b) => b.accuracyRate - a.accuracyRate);

      // ---------------------------------------------------------------
      // 5. Calibration trend over time (monthly buckets)
      // ---------------------------------------------------------------
      const monthlyBuckets: Record<
        string,
        { success: number; total: number; totalImpact: number; impactCount: number }
      > = {};

      for (const o of outcomes) {
        const month = o.reportedAt.toISOString().slice(0, 7);
        if (!monthlyBuckets[month]) {
          monthlyBuckets[month] = { success: 0, total: 0, totalImpact: 0, impactCount: 0 };
        }
        monthlyBuckets[month].total++;
        if (o.outcome === 'success' || o.outcome === 'partial_success') {
          monthlyBuckets[month].success++;
        }
        if (o.impactScore !== null) {
          monthlyBuckets[month].totalImpact += o.impactScore;
          monthlyBuckets[month].impactCount++;
        }
      }

      const calibrationTrend = Object.entries(monthlyBuckets)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, stats]) => ({
          month,
          successRate: stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0,
          avgImpact:
            stats.impactCount > 0 ? Math.round(stats.totalImpact / stats.impactCount) : 0,
          totalDecisions: stats.total,
        }));

      // ---------------------------------------------------------------
      // 6. Pending outcome reminders
      // ---------------------------------------------------------------
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Find analyses older than 30 days that belong to this user/org
      // but have no DecisionOutcome record yet.
      const pendingReminders = await prisma.$queryRaw<
        Array<{
          analysisId: string;
          documentId: string;
          filename: string;
          overallScore: number | null;
          createdAt: Date;
          daysSinceAnalysis: number;
        }>
      >`
        SELECT
          a.id AS "analysisId",
          d.id AS "documentId",
          d.filename,
          a."overallScore",
          a."createdAt",
          EXTRACT(DAY FROM NOW() - a."createdAt")::int AS "daysSinceAnalysis"
        FROM "Analysis" a
        JOIN "Document" d ON d.id = a."documentId"
        LEFT JOIN "DecisionOutcome" do2 ON do2."analysisId" = a.id
        WHERE d."userId" = ${user.id}
          AND a."createdAt" < ${thirtyDaysAgo}
          AND do2.id IS NULL
        ORDER BY a."createdAt" ASC
        LIMIT 20
      `;

      return NextResponse.json(
        {
          overallStats,
          confidenceVsReality,
          calibrationScore,
          biasCostRanking,
          twinRankings,
          calibrationTrend,
          pendingReminders,
          timeRange,
        },
        {
          headers: { 'Cache-Control': 'private, max-age=120, stale-while-revalidate=60' },
        }
      );
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === 'P2021' || code === 'P2022') {
        log.warn('Schema drift in outcomes dashboard: required tables not yet migrated');
        return NextResponse.json({
          overallStats: {
            totalDecisions: 0,
            successRate: 0,
            avgImpactScore: 0,
            byOutcome: { success: 0, partialSuccess: 0, failure: 0, tooEarly: 0 },
          },
          confidenceVsReality: [],
          calibrationScore: null,
          biasCostRanking: [],
          twinRankings: [],
          calibrationTrend: [],
          pendingReminders: [],
          timeRange,
          _message: 'Outcome tracking not yet available. Database migration pending.',
        });
      }
      throw error;
    }
  } catch (error) {
    log.error('Dashboard API failed:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
