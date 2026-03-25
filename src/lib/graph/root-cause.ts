/**
 * Root Cause Attribution — links specific biases to decision outcomes
 * using causal edge data and graph topology.
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('RootCause');

export interface RootCauseAttribution {
  biasType: string;
  contributionScore: number; // -1 to 1 (negative = bias actually helped)
  evidence: string;
  causalStrength: number;
  severity: string;
}

/**
 * Attribute root causes of a decision outcome to specific biases.
 * Uses CausalEdge records for learned causal relationships,
 * and graph topology for cross-decision pattern validation.
 */
export async function attributeRootCauses(
  analysisId: string,
  orgId: string
): Promise<RootCauseAttribution[]> {
  try {
    // Get biases for this analysis
    const biases = await prisma.biasInstance.findMany({
      where: { analysisId },
      select: { biasType: true, severity: true },
    });

    if (biases.length === 0) return [];

    // Get outcome
    const outcome = await prisma.decisionOutcome.findUnique({
      where: { analysisId },
      select: { outcome: true, confirmedBiases: true, falsPositiveBiases: true },
    });

    if (!outcome) return [];

    const confirmed = new Set(outcome.confirmedBiases);
    const falsePositives = new Set(outcome.falsPositiveBiases);

    // Get causal edge data for these bias types
    const causalEdges = await prisma.causalEdge.findMany({
      where: {
        orgId,
        fromVar: { in: biases.map(b => b.biasType) },
      },
      select: { fromVar: true, toVar: true, strength: true, sampleSize: true },
    });

    const causalMap = new Map<string, { strength: number; sampleSize: number }>();
    for (const ce of causalEdges) {
      if (ce.toVar === 'overallScore' || ce.toVar === 'noise_score') {
        const existing = causalMap.get(ce.fromVar);
        if (!existing || ce.sampleSize > existing.sampleSize) {
          causalMap.set(ce.fromVar, { strength: ce.strength, sampleSize: ce.sampleSize });
        }
      }
    }

    // Check graph for cross-validation: how often does this bias appear in failed clusters?
    const sharedBiasEdges = await prisma.decisionEdge.findMany({
      where: {
        orgId,
        OR: [{ sourceId: analysisId }, { targetId: analysisId }],
        edgeType: 'shared_bias',
      },
      select: { sourceId: true, targetId: true, strength: true },
      take: 20,
    });

    const connectedIds = sharedBiasEdges.map(e =>
      e.sourceId === analysisId ? e.targetId : e.sourceId
    );

    let neighborFailures = 0;
    if (connectedIds.length > 0) {
      neighborFailures = await prisma.decisionOutcome.count({
        where: {
          analysisId: { in: connectedIds },
          outcome: 'failure',
        },
      });
    }

    const neighborFailureRate = connectedIds.length > 0 ? neighborFailures / connectedIds.length : 0;

    // Compute attribution scores
    const attributions: RootCauseAttribution[] = [];

    for (const bias of biases) {
      const causal = causalMap.get(bias.biasType);
      let contributionScore = 0;
      const evidence: string[] = [];

      // Factor 1: Was this bias confirmed or false positive?
      if (confirmed.has(bias.biasType)) {
        contributionScore += 0.4;
        evidence.push('Confirmed by outcome reporter');
      } else if (falsePositives.has(bias.biasType)) {
        contributionScore -= 0.4;
        evidence.push('Marked as false positive');
      }

      // Factor 2: Causal edge strength
      if (causal) {
        contributionScore += causal.strength * 0.3;
        evidence.push(`Causal weight: ${causal.strength.toFixed(2)} (n=${causal.sampleSize})`);
      }

      // Factor 3: Graph topology — bias shared with failed neighbors
      if (neighborFailureRate > 0.3) {
        contributionScore += neighborFailureRate * 0.2;
        evidence.push(`${Math.round(neighborFailureRate * 100)}% of bias-linked decisions failed`);
      }

      // Factor 4: Severity weight
      const severityWeight = bias.severity === 'critical' ? 0.1 : bias.severity === 'high' ? 0.05 : 0;
      contributionScore += severityWeight;

      // Clamp to [-1, 1]
      contributionScore = Math.max(-1, Math.min(1, contributionScore));

      attributions.push({
        biasType: bias.biasType,
        contributionScore: Math.round(contributionScore * 100) / 100,
        evidence: evidence.join('; '),
        causalStrength: causal?.strength ?? 0,
        severity: bias.severity,
      });
    }

    return attributions.sort((a, b) => Math.abs(b.contributionScore) - Math.abs(a.contributionScore));
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') return [];
    log.warn('Root cause attribution failed (non-critical):', error);
    return [];
  }
}
