/**
 * Redis configuration and caching utilities
 */

import Redis from 'ioredis';
import { hashContent } from './resilience';
import { createLogger } from './logger';

const log = createLogger('Cache');

// Redis client singleton
let redisClient: Redis | null = null;
let cacheStatusLogged = false;

/**
 * Get or create Redis client instance
 * @returns Redis client or null if not configured
 */
export function getRedisClient(): Redis | null {
  if (redisClient) {
    return redisClient;
  }
  
  // Check if Redis URL is configured
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    if (!cacheStatusLogged) {
      log.warn('REDIS_URL not configured — caching disabled');
      cacheStatusLogged = true;
    }
    return null;
  }
  
  try {
    redisClient = new Redis(redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });
    
    redisClient.on('error', (err) => {
      log.error('Redis error: ' + err.message);
    });
    
    redisClient.on('connect', () => {
      log.info('Redis connected');
      cacheStatusLogged = true;
    });
    
    return redisClient;
  } catch (error) {
    log.error('Failed to create Redis client:', error);
    return null;
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
  ANALYSIS: 7 * 24 * 60 * 60, // 7 days
  EMBEDDING: 30 * 24 * 60 * 60, // 30 days
  BIAS_INSIGHT: 30 * 24 * 60 * 60, // 30 days (research doesn't change often)
  FINANCIAL_DATA: 60 * 60, // 1 hour (stock data changes frequently)
  RATE_LIMIT: 60, // 1 minute
} as const;

/**
 * Get cached analysis result
 * @param contentHash Hash of the document content
 * @returns Cached analysis or null
 */
export async function getCachedAnalysis(contentHash: string): Promise<Record<string, unknown> | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  
  try {
    const cached = await redis.get(`${CACHE_KEYS.ANALYSIS}${contentHash}`);
    if (cached) {
      log.debug('Cache hit for analysis: ' + contentHash.substring(0, 8));
      return JSON.parse(cached);
    }
    return null;
  } catch (error) {
    log.error('Redis get error:', error);
    return null;
  }
}

/**
 * Cache analysis result
 * @param contentHash Hash of the document content
 * @param analysis The analysis result to cache
 * @param ttl Time to live in seconds (default: 7 days)
 */
export async function cacheAnalysis(
  contentHash: string,
  analysis: Record<string, unknown>,
  ttl: number = CACHE_TTL.ANALYSIS
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  
  try {
    await redis.setex(
      `${CACHE_KEYS.ANALYSIS}${contentHash}`,
      ttl,
      JSON.stringify(analysis)
    );
    log.debug('Analysis cached: ' + contentHash.substring(0, 8));
  } catch (error) {
    log.error('Redis set error:', error);
  }
}

/**
 * Get cached embedding
 * @param textHash Hash of the text
 * @returns Cached embedding or null
 */
export async function getCachedEmbedding(textHash: string): Promise<number[] | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  
  try {
    const cached = await redis.get(`${CACHE_KEYS.EMBEDDING}${textHash}`);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  } catch (error) {
    log.error('Redis embedding get error:', error);
    return null;
  }
}

/**
 * Cache embedding
 * @param textHash Hash of the text
 * @param embedding The embedding vector
 */
export async function cacheEmbedding(
  textHash: string,
  embedding: number[]
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  
  try {
    await redis.setex(
      `${CACHE_KEYS.EMBEDDING}${textHash}`,
      CACHE_TTL.EMBEDDING,
      JSON.stringify(embedding)
    );
  } catch (error) {
    log.error('Redis embedding set error:', error);
  }
}

/**
 * Get cached bias research insight
 * @param biasType The type of bias
 * @returns Cached insight or null
 */
export async function getCachedBiasInsight(biasType: string): Promise<string | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  
  try {
    return await redis.get(`${CACHE_KEYS.BIAS_INSIGHT}${biasType}`);
  } catch (error) {
    log.error('Redis bias insight get error:', error);
    return null;
  }
}

/**
 * Cache bias research insight
 * @param biasType The type of bias
 * @param insight The research insight
 */
export async function cacheBiasInsight(
  biasType: string,
  insight: string
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  
  try {
    await redis.setex(
      `${CACHE_KEYS.BIAS_INSIGHT}${biasType}`,
      CACHE_TTL.BIAS_INSIGHT,
      insight
    );
  } catch (error) {
    log.error('Redis bias insight set error:', error);
  }
}

/**
 * Get cached financial data
 * @param ticker Stock ticker symbol
 * @param dataType Type of financial data
 * @returns Cached data or null
 */
export async function getCachedFinancialData(
  ticker: string,
  dataType: string
): Promise<unknown | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  
  try {
    const cached = await redis.get(`${CACHE_KEYS.FINANCIAL_DATA}${ticker}:${dataType}`);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  } catch (error) {
    log.error('Redis financial data get error:', error);
    return null;
  }
}

/**
 * Cache financial data
 * @param ticker Stock ticker symbol
 * @param dataType Type of financial data
 * @param data The financial data
 */
export async function cacheFinancialData(
  ticker: string,
  dataType: string,
  data: unknown
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  
  try {
    await redis.setex(
      `${CACHE_KEYS.FINANCIAL_DATA}${ticker}:${dataType}`,
      CACHE_TTL.FINANCIAL_DATA,
      JSON.stringify(data)
    );
  } catch (error) {
    log.error('Redis financial data set error:', error);
  }
}

/**
 * Clear all analysis cache (useful for testing/admin)
 */
export async function clearAnalysisCache(): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  
  try {
    const keys = await redis.keys(`${CACHE_KEYS.ANALYSIS}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
      log.info(`Cleared ${keys.length} cached analyses`);
    }
  } catch (error) {
    log.error('Failed to clear analysis cache:', error);
  }
}

/**
 * Get cache statistics
 * @returns Cache stats or null if Redis unavailable
 */
export async function getCacheStats(): Promise<{ 
  analyses: number; 
  embeddings: number;
  biasInsights: number;
  financialData: number;
} | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  
  try {
    const [
      analyses,
      embeddings,
      biasInsights,
      financialData
    ] = await Promise.all([
      redis.keys(`${CACHE_KEYS.ANALYSIS}*`),
      redis.keys(`${CACHE_KEYS.EMBEDDING}*`),
      redis.keys(`${CACHE_KEYS.BIAS_INSIGHT}*`),
      redis.keys(`${CACHE_KEYS.FINANCIAL_DATA}*`),
    ]);
    
    return {
      analyses: analyses.length,
      embeddings: embeddings.length,
      biasInsights: biasInsights.length,
      financialData: financialData.length,
    };
  } catch (error) {
    log.error('Failed to get cache stats:', error);
    return null;
  }
}

/**
 * Generate cache key for analysis based on content and user settings
 * This ensures different settings produce different cache keys
 * @param content Document content
 * @param userId User ID for user-specific caching
 * @returns Cache key
 */
export function generateAnalysisCacheKey(content: string, userId?: string): string {
  const contentHash = hashContent(content);
  // Include userId in key if provided for user-specific analysis settings
  return userId ? `${contentHash}:${userId}` : contentHash;
}
