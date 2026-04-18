/**
 * Outbound Webhook Engine
 *
 * Fans out events to all matching webhook subscriptions.
 * Features: HMAC signing, retry with exponential backoff, auto-disable after failures.
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { createLogger } from '@/lib/utils/logger';
import { createHmac } from 'crypto';
import type { WebhookEvent } from './events';

const log = createLogger('WebhookEngine');

const MAX_FAILURES = 10;
const RETRY_DELAYS = [1000, 5000, 30000]; // 1s, 5s, 30s
const MAX_DELIVERIES_PER_HOUR = 200; // Per-subscription hourly cap
const MAX_PAYLOAD_SIZE = 1_048_576; // 1MB

/**
 * Emit an event to all matching webhook subscriptions for an org.
 * Fire-and-forget — never blocks the caller.
 */
export function emitWebhookEvent(
  event: WebhookEvent,
  data: Record<string, unknown>,
  orgId: string
): void {
  // Fire-and-forget
  deliverToSubscribers(event, data, orgId).catch(err => {
    log.warn(`Failed to emit webhook event ${event}`, err);
  });
}

async function deliverToSubscribers(
  event: WebhookEvent,
  data: Record<string, unknown>,
  orgId: string
): Promise<void> {
  const subscriptions = await prisma.webhookSubscription.findMany({
    where: {
      orgId,
      active: true,
      events: { has: event },
    },
  });

  if (subscriptions.length === 0) return;

  log.info(`Delivering ${event} to ${subscriptions.length} subscribers`);

  await Promise.allSettled(
    subscriptions.map(sub => deliverWithRetry(sub.id, sub.url, sub.secret, event, data))
  );
}

async function deliverWithRetry(
  subscriptionId: string,
  url: string,
  secret: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  const payload = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data,
  });

  // Enforce payload size limit
  if (payload.length > MAX_PAYLOAD_SIZE) {
    log.warn(`Webhook payload too large (${payload.length} bytes) for ${subscriptionId}, skipping`);
    return;
  }

  // Per-subscription hourly delivery rate limit
  try {
    const oneHourAgo = new Date(Date.now() - 3600_000);
    const recentCount = await prisma.webhookDelivery.count({
      where: {
        subscriptionId,
        createdAt: { gte: oneHourAgo },
      },
    });
    if (recentCount >= MAX_DELIVERIES_PER_HOUR) {
      log.warn(
        `Webhook ${subscriptionId} exceeded ${MAX_DELIVERIES_PER_HOUR} deliveries/hour, throttling`
      );
      return;
    }
  } catch {
    // Non-critical — deliver anyway if count check fails
  }

  const signature = createHmac('sha256', secret).update(payload).digest('hex');

  for (let attempt = 1; attempt <= RETRY_DELAYS.length + 1; attempt++) {
    const start = performance.now();
    let statusCode: number | null = null;
    let responseBody: string | null = null;
    let success = false;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000); // 10s timeout

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-DecisionIntel-Signature': `sha256=${signature}`,
          'X-DecisionIntel-Event': event,
          'User-Agent': 'DecisionIntel-Webhook/1.0',
        },
        body: payload,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      statusCode = response.status;
      responseBody = await response.text().catch(() => null);
      success = response.ok;
    } catch (err) {
      responseBody = err instanceof Error ? err.message : 'Unknown error';
    }

    const durationMs = Math.round(performance.now() - start);

    // Log delivery attempt
    try {
      await prisma.webhookDelivery.create({
        data: {
          subscriptionId,
          event,
          payload: JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue,
          statusCode,
          responseBody: responseBody?.slice(0, 2000) ?? null,
          durationMs,
          attempt,
          success,
        },
      });
    } catch (err) {
      log.warn('Failed to log webhook delivery:', err instanceof Error ? err.message : err);
    }

    if (success) {
      // Reset failure count and update lastSuccess
      await prisma.webhookSubscription
        .update({
          where: { id: subscriptionId },
          data: { failCount: 0, lastSuccess: new Date(), lastError: null },
        })
        .catch(err =>
          log.warn(`Failed to reset failCount on subscription ${subscriptionId}:`, err)
        );
      return;
    }

    // Update failure count
    try {
      const updated = await prisma.webhookSubscription.update({
        where: { id: subscriptionId },
        data: {
          failCount: { increment: 1 },
          lastError: responseBody?.slice(0, 500) ?? 'Unknown error',
        },
      });

      // Auto-disable after too many failures
      if (updated.failCount >= MAX_FAILURES) {
        await prisma.webhookSubscription.update({
          where: { id: subscriptionId },
          data: { active: false },
        });
        log.warn(`Disabled webhook ${subscriptionId} after ${MAX_FAILURES} consecutive failures`);
        return;
      }
    } catch {
      // Non-critical — continue with retry
    }

    // Wait before retry (unless last attempt)
    if (attempt <= RETRY_DELAYS.length) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt - 1]));
    }
  }
}
