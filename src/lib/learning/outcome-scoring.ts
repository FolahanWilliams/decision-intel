/**
 * Outcome-Weighted Scoring Service
 *
 * Uses historical outcome data to improve future bias detection accuracy.
 * Each function queries real outcome data and computes org-specific
 * adjustments, making the platform smarter with every decision tracked.
 *
 * This is the scoring half of the Outcome Learning Loop.
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { searchSimilarWithOutcomes } from '@/lib/rag/embeddings';
import { DEFAULT_BIAS_SEVERITY_WEIGHTS } from './constants';

const log = createLogger('OutcomeScoring');

// ─── Types ──────────────────────────────────────────────────────────────────

export interface OrgBiasStats {
  biasType: string;
  /** Total times this bias was rated (confirmed + false positive) */
  totalRated: number;
  /** Times confirmed as real */
  confirmed: number;
  /** Times marked as false positive */
  falsePositive: number;
  /** Confirmation rate (0-1) */
  confirmationRate: number;
  /** False positive rate (0-1) */
  falsePositiveRate: number;
  /** Average impact score when this bias was present in a failed outcome */
  avgFailureImpact: number;
}

export interface OrgBiasHistory {
  orgId: string;
  totalOutcomes: number;
  totalRatedBiases: number;
  biasStats: OrgBiasStats[];
  /** Biases most associated with failures, sorted by failure correlation */
  dangerousBiases: string[];
  /** Biases with highest false positive rate */
  overDetectedBiases: string[];
}

export interface CrossDocumentPattern {
  similarDocCount: number;
  documentsWithOutcomes: number;
  poorOutcomeCount: number;
  commonBiases: Array<{ biasType: string; frequency: number }>;
  avgOutcomeScore: number;
  insights: string[];
}

export interface AccuracyImprovement {
  earlyAccuracy: number;
  recentAccuracy: number;
  improvementPct: number;
  earlySampleSize: number;
  recentSampleSize: number;
  message: string;
}

// ─── Core Functions ─────────────────────────────────────────────────────────

/**
 * Query outcomes + biases to compute per-org stats: which biases led to
 * failures, confirmation rates, false positive rates.
 */
