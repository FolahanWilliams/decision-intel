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

// Estimated costs per 1K tokens (USD) — update as pricing changes.
// Native-Gemini-SDK keys use the bare model name; AI-Gateway-routed
// keys carry the `<provider>/<model>` prefix the gateway expects (so
// `runJudgeCall` and the cost-tracker share one keying convention).
const TOKEN_COSTS: Record<string, { input: number; output: number }> = {
  'gemini-3-flash-preview': { input: 0.00015, output: 0.0006 },
  'gemini-3.1-flash-lite': { input: 0.00005, output: 0.0002 },
  'gemini-2.5-pro': { input: 0.00125, output: 0.01 },
  'text-embedding-004': { input: 0.00001, output: 0 },
  'claude-sonnet-4-20250514': { input: 0.003, output: 0.015 },
  // Cross-model noise-jury arms (locked 2026-05-06). Grok 4.3 via
  // Vercel AI Gateway — input/output rates from xAI's public pricing
  // ($3 / 1M input · $15 / 1M output as of 2026-05). The gateway adds
  // a small markup; treat these as floor estimates for billing math.
  'xai/grok-4.3': { input: 0.003, output: 0.015 },
  // Gateway-routed Gemini variants for surfaces that A/B-test. Same
  // rates as the native Gemini calls above; the gateway markup is
  // proportionally tiny on Flash-tier traffic.
  'google/gemini-3-flash-preview': { input: 0.00015, output: 0.0006 },
  'google/gemini-3.1-flash-lite': { input: 0.00005, output: 0.0002 },
};

/**
 * Estimate cost from token count and model name
 */
export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const rates = TOKEN_COSTS[model] || TOKEN_COSTS['gemini-3.1-flash-lite'];
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
