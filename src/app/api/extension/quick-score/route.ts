/**
 * POST /api/extension/quick-score
 *
 * Lightweight bias-only scan for the browser extension popup.
 * Returns a quick score, grade, and list of detected biases.
 *
 * Auth: Extension API key via x-extension-key header.
 * Rate limit: 30 requests/hour per user.
 * Timeout: 15 seconds max.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  type GenerativeModel,
} from '@google/generative-ai';
import { authenticateApiRequest } from '@/lib/utils/api-auth';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { getRequiredEnvVar, getOptionalEnvVar } from '@/lib/env';
import { createLogger } from '@/lib/utils/logger';
import { parseJSON } from '@/lib/utils/json';

const log = createLogger('ExtensionQuickScore');

// Cap serverless function duration
export const maxDuration = 15;

// ─── AI Model ────────────────────────────────────────────────────────────────

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

// ─── Prompt ──────────────────────────────────────────────────────────────────

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

// ─── Route Handler ───────────────────────────────────────────────────────────

const MAX_CONTENT_LENGTH = 50_000;

export async function POST(request: NextRequest) {
  try {
    // ── Auth ────────────────────────────────────────────────────────────
    const authResult = await authenticateApiRequest(request);
    if (authResult.error || !authResult.userId) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: authResult.status || 401 }
      );
    }
    const userId = authResult.userId;

    // ── Rate limit: 30 req/hour ─────────────────────────────────────────
    const rateLimitResult = await checkRateLimit(userId, '/api/extension/quick-score', {
      windowMs: 60 * 60 * 1000,
      maxRequests: 30,
      failMode: 'closed',
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Maximum 30 quick scans per hour.',
          limit: rateLimitResult.limit,
          remaining: 0,
          reset: rateLimitResult.reset,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.reset - Math.floor(Date.now() / 1000)),
          },
        }
      );
    }

    // ── Parse body ──────────────────────────────────────────────────────
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid or missing request body' }, { status: 400 });
    }

    const { content, url, title } = body as {
      content?: string;
      url?: string;
      title?: string;
    };

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'content is required and must be a non-empty string' }, { status: 400 });
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: `content must be at most ${MAX_CONTENT_LENGTH} characters` },
        { status: 400 }
      );
    }

    // ── Build prompt with context ───────────────────────────────────────
    const contextParts: string[] = [];
    if (title) contextParts.push(`Title: ${title}`);
    if (url) contextParts.push(`Source URL: ${url}`);
    const contextHeader = contextParts.length > 0 ? contextParts.join('\n') + '\n\n' : '';

    // Truncate content for the quick scan to keep it fast
    const truncatedContent = content.slice(0, 15_000);
    const fullPrompt = `${QUICK_SCORE_PROMPT}\n\n${contextHeader}Content:\n${truncatedContent}`;

    // ── Call Gemini with a 12s timeout (leaving headroom for the 15s max) ─
    const model = getModel();

    const resultPromise = model.generateContent(fullPrompt);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Analysis timed out')), 12_000)
    );

    const result = await Promise.race([resultPromise, timeoutPromise]);
    const responseText = result.response.text();

    // ── Parse AI response ───────────────────────────────────────────────
    const parsed = parseJSON(responseText);

    if (!parsed || typeof parsed.score !== 'number') {
      log.error('Failed to parse Gemini response:', responseText.slice(0, 500));
      return NextResponse.json({ error: 'Failed to parse analysis result' }, { status: 502 });
    }

    // Normalize and validate the response
    const score = Math.max(0, Math.min(100, Math.round(parsed.score)));
    const grade = typeof parsed.grade === 'string' ? parsed.grade.toUpperCase() : scoreToGrade(score);
    const biases = Array.isArray(parsed.biases)
      ? parsed.biases.slice(0, 5).map((b: Record<string, unknown>) => ({
          type: String(b.type || 'Unknown Bias'),
          severity: normalizeSeverity(String(b.severity || 'medium')),
          excerpt: String(b.excerpt || '').slice(0, 120),
        }))
      : [];

    return NextResponse.json(
      {
        score,
        grade,
        biases,
        processedAt: new Date().toISOString(),
      },
      {
        headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error('Quick score error:', error);

    if (message.includes('timed out')) {
      return NextResponse.json({ error: 'Analysis timed out. Try with shorter content.' }, { status: 504 });
    }

    return NextResponse.json({ error: 'Quick score analysis failed' }, { status: 500 });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scoreToGrade(score: number): string {
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
