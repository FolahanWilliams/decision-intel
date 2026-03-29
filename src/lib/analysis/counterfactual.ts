/**
 * Counterfactual Analysis — Lightweight Analytical Approach
 *
 * Instead of expensive Monte Carlo simulation, uses existing CausalEdge
 * weights and historical outcome data to compute analytical counterfactuals:
 *
 * "If bias X were removed from this decision, based on N similar historical
 * decisions, the expected outcome improvement would be Y%"
 *
 * This is pure math on existing data — no LLM calls, no simulation.
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('Counterfactual');

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CounterfactualScenario {
  biasRemoved: string;
  /** How many historical decisions had this bias */
  historicalSampleSize: number;
  /** Success rate of decisions WITH this bias */
  successRateWithBias: number;
  /** Success rate of decisions WITHOUT this bias (from similar decisions) */
  successRateWithoutBias: number;
  /** Expected improvement in percentage points */
  expectedImprovement: number;
  /** Confidence level based on sample size (0-1) */
  confidence: number;
  /** Estimated monetary impact if monetaryValue is known */
  estimatedMonetaryImpact: number | null;
  currency: string;
}

export interface CounterfactualResult {
  analysisId: string;
  /** Total biases found in this analysis */
  biasCount: number;
  /** Per-bias counterfactual scenarios */
  scenarios: CounterfactualScenario[];
  /** Aggregate: if ALL detected biases were removed */
  aggregateImprovement: number;
  /** Confidence-weighted aggregate */
  weightedImprovement: number;
  /** Data freshness */
  dataAsOf: string;
}

// ─── Core Function ──────────────────────────────────────────────────────────

/**
 * Compute counterfactual scenarios for a given analysis.
 *
 * For each detected bias:
 * 1. Query CausalEdge for this bias type (org-specific or global)
 * 2. Query historical DecisionOutcome data:
 *    - Success rate of decisions WITH this bias confirmed
 *    - Success rate of decisions WITHOUT this bias
 * 3. Compute expected improvement = rate_without - rate_with
 * 4. Apply confidence weighting based on sample size
 */
