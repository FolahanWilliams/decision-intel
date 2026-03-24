/**
 * Nudge A/B Testing Framework
 *
 * Assigns users to experiment variants and tracks effectiveness.
 * Auto-optimizes: when a variant proves significantly better,
 * gradually shift traffic toward it (Thompson sampling).
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('NudgeABTesting');

// ─── Types ──────────────────────────────────────────────────────────────────

export interface NudgeVariant {
  id: string;
  label: string;
  template: string;
  severity: string;
}

export interface ExperimentResult {
  variantId: string;
  label: string;
  impressions: number;
  acknowledged: number;
  helpful: number;
  beliefDeltaAvg: number;
  effectivenessRate: number; // helpful / impressions
}

// ─── Core Functions ─────────────────────────────────────────────────────────

/**
 * Select a variant for a given user and nudge type.
 * Uses deterministic hashing (userId + experimentId) for consistent
 * assignment, then applies traffic split percentages.
 */
export async function selectVariant(
  nudgeType: string,
  userId: string
): Promise<{ experimentId: string; variant: NudgeVariant } | null> {
  try {
    // Find active experiment for this nudge type
    let experiment: {
      id: string;
      variants: unknown;
      trafficSplit: unknown;
    } | null = null;

    try {
      experiment = await prisma.nudgeExperiment.findFirst({
        where: {
          nudgeType,
          status: 'active',
        },
        select: {
          id: true,
          variants: true,
          trafficSplit: true,
        },
      });
    } catch (err) {
      const code = (err as { code?: string }).code;
      const msg = err instanceof Error ? err.message : String(err);
      if (code === 'P2021' || code === 'P2022' || msg.includes('does not exist')) {
        log.debug('Schema drift in selectVariant — NudgeExperiment table not available');
        return null;
      }
      throw err;
    }

    if (!experiment) return null;

    const variants = experiment.variants as NudgeVariant[];
    const trafficSplit = experiment.trafficSplit as Record<string, number>;

    if (!variants || variants.length === 0) return null;

    // Deterministic hash: userId + experimentId → 0-99 bucket
    const bucket = deterministicBucket(userId + experiment.id);

    // Map bucket to variant via traffic split percentages
    let cumulative = 0;
    for (const variant of variants) {
      cumulative += trafficSplit[variant.id] ?? 0;
      if (bucket < cumulative) {
        return { experimentId: experiment.id, variant };
      }
    }

    // Fallback to last variant if rounding leaves us past all splits
    return {
      experimentId: experiment.id,
      variant: variants[variants.length - 1],
    };
  } catch (error) {
    const code = (error as { code?: string }).code;
    const msg = error instanceof Error ? error.message : String(error);

    if (code === 'P2021' || code === 'P2022' || msg.includes('does not exist')) {
      log.debug('Schema drift in selectVariant — table not available');
      return null;
    }

    log.warn('Failed to select variant:', error);
    return null;
  }
}

/**
 * Compute experiment results by querying Nudge records
 * with experimentId and variantId fields.
 */
export async function getExperimentResults(experimentId: string): Promise<ExperimentResult[]> {
  try {
    // Fetch the experiment to get variant labels
    let experiment: {
      id: string;
      variants: unknown;
    } | null = null;

    try {
      experiment = await prisma.nudgeExperiment.findUnique({
        where: { id: experimentId },
        select: { id: true, variants: true },
      });
    } catch (err) {
      const code = (err as { code?: string }).code;
      const msg = err instanceof Error ? err.message : String(err);
      if (code === 'P2021' || code === 'P2022' || msg.includes('does not exist')) {
        log.debug('Schema drift in getExperimentResults — NudgeExperiment not available');
        return [];
      }
      throw err;
    }

    if (!experiment) return [];

    const variants = experiment.variants as NudgeVariant[];
    const variantMap = new Map(variants.map(v => [v.id, v.label]));

    // Query all nudges for this experiment
    let nudges: Array<{
      variantId: string | null;
      acknowledgedAt: Date | null;
      wasHelpful: boolean | null;
      humanDecisionId: string | null;
    }> = [];

    try {
      nudges = await prisma.nudge.findMany({
        where: { experimentId },
        select: {
          variantId: true,
          acknowledgedAt: true,
          wasHelpful: true,
          humanDecisionId: true,
        },
      });
    } catch (err) {
      const code = (err as { code?: string }).code;
      const msg = err instanceof Error ? err.message : String(err);
      if (code === 'P2021' || code === 'P2022' || msg.includes('does not exist')) {
        log.debug('Schema drift querying Nudge experimentId — column not available');
        return [];
      }
      throw err;
    }

    // Collect humanDecisionIds to look up beliefDelta via DecisionPrior
    const decisionIds = nudges.map(n => n.humanDecisionId).filter((id): id is string => id != null);

    const beliefDeltas: Map<string, number> = new Map();
    if (decisionIds.length > 0) {
      try {
        // HumanDecision → linkedAnalysisId → DecisionPrior.beliefDelta
        const decisions = await prisma.humanDecision.findMany({
          where: { id: { in: decisionIds } },
          select: { id: true, linkedAnalysisId: true },
        });

        const analysisIds = decisions
          .map(d => d.linkedAnalysisId)
          .filter((id): id is string => id != null);

        if (analysisIds.length > 0) {
          const priors = await prisma.decisionPrior.findMany({
            where: { analysisId: { in: analysisIds } },
            select: { analysisId: true, beliefDelta: true },
          });

          const analysisToDecision = new Map(
            decisions.filter(d => d.linkedAnalysisId).map(d => [d.linkedAnalysisId!, d.id])
          );

          for (const prior of priors) {
            const decId = analysisToDecision.get(prior.analysisId);
            if (decId && prior.beliefDelta != null) {
              beliefDeltas.set(decId, prior.beliefDelta);
            }
          }
        }
      } catch {
        // beliefDelta lookup is best-effort
        log.debug('Could not look up beliefDelta for experiment results');
      }
    }

    // Group nudges by variantId
    const grouped: Record<
      string,
      {
        impressions: number;
        acknowledged: number;
        helpful: number;
        beliefDeltas: number[];
      }
    > = {};

    for (const variant of variants) {
      grouped[variant.id] = {
        impressions: 0,
        acknowledged: 0,
        helpful: 0,
        beliefDeltas: [],
      };
    }

    for (const nudge of nudges) {
      const vid = nudge.variantId;
      if (!vid || !grouped[vid]) continue;

      grouped[vid].impressions++;
      if (nudge.acknowledgedAt) grouped[vid].acknowledged++;
      if (nudge.wasHelpful === true) grouped[vid].helpful++;

      if (nudge.humanDecisionId) {
        const delta = beliefDeltas.get(nudge.humanDecisionId);
        if (delta != null) grouped[vid].beliefDeltas.push(delta);
      }
    }

    // Build results
    const results: ExperimentResult[] = variants.map(variant => {
      const stats = grouped[variant.id];
      const beliefDeltaAvg =
        stats.beliefDeltas.length > 0
          ? Number(
              (stats.beliefDeltas.reduce((s, v) => s + v, 0) / stats.beliefDeltas.length).toFixed(2)
            )
          : 0;

      return {
        variantId: variant.id,
        label: variantMap.get(variant.id) ?? variant.id,
        impressions: stats.impressions,
        acknowledged: stats.acknowledged,
        helpful: stats.helpful,
        beliefDeltaAvg,
        effectivenessRate:
          stats.impressions > 0 ? Number((stats.helpful / stats.impressions).toFixed(3)) : 0,
      };
    });

    return results;
  } catch (error) {
    const code = (error as { code?: string }).code;
    const msg = error instanceof Error ? error.message : String(error);

    if (code === 'P2021' || code === 'P2022' || msg.includes('does not exist')) {
      log.debug('Schema drift in getExperimentResults — table not available');
      return [];
    }

    log.error('Failed to get experiment results:', error);
    throw error;
  }
}

