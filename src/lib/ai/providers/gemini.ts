/**
 * Gemini AI provider — standalone wrapper around @google/generative-ai.
 *
 * Extracts the call pattern from agents/nodes.ts into a reusable provider
 * function with a model-agnostic return type.
 */
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { getRequiredEnvVar, getOptionalEnvVar } from '@/lib/env';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('GeminiProvider');

// Module-level singleton to avoid recreating the SDK client on every call.
// Keyed by API key to handle key rotation or multi-tenant scenarios.
let _genAI: GoogleGenerativeAI | null = null;
let _genAIKey: string | null = null;
function getGenAI(apiKey: string): GoogleGenerativeAI {
  if (!_genAI || _genAIKey !== apiKey) {
    _genAI = new GoogleGenerativeAI(apiKey);
    _genAIKey = apiKey;
  }
  return _genAI;
}

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
  /**
   * Optional wall-clock timeout (ms) for the underlying generateContent call.
   * When set, the call is raced against a timer that rejects with a clear
   * 'Gemini generateText timed out' error. Default: undefined (no timeout —
   * preserves prior behaviour for every existing caller). NOTE: this is a
   * Promise.race — it unblocks the caller, it does NOT abort the in-flight
   * HTTP request (the legacy @google/generative-ai SDK does not surface an
   * AbortSignal on generateContent). The win is that a hung background call
   * can no longer block its awaiter indefinitely.
   */
  timeoutMs?: number;
}

/**
 * Generate text using Google Gemini.
 *
 * Safety settings default to BLOCK_NONE (relaxed) to match the analysis
 * pipeline — documents may contain sensitive language that must be processed.
 *
 * Default model `gemini-3-flash-preview` is the locked CLAUDE.md "Gemini model
 * policy" provider default for analytical / grounded / reasoning-heavy routes.
 * Lighter routes (content-gen, classification) explicitly pass
 * `model: 'gemini-3.1-flash-lite'` via options. The metaJudge final-verdict
 * node uses `gemini-2.5-pro` via getProStandardSafetyGroundedModel() in
 * lib/agents/nodes.ts — that's the only Pro-tier surface in the codebase.
 * Don't introduce another model name without updating CLAUDE.md model policy.
 */
export async function generateText(
  prompt: string,
  options?: GenerateTextOptions
): Promise<GenerateTextResult> {
  const modelName =
    options?.model ?? getOptionalEnvVar('GEMINI_MODEL_NAME', 'gemini-3-flash-preview');

  // GATEWAY-FIRST (locked 2026-07-02 — the Google-billing migration). Same
  // Gemini models via the Vercel AI Gateway; relaxed safety preserved via
  // providerOptions. PIPELINE_GATEWAY_GEMINI=off reverts to the legacy
  // direct SDK below. The timeoutMs contract is preserved with the same
  // Promise.race semantics.
  const { isGatewayGeminiEnabled, gatewayGeminiGenerate } = await import('@/lib/ai/gateway-gemini');
  if (isGatewayGeminiEnabled()) {
    const start = Date.now();
    const generate = gatewayGeminiGenerate(prompt, {
      model: modelName,
      temperature: options?.temperature,
      maxOutputTokens: options?.maxTokens ?? 16384,
      safetyLevel: 'relaxed',
    });
    const res = options?.timeoutMs
      ? await Promise.race([
          generate,
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error(`Gemini generateText timed out after ${options.timeoutMs}ms`)),
              options.timeoutMs
            )
          ),
        ])
      : await generate;
    const latencyMs = Date.now() - start;
    log.debug(`Gateway Gemini response (${res.model}): ${res.text.length} chars in ${latencyMs}ms`);
    return {
      text: res.text,
      model: res.model,
      latencyMs,
      inputTokens: res.inputTokens,
      outputTokens: res.outputTokens,
    };
  }

  const apiKey = getRequiredEnvVar('GOOGLE_API_KEY');

  const genAI = getGenAI(apiKey);

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ];

  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      maxOutputTokens: options?.maxTokens ?? 16384,
      ...(options?.temperature !== undefined ? { temperature: options.temperature } : {}),
    },
    safetySettings,
  });

  const start = Date.now();
  const generate = model.generateContent([prompt]);
  const result = options?.timeoutMs
    ? await Promise.race([
        generate,
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Gemini generateText timed out after ${options.timeoutMs}ms`)),
            options.timeoutMs
          )
        ),
      ])
    : await generate;
  const latencyMs = Date.now() - start;

  const response = result.response;
  const text = response.text();
  const usage = response.usageMetadata;

  log.debug(`Gemini response (${modelName}): ${text.length} chars in ${latencyMs}ms`);

  return {
    text,
    model: modelName,
    latencyMs,
    inputTokens: usage?.promptTokenCount,
    outputTokens: usage?.candidatesTokenCount,
  };
}
