import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
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
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
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

        return NextResponse.json({
            success: true,
            results,
            count: results.length
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
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const documentId = searchParams.get('documentId');
        const content = searchParams.get('content');

        if (!documentId || !content) {
            return NextResponse.json(
                { error: 'documentId and content are required' },
                { status: 400 }
            );
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
            ...insights
        });
    } catch (error) {
        log.error('Context API error:', error);
        return NextResponse.json({ error: 'Failed to get context' }, { status: 500 });
    }
}
