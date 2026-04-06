/**
 * GET /api/outcomes/drafts/summary
 *
 * Returns aggregate counts of pending draft outcomes for the authenticated
 * user's scope, grouped by source channel and confidence tier. Used by the
 * dashboard "Flywheel Health" widget to show flywheel activity at a glance
 * without fetching the full draft list.
 *
 * Cheap by design — a single groupBy query + org-scope filter. Safe to
 * call on every dashboard load.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('DraftOutcomesSummary');

export const dynamic = 'force-dynamic';

type SourceCount = {
  source: string;
  count: number;
  highConfidence: number; // confidence >= 0.85
};

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Scope: org membership if present, otherwise user's own analyses.
    // Mirrors the scoping used by /api/outcomes/draft (the list endpoint).
    let orgId: string | null = null;
    try {
      const membership = await prisma.teamMember.findFirst({
        where: { userId: user.id },
        select: { orgId: true },
      });
      orgId = membership?.orgId ?? null;
    } catch {
      // teamMember table may not exist yet
    }

    let drafts: Array<{ source: string; confidence: number | null; createdAt: Date }> = [];
    try {
      drafts = await prisma.draftOutcome.findMany({
        where: {
          status: 'pending_review',
          analysis: orgId ? { document: { orgId } } : { document: { userId: user.id } },
        },
        select: { source: true, confidence: true, createdAt: true },
      });
    } catch (err: unknown) {
      // Schema drift protection — DraftOutcome table may not be migrated
      const code = (err as { code?: string }).code;
      if (code === 'P2021' || code === 'P2022') {
        log.debug('DraftOutcome table not yet migrated, returning empty summary');
        return NextResponse.json({
          total: 0,
          bySource: [],
          highConfidenceTotal: 0,
          oldestDraftDays: null,
        });
      }
      throw err;
    }

    const bySourceMap = new Map<string, SourceCount>();
    let highConfidenceTotal = 0;
    let oldestDraftMs: number | null = null;
    const now = Date.now();

    for (const d of drafts) {
      const conf = d.confidence ?? 0;
      const isHigh = conf >= 0.85;
      if (isHigh) highConfidenceTotal += 1;

      const existing = bySourceMap.get(d.source) ?? {
        source: d.source,
        count: 0,
        highConfidence: 0,
      };
      existing.count += 1;
      if (isHigh) existing.highConfidence += 1;
      bySourceMap.set(d.source, existing);

      const ageMs = now - d.createdAt.getTime();
      if (oldestDraftMs === null || ageMs > oldestDraftMs) {
        oldestDraftMs = ageMs;
      }
    }

    // Sort by count desc for consistent UI rendering
    const bySource = Array.from(bySourceMap.values()).sort((a, b) => b.count - a.count);

    return NextResponse.json({
      total: drafts.length,
      bySource,
      highConfidenceTotal,
      oldestDraftDays:
        oldestDraftMs !== null ? Math.floor(oldestDraftMs / (24 * 60 * 60 * 1000)) : null,
    });
  } catch (err) {
    log.error('GET /api/outcomes/drafts/summary failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
