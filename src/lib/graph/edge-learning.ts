/**
 * Edge Learning — adjusts graph edge weights based on outcome feedback
 * and nudge helpfulness. Creates the self-improving flywheel.
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('EdgeLearning');

/**
 * Adjust edge weights when an outcome is reported.
 * - Success connecting to success → strengthen edge
 * - Failure + shared_bias edge → strengthen (pattern validated)
 * - False positive biases → weaken shared_bias edges
 */
export async function adjustEdgeWeightsFromOutcome(
  analysisId: string,
  outcome: string,
  confirmedBiases: string[],
  falsPositiveBiases: string[]
): Promise<number> {
  try {
    // Find all edges connected to this analysis
    const edges = await prisma.decisionEdge.findMany({
      where: {
        OR: [{ sourceId: analysisId }, { targetId: analysisId }],
      },
      select: {
        id: true,
        sourceId: true,
        targetId: true,
        edgeType: true,
        strength: true,
        confidence: true,
      },
    });

    if (edges.length === 0) return 0;

    let updated = 0;
    for (const edge of edges) {
      let strengthDelta = 0;
      let confidenceDelta = 0;

      const otherId = edge.sourceId === analysisId ? edge.targetId : edge.sourceId;

      if (edge.edgeType === 'shared_bias') {
        // If outcome was failure and biases were confirmed, the pattern is validated
        if (outcome === 'failure' && confirmedBiases.length > 0) {
          strengthDelta = 0.05;
          confidenceDelta = 0.03;
        }
        // If biases were false positives, weaken the connection
        if (falsPositiveBiases.length > 0) {
          strengthDelta = -0.03;
          confidenceDelta = -0.02;
        }
      }

      if (edge.edgeType === 'similar_to' || edge.edgeType === 'escalated_from') {
        // Check if the other node also has an outcome
        const otherOutcome = await prisma.decisionOutcome.findUnique({
          where: { analysisId: otherId },
          select: { outcome: true },
        });

        if (otherOutcome) {
          const sameOutcome = otherOutcome.outcome === outcome;
          // Same outcome validates the relationship
          strengthDelta = sameOutcome ? 0.03 : -0.02;
          confidenceDelta = sameOutcome ? 0.02 : -0.01;
        }
      }

      if (strengthDelta === 0 && confidenceDelta === 0) continue;

      const newStrength = Math.max(0, Math.min(1, edge.strength + strengthDelta));
      const newConfidence = Math.max(0, Math.min(1, edge.confidence + confidenceDelta));

      await prisma.decisionEdge.update({
        where: { id: edge.id },
        data: { strength: newStrength, confidence: newConfidence },
      });
      updated++;
    }

    if (updated > 0) {
      log.info(`Adjusted ${updated} edge weight(s) from outcome for analysis ${analysisId}`);
    }
    return updated;
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') return 0;
    log.warn('Edge weight adjustment failed (non-critical):', error);
    return 0;
  }
}

/**
 * Adjust edge weights when nudge feedback is received.
 * - Helpful nudge → reinforce associated graph patterns
 * - Unhelpful nudge → slightly weaken patterns
 */
export async function adjustEdgeWeightsFromNudgeFeedback(
  nudgeId: string,
  wasHelpful: boolean
): Promise<void> {
  try {
    const nudge = await prisma.nudge.findUnique({
      where: { id: nudgeId },
      select: { humanDecisionId: true, nudgeType: true },
    });

    if (!nudge?.humanDecisionId) return;

    // Find edges connected to this human decision
    const edges = await prisma.decisionEdge.findMany({
      where: {
        OR: [{ sourceId: nudge.humanDecisionId }, { targetId: nudge.humanDecisionId }],
        edgeType: { in: ['shared_bias', 'similar_to', 'escalated_from'] },
      },
      select: { id: true, confidence: true },
      take: 10,
    });

    const delta = wasHelpful ? 0.03 : -0.02;

    await Promise.all(
      edges.map(edge => {
        const newConfidence = Math.max(0, Math.min(1, edge.confidence + delta));
        return prisma.decisionEdge
          .update({
            where: { id: edge.id },
            data: { confidence: newConfidence },
          })
          .catch(err => {
            log.warn(`Edge confidence update failed for ${edge.id}:`, err);
          });
      })
    );

    if (edges.length > 0) {
      log.info(
        `Adjusted ${edges.length} edge confidence(s) from nudge feedback (helpful=${wasHelpful})`
      );
    }
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') return;
    log.warn('Nudge feedback edge adjustment failed (non-critical):', error);
  }
}

/**
 * Detect contradictions between flagged biases and actual outcomes.
 * Returns biases that were expected to cause failure but outcome was success, or vice versa.
 */
export async function detectOutcomeContradictions(
  analysisId: string,
  outcome: string
): Promise<Array<{ contradictedBias: string; expectedOutcome: string; actualOutcome: string }>> {
  try {
    // Get the biases detected for this analysis
    const biases = await prisma.biasInstance.findMany({
      where: { analysisId },
      select: { biasType: true, severity: true },
    });

    if (biases.length === 0) return [];

    // Check causal edge data for expected outcomes
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      select: { document: { select: { orgId: true } } },
    });

    const orgId = analysis?.document?.orgId;
    if (!orgId) return [];

    const contradictions: Array<{
      contradictedBias: string;
      expectedOutcome: string;
      actualOutcome: string;
    }> = [];

    // Look at causal edges to determine expected impact direction
    const causalEdges = await prisma.causalEdge.findMany({
      where: {
        orgId,
        fromVar: { in: biases.map(b => b.biasType) },
      },
      select: { fromVar: true, toVar: true, strength: true },
    });

    for (const ce of causalEdges) {
      // Strong negative causal weight on quality → expected failure
      if (ce.toVar === 'overallScore' || ce.toVar === 'noise_score') {
        const expectedFailure = ce.strength < -0.3;
        const expectedSuccess = ce.strength > 0.3;

        if (expectedFailure && outcome === 'success') {
          contradictions.push({
            contradictedBias: ce.fromVar,
            expectedOutcome: 'failure',
            actualOutcome: outcome,
          });
        }
        if (expectedSuccess && outcome === 'failure') {
          contradictions.push({
            contradictedBias: ce.fromVar,
            expectedOutcome: 'success',
            actualOutcome: outcome,
          });
        }
      }
    }

    // Also flag high-severity biases that didn't lead to failure
    if (outcome === 'success') {
      const criticalBiases = biases.filter(b => b.severity === 'critical' || b.severity === 'high');
      for (const bias of criticalBiases) {
        if (!contradictions.some(c => c.contradictedBias === bias.biasType)) {
          contradictions.push({
            contradictedBias: bias.biasType,
            expectedOutcome: 'failure (critical/high bias detected)',
            actualOutcome: outcome,
          });
        }
      }
    }

    return contradictions.slice(0, 10);
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') return [];
    log.warn('Contradiction detection failed (non-critical):', error);
    return [];
  }
}
