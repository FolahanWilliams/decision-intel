/**
 * Daily Vohra PMF Trigger Cron
 *
 * GET /api/cron/vohra-pmf-trigger — Run daily. For any user who has
 * completed ≥2 audits within the last 14 days AND has no pending or
 * recent (last 30 days) survey, create a pending VohraPMFResponse record.
 * The in-app modal then surfaces on next dashboard load.
 *
 * GTM v3.5 (RATIFIED 2026-05-04) Phase 1 lock criterion #1: this cron is
 * load-bearing for the operational lock → fully-locked transition. Without
 * it, the Vohra HXC cohort cannot accumulate respondents.
 *
 * Protected by CRON_SECRET. Add to vercel.json:
 *   { "path": "/api/cron/vohra-pmf-trigger", "schedule": "0 14 * * *" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPendingSurvey, findEligibleUsers } from '@/lib/learning/vohra-pmf';
import { createLogger } from '@/lib/utils/logger';
import { safeCompare } from '@/lib/utils/safe-compare';

const log = createLogger('VohraPmfTriggerCron');

export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET?.trim();

const MAX_TRIGGERS_PER_RUN = 50;

export async function GET(request: NextRequest) {
  const start = Date.now();

  if (!CRON_SECRET) {
    log.error('CRON_SECRET not configured — rejecting request');
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  const authHeader = request.headers.get('authorization') ?? '';
  if (!safeCompare(authHeader, `Bearer ${CRON_SECRET}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const eligibleUsers = await findEligibleUsers(MAX_TRIGGERS_PER_RUN);
  let triggered = 0;
  const errors: string[] = [];

  for (const userId of eligibleUsers) {
    try {
      await createPendingSurvey(userId);
      triggered += 1;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${userId}: ${msg}`);
      log.warn(`createPendingSurvey failed for ${userId}:`, err);
    }
  }

  log.info(`vohra-pmf-trigger: ${triggered} surveys created in ${Date.now() - start}ms`);

  return NextResponse.json({
    triggered,
    eligibleUsers: eligibleUsers.length,
    errors: errors.slice(0, 10),
    durationMs: Date.now() - start,
  });
}
