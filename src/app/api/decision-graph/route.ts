/**
 * Decision Knowledge Graph API
 *
 * GET /api/decision-graph?orgId=...&timeRange=90&nodeTypes=analysis,human_decision&highlightNode=...&depth=1&limit=200
 *
 * Returns graph nodes (decisions), edges (relationships), clusters, and stats
 * for visualization.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { buildDecisionGraph } from '@/lib/graph/graph-builder';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('DecisionGraphAPI');

export const maxDuration = 30;

const EMPTY_GRAPH = {
  nodes: [],
  edges: [],
  clusters: [],
  stats: { totalNodes: 0, totalEdges: 0, clusters: 0, mostConnectedNode: null, avgDegree: 0 },
};

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
  const nodeTypesParam = searchParams.get('nodeTypes');
  const nodeTypes = nodeTypesParam
    ? nodeTypesParam
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)
    : null;

  if (!orgId) {
    return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
  }

  try {
    const result = await buildDecisionGraph({
      orgId,
      userId: user.id,
      timeRangeDays: timeRange,
      highlightNodeId: highlightNode,
      depth,
      limit,
      nodeTypes,
    });

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
    });
  } catch (error: unknown) {
    const code = (error as { code?: string }).code;

    // Schema drift protection: return empty graph if columns are missing
    if (code === 'P2021' || code === 'P2022') {
      log.warn('Schema drift detected in decision graph query, returning empty graph', { code });
      return NextResponse.json(EMPTY_GRAPH);
    }

    log.error('Failed to fetch decision graph:', error);
    return NextResponse.json({ error: 'Failed to fetch decision graph' }, { status: 500 });
  }
}
