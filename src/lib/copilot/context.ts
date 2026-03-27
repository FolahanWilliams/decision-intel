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
  type DecisionStyleProfile,
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
 * Loads a deep decision style profile for the Personal Twin.
 * Analyzes how the user actually decides: risk tolerance, follow-through,
 * which twins predicted correctly, and what lessons they've written.
 */
export async function loadDecisionStyleProfile(userId: string): Promise<DecisionStyleProfile> {
  try {
    // Fetch all outcomes for this user
    const outcomes = await prisma.decisionOutcome.findMany({
      where: { userId },
      select: {
        outcome: true,
        impactScore: true,
        lessonsLearned: true,
        confirmedBiases: true,
        falsPositiveBiases: true,
        mostAccurateTwin: true,
        reportedAt: true,
        analysis: {
          select: {
            overallScore: true,
            createdAt: true,
            prior: {
              select: {
                defaultAction: true,
                postAnalysisAction: true,
                beliefDelta: true,
                confidence: true,
              },
            },
          },
        },
      },
      orderBy: { reportedAt: 'desc' },
    });

    if (outcomes.length === 0) {
      return {
        riskTolerance: 'moderate',
        avgBeliefDelta: 0,
        followAnalysisSuccessRate: 0,
        ignoreAnalysisSuccessRate: 0,
        mostAccurateTwin: null,
        avgDecisionSpeed: 0,
        confirmedBiasPatterns: [],
        falsePositiveBiasPatterns: [],
        topLessons: [],
        sampleSize: 0,
      };
    }

    // Compute risk tolerance from outcome patterns
    const avgImpact =
      outcomes
        .filter(o => o.impactScore != null)
        .reduce((sum, o) => sum + (o.impactScore ?? 0), 0) /
      Math.max(outcomes.filter(o => o.impactScore != null).length, 1);
    const riskTolerance =
      avgImpact >= 7 ? 'aggressive' : avgImpact >= 4 ? 'moderate' : 'conservative';

    // Compute belief delta
    const deltas = outcomes
      .filter(o => o.analysis?.prior?.beliefDelta != null)
      .map(o => o.analysis!.prior!.beliefDelta!);
    const avgBeliefDelta =
      deltas.length > 0 ? deltas.reduce((a, b) => a + b, 0) / deltas.length : 0;

    // Follow-analysis vs ignore-analysis success rates
    const withPriors = outcomes.filter(o => o.analysis?.prior);
    const followed = withPriors.filter(o => {
      const prior = o.analysis?.prior;
      return prior && prior.postAnalysisAction && prior.postAnalysisAction !== prior.defaultAction;
    });
    const ignored = withPriors.filter(o => {
      const prior = o.analysis?.prior;
      return (
        prior && (!prior.postAnalysisAction || prior.postAnalysisAction === prior.defaultAction)
      );
    });
    const successRate = (arr: typeof outcomes) =>
      arr.length > 0
        ? arr.filter(o => o.outcome === 'success' || o.outcome === 'partial_success').length /
          arr.length
        : 0;
    const followAnalysisSuccessRate = successRate(followed);
    const ignoreAnalysisSuccessRate = successRate(ignored);

    // Most accurate twin
    const twinCounts = new Map<string, number>();
    for (const o of outcomes) {
      if (o.mostAccurateTwin) {
        twinCounts.set(o.mostAccurateTwin, (twinCounts.get(o.mostAccurateTwin) || 0) + 1);
      }
    }
    const mostAccurateTwin =
      twinCounts.size > 0
        ? Array.from(twinCounts.entries()).sort((a, b) => b[1] - a[1])[0][0]
        : null;

    // Decision speed
    const speeds = outcomes
      .filter(o => o.analysis?.createdAt)
      .map(o => {
        const analysisDate = o.analysis!.createdAt;
        const outcomeDate = o.reportedAt;
        return (outcomeDate.getTime() - analysisDate.getTime()) / (1000 * 60 * 60 * 24);
      })
      .filter(d => d > 0);
    const avgDecisionSpeed =
      speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;

    // Bias patterns
    const confirmedCounts = new Map<string, number>();
    const fpCounts = new Map<string, number>();
    for (const o of outcomes) {
      for (const b of o.confirmedBiases) {
        confirmedCounts.set(b, (confirmedCounts.get(b) || 0) + 1);
      }
      for (const b of o.falsPositiveBiases) {
        fpCounts.set(b, (fpCounts.get(b) || 0) + 1);
      }
    }
    const confirmedBiasPatterns = Array.from(confirmedCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([b]) => b);
    const falsePositiveBiasPatterns = Array.from(fpCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([b]) => b);

    // Top lessons
    const topLessons = outcomes
      .filter(o => o.lessonsLearned && o.lessonsLearned.length > 10)
      .slice(0, 5)
      .map(o => o.lessonsLearned!);

    // Also load copilot-specific outcomes
    let copilotOutcomes: Array<{
      outcome: string;
      lessonsLearned: string | null;
      whatWorked: string | null;
      whatFailed: string | null;
      helpfulAgents: string[];
    }> = [];
    try {
      copilotOutcomes = await prisma.copilotOutcome.findMany({
        where: { userId },
        select: {
          outcome: true,
          lessonsLearned: true,
          whatWorked: true,
          whatFailed: true,
          helpfulAgents: true,
        },
        orderBy: { reportedAt: 'desc' },
        take: 10,
      });
    } catch {
      // CopilotOutcome table may not exist yet (schema drift)
    }

    // Merge copilot lessons
    const copilotLessons = copilotOutcomes
      .filter(o => o.lessonsLearned && o.lessonsLearned.length > 10)
      .map(o => o.lessonsLearned!);

    return {
      riskTolerance,
      avgBeliefDelta,
      followAnalysisSuccessRate,
      ignoreAnalysisSuccessRate,
      mostAccurateTwin,
      avgDecisionSpeed,
      confirmedBiasPatterns,
      falsePositiveBiasPatterns,
      topLessons: [...topLessons, ...copilotLessons].slice(0, 5),
      sampleSize: outcomes.length + copilotOutcomes.length,
    };
  } catch (err) {
    log.warn('Failed to load decision style profile:', err);
    return {
      riskTolerance: 'moderate',
      avgBeliefDelta: 0,
      followAnalysisSuccessRate: 0,
      ignoreAnalysisSuccessRate: 0,
      mostAccurateTwin: null,
      avgDecisionSpeed: 0,
      confirmedBiasPatterns: [],
      falsePositiveBiasPatterns: [],
      topLessons: [],
      sampleSize: 0,
    };
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
  const [ragRaw, causalWeights, userProfile, recentOutcomes, decisionStyle] = await Promise.all([
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
    loadDecisionStyleProfile(userId),
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

  return {
    ragResults,
    causalWeights,
    userProfile,
    recentOutcomes,
    decisionStyle: decisionStyle.sampleSize > 0 ? decisionStyle : undefined,
  };
}
