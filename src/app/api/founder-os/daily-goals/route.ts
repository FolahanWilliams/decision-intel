/**
 * Faith OS "Today's Three" daily-priority goals API.
 *
 * The operating-system layer of Faith OS — the research-backed practice of
 * committing to AT MOST THREE clear priorities a day (working-memory limits +
 * the Rule of 3 + the ONE Thing + Prov 16:3). The cap of three is enforced
 * HERE, not in the schema, so carry / release / reorder stay flexible.
 *
 * GET /api/founder-os/daily-goals?days=60
 *   Returns goals within the last `days` days (default 60; max 365), ordered
 *   date desc then rank asc, for today's set + the streak/heatmap math.
 *
 * POST /api/founder-os/daily-goals
 *   Body: { date, text, intention?, isHighlight? }
 *   Creates a goal. Rejects the 4th ACTIVE (open|done) goal for the date with
 *   400 — the cap is the feature. Auto-ranks; if isHighlight, demotes any
 *   other highlight that day (one Highlight per day).
 *
 * PATCH /api/founder-os/daily-goals
 *   Body: { id, status?, text?, intention?, isHighlight?, committed? }
 *   Ownership-checked. status='done' stamps completedAt; moving off 'done'
 *   clears it. isHighlight=true demotes the day's other highlight.
 *
 * DELETE /api/founder-os/daily-goals?id=...
 *   Ownership-checked hard delete.
 *
 * No audit logging — consistent with every other /api/founder-os/* route
 * (single-user, founder-scoped, partitioned by Supabase user.id).
 */

import { prisma } from '@/lib/prisma';
import { authenticateFounderOs } from '@/lib/founder-os/auth';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';
import { DAILY_THREE_MAX } from '@/components/founder-hub/faith-os/content';

const log = createLogger('FounderOsDailyGoals');

export const dynamic = 'force-dynamic';

const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES = new Set(['open', 'done', 'carried', 'released']);
/** Statuses that count as a live commitment against the cap of three. */
const ACTIVE_STATUSES = ['open', 'done'];

interface PostBody {
  date?: string;
  text?: string;
  intention?: string;
  isHighlight?: boolean;
}

interface PatchBody {
  id?: string;
  status?: string;
  text?: string;
  intention?: string | null;
  isHighlight?: boolean;
  committed?: boolean;
}

export async function GET(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }

  const url = new URL(request.url);
  const days = Math.min(Math.max(parseInt(url.searchParams.get('days') ?? '60', 10) || 60, 7), 365);
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  try {
    const goals = await prisma.founderOsDailyGoal.findMany({
      where: { userId: auth.userId, date: { gte: cutoff } },
      orderBy: [{ date: 'desc' }, { rank: 'asc' }],
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

  if (!body.date || typeof body.date !== 'string' || !DATE_RX.test(body.date)) {
    return apiError({ error: 'date (YYYY-MM-DD) required', status: 400 });
  }
  const text = typeof body.text === 'string' ? body.text.trim().slice(0, 280) : '';
  if (!text) {
    return apiError({ error: 'text required', status: 400 });
  }
  const intention =
    typeof body.intention === 'string' && body.intention.trim()
      ? body.intention.trim().slice(0, 400)
      : null;
  const isHighlight = Boolean(body.isHighlight);

  try {
    // The cap IS the feature. Count live commitments for the day and refuse
    // the fourth — release or carry one first.
    const activeCount = await prisma.founderOsDailyGoal.count({
      where: { userId: auth.userId, date: body.date, status: { in: ACTIVE_STATUSES } },
    });
    if (activeCount >= DAILY_THREE_MAX) {
      return apiError({
        error: `Three is the cap for a day — that's the point. Release or carry one before adding another.`,
        status: 400,
      });
    }

    // One Highlight per day: demote any existing highlight first.
    if (isHighlight) {
      await prisma.founderOsDailyGoal.updateMany({
        where: { userId: auth.userId, date: body.date, isHighlight: true },
        data: { isHighlight: false },
      });
    }

    const goal = await prisma.founderOsDailyGoal.create({
      data: {
        userId: auth.userId,
        date: body.date,
        text,
        rank: activeCount + 1,
        isHighlight,
        intention,
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
    const existing = await prisma.founderOsDailyGoal.findUnique({ where: { id: body.id } });
    if (!existing || existing.userId !== auth.userId) {
      return apiError({ error: 'Not found', status: 404 });
    }

    // One Highlight per day: demote the day's other highlight before promoting.
    if (body.isHighlight === true) {
      await prisma.founderOsDailyGoal.updateMany({
        where: {
          userId: auth.userId,
          date: existing.date,
          isHighlight: true,
          id: { not: existing.id },
        },
        data: { isHighlight: false },
      });
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
    if (body.intention !== undefined) {
      data.intention =
        typeof body.intention === 'string' && body.intention.trim()
          ? body.intention.trim().slice(0, 400)
          : null;
    }
    if (body.isHighlight !== undefined) data.isHighlight = Boolean(body.isHighlight);
    if (body.committed !== undefined) data.committed = Boolean(body.committed);

    const goal = await prisma.founderOsDailyGoal.update({
      where: { id: existing.id },
      data,
    });
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
    await prisma.founderOsDailyGoal.deleteMany({ where: { id, userId: auth.userId } });
    return apiSuccess({ data: { deleted: true } });
  } catch (err) {
    log.warn('delete failed:', err);
    return apiError({ error: 'Failed to delete goal', status: 500 });
  }
}
