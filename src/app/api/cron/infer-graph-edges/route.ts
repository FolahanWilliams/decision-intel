/**
 * Cron: Infer Decision Graph Edges
 *
 * GET /api/cron/infer-graph-edges — Batch discover temporal edges for all orgs
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { inferTemporalEdges } from '@/lib/graph/edge-inference';
import { createLogger } from '@/lib/utils/logger';
import { safeCompare } from '@/lib/utils/safe-compare';

const log = createLogger('CronInferGraphEdges');

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  // Fail CLOSED when the secret is unconfigured — the prior `if (cronSecret &&
  // ...)` shape silently skipped auth entirely when CRON_SECRET was unset
  // (fresh deploy / env-var deletion), letting any anonymous request trigger a
  // full cross-org edge-inference scan. Every other cron route already uses
  // this fail-closed pattern; this was the lone fail-open straggler.
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  if (!authHeader || !safeCompare(authHeader, `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const orgs = await prisma.organization.findMany({
      select: { id: true },
    });

    const results: Array<{ orgId: string; edgesCreated: number }> = [];

    for (const org of orgs) {
      // Per-org isolation: one org throwing must not abort the sweep for the rest.
      try {
        const edgesCreated = await inferTemporalEdges(org.id);
        results.push({ orgId: org.id, edgesCreated });
      } catch (err) {
        log.error(`Edge inference failed for org ${org.id}; continuing:`, err);
      }
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
    return NextResponse.json({ error: 'Graph edge inference failed' }, { status: 500 });
  }
}
