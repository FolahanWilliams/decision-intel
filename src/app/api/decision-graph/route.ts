/**
 * Decision Knowledge Graph API
 *
 * GET /api/decision-graph?orgId=...&timeRange=90&nodeTypes=analysis,human_decision&edgeTypes=all
 *
 * Returns graph nodes (decisions) and edges (relationships) for visualization.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('DecisionGraphAPI');

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get('orgId');
  const timeRange = parseInt(searchParams.get('timeRange') || '90', 10);
  const highlightNode = searchParams.get('highlightNode');
  const depth = parseInt(searchParams.get('depth') || '0', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10), 500);

  if (!orgId) {
    return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
  }

  try {
    const since = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000);

    // Fetch analysis nodes
    const analyses = await prisma.analysis.findMany({
      where: {
        document: { orgId },
        createdAt: { gte: since },
      },
      include: {
        biases: { select: { id: true, biasType: true, severity: true } },
        document: {
          select: {
            id: true,
            filename: true,
            decisionFrame: { select: { monetaryValue: true, stakeholders: true } },
          },
        },
        outcome: { select: { outcome: true, impactScore: true } },
        toxicCombinations: {
          where: { status: 'active' },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Fetch human decision nodes
    const humanDecisions = await prisma.humanDecision.findMany({
      where: {
        orgId,
        createdAt: { gte: since },
      },
      include: {
        cognitiveAudit: {
          select: { decisionQualityScore: true, dissenterCount: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.max(50, limit - analyses.length),
    });

    // Build node list
    interface GraphNode {
      id: string;
      type: string;
      label: string;
      score: number;
      outcome?: string;
      biasCount: number;
      toxicComboCount: number;
      participants: string[];
      monetaryValue: number | null;
      createdAt: string;
    }

    const nodes: GraphNode[] = [];
    const nodeIds = new Set<string>();

    for (const a of analyses) {
      nodes.push({
        id: a.id,
        type: 'analysis',
        label: a.document.filename,
        score: a.overallScore,
        outcome: a.outcome?.outcome,
        biasCount: a.biases.length,
        toxicComboCount: a.toxicCombinations.length,
        participants: a.document.decisionFrame?.stakeholders ?? [],
        monetaryValue: a.document.decisionFrame?.monetaryValue
          ? Number(a.document.decisionFrame.monetaryValue)
          : null,
        createdAt: a.createdAt.toISOString(),
      });
      nodeIds.add(a.id);
    }

    for (const hd of humanDecisions) {
      nodes.push({
        id: hd.id,
        type: 'human_decision',
        label: hd.content.slice(0, 80) + (hd.content.length > 80 ? '...' : ''),
        score: hd.cognitiveAudit?.decisionQualityScore ?? 50,
        outcome: undefined,
        biasCount: 0,
        toxicComboCount: 0,
        participants: hd.participants,
        monetaryValue: null,
        createdAt: hd.createdAt.toISOString(),
      });
      nodeIds.add(hd.id);
    }

    // Fetch edges
    const allNodeIds = [...nodeIds];

    let edgeWhere: Record<string, unknown> = {
      orgId,
      OR: [
        { sourceId: { in: allNodeIds } },
        { targetId: { in: allNodeIds } },
      ],
    };

    // If highlighting a specific node with depth=1, only fetch its direct edges
    if (highlightNode && depth === 1) {
      edgeWhere = {
        orgId,
        OR: [
          { sourceId: highlightNode },
          { targetId: highlightNode },
        ],
      };
    }

    const edges = await prisma.decisionEdge.findMany({
      where: edgeWhere,
      orderBy: { strength: 'desc' },
      take: 1000,
    });

    // Compute stats
    const degreeMap = new Map<string, number>();
    for (const e of edges) {
      degreeMap.set(e.sourceId, (degreeMap.get(e.sourceId) ?? 0) + 1);
      degreeMap.set(e.targetId, (degreeMap.get(e.targetId) ?? 0) + 1);
    }

    // Connected components (simple union-find for cluster count)
    const parent = new Map<string, string>();
    const find = (x: string): string => {
      if (!parent.has(x)) parent.set(x, x);
      if (parent.get(x) !== x) parent.set(x, find(parent.get(x)!));
      return parent.get(x)!;
    };
    const union = (a: string, b: string) => {
      parent.set(find(a), find(b));
    };

    for (const n of nodes) parent.set(n.id, n.id);
    for (const e of edges) union(e.sourceId, e.targetId);
    const clusters = new Set([...parent.keys()].map(find)).size;

    const mostConnected = [...degreeMap.entries()]
      .sort((a, b) => b[1] - a[1])[0];

    const totalDegree = [...degreeMap.values()].reduce((s, d) => s + d, 0);

    return NextResponse.json({
      nodes,
      edges: edges.map(e => ({
        id: e.id,
        source: e.sourceId,
        target: e.targetId,
        sourceType: e.sourceType,
        targetType: e.targetType,
        edgeType: e.edgeType,
        strength: e.strength,
        confidence: e.confidence,
        description: e.description,
        isManual: e.isManual,
      })),
      stats: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        clusters,
        mostConnectedNode: mostConnected?.[0] ?? null,
        avgDegree: nodes.length > 0
          ? Number((totalDegree / nodes.length).toFixed(1))
          : 0,
      },
    });
  } catch (error) {
    log.error('Failed to fetch decision graph:', error);
    return NextResponse.json(
      { error: 'Failed to fetch decision graph' },
      { status: 500 }
    );
  }
}
