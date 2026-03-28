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
  options?: GenerateWithFallbackOptions,
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
    log.warn(`Gemini failed (${errorMessage}), falling back to Claude`);

    try {
      const result = await claudeGenerateText(prompt, {
        maxTokens: options?.maxTokens,
        temperature: options?.temperature,
      });

      log.info(
        `Request served by Claude fallback (${result.model}) in ${result.latencyMs}ms`,
      );

      return {
        ...result,
        provider: 'claude',
        usedFallback: true,
      };
    } catch (fallbackError) {
      const fallbackMessage =
        fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      log.error(
        `Both providers failed. Gemini: ${errorMessage}. Claude: ${fallbackMessage}`,
      );

      // Re-throw the fallback error but include context about both failures
      throw new Error(
        `All AI providers failed. Gemini: ${errorMessage}. Claude: ${fallbackMessage}`,
      );
    }
  }
}
