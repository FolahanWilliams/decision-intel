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
