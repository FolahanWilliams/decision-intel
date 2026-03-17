import { NextRequest, NextResponse } from 'next/server';
import { syncAllFeeds, cleanExpiredArticles } from '@/lib/news/newsService';
import { cleanExpiredResearch } from '@/lib/research/scholarSearch';
import { prisma } from '@/lib/prisma';
import { toPrismaJson } from '@/lib/utils/prisma-json';
import { createLogger } from '@/lib/utils/logger';
import { timingSafeEqual } from 'crypto';

const log = createLogger('IntelligenceCron');

export const maxDuration = 300; // 5 minutes for full sync

const CRON_SECRET = process.env.CRON_SECRET?.trim();

/** Constant-time comparison to prevent timing attacks on the cron secret.
 *  Pads the shorter buffer to avoid leaking length information. */
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  const maxLen = Math.max(bufA.length, bufB.length);
  const paddedA = Buffer.alloc(maxLen);
  const paddedB = Buffer.alloc(maxLen);
  bufA.copy(paddedA);
  bufB.copy(paddedB);
  return bufA.length === bufB.length && timingSafeEqual(paddedA, paddedB);
}

/**
 * GET /api/cron/sync-intelligence — Scheduled intelligence sync.
 * Runs once daily via Vercel Cron (Hobby plan compatible).
 * Syncs RSS feeds, cleans expired articles and research cache,
 * logs sync metadata. Stale data between syncs is handled by
 * on-demand lazy sync in the context builder.
 *
 * Protected by CRON_SECRET header to prevent unauthorized triggers.
 */
export async function GET(request: NextRequest) {
  const start = Date.now();

  // Verify cron secret (Vercel sends this in the Authorization header)
  if (CRON_SECRET) {
    const authHeader = request.headers.get('authorization') ?? '';
    if (!safeCompare(authHeader, `Bearer ${CRON_SECRET}`)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const errors: string[] = [];

  try {
    log.info('Starting scheduled intelligence sync...');

    // 1. Sync RSS feeds
    let syncResult = {
      feedsProcessed: 0,
      articlesAdded: 0,
      articlesExpired: 0,
      errors: [] as string[],
      durationMs: 0,
    };
    try {
      syncResult = await syncAllFeeds();
      if (syncResult.errors.length > 0) {
        errors.push(...syncResult.errors.map(e => `RSS: ${e}`));
      }
    } catch (e) {
      errors.push(`RSS sync failed: ${e instanceof Error ? e.message : String(e)}`);
    }

    // 2. Clean expired articles
    let expiredArticles = 0;
    try {
      expiredArticles = await cleanExpiredArticles();
    } catch (e) {
      errors.push(`Article cleanup failed: ${e instanceof Error ? e.message : String(e)}`);
    }

    // 3. Clean expired research cache
    let expiredResearch = 0;
    try {
      expiredResearch = await cleanExpiredResearch();
    } catch (e) {
      errors.push(`Research cleanup failed: ${e instanceof Error ? e.message : String(e)}`);
    }

    const durationMs = Date.now() - start;

    // 4. Log sync metadata
    try {
      await prisma.intelligenceSync.create({
        data: {
          syncType: 'scheduled',
          status: errors.length > 0 ? 'partial' : 'success',
          feedsProcessed: syncResult.feedsProcessed,
          articlesAdded: syncResult.articlesAdded,
          articlesExpired: expiredArticles + expiredResearch,
          errors: errors.length > 0 ? toPrismaJson(errors) : undefined,
          durationMs,
        },
      });
    } catch (dbErr) {
      // Schema drift — IntelligenceSync table may not exist yet
      log.warn(
        'Failed to log sync metadata (schema drift?):',
        dbErr instanceof Error ? dbErr.message : String(dbErr)
      );
    }

    log.info(
      `Intelligence sync complete in ${durationMs}ms: ` +
        `feeds=${syncResult.feedsProcessed}, added=${syncResult.articlesAdded}, ` +
        `expired=${expiredArticles + expiredResearch}, errors=${errors.length}`
    );

    return NextResponse.json({
      success: true,
      feedsProcessed: syncResult.feedsProcessed,
      articlesAdded: syncResult.articlesAdded,
      expiredArticles,
      expiredResearch,
      durationMs,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    log.error('Intelligence cron failed:', error);
    return NextResponse.json({ error: 'Intelligence sync failed' }, { status: 500 });
  }
}
