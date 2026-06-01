/**
 * Faith OS evening-reflection API — the 60-second close on the day's three.
 * Two honest lines: what MOVED, what BLOCKED. A record that feeds the weekly
 * review + pattern view, never a verdict.
 *
 * GET /api/founder-os/daily-reflections?days=60
 *   Returns reflections within the last `days` days (default 60; max 365),
 *   ordered date desc. With ?date=YYYY-MM-DD, returns just that day's row.
 *
 * POST /api/founder-os/daily-reflections
 *   Body: { date, moved?, blocked? } — upserts the row for that date
 *   (unique [userId, date]); re-saving overwrites cleanly.
 *
 * No audit logging — consistent with every other /api/founder-os/* route.
 */

import { prisma } from '@/lib/prisma';
import { authenticateFounderOs } from '@/lib/founder-os/auth';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('FounderOsDailyReflections');

export const dynamic = 'force-dynamic';

const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;

interface PostBody {
  date?: string;
  moved?: string;
  blocked?: string;
}

export async function GET(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }

  const url = new URL(request.url);
  const date = url.searchParams.get('date');

  try {
    if (date && DATE_RX.test(date)) {
      const reflection = await prisma.founderOsDailyReflection.findUnique({
        where: { userId_date: { userId: auth.userId, date } },
      });
      return apiSuccess({ data: { reflections: reflection ? [reflection] : [] } });
    }
    const days = Math.min(
      Math.max(parseInt(url.searchParams.get('days') ?? '60', 10) || 60, 7),
      365
    );
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const reflections = await prisma.founderOsDailyReflection.findMany({
      where: { userId: auth.userId, date: { gte: cutoff } },
      orderBy: { date: 'desc' },
    });
    return apiSuccess({ data: { reflections } });
  } catch (err) {
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

  if (!body.date || !DATE_RX.test(body.date)) {
    return apiError({ error: 'date (YYYY-MM-DD) required', status: 400 });
  }
  const moved = typeof body.moved === 'string' ? body.moved.trim().slice(0, 2000) || null : null;
  const blocked =
    typeof body.blocked === 'string' ? body.blocked.trim().slice(0, 2000) || null : null;

  try {
    const reflection = await prisma.founderOsDailyReflection.upsert({
      where: { userId_date: { userId: auth.userId, date: body.date } },
      create: { userId: auth.userId, date: body.date, moved, blocked },
      update: { moved, blocked },
    });
    return apiSuccess({ data: { reflection } });
  } catch (err) {
    log.warn('upsert failed:', err);
    return apiError({ error: 'Failed to save reflection', status: 500 });
  }
}
