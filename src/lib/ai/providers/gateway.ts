/**
 * Vercel AI Gateway provider — Phase 1 of the multi-model migration
 * (locked 2026-05-02).
 *
 * Wraps the Vercel AI SDK's `generateText` and `streamText` with the same
 * shape that `providers/gemini.ts` exposes (`{ text, model, latencyMs,
 * inputTokens?, outputTokens? }`). This lets future call sites do a 1:1
 * import swap once we move past Phase 1.
 *
 * Key authentication:
 *   - `AI_GATEWAY_API_KEY` is read automatically by the `ai` package when
 *     a provider-prefixed model string is passed (e.g. `'openai/gpt-5'`).
 *   - On Vercel deployments with OIDC enabled, no explicit key is needed.
 *
 * Model strings:
 *   - Format: `'<provider>/<model>'`. Examples: `'openai/gpt-5'`,
 *     `'anthropic/claude-sonnet-4-6'`, `'google/gemini-3-pro'`.
 *   - The gateway routes the request to the underlying provider; pricing
 *     reflects the underlying model + a small gateway markup.
 *
 * Phase 1 boundary (this file):
 *   - Provider exists; can be imported anywhere.
 *   - NO existing call sites have been migrated yet.
 *   - The 12-node LangGraph pipeline (CLAUDE.md "Modifying the analysis
 *     pipeline" gate) is explicitly off-limits until Phase 3 with a
 *     regression-test plan + founder approval.
 *
 * Forward-looking rule: when migrating a call site from
 * `providers/gemini.ts` to this provider, update CLAUDE.md model policy
 * and `cost-tracker.ts` `TOKEN_COSTS` in the same commit. Each migrated
 * surface should be smoke-tested against the previous behavior before
 * shipping.
 */

import { generateText as aiGenerateText, streamText as aiStreamText } from 'ai';
import { getRequiredEnvVar } from '@/lib/env';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('GatewayProvider');

export interface GatewayGenerateTextResult {
  text: string;
  model: string;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
}

export interface GatewayGenerateTextOptions {
  /** Gateway model string. Format `'<provider>/<model>'`.
   *  Examples: `'openai/gpt-5'`, `'anthropic/claude-sonnet-4-6'`,
   *  `'google/gemini-3-pro'`, `'google/gemini-3.1-flash-lite'`. */
  model: string;
  /** Soft cap on output tokens. Defaults to 16384 to mirror Gemini provider. */
  maxOutputTokens?: number;
  /** Sampling temperature. Omit to use the model default. */
  temperature?: number;
  /** Optional system prompt — sets persona / instruction frame. */
  system?: string;
}

/**
 * Generate text via the Vercel AI Gateway.
 *
 * Use this when:
 *   - The call site needs model flexibility (A/B test GPT vs Claude vs Gemini)
 *   - Migrating an existing surface in Phase 2/3 of the gateway rollout
 *
 * Do NOT use this for:
 *   - LangGraph pipeline nodes (Phase 3 gate, see CLAUDE.md model policy)
 *   - The metaJudge final-verdict node (gemini-2.5-pro grounding lock)
 *   - Cron-scoped cost-sensitive paths until cost-tracker.ts is updated
 */
export async function generateText(
  prompt: string,
  options: GatewayGenerateTextOptions
): Promise<GatewayGenerateTextResult> {
  // Validates the env is present; throws a clear error if missing.
  // The `ai` package picks up the key automatically — this read is purely
  // for fail-fast validation at the surface boundary.
  getRequiredEnvVar('AI_GATEWAY_API_KEY');

  const start = Date.now();
  const result = await aiGenerateText({
    model: options.model,
    prompt,
    maxOutputTokens: options.maxOutputTokens ?? 16384,
    ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
    ...(options.system !== undefined ? { system: options.system } : {}),
  });
  const latencyMs = Date.now() - start;

  log.debug(
    `Gateway response (${options.model}): ${result.text.length} chars in ${latencyMs}ms`
  );

  return {
    text: result.text,
    model: options.model,
    latencyMs,
    inputTokens: result.usage?.inputTokens,
    outputTokens: result.usage?.outputTokens,
  };
}

export interface GatewayStreamTextResult {
  textStream: AsyncIterable<string>;
  /** Resolves to usage when the stream completes. */
  usage: Promise<{ inputTokens?: number; outputTokens?: number; totalTokens?: number }>;
  model: string;
}

/**
 * Stream text via the Vercel AI Gateway.
 *
 * Mirrors the AI SDK quickstart pattern. Use for chat surfaces, founder-hub
 * agents, and any surface where progressive rendering improves UX.
 */
export function streamText(
  prompt: string,
  options: GatewayGenerateTextOptions
): GatewayStreamTextResult {
  // Validates env presence at call time (the `ai` package will throw at
  // first network call otherwise; failing fast here surfaces a clearer error).
  getRequiredEnvVar('AI_GATEWAY_API_KEY');

  const result = aiStreamText({
    model: options.model,
    prompt,
    maxOutputTokens: options.maxOutputTokens ?? 16384,
    ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
    ...(options.system !== undefined ? { system: options.system } : {}),
  });

  // AI SDK v6 returns PromiseLike on `result.usage`. Wrap in Promise.resolve
  // so the gateway provider's external contract is `Promise<...>` (cleaner
  // for await-style consumers).
  return {
    textStream: result.textStream,
    usage: Promise.resolve(result.usage).then(u => ({
      inputTokens: u.inputTokens,
      outputTokens: u.outputTokens,
      totalTokens: u.totalTokens,
    })),
    model: options.model,
  };
}
