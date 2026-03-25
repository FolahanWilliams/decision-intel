/**
 * GET /api/decision-graph/trends
 * Returns graph statistics bucketed by week for trend visualization.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { detectTemporalAnomalies } from '@/lib/graph/anomaly-detection';

const log = createLogger('DecisionGraphTrendsAPI');

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
  const weeks = Math.min(52, parseInt(searchParams.get('weeks') || '12', 10));

  if (!orgId) {
    return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
  }

  try {
    const since = new Date();
    since.setDate(since.getDate() - weeks * 7);

    const edges = await prisma.decisionEdge.findMany({
      where: { orgId, createdAt: { gte: since } },
      select: { createdAt: true, edgeType: true },
      orderBy: { createdAt: 'asc' },
    });

    // Bucket by week
    const weekBuckets = new Map<string, { edges: number; biasEdges: number; similarityEdges: number }>();

    for (const edge of edges) {
      const d = new Date(edge.createdAt);
      // Get ISO week start (Monday)
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(d.setDate(diff));
      const key = weekStart.toISOString().split('T')[0];

      if (!weekBuckets.has(key)) {
        weekBuckets.set(key, { edges: 0, biasEdges: 0, similarityEdges: 0 });
      }
      const bucket = weekBuckets.get(key)!;
      bucket.edges++;
      if (edge.edgeType === 'shared_bias') bucket.biasEdges++;
      if (edge.edgeType === 'similar_to') bucket.similarityEdges++;
    }

    const weeklyData = [...weekBuckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, data]) => ({ week, ...data }));

    // Top bias patterns (from bias_pattern-type edges)
    const biasEdges = edges.filter(e => e.edgeType === 'shared_bias');
    const totalEdges = edges.length;

    // Detect temporal anomalies
    const anomalies = detectTemporalAnomalies(weeklyData);

    return NextResponse.json({
      weeklyData,
      totalEdges,
      biasEdges: biasEdges.length,
      weeks,
      anomalies,
    });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') {
      return NextResponse.json({
        weeklyData: [],
        totalEdges: 0,
        biasEdges: 0,
        weeks,
        _schemaDrift: true,
      });
    }
    log.error('Failed to get graph trends:', error);
    return NextResponse.json({ error: 'Failed to get graph trends' }, { status: 500 });
  }
}
