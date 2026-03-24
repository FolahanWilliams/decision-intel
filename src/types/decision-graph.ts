// ─── Node Types ─────────────────────────────────────────────────────────────

export type GraphNodeType =
  | 'analysis'
  | 'human_decision'
  | 'person'
  | 'bias_pattern'
  | 'outcome';

// ─── Edge Types ─────────────────────────────────────────────────────────────

export type DecisionEdgeType =
  | 'influenced_by'
  | 'escalated_from'
  | 'reversed'
  | 'depends_on'
  | 'similar_to'
  | 'same_topic'
  | 'shared_bias'
  | 'same_participants';

// ─── Node Data Interfaces ───────────────────────────────────────────────────

export interface AnalysisNodeData {
  documentId: string;
  filename: string;
  overallScore: number;
  biasCount: number;
  createdAt: string;
  outcomeStatus: 'success' | 'failure' | 'mixed' | 'pending' | null;
  monetaryValue: number | null;
}

export interface HumanDecisionNodeData {
  source: string;
  channel: string;
  participantCount: number;
  qualityScore: number;
  createdAt: string;
}

export interface PersonNodeData {
  name: string;
  decisionCount: number;
  avgQuality: number;
}

export interface BiasPatternNodeData {
  biasType: string;
  occurrenceCount: number;
  avgSeverity: number;
  failureCorrelation: number;
}

export interface OutcomeNodeData {
  result: 'success' | 'failure' | 'mixed' | 'pending';
  impactScore: number;
  reportedAt: string;
}

// ─── Node Data Map ──────────────────────────────────────────────────────────

export type GraphNodeDataMap = {
  analysis: AnalysisNodeData;
  human_decision: HumanDecisionNodeData;
  person: PersonNodeData;
  bias_pattern: BiasPatternNodeData;
  outcome: OutcomeNodeData;
};

// ─── Graph Node ─────────────────────────────────────────────────────────────

export interface GraphNode<T extends GraphNodeType = GraphNodeType> {
  id: string;
  type: T;
  label: string;
  data: GraphNodeDataMap[T];

  // D3 simulation position fields
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

// ─── Graph Edge ─────────────────────────────────────────────────────────────

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  edgeType: DecisionEdgeType;
  strength: number;
  confidence: number;
  createdBy: 'system' | 'user';
  description: string;
  metadata: Record<string, unknown>;
  status: 'active' | 'archived';
}

// ─── Clusters ───────────────────────────────────────────────────────────────

export interface GraphCluster {
  id: string;
  label: string;
  nodeIds: string[];
  dominantBias: string | null;
  avgQuality: number;
}

// ─── Graph Stats ────────────────────────────────────────────────────────────

export interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  clusterCount: number;
  avgClusterSize: number;
  mostConnectedNodeId: string | null;
}

// ─── API Response ───────────────────────────────────────────────────────────

export interface DecisionGraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: GraphCluster[];
  stats: GraphStats;
}
