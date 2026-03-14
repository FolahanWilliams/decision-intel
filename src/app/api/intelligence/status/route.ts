import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/intelligence/status — Returns intelligence data freshness and counts.
 * Used by the Intelligence page and sidebar freshness indicator.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    // Run all counts in parallel
    const [
      totalArticles,
      freshArticles,
      totalResearch,
      totalCaseStudies,
      latestSync,
      newestArticle,
    ] = await Promise.all([
      prisma.newsArticle.count().catch(() => 0),
      prisma.newsArticle
        .count({
          where: { expiresAt: { gt: now } },
        })
        .catch(() => 0),
      prisma.researchCache.count().catch(() => 0),
      prisma.caseStudy.count().catch(() => 0),
      prisma.intelligenceSync
        .findFirst({
          orderBy: { createdAt: 'desc' },
          select: {
            createdAt: true,
            status: true,
            articlesAdded: true,
            feedsProcessed: true,
            durationMs: true,
          },
        })
        .catch(() => null),
      prisma.newsArticle
        .findFirst({
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        })
        .catch(() => null),
    ]);

    // Determine freshness level
    const lastDataAt = newestArticle?.createdAt ?? latestSync?.createdAt;
    const hoursOld = lastDataAt
      ? (now.getTime() - new Date(lastDataAt).getTime()) / (1000 * 60 * 60)
      : Infinity;
    const freshness: 'fresh' | 'stale' | 'empty' =
      hoursOld <= 12 ? 'fresh' : hoursOld <= 48 ? 'stale' : 'empty';

    return NextResponse.json({
      freshness,
      hoursOld: Math.round(hoursOld * 10) / 10,
      lastSyncAt: latestSync?.createdAt ?? null,
      lastDataAt: lastDataAt ?? null,
      counts: {
        articles: freshArticles,
        articlesTotal: totalArticles,
        research: totalResearch,
        caseStudies: totalCaseStudies,
      },
      lastSync: latestSync
        ? {
            status: latestSync.status,
            articlesAdded: latestSync.articlesAdded,
            feedsProcessed: latestSync.feedsProcessed,
            durationMs: latestSync.durationMs,
          }
        : null,
    });
  } catch {
    // Schema drift — tables may not exist yet
    return NextResponse.json({
      freshness: 'empty',
      hoursOld: Infinity,
      lastSyncAt: null,
      lastDataAt: null,
      counts: { articles: 0, articlesTotal: 0, research: 0, caseStudies: 0 },
      lastSync: null,
    });
  }
}
