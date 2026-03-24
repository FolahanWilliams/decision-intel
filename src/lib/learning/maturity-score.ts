/**
 * Decision Maturity Score — Org-Level "Credit Score" for Decision Quality
 *
 * Computes a 0-100 score based on how well an organization uses the platform
 * to improve decision-making. Benchmarked against anonymized peers via the
 * Bias Genome. Creates switching costs and drives engagement.
 *
 * Score Components (weighted):
 * - Outcome tracking rate (20%) — % of decisions with logged outcomes
 * - Bias detection accuracy (20%) — confirmation rate from outcomes
 * - Decision quality trend (15%) — improving or declining over 90 days
 * - Nudge responsiveness (15%) — % of nudges acknowledged as helpful
 * - Dissent health (15%) — % of decisions with >0 dissenters
 * - Prior submission rate (15%) — % of analyses with DecisionPrior
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('MaturityScore');

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MaturityBreakdown {
  outcomeTrackingRate: number;
  biasAccuracy: number;
  qualityTrend: number;
  nudgeResponsiveness: number;
  dissentHealth: number;
  priorSubmissionRate: number;
}

export interface MaturityScoreResult {
  orgId: string;
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  breakdown: MaturityBreakdown;
  peerBenchmark: number | null; // anonymized industry average
  totalDecisions: number;
  computedAt: string;
}

// ─── Core Function ──────────────────────────────────────────────────────────

export async function computeMaturityScore(orgId: string): Promise<MaturityScoreResult> {
  try {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    // Parallel queries for all metrics
    const [
      totalAnalyses,
      outcomeCount,
      outcomesWithBiasFeedback,
      recentQuality,
      olderQuality,
      nudgeStats,
      dissentStats,
      priorCount,
    ] = await Promise.all([
      // Total analyses for this org
      prisma.analysis.count({
        where: { document: { orgId } },
      }),

      // Analyses with outcomes logged
      prisma.decisionOutcome.count({
        where: { orgId },
      }),

      // Outcomes with bias confirmation feedback
      prisma.decisionOutcome.findMany({
        where: {
          orgId,
          OR: [
            { confirmedBiases: { isEmpty: false } },
            { falsPositiveBiases: { isEmpty: false } },
          ],
        },
        select: { confirmedBiases: true, falsPositiveBiases: true },
      }),

      // Recent decision quality (last 45 days)
      prisma.analysis.aggregate({
        where: {
          document: { orgId },
          createdAt: { gte: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) },
        },
        _avg: { overallScore: true },
        _count: { id: true },
      }),

      // Older decision quality (45-90 days ago)
      prisma.analysis.aggregate({
        where: {
          document: { orgId },
          createdAt: {
            gte: ninetyDaysAgo,
            lt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          },
        },
        _avg: { overallScore: true },
        _count: { id: true },
      }),

      // Nudge stats
      prisma.nudge.groupBy({
        by: ['wasHelpful'],
        where: { orgId },
        _count: { id: true },
      }),

      // Dissent stats from cognitive audits
      prisma.cognitiveAudit.findMany({
        where: { humanDecision: { orgId } },
        select: { dissenterCount: true },
      }),

      // Decision priors submitted
      prisma.decisionPrior.count({
        where: {
          analysis: { document: { orgId } },
        },
      }),
    ]);

    // 1. Outcome tracking rate (20%)
    const outcomeTrackingRate = totalAnalyses > 0
      ? Math.min(100, (outcomeCount / totalAnalyses) * 100)
      : 0;

    // 2. Bias detection accuracy (20%)
    let biasAccuracy = 50; // default if no feedback
    if (outcomesWithBiasFeedback.length > 0) {
      const totalConfirmed = outcomesWithBiasFeedback.reduce(
        (sum, o) => sum + o.confirmedBiases.length, 0
      );
      const totalFP = outcomesWithBiasFeedback.reduce(
        (sum, o) => sum + o.falsPositiveBiases.length, 0
      );
      const total = totalConfirmed + totalFP;
      biasAccuracy = total > 0 ? (totalConfirmed / total) * 100 : 50;
    }

    // 3. Quality trend (15%) — improvement over 90 days
    let qualityTrend = 50; // neutral
    if (
      recentQuality._avg.overallScore != null &&
      olderQuality._avg.overallScore != null &&
      olderQuality._count.id >= 3
    ) {
      const delta = recentQuality._avg.overallScore - olderQuality._avg.overallScore;
      // Map delta (-30 to +30) to score (0 to 100)
      qualityTrend = Math.max(0, Math.min(100, 50 + delta * (50 / 30)));
    }

    // 4. Nudge responsiveness (15%)
    const totalNudges = nudgeStats.reduce((sum, s) => sum + s._count.id, 0);
    const helpfulNudges = nudgeStats.find(s => s.wasHelpful === true)?._count.id ?? 0;
    const nudgeResponsiveness = totalNudges > 0
      ? (helpfulNudges / totalNudges) * 100
      : 50;

    // 5. Dissent health (15%)
    const totalAudits = dissentStats.length;
    const auditsWithDissent = dissentStats.filter(a => a.dissenterCount > 0).length;
    const dissentHealth = totalAudits > 0
      ? (auditsWithDissent / totalAudits) * 100
      : 50;

    // 6. Prior submission rate (15%)
    const priorSubmissionRate = totalAnalyses > 0
      ? Math.min(100, (priorCount / totalAnalyses) * 100)
      : 0;

    // Weighted composite score
    const breakdown: MaturityBreakdown = {
      outcomeTrackingRate: Math.round(outcomeTrackingRate * 10) / 10,
      biasAccuracy: Math.round(biasAccuracy * 10) / 10,
      qualityTrend: Math.round(qualityTrend * 10) / 10,
      nudgeResponsiveness: Math.round(nudgeResponsiveness * 10) / 10,
      dissentHealth: Math.round(dissentHealth * 10) / 10,
      priorSubmissionRate: Math.round(priorSubmissionRate * 10) / 10,
    };

    const score = Math.round(
      breakdown.outcomeTrackingRate * 0.2 +
      breakdown.biasAccuracy * 0.2 +
      breakdown.qualityTrend * 0.15 +
      breakdown.nudgeResponsiveness * 0.15 +
      breakdown.dissentHealth * 0.15 +
      breakdown.priorSubmissionRate * 0.15
    );

    // Grade
    const grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F';

    // Peer benchmark (anonymized average from all consenting orgs)
    let peerBenchmark: number | null = null;
    try {
      const peerOrgs = await prisma.organization.findMany({
        where: { isAnonymized: true, id: { not: orgId } },
        select: { id: true },
      });

      if (peerOrgs.length >= 3) {
        // Compute simplified peer average (outcome tracking rate only for efficiency)
        const peerOutcomes = await prisma.decisionOutcome.groupBy({
          by: ['orgId'],
          where: { orgId: { in: peerOrgs.map(o => o.id) } },
          _count: { id: true },
        });
        const peerAnalyses = await prisma.analysis.groupBy({
          by: ['documentId'],
          where: {
            document: { orgId: { in: peerOrgs.map(o => o.id) } },
          },
          _count: { id: true },
        });

        // Simplified benchmark: average the raw outcome/analysis ratio
        if (peerOutcomes.length > 0 && peerAnalyses.length > 0) {
          peerBenchmark = Math.round(
            (peerOutcomes.reduce((s, p) => s + p._count.id, 0) /
              Math.max(1, peerAnalyses.length)) *
              10
          );
          peerBenchmark = Math.min(100, peerBenchmark);
        }
      }
    } catch {
      // Peer benchmark unavailable
    }

    return {
      orgId,
      score,
      grade,
      breakdown,
      peerBenchmark,
      totalDecisions: totalAnalyses,
      computedAt: new Date().toISOString(),
    };
  } catch (error) {
    log.error('Failed to compute maturity score:', error);
    return {
      orgId,
      score: 0,
      grade: 'F',
      breakdown: {
        outcomeTrackingRate: 0,
        biasAccuracy: 0,
        qualityTrend: 0,
        nudgeResponsiveness: 0,
        dissentHealth: 0,
        priorSubmissionRate: 0,
      },
      peerBenchmark: null,
      totalDecisions: 0,
      computedAt: new Date().toISOString(),
    };
  }
}
