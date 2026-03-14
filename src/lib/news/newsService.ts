/**
 * RSS/News Intelligence Service
 *
 * Fetches curated RSS feeds, classifies articles via Gemini, and stores
 * them in the NewsArticle table for downstream use by agent nodes.
 */

import Parser from 'rss-parser';
import { prisma } from '@/lib/prisma';
import {
  NEWS_FEEDS,
  ARTICLE_TTL_HOURS,
  FEED_FETCH_CONCURRENCY,
  type FeedConfig,
  type FeedCategory,
} from '@/config/newsFeeds';
import { batchProcess, withTimeout } from '@/lib/utils/resilience';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('NewsService');

const parser = new Parser({
  timeout: 10_000,
  headers: { 'User-Agent': 'DecisionIntel/1.0 (+https://decision-intel.app)' },
});

// ─── Types ───────────────────────────────────────────────────────────────────

interface ParsedArticle {
  title: string;
  link: string;
  description: string;
  publishedAt: Date;
  source: string;
  feedCategory: FeedCategory;
}

export interface SyncResult {
  feedsProcessed: number;
  articlesAdded: number;
  articlesExpired: number;
  errors: string[];
  durationMs: number;
}

// ─── Feed Fetching ───────────────────────────────────────────────────────────

async function fetchFeed(feed: FeedConfig): Promise<ParsedArticle[]> {
  try {
    const result = await withTimeout(
      () => parser.parseURL(feed.url),
      15_000,
      `Feed timeout: ${feed.name}`
    );

    return (result.items || [])
      .filter(item => item.title && item.link)
      .map(item => ({
        title: item.title!.slice(0, 500),
        link: item.link!,
        description: (item.contentSnippet || item.content || '').slice(0, 2000),
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        source: feed.name,
        feedCategory: feed.category,
      }));
  } catch (err) {
    log.warn(
      `Failed to fetch feed "${feed.name}": ${err instanceof Error ? err.message : String(err)}`
    );
    return [];
  }
}

// ─── Gemini Classification ───────────────────────────────────────────────────

async function classifyArticles(articles: ParsedArticle[]): Promise<
  Array<
    ParsedArticle & {
      extractedTopics: string[];
      biasTypes: string[];
      industrySector: string | null;
      relevanceScore: number;
    }
  >
> {
  if (articles.length === 0) return [];

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const { getRequiredEnvVar } = await import('@/lib/env');
    const genAI = new GoogleGenerativeAI(getRequiredEnvVar('GOOGLE_API_KEY'));
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL_NAME || 'gemini-3-flash-preview',
      generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
    });

    // Batch classify up to 20 articles at a time to minimize LLM calls
    const batches: ParsedArticle[][] = [];
    for (let i = 0; i < articles.length; i += 20) {
      batches.push(articles.slice(i, i + 20));
    }

    const classified: Array<
      ParsedArticle & {
        extractedTopics: string[];
        biasTypes: string[];
        industrySector: string | null;
        relevanceScore: number;
      }
    > = [];

    for (const batch of batches) {
      const prompt = `Classify each article for a decision-intelligence platform.
For each article, provide:
- topics: string[] (key decision-making / business topics)
- biasTypes: string[] (applicable cognitive biases from: confirmation, anchoring, sunk_cost, overconfidence, groupthink, authority, bandwagon, loss_aversion, availability, hindsight, planning_fallacy, status_quo, framing, selective_perception, recency)
- industrySector: string | null (e.g. "Technology", "Finance", "Healthcare", null if general)
- relevanceScore: number (0-1, how relevant to decision-making and cognitive bias analysis)

Articles:
${batch.map((a, i) => `[${i}] "${a.title}" — ${a.description.slice(0, 200)}`).join('\n')}

Return a JSON array of objects in the same order.`;

      try {
        const result = await withTimeout(
          () => model.generateContent(prompt),
          30_000,
          'Classification timeout'
        );
        const text = result.response?.text?.() || '[]';
        const classifications = JSON.parse(
          text
            .replace(/```json\n?/g, '')
            .replace(/```/g, '')
            .trim()
        );

        batch.forEach((article, i) => {
          const c = classifications[i] || {};
          classified.push({
            ...article,
            extractedTopics: Array.isArray(c.topics) ? c.topics.slice(0, 10) : [],
            biasTypes: Array.isArray(c.biasTypes) ? c.biasTypes.slice(0, 5) : [],
            industrySector: typeof c.industrySector === 'string' ? c.industrySector : null,
            relevanceScore:
              typeof c.relevanceScore === 'number'
                ? Math.min(1, Math.max(0, c.relevanceScore))
                : 0.5,
          });
        });
      } catch (classErr) {
        log.warn(
          'Classification failed for batch, using defaults:',
          classErr instanceof Error ? classErr.message : String(classErr)
        );
        batch.forEach(article => {
          classified.push({
            ...article,
            extractedTopics: [],
            biasTypes: [],
            industrySector: null,
            relevanceScore: 0.5,
          });
        });
      }
    }

    return classified;
  } catch {
    // If Gemini is unavailable, store articles with default classification
    return articles.map(a => ({
      ...a,
      extractedTopics: [],
      biasTypes: [],
      industrySector: null,
      relevanceScore: 0.5,
    }));
  }
}

