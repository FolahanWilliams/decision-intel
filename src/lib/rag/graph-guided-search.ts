/**
 * Graph-Guided RAG — enhances semantic search with graph distance
 * and outcome weighting for smarter retrieval.
 */

import { prisma } from '@/lib/prisma';
import { searchSimilarWithOutcomes } from './embeddings';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('GraphGuidedSearch');

export interface GraphGuidedResult {
  documentId: string;
  filename: string;
  semanticScore: number;
  graphDistance: number;
  outcomeBoost: number;
  combinedScore: number;
  biases: string[];
  outcome?: {
    result: string;
    impactScore: number | null;
    lessonsLearned: string | null;
  };
}

/**
 * Graph-guided search: combines semantic similarity with graph distance
 * and outcome weighting to re-rank results.
 */
export async function graphGuidedSearch(
  queryText: string,
  contextAnalysisId: string | null,
  userId: string,
  orgId: string,
  limit: number = 10
): Promise<GraphGuidedResult[]> {
  // Step 1: Semantic search with outcomes
  const semanticResults = await searchSimilarWithOutcomes(queryText, userId, Math.max(limit, 15));

  if (semanticResults.length === 0) return [];

  // Step 2: Get graph neighbors if we have a context analysis
  const graphNeighborIds = new Set<string>();
  const graphDistances = new Map<string, number>();

  if (contextAnalysisId) {
    try {
      // 1-hop neighbors
      const hop1Edges = await prisma.decisionEdge.findMany({
        where: {
          orgId,
          OR: [{ sourceId: contextAnalysisId }, { targetId: contextAnalysisId }],
        },
        select: { sourceId: true, targetId: true },
        take: 50,
      });

      const hop1Ids: string[] = [];
      for (const e of hop1Edges) {
        const otherId = e.sourceId === contextAnalysisId ? e.targetId : e.sourceId;
        graphNeighborIds.add(otherId);
        graphDistances.set(otherId, 1);
        hop1Ids.push(otherId);
      }

      // 2-hop neighbors
      if (hop1Ids.length > 0) {
        const hop2Edges = await prisma.decisionEdge.findMany({
          where: {
            orgId,
            OR: [{ sourceId: { in: hop1Ids } }, { targetId: { in: hop1Ids } }],
          },
          select: { sourceId: true, targetId: true },
          take: 100,
        });

        for (const e of hop2Edges) {
          for (const id of [e.sourceId, e.targetId]) {
            if (id !== contextAnalysisId && !graphDistances.has(id)) {
              graphNeighborIds.add(id);
              graphDistances.set(id, 2);
            }
          }
        }
      }
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (code !== 'P2021' && code !== 'P2022') {
        log.warn('Graph neighbor lookup failed (non-critical):', error);
      }
    }
  }

  // Step 3: Map document IDs to analysis IDs for graph distance lookup
  const docIds = semanticResults.map(r => r.documentId);
  let docToAnalysis = new Map<string, string>();
  try {
    const analyses = await prisma.analysis.findMany({
      where: { documentId: { in: docIds } },
      select: { id: true, documentId: true },
    });
    docToAnalysis = new Map(analyses.map(a => [a.documentId, a.id]));
  } catch {
    /* non-critical */
  }

  // Step 4: Compute combined scores
  const results: GraphGuidedResult[] = semanticResults.map(r => {
    const analysisId = docToAnalysis.get(r.documentId);
    const graphDist = analysisId ? (graphDistances.get(analysisId) ?? Infinity) : Infinity;
    const graphDistScore = graphDist === 1 ? 1.0 : graphDist === 2 ? 0.5 : 0;

    let outcomeBoost = 0;
    if (r.outcome) {
      if (r.outcome.result === 'success') outcomeBoost = 0.3;
      else if (r.outcome.result === 'partial_success') outcomeBoost = 0.1;
      else if (r.outcome.result === 'failure') outcomeBoost = 0.15; // failures are also valuable learning
    }

    const combinedScore = 0.6 * r.similarity + 0.25 * graphDistScore + 0.15 * outcomeBoost;

    return {
      documentId: r.documentId,
      filename: r.filename,
      semanticScore: r.similarity,
      graphDistance: graphDist === Infinity ? -1 : graphDist,
      outcomeBoost,
      combinedScore,
      biases: r.biases,
      outcome: r.outcome
        ? {
            result: r.outcome.result,
            impactScore: r.outcome.impactScore,
            lessonsLearned: r.outcome.lessonsLearned,
          }
        : undefined,
    };
  });

  // Re-rank by combined score
  results.sort((a, b) => b.combinedScore - a.combinedScore);

  return results.slice(0, limit);
}

