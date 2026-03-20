/**
 * Structured Error Tracking System
 *
 * Captures, groups, and persists critical errors to the AuditLog table
 * for monitoring and debugging production issues.
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from './logger';
import { createHash } from 'crypto';

const log = createLogger('ErrorTracker');

interface ErrorContext {
  userId?: string;
  orgId?: string;
  route?: string;
  method?: string;
  statusCode?: number;
  requestId?: string;
  userAgent?: string;
  ipAddress?: string;
  [key: string]: unknown;
}

interface ErrorFingerprint {
  message: string;
  stack?: string;
  code?: string;
}

class ErrorTracker {
  private errorCache = new Map<string, number>();
  private readonly CACHE_TTL = 60 * 1000; // 1 minute

  /**
   * Track an error with context
   * @param error The error to track
   * @param context Additional context about the error
   */
  async trackError(error: Error | unknown, context: ErrorContext = {}): Promise<void> {
    try {
      // Extract error details
      const errorObj = this.normalizeError(error);
      const fingerprint = this.generateFingerprint(errorObj);

      // Check for duplicate errors (rate limiting)
      if (this.isDuplicate(fingerprint)) {
        log.debug(`Skipping duplicate error: ${fingerprint}`);
        return;
      }

      // Prepare error details for storage
      const details = {
        message: errorObj.message,
        stack: errorObj.stack,
        code: errorObj.code,
        fingerprint,
        context,
        timestamp: new Date().toISOString(),
      };

      // Persist to AuditLog for critical errors
      if (this.isCriticalError(context.statusCode)) {
        await this.persistError(details, context);
      }

      // Log to console for debugging
      log.error('Tracked error:', {
        message: errorObj.message,
        code: errorObj.code,
        route: context.route,
        userId: context.userId,
      });
    } catch (trackingError) {
      // Don't let error tracking failures break the app
      log.error('Failed to track error:', trackingError);
    }
  }

  /**
   * Normalize various error types into a consistent format
   */
  private normalizeError(error: unknown): ErrorFingerprint {
    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack,
        code: (error as Record<string, unknown>).code as string | undefined,
      };
    }

    if (typeof error === 'string') {
      return { message: error };
    }

    if (typeof error === 'object' && error !== null) {
      const obj = error as Record<string, unknown>;
      return {
        message: (obj.message || obj.error || JSON.stringify(error)) as string,
        stack: obj.stack as string | undefined,
        code: (obj.code || obj.statusCode) as string | undefined,
      };
    }

    return { message: String(error) };
  }

  /**
   * Generate a fingerprint for error deduplication
   */
  private generateFingerprint(error: ErrorFingerprint): string {
    const parts = [error.message, error.code || ''];

    // Include stack trace but only the first meaningful line
    if (error.stack) {
      const stackLines = error.stack.split('\n');
      const firstRelevantLine = stackLines.find(line =>
        line.includes('at ') && !line.includes('node_modules')
      );
      if (firstRelevantLine) {
        parts.push(firstRelevantLine.trim());
      }
    }

    return createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 16);
  }

  /**
   * Check if this error has been seen recently
   */
  private isDuplicate(fingerprint: string): boolean {
    const now = Date.now();
    const lastSeen = this.errorCache.get(fingerprint);

    // Clean up old entries
    if (lastSeen && now - lastSeen > this.CACHE_TTL) {
      this.errorCache.delete(fingerprint);
      return false;
    }

    if (lastSeen) {
      // Update timestamp but return true (is duplicate)
      this.errorCache.set(fingerprint, now);
      return true;
    }

    // First time seeing this error
    this.errorCache.set(fingerprint, now);
    return false;
  }

  /**
   * Determine if an error is critical based on status code
   */
  private isCriticalError(statusCode?: number): boolean {
    if (!statusCode) return true; // Unknown errors are critical
    return statusCode >= 500; // 5xx errors are critical
  }

  /**
   * Persist error to the database
   */
  private async persistError(details: Record<string, unknown>, context: ErrorContext): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: context.userId || 'system',
          orgId: context.orgId,
          action: 'system_error',
          resource: context.route || 'unknown',
          resourceId: details.fingerprint,
          details,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        },
      });
    } catch (dbError) {
      log.error('Failed to persist error to database:', dbError);
    }
  }

  /**
   * Get recent system errors (admin only)
   */
  async getRecentErrors(limit = 50): Promise<Record<string, unknown>[]> {
    try {
      const errors = await prisma.auditLog.findMany({
        where: { action: 'system_error' },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      // Group by fingerprint and count occurrences
      const grouped = new Map<string, Record<string, unknown>>();

      for (const error of errors) {
        const fingerprint = (error.details as Record<string, unknown>)?.fingerprint;
        if (fingerprint) {
          const existing = grouped.get(fingerprint);
          if (existing) {
            existing.count++;
            existing.lastOccurred = error.createdAt;
          } else {
            grouped.set(fingerprint, {
              ...error,
              count: 1,
              lastOccurred: error.createdAt,
            });
          }
        }
      }

      return Array.from(grouped.values());
    } catch (error) {
      log.error('Failed to fetch recent errors:', error);
      return [];
    }
  }
}

// Export singleton instance
export const errorTracker = new ErrorTracker();

/**
 * Convenience function for tracking errors
 */
export function trackError(error: Error | unknown, context: ErrorContext = {}): Promise<void> {
  return errorTracker.trackError(error, context);
}

/**
 * Express/Next.js error handler wrapper
 */
export function withErrorTracking<T extends (...args: unknown[]) => Promise<unknown>>(
  handler: T,
  defaultContext?: ErrorContext
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      // Extract context from request if available
      const req = args[0];
      const context: ErrorContext = {
        ...defaultContext,
        route: req?.url || req?.nextUrl?.pathname,
        method: req?.method,
        userAgent: req?.headers?.get?.('user-agent'),
      };

      await trackError(error, context);
      throw error; // Re-throw to maintain original behavior
    }
  }) as T;
}