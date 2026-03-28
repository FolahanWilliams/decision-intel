/**
 * API usage cost tracking utility.
 * Fire-and-forget pattern — never blocks the caller.
 */
import { prisma } from '@/lib/prisma';
import { toPrismaJson } from './prisma-json';
import { createLogger } from './logger';

const log = createLogger('CostTracker');

interface TrackUsageParams {
  userId?: string;
  orgId?: string;
  provider: string;
  operation: string;
  tokens?: number;
  cost?: number;
  metadata?: Record<string, unknown>;
}

// Estimated costs per 1K tokens (USD) — update as pricing changes
const TOKEN_COSTS: Record<string, { input: number; output: number }> = {
  'gemini-2.0-flash': { input: 0.0001, output: 0.0004 },
  'gemini-2.5-pro': { input: 0.00125, output: 0.01 },
  'text-embedding-004': { input: 0.00001, output: 0 },
  'claude-sonnet-4-20250514': { input: 0.003, output: 0.015 },
};

/**
 * Estimate cost from token count and model name
 */
export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const rates = TOKEN_COSTS[model] || TOKEN_COSTS['gemini-2.0-flash'];
  return (inputTokens / 1000) * rates.input + (outputTokens / 1000) * rates.output;
}

/**
 * Track API usage — fire-and-forget, never throws
 */
export function trackApiUsage(params: TrackUsageParams): void {
  prisma.apiUsage
    .create({
      data: {
        userId: params.userId || null,
        orgId: params.orgId || null,
        provider: params.provider,
        operation: params.operation,
        tokens: params.tokens || null,
        cost: params.cost || null,
        metadata: params.metadata ? toPrismaJson(params.metadata) : undefined,
      },
    })
    .catch(err => {
      // Schema drift or DB issue — non-fatal
      log.debug(
        'Failed to track API usage (non-fatal):',
        err instanceof Error ? err.message : String(err)
      );
    });
}
