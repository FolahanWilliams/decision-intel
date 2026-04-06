/**
 * GET /api/decision-graph/similar/[analysisId] — M9.1
 *
 * Returns structurally-similar prior decisions for the "Have we seen this
 * before?" banner on the document detail page. The core work is in
 * findSimilarDecisions() (src/lib/graph/graph-builder.ts); this route is
 * just auth + ownership + thin JSON wrapper.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { findSimilarDecisions } from '@/lib/graph/graph-builder';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('SimilarDecisionsAPI');

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { analysisId } = await params;
    if (!analysisId || typeof analysisId !== 'string') {
      return NextResponse.json({ error: 'analysisId is required' }, { status: 400 });
    }

    // Parse + clamp the limit. Same NaN-safe pattern as the bug fixes
    // we shipped in the very first commit of this branch.
    const { searchParams } = new URL(request.url);
    const rawLimit = parseInt(searchParams.get('limit') || '3', 10);
    const limit = Math.min(Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 3, 10);

    // Ownership check — user must own the analysis or belong to its org
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      include: { document: { select: { userId: true, orgId: true } } },
    });
    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }
    if (analysis.document.userId !== user.id) {
      if (!analysis.document.orgId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      const membership = await prisma.teamMember.findFirst({
        where: { userId: user.id, orgId: analysis.document.orgId },
        select: { orgId: true },
      });
      if (!membership) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const similar = await findSimilarDecisions(analysisId, limit);

    return NextResponse.json(
      { similar },
      {
        headers: {
          // Cache for 5 minutes — the underlying embeddings + biases only
          // change when a new analysis lands in the org, so this is safe
          // to serve stale for short windows.
          'Cache-Control': 'private, max-age=300',
        },
      }
    );
  } catch (err) {
    log.error('GET /api/decision-graph/similar/[analysisId] failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