/**
 * Ensemble search: combines multiple retrieval strategies using
 * reciprocal rank fusion (RRF).
 */
export async function ensembleSearch(
  queryText: string,
  userId: string,
  orgId: string,
  contextAnalysisId?: string,
  limit: number = 10
): Promise<GraphGuidedResult[]> {
  // Strategy 1: Graph-guided search
  const graphResults = await graphGuidedSearch(
    queryText,
    contextAnalysisId || null,
    userId,
    orgId,
    limit * 2
  );

  // Strategy 2: Bias pattern matching (find docs with similar bias profiles)
  let biasResults: Array<{ documentId: string; rank: number }> = [];
  if (contextAnalysisId) {
    try {
      // Get biases from context analysis
      const contextBiases = await prisma.biasInstance.findMany({
        where: { analysisId: contextAnalysisId },
        select: { biasType: true },
      });

      if (contextBiases.length > 0) {
        // Find other analyses with shared bias edges
        const sharedBiasEdges = await prisma.decisionEdge.findMany({
          where: {
            orgId,
            edgeType: 'shared_bias',
            OR: [{ sourceId: contextAnalysisId }, { targetId: contextAnalysisId }],
          },
          select: { sourceId: true, targetId: true, strength: true },
          orderBy: { strength: 'desc' },
          take: 20,
        });

        const biasMatchIds = sharedBiasEdges.map((e, i) => ({
          documentId: e.sourceId === contextAnalysisId ? e.targetId : e.sourceId,
          rank: i + 1,
        }));

        // Map analysis IDs back to document IDs
        const analysisIds = biasMatchIds.map(b => b.documentId);
        const analyses = await prisma.analysis.findMany({
          where: { id: { in: analysisIds } },
          select: { id: true, documentId: true },
        });
        const analysisToDoc = new Map(analyses.map(a => [a.id, a.documentId]));

        biasResults = biasMatchIds
          .map(b => ({ documentId: analysisToDoc.get(b.documentId) || b.documentId, rank: b.rank }))
          .filter(b => b.documentId);
      }
    } catch {
      /* non-critical */
    }
  }

  // Reciprocal Rank Fusion (k=60)
  const k = 60;
  const rrfScores = new Map<string, number>();
  const resultMap = new Map<string, GraphGuidedResult>();

  // Add graph-guided results
  graphResults.forEach((r, i) => {
    const rrf = 1 / (k + i + 1);
    rrfScores.set(r.documentId, (rrfScores.get(r.documentId) || 0) + rrf);
    if (!resultMap.has(r.documentId)) resultMap.set(r.documentId, r);
  });

  // Add bias pattern results
  biasResults.forEach(r => {
    const rrf = 1 / (k + r.rank);
    rrfScores.set(r.documentId, (rrfScores.get(r.documentId) || 0) + rrf * 0.5);
  });

  // Re-rank by RRF score
  const finalResults = [...resultMap.values()]
    .map(r => ({
      ...r,
      combinedScore: rrfScores.get(r.documentId) || r.combinedScore,
    }))
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, limit);

  return finalResults;
}
