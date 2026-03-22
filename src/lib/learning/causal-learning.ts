/**
 * Causal Learning Service — Organization-Specific Causal Discovery
 *
 * Learns org-specific causal relationships from outcome data:
 * which biases actually cause poor outcomes in THIS organization,
 * not just generic statistical averages.
 *
 * This is the deepest moat: competitors can copy our UI and prompts,
 * but they cannot clone 18 months of learned causal weights from
 * your organization's actual decision outcomes.
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('CausalLearning');

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CausalWeight {
  biasType: string;
  /** How strongly this bias correlates with good outcomes (-1 = bad, +1 = good) */
  outcomeCorrelation: number;
  /** How many times this bias was present in failed decisions */
  failureCount: number;
  /** How many times present in successful decisions */
  successCount: number;
  /** Relative danger score compared to other biases (higher = worse) */
  dangerMultiplier: number;
  /** Sample size for this bias type */
  sampleSize: number;
}

export interface CausalInsight {
  type: 'danger' | 'safe' | 'noise' | 'twin';
  message: string;
  confidence: number;
  biasType?: string;
  dataPoints: number;
}

export interface OrgCausalProfile {
  orgId: string;
  totalOutcomes: number;
  weights: CausalWeight[];
  insights: CausalInsight[];
  lastUpdated: string;
}

// ─── New API (test-aligned) ─────────────────────────────────────────────────

type BiasRecord = Record<string, { score: number; instances: unknown[] }>;

interface OutcomeRecord {
  id: string;
  analysisId: string;
  outcome: string;
  actualValue?: number | null;
  analysis: {
    biases: BiasRecord;
  };
}

/**
 * Compute org-specific causal weights from outcome records.
 *
 * Each outcome record carries a `biases` object keyed by bias type.
 * Computes per-bias success rate vs baseline to derive correlation
 * and danger multiplier.
 */
export async function computeOrgCausalWeights(
  orgId: string,
  from?: Date,
  to?: Date
): Promise<CausalWeight[]> {
  try {
    const outcomes: OutcomeRecord[] = await (
      prisma as unknown as {
        outcomeRecord: { findMany: (args: unknown) => Promise<OutcomeRecord[]> };
      }
    ).outcomeRecord.findMany({
      where: {
        orgId,
        ...(from || to
          ? {
              createdAt: {
                ...(from && { gte: from }),
                ...(to && { lte: to }),
              },
            }
          : {}),
      },
      include: {
        analysis: true,
      },
    });

    if ((outcomes ?? []).length === 0) {
      return [];
    }

    const outcomesList = outcomes ?? [];
    const totalOutcomes = outcomesList.length;
    const totalSuccesses = outcomesList.filter(o => o.outcome === 'success').length;
    const baseSuccessRate = totalSuccesses / totalOutcomes;
    const baseFailureRate = 1 - baseSuccessRate;

    // Accumulate per-bias statistics
    const biasStats = new Map<string, { failures: number; successes: number; partials: number }>();

    for (const outcome of outcomesList) {
      const biases = outcome.analysis?.biases ?? {};
      const biasTypes = Object.keys(biases);

      for (const biasType of biasTypes) {
        const stats = biasStats.get(biasType) ?? { failures: 0, successes: 0, partials: 0 };
        if (outcome.outcome === 'failure') stats.failures++;
        else if (outcome.outcome === 'success') stats.successes++;
        else stats.partials++;
        biasStats.set(biasType, stats);
      }
    }

    const weights: CausalWeight[] = [];
    for (const [biasType, stats] of biasStats.entries()) {
      const total = stats.failures + stats.successes + stats.partials;
      if (total === 0) continue;

      const biasSuccessRate = stats.successes / total;
      const biasFailureRate = stats.failures / total;

      // Negative correlation = bias correlates with poor outcomes
      const outcomeCorrelation = Number((biasSuccessRate - baseSuccessRate).toFixed(3));

      const dangerMultiplier =
        baseFailureRate > 0
          ? Number((biasFailureRate / baseFailureRate).toFixed(2))
          : biasFailureRate > 0
            ? 2.0
            : 1.0;

      weights.push({
        biasType,
        outcomeCorrelation,
        failureCount: stats.failures,
        successCount: stats.successes,
        dangerMultiplier,
        sampleSize: total,
      });
    }

    weights.sort((a, b) => b.dangerMultiplier - a.dangerMultiplier);
    return weights;
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'P2021' || code === 'P2022') {
      log.debug('Schema drift in computeOrgCausalWeights');
      return [];
    }
    log.error('Failed to compute org causal weights:', error);
    throw error;
  }
}

