/**
 * Counterfactual Path Analysis — finds alternative decision paths
 * that led to better outcomes for similar decisions.
 */

interface CFNode {
  id: string;
  type: string;
  label: string;
  score: number;
  outcome?: string;
}

interface CFEdge {
  source: string | { id: string };
  target: string | { id: string };
  edgeType: string;
  strength: number;
}

export interface CounterfactualPath {
  originalNodeId: string;
  alternativeNodeId: string;
  alternativeLabel: string;
  alternativeScore: number;
  alternativeOutcome: string;
  similarity: number;
  keyDifference: string;
}

function eid(e: CFEdge, side: 'source' | 'target'): string {
  const v = e[side];
  return typeof v === 'string' ? v : v.id;
}

/**
 * Find similar decisions (via similar_to edges) that had better outcomes.
 * Returns counterfactual paths showing "what could have been different."
 */
export function computeCounterfactualPaths(
  nodes: CFNode[],
  edges: CFEdge[],
  targetNodeId: string
): CounterfactualPath[] {
  const targetNode = nodes.find(n => n.id === targetNodeId);
  if (!targetNode) return [];
  if (targetNode.outcome !== 'failure' && targetNode.outcome !== 'partial_success') return [];

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const results: CounterfactualPath[] = [];

  // Find similar_to edges from this node
  const similarEdges = edges.filter(e => {
    const src = eid(e, 'source');
    const tgt = eid(e, 'target');
    return (src === targetNodeId || tgt === targetNodeId) && e.edgeType === 'similar_to';
  });

  for (const edge of similarEdges) {
    const src = eid(edge, 'source');
    const tgt = eid(edge, 'target');
    const otherId = src === targetNodeId ? tgt : src;
    const otherNode = nodeMap.get(otherId);

    if (!otherNode) continue;
    if (otherNode.outcome !== 'success' && otherNode.outcome !== 'partial_success') continue;
    if (otherNode.score <= targetNode.score) continue;

    const scoreDiff = otherNode.score - targetNode.score;
    let keyDifference = `Score was ${Math.round(scoreDiff)} points higher`;

    if (otherNode.outcome === 'success' && targetNode.outcome === 'failure') {
      keyDifference = `Similar decision succeeded (score ${Math.round(otherNode.score)} vs ${Math.round(targetNode.score)})`;
    }

    results.push({
      originalNodeId: targetNodeId,
      alternativeNodeId: otherId,
      alternativeLabel: otherNode.label,
      alternativeScore: otherNode.score,
      alternativeOutcome: otherNode.outcome || 'unknown',
      similarity: edge.strength,
      keyDifference,
    });
  }

  // Also check 2-hop paths: target → shared_bias → similar_to → success
  const biasNeighborIds = edges
    .filter(e => {
      const src = eid(e, 'source');
      const tgt = eid(e, 'target');
      return (src === targetNodeId || tgt === targetNodeId) && e.edgeType === 'shared_bias';
    })
    .map(e => {
      const src = eid(e, 'source');
      return src === targetNodeId ? eid(e, 'target') : src;
    });

  for (const neighborId of biasNeighborIds) {
    const neighborSimilar = edges.filter(e => {
      const src = eid(e, 'source');
      const tgt = eid(e, 'target');
      return (src === neighborId || tgt === neighborId) && e.edgeType === 'similar_to';
    });

    for (const edge of neighborSimilar) {
      const src = eid(edge, 'source');
      const otherId = src === neighborId ? eid(edge, 'target') : src;
      if (otherId === targetNodeId) continue;
      if (results.some(r => r.alternativeNodeId === otherId)) continue;

      const otherNode = nodeMap.get(otherId);
      if (!otherNode || otherNode.outcome !== 'success') continue;

      results.push({
        originalNodeId: targetNodeId,
        alternativeNodeId: otherId,
        alternativeLabel: otherNode.label,
        alternativeScore: otherNode.score,
        alternativeOutcome: otherNode.outcome,
        similarity: edge.strength * 0.7, // discount for 2-hop
        keyDifference: `2-hop alternative: shared bias patterns but different outcome`,
      });
    }
  }

  return results.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
}

/**
 * Generate a human-readable narrative explanation for counterfactual paths.
 * Wraps raw counterfactual results with context about what could have been different.
 */
export interface CounterfactualNarrative {
  summary: string;
  paths: CounterfactualPath[];
  recommendations: string[];
}

export function generateCounterfactualNarrative(
  targetLabel: string,
  targetOutcome: string,
  paths: CounterfactualPath[]
): CounterfactualNarrative {
  if (paths.length === 0) {
    return {
      summary: `No alternative paths found for "${targetLabel}". This decision has no similar comparisons with better outcomes in the knowledge graph.`,
      paths: [],
      recommendations: [],
    };
  }

  const bestAlt = paths[0];

  // Build summary
  const outcomeDesc = targetOutcome === 'failure' ? 'failed' : 'partially succeeded';
  const summary = `This decision ${outcomeDesc}. The knowledge graph contains ${paths.length} similar decision${paths.length > 1 ? 's' : ''} that achieved better outcomes. The most similar alternative ("${bestAlt.alternativeLabel}") had a similarity score of ${Math.round(bestAlt.similarity * 100)}% and resulted in ${bestAlt.alternativeOutcome === 'success' ? 'a successful' : 'a partially successful'} outcome with a score of ${Math.round(bestAlt.alternativeScore)}.`;

  // Generate recommendations
  const recommendations: string[] = [];

  const directPaths = paths.filter(p => !p.keyDifference.startsWith('2-hop'));
  const twoHopPaths = paths.filter(p => p.keyDifference.startsWith('2-hop'));

  if (directPaths.length > 0) {
    recommendations.push(
      `Review ${directPaths.length} directly similar decision${directPaths.length > 1 ? 's' : ''} that succeeded — look for differences in framing, stakeholder involvement, or timing.`
    );
  }

  if (twoHopPaths.length > 0) {
    recommendations.push(
      `${twoHopPaths.length} alternative${twoHopPaths.length > 1 ? 's were' : ' was'} found through shared bias patterns — consider whether common cognitive biases influenced the outcome.`
    );
  }

  if (bestAlt.alternativeScore > 70) {
    recommendations.push(
      `The top alternative scored ${Math.round(bestAlt.alternativeScore)}/100 — analyze what made it effective and apply those patterns to future decisions.`
    );
  }

  return { summary, paths, recommendations };
}
