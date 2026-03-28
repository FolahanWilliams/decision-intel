/**
 * Decision Accuracy Dashboard API
 *
 * GET /api/outcomes/dashboard?timeRange=30d&orgId=...
 *
 * Returns aggregated decision performance metrics for the Decision Accuracy
 * Dashboard — the moat strategy's "mandatory outcome tracking" feature.
 *
 * Response shape matches the DashboardData interface in DecisionPerformance.tsx:
 *   kpis: { accuracyRate, avgImpactScore, decisionsTracked, biasDetectionAccuracy }
 *   calibration: CalibrationBucket[]
 *   biasCosts: BiasCostEntry[]
 *   personaLeaderboard: PersonaLeaderboardEntry[]
 *   pendingOutcomes: number
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

    // Resolve org context — accept explicit orgId query param (consistent with
    // other endpoints like /api/meetings/speakers?orgId=...), falling back to
    // the user's first membership.
    const requestedOrgId = req.nextUrl.searchParams.get('orgId');
    let orgId: string | null = requestedOrgId;
    if (!orgId) {
      try {
        const membership = await prisma.teamMember.findFirst({
          where: { userId: user.id },
          select: { orgId: true },
        });
        orgId = membership?.orgId ?? null;
      } catch {
        // Schema drift — TeamMember may not exist yet
      }
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

      // Compute bias detection accuracy: confirmed / (confirmed + false positives)
      let totalConfirmed = 0;
      let totalFalsePositives = 0;
      for (const o of outcomes) {
        totalConfirmed += o.confirmedBiases.length;
        totalFalsePositives += (o.falsPositiveBiases ?? []).length;
      }
      const biasDetectionAccuracy =
        totalConfirmed + totalFalsePositives > 0
          ? Math.round((totalConfirmed / (totalConfirmed + totalFalsePositives)) * 100)
          : 0;

      // ---------------------------------------------------------------
      // 2. Confidence vs Reality — calibration buckets
      // ---------------------------------------------------------------
      const analysisIds = outcomes.map(o => o.analysisId);

      let confidenceVsReality: Array<{
        confidence: number;
        outcome: string;
      }> = [];

      if (analysisIds.length > 0) {
        try {
          const priors = await prisma.decisionPrior.findMany({
            where: { analysisId: { in: analysisIds } },
            select: {
              analysisId: true,
              confidence: true,
            },
          });

          const priorMap = new Map(priors.map(p => [p.analysisId, p]));

          confidenceVsReality = outcomes
            .filter(o => priorMap.has(o.analysisId))
            .map(o => {
              const prior = priorMap.get(o.analysisId)!;
              return {
                confidence: prior.confidence, // 0-100 scale
                outcome: o.outcome,
              };
            });
        } catch (priorErr) {
          const code = (priorErr as { code?: string }).code;
          if (code !== 'P2021' && code !== 'P2022') throw priorErr;
          log.warn('Schema drift: DecisionPrior table not yet migrated');
        }
      }

      // Build calibration buckets for the Confidence vs Reality chart.
      // Confidence is 0-100, so we bucket into 0-10%, 10-20%, ..., 90-100%.
      const calibration: Array<{
        bucket: string;
        midpoint: number;
        successRate: number;
        count: number;
      }> = [];

      if (confidenceVsReality.length >= 3) {
        const bucketMap: Record<number, { successes: number; count: number }> = {};
        for (const entry of confidenceVsReality) {
          // confidence is 0-100 → divide by 10 to get bucket start (0, 10, 20, ...)
          const bucketStart = Math.min(Math.floor(entry.confidence / 10) * 10, 90);
          if (!bucketMap[bucketStart]) bucketMap[bucketStart] = { successes: 0, count: 0 };
          bucketMap[bucketStart].count++;
          if (entry.outcome === 'success' || entry.outcome === 'partial_success') {
            bucketMap[bucketStart].successes++;
          }
        }

        for (const [startStr, stats] of Object.entries(bucketMap).sort(
          ([a], [b]) => Number(a) - Number(b)
        )) {
          const start = Number(startStr);
          calibration.push({
            bucket: `${start}-${start + 10}%`,
            midpoint: start + 5,
            successRate: stats.count > 0 ? Math.round((stats.successes / stats.count) * 100) : 0,
            count: stats.count,
          });
        }
      }

      // ---------------------------------------------------------------
      // 3. Bias cost estimates
      // ---------------------------------------------------------------
      const overallSuccessRate = totalDecisions > 0 ? (successes / totalDecisions) * 100 : 0;

      const biasStats: Record<string, { successes: number; failures: number; total: number }> = {};

      for (const o of outcomes) {
        for (const bias of o.confirmedBiases) {
          if (!biasStats[bias]) biasStats[bias] = { successes: 0, failures: 0, total: 0 };
          biasStats[bias].total++;
          if (o.outcome === 'success' || o.outcome === 'partial_success') {
            biasStats[bias].successes++;
          } else if (o.outcome === 'failure') {
            biasStats[bias].failures++;
          }
        }
      }

      const biasCosts = Object.entries(biasStats)
        .map(([bias, stats]) => {
          const biasSuccessRate = stats.total > 0 ? (stats.successes / stats.total) * 100 : 0;
          return {
            bias,
            successRateDelta: Math.round(biasSuccessRate - overallSuccessRate),
            failedCount: stats.failures,
            totalCount: stats.total,
          };
        })
        .sort((a, b) => a.successRateDelta - b.successRateDelta);

      // ---------------------------------------------------------------
      // 4. Decision Twin accuracy rankings → persona leaderboard
      // ---------------------------------------------------------------
      const twinMap: Record<string, { predictions: number; correct: number }> = {};

      for (const o of outcomes) {
        if (!o.mostAccurateTwin) continue;
        const twin = o.mostAccurateTwin;
        if (!twinMap[twin]) twinMap[twin] = { predictions: 0, correct: 0 };
        twinMap[twin].predictions++;
        if (o.outcome === 'success' || o.outcome === 'partial_success') {
          twinMap[twin].correct++;
        }
      }

      const personaLeaderboard = Object.entries(twinMap)
        .map(([name, stats]) => ({
          name,
          accuracy: Math.round((stats.correct / stats.predictions) * 100),
          timesSelected: stats.predictions,
        }))
        .sort((a, b) => b.accuracy - a.accuracy);

      // ---------------------------------------------------------------
      // 5. Twin Effectiveness (dissent accuracy + narrative)
      // ---------------------------------------------------------------
      let twinEffectiveness: Array<{
        twinName: string;
        dissentCount: number;
        effectiveDissentCount: number;
        effectivenessRate: number;
        avgBeliefDelta: number;
        sampleSize: number;
        narrative: string;
      }> = [];

      try {
        const { computeTwinEffectiveness } = await import('@/lib/learning/twin-effectiveness');
        const rawTwins = await computeTwinEffectiveness(orgId, orgId ? undefined : user.id);
        twinEffectiveness = rawTwins.map(t => {
          const leaderboardEntry = Object.entries(twinMap).find(([name]) => name === t.twinName);
          const accuracy = leaderboardEntry
            ? Math.round((leaderboardEntry[1].correct / leaderboardEntry[1].predictions) * 100)
            : null;
          const accuracyStr =
            accuracy !== null ? ` Selected as most accurate ${accuracy}% of the time.` : '';

          let narrative: string;
          if (t.sampleSize < 3) {
            narrative = `${t.twinName} has dissented ${t.dissentCount} time(s). More outcomes needed for reliable insights.`;
          } else if (t.effectivenessRate >= 0.7) {
            narrative = `${t.twinName} is your most reliable dissenter. When they objected, the decision later proved risky ${Math.round(t.effectivenessRate * 100)}% of the time.${accuracyStr}`;
          } else if (t.effectivenessRate >= 0.4) {
            narrative = `${t.twinName}: ${t.effectiveDissentCount} of ${t.dissentCount} dissents proved correct (${Math.round(t.effectivenessRate * 100)}%).${accuracyStr}`;
          } else {
            narrative = `${t.twinName} dissented ${t.dissentCount} times, but only ${t.effectiveDissentCount} proved correct. Their concerns may not align with real risk patterns.`;
          }

          return { ...t, narrative };
        });
      } catch (twinErr) {
        log.debug('Twin effectiveness computation skipped:', twinErr);
      }

      // ---------------------------------------------------------------
      // 6. Pending outcome reminders
      // ---------------------------------------------------------------
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Find analyses older than 30 days that belong to this user/org
      // but have no DecisionOutcome record yet.
      // Use orgId-aware filtering when org context is available.
      const pendingReminders = orgId
        ? await prisma.$queryRaw<Array<{ analysisId: string }>>`
            SELECT a.id AS "analysisId"
            FROM "Analysis" a
            JOIN "Document" d ON d.id = a."documentId"
            LEFT JOIN "DecisionOutcome" do2 ON do2."analysisId" = a.id
            WHERE d."orgId" = ${orgId}
              AND a."createdAt" < ${thirtyDaysAgo}
              AND do2.id IS NULL
            ORDER BY a."createdAt" ASC
            LIMIT 20
          `
        : await prisma.$queryRaw<Array<{ analysisId: string }>>`
            SELECT a.id AS "analysisId"
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
          kpis: {
            accuracyRate: successRate,
            avgImpactScore,
            decisionsTracked: totalDecisions,
            biasDetectionAccuracy,
          },
          calibration,
          biasCosts,
          personaLeaderboard,
          twinEffectiveness,
          pendingOutcomes: pendingReminders.length,
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
          kpis: {
            accuracyRate: 0,
            avgImpactScore: 0,
            decisionsTracked: 0,
            biasDetectionAccuracy: 0,
          },
          calibration: [],
          biasCosts: [],
          personaLeaderboard: [],
          pendingOutcomes: 0,
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
