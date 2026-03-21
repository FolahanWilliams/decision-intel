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
  /** How strongly this bias correlates with poor outcomes (-1 to 1) */
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

// ─── Core Functions ─────────────────────────────────────────────────────────

/**
 * Learn causal edges from outcome data.
 *
 * For each outcome, extract: bias types detected, noise score, overall score,
 * outcome result, impact score. Compute correlation between bias presence
 * and outcome quality.
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

    // Build per-bias-type outcome statistics
    const biasOutcomes = new Map<
      string,
      { failures: number; successes: number; partials: number; impactSum: number; impactCount: number }
    >();

    for (const outcome of outcomes) {
      const isFailure = outcome.outcome === 'failure';
      const isSuccess = outcome.outcome === 'success';
      const isPartial = outcome.outcome === 'partial_success';

      // Get biases detected in this analysis
      const biasTypes = Array.from(new Set(outcome.analysis.biases.map(b => b.biasType)));

      for (const biasType of biasTypes) {
        const stats = biasOutcomes.get(biasType) || {
          failures: 0, successes: 0, partials: 0, impactSum: 0, impactCount: 0,
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

    // Compute causal weights
    const totalFailures = outcomes.filter(o => o.outcome === 'failure').length;
    const _totalSuccesses = outcomes.filter(o => o.outcome === 'success').length;
    const baseFailureRate = totalFailures / outcomes.length;

    const weights: CausalWeight[] = [];

    for (const [biasType, stats] of Array.from(biasOutcomes.entries())) {
      const total = stats.failures + stats.successes + stats.partials;
      if (total < 3) continue; // Skip bias types with insufficient data

      const biasFailureRate = stats.failures / total;

      // Correlation: how much does this bias increase failure rate vs baseline
      // Positive = bias makes failures more likely; negative = bias is benign
      const outcomeCorrelation = Number(
        (biasFailureRate - baseFailureRate).toFixed(3)
      );

      // Danger multiplier: ratio of bias failure rate to base failure rate
      const dangerMultiplier = baseFailureRate > 0
        ? Number((biasFailureRate / baseFailureRate).toFixed(2))
        : biasFailureRate > 0 ? 2.0 : 1.0;

      weights.push({
        biasType,
        outcomeCorrelation,
        failureCount: stats.failures,
        successCount: stats.successes,
        dangerMultiplier,
        sampleSize: total,
      });
    }

    // Sort by danger multiplier descending
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
 * Return learned causal weights for a specific org.
 */
export async function getOrgCausalWeights(orgId: string): Promise<CausalWeight[]> {
  return learnCausalEdges(orgId);
}

/**
 * Generate human-readable causal insights from outcome data.
 */
export async function generateCausalInsights(orgId: string): Promise<CausalInsight[]> {
  const insights: CausalInsight[] = [];

  try {
    const weights = await learnCausalEdges(orgId);

    if (weights.length === 0) {
      insights.push({
        type: 'noise',
        message: 'Not enough outcome data to generate causal insights. Track at least 5 decision outcomes.',
        confidence: 0,
        dataPoints: 0,
      });
      return insights;
    }

    // Most dangerous biases
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

    // Compare top 2 biases
    if (dangerous.length >= 2) {
      const ratio = (dangerous[0].dangerMultiplier / dangerous[1].dangerMultiplier).toFixed(1);
      insights.push({
        type: 'danger',
        message: `${formatBiasName(dangerous[0].biasType)} is ${ratio}x more associated with poor outcomes than ${formatBiasName(dangerous[1].biasType)} in your organization.`,
        confidence: Math.min(0.9, Math.min(dangerous[0].sampleSize, dangerous[1].sampleSize) / 15),
        dataPoints: dangerous[0].sampleSize + dangerous[1].sampleSize,
      });
    }

    // Safest biases (low danger multiplier)
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

    // Noise insight: high-variance biases
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

    // Twin accuracy insight
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
    return [{
      type: 'noise',
      message: 'Unable to generate causal insights. This may be due to insufficient outcome data.',
      confidence: 0,
      dataPoints: 0,
    }];
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
  return biasType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
