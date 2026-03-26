import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import { loadDecisionStyleProfile } from '@/lib/copilot/context';
import {
  loadCalibrationProfile,
  type TwinWeightCalibration,
} from '@/lib/learning/feedback-loop';

const log = createLogger('DecisionDNA');

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch orgId for calibration lookups
    let orgId: string | null = null;
    try {
      const member = await prisma.teamMember.findFirst({
        where: { userId },
        select: { orgId: true },
      });
      orgId = member?.orgId ?? null;
    } catch {
      // teamMember table may not exist
    }

    // Execute all queries in parallel
    const [
      decisionStyle,
      twinCalibration,
      copilotOutcomes,
      copilotSessions,
      biasTimelineRaw,
    ] = await Promise.all([
      // 1. Deep decision style profile
      loadDecisionStyleProfile(userId),

      // 2. Agent effectiveness from calibration
      loadCalibrationProfile<TwinWeightCalibration>('twin_weight', orgId, userId),

      // 3. Copilot outcomes for history
      prisma.copilotOutcome.findMany({
        where: { userId },
        orderBy: { reportedAt: 'desc' },
        take: 50,
        select: {
          outcome: true,
          impactScore: true,
          reportedAt: true,
          helpfulAgents: true,
          lessonsLearned: true,
          session: {
            select: { title: true, createdAt: true, resolvedAt: true },
          },
        },
      }).catch(() => [] as Array<{
        outcome: string;
        impactScore: number | null;
        reportedAt: Date;
        helpfulAgents: string[];
        lessonsLearned: string | null;
        session: { title: string; createdAt: Date; resolvedAt: Date | null };
      }>),

      // 4. All copilot sessions for velocity tracking
      prisma.copilotSession.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          createdAt: true,
          resolvedAt: true,
          status: true,
          outcome: {
            select: { outcome: true },
          },
        },
      }).catch(() => [] as Array<{
        createdAt: Date;
        resolvedAt: Date | null;
        status: string;
        outcome: { outcome: string } | null;
      }>),

      // 5. Bias timeline (monthly bucketed)
      prisma.$queryRaw<Array<{ biasType: string; month: string; count: bigint }>>`
        SELECT bi."biasType",
               TO_CHAR(a."createdAt", 'YYYY-MM') as month,
               COUNT(*)::bigint as count
        FROM "BiasInstance" bi
        JOIN "Analysis" a ON a.id = bi."analysisId"
        JOIN "Document" d ON d.id = a."documentId"
        WHERE d."userId" = ${userId}
        GROUP BY bi."biasType", TO_CHAR(a."createdAt", 'YYYY-MM')
        ORDER BY month ASC
      `.catch(() => [] as Array<{ biasType: string; month: string; count: bigint }>),
    ]);

    // Build outcome history
    const outcomeHistory = copilotOutcomes.map(o => ({
      outcome: o.outcome,
      impactScore: o.impactScore,
      reportedAt: o.reportedAt.toISOString(),
      helpfulAgents: o.helpfulAgents,
      lessonsLearned: o.lessonsLearned,
      sessionTitle: o.session.title,
    }));

    // Build decision velocity data
    const decisionVelocity = copilotSessions
      .filter(s => s.resolvedAt)
      .map(s => ({
        deliberationHours: Math.round(
          (s.resolvedAt!.getTime() - s.createdAt.getTime()) / (1000 * 60 * 60) * 10
        ) / 10,
        outcome: s.outcome?.outcome ?? null,
      }));

    // Build bias timeline
    const biasTimeline = biasTimelineRaw.map(r => ({
      biasType: r.biasType,
      month: r.month,
      count: Number(r.count),
    }));

    // Compute agent effectiveness from helpfulAgents across outcomes
    const agentCounts: Record<string, { helpful: number; total: number; totalImpact: number }> = {};
    for (const o of copilotOutcomes) {
      const isSuccess = o.outcome === 'success' || o.outcome === 'partial_success';
      for (const agent of o.helpfulAgents) {
        if (!agentCounts[agent]) agentCounts[agent] = { helpful: 0, total: 0, totalImpact: 0 };
        agentCounts[agent].total++;
        if (isSuccess) agentCounts[agent].helpful++;
        if (o.impactScore) agentCounts[agent].totalImpact += o.impactScore;
      }
    }

    // Merge with calibration data if available
    const agentEffectiveness: Record<string, { accuracyRate: number; avgImpact: number; sampleSize: number; helpfulCount: number }> = {};
    if (twinCalibration?.personas) {
      for (const [agent, data] of Object.entries(twinCalibration.personas)) {
        agentEffectiveness[agent] = {
          accuracyRate: data.accuracyRate,
          avgImpact: data.avgImpact,
          sampleSize: data.sampleSize,
          helpfulCount: agentCounts[agent]?.helpful ?? 0,
        };
      }
    }
    // Add agents from outcome data that aren't in calibration
    for (const [agent, data] of Object.entries(agentCounts)) {
      if (!agentEffectiveness[agent]) {
        agentEffectiveness[agent] = {
          accuracyRate: data.total > 0 ? data.helpful / data.total : 0,
          avgImpact: data.total > 0 ? data.totalImpact / data.total : 0,
          sampleSize: data.total,
          helpfulCount: data.helpful,
        };
      }
    }

    // Compute totals
    const totalDecisions = copilotSessions.length;
    const totalOutcomes = copilotOutcomes.length;
    const successCount = copilotOutcomes.filter(
      o => o.outcome === 'success' || o.outcome === 'partial_success'
    ).length;
    const successRate = totalOutcomes > 0 ? successCount / totalOutcomes : 0;
    const impactScores = copilotOutcomes
      .filter(o => o.impactScore != null)
      .map(o => o.impactScore!);
    const avgImpact = impactScores.length > 0
      ? impactScores.reduce((a, b) => a + b, 0) / impactScores.length
      : 0;

    return NextResponse.json(
      {
        decisionStyle: decisionStyle.sampleSize > 0 ? decisionStyle : null,
        agentEffectiveness: Object.keys(agentEffectiveness).length > 0 ? agentEffectiveness : null,
        outcomeHistory,
        decisionVelocity,
        biasTimeline,
        totals: {
          totalDecisions,
          totalOutcomes,
          successRate: Math.round(successRate * 100) / 100,
          avgImpact: Math.round(avgImpact * 10) / 10,
        },
      },
      {
        headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=60' },
      }
    );
  } catch (error) {
    log.error('Error fetching decision DNA:', error);
    return NextResponse.json({ error: 'Failed to fetch decision DNA' }, { status: 500 });
  }
}
