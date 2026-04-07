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
  /** Whether observable confounders were controlled for in this estimate */
  confoundersControlled?: string[];
  /** Quality of stratification: 'full' if all outcomes had metadata, 'partial' if some, 'none' if unstratified */
  stratificationQuality?: 'full' | 'partial' | 'none';
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
    document?: { documentType?: string | null; deal?: { sector?: string | null } | null } | null;
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
        analysis: {
          include: {
            document: {
              select: { documentType: true, deal: { select: { sector: true } } },
            },
          },
        },
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
      const biases = outcome.analysis?.biases;
      if (!biases || typeof biases !== 'object') continue;
      const biasTypes = Object.keys(biases);

      for (const biasType of biasTypes) {
        const stats = biasStats.get(biasType) ?? { failures: 0, successes: 0, partials: 0 };
        if (outcome.outcome === 'failure') stats.failures++;
        else if (outcome.outcome === 'success') stats.successes++;
        else stats.partials++;
        biasStats.set(biasType, stats);
      }
    }

    // Stratified correlation (Cochran-Mantel-Haenszel approach)
    // Group outcomes by observable confounders to protect against Simpson's paradox
    const stratumKey = (o: OutcomeRecord): string => {
      const docType = o.analysis?.document?.documentType || 'unknown';
      const sector = o.analysis?.document?.deal?.sector || 'unknown';
      return `${docType}::${sector}`;
    };

    const strata = new Map<string, OutcomeRecord[]>();
    let hasStratificationMetadata = 0;
    for (const o of outcomesList) {
      const key = stratumKey(o);
      if (key !== 'unknown::unknown') hasStratificationMetadata++;
      if (!strata.has(key)) strata.set(key, []);
      strata.get(key)!.push(o);
    }

    const stratificationQuality: 'full' | 'partial' | 'none' =
      hasStratificationMetadata === totalOutcomes
        ? 'full'
        : hasStratificationMetadata > 0
          ? 'partial'
          : 'none';

    const confoundersControlled =
      stratificationQuality !== 'none' ? ['documentType', 'sector'] : [];

    const weights: CausalWeight[] = [];
    for (const [biasType, stats] of biasStats.entries()) {
      const total = stats.failures + stats.successes + stats.partials;
      if (total === 0) continue;

      // Compute stratified correlation if metadata available, else use flat
      let outcomeCorrelation: number;
      let dangerMultiplier: number;

      if (stratificationQuality !== 'none' && strata.size > 1) {
        // Weighted average of within-stratum correlations
        let weightedCorr = 0;
        let weightedDanger = 0;
        let totalStratumWeight = 0;

        for (const [, stratumOutcomes] of strata) {
          const stratumTotal = stratumOutcomes.length;
          if (stratumTotal < 2) continue;

          const stratumSuccesses = stratumOutcomes.filter(o => o.outcome === 'success').length;
          const stratumBaseRate = stratumSuccesses / stratumTotal;
          const stratumBaseFailRate = 1 - stratumBaseRate;

          let biasSuccInStratum = 0;
          let biasFailInStratum = 0;
          let biasTotalInStratum = 0;

          for (const o of stratumOutcomes) {
            const biases = o.analysis?.biases;
            if (!biases || typeof biases !== 'object') continue;
            if (!Object.keys(biases).includes(biasType)) continue;
            biasTotalInStratum++;
            if (o.outcome === 'success') biasSuccInStratum++;
            if (o.outcome === 'failure') biasFailInStratum++;
          }

          if (biasTotalInStratum === 0) continue;

          const stratumBiasSuccRate = biasSuccInStratum / biasTotalInStratum;
          const stratumBiasFailRate = biasFailInStratum / biasTotalInStratum;

          weightedCorr += (stratumBiasSuccRate - stratumBaseRate) * stratumTotal;
          weightedDanger +=
            (stratumBaseFailRate > 0 ? stratumBiasFailRate / stratumBaseFailRate : 1.0) *
            stratumTotal;
          totalStratumWeight += stratumTotal;
        }

        if (totalStratumWeight > 0) {
          outcomeCorrelation = Number((weightedCorr / totalStratumWeight).toFixed(3));
          dangerMultiplier = Number((weightedDanger / totalStratumWeight).toFixed(2));
        } else {
          // Fallback to unstratified
          const biasSuccessRate = stats.successes / total;
          const biasFailureRate = stats.failures / total;
          outcomeCorrelation = Number((biasSuccessRate - baseSuccessRate).toFixed(3));
          dangerMultiplier =
            baseFailureRate > 0
              ? Number((biasFailureRate / baseFailureRate).toFixed(2))
              : biasFailureRate > 0
                ? 2.0
                : 1.0;
        }
      } else {
        // Unstratified (original logic)
        const biasSuccessRate = stats.successes / total;
        const biasFailureRate = stats.failures / total;
        outcomeCorrelation = Number((biasSuccessRate - baseSuccessRate).toFixed(3));
        dangerMultiplier =
          baseFailureRate > 0
            ? Number((biasFailureRate / baseFailureRate).toFixed(2))
            : biasFailureRate > 0
              ? 2.0
              : 1.0;
      }

      weights.push({
        biasType,
        outcomeCorrelation,
        failureCount: stats.failures,
        successCount: stats.successes,
        dangerMultiplier,
        sampleSize: total,
        confoundersControlled,
        stratificationQuality,
      });
    }

    // --- Pairwise interaction detection ---
    const biasTypesList = Array.from(biasStats.keys());
    const outcomeBiasSets = outcomesList
      .filter(o => o.analysis?.biases && typeof o.analysis.biases === 'object')
      .map(o => ({
        biasTypes: new Set(Object.keys(o.analysis!.biases as object)),
        outcome: o.outcome,
      }));

    for (let i = 0; i < biasTypesList.length; i++) {
      for (let j = i + 1; j < biasTypesList.length; j++) {
        const biasA = biasTypesList[i];
        const biasB = biasTypesList[j];

        let jointTotal = 0;
        let jointFailures = 0;
        let jointSuccesses = 0;
        for (const entry of outcomeBiasSets) {
          if (entry.biasTypes.has(biasA) && entry.biasTypes.has(biasB)) {
            jointTotal++;
            if (entry.outcome === 'failure') jointFailures++;
            else if (entry.outcome === 'success') jointSuccesses++;
          }
        }

        if (jointTotal < 5) continue;

        const jointFailureRate = jointFailures / jointTotal;
        const statsA = biasStats.get(biasA)!;
        const statsB = biasStats.get(biasB)!;
        const totalA = statsA.failures + statsA.successes + statsA.partials;
        const totalB = statsB.failures + statsB.successes + statsB.partials;
        if (totalA === 0 || totalB === 0) continue;
        const expectedRate = (statsA.failures / totalA) * (statsB.failures / totalB);

        if (expectedRate === 0) continue;
        const interactionStrength = jointFailureRate / expectedRate;

        if (interactionStrength > 1.3) {
          weights.push({
            biasType: [biasA, biasB].sort().join('+'),
            outcomeCorrelation: Number((jointFailureRate - baseFailureRate).toFixed(3)),
            failureCount: jointFailures,
            successCount: jointSuccesses,
            dangerMultiplier: Number(interactionStrength.toFixed(2)),
            sampleSize: jointTotal,
          });
        }
      }
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
    const model = await prisma.orgCausalModel.findUnique({
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
      (model.weights as unknown as CausalWeight[]).map(w => [w.biasType, w.dangerMultiplier])
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

    const weightsJson = JSON.parse(JSON.stringify(weights));
    const insightsJson = JSON.parse(JSON.stringify(insights));
    const result = await prisma.orgCausalModel.upsert({
      where: { orgId },
      create: {
        orgId,
        weights: weightsJson,
        insights: insightsJson,
        totalOutcomes,
      },
      update: {
        weights: weightsJson,
        insights: insightsJson,
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

    // --- Pairwise interaction detection ---
    // Discover bias pairs that are synergistically more dangerous than
    // expected from individual rates (super-additive risk).
    const biasTypesList = Array.from(biasOutcomes.keys());
    const outcomeBiasSets = outcomes.map(o => ({
      biasTypes: new Set(o.analysis.biases.map((b: { biasType: string }) => b.biasType)),
      outcome: o.outcome,
    }));

    for (let i = 0; i < biasTypesList.length; i++) {
      for (let j = i + 1; j < biasTypesList.length; j++) {
        const biasA = biasTypesList[i];
        const biasB = biasTypesList[j];

        let jointTotal = 0;
        let jointFailures = 0;
        let jointSuccesses = 0;
        for (const entry of outcomeBiasSets) {
          if (entry.biasTypes.has(biasA) && entry.biasTypes.has(biasB)) {
            jointTotal++;
            if (entry.outcome === 'failure') jointFailures++;
            else if (entry.outcome === 'success') jointSuccesses++;
          }
        }

        if (jointTotal < 5) continue;

        const jointFailureRate = jointFailures / jointTotal;
        const statsA = biasOutcomes.get(biasA)!;
        const statsB = biasOutcomes.get(biasB)!;
        const totalA = statsA.failures + statsA.successes + statsA.partials;
        const totalB = statsB.failures + statsB.successes + statsB.partials;
        const rateA = statsA.failures / totalA;
        const rateB = statsB.failures / totalB;
        const expectedRate = rateA * rateB;

        if (expectedRate === 0) continue;
        const interactionStrength = jointFailureRate / expectedRate;

        // Only record pairs that are >=30% more dangerous than independence predicts
        if (interactionStrength > 1.3) {
          weights.push({
            biasType: [biasA, biasB].sort().join('+'),
            outcomeCorrelation: Number((jointFailureRate - baseFailureRate).toFixed(3)),
            failureCount: jointFailures,
            successCount: jointSuccesses,
            dangerMultiplier: Number(interactionStrength.toFixed(2)),
            sampleSize: jointTotal,
          });
        }
      }
    }

    weights.sort((a, b) => b.dangerMultiplier - a.dangerMultiplier);

    log.info(
      `Causal edges learned for org ${orgId}: ${weights.length} bias types (incl. pairs) from ${outcomes.length} outcomes`
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

// ─── Structural Causal Model (SCM) ──────────────────────────────────────────
//
// Upgrades from correlation-based weights to Pearl-style causal DAGs.
// Uses constraint-based causal discovery (PC-algorithm variant) when
// sufficient outcome data exists.
//
// Sample thresholds:
//   < 20 outcomes: correlation-only (existing behavior)
//   20-50: basic DAG construction, low confidence
//   50+: full SCM with do-calculus interventional queries
// ────────────────────────────────────────────────────────────────────────────

export interface CausalEdge {
  from: string;
  to: string;
  strength: number; // 0-1
  confounders: string[];
}

export interface CausalDAGResult {
  orgId: string;
  nodes: string[];
  edges: CausalEdge[];
  sampleSize: number;
  algorithm: 'constraint_based' | 'correlation_fallback';
  confidence: number; // 0-1
}

export interface Intervention {
  /** Biases to "remove" via do-operator */
  remove: string[];
  /** Context factors to set (optional) */
  add?: string[];
}

export interface InterventionResult {
  /** P(outcome=success | do(remove biases)) */
  successProbability: number;
  /** P(outcome=success) without intervention */
  baselineSuccessProbability: number;
  /** Delta improvement */
  improvement: number;
  /** Confounders adjusted for */
  confoundersAdjusted: string[];
  /** Confidence in the estimate */
  confidence: number;
  /** Method used */
  method: 'scm_do_calculus' | 'correlation_estimate';
}

/**
 * Chi-squared independence test for 2x2 contingency table.
 * Returns p-value approximation.
 */
function chiSquaredIndependence(
  a: number, // X=1, Y=1
  b: number, // X=1, Y=0
  c: number, // X=0, Y=1
  d: number // X=0, Y=0
): number {
  const n = a + b + c + d;
  if (n === 0) return 1.0;

  const r1 = a + b;
  const r2 = c + d;
  const c1 = a + c;
  const c2 = b + d;

  if (r1 === 0 || r2 === 0 || c1 === 0 || c2 === 0) return 1.0;

  // Yates' corrected chi-squared for small samples
  const chi2 = (n * Math.pow(Math.abs(a * d - b * c) - n / 2, 2)) / (r1 * r2 * c1 * c2);

  // Approximate p-value using chi-squared CDF with 1 df
  // Using Wilson-Hilferty approximation
  if (chi2 <= 0) return 1.0;
  // Wilson-Hilferty approximation for chi-squared CDF with 1 df
  const k = 1; // degrees of freedom
  const z = (Math.pow(chi2 / k, 1 / 3) - (1 - 2 / (9 * k))) / Math.sqrt(2 / (9 * k));
  const pValue = 1 - 0.5 * (1 + erf(z / Math.sqrt(2)));
  return Math.max(0, Math.min(1, pValue));
}

/** Error function approximation (Abramowitz and Stegun) */
function erf(x: number): number {
  const t = 1.0 / (1.0 + 0.3275911 * Math.abs(x));
  const poly =
    t *
    (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const result = 1.0 - poly * Math.exp(-x * x);
  return x >= 0 ? result : -result;
}

/**
 * Build a Structural Causal DAG for an organization using constraint-based
 * causal discovery (PC-algorithm variant).
 *
 * 1. Fetch all outcomes for org
 * 2. Build variable matrix (bias present/absent, context factors, outcome)
 * 3. Conditional independence tests to remove spurious edges
 * 4. Orient edges using causal orientation rules
 * 5. Persist to CausalDAG table
 */
export async function buildCausalDAG(orgId: string): Promise<CausalDAGResult | null> {
  try {
    // Fetch outcomes with analyses
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

    if (outcomes.length < 20) {
      log.info(
        `Insufficient outcomes for SCM (${outcomes.length}/20 required) for org ${orgId}. Falling back to correlation.`
      );
      return null;
    }

    // Build variable matrix
    // Columns: each unique bias type + "outcome" (1=success, 0=failure)
    const allBiasTypes = new Set<string>();
    for (const o of outcomes) {
      for (const b of o.analysis.biases) {
        allBiasTypes.add(b.biasType);
      }
    }

    // Filter to biases that appear in at least 3 decisions
    const biasCounts = new Map<string, number>();
    for (const o of outcomes) {
      const types = new Set(o.analysis.biases.map((b: { biasType: string }) => b.biasType));
      for (const t of types) {
        biasCounts.set(t, (biasCounts.get(t) ?? 0) + 1);
      }
    }
    const significantBiases = [...allBiasTypes].filter(b => (biasCounts.get(b) ?? 0) >= 3);

    if (significantBiases.length < 2) {
      log.info('Too few significant biases for DAG construction');
      return null;
    }

    const nodes = [...significantBiases, 'outcome'];

    // Build observation matrix: rows = outcomes, cols = variables (0/1)
    const matrix: number[][] = [];
    for (const o of outcomes) {
      const biasSet = new Set(o.analysis.biases.map((b: { biasType: string }) => b.biasType));
      const row: number[] = [];
      for (const biasType of significantBiases) {
        row.push(biasSet.has(biasType) ? 1 : 0);
      }
      row.push(o.outcome === 'success' ? 1 : 0); // outcome column
      matrix.push(row);
    }

    // Phase 1: Start with complete undirected graph, remove edges via
    // conditional independence tests (PC-algorithm skeleton)
    const n = nodes.length;
    const adjacency: boolean[][] = Array.from({ length: n }, () =>
      Array.from({ length: n }, () => true)
    );
    // No self-loops
    for (let i = 0; i < n; i++) adjacency[i][i] = false;

    const SIGNIFICANCE_THRESHOLD = 0.05;

    // Test pairwise independence
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (!adjacency[i][j]) continue;

        // Build 2x2 contingency table for X_i and X_j
        let a = 0,
          b = 0,
          c = 0,
          d = 0;
        for (const row of matrix) {
          if (row[i] === 1 && row[j] === 1) a++;
          else if (row[i] === 1 && row[j] === 0) b++;
          else if (row[i] === 0 && row[j] === 1) c++;
          else d++;
        }

        const pValue = chiSquaredIndependence(a, b, c, d);
        if (pValue > SIGNIFICANCE_THRESHOLD) {
          // Variables are independent — remove edge
          adjacency[i][j] = false;
          adjacency[j][i] = false;
        }
      }
    }

    // Phase 2: Conditional independence tests (condition on each third variable)
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (!adjacency[i][j]) continue;

        for (let k = 0; k < n; k++) {
          if (k === i || k === j) continue;
          if (!adjacency[i][k] && !adjacency[j][k]) continue;

          // Test X_i ⊥ X_j | X_k
          // Split data by X_k=0 and X_k=1, test independence in each stratum
          let a0 = 0,
            b0 = 0,
            c0 = 0,
            d0 = 0;
          let a1 = 0,
            b1 = 0,
            c1 = 0,
            d1 = 0;

          for (const row of matrix) {
            if (row[k] === 0) {
              if (row[i] === 1 && row[j] === 1) a0++;
              else if (row[i] === 1 && row[j] === 0) b0++;
              else if (row[i] === 0 && row[j] === 1) c0++;
              else d0++;
            } else {
              if (row[i] === 1 && row[j] === 1) a1++;
              else if (row[i] === 1 && row[j] === 0) b1++;
              else if (row[i] === 0 && row[j] === 1) c1++;
              else d1++;
            }
          }

          const p0 = chiSquaredIndependence(a0, b0, c0, d0);
          const p1 = chiSquaredIndependence(a1, b1, c1, d1);

          // If independent in both strata, remove edge (conditionally independent)
          if (p0 > SIGNIFICANCE_THRESHOLD && p1 > SIGNIFICANCE_THRESHOLD) {
            adjacency[i][j] = false;
            adjacency[j][i] = false;
            break; // Found a separating set, move on
          }
        }
      }
    }

    // Phase 3: Orient edges toward "outcome" node and apply v-structure rules
    const edges: CausalEdge[] = [];
    const outcomeIdx = nodes.indexOf('outcome');

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (!adjacency[i][j]) continue;

        // Compute edge strength from correlation
        let bothPresent = 0,
          iOnly = 0,
          jOnly = 0;
        for (const row of matrix) {
          if (row[i] === 1 && row[j] === 1) bothPresent++;
          else if (row[i] === 1) iOnly++;
          else if (row[j] === 1) jOnly++;
        }
        const total = matrix.length;
        const pI = (bothPresent + iOnly) / total;
        const pJ = (bothPresent + jOnly) / total;
        const pIJ = bothPresent / total;
        const correlation =
          Math.abs(pIJ - pI * pJ) / Math.max(0.01, Math.sqrt(pI * (1 - pI) * pJ * (1 - pJ)));
        const strength = Math.min(1.0, correlation);

        // Find confounders: variables connected to both i and j
        const confounders: string[] = [];
        for (let k = 0; k < n; k++) {
          if (k === i || k === j) continue;
          if (adjacency[i][k] && adjacency[j][k]) {
            confounders.push(nodes[k]);
          }
        }

        // Orient: biases → outcome (domain knowledge: biases cause outcomes, not vice versa)
        if (j === outcomeIdx) {
          edges.push({
            from: nodes[i],
            to: 'outcome',
            strength: Math.round(strength * 1000) / 1000,
            confounders,
          });
        } else if (i === outcomeIdx) {
          edges.push({
            from: nodes[j],
            to: 'outcome',
            strength: Math.round(strength * 1000) / 1000,
            confounders,
          });
        } else {
          // Between biases: use frequency-based ordering (more common → less common)
          const countI = biasCounts.get(nodes[i]) ?? 0;
          const countJ = biasCounts.get(nodes[j]) ?? 0;
          edges.push({
            from: countI >= countJ ? nodes[i] : nodes[j],
            to: countI >= countJ ? nodes[j] : nodes[i],
            strength: Math.round(strength * 1000) / 1000,
            confounders,
          });
        }
      }
    }

    // Confidence based on sample size
    const confidence = outcomes.length >= 50 ? 0.85 : outcomes.length >= 30 ? 0.65 : 0.45;

    const result: CausalDAGResult = {
      orgId,
      nodes,
      edges,
      sampleSize: outcomes.length,
      algorithm: 'constraint_based',
      confidence,
    };

    // Persist to database
    try {
      await (
        prisma as unknown as {
          causalDAG: {
            upsert: (args: {
              where: { orgId: string };
              create: {
                orgId: string;
                nodes: string[];
                edges: unknown;
                sampleSize: number;
                algorithm: string;
              };
              update: { nodes: string[]; edges: unknown; sampleSize: number; algorithm: string };
            }) => Promise<unknown>;
          };
        }
      ).causalDAG.upsert({
        where: { orgId },
        create: {
          orgId,
          nodes,
          edges: edges as unknown as Record<string, unknown>[],
          sampleSize: outcomes.length,
          algorithm: 'constraint_based',
        },
        update: {
          nodes,
          edges: edges as unknown as Record<string, unknown>[],
          sampleSize: outcomes.length,
          algorithm: 'constraint_based',
        },
      });
    } catch (persistError) {
      const code = (persistError as { code?: string }).code;
      if (code === 'P2021' || code === 'P2022') {
        log.debug('CausalDAG table not yet migrated — returning result without persistence');
      } else {
        log.warn('Failed to persist CausalDAG:', persistError);
      }
    }

    log.info(
      `Built causal DAG for org ${orgId}: ${nodes.length} nodes, ${edges.length} edges, ${outcomes.length} outcomes`
    );

    return result;
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'P2021' || code === 'P2022') {
      log.debug('Schema drift in buildCausalDAG');
      return null;
    }
    log.error('Failed to build causal DAG:', error);
    return null;
  }
}

/**
 * Perform do-calculus interventional query using the org's causal DAG.
 *
 * Answers: "What would happen if we removed these biases?"
 * Uses backdoor adjustment: P(Y | do(X)) = Σ_Z P(Y | X, Z) P(Z)
 * where Z is the backdoor adjustment set.
 */
export async function doCalculus(
  orgId: string,
  intervention: Intervention
): Promise<InterventionResult | null> {
  try {
    // Load the org's causal DAG
    let dag: CausalDAGResult | null = null;

    try {
      const stored = await (
        prisma as unknown as {
          causalDAG: {
            findUnique: (args: { where: { orgId: string } }) => Promise<{
              nodes: string[];
              edges: unknown;
              sampleSize: number;
              algorithm: string;
            } | null>;
          };
        }
      ).causalDAG.findUnique({
        where: { orgId },
      });

      if (stored) {
        dag = {
          orgId,
          nodes: stored.nodes,
          edges: stored.edges as CausalEdge[],
          sampleSize: stored.sampleSize,
          algorithm: stored.algorithm as 'constraint_based' | 'correlation_fallback',
          confidence: stored.sampleSize >= 50 ? 0.85 : stored.sampleSize >= 30 ? 0.65 : 0.45,
        };
      }
    } catch {
      // CausalDAG table may not exist yet
    }

    if (!dag) {
      // Try building it on the fly
      dag = await buildCausalDAG(orgId);
    }

    if (!dag) {
      // Fall back to correlation-based estimate
      return correlationBasedIntervention(orgId, intervention);
    }

    // Identify the backdoor adjustment set
    // For each intervention variable, find parents in the DAG that are not descendants
    const interventionSet = new Set(intervention.remove);
    const outcomeEdges = dag.edges.filter(e => e.to === 'outcome');
    const confounders = new Set<string>();

    for (const edge of outcomeEdges) {
      if (interventionSet.has(edge.from)) {
        for (const c of edge.confounders) {
          if (!interventionSet.has(c) && c !== 'outcome') {
            confounders.add(c);
          }
        }
      }
    }

    // Fetch outcome data for computation
    const outcomes = await prisma.decisionOutcome.findMany({
      where: { orgId },
      include: {
        analysis: {
          include: {
            biases: { select: { biasType: true } },
          },
        },
      },
    });

    if (outcomes.length === 0) return null;

    // Baseline success probability
    const totalSuccesses = outcomes.filter(o => o.outcome === 'success').length;
    const baselineSuccessProbability = totalSuccesses / outcomes.length;

    // Backdoor adjustment: P(Y=success | do(remove biases))
    // = Σ_z P(Y=success | biases absent, Z=z) * P(Z=z)
    // Simplified: compute success rate when intervention biases are absent,
    // stratified by confounder values
    const interventionBiases = intervention.remove;

    // Filter to outcomes where none of the intervention biases are present
    const interventionOutcomes = outcomes.filter(o => {
      const biasSet = new Set(o.analysis.biases.map((b: { biasType: string }) => b.biasType));
      return !interventionBiases.some(b => biasSet.has(b));
    });

    if (interventionOutcomes.length < 3) {
      // Not enough counterfactual data
      return {
        successProbability: baselineSuccessProbability,
        baselineSuccessProbability,
        improvement: 0,
        confoundersAdjusted: [...confounders],
        confidence: 0.2,
        method: 'scm_do_calculus',
      };
    }

    // If we have confounders, do stratified estimation
    let adjustedSuccessProb: number;

    if (confounders.size > 0) {
      // Stratified backdoor adjustment
      const confounderList = [...confounders];
      // For simplicity with binary variables, stratify on the first 2 confounders
      const stratifyOn = confounderList.slice(0, 2);

      let weightedSum = 0;
      let totalWeight = 0;

      // Generate all combinations of stratification variables
      const combos =
        stratifyOn.length === 0
          ? [{}]
          : stratifyOn.length === 1
            ? [{ [stratifyOn[0]]: 0 }, { [stratifyOn[0]]: 1 }]
            : [
                { [stratifyOn[0]]: 0, [stratifyOn[1]]: 0 },
                { [stratifyOn[0]]: 0, [stratifyOn[1]]: 1 },
                { [stratifyOn[0]]: 1, [stratifyOn[1]]: 0 },
                { [stratifyOn[0]]: 1, [stratifyOn[1]]: 1 },
              ];

      for (const combo of combos) {
        // Filter outcomes matching this stratum AND intervention (biases absent)
        const strataOutcomes = interventionOutcomes.filter(o => {
          const biasSet = new Set(o.analysis.biases.map((b: { biasType: string }) => b.biasType));
          return Object.entries(combo).every(([bias, present]) =>
            present ? biasSet.has(bias) : !biasSet.has(bias)
          );
        });

        // P(Z=z) from full dataset
        const strataAll = outcomes.filter(o => {
          const biasSet = new Set(o.analysis.biases.map((b: { biasType: string }) => b.biasType));
          return Object.entries(combo).every(([bias, present]) =>
            present ? biasSet.has(bias) : !biasSet.has(bias)
          );
        });

        if (strataOutcomes.length > 0 && strataAll.length > 0) {
          const strataSuccessRate =
            strataOutcomes.filter(o => o.outcome === 'success').length / strataOutcomes.length;
          const strataWeight = strataAll.length / outcomes.length;
          weightedSum += strataSuccessRate * strataWeight;
          totalWeight += strataWeight;
        }
      }

      adjustedSuccessProb =
        totalWeight > 0 ? weightedSum / totalWeight : baselineSuccessProbability;
    } else {
      // Simple counterfactual: success rate when intervention biases are absent
      adjustedSuccessProb =
        interventionOutcomes.filter(o => o.outcome === 'success').length /
        interventionOutcomes.length;
    }

    const improvement = adjustedSuccessProb - baselineSuccessProbability;
    const confidence = Math.min(
      0.9,
      dag.confidence * (interventionOutcomes.length / Math.max(20, outcomes.length))
    );

    return {
      successProbability: Math.round(adjustedSuccessProb * 1000) / 1000,
      baselineSuccessProbability: Math.round(baselineSuccessProbability * 1000) / 1000,
      improvement: Math.round(improvement * 1000) / 1000,
      confoundersAdjusted: [...confounders],
      confidence: Math.round(confidence * 100) / 100,
      method: 'scm_do_calculus',
    };
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'P2021' || code === 'P2022') {
      log.debug('Schema drift in doCalculus');
      return null;
    }
    log.error('Failed to run do-calculus:', error);
    return null;
  }
}

