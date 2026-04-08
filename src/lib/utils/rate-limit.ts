/**
 * Postgres-based rate limiting utility
 * Replaces Upstash Redis to save costs - uses existing Supabase database
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { createLogger } from './logger';

const log = createLogger('RateLimit');

// ---------------------------------------------------------------------------
// In-memory deny cache — avoids a DB roundtrip for repeat offenders within
// the same serverless instance. Evicts oldest entry when full.
// ---------------------------------------------------------------------------
const DENY_CACHE = new Map<string, number>(); // key → expiry timestamp (ms)
const DENY_CACHE_MAX = 1000;

function isDeniedInMemory(identifier: string, route: string): boolean {
  const key = `${identifier}:${route}`;
  const expiry = DENY_CACHE.get(key);
  if (expiry && expiry > Date.now()) return true;
  if (expiry) DENY_CACHE.delete(key);
  return false;
}

/** @internal Exported for test cleanup only. */
export function _resetDenyCache(): void {
  DENY_CACHE.clear();
}

function cacheDenial(identifier: string, route: string, resetMs: number): void {
  if (DENY_CACHE.size >= DENY_CACHE_MAX) {
    const firstKey = DENY_CACHE.keys().next().value;
    if (firstKey) DENY_CACHE.delete(firstKey);
  }
  DENY_CACHE.set(`${identifier}:${route}`, resetMs);
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  /**
   * Behaviour when the rate-limit check itself fails (DB error):
   *  - 'open'   (default) — allow the request through (availability over security)
   *  - 'closed' — deny the request (security over availability)
   */
  failMode?: 'open' | 'closed';
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5, // 5 requests per hour
  failMode: 'closed',
};

/**
 * Check rate limit for a given identifier and route
 * Uses Postgres with automatic cleanup of expired entries
 */
export async function checkRateLimit(
  identifier: string,
  route: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMs);
  const failMode = config.failMode ?? 'closed';

  // Fast path: check in-memory deny cache before hitting the DB
  if (isDeniedInMemory(identifier, route)) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: Math.floor((now.getTime() + config.windowMs) / 1000),
    };
  }

  try {
    // Clean up old expired rate limit entries in the background.
    // Fire-and-forget: logging is best-effort; failure does not block the request.
    void Promise.resolve(
      prisma.rateLimit.deleteMany({
        where: { resetAt: { lt: windowStart } },
      })
    ).catch((err: unknown) =>
      log.warn('Rate limit cleanup error: ' + (err instanceof Error ? err.message : String(err)))
    );

    const resetAt = new Date(now.getTime() + config.windowMs);

    // Atomically upsert and increment the counter in a single statement,
    // handling the window-expiry reset inline. This eliminates the TOCTOU
    // race condition present in a read-then-write approach.
    type RateLimitRow = { count: number; reset_at: Date };
    const rows = await prisma.$queryRaw<RateLimitRow[]>(Prisma.sql`
      INSERT INTO "RateLimit" (id, identifier, route, count, "resetAt", "updatedAt")
      VALUES (gen_random_uuid(), ${identifier}, ${route}, 1, ${resetAt}, ${now})
      ON CONFLICT (identifier, route) DO UPDATE
        SET
          count     = CASE WHEN "RateLimit"."resetAt" < ${now} THEN 1
                          ELSE "RateLimit".count + 1 END,
          "resetAt" = CASE WHEN "RateLimit"."resetAt" < ${now} THEN ${resetAt}
                          ELSE "RateLimit"."resetAt" END,
          "updatedAt" = ${now}
      RETURNING count, "resetAt" as reset_at
    `);

    const row = rows[0];
    const currentCount = row?.count ?? 1;
    const currentResetAt = row?.reset_at ?? resetAt;

    if (currentCount > config.maxRequests) {
      // Cache the denial so subsequent requests from this identifier
      // skip the DB roundtrip within this serverless instance
      cacheDenial(identifier, route, currentResetAt.getTime());
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        reset: Math.floor(currentResetAt.getTime() / 1000),
      };
    }

    return {
      success: true,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - currentCount),
      reset: Math.floor(currentResetAt.getTime() / 1000),
    };
  } catch (error) {
    log.error('Rate limit check failed (failMode=' + failMode + '):', error);

    if (failMode === 'closed') {
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        reset: Math.floor((now.getTime() + config.windowMs) / 1000),
      };
    }

    // Fail open — allow the request through
    return {
      success: true,
      limit: config.maxRequests,
      remaining: 1,
      reset: Math.floor((now.getTime() + config.windowMs) / 1000),
    };
  }
}

/**
 * Get current rate limit status without incrementing
 */
export async function getRateLimitStatus(
  identifier: string,
  route: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<RateLimitResult> {
  const now = new Date();

  try {
    const rateLimit = await prisma.rateLimit.findUnique({
      where: {
        identifier_route: {
          identifier,
          route,
        },
      },
    });

    if (!rateLimit || rateLimit.resetAt < now) {
      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests,
        reset: Math.floor((now.getTime() + config.windowMs) / 1000),
      };
    }

    const remaining = Math.max(0, config.maxRequests - rateLimit.count);

    return {
      success: remaining > 0,
      limit: config.maxRequests,
      remaining,
      reset: Math.floor(rateLimit.resetAt.getTime() / 1000),
    };
  } catch (error) {
    log.error('Rate limit status error:', error);
    // Fail closed: deny on DB error to prevent bypass
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: Math.floor((now.getTime() + config.windowMs) / 1000),
    };
  }
}
