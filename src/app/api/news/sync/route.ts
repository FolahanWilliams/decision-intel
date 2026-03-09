import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { syncAllFeeds } from '@/lib/news/newsService';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('NewsSyncRoute');

export const maxDuration = 120; // RSS sync can take a while

/**
 * POST /api/news/sync — Manually trigger a news feed sync.
 * Requires authentication. Returns sync results.
 */
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        log.info(`Manual news sync triggered by user ${userId}`);
        const result = await syncAllFeeds();

        return NextResponse.json({
            success: true,
            ...result,
        });
    } catch (error) {
        log.error('News sync failed:', error);
        return NextResponse.json(
            { error: 'News sync failed', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
