/**
 * Graph Network Analysis Report — computes SNA metrics and
 * generates a structured report for executive consumption.
 */

import { buildDecisionGraph } from '@/lib/graph/graph-builder';
import { computePageRank, computeDegreeCentrality } from '@/lib/graph/centrality';
import { computeCascadeRisk } from '@/lib/graph/cascade-risk';
import { computeOrgRiskState } from '@/lib/graph/risk-state';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('GraphReport');

export interface GraphNetworkReport {
  generatedAt: string;
  orgId: string;
  metrics: {
    nodeCount: number;
    edgeCount: number;
    density: number;
    avgDegree: number;
    clusterCount: number;
    avgClusterSize: number;
    isolatedNodes: number;
  };
  topNodes: Array<{
    id: string;
    label: string;
    type: string;
    pageRank: number;
    degree: number;
    score: number;
  }>;
  antiPatterns: Array<{
    patternType: string;
    severity: number;
    description: string;
    recommendation: string;
    affectedNodes: number;
  }>;
  riskState: {
    overallRisk: string;
    riskScore: number;
    factors: Array<{ factor: string; description: string }>;
    trend: string;
  };
  cascadeRisks: Array<{
    nodeId: string;
    riskScore: number;
    reason: string;
  }>;
  edgeTypeDistribution: Record<string, number>;
  nodeTypeDistribution: Record<string, number>;
}

export async function generateGraphReport(
  orgId: string,
  userId: string,
  timeRangeDays: number = 90
): Promise<GraphNetworkReport> {
  try {
    const graph = await buildDecisionGraph({
      orgId,
      userId,
      timeRangeDays,
      limit: 500,
    });

    const { nodes, edges, clusters, stats, antiPatterns } = graph;

    // Centrality metrics
    const pageRanks = computePageRank(nodes, edges);
    const degreeCentrality = computeDegreeCentrality(nodes, edges);
    // Top nodes by PageRank
    const topNodes = [...pageRanks.entries()]
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id, pr]) => {
        const node = nodes.find(n => n.id === id);
        const degree = degreeCentrality.get(id);
        return {
          id,
          label: node?.label || id.slice(0, 30),
          type: node?.type || 'unknown',
          pageRank: Math.round(pr * 100) / 100,
          degree: degree?.total || 0,
          score: node?.score || 0,
        };
      });

    // Network density
    const maxEdges = nodes.length * (nodes.length - 1) / 2;
    const density = maxEdges > 0 ? Math.round((edges.length / maxEdges) * 1000) / 1000 : 0;

    // Isolated nodes (no edges)
    const connectedIds = new Set<string>();
    for (const e of edges) {
      connectedIds.add(e.source);
      connectedIds.add(e.target);
    }
    const isolatedNodes = nodes.filter(n => !connectedIds.has(n.id)).length;

    // Edge and node type distributions
    const edgeTypeDistribution: Record<string, number> = {};
    for (const e of edges) {
      edgeTypeDistribution[e.edgeType] = (edgeTypeDistribution[e.edgeType] || 0) + 1;
    }
    const nodeTypeDistribution: Record<string, number> = {};
    for (const n of nodes) {
      nodeTypeDistribution[n.type] = (nodeTypeDistribution[n.type] || 0) + 1;
    }

    // Cascade risks
    const cascadeRisks = computeCascadeRisk(nodes, edges, clusters)
      .slice(0, 5)
      .map(r => ({ nodeId: r.nodeId, riskScore: r.riskScore, reason: r.reason }));

    // Risk state
    const riskState = await computeOrgRiskState(orgId);

    // Avg cluster size
    const avgClusterSize = clusters.length > 0
      ? Math.round(clusters.reduce((s, c) => s + c.nodeIds.length, 0) / clusters.length * 10) / 10
      : 0;

    return {
      generatedAt: new Date().toISOString(),
      orgId,
      metrics: {
        nodeCount: stats.totalNodes,
        edgeCount: stats.totalEdges,
        density,
        avgDegree: stats.avgDegree,
        clusterCount: clusters.length,
        avgClusterSize,
        isolatedNodes,
      },
      topNodes,
      antiPatterns: antiPatterns.map(p => ({
        patternType: p.patternType,
        severity: p.severity,
        description: p.description,
        recommendation: p.recommendation,
        affectedNodes: p.nodeIds.length,
      })),
      riskState: {
        overallRisk: riskState.overallRisk,
        riskScore: riskState.riskScore,
        factors: riskState.factors.map(f => ({ factor: f.factor, description: f.description })),
        trend: riskState.trend,
      },
      cascadeRisks,
      edgeTypeDistribution,
      nodeTypeDistribution,
    };
  } catch (error) {
    log.error('Failed to generate graph report:', error);
    throw error;
  }
}
