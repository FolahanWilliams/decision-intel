/**
 * Shared Quick Score Utility
 *
 * Lightweight bias-only scan using Gemini. Returns a score, grade,
 * and top biases in <5 seconds. Used by both the extension API
 * and the main platform quick-score endpoint.
 */

import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  type GenerativeModel,
} from '@google/generative-ai';
import { getRequiredEnvVar, getOptionalEnvVar } from '@/lib/env';
import { createLogger } from '@/lib/utils/logger';
import { parseJSON } from '@/lib/utils/json';

const log = createLogger('QuickScore');

// ─── Types ──────────────────────────────────────────────────────────────────

export interface QuickScoreBias {
  type: string;
  severity: string;
  excerpt: string;
}

export interface QuickScoreResult {
  score: number;
  grade: string;
  biases: QuickScoreBias[];
  processedAt: string;
}

// ─── AI Model (singleton) ───────────────────────────────────────────────────

let modelInstance: GenerativeModel | null = null;

function getModel(): GenerativeModel {
  if (!modelInstance) {
    const apiKey = getRequiredEnvVar('GOOGLE_API_KEY');
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = getOptionalEnvVar('GEMINI_MODEL_NAME', 'gemini-3-flash-preview');

    modelInstance = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: 4096,
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    });
  }
  return modelInstance;
}

// ─── Prompt ─────────────────────────────────────────────────────────────────

const QUICK_SCORE_PROMPT = `You are a cognitive bias analyst. Analyze the following content for cognitive biases.

Return a JSON object with exactly this shape:
{
  "score": <number 0-100, where 100 = no biases detected>,
  "grade": "<A|B|C|D|F>",
  "biases": [
    {
      "type": "<bias name, e.g. Confirmation Bias>",
      "severity": "<low|medium|high>",
      "excerpt": "<short quote from the text demonstrating this bias>"
    }
  ]
}

Rules:
- Score 90-100 = A, 70-89 = B, 50-69 = C, 30-49 = D, 0-29 = F
- Return at most 5 biases, ordered by severity (high first)
- Keep excerpts under 120 characters
- If no biases are found, return score 95, grade A, and an empty biases array
- Respond ONLY with valid JSON, no markdown or explanation`;

// ─── Helpers ────────────────────────────────────────────────────────────────

export function scoreToGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 70) return 'B';
  if (score >= 50) return 'C';
  if (score >= 30) return 'D';
  return 'F';
}

function normalizeSeverity(severity: string): string {
  const s = severity.toLowerCase();
  if (s === 'high' || s === 'medium' || s === 'low') return s;
  return 'medium';
}

// ─── Core Function ──────────────────────────────────────────────────────────

/**
 * Run a quick bias-only scan on content.
 * Returns score, grade, and top 5 biases in <5 seconds.
 */
export async function runQuickScore(
  content: string,
  options?: { title?: string; url?: string }
): Promise<QuickScoreResult> {
  const contextParts: string[] = [];
  if (options?.title) contextParts.push(`Title: ${options.title}`);
  if (options?.url) contextParts.push(`Source URL: ${options.url}`);
  const contextHeader = contextParts.length > 0 ? contextParts.join('\n') + '\n\n' : '';

  // Truncate for speed
  const truncatedContent = content.slice(0, 15_000);
  const fullPrompt = `${QUICK_SCORE_PROMPT}\n\n${contextHeader}Content:\n${truncatedContent}`;

  const model = getModel();

  const resultPromise = model.generateContent(fullPrompt);
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Analysis timed out')), 12_000)
  );

  const result = await Promise.race([resultPromise, timeoutPromise]);
  const responseText = result.response.text();

  const parsed = parseJSON(responseText);

  if (!parsed || typeof parsed.score !== 'number') {
    log.error('Failed to parse Gemini response:', responseText.slice(0, 500));
    throw new Error('Failed to parse analysis result');
  }

  const score = Math.max(0, Math.min(100, Math.round(parsed.score)));
  const grade = typeof parsed.grade === 'string' ? parsed.grade.toUpperCase() : scoreToGrade(score);
  const biases = Array.isArray(parsed.biases)
    ? parsed.biases.slice(0, 5).map((b: Record<string, unknown>) => ({
        type: String(b.type || 'Unknown Bias'),
        severity: normalizeSeverity(String(b.severity || 'medium')),
        excerpt: String(b.excerpt || '').slice(0, 120),
      }))
    : [];

  return {
    score,
    grade,
    biases,
    processedAt: new Date().toISOString(),
  };
}
