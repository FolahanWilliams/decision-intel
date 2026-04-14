/**
 * Cron Dispatcher — single Vercel cron entry that fans out to all cron handlers.
 *
 * Vercel hobby/pro plans limit the number of cron jobs. This dispatcher runs
 * once daily and calls each sub-cron route internally, deciding which jobs to
 * run based on the current day/time.
 *
 * Schedule logic:
 *   Every run (daily):  sync-intelligence, detect-outcomes, infer-graph-edges, retry-nudges
 *   Sundays:            learn-toxic-patterns, recalibrate
 *   Mondays:            outcome-reminders, team-profiles, weekly-digest
 */

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createLogger } from '@/lib/utils/logger';
import { safeCompare } from '@/lib/utils/safe-compare';
import { acquireCronLock, releaseCronLock } from '@/lib/utils/cron-lock';

const log = createLogger('CronDispatch');

export const maxDuration = 300; // 5 minutes for all sub-jobs

interface JobResult {
  job: string;
  status: 'ok' | 'error' | 'skipped';
  ms?: number;
  error?: string;
}

const PER_JOB_TIMEOUT = 45_000; // 45s per job to stay within 5-minute total dispatch

async function runJob(baseUrl: string, path: string, cronSecret: string): Promise<JobResult> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PER_JOB_TIMEOUT);
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${cronSecret}` },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const ms = Date.now() - start;
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { job: path, status: 'error', ms, error: `HTTP ${res.status}: ${body.slice(0, 200)}` };
    }
    return { job: path, status: 'ok', ms };
  } catch (err) {
    const ms = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    return {
      job: path,
      status: 'error',
      ms,
      error: isTimeout ? `Job timed out after ${PER_JOB_TIMEOUT}ms` : message,
    };
  }
}

export async function GET() {
  const headerList = await headers();
  const authHeader = headerList.get('authorization') ?? '';
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    log.error('CRON_SECRET not configured — rejecting request');
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  if (!safeCompare(authHeader, `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Concurrency guard — prevent duplicate dispatch if Vercel retries
  const locked = await acquireCronLock('dispatch', 300);
  if (!locked) {
    log.info('Skipping dispatch — another instance is already running');
    return NextResponse.json({ skipped: true, reason: 'Another dispatch in progress' });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday

  // Jobs that run every day.
  // NOTE: /api/cron/daily-linkedin is intentionally omitted — the email
  // delivery step was broken and each run burned Gemini budget before
  // failing (root cause of April 2026 cost spike). Re-enable once the
  // email pipeline is verified.
  const dailyJobs = [
    '/api/cron/sync-intelligence',
    '/api/cron/detect-outcomes',
    '/api/cron/infer-graph-edges',
    '/api/cron/retry-nudges',
    '/api/cron/google-drive-sync',
    '/api/cache/cleanup',
  ];

  // Jobs that run on Sundays (off-peak ML/calibration)
  const sundayJobs = ['/api/cron/learn-toxic-patterns', '/api/cron/recalibrate'];

  // Jobs that run on Mondays (weekly communications)
  const mondayJobs = [
    '/api/cron/outcome-reminders',
    '/api/cron/team-profiles',
    '/api/cron/weekly-digest',
  ];

  const jobsToRun = [
    ...dailyJobs,
    ...(dayOfWeek === 0 ? sundayJobs : []),
    ...(dayOfWeek === 1 ? mondayJobs : []),
  ];

  log.info(`Dispatching ${jobsToRun.length} cron jobs (day=${dayOfWeek})`);

  // Run jobs sequentially to avoid overwhelming the server.
  // Failed jobs get one retry after a short delay.
  try {
    const results: JobResult[] = [];
    for (const job of jobsToRun) {
      let result = await runJob(baseUrl, job, cronSecret);
      if (result.status === 'error') {
        log.warn(`Cron job ${job} failed, retrying in 2s: ${result.error}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        result = await runJob(baseUrl, job, cronSecret);
      }
      results.push(result);
      if (result.status === 'error') {
        log.error(`Cron job ${job} failed after retry: ${result.error}`);
      } else {
        log.info(`Cron job ${job} completed in ${result.ms}ms`);
      }
    }

    const failed = results.filter(r => r.status === 'error');

    return NextResponse.json(
      {
        dispatched: jobsToRun.length,
        succeeded: results.filter(r => r.status === 'ok').length,
        failed: failed.length,
        results,
      },
      { status: failed.length === jobsToRun.length ? 500 : 200 }
    );
  } finally {
    await releaseCronLock('dispatch');
  }
}