/**
 * Auto-optimize: shift traffic toward better-performing variants.
 * Uses simplified Thompson sampling — variant with highest
 * (helpful + 1) / (impressions + 2) gets proportionally more traffic.
 */
export async function autoOptimizeExperiment(experimentId: string): Promise<void> {
  try {
    const results = await getExperimentResults(experimentId);

    if (results.length === 0) return;

    // Minimum total impressions before optimizing
    const totalImpressions = results.reduce((s, r) => s + r.impressions, 0);
    if (totalImpressions < 20) {
      log.info(
        `Experiment ${experimentId}: only ${totalImpressions} impressions, skipping optimization`
      );
      return;
    }

    // Thompson sampling scores: (helpful + 1) / (impressions + 2)
    const scores = results.map(r => ({
      variantId: r.variantId,
      score: (r.helpful + 1) / (r.impressions + 2),
    }));

    const totalScore = scores.reduce((s, v) => s + v.score, 0);

    if (totalScore === 0) return;

    // Compute new traffic split proportional to Thompson scores
    // Ensure minimum 5% per variant to keep exploring
    const minAllocation = 5;
    const distributablePct = 100 - minAllocation * scores.length;

    const newSplit: Record<string, number> = {};
    let allocated = 0;

    for (let i = 0; i < scores.length; i++) {
      const proportional = Math.round((scores[i].score / totalScore) * distributablePct);
      const allocation = minAllocation + proportional;
      newSplit[scores[i].variantId] = allocation;
      allocated += allocation;
    }

    // Adjust rounding errors — add remainder to the best-performing variant
    const remainder = 100 - allocated;
    if (remainder !== 0) {
      const bestVariant = scores.reduce((a, b) => (b.score > a.score ? b : a));
      newSplit[bestVariant.variantId] += remainder;
    }

    // Save updated traffic split
    try {
      await prisma.nudgeExperiment.update({
        where: { id: experimentId },
        data: { trafficSplit: newSplit },
      });
    } catch (err) {
      const code = (err as { code?: string }).code;
      const msg = err instanceof Error ? err.message : String(err);
      if (code === 'P2021' || code === 'P2022' || msg.includes('does not exist')) {
        log.debug('Schema drift in autoOptimizeExperiment — cannot update');
        return;
      }
      throw err;
    }

    log.info(`Experiment ${experimentId}: traffic updated — ${JSON.stringify(newSplit)}`);
  } catch (error) {
    const code = (error as { code?: string }).code;
    const msg = error instanceof Error ? error.message : String(error);

    if (code === 'P2021' || code === 'P2022' || msg.includes('does not exist')) {
      log.debug('Schema drift in autoOptimizeExperiment — table not available');
      return;
    }

    log.error('Failed to auto-optimize experiment:', error);
    throw error;
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Simple deterministic hash that maps a string to 0-99.
 * Uses FNV-1a-like hash for fast, reasonably uniform distribution.
 */
function deterministicBucket(input: string): number {
  let hash = 2166136261; // FNV offset basis
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619); // FNV prime
  }
  // Ensure positive and map to 0-99
  return Math.abs(hash) % 100;
}