/**
 * Fallback correlation-based intervention estimate when SCM is not available.
 */
async function correlationBasedIntervention(
  orgId: string,
  intervention: Intervention
): Promise<InterventionResult | null> {
  try {
    const weights = await computeOrgCausalWeights(orgId);
    if (weights.length === 0) return null;

    const outcomes = await prisma.decisionOutcome.findMany({
      where: { orgId },
      select: { outcome: true },
    });

    const totalSuccesses = outcomes.filter(o => o.outcome === 'success').length;
    const baselineSuccessProbability = outcomes.length > 0 ? totalSuccesses / outcomes.length : 0.5;

    // Estimate improvement from removing biases based on their danger multipliers
    let estimatedImprovement = 0;
    for (const biasToRemove of intervention.remove) {
      const weight = weights.find(w => w.biasType === biasToRemove);
      if (weight && weight.dangerMultiplier > 1.0) {
        // Each removed dangerous bias improves success rate proportionally
        estimatedImprovement += (weight.dangerMultiplier - 1.0) * 0.05;
      }
    }

    const successProbability = Math.min(1.0, baselineSuccessProbability + estimatedImprovement);

    return {
      successProbability: Math.round(successProbability * 1000) / 1000,
      baselineSuccessProbability: Math.round(baselineSuccessProbability * 1000) / 1000,
      improvement: Math.round(estimatedImprovement * 1000) / 1000,
      confoundersAdjusted: [],
      confidence: Math.min(0.5, outcomes.length / 100),
      method: 'correlation_estimate',
    };
  } catch (error) {
    log.error('Failed correlation-based intervention:', error);
    return null;
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatBiasName(biasType: string): string {
  return biasType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
