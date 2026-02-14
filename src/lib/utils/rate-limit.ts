/**
 * Postgres-based rate limiting utility
 * Replaces Upstash Redis to save costs - uses existing Supabase database
 */

import { prisma } from '@/lib/prisma';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5, // 5 requests per hour
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
  
  try {
    // Clean up old expired rate limit entries (older than window)
    // Run this in the background, don't await
    prisma.rateLimit.deleteMany({
      where: {
        resetAt: {
          lt: windowStart,
        },
      },
    }).catch((err: Error) => console.warn('Rate limit cleanup error:', err.message));

    // Find or create rate limit entry
    let rateLimit = await prisma.rateLimit.findUnique({
      where: {
        identifier_route: {
          identifier,
          route,
        },
      },
    });

    // If no entry exists or it has expired, create a new one
    if (!rateLimit || rateLimit.resetAt < now) {
      const resetAt = new Date(now.getTime() + config.windowMs);
      
      rateLimit = await prisma.rateLimit.upsert({
        where: {
          identifier_route: {
            identifier,
            route,
          },
        },
        update: {
          count: 1,
          resetAt,
          updatedAt: now,
        },
        create: {
          identifier,
          route,
          count: 1,
          resetAt,
        },
      });

      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        reset: Math.floor(resetAt.getTime() / 1000),
      };
    }

    // Check if limit exceeded
    if (rateLimit.count >= config.maxRequests) {
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        reset: Math.floor(rateLimit.resetAt.getTime() / 1000),
      };
    }

    // Increment count
    const updated = await prisma.rateLimit.update({
      where: {
        identifier_route: {
          identifier,
          route,
        },
      },
      data: {
        count: {
          increment: 1,
        },
        updatedAt: now,
      },
    });

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - updated.count,
      reset: Math.floor(updated.resetAt.getTime() / 1000),
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, allow the request (fail open)
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
    console.error('Rate limit status error:', error);
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      reset: Math.floor((now.getTime() + config.windowMs) / 1000),
    };
  }
}
