/**
 * Founder OS daily checkin API.
 *
 * GET /api/founder-os/checkins?days=180
 *   Returns all checkins for the authenticated founder within the last
 *   `days` days (default 180; max 730). Sorted by date desc.
 *
 * POST /api/founder-os/checkins
 *   Body: { date, sfcZero, deepWorkHours, deepReadingMinutes, exercise,
 *           meditation, notes? }
 *   Upserts the checkin for that date (the unique [userId, date] index
 *   makes this idempotent — re-saving today's state overwrites cleanly).
 */

import { prisma } from '@/lib/prisma';
import { authenticateFounderOs } from '@/lib/founder-os/auth';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('FounderOsCheckins');

export const dynamic = 'force-dynamic';

const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;

interface PostBody {
  date?: string;
  sfcZero?: boolean;
  deepWorkHours?: number;
  deepReadingMinutes?: number;
  exercise?: boolean;
  meditation?: boolean;
  notes?: string;
}

export async function GET(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }

  const url = new URL(request.url);
  const days = Math.min(Math.max(parseInt(url.searchParams.get('days') ?? '180', 10) || 180, 7), 730);
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  try {
    const checkins = await prisma.founderOsCheckin.findMany({
      where: { userId: auth.userId, date: { gte: cutoff } },
      orderBy: { date: 'desc' },
    });
    return apiSuccess({ data: { checkins } });
  } catch (err) {
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
  if (typeof body.sfcZero !== 'boolean') {
    return apiError({ error: 'sfcZero (boolean) required', status: 400 });
  }
  const deepWorkHours =
    typeof body.deepWorkHours === 'number' && body.deepWorkHours >= 0 && body.deepWorkHours <= 18
      ? body.deepWorkHours
      : 0;
  const deepReadingMinutes =
    typeof body.deepReadingMinutes === 'number' &&
    body.deepReadingMinutes >= 0 &&
    body.deepReadingMinutes <= 600
      ? Math.round(body.deepReadingMinutes)
      : 0;
  const exercise = Boolean(body.exercise);
  const meditation = Boolean(body.meditation);
  const notes = typeof body.notes === 'string' ? body.notes.slice(0, 4000) : null;

  try {
    const result = await prisma.founderOsCheckin.upsert({
      where: { userId_date: { userId: auth.userId, date: body.date } },
      create: {
        userId: auth.userId,
        date: body.date,
        sfcZero: body.sfcZero,
        deepWorkHours,
        deepReadingMinutes,
        exercise,
        meditation,
        notes,
      },
      update: {
        sfcZero: body.sfcZero,
        deepWorkHours,
        deepReadingMinutes,
        exercise,
        meditation,
        notes,
      },
    });
    return apiSuccess({ data: { checkin: result } });
  } catch (err) {
    log.warn('upsert failed:', err);
    return apiError({ error: 'Failed to save checkin', status: 500 });
  }
}
