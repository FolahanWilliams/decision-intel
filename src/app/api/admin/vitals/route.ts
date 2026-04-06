/**
 * POST /api/admin/vitals — Record Web Vitals metrics
 *
 * Receives fire-and-forget beacon data from WebVitalsReporter.
 * Stores as analytics events for performance monitoring.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('WebVitals');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.name || typeof body.value !== 'number') {
      return NextResponse.json({ ok: true }); // Don't error on malformed beacons
    }

    try {
      await prisma.analyticsEvent.create({
        data: {
          name: `web_vital_${body.name.toLowerCase()}`,
          properties: {
            value: body.value,
            rating: body.rating ?? null,
            url: body.url ?? null,
            id: body.id ?? null,
          } as object,
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
