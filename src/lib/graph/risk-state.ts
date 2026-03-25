/**
 * Org Risk State — computes the organization's overall decision-making
 * risk level based on graph topology and recent patterns.
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('RiskState');

export interface OrgRiskState {
  overallRisk: 'low' | 'moderate' | 'high' | 'critical';
  riskScore: number;
  factors: Array<{
    factor: string;
    contribution: number;
    description: string;
  }>;
  trend: 'improving' | 'stable' | 'worsening';
}

export async function computeOrgRiskState(orgId: string): Promise<OrgRiskState> {
  const factors: OrgRiskState['factors'] = [];
  let totalScore = 0;

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Factor 1: Recent failure rate
    const [recentOutcomes, recentFailures] = await Promise.all([
      prisma.decisionOutcome.count({
        where: { orgId, reportedAt: { gte: thirtyDaysAgo } },
      }),
      prisma.decisionOutcome.count({
        where: { orgId, outcome: 'failure', reportedAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    if (recentOutcomes > 0) {
      const failureRate = recentFailures / recentOutcomes;
      const contribution = Math.round(failureRate * 30);
      totalScore += contribution;
      if (failureRate > 0.2) {
        factors.push({
          factor: 'Failure Rate',
          contribution,
          description: `${Math.round(failureRate * 100)}% of recent decisions resulted in failure`,
        });
      }
    }

    // Factor 2: Toxic combination density
    const toxicCount = await prisma.toxicCombination.count({
      where: { orgId, status: 'active', createdAt: { gte: thirtyDaysAgo } },
    });

    if (toxicCount > 0) {
      const contribution = Math.min(25, toxicCount * 5);
      totalScore += contribution;
      factors.push({
        factor: 'Active Toxic Combinations',
        contribution,
        description: `${toxicCount} unresolved toxic bias combination(s)`,
      });
    }

    // Factor 3: Unacknowledged nudges (ignored warnings)
    const ignoredNudges = await prisma.nudge.count({
      where: {
        orgId,
        severity: { in: ['warning', 'critical'] },
        acknowledgedAt: null,
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    if (ignoredNudges > 3) {
      const contribution = Math.min(20, ignoredNudges * 2);
      totalScore += contribution;
      factors.push({
        factor: 'Ignored Warnings',
        contribution,
        description: `${ignoredNudges} warning/critical nudges not acknowledged`,
      });
    }

    // Factor 4: Edge density decline (fragmentation)
    const [recentEdges, priorEdges] = await Promise.all([
      prisma.decisionEdge.count({
        where: { orgId, createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.decisionEdge.count({
        where: { orgId, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      }),
    ]);

    if (priorEdges > 5 && recentEdges < priorEdges * 0.5) {
      const contribution = 15;
      totalScore += contribution;
      factors.push({
        factor: 'Knowledge Fragmentation',
        contribution,
        description: `Edge creation dropped ${Math.round((1 - recentEdges / priorEdges) * 100)}% vs prior period`,
      });
    }

    // Compute trend by comparing to prior 30-day window
    const [priorFailures, priorOutcomes] = await Promise.all([
      prisma.decisionOutcome.count({
        where: { orgId, outcome: 'failure', reportedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      }),
      prisma.decisionOutcome.count({
        where: { orgId, reportedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      }),
    ]);

    const currentFailRate = recentOutcomes > 0 ? recentFailures / recentOutcomes : 0;
    const priorFailRate = priorOutcomes > 0 ? priorFailures / priorOutcomes : 0;

    let trend: OrgRiskState['trend'] = 'stable';
    if (currentFailRate < priorFailRate - 0.1) trend = 'improving';
    else if (currentFailRate > priorFailRate + 0.1) trend = 'worsening';

    totalScore = Math.min(100, totalScore);

    let overallRisk: OrgRiskState['overallRisk'] = 'low';
    if (totalScore >= 70) overallRisk = 'critical';
    else if (totalScore >= 45) overallRisk = 'high';
    else if (totalScore >= 20) overallRisk = 'moderate';

    return { overallRisk, riskScore: totalScore, factors, trend };
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') {
      return { overallRisk: 'low', riskScore: 0, factors: [], trend: 'stable' };
    }
    log.error('Failed to compute org risk state:', error);
    return { overallRisk: 'low', riskScore: 0, factors: [], trend: 'stable' };
  }
}
