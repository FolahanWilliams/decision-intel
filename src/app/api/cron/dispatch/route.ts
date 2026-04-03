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

const log = createLogger('CronDispatch');

export const maxDuration = 300; // 5 minutes for all sub-jobs

interface JobResult {
  job: string;
  status: 'ok' | 'error' | 'skipped';
  ms?: number;
  error?: string;
}

async function runJob(baseUrl: string, path: string, cronSecret: string): Promise<JobResult> {
  const start = Date.now();
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${cronSecret}` },
    });
    const ms = Date.now() - start;
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { job: path, status: 'error', ms, error: `HTTP ${res.status}: ${body.slice(0, 200)}` };
    }
    return { job: path, status: 'ok', ms };
  } catch (err) {
    return {
      job: path,
      status: 'error',
      ms: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
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

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday

  // Jobs that run every day
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

  // Run jobs sequentially to avoid overwhelming the server
  const results: JobResult[] = [];
  for (const job of jobsToRun) {
    const result = await runJob(baseUrl, job, cronSecret);
    results.push(result);
    if (result.status === 'error') {
      log.error(`Cron job ${job} failed: ${result.error}`);
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
}
