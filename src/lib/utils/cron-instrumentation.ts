/**
 * Cron-run observability wrapper (locked 2026-05-25, maintenance audit).
 *
 * The cron dispatcher at /api/cron/dispatch fans out to ~19 sub-routes.
 * Without this wrapper, per-job success/failure was visible ONLY in Vercel
 * stdout logs (`vercel logs --follow`) and the dispatcher's HTTP response.
 * A dispatcher timeout or silent failure meant a week of dark crons with
 * no observable record.
 *
 * `instrumentCronJob(route, runJob)` wraps a JobResult-returning function:
 *
 *   1. Writes a `running` CronRun row at start.
 *   2. Executes the wrapped runJob().
 *   3. Updates the CronRun row with status / durationMs / error / httpStatus.
 *
 * All persistence is FAIL-SOFT — a CronRun write failure NEVER breaks
 * the cron itself. Observability degradation is preferable to cron
 * breakage (the cron's actual work is the load-bearing concern).
 *
 * Surfaces at /api/admin/cron-health for per-route last-run /
 * last-success / consecutive-failures / avg-duration reporting.
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('CronInstrumentation');

/**
 * The shape returned by the dispatcher's runJob() — kept structurally
 * compatible so existing call sites don't change their contract.
 */
export interface CronJobResult {
  job: string;
  status: 'ok' | 'error' | 'skipped';
  ms?: number;
  error?: string;
  httpStatus?: number;
}

const MAX_ERROR_LENGTH = 500;

/**
 * Wrap a cron sub-route invocation with persistence-grade observability.
 *
 * @param route   The cron sub-route path, e.g. "/api/cron/sync-intelligence"
 * @param runJob  Async function that returns a CronJobResult. Should NOT throw
 *                in normal operation (the caller's JobResult.status carries
 *                error info), but exceptions are caught and recorded as
 *                status='error'.
 */
export async function instrumentCronJob(
  route: string,
  runJob: () => Promise<CronJobResult>
): Promise<CronJobResult> {
  const startedAt = new Date();
  let cronRunId: string | undefined;

  // Open a CronRun row. Fail-soft: if the table doesn't exist (pre-migration)
  // or the DB is unreachable, log a warning and proceed without persistence.
  try {
    const row = await prisma.cronRun.create({
      data: { route, startedAt, status: 'running' },
      select: { id: true },
    });
    cronRunId = row.id;
  } catch (err) {
    log.warn(`CronRun start-row failed for ${route} — running without persistence:`, err);
  }

  let result: CronJobResult;
  try {
    result = await runJob();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    result = {
      job: route,
      status: 'error',
      ms: Date.now() - startedAt.getTime(),
      error: message,
    };
  }

  // Close the CronRun row. Fail-soft again — we never want a Prisma issue
  // to mask the actual job result.
  if (cronRunId) {
    try {
      await prisma.cronRun.update({
        where: { id: cronRunId },
        data: {
          completedAt: new Date(),
          durationMs: result.ms ?? Date.now() - startedAt.getTime(),
          status: result.status,
          error: result.error ? result.error.slice(0, MAX_ERROR_LENGTH) : null,
          httpStatus: result.httpStatus ?? null,
        },
      });
    } catch (err) {
      log.warn(`CronRun close failed for ${route} (id=${cronRunId}):`, err);
    }
  }

  return result;
}

/**
 * Truncate an error message to the CronRun.error column limit. Exported
 * for use by callers that pre-format their error strings.
 */
export function truncateCronError(message: string): string {
  return message.slice(0, MAX_ERROR_LENGTH);
}
