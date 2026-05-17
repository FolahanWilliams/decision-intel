/**
 * GET /api/cron/proxy-resolution — Defensibility Vector 1 day-90 sweep
 * (locked 2026-05-17).
 *
 * Runs daily via the dispatcher. Pure idempotent Brier backfill:
 * stamps a per-proxy Brier score on any operational proxy that has a
 * resolution recorded but no score yet (mirrors the PMI M-3 cron's
 * score-on-observation shape). It does NOT auto-infer observations —
 * the embedded antagonism is the human returning to resolve a due
 * proxy (surfaced on the decision-detail card + the outcome gate);
 * autonomous inference is deliberately sequenced behind this.
 *
 * Protected by CRON_SECRET (server-to-server Bearer), same as every
 * other cron sub-route.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { safeCompare } from '@/lib/utils/safe-compare';
import {
  parsePriorsForProxies,
  scoreResolvedProxies,
  dueUnresolvedProxies,
} from '@/lib/containers/operational-proxy-gate';

const log = createLogger('ProxyResolutionCron');

export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET?.trim();

/** Bound the scan — there will never be many active containers with
 *  priors at Phase-1 scale; the cap protects against pathological
 *  growth, not normal load. */
const MAX_CONTAINERS = 500;

export async function GET(request: NextRequest) {
  if (!CRON_SECRET) {
    log.error('CRON_SECRET not configured — rejecting request');
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  const authHeader = request.headers.get('authorization') ?? '';
  if (!safeCompare(authHeader, `Bearer ${CRON_SECRET}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let rows: Array<{ id: string; priors: Prisma.JsonValue }> = [];
    try {
      rows = await prisma.decisionContainer.findMany({
        where: { status: 'active', priors: { not: Prisma.JsonNull } },
        select: { id: true, priors: true },
        take: MAX_CONTAINERS,
      });
    } catch (dbErr) {
      // @schema-drift-tolerant — pre-priors-column envs return nothing
      log.warn('proxy-resolution scan query failed (schema drift?):', String(dbErr));
      return NextResponse.json({ success: true, scanned: 0, scored: 0, due: 0 });
    }

    const nowMs = Date.now();
    let scored = 0;
    let due = 0;

    for (const row of rows) {
      const parsed = parsePriorsForProxies(row.priors);
      if (!parsed) continue;

      due += dueUnresolvedProxies(parsed, nowMs).length;

      const { changed, microPredictions } = scoreResolvedProxies(parsed);
      if (!changed) continue;

      const existing = (row.priors as Record<string, unknown> | null) ?? {};
      const merged = { ...existing, microPredictions };
      try {
        await prisma.decisionContainer.update({
          where: { id: row.id },
          data: { priors: merged as unknown as Prisma.InputJsonValue },
        });
        scored++;
      } catch (uErr) {
        log.warn(`proxy-resolution backfill failed for ${row.id}:`, String(uErr));
      }
    }

    log.info(
      `proxy-resolution sweep: scanned=${rows.length} backfilled=${scored} due-unresolved=${due}`
    );
    return NextResponse.json({ success: true, scanned: rows.length, scored, due });
  } catch (error) {
    log.error('proxy-resolution cron failed:', error);
    return NextResponse.json({ error: 'proxy-resolution sweep failed' }, { status: 500 });
  }
}
