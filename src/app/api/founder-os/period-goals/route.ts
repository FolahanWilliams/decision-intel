/**
 * Faith OS period goals API — the weekly + quarterly cascade above Today's
 * Three. Same Rule-of-3 cap as the daily goals (enforced here, not the schema).
 *
 * GET /api/founder-os/period-goals?period=week&key=2026-05-31
 *   Returns goals for that exact (period, periodKey) bucket, ordered rank asc.
 *   Without period/key, returns the most recent 60 (history).
 *
 * POST /api/founder-os/period-goals
 *   Body: { period: 'week'|'quarter', periodKey, text }
 *   Rejects the 4th ACTIVE (open|done) goal for the bucket with 400.
 *
 * PATCH /api/founder-os/period-goals
 *   Body: { id, status?, text?, committed? } — ownership-checked.
 *
 * DELETE /api/founder-os/period-goals?id=...
 *
 * No audit logging — consistent with every other /api/founder-os/* route.
 */

import { prisma } from '@/lib/prisma';
import { authenticateFounderOs } from '@/lib/founder-os/auth';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';
import { PERIOD_GOAL_MAX } from '@/components/founder-hub/faith-os/content';

const log = createLogger('FounderOsPeriodGoals');

export const dynamic = 'force-dynamic';

const PERIODS = new Set(['week', 'quarter']);
const STATUSES = new Set(['open', 'done', 'carried', 'released']);
const ACTIVE_STATUSES = ['open', 'done'];

interface PostBody {
  period?: string;
  periodKey?: string;
  text?: string;
}

interface PatchBody {
  id?: string;
  status?: string;
  text?: string;
  committed?: boolean;
}

export async function GET(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }

  const url = new URL(request.url);
  const period = url.searchParams.get('period');
  const key = url.searchParams.get('key');

  try {
    if (period && key && PERIODS.has(period)) {
      const goals = await prisma.founderOsPeriodGoal.findMany({
        where: { userId: auth.userId, period, periodKey: key },
        orderBy: { rank: 'asc' },
      });
      return apiSuccess({ data: { goals } });
    }
    const goals = await prisma.founderOsPeriodGoal.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
      take: 60,
    });
    return apiSuccess({ data: { goals } });
  } catch (err) {
    log.warn('list failed:', err);
    return apiSuccess({ data: { goals: [] } });
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

  if (!body.period || !PERIODS.has(body.period)) {
    return apiError({ error: "period must be 'week' or 'quarter'", status: 400 });
  }
  if (!body.periodKey || typeof body.periodKey !== 'string') {
    return apiError({ error: 'periodKey required', status: 400 });
  }
  const text = typeof body.text === 'string' ? body.text.trim().slice(0, 280) : '';
  if (!text) {
    return apiError({ error: 'text required', status: 400 });
  }

  try {
    const activeCount = await prisma.founderOsPeriodGoal.count({
      where: {
        userId: auth.userId,
        period: body.period,
        periodKey: body.periodKey,
        status: { in: ACTIVE_STATUSES },
      },
    });
    if (activeCount >= PERIOD_GOAL_MAX) {
      return apiError({
        error: `Three is the cap for a ${body.period} — keep the few rocks few. Finish or release one first.`,
        status: 400,
      });
    }

    const goal = await prisma.founderOsPeriodGoal.create({
      data: {
        userId: auth.userId,
        period: body.period,
        periodKey: body.periodKey,
        text,
        rank: activeCount + 1,
        status: 'open',
        committed: false,
      },
    });
    return apiSuccess({ data: { goal } });
  } catch (err) {
    log.warn('create failed:', err);
    return apiError({ error: 'Failed to add goal', status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return apiError({ error: 'Invalid JSON body', status: 400 });
  }

  if (!body.id || typeof body.id !== 'string') {
    return apiError({ error: 'id required', status: 400 });
  }
  if (body.status !== undefined && !STATUSES.has(body.status)) {
    return apiError({ error: 'invalid status', status: 400 });
  }

  try {
    const existing = await prisma.founderOsPeriodGoal.findUnique({ where: { id: body.id } });
    if (!existing || existing.userId !== auth.userId) {
      return apiError({ error: 'Not found', status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (body.status !== undefined) {
      data.status = body.status;
      data.completedAt = body.status === 'done' ? new Date() : null;
    }
    if (typeof body.text === 'string') {
      const t = body.text.trim().slice(0, 280);
      if (t) data.text = t;
    }
    if (body.committed !== undefined) data.committed = Boolean(body.committed);

    const goal = await prisma.founderOsPeriodGoal.update({ where: { id: existing.id }, data });
    return apiSuccess({ data: { goal } });
  } catch (err) {
    log.warn('update failed:', err);
    return apiError({ error: 'Failed to update goal', status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }

  const id = new URL(request.url).searchParams.get('id');
  if (!id) {
    return apiError({ error: 'id required', status: 400 });
  }

  try {
    await prisma.founderOsPeriodGoal.deleteMany({ where: { id, userId: auth.userId } });
    return apiSuccess({ data: { deleted: true } });
  } catch (err) {
    log.warn('delete failed:', err);
    return apiError({ error: 'Failed to delete goal', status: 500 });
  }
}
