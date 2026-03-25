/**
 * Decision Recommendations — finds similar successful decisions
 * and identifies what they did differently.
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('Recommendations');

export interface DecisionRecommendation {
  type: 'precedent' | 'warning' | 'strategy';
  title: string;
  description: string;
  relatedAnalysisId: string;
  relatedDocumentId: string;
  confidence: number;
  outcome: string;
  scoreDiff: number;
}

/**
 * Generate recommendations by finding similar decisions with better outcomes
 * and analyzing what they did differently.
 */
export async function generateRecommendations(
  analysisId: string,
  orgId: string
): Promise<DecisionRecommendation[]> {
  try {
    // Get the current analysis
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      select: {
        id: true,
        overallScore: true,
        biases: { select: { biasType: true, severity: true } },
        outcome: { select: { outcome: true } },
        document: { select: { content: true, filename: true, userId: true } },
      },
    });

    if (!analysis) return [];

    const currentBiases = new Set(analysis.biases.map(b => b.biasType));

    // Find connected decisions via graph edges
    const edges = await prisma.decisionEdge.findMany({
      where: {
        orgId,
        OR: [{ sourceId: analysisId }, { targetId: analysisId }],
        edgeType: { in: ['similar_to', 'shared_bias'] },
      },
      select: { sourceId: true, targetId: true, edgeType: true, strength: true },
      orderBy: { strength: 'desc' },
      take: 20,
    });

    const connectedIds = edges.map(e =>
      e.sourceId === analysisId ? e.targetId : e.sourceId
    );

    if (connectedIds.length === 0) return [];

    // Get connected analyses with outcomes
    const connected = await prisma.analysis.findMany({
      where: { id: { in: connectedIds } },
      select: {
        id: true,
        overallScore: true,
        biases: { select: { biasType: true } },
        outcome: { select: { outcome: true, lessonsLearned: true } },
        document: { select: { id: true, filename: true } },
      },
    });

    const recommendations: DecisionRecommendation[] = [];

    for (const conn of connected) {
      if (!conn.outcome) continue;

      const connBiases = new Set(conn.biases.map(b => b.biasType));
      const scoreDiff = conn.overallScore - analysis.overallScore;

      // Precedent: similar decision that succeeded
      if (conn.outcome.outcome === 'success' && scoreDiff > 10) {
        // Find biases present in current but absent in successful decision
        const avoidedBiases = [...currentBiases].filter(b => !connBiases.has(b));
        const description = avoidedBiases.length > 0
          ? `"${conn.document.filename}" scored ${Math.round(scoreDiff)} points higher and avoided: ${avoidedBiases.slice(0, 3).join(', ')}.${conn.outcome.lessonsLearned ? ` Lesson: ${conn.outcome.lessonsLearned.slice(0, 150)}` : ''}`
          : `"${conn.document.filename}" scored ${Math.round(scoreDiff)} points higher with a successful outcome.${conn.outcome.lessonsLearned ? ` Lesson: ${conn.outcome.lessonsLearned.slice(0, 150)}` : ''}`;

        recommendations.push({
          type: 'precedent',
          title: `Learn from "${conn.document.filename}"`,
          description,
          relatedAnalysisId: conn.id,
          relatedDocumentId: conn.document.id,
          confidence: Math.min(1, scoreDiff / 50),
          outcome: conn.outcome.outcome,
          scoreDiff,
        });
      }

      // Warning: similar decision that failed
      if (conn.outcome.outcome === 'failure') {
        const sharedBiases = [...currentBiases].filter(b => connBiases.has(b));
        if (sharedBiases.length > 0) {
          recommendations.push({
            type: 'warning',
            title: `Caution: "${conn.document.filename}" failed`,
            description: `A similar decision sharing ${sharedBiases.length} bias(es) (${sharedBiases.slice(0, 3).join(', ')}) resulted in failure.${conn.outcome.lessonsLearned ? ` Lesson: ${conn.outcome.lessonsLearned.slice(0, 150)}` : ''}`,
            relatedAnalysisId: conn.id,
            relatedDocumentId: conn.document.id,
            confidence: Math.min(1, sharedBiases.length / 3),
            outcome: conn.outcome.outcome,
            scoreDiff,
          });
        }
      }
    }

    // Sort: warnings first (most actionable), then precedents by confidence
    return recommendations
      .sort((a, b) => {
        if (a.type === 'warning' && b.type !== 'warning') return -1;
        if (b.type === 'warning' && a.type !== 'warning') return 1;
        return b.confidence - a.confidence;
      })
      .slice(0, 5);
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') return [];
    log.warn('Recommendation generation failed (non-critical):', error);
    return [];
  }
}
