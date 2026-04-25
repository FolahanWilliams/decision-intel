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
import { findSimilarDecisions } from '@/lib/graph/graph-builder';
import { createLogger } from '@/lib/utils/logger';
import { resolveAnalysisAccess } from '@/lib/utils/document-access';

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

    // RBAC (3.5): visibility-aware via the parent document.
    const access = await resolveAnalysisAccess(analysisId, user.id);
    if (!access) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
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
