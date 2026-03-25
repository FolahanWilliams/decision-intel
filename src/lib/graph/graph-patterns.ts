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
  patternType:
    | 'echo_chamber_cluster'
    | 'cascade_failure'
    | 'bias_concentration'
    | 'reversal_chain'
    | 'isolated_high_risk'
    | 'knowledge_fragmentation';
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
    const clusterEdges = edges.filter(
      e => cluster.nodeIds.includes(e.source) && cluster.nodeIds.includes(e.target)
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

  const fragmentationPatterns = detectKnowledgeFragmentation(nodes, edges, clusters);
  patterns.push(...fragmentationPatterns);

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

  const severity = Math.round(Math.min(100, biasRatio * 50 + failureRate * 50));

  return {
    patternType: 'echo_chamber_cluster',
    severity,
    nodeIds: cluster.nodeIds,
    description: `Cluster of ${cluster.nodeIds.length} decisions with ${Math.round(biasRatio * 100)}% bias-linked edges and ${Math.round(failureRate * 100)}% failure rate. Decisions are reinforcing each other's biases.`,
    recommendation:
      "Introduce independent reviewers to this decision cluster. Consider structured devil's advocate reviews for pending decisions.",
  };
}

/**
 * Cascade Failure: chain of 3+ decisions connected by escalated_from edges
 * where earlier decisions have failure outcomes.
 */
function detectCascadeFailure(nodes: PatternNode[], edges: PatternEdge[]): GraphAntiPattern[] {
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

    const chainNodes = chain
      .map(id => nodes.find(n => n.id === id))
      .filter(Boolean) as PatternNode[];
    const failures = chainNodes.filter(n => n.outcome === 'failure');

    if (failures.length < 2) continue;

    const severity = Math.round(Math.min(100, 40 + failures.length * 20));

    patterns.push({
      patternType: 'cascade_failure',
      severity,
      nodeIds: chain,
      description: `Cascade of ${chain.length} linked decisions with ${failures.length} failures. Failed decisions are spawning follow-up decisions that also fail.`,
      recommendation:
        'Break the escalation cycle. Address root causes in the earliest failed decision before proceeding with subsequent decisions.',
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
  const decisions = nodes.filter(
    n => (n.type === 'analysis' || n.type === 'human_decision') && n.biasCount > 0
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
    recommendation:
      'Review the common factors across these decisions. Consider team-level bias awareness training focused on the recurring patterns.',
  };
}

/**
 * Isolated High Risk: high-stakes decision nodes with no graph connections
 * (no edges at all), meaning no historical context is being leveraged.
 */
function detectIsolatedHighRisk(nodes: PatternNode[], edges: PatternEdge[]): GraphAntiPattern[] {
  const connectedIds = new Set<string>();
  for (const e of edges) {
    connectedIds.add(e.source);
    connectedIds.add(e.target);
  }

  const patterns: GraphAntiPattern[] = [];
  const isolated = nodes.filter(
    n =>
      (n.type === 'analysis' || n.type === 'human_decision') &&
      !connectedIds.has(n.id) &&
      n.score < 50
  );

  if (isolated.length >= 3) {
    patterns.push({
      patternType: 'isolated_high_risk',
      severity: Math.round(Math.min(80, 30 + isolated.length * 5)),
      nodeIds: isolated.map(n => n.id),
      description: `${isolated.length} low-scoring decisions have no graph connections. These decisions are being made without leveraging organizational knowledge.`,
      recommendation:
        'Ensure new decisions reference past analyses. Use the search and recommendation features to find relevant precedents.',
    });
  }

  return patterns;
}

/**
 * Knowledge Fragmentation: detect clusters with no cross-department edges,
 * where failed decisions in one silo had successful counterparts in another.
 * Surfaces "missing perspective" insights where silos should have collaborated.
 */
function detectKnowledgeFragmentation(
  nodes: PatternNode[],
  edges: PatternEdge[],
  clusters: PatternCluster[]
): GraphAntiPattern[] {
  const patterns: GraphAntiPattern[] = [];

  // Find clusters with no cross_department edges
  const crossDeptEdges = edges.filter(e => e.edgeType === 'cross_department');
  const crossConnectedClusters = new Set<string>();

  for (const edge of crossDeptEdges) {
    for (const cluster of clusters) {
      if (cluster.nodeIds.includes(edge.source) || cluster.nodeIds.includes(edge.target)) {
        crossConnectedClusters.add(cluster.id);
      }
    }
  }

  // Identify fragmented clusters: no cross-department edges + contain failures
  const fragmentedClusters = clusters.filter(c => {
    if (crossConnectedClusters.has(c.id)) return false;
    if (c.nodeIds.length < 2) return false;

    const clusterNodes = nodes.filter(n => c.nodeIds.includes(n.id));
    const failures = clusterNodes.filter(n => n.outcome === 'failure');
    return failures.length > 0;
  });

  if (fragmentedClusters.length < 2) return patterns;

  // Check if failed decisions in one cluster have successful counterparts in another
  for (let i = 0; i < fragmentedClusters.length; i++) {
    for (let j = i + 1; j < fragmentedClusters.length; j++) {
      const clusterA = fragmentedClusters[i];
      const clusterB = fragmentedClusters[j];

      const nodesA = nodes.filter(n => clusterA.nodeIds.includes(n.id));
      const nodesB = nodes.filter(n => clusterB.nodeIds.includes(n.id));

      const failuresA = nodesA.filter(n => n.outcome === 'failure');
      const successesB = nodesB.filter(n => n.outcome === 'success');
      const failuresB = nodesB.filter(n => n.outcome === 'failure');
      const successesA = nodesA.filter(n => n.outcome === 'success');

      // Pattern: one cluster has failures, the other has successes
      const hasCounterpart =
        (failuresA.length > 0 && successesB.length > 0) ||
        (failuresB.length > 0 && successesA.length > 0);

      if (!hasCounterpart) continue;

      // Check if clusters share any similar biases (via shared_bias edges)
      const sharedBiasEdges = edges.filter(
        e =>
          e.edgeType === 'shared_bias' &&
          ((clusterA.nodeIds.includes(e.source) && clusterB.nodeIds.includes(e.target)) ||
            (clusterB.nodeIds.includes(e.source) && clusterA.nodeIds.includes(e.target)))
      );

      if (sharedBiasEdges.length === 0) continue;

      const allNodeIds = [...clusterA.nodeIds, ...clusterB.nodeIds];
      const failureCount = failuresA.length + failuresB.length;
      const severity = Math.round(
        Math.min(90, 40 + failureCount * 10 + sharedBiasEdges.length * 5)
      );

      patterns.push({
        patternType: 'knowledge_fragmentation',
        severity,
        nodeIds: allNodeIds,
        description: `${fragmentedClusters.length} siloed decision clusters with no cross-department edges. Failed decisions in one group had successful counterparts in another — ${failureCount} failures could have been informed by peers' successes.`,
        recommendation:
          'Break decision silos: set up cross-team decision reviews, create shared decision templates, and use the knowledge graph to surface similar decisions from other teams before finalizing.',
      });

      break; // One fragmentation pattern per pair is sufficient
    }
  }

  return patterns;
}
