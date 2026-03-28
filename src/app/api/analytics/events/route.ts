/**
 * Product Analytics Events API
 *
 * POST /api/analytics/events — Record an analytics event (auth optional)
 * GET  /api/analytics/events — List analytics events (auth required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { z } from 'zod';

const log = createLogger('AnalyticsEvents');

const CreateEventSchema = z.object({
  name: z.string().min(1).max(100),
  properties: z.record(z.string(), z.unknown()).optional().default({}),
  sessionId: z.string().max(200).optional(),
});

// ─── POST: Record an analytics event ────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid event data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, properties, sessionId } = parsed.data;

    // Auth is optional — try to get user but don't require it
    let userId: string | null = null;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      // Auth failure is fine for analytics — continue without userId
    }

    // Store the event with schema drift protection
    try {
      await prisma.analyticsEvent.create({
        data: {
          name,
          properties: properties as object,
          userId,
          sessionId: sessionId ?? null,
        },
      });
    } catch (err: unknown) {
      const prismaError = err as { code?: string };
      // Schema drift protection: table or column may not exist yet
      if (prismaError.code === 'P2021' || prismaError.code === 'P2022') {
        log.warn('AnalyticsEvent table/column not found (schema drift) — silently ignoring', {
          code: prismaError.code,
        });
        return NextResponse.json({ ok: true });
      }
      throw err;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error('Failed to record analytics event', { error: err });
    return NextResponse.json({ ok: true }); // Never fail analytics — return 200
  }
}

// ─── GET: List analytics events (auth required) ─────────────────────────────

const ListEventsSchema = z.object({
  name: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional().default(50),
});

export async function GET(req: NextRequest) {
  // Auth required for listing events
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const parsed = ListEventsSchema.safeParse({
      name: url.searchParams.get('name') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, limit } = parsed.data;

    try {
      const events = await prisma.analyticsEvent.findMany({
        where: name ? { name } : undefined,
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return NextResponse.json({ events });
    } catch (err: unknown) {
      const prismaError = err as { code?: string };
      // Schema drift protection
      if (prismaError.code === 'P2021' || prismaError.code === 'P2022') {
        log.warn('AnalyticsEvent table/column not found (schema drift) — returning empty', {
          code: prismaError.code,
        });
        return NextResponse.json({ events: [] });
      }
      throw err;
    }
  } catch (err) {
    log.error('Failed to list analytics events', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
