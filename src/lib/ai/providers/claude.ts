/**
 * Claude AI provider — wrapper around @anthropic-ai/sdk.
 *
 * Provides the same interface as gemini.ts so providers are interchangeable
 * via the model router.
 */
import Anthropic from '@anthropic-ai/sdk';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('ClaudeProvider');

export interface GenerateTextResult {
  text: string;
  model: string;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
}

export interface GenerateTextOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

/**
 * Generate text using Anthropic Claude.
 *
 * Requires the ANTHROPIC_API_KEY environment variable.
 */
export async function generateText(
  prompt: string,
  options?: GenerateTextOptions
): Promise<GenerateTextResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required for Claude provider');
  }

  const modelName = options?.model ?? DEFAULT_MODEL;
  const maxTokens = options?.maxTokens ?? 16384;

  const client = new Anthropic({ apiKey });

  const start = Date.now();
  const message = await client.messages.create({
    model: modelName,
    max_tokens: maxTokens,
    ...(options?.temperature !== undefined ? { temperature: options.temperature } : {}),
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });
  const latencyMs = Date.now() - start;

  // Extract text from content blocks
  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map(block => block.text)
    .join('');

  log.debug(`Claude response (${modelName}): ${text.length} chars in ${latencyMs}ms`);

  return {
    text,
    model: modelName,
    latencyMs,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  };
}