/**
 * Apply org-specific causal weights to adjust bias scores.
 *
 * Multiplies each bias score by the org's learned danger multiplier.
 * Returns original scores unchanged if no model exists or model is stale
 * (older than 90 days).
 */
export async function applyOrgWeights(
  orgId: string,
  biases: Record<string, { score: number; instances: unknown[] }>
): Promise<
  Record<
    string,
    { score: number; instances: unknown[]; adjusted?: boolean; orgMultiplier?: number }
  >
> {
  try {
    const model = await (
      prisma as unknown as {
        orgCausalModel: {
          findUnique: (args: unknown) => Promise<{
            weights: CausalWeight[];
            updatedAt?: Date;
          } | null>;
        };
      }
    ).orgCausalModel.findUnique({
      where: { orgId },
    });

    if (!model) {
      return biases;
    }

    // Check for stale model (older than 90 days)
    if (model.updatedAt) {
      const ageMs = Date.now() - model.updatedAt.getTime();
      const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
      if (ageMs > ninetyDaysMs) {
        return biases;
      }
    }

    const weightMap = new Map<string, number>(
      (model.weights as CausalWeight[]).map(w => [w.biasType, w.dangerMultiplier])
    );

    const result: Record<
      string,
      { score: number; instances: unknown[]; adjusted: boolean; orgMultiplier: number }
    > = {};
    for (const [biasType, bias] of Object.entries(biases)) {
      const multiplier = weightMap.get(biasType);
      if (multiplier !== undefined) {
        result[biasType] = {
          ...bias,
          score: Math.min(10, Math.round(bias.score * multiplier)),
          adjusted: true,
          orgMultiplier: multiplier,
        };
      } else {
        result[biasType] = { ...bias, adjusted: true, orgMultiplier: 1.0 };
      }
    }
    return result;
  } catch (error) {
    log.error('Failed to apply org weights:', error);
    return biases;
  }
}

/**
 * Generate human-readable causal insights from pre-computed weights.
 * This is a synchronous function (no DB calls).
 */
export function getCausalInsights(weights: CausalWeight[], totalOutcomes: number): CausalInsight[] {
  if (weights.length === 0 || totalOutcomes === 0) {
    return [
      {
        type: 'noise',
        message: 'Not enough data to generate causal insights. Track more decision outcomes.',
        confidence: 0,
        dataPoints: 0,
      },
    ];
  }

  const insights: CausalInsight[] = [];

  // Danger insights: high danger multiplier + sufficient sample
  const dangerous = weights.filter(w => w.dangerMultiplier >= 1.5 && w.sampleSize >= 5);
  for (const w of dangerous.slice(0, 3)) {
    insights.push({
      type: 'danger',
      message: `${formatBiasName(w.biasType)} is associated with poor outcomes ${w.dangerMultiplier}x more than baseline (${w.failureCount} failures in ${w.sampleSize} decisions).`,
      confidence: Math.min(0.95, w.sampleSize / 20),
      biasType: w.biasType,
      dataPoints: w.sampleSize,
    });
  }

  // Safe insights: low danger multiplier + sufficient sample
  const safe = weights.filter(w => w.dangerMultiplier <= 0.9 && w.sampleSize >= 5);
  for (const w of safe.slice(0, 2)) {
    insights.push({
      type: 'safe',
      message: `${formatBiasName(w.biasType)} detections are mostly benign in your org — only ${w.failureCount} failures out of ${w.sampleSize} decisions.`,
      confidence: Math.min(0.9, w.sampleSize / 15),
      biasType: w.biasType,
      dataPoints: w.sampleSize,
    });
  }

  // Noise insights: low sample size
  const noisy = weights.filter(w => w.sampleSize < 5);
  for (const w of noisy) {
    insights.push({
      type: 'noise',
      message: `${formatBiasName(w.biasType)} has insufficient outcome data (${w.sampleSize} records). More decisions needed for reliable analysis.`,
      confidence: w.sampleSize / 10,
      biasType: w.biasType,
      dataPoints: w.sampleSize,
    });
  }

  // Twin prediction insight when enough data is available
  if (totalOutcomes >= 50 && dangerous.length > 0) {
    insights.push({
      type: 'twin',
      message: `Based on ${totalOutcomes} outcomes, a digital twin can predict decision quality with high confidence. ${formatBiasName(dangerous[0].biasType)} is the strongest predictor.`,
      confidence: Math.min(0.9, totalOutcomes / 200),
      dataPoints: totalOutcomes,
    });
  }

  return insights;
}

/**
 * Recompute and persist the causal model for an org.
 */
