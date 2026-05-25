import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { isAdminUserId } from '@/lib/utils/admin';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('AdminCronHealth');

/**
 * GET /api/admin/cron-health
 *
 * Admin-scoped surface for cron observability. For each distinct cron
 * route ever recorded, returns:
 *   - lastRunAt (start time of the most recent invocation)
 *   - lastSuccessAt (start time of the most recent ok run)
 *   - lastFailureAt + lastError (most recent error + its message)
 *   - consecutiveFailures (count from most-recent run backward)
 *   - averageDurationMs (mean of completed runs in the window)
 *   - recentRuns (last 30 runs, newest first)
 *
 * Non-admins get 403. Admin status is derived from ADMIN_USER_IDS
 * (Supabase UUIDs, comma-separated in the env).
 *
 * Closes the cron-dispatcher single-point-of-observability gap from the
 * 2026-05-25 maintenance audit: until the CronRun model + instrumentation
 * shipped, a dispatcher timeout meant a week of dark crons with no
 * historical signal beyond Vercel stdout logs.
 *
 * Forward-looking: when a cron is consistently red (consecutiveFailures
 * climbing), surface it via a Sentry alert + the founder-hub MetricsCard
 * (queued follow-up, not in this ship).
 */

const RECENT_RUN_LIMIT = 30;

interface CronRouteHealth {
  route: string;
  lastRunAt: Date | null;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  lastError: string | null;
  consecutiveFailures: number;
  averageDurationMs: number | null;
  recentRuns: Array<{
    id: string;
    startedAt: Date;
    completedAt: Date | null;
    durationMs: number | null;
    status: string;
    error: string | null;
    httpStatus: number | null;
  }>;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isAdminUserId(user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Find every distinct route ever recorded, ordered by most-recent run.
    const routes = await prisma.cronRun.groupBy({
      by: ['route'],
      _max: { startedAt: true },
      orderBy: { _max: { startedAt: 'desc' } },
    });

    const health: CronRouteHealth[] = [];
    for (const { route } of routes) {
      const recent = await prisma.cronRun.findMany({
        where: { route },
        orderBy: { startedAt: 'desc' },
        take: RECENT_RUN_LIMIT,
      });

      const lastSuccess = recent.find(r => r.status === 'ok');
      const lastFailure = recent.find(r => r.status === 'error' || r.status === 'timeout');

      // Consecutive failures counted from most-recent backward — stops at
      // the first non-error run (or the end of the window).
      let consecutiveFailures = 0;
      for (const r of recent) {
        if (r.status === 'error' || r.status === 'timeout') {
          consecutiveFailures++;
        } else {
          break;
        }
      }

      const completed = recent.filter(r => r.durationMs !== null);
      const averageDurationMs = completed.length
        ? Math.round(completed.reduce((s, r) => s + (r.durationMs ?? 0), 0) / completed.length)
        : null;

      health.push({
        route,
        lastRunAt: recent[0]?.startedAt ?? null,
        lastSuccessAt: lastSuccess?.startedAt ?? null,
        lastFailureAt: lastFailure?.startedAt ?? null,
        lastError: lastFailure?.error ?? null,
        consecutiveFailures,
        averageDurationMs,
        recentRuns: recent.map(r => ({
          id: r.id,
          startedAt: r.startedAt,
          completedAt: r.completedAt,
          durationMs: r.durationMs,
          status: r.status,
          error: r.error,
          httpStatus: r.httpStatus,
        })),
      });
    }

    return NextResponse.json({
      routes: health,
      generatedAt: new Date(),
      // Procurement-grade summary: how many routes haven't run in 48h,
      // how many have 3+ consecutive failures. Visible at a glance.
      summary: {
        totalRoutes: health.length,
        routesWithFailures: health.filter(r => r.consecutiveFailures > 0).length,
        routesWithCriticalFailures: health.filter(r => r.consecutiveFailures >= 3).length,
        routesStaleOver48h: health.filter(
          r =>
            !r.lastRunAt ||
            Date.now() - new Date(r.lastRunAt).getTime() > 48 * 60 * 60 * 1000
        ).length,
      },
    });
  } catch (err) {
    log.error('Failed to compute cron health:', err);
    return NextResponse.json(
      { error: 'Failed to fetch cron health', detail: String(err) },
      { status: 500 }
    );
  }
}
