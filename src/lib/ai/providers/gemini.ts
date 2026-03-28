/**
 * Gemini AI provider — standalone wrapper around @google/generative-ai.
 *
 * Extracts the call pattern from agents/nodes.ts into a reusable provider
 * function with a model-agnostic return type.
 */
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';
import { getRequiredEnvVar, getOptionalEnvVar } from '@/lib/env';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('GeminiProvider');

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

/**
 * Generate text using Google Gemini.
 *
 * Safety settings default to BLOCK_NONE (relaxed) to match the analysis
 * pipeline — documents may contain sensitive language that must be processed.
 */
export async function generateText(
  prompt: string,
  options?: GenerateTextOptions,
): Promise<GenerateTextResult> {
  const apiKey = getRequiredEnvVar('GOOGLE_API_KEY');
  const modelName =
    options?.model ?? getOptionalEnvVar('GEMINI_MODEL_NAME', 'gemini-2.0-flash');

  const genAI = new GoogleGenerativeAI(apiKey);

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
  const result = await model.generateContent([prompt]);
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
