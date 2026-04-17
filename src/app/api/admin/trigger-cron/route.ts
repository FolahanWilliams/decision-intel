/**
 * GET /api/admin/trigger-cron — Manually invoke the cron dispatcher or a
 * single cron sub-job from the browser as an authenticated admin. Useful
 * for smoke-testing daily-linkedin email delivery without waiting for the
 * scheduled run.
 *
 * Auth model: Supabase session → `ADMIN_EMAILS` check via `verifyAdmin()`.
 * The route reads the server-only `CRON_SECRET` from env and forwards it
 * as a Bearer header to the protected cron endpoint internally — the
 * admin never sees or handles the secret.
 *
 * Examples:
 *   /api/admin/trigger-cron                  → runs the full dispatcher
 *   /api/admin/trigger-cron?job=daily-linkedin → runs a single sub-cron
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, ADMIN_DENIED } from '@/lib/utils/admin';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('AdminTriggerCron');

// Allowlist of sub-cron paths so `?job=` can't be used as an open proxy.
const ALLOWED_JOBS = new Set([
  'dispatch',
  'daily-linkedin',
  'sync-intelligence',
  'detect-outcomes',
  'infer-graph-edges',
  'retry-nudges',
  'google-drive-sync',
  'outcome-reminders',
  'team-profiles',
  'weekly-digest',
  'learn-toxic-patterns',
  'recalibrate',
]);

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return ADMIN_DENIED;

  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured on the server' },
      { status: 500 }
    );
  }

  const { searchParams, origin } = new URL(request.url);
  const jobParam = (searchParams.get('job') ?? 'dispatch').trim();
  if (!ALLOWED_JOBS.has(jobParam)) {
    return NextResponse.json(
      { error: `Unknown job "${jobParam}". Allowed: ${Array.from(ALLOWED_JOBS).join(', ')}` },
      { status: 400 }
    );
  }

  const targetUrl = `${origin}/api/cron/${jobParam}`;
  const started = Date.now();
  log.info(`Admin ${admin.email} manually triggering cron job: ${jobParam}`);

  try {
    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${cronSecret}` },
    });
    const elapsedMs = Date.now() - started;
    const contentType = res.headers.get('content-type') ?? '';
    const body = contentType.includes('application/json')
      ? await res.json().catch(() => ({ raw: 'failed to parse JSON response' }))
      : await res.text().catch(() => '');

    log.info(`Cron job ${jobParam} finished with HTTP ${res.status} in ${elapsedMs}ms`);
    return NextResponse.json(
      {
        triggeredBy: admin.email,
        job: jobParam,
        status: res.status,
        elapsedMs,
        result: body,
      },
      { status: res.ok ? 200 : 502 }
    );
  } catch (err) {
    const elapsedMs = Date.now() - started;
    log.error(`Manual cron trigger failed for ${jobParam}:`, err);
    return NextResponse.json(
      {
        triggeredBy: admin.email,
        job: jobParam,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs,
      },
      { status: 500 }
    );
  }
}