export async function computeCounterfactuals(
  analysisId: string,
  orgId?: string | null
): Promise<CounterfactualResult> {
  const emptyResult: CounterfactualResult = {
    analysisId,
    biasCount: 0,
    scenarios: [],
    aggregateImprovement: 0,
    weightedImprovement: 0,
    dataAsOf: new Date().toISOString(),
  };

  try {
    // 1. Fetch the analysis with its biases
    let biases: Array<{ biasType: string; severity: string }> = [];
    try {
      biases = await prisma.biasInstance.findMany({
        where: { analysisId },
        select: { biasType: true, severity: true },
      });
    } catch (error) {
      const code = (error as { code?: string }).code;
      const msg = error instanceof Error ? error.message : String(error);
      if (code === 'P2021' || code === 'P2022' || msg.includes('does not exist')) {
        log.debug('Schema drift fetching BiasInstance — table not available');
        return emptyResult;
      }
      throw error;
    }

    if (biases.length === 0) {
      return emptyResult;
    }

    // Deduplicate bias types
    const biasTypes = [...new Set(biases.map(b => b.biasType))];

    // 2. Fetch all historical outcomes to compute success rates WITH and WITHOUT each bias
    let outcomes: Array<{
      outcome: string;
      confirmedBiases: string[];
      impactScore: number | null;
      analysisId: string;
    }> = [];

    try {
      if (!orgId) {
        log.warn(
          'computeCounterfactuals called without orgId — returning empty to avoid full table scan'
        );
        return { ...emptyResult, biasCount: biasTypes.length };
      }

      const where: Record<string, unknown> = {
        orgId,
        analysisId: { not: analysisId },
      };

      outcomes = await prisma.decisionOutcome.findMany({
        where,
        select: {
          outcome: true,
          confirmedBiases: true,
          impactScore: true,
          analysisId: true,
        },
      });
    } catch (error) {
      const code = (error as { code?: string }).code;
      const msg = error instanceof Error ? error.message : String(error);
      if (code === 'P2021' || code === 'P2022' || msg.includes('does not exist')) {
        log.debug('Schema drift fetching DecisionOutcome — table not available');
        return emptyResult;
      }
      throw error;
    }

    if (outcomes.length === 0) {
      return { ...emptyResult, biasCount: biasTypes.length };
    }

    // 3. Fetch CausalEdge strengths for each bias type
    const causalStrengths = await getCausalStrengths(biasTypes, orgId);

    // 4. Try to get monetary value from DecisionFrame
    const monetaryInfo = await getMonetaryValue(analysisId);

    // 5. Compute global baseline success rate (decisions without any of the target biases)
    const isSuccess = (outcome: string) => outcome === 'success' || outcome === 'partial_success';

    // 6. For each bias type, compute counterfactual scenario
    const scenarios: CounterfactualScenario[] = [];

    for (const biasType of biasTypes) {
      const withBias = outcomes.filter(o => o.confirmedBiases.includes(biasType));
      const withoutBias = outcomes.filter(o => !o.confirmedBiases.includes(biasType));

      const withBiasSuccesses = withBias.filter(o => isSuccess(o.outcome)).length;
      const withoutBiasSuccesses = withoutBias.filter(o => isSuccess(o.outcome)).length;

      const successRateWith = withBias.length > 0 ? (withBiasSuccesses / withBias.length) * 100 : 0;
      const successRateWithout =
        withoutBias.length > 0 ? (withoutBiasSuccesses / withoutBias.length) * 100 : 0;

      const expectedImprovement = successRateWithout - successRateWith;

      // Confidence via Wilson score interval approximation
      // Higher sample sizes and larger effect sizes yield higher confidence
      const sampleSize = withBias.length;
      const confidence = wilsonConfidence(sampleSize, withBiasSuccesses, withBias.length);

      // Apply CausalEdge strength as a multiplier on confidence
      const causalStrength = causalStrengths.get(biasType);
      const adjustedConfidence =
        causalStrength != null
          ? Math.min(1, confidence * (0.5 + Math.abs(causalStrength) * 0.5))
          : confidence;

      // Monetary impact estimate
      let estimatedMonetaryImpact: number | null = null;
      if (monetaryInfo && expectedImprovement > 0) {
        estimatedMonetaryImpact = Number(
          ((expectedImprovement / 100) * monetaryInfo.value).toFixed(2)
        );
      }

      scenarios.push({
        biasRemoved: biasType,
        historicalSampleSize: sampleSize,
        successRateWithBias: Number(successRateWith.toFixed(1)),
        successRateWithoutBias: Number(successRateWithout.toFixed(1)),
        expectedImprovement: Number(expectedImprovement.toFixed(1)),
        confidence: Number(adjustedConfidence.toFixed(3)),
        estimatedMonetaryImpact,
        currency: monetaryInfo?.currency ?? 'GBP',
      });
    }

    // Sort scenarios by expected improvement (descending)
    scenarios.sort((a, b) => b.expectedImprovement - a.expectedImprovement);

    // 7. Compute aggregates
    // Aggregate improvement: assuming independent biases, combine probabilities
    // P(improved) = 1 - product(1 - improvement_i/100)
    const aggregateImprovement =
      scenarios.length > 0
        ? Number(
            (
              (1 -
                scenarios.reduce(
                  (prod, s) => prod * (1 - Math.max(0, s.expectedImprovement) / 100),
                  1
                )) *
              100
            ).toFixed(1)
          )
        : 0;

    // Confidence-weighted aggregate
    const totalWeight = scenarios.reduce((s, sc) => s + sc.confidence, 0);
    const weightedImprovement =
      totalWeight > 0
        ? Number(
            (
              scenarios.reduce(
                (s, sc) => s + Math.max(0, sc.expectedImprovement) * sc.confidence,
                0
              ) / totalWeight
            ).toFixed(1)
          )
        : 0;

    return {
      analysisId,
      biasCount: biasTypes.length,
      scenarios,
      aggregateImprovement,
      weightedImprovement,
      dataAsOf: new Date().toISOString(),
    };
  } catch (error) {
    const code = (error as { code?: string }).code;
    const msg = error instanceof Error ? error.message : String(error);

    if (code === 'P2021' || code === 'P2022' || msg.includes('does not exist')) {
      log.debug('Schema drift in computeCounterfactuals — table not available');
      return emptyResult;
    }

    log.error('Failed to compute counterfactuals:', error);
    return emptyResult;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Fetch CausalEdge strengths for given bias types.
 * Tries org-specific first, then falls back to global (orgId = null).
 */
async function getCausalStrengths(
  biasTypes: string[],
  orgId?: string | null
): Promise<Map<string, number>> {
  const result = new Map<string, number>();

  try {
    // Query CausalEdge entries where fromVar matches one of the bias types
    const edges = await prisma.causalEdge.findMany({
      where: {
        fromVar: { in: biasTypes },
        ...(orgId ? { orgId } : {}),
      },
      select: {
        fromVar: true,
        strength: true,
        confidence: true,
      },
    });

    for (const edge of edges) {
      // If multiple edges for same bias, use the one with highest confidence
      const existing = result.get(edge.fromVar);
      if (existing == null || Math.abs(edge.strength) > Math.abs(existing)) {
        result.set(edge.fromVar, edge.strength);
      }
    }

    // If org-specific query returned fewer results than needed, try global
    if (orgId && result.size < biasTypes.length) {
      const missingTypes = biasTypes.filter(bt => !result.has(bt));
      if (missingTypes.length > 0) {
        const globalEdges = await prisma.causalEdge.findMany({
          where: {
            fromVar: { in: missingTypes },
            orgId: null,
          },
          select: {
            fromVar: true,
            strength: true,
          },
        });

        for (const edge of globalEdges) {
          if (!result.has(edge.fromVar)) {
            result.set(edge.fromVar, edge.strength);
          }
        }
      }
    }
  } catch (error) {
    const code = (error as { code?: string }).code;
    const msg = error instanceof Error ? error.message : String(error);
    if (code === 'P2021' || code === 'P2022' || msg.includes('does not exist')) {
      log.debug('Schema drift fetching CausalEdge — table not available');
    } else {
      log.warn('Failed to fetch causal strengths:', error);
    }
  }

  return result;
}

/**
 * Get monetary value from DecisionFrame linked to this analysis.
 * Analysis → Document → DecisionFrame.
 */
async function getMonetaryValue(
  analysisId: string
): Promise<{ value: number; currency: string } | null> {
  try {
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      select: { documentId: true },
    });

    if (!analysis) return null;

    const frame = await prisma.decisionFrame.findUnique({
      where: { documentId: analysis.documentId },
      select: { monetaryValue: true, currency: true },
    });

    if (!frame || frame.monetaryValue == null) return null;

    return {
      value: Number(frame.monetaryValue),
      currency: frame.currency ?? 'GBP',
    };
  } catch (error) {
    const code = (error as { code?: string }).code;
    const msg = error instanceof Error ? error.message : String(error);
    if (code === 'P2021' || code === 'P2022' || msg.includes('does not exist')) {
      log.debug('Schema drift fetching monetary value — skipping');
    } else {
      log.warn('Failed to fetch monetary value:', error);
    }
    return null;
  }
}

/**
 * Wilson score confidence interval approximation.
 * Returns a confidence value 0-1 based on sample size and observed rate.
 *
 * For small samples (< 5), confidence is low.
 * For large samples (> 50), confidence approaches 1.
 */
function wilsonConfidence(sampleSize: number, successes: number, total: number): number {
  if (total === 0 || sampleSize === 0) return 0;

  // Base confidence from sample size (logistic curve centered at ~20)
  const sizeConfidence = 1 / (1 + Math.exp(-0.15 * (sampleSize - 10)));

  // Effect size confidence: larger differences between rates are more reliable
  const pHat = successes / total;
  // Wilson interval half-width (z=1.96 for 95% CI)
  const z = 1.96;
  const denominator = 1 + (z * z) / total;
  // center not needed for confidence calc, only halfWidth matters
  const halfWidth =
    (z * Math.sqrt((pHat * (1 - pHat) + (z * z) / (4 * total)) / total)) / denominator;

  // Narrower interval = higher confidence
  const intervalConfidence = halfWidth > 0 ? Math.max(0, 1 - halfWidth * 2) : 0;

  // Combine: geometric mean of size and interval confidence
  return Number(Math.sqrt(sizeConfidence * intervalConfidence).toFixed(3));
}
