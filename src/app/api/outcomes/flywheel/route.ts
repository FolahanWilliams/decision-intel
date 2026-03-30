/**
 * Outcome Attribution Flywheel API
 *
 * GET /api/outcomes/flywheel
 *
 * Aggregates outcome data into a flywheel view: success/failure split,
 * bias-outcome correlations, accuracy trends, and quarterly impact.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import {
  getOrgBiasHistory,
  getAccuracyImprovement,
  getQuarterlyImpact,
} from '@/lib/learning/outcome-scoring';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('FlywheelAPI');

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      // Schema drift
    }

    // Fetch outcomes with analysis details, split by success/failure
    const outcomes = await prisma.decisionOutcome.findMany({
      where: orgId ? { orgId } : { userId: user.id },
      orderBy: { reportedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        analysisId: true,
        outcome: true,
        impactScore: true,
        confirmedBiases: true,
        reportedAt: true,
        analysis: {
          select: {
            id: true,
            overallScore: true,
            document: {
              select: { filename: true },
            },
          },
        },
      },
    });

    // Split into success/failure
    const successDecisions = outcomes
      .filter(o => o.outcome === 'success' || o.outcome === 'partial_success')
      .slice(0, 10)
      .map(o => ({
        id: o.analysisId,
        filename: o.analysis.document.filename,
        score: o.analysis.overallScore,
        outcome: o.outcome,
        biases: o.confirmedBiases,
        impactScore: o.impactScore,
        reportedAt: o.reportedAt,
      }));

    const failureDecisions = outcomes
      .filter(o => o.outcome === 'failure')
      .slice(0, 10)
      .map(o => ({
        id: o.analysisId,
        filename: o.analysis.document.filename,
        score: o.analysis.overallScore,
        outcome: o.outcome,
        biases: o.confirmedBiases,
        impactScore: o.impactScore,
        reportedAt: o.reportedAt,
      }));

    // Bias-outcome correlations from org history
    let biasCorrelations: Array<{
      biasType: string;
      successRate: number;
      failureRate: number;
      totalSeen: number;
      impactDelta: number;
    }> = [];

    if (orgId) {
      const history = await getOrgBiasHistory(orgId);
      // Also count success occurrences from outcomes
      const successBiases: Record<string, number> = {};
      const failureBiases: Record<string, number> = {};
      for (const o of outcomes) {
        for (const bias of o.confirmedBiases) {
          if (o.outcome === 'success' || o.outcome === 'partial_success') {
            successBiases[bias] = (successBiases[bias] || 0) + 1;
          } else if (o.outcome === 'failure') {
            failureBiases[bias] = (failureBiases[bias] || 0) + 1;
          }
        }
      }

      biasCorrelations = history.biasStats
        .filter(s => s.totalRated >= 2)
        .map(s => {
          const successes = successBiases[s.biasType] || 0;
          const failures = failureBiases[s.biasType] || 0;
          const total = successes + failures;
          return {
            biasType: s.biasType,
            successRate: total > 0 ? Number((successes / total).toFixed(3)) : 0,
            failureRate: total > 0 ? Number((failures / total).toFixed(3)) : 0,
            totalSeen: s.totalRated,
            impactDelta: s.avgFailureImpact,
          };
        })
        .sort((a, b) => b.impactDelta - a.impactDelta);
    }

    // Accuracy trend
    const accuracyTrend = orgId
      ? await getAccuracyImprovement(orgId)
      : {
          earlyAccuracy: 0,
          recentAccuracy: 0,
          improvementPct: 0,
          earlySampleSize: 0,
          recentSampleSize: 0,
          message: 'Join an organization to see accuracy trends.',
        };

    // Quarterly impact
    const quarterlyImpact = await getQuarterlyImpact(orgId, user.id);

    // Flywheel health: what % of decisions have closed the outcome loop
    let totalDecisions = 0;
    const outcomesLogged = outcomes.length;
    try {
      totalDecisions = await prisma.analysis.count({
        where: orgId ? { document: { orgId } } : { document: { userId: user.id } },
      });
    } catch {
      totalDecisions = outcomesLogged;
    }

    const loopClosureRate =
      totalDecisions > 0 ? Number(((outcomesLogged / totalDecisions) * 100).toFixed(1)) : 0;

    return NextResponse.json({
      successDecisions,
      failureDecisions,
      biasCorrelations,
      accuracyTrend,
      quarterlyImpact,
      flywheelHealth: {
        outcomesLogged,
        totalDecisions,
        loopClosureRate,
      },
    });
  } catch (error) {
    log.error('Flywheel API failed:', error);
    return NextResponse.json({ error: 'Failed to load flywheel data' }, { status: 500 });
  }
}
