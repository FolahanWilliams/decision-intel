/**
 * Twin Effectiveness Tracker
 *
 * Tracks whether Decision Twin dissent actually improved outcomes.
 * Compares DecisionPrior.defaultAction vs DecisionPrior.postAnalysisAction:
 * - If action changed AND outcome improved → Twin dissent was effective
 * - Stores effectiveness data in CalibrationProfile (type: 'twin_effectiveness')
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('TwinEffectiveness');

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TwinEffectivenessResult {
  twinName: string;
  /** Times this twin's dissent led to a changed decision */
  dissentCount: number;
  /** Times the changed decision had a positive outcome */
  effectiveDissentCount: number;
  /** Effectiveness rate (0-1) */
  effectivenessRate: number;
  /** Average belief delta when this twin dissented */
  avgBeliefDelta: number;
  sampleSize: number;
}

interface TwinVote {
  name?: string;
  vote?: string;
  verdict?: string;
}

// ─── Core Function ──────────────────────────────────────────────────────────

/**
 * Compute twin effectiveness by correlating twin dissent with outcome data.
 *
 * For each analysis where beliefDelta > 0 (user changed mind):
 * - Find which twins voted REJECT or REVISE (from simulation.twins JSON)
 * - Credit those twins with a "dissent"
 * - If the outcome was success/partial_success, credit them with "effective dissent"
 */
export async function computeTwinEffectiveness(
  orgId?: string | null,
  userId?: string
): Promise<TwinEffectivenessResult[]> {
  try {
    // Build where clause for outcomes
    const outcomeWhere: Record<string, unknown> = {};
    if (orgId) outcomeWhere.orgId = orgId;
    if (userId) outcomeWhere.userId = userId;

    // Fetch outcomes with priors and analysis simulation data
    const outcomes = await prisma.decisionOutcome.findMany({
      where: outcomeWhere,
      select: {
        id: true,
        outcome: true,
        analysisId: true,
        analysis: {
          select: {
            id: true,
            simulation: true,
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
      return [];
    }

    // Aggregate per twin
    const twinMap: Record<
      string,
      {
        dissentCount: number;
        effectiveDissentCount: number;
        beliefDeltas: number[];
        sampleSize: number;
      }
    > = {};

    for (const o of outcomes) {
      const beliefDelta = o.analysis?.prior?.beliefDelta ?? 0;

      // Only count decisions where user actually changed their mind
      if (beliefDelta <= 0) continue;

      // Extract twins from simulation JSON
      const simulation = o.analysis?.simulation as Record<string, unknown> | null;
      if (!simulation) continue;

      const twins = (simulation.twins ?? simulation.boardroom ?? []) as TwinVote[];
      if (!Array.isArray(twins) || twins.length === 0) continue;

      const isPositive = o.outcome === 'success' || o.outcome === 'partial_success';

      // Find dissenting twins (REJECT or REVISE votes)
      for (const twin of twins) {
        const name = twin.name;
        const vote = (twin.vote ?? twin.verdict ?? '').toUpperCase();

        if (!name) continue;
        if (vote !== 'REJECT' && vote !== 'REVISE') continue;

        if (!twinMap[name]) {
          twinMap[name] = {
            dissentCount: 0,
            effectiveDissentCount: 0,
            beliefDeltas: [],
            sampleSize: 0,
          };
        }

        twinMap[name].dissentCount++;
        twinMap[name].sampleSize++;
        twinMap[name].beliefDeltas.push(beliefDelta);

        if (isPositive) {
          twinMap[name].effectiveDissentCount++;
        }
      }
    }

    // Convert to results
    const results: TwinEffectivenessResult[] = Object.entries(twinMap)
      .map(([twinName, stats]) => {
        const avgBeliefDelta =
          stats.beliefDeltas.length > 0
            ? stats.beliefDeltas.reduce((s, v) => s + v, 0) / stats.beliefDeltas.length
            : 0;

        return {
          twinName,
          dissentCount: stats.dissentCount,
          effectiveDissentCount: stats.effectiveDissentCount,
          effectivenessRate:
            stats.dissentCount > 0
              ? Number((stats.effectiveDissentCount / stats.dissentCount).toFixed(3))
              : 0,
          avgBeliefDelta: Number(avgBeliefDelta.toFixed(2)),
          sampleSize: stats.sampleSize,
        };
      })
      .sort((a, b) => b.effectivenessRate - a.effectivenessRate);

    return results;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const code = (error as { code?: string }).code;

    if (code === 'P2021' || code === 'P2022' || msg.includes('does not exist')) {
      log.debug('Schema drift in computeTwinEffectiveness — table not available');
      return [];
    }

    log.error('Failed to compute twin effectiveness:', error);
    throw error;
  }
}
