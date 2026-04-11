/**
 * POST /api/admin/vitals — Record Web Vitals metrics
 *
 * Receives fire-and-forget beacon data from WebVitalsReporter.
 * Stores as analytics events for performance monitoring.
 *
 * This endpoint is unauthenticated by design — beacons fire from marketing
 * pages where users aren't logged in. Instead we defend against spam /
 * data-poisoning with (1) a whitelist of allowed metric names, (2) value
 * clamping and (3) per-IP rate limiting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { checkRateLimit } from '@/lib/utils/rate-limit';

const log = createLogger('WebVitals');

// Core Web Vitals + Next.js nav metrics. Anything outside this set is dropped.
const ALLOWED_METRICS = new Set([
  'cls',
  'fcp',
  'fid',
  'inp',
  'lcp',
  'ttfb',
  'next-hydration',
  'next-route-change-to-render',
]);
const ALLOWED_RATINGS = new Set(['good', 'needs-improvement', 'poor']);
const MAX_VALUE = 120_000; // 2 minutes — nothing legit exceeds this

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.name || typeof body.value !== 'number' || !Number.isFinite(body.value)) {
      return NextResponse.json({ ok: true }); // Don't error on malformed beacons
    }

    const metric = String(body.name).toLowerCase();
    if (!ALLOWED_METRICS.has(metric)) {
      return NextResponse.json({ ok: true });
    }

    // Per-IP rate limit: 120 beacons/minute is plenty for any real page.
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';
    const rl = await checkRateLimit(ip, 'web-vitals', {
      windowMs: 60_000,
      maxRequests: 120,
      failMode: 'open', // availability > security for a fire-and-forget beacon
    });
    if (!rl.success) {
      return NextResponse.json({ ok: true });
    }

    const clampedValue = Math.max(0, Math.min(MAX_VALUE, body.value));
    const rating =
      typeof body.rating === 'string' && ALLOWED_RATINGS.has(body.rating) ? body.rating : null;
    const url = typeof body.url === 'string' ? body.url.slice(0, 512) : null;
    const id = typeof body.id === 'string' ? body.id.slice(0, 128) : null;

    try {
      await prisma.analyticsEvent.create({
        data: {
          name: `web_vital_${metric}`,
          properties: { value: clampedValue, rating, url, id } as object,
        },
      });
    } catch {
      // Never fail on analytics persistence — this is fire-and-forget
      log.debug('Failed to persist web vital metric');
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // Always return 200 for beacons
  }
}
