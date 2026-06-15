/**
 * 66-Day Protocol — the OPTIONAL evening reflection API (2026-06-15).
 *
 * Founder-private, single-user, partitioned by Supabase user.id like every
 * other /api/founder-os/* route. No audit logging (consistent with the rest of
 * the founder-os surface). Mirrors /api/founder-os/reality-checkin.
 *
 * LOAD-BEARING INVARIANT: this surface NEVER feeds the tree. The tree math
 * reads FounderOsRealityCheckin only; a reflection is a separate, optional
 * signal for the read-only trend view. The ratings are descriptive 1-5
 * self-observations, never a grade and never a streak.
 *
 * GET /api/founder-os/reality-reflection?days=90
 *   Returns reflections within the last `days` days (default 90; max 366),
 *   ordered date asc, for the trend math.
 *
 * POST /api/founder-os/reality-reflection
 *   Body: { date, mind?, energy?, intention?, note?, tomorrow? }
 *   Upserts the (userId, date) row. Each factor is a 1-5 int or null; out-of-
 *   range / non-numeric coerces to null. Idempotent.
 *
 * DELETE /api/founder-os/reality-reflection?all=1
 *   Founder-scoped reset of the reflection log (paired with the tracker reset).
 */

import { prisma } from '@/lib/prisma';
import { authenticateFounderOs } from '@/lib/founder-os/auth';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('FounderOsRealityReflection');

export const dynamic = 'force-dynamic';

const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;
const SCALE_MIN = 1;
const SCALE_MAX = 5;

interface PostBody {
  date?: string;
  mind?: unknown;
  energy?: unknown;
  intention?: unknown;
  note?: unknown;
  tomorrow?: unknown;
}

/** A valid 1-5 integer rating, or null. Descriptive — never a grade. */
function cleanScore(v: unknown): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  const n = Math.round(v);
  return n >= SCALE_MIN && n <= SCALE_MAX ? n : null;
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
    const reflections = await prisma.founderOsRealityReflection.findMany({
      where: { userId: auth.userId, date: { gte: cutoff } },
      orderBy: [{ date: 'asc' }],
    });
    return apiSuccess({ data: { reflections } });
  } catch (err) {
    // @schema-drift-tolerant — pre-migration envs have no table; fail soft to
    // an empty trend rather than a 500.
    log.warn('list failed:', err);
    return apiSuccess({ data: { reflections: [] } });
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

  const mind = cleanScore(body.mind);
  const energy = cleanScore(body.energy);
  const intention = cleanScore(body.intention);
  const note = cleanText(body.note, 1000);
  const tomorrow = cleanText(body.tomorrow, 500);

  try {
    const reflection = await prisma.founderOsRealityReflection.upsert({
      where: { userId_date: { userId: auth.userId, date: body.date } },
      create: { userId: auth.userId, date: body.date, mind, energy, intention, note, tomorrow },
      update: { mind, energy, intention, note, tomorrow },
    });
    return apiSuccess({ data: { reflection } });
  } catch (err) {
    log.warn('upsert failed:', err);
    return apiError({ error: 'Failed to save reflection', status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }

  const all = new URL(request.url).searchParams.get('all');
  if (all !== '1') {
    return apiError({ error: 'Pass ?all=1 to reset reflections', status: 400 });
  }

  try {
    await prisma.founderOsRealityReflection.deleteMany({ where: { userId: auth.userId } });
    return apiSuccess({ data: { reset: true } });
  } catch (err) {
    log.warn('reset failed:', err);
    return apiError({ error: 'Failed to reset', status: 500 });
  }
}
