import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { syncAllFeeds } from '@/lib/news/newsService';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('NewsSyncRoute');

export const maxDuration = 120; // RSS sync can take a while

/**
 * POST /api/news/sync — Manually trigger a news feed sync.
 * Requires authentication. Returns sync results.
 */
export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: 3 manual syncs per hour
    const rateLimitResult = await checkRateLimit(userId, '/api/news/sync', {
      windowMs: 60 * 60 * 1000,
      maxRequests: 3,
      failMode: 'open',
    });
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimitResult.reset - Math.floor(Date.now() / 1000)) },
        }
      );
    }

    log.info(`Manual news sync triggered by user ${userId}`);
    const result = await syncAllFeeds();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    log.error('News sync failed:', error);
    return NextResponse.json({ error: 'News sync failed' }, { status: 500 });
  }
}