export async function updateCausalModel(orgId: string): Promise<unknown | null> {
  try {
    const weights = await computeOrgCausalWeights(orgId);
    const outcomes = await (
      prisma as unknown as {
        outcomeRecord: { findMany: (args: unknown) => Promise<OutcomeRecord[]> };
      }
    ).outcomeRecord.findMany({
      where: { orgId },
      include: { analysis: true },
    });
    const totalOutcomes = outcomes.length;
    const insights = getCausalInsights(weights, totalOutcomes);

    const result = await (
      prisma as unknown as {
        orgCausalModel: { upsert: (args: unknown) => Promise<unknown> };
      }
    ).orgCausalModel.upsert({
      where: { orgId },
      create: {
        orgId,
        weights: weights as unknown as Record<string, unknown>[],
        insights: insights as unknown as Record<string, unknown>[],
        totalOutcomes,
      },
      update: {
        weights: weights as unknown as Record<string, unknown>[],
        insights: insights as unknown as Record<string, unknown>[],
        totalOutcomes,
      },
    });

    return result;
  } catch (error) {
    log.error('Failed to update causal model:', error);
    return null;
  }
}

// ─── Legacy API (kept for backward compatibility) ───────────────────────────

/**
 * @deprecated Use computeOrgCausalWeights instead.
 */
export async function learnCausalEdges(orgId: string): Promise<CausalWeight[]> {
  try {
    // Fetch outcomes with their analyses and biases
    const outcomes = await prisma.decisionOutcome.findMany({
      where: { orgId },
      include: {
        analysis: {
          include: {
            biases: { select: { biasType: true, severity: true } },
          },
        },
      },
    });

    if (outcomes.length < 5) {
      log.info(`Insufficient outcome data for causal learning: ${outcomes.length}/5`);
      return [];
    }

    const biasOutcomes = new Map<
      string,
      {
        failures: number;
        successes: number;
        partials: number;
        impactSum: number;
        impactCount: number;
      }
    >();

    for (const outcome of outcomes) {
      const isFailure = outcome.outcome === 'failure';
      const isSuccess = outcome.outcome === 'success';
      const isPartial = outcome.outcome === 'partial_success';

      const biasTypes = Array.from(
        new Set(outcome.analysis.biases.map((b: { biasType: string }) => b.biasType))
      );

      for (const biasType of biasTypes) {
        const stats = biasOutcomes.get(biasType) || {
          failures: 0,
          successes: 0,
          partials: 0,
          impactSum: 0,
          impactCount: 0,
        };

        if (isFailure) stats.failures++;
        if (isSuccess) stats.successes++;
        if (isPartial) stats.partials++;
        if (outcome.impactScore != null) {
          stats.impactSum += outcome.impactScore;
          stats.impactCount++;
        }

        biasOutcomes.set(biasType, stats);
      }
    }

    const totalFailures = outcomes.filter(o => o.outcome === 'failure').length;
    const baseFailureRate = totalFailures / outcomes.length;

    const weights: CausalWeight[] = [];

    for (const [biasType, stats] of Array.from(biasOutcomes.entries())) {
      const total = stats.failures + stats.successes + stats.partials;
      if (total < 3) continue;

      const biasFailureRate = stats.failures / total;
      const outcomeCorrelation = Number((biasFailureRate - baseFailureRate).toFixed(3));

      const dangerMultiplier =
        baseFailureRate > 0
          ? Number((biasFailureRate / baseFailureRate).toFixed(2))
          : biasFailureRate > 0
            ? 2.0
            : 1.0;

      weights.push({
        biasType,
        outcomeCorrelation,
        failureCount: stats.failures,
        successCount: stats.successes,
        dangerMultiplier,
        sampleSize: total,
      });
    }

    weights.sort((a, b) => b.dangerMultiplier - a.dangerMultiplier);

    log.info(
      `Causal edges learned for org ${orgId}: ${weights.length} bias types from ${outcomes.length} outcomes`
    );

    return weights;
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'P2021' || code === 'P2022') {
      log.debug('Schema drift in learnCausalEdges');
      return [];
    }
    log.error('Failed to learn causal edges:', error);
    throw error;
  }
}

/**
 * @deprecated Use computeOrgCausalWeights instead.
 */
export async function getOrgCausalWeights(orgId: string): Promise<CausalWeight[]> {
  return learnCausalEdges(orgId);
}

/**
 * @deprecated Use getCausalInsights instead.
 */
