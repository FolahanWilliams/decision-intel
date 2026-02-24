/**
 * Supabase/Postgres-backed caching utilities
 *
 * Replaces the previous ioredis/Redis implementation with a `CacheEntry`
 * table managed by Prisma.  TTL is enforced via the `expiresAt` column:
 *   - Reads filter out expired rows and lazily delete them.
 *   - Writes upsert with a new `expiresAt` and probabilistically prune
 *     other expired rows (~1% of writes) so the table stays compact.
 *   - A dedicated /api/cache/cleanup endpoint handles scheduled bulk pruning.
 */

import { prisma } from '@/lib/prisma';
import { hashContent } from './resilience';
import { createLogger } from './logger';

const log = createLogger('Cache');

let cacheStatusLogged = false;
function logCacheReady() {
  if (!cacheStatusLogged) {
    log.info('Cache backed by Supabase/Postgres (CacheEntry table)');
    cacheStatusLogged = true;
  }
}

/**
 * Cache key prefixes for different data types
 */
export const CACHE_KEYS = {
  ANALYSIS: 'analysis:',
  EMBEDDING: 'embedding:',
  BIAS_INSIGHT: 'bias_insight:',
  FINANCIAL_DATA: 'financial:',
  RATE_LIMIT: 'rate_limit:',
} as const;

/**
 * Cache TTL values in seconds
 */
export const CACHE_TTL = {
  ANALYSIS: 7 * 24 * 60 * 60,      // 7 days
  EMBEDDING: 30 * 24 * 60 * 60,    // 30 days
  BIAS_INSIGHT: 30 * 24 * 60 * 60, // 30 days (research doesn't change often)
  FINANCIAL_DATA: 60 * 60,          // 1 hour (stock data changes frequently)
  RATE_LIMIT: 60,                   // 1 minute
} as const;

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

async function cacheGet(key: string): Promise<string | null> {
  logCacheReady();
  try {
    const entry = await prisma.cacheEntry.findUnique({
      where: { key },
      select: { value: true, expiresAt: true },
    });
    if (!entry) return null;
    if (entry.expiresAt <= new Date()) {
      // Lazy delete of expired entry — fire and forget
      prisma.cacheEntry.delete({ where: { key } }).catch(() => null);
      return null;
    }
    return entry.value;
  } catch (error) {
    log.error('Cache get error:', error);
    return null;
  }
}

async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  logCacheReady();
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  try {
    await prisma.cacheEntry.upsert({
      where: { key },
      update: { value, expiresAt },
      create: { key, value, expiresAt },
    });
    // Probabilistic cleanup: ~1% of writes trigger expired-row pruning
    if (Math.random() < 0.01) {
      pruneExpiredEntries().catch(() => null);
    }
  } catch (error) {
    log.error('Cache set error:', error);
  }
}

/**
 * Delete all expired cache entries. Called probabilistically on writes and
 * by the /api/cache/cleanup endpoint.
 */
export async function pruneExpiredEntries(): Promise<number> {
  const result = await prisma.cacheEntry.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  });
  if (result.count > 0) {
    log.debug(`Pruned ${result.count} expired cache entries`);
  }
  return result.count;
}

// ---------------------------------------------------------------------------
// Public API — identical surface to the previous Redis implementation
// ---------------------------------------------------------------------------

/**
 * @deprecated No-op kept for backwards compatibility. Cache is always active
 * via Postgres; there is no optional Redis client to retrieve.
 */
export function getRedisClient(): null {
  return null;
}

/**
 * Get cached analysis result
 */
export async function getCachedAnalysis(contentHash: string): Promise<Record<string, unknown> | null> {
  const raw = await cacheGet(`${CACHE_KEYS.ANALYSIS}${contentHash}`);
  if (raw) {
    log.debug('Cache hit for analysis: ' + contentHash.substring(0, 8));
    return JSON.parse(raw);
  }
  return null;
}

/**
 * Cache analysis result
 */
