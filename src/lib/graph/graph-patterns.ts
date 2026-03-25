/**
 * Graph-level anti-pattern detection for Decision Knowledge Graph.
 * Detects structural patterns across clusters that indicate organizational risk.
 */

interface PatternNode {
  id: string;
  type: string;
  label: string;
  score: number;
  outcome?: string;
  biasCount: number;
}

interface PatternEdge {
  source: string;
  target: string;
  edgeType: string;
  strength: number;
}

interface PatternCluster {
  id: string;
  nodeIds: string[];
}

export interface GraphAntiPattern {
  patternType: 'echo_chamber_cluster' | 'cascade_failure' | 'bias_concentration' | 'reversal_chain' | 'isolated_high_risk';
  severity: number;
  nodeIds: string[];
  description: string;
  recommendation: string;
}

/**
 * Detect graph-level anti-patterns across clusters and topology.
 */
export function detectGraphAntiPatterns(
  nodes: PatternNode[],
  edges: PatternEdge[],
  clusters: PatternCluster[]
): GraphAntiPattern[] {
  const patterns: GraphAntiPattern[] = [];

  for (const cluster of clusters) {
    if (cluster.nodeIds.length < 3) continue;
    const clusterNodes = nodes.filter(n => cluster.nodeIds.includes(n.id));
    const clusterEdges = edges.filter(e =>
      cluster.nodeIds.includes(e.source) && cluster.nodeIds.includes(e.target)
    );

    const echoChamber = detectEchoChamberCluster(cluster, clusterNodes, clusterEdges);
    if (echoChamber) patterns.push(echoChamber);

    const biasConcentration = detectBiasConcentration(cluster, clusterNodes);
    if (biasConcentration) patterns.push(biasConcentration);
  }

  const cascadeFailures = detectCascadeFailure(nodes, edges);
  patterns.push(...cascadeFailures);

  const isolatedRisks = detectIsolatedHighRisk(nodes, edges);
  patterns.push(...isolatedRisks);

  return patterns.sort((a, b) => b.severity - a.severity);
}

/**
 * Echo Chamber Cluster: cluster where >60% of edges are shared_bias type
 * and decisions share common bias patterns with poor outcomes.
 */
function detectEchoChamberCluster(
  cluster: PatternCluster,
  nodes: PatternNode[],
  edges: PatternEdge[]
): GraphAntiPattern | null {
  if (edges.length < 3) return null;

  const biasEdges = edges.filter(e => e.edgeType === 'shared_bias');
  const biasRatio = biasEdges.length / edges.length;

  const decisions = nodes.filter(n => n.type === 'analysis' || n.type === 'human_decision');
  const failures = decisions.filter(n => n.outcome === 'failure');
  const failureRate = decisions.length > 0 ? failures.length / decisions.length : 0;

  if (biasRatio < 0.6 || failureRate < 0.3) return null;

  const severity = Math.round(Math.min(100, (biasRatio * 50 + failureRate * 50)));

  return {
    patternType: 'echo_chamber_cluster',
    severity,
    nodeIds: cluster.nodeIds,
    description: `Cluster of ${cluster.nodeIds.length} decisions with ${Math.round(biasRatio * 100)}% bias-linked edges and ${Math.round(failureRate * 100)}% failure rate. Decisions are reinforcing each other's biases.`,
    recommendation: 'Introduce independent reviewers to this decision cluster. Consider structured devil\'s advocate reviews for pending decisions.',
  };
}

/**
 * Cascade Failure: chain of 3+ decisions connected by escalated_from edges
 * where earlier decisions have failure outcomes.
 */
function detectCascadeFailure(
  nodes: PatternNode[],
  edges: PatternEdge[]
): GraphAntiPattern[] {
  const patterns: GraphAntiPattern[] = [];
  const escalationEdges = edges.filter(e => e.edgeType === 'escalated_from');

  // Build escalation chains
  const chains = new Map<string, string[]>();
  for (const edge of escalationEdges) {
    const existing = chains.get(edge.target) || [edge.target];
    existing.push(edge.source);
    chains.set(edge.target, existing);
  }

  for (const [, chain] of chains) {
    if (chain.length < 3) continue;

    const chainNodes = chain.map(id => nodes.find(n => n.id === id)).filter(Boolean) as PatternNode[];
    const failures = chainNodes.filter(n => n.outcome === 'failure');

    if (failures.length < 2) continue;

    const severity = Math.round(Math.min(100, 40 + failures.length * 20));

    patterns.push({
      patternType: 'cascade_failure',
      severity,
      nodeIds: chain,
      description: `Cascade of ${chain.length} linked decisions with ${failures.length} failures. Failed decisions are spawning follow-up decisions that also fail.`,
      recommendation: 'Break the escalation cycle. Address root causes in the earliest failed decision before proceeding with subsequent decisions.',
    });
  }

  return patterns;
}

/**
 * Bias Concentration: cluster where >80% of decisions have the same dominant bias type.
 */
function detectBiasConcentration(
  cluster: PatternCluster,
  nodes: PatternNode[]
): GraphAntiPattern | null {
  const decisions = nodes.filter(n =>
    (n.type === 'analysis' || n.type === 'human_decision') && n.biasCount > 0
  );
  if (decisions.length < 4) return null;

  // Check if avg score is low (indicating systemic issues)
  const avgScore = decisions.reduce((s, n) => s + n.score, 0) / decisions.length;
  if (avgScore > 60) return null;

  const severity = Math.round(Math.min(100, 30 + (60 - avgScore)));

  return {
    patternType: 'bias_concentration',
    severity,
    nodeIds: cluster.nodeIds,
    description: `Cluster of ${decisions.length} decisions averaging ${Math.round(avgScore)}/100 quality score. Concentrated bias patterns suggest systemic decision-making issues.`,
    recommendation: 'Review the common factors across these decisions. Consider team-level bias awareness training focused on the recurring patterns.',
  };
}

/**
 * Isolated High Risk: high-stakes decision nodes with no graph connections
 * (no edges at all), meaning no historical context is being leveraged.
 */
function detectIsolatedHighRisk(
  nodes: PatternNode[],
  edges: PatternEdge[]
): GraphAntiPattern[] {
  const connectedIds = new Set<string>();
  for (const e of edges) {
    connectedIds.add(e.source);
    connectedIds.add(e.target);
  }

  const patterns: GraphAntiPattern[] = [];
  const isolated = nodes.filter(
    n => (n.type === 'analysis' || n.type === 'human_decision') &&
         !connectedIds.has(n.id) &&
         n.score < 50
  );

  if (isolated.length >= 3) {
    patterns.push({
      patternType: 'isolated_high_risk',
      severity: Math.round(Math.min(80, 30 + isolated.length * 5)),
      nodeIds: isolated.map(n => n.id),
      description: `${isolated.length} low-scoring decisions have no graph connections. These decisions are being made without leveraging organizational knowledge.`,
      recommendation: 'Ensure new decisions reference past analyses. Use the search and recommendation features to find relevant precedents.',
    });
  }

  return patterns;
}