// ─── Storage ─────────────────────────────────────────────────────────────────

async function storeArticles(
  articles: Array<
    ParsedArticle & {
      extractedTopics: string[];
      biasTypes: string[];
      industrySector: string | null;
      relevanceScore: number;
    }
  >
): Promise<number> {
  let added = 0;

  for (const article of articles) {
    try {
      await prisma.newsArticle.upsert({
        where: { link: article.link },
        update: {}, // Don't update if already exists
        create: {
          title: article.title,
          link: article.link,
          source: article.source,
          feedCategory: article.feedCategory,
          description: article.description,
          publishedAt: article.publishedAt,
          expiresAt: new Date(Date.now() + ARTICLE_TTL_HOURS * 60 * 60 * 1000),
          extractedTopics: article.extractedTopics,
          biasTypes: article.biasTypes,
          industrySector: article.industrySector,
          relevanceScore: article.relevanceScore,
        },
      });
      added++;
    } catch (err) {
      // Unique constraint or other DB error — skip this article
      const code = (err as { code?: string }).code;
      if (code !== 'P2002') {
        log.warn(
          `Failed to store article "${article.title.slice(0, 50)}": ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  }

  return added;
}

// ─── Cleanup ─────────────────────────────────────────────────────────────────

export async function cleanExpiredArticles(): Promise<number> {
  const result = await prisma.newsArticle.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}

// ─── Main Sync ───────────────────────────────────────────────────────────────

/**
 * Fetch all configured RSS feeds, classify articles, and store in the DB.
 * Returns a summary of the sync operation.
 */
export async function syncAllFeeds(): Promise<SyncResult> {
  const start = Date.now();
  const errors: string[] = [];

  // 1. Fetch feeds with concurrency control
  const allArticles = await batchProcess(NEWS_FEEDS, fetchFeed, FEED_FETCH_CONCURRENCY);
  const flatArticles = allArticles.flat();

  // 2. Deduplicate by link
  const seen = new Set<string>();
  const unique = flatArticles.filter(a => {
    if (seen.has(a.link)) return false;
    seen.add(a.link);
    return true;
  });

  log.info(`Fetched ${unique.length} unique articles from ${NEWS_FEEDS.length} feeds`);

  // 3. Classify via Gemini
  const classified = await classifyArticles(unique);

  // 4. Store
  const articlesAdded = await storeArticles(classified);

  // 5. Clean expired
  const articlesExpired = await cleanExpiredArticles();

  const durationMs = Date.now() - start;
  log.info(`Sync complete: ${articlesAdded} added, ${articlesExpired} expired in ${durationMs}ms`);

  return {
    feedsProcessed: NEWS_FEEDS.length,
    articlesAdded,
    articlesExpired,
    errors,
    durationMs,
  };
}

// ─── Search ──────────────────────────────────────────────────────────────────

export interface NewsSearchOptions {
  topics?: string[];
  biasTypes?: string[];
  industry?: string;
  category?: FeedCategory;
  query?: string;
  limit?: number;
}

/**
 * Search stored news articles by topic, bias type, industry, or free text.
 * Results are ranked by recency and relevance score.
 */
export async function searchNews(options: NewsSearchOptions): Promise<
  Array<{
    id: string;
    title: string;
    link: string;
    source: string;
    feedCategory: string;
    description: string;
    publishedAt: Date;
    relevanceScore: number;
    biasTypes: string[];
    extractedTopics: string[];
  }>
> {
  const { topics, biasTypes, industry, category, query, limit = 10 } = options;

  const where: Record<string, unknown> = {
    expiresAt: { gt: new Date() }, // Only non-expired
  };

  if (category) where.feedCategory = category;
  if (industry) where.industrySector = { contains: industry, mode: 'insensitive' };

  if (topics && topics.length > 0) {
    where.extractedTopics = { hasSome: topics };
  }

  if (biasTypes && biasTypes.length > 0) {
    where.biasTypes = { hasSome: biasTypes };
  }

  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
    ];
  }

  const articles = await prisma.newsArticle.findMany({
    where: where as Parameters<typeof prisma.newsArticle.findMany>[0] extends { where?: infer W }
      ? W
      : never,
    orderBy: [{ relevanceScore: 'desc' }, { publishedAt: 'desc' }],
    take: Math.min(limit, 50),
    select: {
      id: true,
      title: true,
      link: true,
      source: true,
      feedCategory: true,
      description: true,
      publishedAt: true,
      relevanceScore: true,
      biasTypes: true,
      extractedTopics: true,
    },
  });

  return articles;
}