export async function cacheAnalysis(
  contentHash: string,
  analysis: Record<string, unknown>,
  ttl: number = CACHE_TTL.ANALYSIS
): Promise<void> {
  await cacheSet(`${CACHE_KEYS.ANALYSIS}${contentHash}`, JSON.stringify(analysis), ttl);
  log.debug('Analysis cached: ' + contentHash.substring(0, 8));
}

/**
 * Get cached embedding
 */
export async function getCachedEmbedding(textHash: string): Promise<number[] | null> {
  const raw = await cacheGet(`${CACHE_KEYS.EMBEDDING}${textHash}`);
  return raw ? (JSON.parse(raw) as number[]) : null;
}

/**
 * Cache embedding
 */
export async function cacheEmbedding(textHash: string, embedding: number[]): Promise<void> {
  await cacheSet(`${CACHE_KEYS.EMBEDDING}${textHash}`, JSON.stringify(embedding), CACHE_TTL.EMBEDDING);
}

/**
 * Get cached bias research insight
 */
export async function getCachedBiasInsight(biasType: string): Promise<string | null> {
  return cacheGet(`${CACHE_KEYS.BIAS_INSIGHT}${biasType}`);
}

/**
 * Cache bias research insight
 */
export async function cacheBiasInsight(biasType: string, insight: string): Promise<void> {
  await cacheSet(`${CACHE_KEYS.BIAS_INSIGHT}${biasType}`, insight, CACHE_TTL.BIAS_INSIGHT);
}

/**
 * Get cached financial data
 */
export async function getCachedFinancialData(
  ticker: string,
  dataType: string
): Promise<unknown | null> {
  const raw = await cacheGet(`${CACHE_KEYS.FINANCIAL_DATA}${ticker}:${dataType}`);
  return raw ? JSON.parse(raw) : null;
}

/**
 * Cache financial data
 */
export async function cacheFinancialData(
  ticker: string,
  dataType: string,
  data: unknown
): Promise<void> {
  await cacheSet(
    `${CACHE_KEYS.FINANCIAL_DATA}${ticker}:${dataType}`,
    JSON.stringify(data),
    CACHE_TTL.FINANCIAL_DATA
  );
}

/**
 * Clear all analysis cache entries
 */
export async function clearAnalysisCache(): Promise<void> {
  try {
    const result = await prisma.cacheEntry.deleteMany({
      where: { key: { startsWith: CACHE_KEYS.ANALYSIS } },
    });
    log.info(`Cleared ${result.count} cached analyses`);
  } catch (error) {
    log.error('Failed to clear analysis cache:', error);
  }
}

/**
 * Get cache statistics (non-expired entries only)
 */
export async function getCacheStats(): Promise<{
  analyses: number;
  embeddings: number;
  biasInsights: number;
  financialData: number;
} | null> {
  try {
    const now = new Date();
    const [analyses, embeddings, biasInsights, financialData] = await Promise.all([
      prisma.cacheEntry.count({ where: { key: { startsWith: CACHE_KEYS.ANALYSIS },    expiresAt: { gt: now } } }),
      prisma.cacheEntry.count({ where: { key: { startsWith: CACHE_KEYS.EMBEDDING },   expiresAt: { gt: now } } }),
      prisma.cacheEntry.count({ where: { key: { startsWith: CACHE_KEYS.BIAS_INSIGHT },expiresAt: { gt: now } } }),
      prisma.cacheEntry.count({ where: { key: { startsWith: CACHE_KEYS.FINANCIAL_DATA },expiresAt: { gt: now } } }),
    ]);
    return { analyses, embeddings, biasInsights, financialData };
  } catch (error) {
    log.error('Failed to get cache stats:', error);
    return null;
  }
}

/**
 * Generate cache key for analysis based on content and optional user ID
 */
export function generateAnalysisCacheKey(content: string, userId?: string): string {
  const contentHash = hashContent(content);
  return userId ? `${contentHash}:${userId}` : contentHash;
}
