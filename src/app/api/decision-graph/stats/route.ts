/**
 * GET /api/decision-graph/stats
 * Lightweight endpoint returning only graph statistics (no node/edge data).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('DecisionGraphStatsAPI');

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

  if (!orgId) {
    return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
  }

  try {
    const timeRange = parseInt(searchParams.get('timeRange') || '90', 10);
    const since = new Date();
    since.setDate(since.getDate() - timeRange);

    // Count edges
    const [edgeCount, manualEdgeCount] = await Promise.all([
      prisma.decisionEdge.count({
        where: { orgId, createdAt: { gte: since } },
      }),
      prisma.decisionEdge.count({
        where: { orgId, isManual: true, createdAt: { gte: since } },
      }),
    ]);

    // Count distinct nodes (source + target from edges)
    const distinctNodes = await prisma.decisionEdge.findMany({
      where: { orgId, createdAt: { gte: since } },
      select: { sourceId: true, targetId: true },
      take: 500,
    });

    const nodeIds = new Set<string>();
    for (const e of distinctNodes) {
      nodeIds.add(e.sourceId);
      nodeIds.add(e.targetId);
    }

    const totalNodes = nodeIds.size;
    const avgDegree = totalNodes > 0 ? Math.round(((edgeCount * 2) / totalNodes) * 100) / 100 : 0;

    return NextResponse.json({
      totalNodes,
      totalEdges: edgeCount,
      inferredEdges: edgeCount - manualEdgeCount,
      manualEdges: manualEdgeCount,
      avgDegree,
    });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') {
      return NextResponse.json({
        totalNodes: 0,
        totalEdges: 0,
        inferredEdges: 0,
        manualEdges: 0,
        avgDegree: 0,
        _schemaDrift: true,
      });
    }
    log.error('Failed to get graph stats:', error);
    return NextResponse.json({ error: 'Failed to get graph stats' }, { status: 500 });
  }
}
