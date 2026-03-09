import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { searchNews } from '@/lib/news/newsService';
import type { FeedCategory } from '@/config/newsFeeds';

/**
 * GET /api/intelligence/news — Search intelligence news articles.
 * Supports query params: biasType, industry, category, q, limit
 */
export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const params = request.nextUrl.searchParams;
        const biasType = params.get('biasType');
        const industry = params.get('industry');
        const category = params.get('category') as FeedCategory | null;
        const query = params.get('q');
        const limit = Math.min(parseInt(params.get('limit') || '20'), 50);

        const articles = await searchNews({
            biasTypes: biasType ? [biasType] : undefined,
            industry: industry || undefined,
            category: category || undefined,
            query: query || undefined,
            limit,
        });

        return NextResponse.json({ articles });
    } catch (error) {
        return NextResponse.json({ articles: [] });
    }
}
