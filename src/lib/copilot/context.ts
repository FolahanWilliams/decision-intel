/**
 * Decision Copilot — Context Assembly
 *
 * Builds the rich context envelope for copilot agent turns by
 * pulling from existing RAG, causal learning, and outcome infrastructure.
 */

import { prisma } from '@/lib/prisma';
import { searchSimilarWithOutcomes } from '@/lib/rag/embeddings';
import { learnCausalEdges } from '@/lib/learning/causal-learning';
import { createLogger } from '@/lib/utils/logger';
import {
  type CopilotContext,
  type UserBiasProfile,
  type OutcomeSummary,
  type RAGResult,
} from './types';

const log = createLogger('CopilotContext');

/**
 * Loads a user's historical bias profile from past analyses.
 */
async function loadUserBiasProfile(userId: string): Promise<UserBiasProfile> {
  try {
    // Get bias frequency from all user's analyses
    const documents = await prisma.document.findMany({
      where: { userId },
      select: { id: true },
    });
    const docIds = documents.map(d => d.id);

    if (docIds.length === 0) {
      return { totalAnalyses: 0, topBiases: [], avgScore: 0, dangerousBiases: [] };
    }

    const analyses = await prisma.analysis.findMany({
      where: { documentId: { in: docIds } },
      select: {
        id: true,
        overallScore: true,
        biases: {
          select: { biasType: true },
        },
      },
    });

    if (analyses.length === 0) {
      return { totalAnalyses: 0, topBiases: [], avgScore: 0, dangerousBiases: [] };
    }

    // Count bias frequencies
    const biasCounts = new Map<string, number>();
    for (const analysis of analyses) {
      for (const bias of analysis.biases) {
        biasCounts.set(bias.biasType, (biasCounts.get(bias.biasType) || 0) + 1);
      }
    }

    const topBiases = Array.from(biasCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10) as Array<[string, number]>;

    const avgScore = analyses.reduce((sum, a) => sum + a.overallScore, 0) / analyses.length;

    // Find biases that appeared in failed decisions
    const analysisIds = analyses.map(a => a.id);
    const failedOutcomes = await prisma.decisionOutcome.findMany({
      where: {
        analysisId: { in: analysisIds },
        outcome: { in: ['failure', 'partial_failure', 'negative'] },
      },
      select: { confirmedBiases: true },
    });

    const dangerousSet = new Set<string>();
    for (const outcome of failedOutcomes) {
      for (const bias of outcome.confirmedBiases) {
        dangerousSet.add(bias);
      }
    }

    return {
      totalAnalyses: analyses.length,
      topBiases,
      avgScore,
      dangerousBiases: Array.from(dangerousSet),
    };
  } catch (err) {
    log.warn('Failed to load user bias profile:', err);
    return { totalAnalyses: 0, topBiases: [], avgScore: 0, dangerousBiases: [] };
  }
}

/**
 * Loads recent decision outcomes for institutional memory.
 */
async function loadRecentOutcomes(userId: string, limit: number): Promise<OutcomeSummary[]> {
  try {
    const outcomes = await prisma.decisionOutcome.findMany({
      where: { userId },
      orderBy: { reportedAt: 'desc' },
      take: limit,
      select: {
        analysisId: true,
        outcome: true,
        impactScore: true,
        lessonsLearned: true,
        confirmedBiases: true,
        reportedAt: true,
      },
    });

    return outcomes.map(o => ({
      analysisId: o.analysisId,
      outcome: o.outcome,
      impactScore: o.impactScore,
      lessonsLearned: o.lessonsLearned,
      confirmedBiases: o.confirmedBiases,
      reportedAt: o.reportedAt.toISOString(),
    }));
  } catch (err) {
    log.warn('Failed to load recent outcomes:', err);
    return [];
  }
}

/**
 * Assembles the full context for a copilot turn.
 * Calls existing RAG, causal learning, and user profile infrastructure in parallel.
 */
export async function buildCopilotContext(
  userId: string,
  orgId: string | null,
  decisionPrompt: string
): Promise<CopilotContext> {
  const [ragRaw, causalWeights, userProfile, recentOutcomes] = await Promise.all([
    searchSimilarWithOutcomes(decisionPrompt, userId, 5).catch(err => {
      log.warn('RAG search failed:', err);
      return [];
    }),
    orgId
      ? learnCausalEdges(orgId).catch(err => {
          log.warn('Causal learning failed:', err);
          return [];
        })
      : Promise.resolve([]),
    loadUserBiasProfile(userId),
    loadRecentOutcomes(userId, 10),
  ]);

  // Map RAG results to copilot format
  const ragResults: RAGResult[] = ragRaw.map(r => ({
    documentId: r.documentId,
    filename: r.filename,
    score: r.score,
    similarity: r.similarity,
    biases: r.biases,
    content: r.content,
    outcomeResult: r.outcome?.result,
  }));

  return { ragResults, causalWeights, userProfile, recentOutcomes };
}
