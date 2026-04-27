/**
 * Cron Concurrency Guard
 *
 * Uses the existing CacheEntry table as a lease-based lock to prevent
 * duplicate cron dispatches when Vercel retries on timeout/network errors.
 * Lock auto-expires via TTL so a crashed instance never holds a lock forever.
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from './logger';

const log = createLogger('CronLock');

/**
 * Acquire a cron lock. Returns true if acquired, false if another instance holds it.
 * Uses CacheEntry table with a TTL-based lease (no new Prisma model needed).
 */
export async function acquireCronLock(jobName: string, ttlSeconds = 300): Promise<boolean> {
  const key = `cron_lock:${jobName}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

  try {
    const existing = await prisma.cacheEntry.findUnique({ where: { key } });
    if (existing && existing.expiresAt > now) {
      log.warn(`Cron lock held for ${jobName}, skipping duplicate execution`);
      return false;
    }
    // Upsert — if expired or missing, take the lock
    await prisma.cacheEntry.upsert({
      where: { key },
      create: { key, value: 'locked', expiresAt },
      update: { value: 'locked', expiresAt },
    });
    return true;
  } catch (err) {
    log.error(`Failed to acquire cron lock for ${jobName}:`, err);
    return false; // Fail closed — skip rather than double-run
  }
}

/**
 * Release a cron lock after the job completes.
 */
export async function releaseCronLock(jobName: string): Promise<void> {
  const key = `cron_lock:${jobName}`;
  try {
    await prisma.cacheEntry.delete({ where: { key } });
  } catch {
    // Idempotent release — already deleted or expired; silent per CLAUDE.md fire-and-forget exceptions.
  }
}
