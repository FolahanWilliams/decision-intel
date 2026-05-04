/**
 * GET /api/founder-hub/voice-activity — Voice cross-tracking dashboard
 *
 * Returns recent VoiceSessionEvent rows (defaults: last 50 across all
 * sessions, or filtered by ?eventType=demo_conversion for the
 * demo-conversion tracker view).
 *
 * Auth: founder-pass via x-founder-pass header (same as other
 * founder-hub UI endpoints — this is read by the Founder Hub UI).
 *
 * Query params:
 *   - eventType (optional): filter to one event type
 *   - sessionId (optional): filter to one voice session
 *   - personaId (optional): filter to events fired during one persona
 *   - limit (optional, default 50, max 200): row cap
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { verifyFounderPass } from '@/lib/utils/founder-auth';

const log = createLogger('VoiceActivity');

export async function GET(req: NextRequest) {
  const auth = verifyFounderPass(req.headers.get('x-founder-pass'));
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.reason === 'not_configured' ? 'Not configured' : 'Unauthorized' },
      { status: auth.reason === 'not_configured' ? 503 : 401 }
    );
  }

  const eventType = req.nextUrl.searchParams.get('eventType');
  const sessionId = req.nextUrl.searchParams.get('sessionId');
  const personaId = req.nextUrl.searchParams.get('personaId');
  const limitParam = parseInt(req.nextUrl.searchParams.get('limit') ?? '50', 10);
  const limit = Math.min(Math.max(isNaN(limitParam) ? 50 : limitParam, 1), 200);

  try {
    const where: Record<string, string> = {};
    if (eventType) where.eventType = eventType;
    if (sessionId) where.sessionId = sessionId;
    if (personaId) where.personaId = personaId;

    const events = await prisma.voiceSessionEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Roll up per-eventType counts for the dashboard summary cards.
    // Single query — limit max is 200 so the rollup is cheap.
    const summary: Record<string, number> = {};
    for (const ev of events) {
      summary[ev.eventType] = (summary[ev.eventType] ?? 0) + 1;
    }

    return NextResponse.json({
      events,
      summary,
      filters: { eventType, sessionId, personaId, limit },
    });
  } catch (err) {
    log.error('voice-activity query failed:', err);
    return NextResponse.json(
      { error: 'Failed to fetch voice activity', detail: (err as Error).message },
      { status: 500 }
    );
  }
}
