import { NextResponse } from 'next/server';
import { pruneExpiredEntries, getCacheStats } from '@/lib/utils/cache';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('CacheCleanup');

/**
 * POST /api/cache/cleanup
 *
 * Deletes all expired cache entries from the CacheEntry table.
 * Secured with the CRON_SECRET environment variable — set the
 * Authorization header to "Bearer <CRON_SECRET>" when calling this
 * endpoint from a scheduler (e.g. Vercel Cron, GitHub Actions, cron-job.org).
 *
 * If CRON_SECRET is not configured the endpoint is open (suitable for
 * development / self-hosted deployments with no public exposure).
 */
export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get('authorization') ?? '';
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const pruned = await pruneExpiredEntries();
    const stats = await getCacheStats();
    log.info(`Cache cleanup: pruned ${pruned} expired entries`);
    return NextResponse.json({
      ok: true,
      pruned,
      remaining: stats ?? {},
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    log.error('Cache cleanup error:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
