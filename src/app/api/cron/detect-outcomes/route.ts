/**
 * Autonomous Outcome Detection Cron — Channel 3: Web Intelligence
 *
 * GET /api/cron/detect-outcomes — Run daily to search for public outcome signals
 *
 * For decisions involving named companies or public events, searches the web
 * for news articles that reveal the decision's outcome. Creates DraftOutcomes
 * for user review — never auto-submits.
 *
 * Rate-limited to 10 web searches per run to control API costs.
 *
 * Protected by CRON_SECRET. Add to vercel.json:
 *   { "path": "/api/cron/detect-outcomes", "schedule": "0 10 * * *" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/utils/logger';
import { timingSafeEqual } from 'crypto';
import { detectOutcomesFromWeb } from '@/lib/learning/outcome-inference';

const log = createLogger('DetectOutcomesCron');

export const maxDuration = 120; // 2 minutes

const CRON_SECRET = process.env.CRON_SECRET?.trim();
const MAX_WEB_SEARCHES = 10;

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  const maxLen = Math.max(bufA.length, bufB.length);
  const paddedA = Buffer.alloc(maxLen);
  const paddedB = Buffer.alloc(maxLen);
  bufA.copy(paddedA);
  bufB.copy(paddedB);
  return bufA.length === bufB.length && timingSafeEqual(paddedA, paddedB);
}

export async function GET(request: NextRequest) {
  const start = Date.now();

  // Verify cron secret
  if (!CRON_SECRET) {
    log.error('CRON_SECRET not configured — rejecting request');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') ?? '';
  if (!safeCompare(token, CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    log.info(`Starting web outcome detection (max ${MAX_WEB_SEARCHES} searches)`);

    const results = await detectOutcomesFromWeb(MAX_WEB_SEARCHES);

    const elapsed = Date.now() - start;
    log.info(
      `Web outcome detection complete: ${results.length} outcome(s) detected in ${elapsed}ms`
    );

    return NextResponse.json({
      ok: true,
      detected: results.length,
      results: results.map(r => ({
        outcome: r.outcome,
        confidence: r.confidence,
        source: r.source,
        sourceRef: r.sourceRef,
      })),
      durationMs: elapsed,
    });
  } catch (err) {
    log.error('Web outcome detection cron failed:', err);
    return NextResponse.json(
      { error: 'Internal error', message: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