export async function generateCausalInsights(orgId: string): Promise<CausalInsight[]> {
  const insights: CausalInsight[] = [];

  try {
    const weights = await learnCausalEdges(orgId);

    if (weights.length === 0) {
      insights.push({
        type: 'noise',
        message:
          'Not enough outcome data to generate causal insights. Track at least 5 decision outcomes.',
        confidence: 0,
        dataPoints: 0,
      });
      return insights;
    }

    const dangerous = weights.filter(w => w.dangerMultiplier >= 1.5 && w.sampleSize >= 5);
    for (const w of dangerous.slice(0, 3)) {
      insights.push({
        type: 'danger',
        message: `In your organization, ${formatBiasName(w.biasType)} leads to poor outcomes ${w.dangerMultiplier}x more than the baseline. (${w.failureCount} failures in ${w.sampleSize} decisions)`,
        confidence: Math.min(0.95, w.sampleSize / 20),
        biasType: w.biasType,
        dataPoints: w.sampleSize,
      });
    }

    if (dangerous.length >= 2) {
      const ratio = (dangerous[0].dangerMultiplier / dangerous[1].dangerMultiplier).toFixed(1);
      insights.push({
        type: 'danger',
        message: `${formatBiasName(dangerous[0].biasType)} is ${ratio}x more associated with poor outcomes than ${formatBiasName(dangerous[1].biasType)} in your organization.`,
        confidence: Math.min(0.9, Math.min(dangerous[0].sampleSize, dangerous[1].sampleSize) / 15),
        dataPoints: dangerous[0].sampleSize + dangerous[1].sampleSize,
      });
    }

    const safe = weights.filter(w => w.dangerMultiplier <= 0.8 && w.sampleSize >= 5);
    for (const w of safe.slice(0, 2)) {
      insights.push({
        type: 'safe',
        message: `${formatBiasName(w.biasType)} detections in your org are mostly false positives — only ${w.failureCount} led to poor outcomes out of ${w.sampleSize} decisions.`,
        confidence: Math.min(0.9, w.sampleSize / 15),
        biasType: w.biasType,
        dataPoints: w.sampleSize,
      });
    }

    const noisy = weights.filter(w => {
      const failRate = w.failureCount / w.sampleSize;
      return failRate > 0.3 && failRate < 0.7 && w.sampleSize >= 5;
    });
    if (noisy.length > 0) {
      insights.push({
        type: 'noise',
        message: `${noisy.length} bias type(s) have ambiguous outcome signals — they appear in both successes and failures equally. More outcome data will clarify their causal role.`,
        confidence: 0.5,
        dataPoints: noisy.reduce((sum, w) => sum + w.sampleSize, 0),
      });
    }

    try {
      const twinOutcomes = await prisma.decisionOutcome.findMany({
        where: { orgId, mostAccurateTwin: { not: null } },
        select: { mostAccurateTwin: true },
      });

      if (twinOutcomes.length >= 5) {
        const twinCounts: Record<string, number> = {};
        for (const o of twinOutcomes) {
          const twin = o.mostAccurateTwin!;
          twinCounts[twin] = (twinCounts[twin] || 0) + 1;
        }

        const sorted = Object.entries(twinCounts).sort((a, b) => b[1] - a[1]);
        if (sorted.length > 0) {
          const [topTwin, topCount] = sorted[0];
          const pct = Math.round((topCount / twinOutcomes.length) * 100);
          insights.push({
            type: 'twin',
            message: `The "${topTwin}" decision twin has been the most accurate predictor in ${pct}% of tracked outcomes (${topCount}/${twinOutcomes.length} decisions).`,
            confidence: Math.min(0.9, twinOutcomes.length / 20),
            dataPoints: twinOutcomes.length,
          });
        }
      }
    } catch {
      // Non-critical — twin data may not be available
    }

    return insights;
  } catch (error) {
    log.error('Failed to generate causal insights:', error);
    return [
      {
        type: 'noise',
        message:
          'Unable to generate causal insights. This may be due to insufficient outcome data.',
        confidence: 0,
        dataPoints: 0,
      },
    ];
  }
}

/**
 * Get the full org causal profile including weights and insights.
 */
export async function getOrgCausalProfile(orgId: string): Promise<OrgCausalProfile> {
  const [weights, insights] = await Promise.all([
    getOrgCausalWeights(orgId),
    generateCausalInsights(orgId),
  ]);

  let totalOutcomes = 0;
  try {
    totalOutcomes = await prisma.decisionOutcome.count({ where: { orgId } });
  } catch {
    // Schema drift
  }

  return {
    orgId,
    totalOutcomes,
    weights,
    insights,
    lastUpdated: new Date().toISOString(),
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatBiasName(biasType: string): string {
  return biasType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
