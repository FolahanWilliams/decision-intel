/**
 * Bias Genome — Anonymous Cross-Organization Intelligence
 *
 * Aggregates bias detection and outcome data across consenting organizations
 * to build industry-wide benchmarks. This creates a network effect moat:
 * the more orgs use the platform, the smarter it gets for everyone.
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('BiasGenome');

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BiasGenomeEntry {
  biasType: string;
  /** How often this bias appears across all consenting orgs */
  prevalence: number; // 0-100%
  /** Success rate of decisions where this bias was present */
  successRate: number;
  /** Success rate delta vs baseline (negative = costly bias) */
  costDelta: number;
  /** How often this bias was confirmed as real by users */
  confirmationRate: number;
  /** Number of data points */
  sampleSize: number;
}

export interface BiasGenomeResult {
  totalOrgs: number;
  totalDecisions: number;
  genome: BiasGenomeEntry[];
  /** When the genome was last computed */
  computedAt: string;
}

// ─── Core Function ──────────────────────────────────────────────────────────

/**
 * Compute the cross-organization Bias Genome from all consenting orgs.
 *
 * 1. Finds all orgs where isAnonymized = true
 * 2. Queries DecisionOutcome for those orgs (joins BiasInstance via Analysis)
 * 3. For each bias type: computes prevalence, success rate, cost delta, confirmation rate
 * 4. Sorts by costDelta (most costly first)
 */
export async function computeBiasGenome(): Promise<BiasGenomeResult> {
  const emptyResult: BiasGenomeResult = {
    totalOrgs: 0,
    totalDecisions: 0,
    genome: [],
    computedAt: new Date().toISOString(),
  };

  try {
    // Step 1: Find all consenting orgs
    let consentingOrgs: { id: string }[];
    try {
      consentingOrgs = await prisma.organization.findMany({
        where: { isAnonymized: true } as Record<string, unknown>,
        select: { id: true },
      });
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === 'P2021' || code === 'P2022') {
        log.debug('isAnonymized column not available (schema drift) — returning empty genome');
        return emptyResult;
      }
      throw error;
    }

    if (consentingOrgs.length === 0) {
      log.info('No consenting organizations found for Bias Genome computation');
      return emptyResult;
    }

    const orgIds = consentingOrgs.map(o => o.id);

    // Step 2: Query outcomes with bias data for consenting orgs
    let outcomes: Array<{
      id: string;
      outcome: string;
      confirmedBiases: string[];
      falsePositiveBiases: string[];
      analysis: {
        biases: Array<{ biasType: string }>;
      };
    }>;

    try {
      outcomes = await prisma.decisionOutcome.findMany({
        where: { orgId: { in: orgIds } },
        select: {
          id: true,
          outcome: true,
          confirmedBiases: true,
          falsePositiveBiases: true,
          analysis: {
            select: {
              biases: {
                select: { biasType: true },
              },
            },
          },
        },
      });
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === 'P2021' || code === 'P2022') {
        log.debug('DecisionOutcome or BiasInstance table not available (schema drift)');
        return emptyResult;
      }
      throw error;
    }

    if (outcomes.length === 0) {
      return {
        totalOrgs: consentingOrgs.length,
        totalDecisions: 0,
        genome: [],
        computedAt: new Date().toISOString(),
      };
    }

    // Step 3: Aggregate per-bias statistics
    const totalDecisions = outcomes.length;
    const totalSuccesses = outcomes.filter(o => o.outcome === 'success').length;
    const baseSuccessRate = totalDecisions > 0 ? totalSuccesses / totalDecisions : 0;

    const biasStats = new Map<
      string,
      {
        present: number; // how many decisions had this bias detected
        successes: number; // how many of those were successful
        confirmed: number; // times user confirmed this bias
        totalRated: number; // times user rated (confirmed + false positive)
      }
    >();

    for (const outcome of outcomes) {
      // Collect all unique bias types from this outcome's analysis
      const detectedBiasTypes = new Set(outcome.analysis.biases.map(b => b.biasType));
      const isSuccess = outcome.outcome === 'success';

      for (const biasType of detectedBiasTypes) {
        const stats = biasStats.get(biasType) ?? {
          present: 0,
          successes: 0,
          confirmed: 0,
          totalRated: 0,
        };
        stats.present++;
        if (isSuccess) stats.successes++;
        biasStats.set(biasType, stats);
      }

      // Process confirmation data from user feedback
      for (const biasType of outcome.confirmedBiases) {
        const stats = biasStats.get(biasType) ?? {
          present: 0,
          successes: 0,
          confirmed: 0,
          totalRated: 0,
        };
        stats.confirmed++;
        stats.totalRated++;
        biasStats.set(biasType, stats);
      }

      for (const biasType of outcome.falsePositiveBiases) {
        const stats = biasStats.get(biasType) ?? {
          present: 0,
          successes: 0,
          confirmed: 0,
          totalRated: 0,
        };
        stats.totalRated++;
        biasStats.set(biasType, stats);
      }
    }

    // Step 4: Build genome entries
    const genome: BiasGenomeEntry[] = [];

    for (const [biasType, stats] of biasStats.entries()) {
      if (stats.present === 0) continue;

      const prevalence = Number(((stats.present / totalDecisions) * 100).toFixed(1));
      const successRate = Number(((stats.successes / stats.present) * 100).toFixed(1));
      const costDelta = Number((successRate - baseSuccessRate * 100).toFixed(1));
      const confirmationRate =
        stats.totalRated > 0 ? Number(((stats.confirmed / stats.totalRated) * 100).toFixed(1)) : 0;

      genome.push({
        biasType,
        prevalence,
        successRate,
        costDelta,
        confirmationRate,
        sampleSize: stats.present,
      });
    }

    // Sort by costDelta ascending (most costly / most negative first)
    genome.sort((a, b) => a.costDelta - b.costDelta);

    log.info(
      `Bias Genome computed: ${genome.length} bias types from ${totalDecisions} decisions across ${consentingOrgs.length} orgs`
    );

    return {
      totalOrgs: consentingOrgs.length,
      totalDecisions,
      genome,
      computedAt: new Date().toISOString(),
    };
  } catch (error) {
    const code = (error as { code?: string }).code;
    const msg = error instanceof Error ? error.message : String(error);

    if (code === 'P2021' || code === 'P2022' || msg.includes('does not exist')) {
      log.debug('Schema drift in computeBiasGenome — returning empty result');
      return emptyResult;
    }

    log.error('Failed to compute Bias Genome:', error);
    throw error;
  }
}