export async function getOrgBiasHistory(orgId: string): Promise<OrgBiasHistory> {
  try {
    // Fetch all outcomes with bias feedback for this org
    const outcomes = await prisma.decisionOutcome.findMany({
      where: { orgId },
      select: {
        id: true,
        outcome: true,
        impactScore: true,
        confirmedBiases: true,
        falsPositiveBiases: true,
        analysisId: true,
      },
    });

    if (outcomes.length === 0) {
      return {
        orgId,
        totalOutcomes: 0,
        totalRatedBiases: 0,
        biasStats: [],
        dangerousBiases: [],
        overDetectedBiases: [],
      };
    }

    // Build per-bias-type stats
    const statsMap: Record<
      string,
      {
        confirmed: number;
        falsePositive: number;
        failureImpacts: number[];
      }
    > = {};

    for (const o of outcomes) {
      const isFailure = o.outcome === 'failure';

      for (const bias of o.confirmedBiases) {
        if (!statsMap[bias])
          statsMap[bias] = { confirmed: 0, falsePositive: 0, failureImpacts: [] };
        statsMap[bias].confirmed++;
        if (isFailure && o.impactScore != null) {
          statsMap[bias].failureImpacts.push(o.impactScore);
        }
      }

      for (const bias of o.falsPositiveBiases) {
        if (!statsMap[bias])
          statsMap[bias] = { confirmed: 0, falsePositive: 0, failureImpacts: [] };
        statsMap[bias].falsePositive++;
      }
    }

    const biasStats: OrgBiasStats[] = Object.entries(statsMap).map(([biasType, s]) => {
      const total = s.confirmed + s.falsePositive;
      const avgFailureImpact =
        s.failureImpacts.length > 0
          ? s.failureImpacts.reduce((sum, v) => sum + v, 0) / s.failureImpacts.length
          : 0;

      return {
        biasType,
        totalRated: total,
        confirmed: s.confirmed,
        falsePositive: s.falsePositive,
        confirmationRate: total > 0 ? Number((s.confirmed / total).toFixed(3)) : 0,
        falsePositiveRate: total > 0 ? Number((s.falsePositive / total).toFixed(3)) : 0,
        avgFailureImpact: Number(avgFailureImpact.toFixed(1)),
      };
    });

    // Sort to find most dangerous biases (high confirmation + high failure impact)
    const dangerousBiases = [...biasStats]
      .filter(s => s.totalRated >= 3 && s.confirmationRate >= 0.5)
      .sort(
        (a, b) => b.avgFailureImpact - a.avgFailureImpact || b.confirmationRate - a.confirmationRate
      )
      .map(s => s.biasType);

    // Sort to find most over-detected biases (high false positive rate)
    const overDetectedBiases = [...biasStats]
      .filter(s => s.totalRated >= 3 && s.falsePositiveRate >= 0.5)
      .sort((a, b) => b.falsePositiveRate - a.falsePositiveRate)
      .map(s => s.biasType);

    const totalRatedBiases = biasStats.reduce((sum, s) => sum + s.totalRated, 0);

    return {
      orgId,
      totalOutcomes: outcomes.length,
      totalRatedBiases,
      biasStats,
      dangerousBiases,
      overDetectedBiases,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const code = (error as { code?: string }).code;

    if (code === 'P2021' || code === 'P2022' || msg.includes('does not exist')) {
      log.debug('Schema drift in getOrgBiasHistory — table not available');
      return {
        orgId,
        totalOutcomes: 0,
        totalRatedBiases: 0,
        biasStats: [],
        dangerousBiases: [],
        overDetectedBiases: [],
      };
    }

    log.error('Failed to get org bias history:', error);
    throw error;
  }
}

/**
 * Returns an adjusted penalty for a bias type based on historical outcomes.
 *
 * If "anchoring" has 90% confirmation rate in this org, its penalty should be
 * higher than default. If "groupthink" has 20% confirmation rate, reduce
 * its penalty.
 *
 * Scale factor range: 0.3 (floor for very low confirmation) to 2.0 (ceiling
 * for consistently confirmed biases with high failure impact).
 */
export async function getOutcomeWeightedBiasPenalty(
  biasType: string,
  severity: string,
  orgId: string
): Promise<{
  penalty: number;
  defaultPenalty: number;
  scaleFactor: number;
  confirmationRate: number | null;
  sampleSize: number;
}> {
  const defaultPenalty =
    DEFAULT_BIAS_SEVERITY_WEIGHTS[severity] ?? DEFAULT_BIAS_SEVERITY_WEIGHTS.medium;

  try {
    const history = await getOrgBiasHistory(orgId);
    const stats = history.biasStats.find(s => s.biasType === biasType);

    if (!stats || stats.totalRated < 3) {
      // Insufficient data — return default
      return {
        penalty: defaultPenalty,
        defaultPenalty,
        scaleFactor: 1.0,
        confirmationRate: stats?.confirmationRate ?? null,
        sampleSize: stats?.totalRated ?? 0,
      };
    }

    // Scale factor based on confirmation rate and failure impact:
    // - confirmationRate 0.0 → scaleFactor 0.3 (big reduction)
    // - confirmationRate 0.5 → scaleFactor 1.0 (neutral)
    // - confirmationRate 1.0 → scaleFactor 1.5-2.0 (increase)
    let scaleFactor = 0.3 + stats.confirmationRate * 1.2; // 0.3 to 1.5

    // Bonus for biases that correlate with high-impact failures
    if (stats.avgFailureImpact >= 7) {
      scaleFactor = Math.min(2.0, scaleFactor * 1.3);
    } else if (stats.avgFailureImpact >= 5) {
      scaleFactor = Math.min(2.0, scaleFactor * 1.15);
    }

    const penalty = Math.max(1, Math.round(defaultPenalty * scaleFactor));

    return {
      penalty,
      defaultPenalty,
      scaleFactor: Number(scaleFactor.toFixed(3)),
      confirmationRate: stats.confirmationRate,
      sampleSize: stats.totalRated,
    };
  } catch (error) {
    log.warn(`Failed to compute outcome-weighted penalty for ${biasType}:`, error);
    return {
      penalty: defaultPenalty,
      defaultPenalty,
      scaleFactor: 1.0,
      confirmationRate: null,
      sampleSize: 0,
    };
  }
}

/**
 * Use vector search to find similar past documents that have outcomes,
 * then return patterns like "3 similar past decisions had poor outcomes,
 * common biases were X, Y, Z".
 */
export async function getCrossDocumentPatterns(
  documentContent: string,
  orgId: string,
  userId: string
): Promise<CrossDocumentPattern> {
  const emptyResult: CrossDocumentPattern = {
    similarDocCount: 0,
    documentsWithOutcomes: 0,
    poorOutcomeCount: 0,
    commonBiases: [],
    avgOutcomeScore: 0,
    insights: [],
  };

  try {
    // Use the first 5k chars as query text (same pattern as getContextualInsights)
    const queryText = documentContent.slice(0, 5000);
    const similarDocs = await searchSimilarWithOutcomes(queryText, userId, 10);

    if (similarDocs.length === 0) {
      return emptyResult;
    }

    // Filter to docs with outcomes
    const docsWithOutcomes = similarDocs.filter(d => d.outcome != null);

    if (docsWithOutcomes.length === 0) {
      return {
        ...emptyResult,
        similarDocCount: similarDocs.length,
        insights: [
          `Found ${similarDocs.length} similar past document(s), but none have reported outcomes yet.`,
        ],
      };
    }

    // Count poor outcomes
    const poorOutcomes = docsWithOutcomes.filter(d => d.outcome?.result === 'failure');

    // Aggregate bias frequencies from outcomes
    const biasFreq: Record<string, number> = {};
    for (const doc of docsWithOutcomes) {
      if (!doc.outcome) continue;
      // Count confirmed biases from outcome data
      for (const bias of doc.outcome.confirmedBiases) {
        biasFreq[bias] = (biasFreq[bias] || 0) + 1;
      }
      // Also count biases detected in the similar doc itself
      for (const bias of doc.biases) {
        biasFreq[bias] = (biasFreq[bias] || 0) + 0.5; // Half weight for detected-only
      }
    }

    const commonBiases = Object.entries(biasFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([biasType, frequency]) => ({ biasType, frequency: Number(frequency.toFixed(1)) }));

    // Average impact score
    const impactScores = docsWithOutcomes
      .filter(d => d.outcome?.impactScore != null)
      .map(d => d.outcome!.impactScore!);
    const avgOutcomeScore =
      impactScores.length > 0
        ? Number((impactScores.reduce((a, b) => a + b, 0) / impactScores.length).toFixed(1))
        : 0;

    // Build human-readable insights
    const insights: string[] = [];

    if (poorOutcomes.length > 0) {
      const biasNames = commonBiases.slice(0, 3).map(b => b.biasType);
      insights.push(
        `${poorOutcomes.length} of ${docsWithOutcomes.length} similar past decisions had poor outcomes` +
          (biasNames.length > 0 ? `; common biases were ${biasNames.join(', ')}` : '') +
          '.'
      );
    }

    if (docsWithOutcomes.length > 0 && poorOutcomes.length === 0) {
      insights.push(`${docsWithOutcomes.length} similar past decisions all had positive outcomes.`);
    }

    if (avgOutcomeScore > 0) {
      insights.push(`Average impact score across similar decisions: ${avgOutcomeScore}/10.`);
    }

    // Check for lessons learned
    const lessons = docsWithOutcomes
      .filter(d => d.outcome?.lessonsLearned)
      .map(d => d.outcome!.lessonsLearned!);
    if (lessons.length > 0) {
      insights.push(`${lessons.length} similar decision(s) have recorded lessons learned.`);
    }

    return {
      similarDocCount: similarDocs.length,
      documentsWithOutcomes: docsWithOutcomes.length,
      poorOutcomeCount: poorOutcomes.length,
      commonBiases,
      avgOutcomeScore,
      insights,
    };
  } catch (error) {
    log.warn('getCrossDocumentPatterns failed:', error);
    return emptyResult;
  }
}

/**
 * Calculate how much the platform's detection accuracy has improved over time.
 *
 * Compares the confirmation rate of the first N outcomes vs the last N outcomes.
 * A positive improvementPct means the platform is getting better at detecting
 * real biases (fewer false positives over time).
 */
// ─── £ Impact Functions ──────────────────────────────────────────────────────

export interface BiasCostEstimate {
  biasType: string;
  /** Number of decisions where this bias was present and outcome was negative */
  failedDecisions: number;
  /** Number of decisions where this bias was present */
  totalDecisions: number;
  /** Average impact score deficit when this bias is present vs absent */
  impactDelta: number;
  /** Estimated monetary cost (only if monetaryValue was set on the DecisionFrame) */
  estimatedCost: number | null;
  /** Currency */
  currency: string;
}

/**
 * Calculate the estimated monetary cost of each bias type based on
 * historical outcome data and optional DecisionFrame monetary values.
 */
export async function calculateBiasCosts(
  orgId?: string | null,
  userId?: string
): Promise<BiasCostEstimate[]> {
  try {
    // Build where clause
    const where: Record<string, unknown> = {};
    if (orgId) where.orgId = orgId;
    if (userId) where.userId = userId;

    // Fetch all outcomes with confirmed biases
    const outcomes = await prisma.decisionOutcome.findMany({
      where,
      select: {
        id: true,
        outcome: true,
        impactScore: true,
        confirmedBiases: true,
        analysisId: true,
      },
    });

    if (outcomes.length === 0) {
      return [];
    }

    // Try to get monetary values from DecisionFrames via Document join
    let monetaryValues: Map<string, { value: number; currency: string }> = new Map();
    try {
      // Get analysisIds from outcomes, then find their documents, then find DecisionFrames
      const analysisIds = outcomes.map(o => o.analysisId);
      const analyses = await prisma.analysis.findMany({
        where: { id: { in: analysisIds } },
        select: { id: true, documentId: true },
      });

      const docIds = analyses.map(a => a.documentId);
      const docToAnalysis = new Map(analyses.map(a => [a.documentId, a.id]));

      const frames = await prisma.decisionFrame.findMany({
        where: { documentId: { in: docIds } },
        select: { documentId: true, monetaryValue: true, currency: true },
      });

      for (const frame of frames) {
        if (frame.documentId && frame.monetaryValue != null) {
          const analysisId = docToAnalysis.get(frame.documentId);
          if (analysisId) {
            monetaryValues.set(analysisId, {
              value: Number(frame.monetaryValue),
              currency: frame.currency ?? 'GBP',
            });
          }
        }
      }
    } catch (frameErr) {
      const msg = frameErr instanceof Error ? frameErr.message : String(frameErr);
      const code = (frameErr as { code?: string }).code;
      if (code === 'P2021' || code === 'P2022' || msg.includes('does not exist')) {
        log.debug('Schema drift fetching DecisionFrame monetary values — skipping');
      } else {
        log.warn('Failed to fetch DecisionFrame monetary values:', msg);
      }
    }

    // Compute average impact score for outcomes WITHOUT each bias type (baseline)
    const allImpactScores = outcomes
      .filter(o => o.impactScore != null)
      .map(o => o.impactScore!);
    const globalAvgImpact =
      allImpactScores.length > 0
        ? allImpactScores.reduce((s, v) => s + v, 0) / allImpactScores.length
        : 0;

    // Build per-bias stats
    const biasMap: Record<
      string,
      {
        failed: number;
        total: number;
        impactScores: number[];
        monetaryVals: number[];
        currency: string;
      }
    > = {};

    for (const o of outcomes) {
      for (const bias of o.confirmedBiases) {
        if (!biasMap[bias]) {
          biasMap[bias] = { failed: 0, total: 0, impactScores: [], monetaryVals: [], currency: 'GBP' };
        }
        biasMap[bias].total++;
        if (o.outcome === 'failure') {
          biasMap[bias].failed++;
        }
        if (o.impactScore != null) {
          biasMap[bias].impactScores.push(o.impactScore);
        }
        const mv = monetaryValues.get(o.analysisId);
        if (mv) {
          biasMap[bias].monetaryVals.push(mv.value);
          biasMap[bias].currency = mv.currency;
        }
      }
    }

    // Calculate cost estimates
    const estimates: BiasCostEstimate[] = Object.entries(biasMap).map(([biasType, stats]) => {
      const avgWithBias =
        stats.impactScores.length > 0
          ? stats.impactScores.reduce((s, v) => s + v, 0) / stats.impactScores.length
          : 0;
      const impactDelta = Number((globalAvgImpact - avgWithBias).toFixed(2));

      let estimatedCost: number | null = null;
      if (stats.monetaryVals.length > 0) {
        const avgMonetary =
          stats.monetaryVals.reduce((s, v) => s + v, 0) / stats.monetaryVals.length;
        estimatedCost = Number(((impactDelta / 100) * avgMonetary).toFixed(2));
      }

      return {
        biasType,
        failedDecisions: stats.failed,
        totalDecisions: stats.total,
        impactDelta,
        estimatedCost,
        currency: stats.currency,
      };
    });

    // Sort by estimatedCost desc (or impactDelta if no monetary values)
    estimates.sort((a, b) => {
      if (a.estimatedCost != null && b.estimatedCost != null) {
        return b.estimatedCost - a.estimatedCost;
      }
      if (a.estimatedCost != null) return -1;
      if (b.estimatedCost != null) return 1;
      return b.impactDelta - a.impactDelta;
    });

    return estimates;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const code = (error as { code?: string }).code;

    if (code === 'P2021' || code === 'P2022' || msg.includes('does not exist')) {
      log.debug('Schema drift in calculateBiasCosts — table not available');
      return [];
    }

    log.error('Failed to calculate bias costs:', error);
    throw error;
  }
}

export interface QuarterlyImpactSummary {
  totalDecisions: number;
  improvedDecisions: number;
  estimatedSavings: number | null;
  currency: string;
  topCostlyBiases: Array<{ biasType: string; estimatedCost: number }>;
}

/**
 * Calculate "Bias cost avoided this quarter" by comparing decisions where
 * a bias was detected AND the user changed their action (beliefDelta > 0)
 * AND the outcome was positive, vs decisions where the bias was detected
 * but the user didn't change.
 */
export async function getQuarterlyImpact(
  orgId?: string | null,
  userId?: string
): Promise<QuarterlyImpactSummary> {
  const emptySummary: QuarterlyImpactSummary = {
    totalDecisions: 0,
    improvedDecisions: 0,
    estimatedSavings: null,
    currency: 'GBP',
    topCostlyBiases: [],
  };

  try {
    // Current quarter boundaries
    const now = new Date();
    const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
    const quarterStart = new Date(now.getFullYear(), quarterMonth, 1);

    // Build where clause for outcomes this quarter
    const outcomeWhere: Record<string, unknown> = {
      reportedAt: { gte: quarterStart },
    };
    if (orgId) outcomeWhere.orgId = orgId;
    if (userId) outcomeWhere.userId = userId;

    // Fetch outcomes with their priors (to check beliefDelta)
    const outcomes = await prisma.decisionOutcome.findMany({
      where: outcomeWhere,
      select: {
        id: true,
        analysisId: true,
        outcome: true,
        impactScore: true,
        confirmedBiases: true,
        analysis: {
          select: {
            id: true,
            documentId: true,
            prior: {
              select: {
                beliefDelta: true,
              },
            },
          },
        },
      },
    });

    if (outcomes.length === 0) {
      return emptySummary;
    }

    // Try to get monetary values
    let monetaryValues: Map<string, { value: number; currency: string }> = new Map();
    try {
      const docIds = outcomes
        .map(o => o.analysis?.documentId)
        .filter((id): id is string => id != null);

      if (docIds.length > 0) {
        const frames = await prisma.decisionFrame.findMany({
          where: { documentId: { in: docIds } },
          select: { documentId: true, monetaryValue: true, currency: true },
        });

        const docToAnalysisId = new Map(
          outcomes
            .filter(o => o.analysis?.documentId)
            .map(o => [o.analysis!.documentId, o.analysisId])
        );

        for (const frame of frames) {
          if (frame.documentId && frame.monetaryValue != null) {
            const analysisId = docToAnalysisId.get(frame.documentId);
            if (analysisId) {
              monetaryValues.set(analysisId, {
                value: Number(frame.monetaryValue),
                currency: frame.currency ?? 'GBP',
              });
            }
          }
        }
      }
    } catch (frameErr) {
      const code = (frameErr as { code?: string }).code;
      if (code === 'P2021' || code === 'P2022') {
        log.debug('Schema drift fetching monetary values for quarterly impact');
      }
    }

    // Separate into "changed" (beliefDelta > 0) and "unchanged" buckets
    const changedPositive: typeof outcomes = []; // Changed mind AND positive outcome
    const unchangedNegative: typeof outcomes = []; // Didn't change AND negative outcome

    for (const o of outcomes) {
      const beliefDelta = o.analysis?.prior?.beliefDelta ?? 0;
      const isPositive = o.outcome === 'success' || o.outcome === 'partial_success';
      const isNegative = o.outcome === 'failure';

      if (beliefDelta > 0 && isPositive) {
        changedPositive.push(o);
      }
      if (beliefDelta === 0 && isNegative) {
        unchangedNegative.push(o);
      }
    }

    // Estimate savings: for each "changed + positive" decision, the saving is
    // the monetary value * (impactDelta between unchanged-negative and changed-positive groups)
    let estimatedSavings: number | null = null;
    let currency = 'GBP';

    if (changedPositive.length > 0) {
      const changedImpacts = changedPositive
        .filter(o => o.impactScore != null)
        .map(o => o.impactScore!);
      const unchangedImpacts = unchangedNegative
        .filter(o => o.impactScore != null)
        .map(o => o.impactScore!);

      const avgChanged = changedImpacts.length > 0
        ? changedImpacts.reduce((s, v) => s + v, 0) / changedImpacts.length
        : 0;
      const avgUnchanged = unchangedImpacts.length > 0
        ? unchangedImpacts.reduce((s, v) => s + v, 0) / unchangedImpacts.length
        : 0;

      const impactGap = avgChanged - avgUnchanged;

      // Calculate total monetary savings across changed-positive decisions
      let totalSavings = 0;
      let hasMonetary = false;
      for (const o of changedPositive) {
        const mv = monetaryValues.get(o.analysisId);
        if (mv) {
          totalSavings += (impactGap / 100) * mv.value;
          currency = mv.currency;
          hasMonetary = true;
        }
      }

      if (hasMonetary) {
        estimatedSavings = Number(totalSavings.toFixed(2));
      }
    }

    // Get top costly biases from the full bias cost calculation
    const biasCosts = await calculateBiasCosts(orgId, userId);
    const topCostlyBiases = biasCosts
      .filter(b => b.estimatedCost != null && b.estimatedCost > 0)
      .slice(0, 5)
      .map(b => ({ biasType: b.biasType, estimatedCost: b.estimatedCost! }));

    return {
      totalDecisions: outcomes.length,
      improvedDecisions: changedPositive.length,
      estimatedSavings,
      currency,
      topCostlyBiases,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const code = (error as { code?: string }).code;

    if (code === 'P2021' || code === 'P2022' || msg.includes('does not exist')) {
      log.debug('Schema drift in getQuarterlyImpact — table not available');
      return emptySummary;
    }

    log.error('Failed to compute quarterly impact:', error);
    throw error;
  }
}

// ─── Accuracy Improvement ────────────────────────────────────────────────────

export async function getAccuracyImprovement(orgId: string): Promise<AccuracyImprovement> {
  const BUCKET_SIZE = 10; // Compare first 10 vs last 10

  try {
    // Fetch all outcomes with bias feedback, ordered by time
    const outcomes = await prisma.decisionOutcome.findMany({
      where: {
        orgId,
        OR: [{ confirmedBiases: { isEmpty: false } }, { falsPositiveBiases: { isEmpty: false } }],
      },
      orderBy: { reportedAt: 'asc' },
      select: {
        confirmedBiases: true,
        falsPositiveBiases: true,
        reportedAt: true,
      },
    });

    if (outcomes.length < BUCKET_SIZE * 2) {
      // Not enough data to compare early vs recent
      const totalConfirmed = outcomes.reduce((s, o) => s + o.confirmedBiases.length, 0);
      const totalFP = outcomes.reduce((s, o) => s + o.falsPositiveBiases.length, 0);
      const totalAll = totalConfirmed + totalFP;
      const overallRate = totalAll > 0 ? Number(((totalConfirmed / totalAll) * 100).toFixed(1)) : 0;

      return {
        earlyAccuracy: overallRate,
        recentAccuracy: overallRate,
        improvementPct: 0,
        earlySampleSize: outcomes.length,
        recentSampleSize: outcomes.length,
        message:
          outcomes.length === 0
            ? 'No outcome data available yet. Track decision outcomes to see accuracy trends.'
            : `Only ${outcomes.length} outcomes tracked so far. Need at least ${BUCKET_SIZE * 2} for trend analysis.`,
      };
    }

    // Calculate confirmation rate for early bucket
    const earlyBucket = outcomes.slice(0, BUCKET_SIZE);
    const earlyConfirmed = earlyBucket.reduce((s, o) => s + o.confirmedBiases.length, 0);
    const earlyFP = earlyBucket.reduce((s, o) => s + o.falsPositiveBiases.length, 0);
    const earlyTotal = earlyConfirmed + earlyFP;
    const earlyAccuracy = earlyTotal > 0 ? (earlyConfirmed / earlyTotal) * 100 : 0;

    // Calculate confirmation rate for recent bucket
    const recentBucket = outcomes.slice(-BUCKET_SIZE);
    const recentConfirmed = recentBucket.reduce((s, o) => s + o.confirmedBiases.length, 0);
    const recentFP = recentBucket.reduce((s, o) => s + o.falsPositiveBiases.length, 0);
    const recentTotal = recentConfirmed + recentFP;
    const recentAccuracy = recentTotal > 0 ? (recentConfirmed / recentTotal) * 100 : 0;

    const improvementPct = Number((recentAccuracy - earlyAccuracy).toFixed(1));

    let message: string;
    if (improvementPct > 5) {
      message = `Detection accuracy improved from ${earlyAccuracy.toFixed(0)}% to ${recentAccuracy.toFixed(0)}% (+${improvementPct.toFixed(1)} pp). The learning loop is working.`;
    } else if (improvementPct < -5) {
      message = `Detection accuracy decreased from ${earlyAccuracy.toFixed(0)}% to ${recentAccuracy.toFixed(0)}% (${improvementPct.toFixed(1)} pp). Review recent bias calibrations.`;
    } else {
      message = `Detection accuracy is stable at ~${recentAccuracy.toFixed(0)}% (${outcomes.length} outcomes tracked).`;
    }

    return {
      earlyAccuracy: Number(earlyAccuracy.toFixed(1)),
      recentAccuracy: Number(recentAccuracy.toFixed(1)),
      improvementPct,
      earlySampleSize: BUCKET_SIZE,
      recentSampleSize: BUCKET_SIZE,
      message,
    };
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'P2021' || code === 'P2022') {
      log.debug('Schema drift in getAccuracyImprovement');
      return {
        earlyAccuracy: 0,
        recentAccuracy: 0,
        improvementPct: 0,
        earlySampleSize: 0,
        recentSampleSize: 0,
        message: 'Outcome tracking not yet available. Database migration pending.',
      };
    }

    log.error('Failed to compute accuracy improvement:', error);
    throw error;
  }
}
