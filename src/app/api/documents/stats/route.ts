/**
 * GET /api/documents/stats — lightweight document-count endpoint.
 *
 * Returns just the count for use by the useFirstAuditExperience hook
 * (shipped 2026-05-28 as Improvement #1 from the platform plan).
 *
 * Existing list endpoint /api/documents returns the full document
 * payload + analyses — way too much data for components that only
 * need the count (the first-visit empty state, the "what's next"
 * tiles, the first-audit guided overlay).
 *
 * Returns { totalDocs: 0 } when unauthenticated rather than 401 so
 * the public marketing-side providers don't surface noisy 401 errors
 * during hydration.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('DocumentsStatsRoute');

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ totalDocs: 0, authenticated: false });
    }
    const count = await prisma.document.count({ where: { userId: user.id, deletedAt: null } });
    return NextResponse.json({ totalDocs: count, authenticated: true });
  } catch (error) {
    log.warn('stats count failed', error instanceof Error ? error.message : error);
    // Fail-open with totalDocs: 0 so consumers fall through to the
    // first-visit experience rather than the post-first-audit one.
    // The dashboard SWR + the explicit refresh path provide the
    // authoritative source — this endpoint is just a fallback.
    return NextResponse.json({ totalDocs: 0, authenticated: true });
  }
}
