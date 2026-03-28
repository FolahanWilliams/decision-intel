/**
 * Multi-model router with fallback support.
 *
 * When AI_FALLBACK_ENABLED=true, tries Gemini first and falls back to Claude
 * on failure. Otherwise, uses Gemini only.
 */
import { generateText as geminiGenerateText } from './providers/gemini';
import { generateText as claudeGenerateText } from './providers/claude';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('ModelRouter');

/**
 * Determines if an error is transient (worth retrying with fallback) vs a client
 * error (4xx) that would also fail on the fallback provider.
 */
function isTransientError(err: unknown): boolean {
  if (!(err instanceof Error)) return true;
  const msg = err.message;
  // Google AI SDK includes HTTP status in error messages like "[429 Too Many Requests]"
  if (/\b(429|500|502|503|504)\b/.test(msg)) return true;
  if (/rate.limit|quota|timeout|econnreset|econnrefused|socket hang up|network/i.test(msg))
    return true;
  // 4xx client errors are not transient — bad input will also fail on fallback
  if (/\b(400|401|403|404|422)\b/.test(msg)) return false;
  // Default: treat unknown errors as transient to preserve existing behavior
  return true;
}

export interface GenerateWithFallbackResult {
  text: string;
  model: string;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  /** Which provider actually served the request */
  provider: 'gemini' | 'claude';
  /** Whether the primary provider failed and fallback was used */
  usedFallback: boolean;
}

export interface GenerateWithFallbackOptions {
  maxTokens?: number;
  temperature?: number;
}

/**
 * Generate text with optional multi-model fallback.
 *
 * - If `AI_FALLBACK_ENABLED` is `'true'`: tries Gemini first, falls back to
 *   Claude on any error.
 * - Otherwise: uses Gemini only (errors propagate to caller).
 */
export async function generateWithFallback(
  prompt: string,
  options?: GenerateWithFallbackOptions
): Promise<GenerateWithFallbackResult> {
  const fallbackEnabled = process.env.AI_FALLBACK_ENABLED === 'true';

  try {
    const result = await geminiGenerateText(prompt, {
      maxTokens: options?.maxTokens,
      temperature: options?.temperature,
    });

    log.info(`Request served by Gemini (${result.model}) in ${result.latencyMs}ms`);

    return {
      ...result,
      provider: 'gemini',
      usedFallback: false,
    };
  } catch (primaryError) {
    if (!fallbackEnabled) {
      throw primaryError;
    }

    const errorMessage =
      primaryError instanceof Error ? primaryError.message : String(primaryError);

    // Only fall back on transient/rate-limit errors, not on client errors (4xx)
    if (!isTransientError(primaryError)) {
      log.error(`Gemini failed with non-transient error, not falling back: ${errorMessage}`);
      throw primaryError;
    }

    log.warn(`Gemini failed with transient error (${errorMessage}), falling back to Claude`);

    try {
      const result = await claudeGenerateText(prompt, {
        maxTokens: options?.maxTokens,
        temperature: options?.temperature,
      });

      log.info(`Request served by Claude fallback (${result.model}) in ${result.latencyMs}ms`);

      return {
        ...result,
        provider: 'claude',
        usedFallback: true,
      };
    } catch (fallbackError) {
      const fallbackMessage =
        fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      log.error(`Both providers failed. Gemini: ${errorMessage}. Claude: ${fallbackMessage}`);

      // Re-throw the fallback error but include context about both failures
      throw new Error(
        `All AI providers failed. Gemini: ${errorMessage}. Claude: ${fallbackMessage}`
      );
    }
  }
}
