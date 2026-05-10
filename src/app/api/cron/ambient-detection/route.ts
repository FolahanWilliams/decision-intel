/**
 * GET /api/cron/ambient-detection
 *
 * Cron entry point for the ambient thesis-formation detection service.
 * Polls every Slack + Drive installation with ambient-capture enabled,
 * runs deepseek-v4-flash classification on new content, persists signals
 * for the dashboard banner UI.
 *
 * Locked 2026-05-10 per Tier 2.2 + Deep Research paper #2 Ch 6 + Ch 12
 * condition #1 (friction collapse).
 *
 * Suggested cadence: every 5 minutes via the cron dispatcher. Each pass
 * is bounded — Slack channel fetches cap at 100 messages per channel +
 * per-installation polling is serialized so one slow workspace doesn't
 * block the rest. Cost ceiling ~$0.05/user/day at this cadence.
 */

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createLogger } from '@/lib/utils/logger';
import { safeCompare } from '@/lib/utils/safe-compare';
import { pollAllAmbientSources } from '@/lib/integrations/ambient-thesis-detection';

const log = createLogger('AmbientDetectionCron');

export async function GET() {
  const headerList = await headers();
  const authHeader = headerList.get('authorization') ?? '';
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  if (!safeCompare(authHeader, `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await pollAllAmbientSources();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    log.error('Ambient detection cron failed', { err: String(err) });
    return NextResponse.json(
      { error: 'Ambient detection failed', message: String(err) },
      { status: 500 }
    );
  }
}
