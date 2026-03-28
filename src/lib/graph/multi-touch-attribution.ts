/**
 * Multi-Touch Decision Attribution
 *
 * When an outcome is reported, traces backward through the decision graph
 * to identify which prior analyses contributed to (influenced) the outcome.
 * Uses BFS with linear decay and edge-strength weighting.
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('MultiTouchAttribution');

const MAX_DEPTH = 5;
const MIN_CONTRIBUTION_PCT = 2;
const ATTRIBUTION_EDGE_TYPES = ['influenced_by', 'escalated_from', 'shared_bias', 'depends_on'];

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AttributionPath {
  sourceAnalysisId: string;
  contributionPct: number;
  pathLength: number;
  pathEdgeTypes: string[];
  edgeStrengthAvg: number;
}

interface GraphEdge {
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  edgeType: string;
  strength: number;
}

// ─── Core ───────────────────────────────────────────────────────────────────

/**
 * Compute multi-touch attribution for an analysis that received an outcome.
 * BFS backward through influenced_by / escalated_from / shared_bias / depends_on
 * edges, computing each source's contribution share.
 */
export async function computeMultiTouchAttribution(
  outcomeAnalysisId: string,
  orgId: string | null
): Promise<AttributionPath[]> {
  try {
    // Fetch all relevant edges for this org (scoped to reduce search space)
    const whereClause: Record<string, unknown> = {
      edgeType: { in: ATTRIBUTION_EDGE_TYPES },
    };
    if (orgId) whereClause.orgId = orgId;

    const edges = await prisma.decisionEdge.findMany({
      where: whereClause,
      select: {
        sourceType: true,
        sourceId: true,
        targetType: true,
        targetId: true,
        edgeType: true,
        strength: true,
      },
    });

    if (edges.length === 0) {
      return [];
    }

    // Build adjacency list: target → [sources]  (reverse direction for BFS backward)
    const reverseAdj = new Map<string, GraphEdge[]>();
    for (const e of edges) {
      const key = `${e.targetType}:${e.targetId}`;
      if (!reverseAdj.has(key)) reverseAdj.set(key, []);
      reverseAdj.get(key)!.push(e);
    }

    // BFS backward from outcome analysis
    const startKey = `analysis:${outcomeAnalysisId}`;
    const visited = new Set<string>([startKey]);

    interface BFSNode {
      nodeKey: string;
      analysisId: string;
      depth: number;
      pathEdgeTypes: string[];
      pathStrengths: number[];
    }

    const queue: BFSNode[] = [];
    const results: AttributionPath[] = [];

    // Seed with direct reverse neighbors
    const startEdges = reverseAdj.get(startKey) ?? [];
    for (const e of startEdges) {
      const sourceKey = `${e.sourceType}:${e.sourceId}`;
      if (e.sourceType === 'analysis' && !visited.has(sourceKey)) {
        visited.add(sourceKey);
        queue.push({
          nodeKey: sourceKey,
          analysisId: e.sourceId,
          depth: 1,
          pathEdgeTypes: [e.edgeType],
          pathStrengths: [e.strength],
        });
      }
    }

    // BFS
    while (queue.length > 0) {
      const node = queue.shift()!;

      // Record this path
      const avgStrength = node.pathStrengths.reduce((s, v) => s + v, 0) / node.pathStrengths.length;
      const rawScore = node.pathStrengths.reduce((prod, s) => prod * s, 1) * (1 / node.depth);

      results.push({
        sourceAnalysisId: node.analysisId,
        contributionPct: rawScore, // will be normalized below
        pathLength: node.depth,
        pathEdgeTypes: node.pathEdgeTypes,
        edgeStrengthAvg: Number(avgStrength.toFixed(3)),
      });

      // Continue BFS if under depth limit
      if (node.depth < MAX_DEPTH) {
        const neighbors = reverseAdj.get(node.nodeKey) ?? [];
        for (const e of neighbors) {
          const sourceKey = `${e.sourceType}:${e.sourceId}`;
          if (e.sourceType === 'analysis' && !visited.has(sourceKey)) {
            visited.add(sourceKey);
            queue.push({
              nodeKey: sourceKey,
              analysisId: e.sourceId,
              depth: node.depth + 1,
              pathEdgeTypes: [...node.pathEdgeTypes, e.edgeType],
              pathStrengths: [...node.pathStrengths, e.strength],
            });
          }
        }
      }
    }

    if (results.length === 0) {
      return [];
    }

    // Normalize raw scores to sum to 100%
    const totalRaw = results.reduce((s, r) => s + r.contributionPct, 0);
    for (const r of results) {
      r.contributionPct = Number(((r.contributionPct / totalRaw) * 100).toFixed(1));
    }

    // Filter out tiny contributions
    const filtered = results
      .filter(r => r.contributionPct >= MIN_CONTRIBUTION_PCT)
      .sort((a, b) => b.contributionPct - a.contributionPct);

    // Persist to database
    if (filtered.length > 0) {
      try {
        await prisma.$transaction(
          filtered.map(attr =>
            prisma.decisionAttribution.upsert({
              where: {
                outcomeAnalysisId_sourceAnalysisId: {
                  outcomeAnalysisId,
                  sourceAnalysisId: attr.sourceAnalysisId,
                },
              },
              create: {
                outcomeAnalysisId,
                sourceAnalysisId: attr.sourceAnalysisId,
                contributionPct: attr.contributionPct,
                pathLength: attr.pathLength,
                pathEdgeTypes: attr.pathEdgeTypes,
                edgeStrengthAvg: attr.edgeStrengthAvg,
                orgId,
              },
              update: {
                contributionPct: attr.contributionPct,
                pathLength: attr.pathLength,
                pathEdgeTypes: attr.pathEdgeTypes,
                edgeStrengthAvg: attr.edgeStrengthAvg,
                computedAt: new Date(),
              },
            })
          )
        );

        log.info(
          `Computed ${filtered.length} attribution path(s) for analysis ${outcomeAnalysisId}`
        );
      } catch (persistErr) {
        const code = (persistErr as { code?: string }).code;
        if (code === 'P2021' || code === 'P2022') {
          log.warn('Schema drift: DecisionAttribution table not yet migrated');
        } else {
          throw persistErr;
        }
      }
    }

    return filtered;
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'P2021' || code === 'P2022') {
      log.debug('Schema drift in multi-touch attribution — table not available');
      return [];
    }
    log.error('Failed to compute multi-touch attribution:', error);
    throw error;
  }
}
