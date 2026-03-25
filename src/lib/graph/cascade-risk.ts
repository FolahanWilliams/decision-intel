/**
 * Cascade Risk Scoring — scores each pending-outcome node for
 * cluster-level failure risk based on graph topology.
 */

interface RiskNode {
  id: string;
  type: string;
  score: number;
  outcome?: string;
  biasCount: number;
}

interface RiskEdge {
  source: string;
  target: string;
  edgeType: string;
  strength: number;
}

interface RiskCluster {
  id: string;
  nodeIds: string[];
}

export interface CascadeRiskResult {
  nodeId: string;
  riskScore: number;
  reason: string;
  relatedFailures: Array<{ nodeId: string; sharedBiases: number }>;
  clusterFailureRate: number;
}

/**
 * Compute cascade risk for all pending-outcome nodes.
 * Returns nodes sorted by risk score (highest first).
 */
export function computeCascadeRisk(
  nodes: RiskNode[],
  edges: RiskEdge[],
  clusters: RiskCluster[]
): CascadeRiskResult[] {
  const results: CascadeRiskResult[] = [];

  // Build node lookup and adjacency
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const adj = new Map<string, Array<{ neighbor: string; edgeType: string; strength: number }>>();
  for (const n of nodes) adj.set(n.id, []);
  for (const e of edges) {
    adj.get(e.source)?.push({ neighbor: e.target, edgeType: e.edgeType, strength: e.strength });
    adj.get(e.target)?.push({ neighbor: e.source, edgeType: e.edgeType, strength: e.strength });
  }

  // Build cluster membership map
  const nodeCluster = new Map<string, RiskCluster>();
  for (const cluster of clusters) {
    for (const nodeId of cluster.nodeIds) {
      nodeCluster.set(nodeId, cluster);
    }
  }

  // Score each pending node
  const pendingNodes = nodes.filter(
    n => (n.type === 'analysis' || n.type === 'human_decision') && !n.outcome
  );

  for (const node of pendingNodes) {
    const cluster = nodeCluster.get(node.id);
    if (!cluster) continue;

    // Count failures in cluster
    const clusterNodes = cluster.nodeIds.map(id => nodeMap.get(id)).filter(Boolean) as RiskNode[];
    const decisions = clusterNodes.filter(
      n => n.type === 'analysis' || n.type === 'human_decision'
    );
    const failures = decisions.filter(n => n.outcome === 'failure');
    const withOutcome = decisions.filter(n => n.outcome);
    const clusterFailureRate = withOutcome.length > 0 ? failures.length / withOutcome.length : 0;

    // Count shared bias edges to failed nodes
    const neighbors = adj.get(node.id) || [];
    const relatedFailures: CascadeRiskResult['relatedFailures'] = [];

    for (const { neighbor, edgeType } of neighbors) {
      const neighborNode = nodeMap.get(neighbor);
      if (!neighborNode || neighborNode.outcome !== 'failure') continue;
      const sharedBiases = edgeType === 'shared_bias' ? 1 : 0;
      relatedFailures.push({ nodeId: neighbor, sharedBiases });
    }

    // Compute risk score
    let riskScore = 0;

    // Factor 1: Cluster failure rate (0-40 points)
    riskScore += clusterFailureRate * 40;

    // Factor 2: Direct connections to failures (0-30 points)
    riskScore += Math.min(30, relatedFailures.length * 10);

    // Factor 3: Low decision score (0-20 points)
    riskScore += Math.max(0, ((50 - node.score) / 50) * 20);

    // Factor 4: High bias count (0-10 points)
    riskScore += Math.min(10, node.biasCount * 2);

    riskScore = Math.round(Math.min(100, riskScore));

    if (riskScore < 20) continue;

    const reasons: string[] = [];
    if (clusterFailureRate > 0.5)
      reasons.push(`cluster failure rate ${Math.round(clusterFailureRate * 100)}%`);
    if (relatedFailures.length > 0) reasons.push(`${relatedFailures.length} connected failure(s)`);
    if (node.score < 50) reasons.push(`low quality score ${Math.round(node.score)}`);
    if (node.biasCount > 3) reasons.push(`${node.biasCount} biases detected`);

    results.push({
      nodeId: node.id,
      riskScore,
      reason: reasons.join('; '),
      relatedFailures,
      clusterFailureRate,
    });
  }

  return results.sort((a, b) => b.riskScore - a.riskScore);
}
