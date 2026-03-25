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

// ─── Quality Escalation Chain Detection ────────────────────────────────────

export interface EscalationChain {
  nodeIds: string[];
  scores: number[];
  degradation: number; // total score drop across the chain
  severity: number;
  description: string;
}

/**
 * Detect escalation chains where decision quality degrades across connected nodes.
 * Pattern: A → B → C where score(A) > score(B) > score(C) and edges are influenced_by.
 * Flags as "quality cascade" risk for proactive nudge alerts.
 */
export function detectEscalationChains(nodes: RiskNode[], edges: RiskEdge[]): EscalationChain[] {
  const chains: EscalationChain[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // Build directed adjacency from influenced_by edges
  // influenced_by: source was influenced by target, so target → source is the causal direction
  const outgoing = new Map<string, string[]>();
  for (const e of edges) {
    if (e.edgeType !== 'influenced_by') continue;
    // e.source was influenced by e.target → causal chain: target → source
    const from = e.target;
    const to = e.source;
    if (!outgoing.has(from)) outgoing.set(from, []);
    outgoing.get(from)!.push(to);
  }

  // DFS to find degrading chains (score decreases along the path)
  function findDegradingChains(
    startId: string,
    path: string[],
    scores: number[],
    visited: Set<string>
  ): void {
    const neighbors = outgoing.get(startId) || [];

    for (const nextId of neighbors) {
      if (visited.has(nextId)) continue;
      const nextNode = nodeMap.get(nextId);
      if (!nextNode) continue;

      const lastScore = scores[scores.length - 1];
      // Quality must degrade: next score must be lower
      if (nextNode.score >= lastScore) continue;

      const newPath = [...path, nextId];
      const newScores = [...scores, nextNode.score];

      // Record chain if length >= 3
      if (newPath.length >= 3) {
        const degradation = newScores[0] - newScores[newScores.length - 1];
        const severity = Math.round(Math.min(100, degradation + newPath.length * 10));

        chains.push({
          nodeIds: newPath,
          scores: newScores,
          degradation: Math.round(degradation),
          severity,
          description: `Quality cascade: ${newPath.length} decisions with degrading scores (${newScores.map(s => Math.round(s)).join(' → ')}). Each decision influenced the next, with worsening quality.`,
        });
      }

      // Continue DFS (limit chain length to prevent combinatorial explosion)
      if (newPath.length < 6) {
        visited.add(nextId);
        findDegradingChains(nextId, newPath, newScores, visited);
        visited.delete(nextId);
      }
    }
  }

  // Start from each node
  for (const node of nodes) {
    if (!outgoing.has(node.id)) continue;
    const visited = new Set<string>([node.id]);
    findDegradingChains(node.id, [node.id], [node.score], visited);
  }

  // Deduplicate: keep the longest chain for each starting node
  const bestChains = new Map<string, EscalationChain>();
  for (const chain of chains) {
    const key = chain.nodeIds[0];
    const existing = bestChains.get(key);
    if (!existing || chain.nodeIds.length > existing.nodeIds.length) {
      bestChains.set(key, chain);
    }
  }

  return [...bestChains.values()].sort((a, b) => b.severity - a.severity);
}
