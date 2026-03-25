import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { searchSimilarDocuments, getContextualInsights } from '@/lib/rag/embeddings';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('SearchRoute');

/**
 * POST /api/search
 * Semantic search for similar documents using RAG
 *
 * Body: { query: string, limit?: number, documentId?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    const { query, limit = 5, documentId } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const MAX_QUERY_LENGTH = 10_000;
    if (typeof query !== 'string' || query.length > MAX_QUERY_LENGTH) {
      return NextResponse.json(
        { error: `Query must be a string of at most ${MAX_QUERY_LENGTH} characters` },
        { status: 400 }
      );
    }

    const safeLimit = Math.max(1, Math.min(20, Number(limit) || 5));

    const results = await searchSimilarDocuments(
      query,
      userId,
      safeLimit,
      typeof documentId === 'string' ? documentId : undefined
    );

    // Enrich results with graph edge counts (non-blocking best-effort)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let enrichedResults: any[] = results;
    try {
      const docIds = results.map((r: { documentId: string }) => r.documentId);
      if (docIds.length > 0) {
        // Find analysis IDs for these documents
        const analyses = await prisma.analysis.findMany({
          where: { documentId: { in: docIds } },
          select: { id: true, documentId: true },
        });

        if (analyses.length > 0) {
          const analysisIds = analyses.map(a => a.id);
          const docToAnalysis = new Map(analyses.map(a => [a.documentId, a.id]));

          // Batch query edge counts
          const edgeCounts = await prisma.decisionEdge.groupBy({
            by: ['sourceId'],
            where: {
              sourceId: { in: analysisIds },
            },
            _count: { id: true },
          });

          const targetCounts = await prisma.decisionEdge.groupBy({
            by: ['targetId'],
            where: {
              targetId: { in: analysisIds },
            },
            _count: { id: true },
          });

          const countMap = new Map<string, number>();
          for (const e of edgeCounts) {
            countMap.set(e.sourceId, (countMap.get(e.sourceId) || 0) + e._count.id);
          }
          for (const e of targetCounts) {
            countMap.set(e.targetId, (countMap.get(e.targetId) || 0) + e._count.id);
          }

          enrichedResults = results.map((r: { documentId: string }) => {
            const analysisId = docToAnalysis.get(r.documentId);
            return {
              ...r,
              graphEdgeCount: analysisId ? (countMap.get(analysisId) || 0) : 0,
            };
          });
        }
      }
    } catch (enrichErr) {
      const code = (enrichErr as { code?: string })?.code;
      if (code !== 'P2021' && code !== 'P2022') {
        log.warn('Search graph enrichment failed (non-critical):', enrichErr);
      }
    }

    return NextResponse.json({
      success: true,
      results: enrichedResults,
      count: enrichedResults.length,
    });
  } catch (error) {
    log.error('Search API error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}

/**
 * GET /api/search/context/:documentId
 * Get contextual insights for a specific document
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    const content = searchParams.get('content');

    if (!documentId || !content) {
      return NextResponse.json({ error: 'documentId and content are required' }, { status: 400 });
    }

    // Verify the user owns the requested document
    const doc = await prisma.document.findFirst({
      where: { id: documentId, userId },
      select: { id: true },
    });
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Prevent excessively large content from DoS-ing the embedding API.
    const MAX_CONTENT_LENGTH = 30_000;
    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: `content must be at most ${MAX_CONTENT_LENGTH} characters` },
        { status: 400 }
      );
    }

    const insights = await getContextualInsights(documentId, content, userId);

    return NextResponse.json({
      success: true,
      ...insights,
    });
  } catch (error) {
    log.error('Context API error:', error);
    return NextResponse.json({ error: 'Failed to get context' }, { status: 500 });
  }
}
