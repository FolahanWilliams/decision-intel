/**
 * 66-Day Protocol check-in API (2026-06-14).
 *
 * The founder-private "choose reality" tracker — two ~15-second check-ins a
 * day (morning intention + night honest mark) that grow a tree to full bloom
 * at day 66. Single-user, founder-scoped, partitioned by Supabase user.id like
 * every other /api/founder-os/* route. No audit logging (consistent with the
 * rest of the founder-os surface).
 *
 * LOAD-BEARING INVARIANT: a slip (stayedOnTrack=false) is stored honestly but
 * the tree math (src/components/founder-hub/reality-protocol/tree-growth.ts)
 * NEVER resets on it. Nothing here zeroes progress; the only mutation is an
 * upsert of the day's morning/night row.
 *
 * GET /api/founder-os/reality-checkin?days=90
 *   Returns check-ins within the last `days` days (default 90; max 366),
 *   ordered date asc, for the tree + stats math.
 *
 * POST /api/founder-os/reality-checkin
 *   Body: { date, kind: 'morning'|'night', escapePlan?, stayedOnTrack?, note?, verseRef? }
 *   Upserts the (date, kind) row. Morning carries escapePlan; night carries
 *   stayedOnTrack. Idempotent — re-posting the same (date, kind) overwrites.
 *
 * DELETE /api/founder-os/reality-checkin?all=1
 *   Founder-scoped hard reset of the whole tracker (the original's "Reset").
 */

import { prisma } from '@/lib/prisma';
import { authenticateFounderOs } from '@/lib/founder-os/auth';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('FounderOsRealityCheckin');

export const dynamic = 'force-dynamic';

const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;
const KINDS = new Set(['morning', 'night']);

interface PostBody {
  date?: string;
  kind?: string;
  escapePlan?: string;
  stayedOnTrack?: boolean;
  note?: string;
  verseRef?: string;
}

function cleanText(v: unknown, max: number): string | null {
  return typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;
}

export async function GET(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }

  const url = new URL(request.url);
  const days = Math.min(Math.max(parseInt(url.searchParams.get('days') ?? '90', 10) || 90, 7), 366);
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  try {
    const checkins = await prisma.founderOsRealityCheckin.findMany({
      where: { userId: auth.userId, date: { gte: cutoff } },
      orderBy: [{ date: 'asc' }, { kind: 'asc' }],
    });
    return apiSuccess({ data: { checkins } });
  } catch (err) {
    // @schema-drift-tolerant — pre-migration envs have no table; fail soft to
    // an empty tracker rather than a 500 (the page renders a seed).
    log.warn('list failed:', err);
    return apiSuccess({ data: { checkins: [] } });
  }
}

export async function POST(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return apiError({ error: 'Invalid JSON body', status: 400 });
  }

  if (!body.date || typeof body.date !== 'string' || !DATE_RX.test(body.date)) {
    return apiError({ error: 'date (YYYY-MM-DD) required', status: 400 });
  }
  if (!body.kind || typeof body.kind !== 'string' || !KINDS.has(body.kind)) {
    return apiError({ error: "kind must be 'morning' or 'night'", status: 400 });
  }

  const escapePlan = cleanText(body.escapePlan, 500);
  const note = cleanText(body.note, 500);
  const verseRef = cleanText(body.verseRef, 120);
  const stayedOnTrack =
    body.kind === 'night' && typeof body.stayedOnTrack === 'boolean' ? body.stayedOnTrack : null;

  try {
    const checkin = await prisma.founderOsRealityCheckin.upsert({
      where: {
        // Compound unique (userId, date, kind) — one row per slot per day.
        userId_date_kind: { userId: auth.userId, date: body.date, kind: body.kind },
      },
      create: {
        userId: auth.userId,
        date: body.date,
        kind: body.kind,
        escapePlan,
        stayedOnTrack,
        note,
        verseRef,
      },
      update: { escapePlan, stayedOnTrack, note, verseRef },
    });
    return apiSuccess({ data: { checkin } });
  } catch (err) {
    log.warn('upsert failed:', err);
    return apiError({ error: 'Failed to save check-in', status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }

  const all = new URL(request.url).searchParams.get('all');
  if (all !== '1') {
    return apiError({ error: 'Pass ?all=1 to reset the tracker', status: 400 });
  }

  try {
    await prisma.founderOsRealityCheckin.deleteMany({ where: { userId: auth.userId } });
    return apiSuccess({ data: { reset: true } });
  } catch (err) {
    log.warn('reset failed:', err);
    return apiError({ error: 'Failed to reset', status: 500 });
  }
}
