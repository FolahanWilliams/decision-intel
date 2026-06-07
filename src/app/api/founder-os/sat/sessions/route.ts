/**
 * SAT Prep — daily training session API (founder-private).
 *
 * One row per day (unique [userId, date]). Tracks the input-streak + the
 * weak-area-weighted focus. XP rewards the INPUT (reps + showing up), never the
 * projected score — same anti-prosperity discipline as the campaign layer.
 *
 * GET   /api/founder-os/sat/sessions?days=120  → sessions (for streak/heatmap)
 * POST  { date, attempted?, correct?, minutes?, focusSkills?, completed? }
 *   Upserts the day's session. `attempted`/`correct` are DELTAS (incremented);
 *   `minutes`/`focusSkills`/`completed` are set. Awards input-XP; the daily
 *   completion bonus fires only on the false→true completion transition.
 */

import { prisma } from '@/lib/prisma';
import { authenticateFounderOs } from '@/lib/founder-os/auth';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';
import { SAT_XP } from '@/components/founder-hub/sat/sat-content';
import type { Prisma } from '@prisma/client';

const log = createLogger('SatSessions');

export const dynamic = 'force-dynamic';

const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;

interface PostBody {
  date?: string;
  attempted?: number;
  correct?: number;
  minutes?: number;
  focusSkills?: string[];
  completed?: boolean;
}

function nonNegInt(v: unknown): number {
  const n = typeof v === 'number' ? v : parseInt(String(v), 10);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export async function GET(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }
  const url = new URL(request.url);
  const days = Math.min(
    Math.max(parseInt(url.searchParams.get('days') ?? '120', 10) || 120, 7),
    400
  );
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  try {
    const sessions = await prisma.satDailySession.findMany({
      where: { userId: auth.userId, date: { gte: cutoff } },
      orderBy: { date: 'desc' },
    });
    return apiSuccess({ data: { sessions } });
  } catch (err) {
    log.warn('list failed:', err);
    return apiSuccess({ data: { sessions: [] } });
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
  const date = typeof body.date === 'string' && DATE_RX.test(body.date) ? body.date : null;
  if (!date) return apiError({ error: 'date (YYYY-MM-DD) required', status: 400 });

  const attemptedDelta = nonNegInt(body.attempted);
  const correctDelta = nonNegInt(body.correct);
  const minutes = body.minutes !== undefined ? nonNegInt(body.minutes) : undefined;
  const focusSkills = Array.isArray(body.focusSkills)
    ? body.focusSkills.filter(s => typeof s === 'string').slice(0, 12)
    : undefined;
  const wantComplete = body.completed === true;

  try {
    const existing = await prisma.satDailySession.findUnique({
      where: { userId_date: { userId: auth.userId, date } },
    });

    const wasComplete = existing?.completed ?? false;
    const completing = wantComplete && !wasComplete;
    const xpDelta =
      attemptedDelta * SAT_XP.perQuestionAttempted + (completing ? SAT_XP.dailySessionComplete : 0);

    const focusJson = (focusSkills ?? undefined) as Prisma.InputJsonValue | undefined;

    const session = await prisma.satDailySession.upsert({
      where: { userId_date: { userId: auth.userId, date } },
      create: {
        userId: auth.userId,
        date,
        attempted: attemptedDelta,
        correct: correctDelta,
        minutes: minutes ?? null,
        completed: wantComplete,
        xpAwarded: xpDelta,
        ...(focusJson !== undefined ? { focusSkills: focusJson } : {}),
      },
      update: {
        attempted: { increment: attemptedDelta },
        correct: { increment: correctDelta },
        ...(minutes !== undefined ? { minutes } : {}),
        ...(wantComplete ? { completed: true } : {}),
        xpAwarded: { increment: xpDelta },
        ...(focusJson !== undefined ? { focusSkills: focusJson } : {}),
      },
    });
    return apiSuccess({ data: { session } });
  } catch (err) {
    log.warn('upsert failed:', err);
    return apiError({ error: 'Failed to save session', status: 500 });
  }
}
