/**
 * Cron: Infer Decision Graph Edges
 *
 * GET /api/cron/infer-graph-edges — Batch discover temporal edges for all orgs
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { inferTemporalEdges } from '@/lib/graph/edge-inference';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('CronInferGraphEdges');

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const orgs = await prisma.organization.findMany({
      select: { id: true },
    });

    const results: Array<{ orgId: string; edgesCreated: number }> = [];

    for (const org of orgs) {
      const edgesCreated = await inferTemporalEdges(org.id);
      results.push({ orgId: org.id, edgesCreated });
    }

    const total = results.reduce((s, r) => s + r.edgesCreated, 0);
    log.info(`Graph edge inference complete: ${total} edges across ${results.length} orgs`);

    return NextResponse.json({
      success: true,
      orgsProcessed: results.length,
      totalEdgesCreated: total,
      details: results,
    });
  } catch (error) {
    log.error('Graph edge inference cron failed:', error);
    return NextResponse.json(
      { error: 'Graph edge inference failed' },
      { status: 500 }
    );
  }
}
