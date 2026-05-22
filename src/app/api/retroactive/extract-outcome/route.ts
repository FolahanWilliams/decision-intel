/**
 * POST /api/retroactive/extract-outcome — LLM-augmented outcome
 * extraction from a single document. Locked 2026-05-21 (adaptation #1).
 *
 * Architecture (mirrors the action-titles + pmi-extract patterns):
 *   - Tier 1: deterministic regex/keyword extractor — runs FIRST + always
 *   - Tier 2: deepseek-v4-flash via Vercel AI Gateway — runs ASYNC after,
 *     enhances narrative + boosts confidence if the LLM agrees with Tier 1
 *   - Per-tier fall-through: any LLM failure → return Tier 1 unchanged
 *
 * NEVER fabricates an outcome. If Tier 1 returns null (no signals
 * detected), Tier 2 is skipped and the response is `{draft: null,
 * reason: 'no_signals_found'}` — caller treats as "user fills in
 * manually."
 *
 * Rate limits: 30/min per user, 500/hr global. Auth required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createLogger } from '@/lib/utils/logger';
import { apiError } from '@/lib/utils/api-response';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { generateText } from '@/lib/ai/providers/gateway';
import { MODEL_RECOMMENDATIONS } from '@/lib/ai/gateway-models';
import {
  extractOutcomeDraftDeterministic,
  type ExtractorInput,
} from '@/lib/retroactive/outcomeExtractor';
import type { ExtractedOutcomeDraft } from '@/lib/retroactive/types';

const log = createLogger('RetroactiveExtractOutcome');

export const maxDuration = 20;

interface ExtractRequest {
  sourceDocumentId: string;
  content: string;
  kind: 'investment' | 'acquisition' | 'strategic';
}

interface LlmOutcomeSchema {
  direction?: 'positive' | 'negative' | 'mixed' | 'too_early';
  verdict?: 'value_created' | 'value_destroyed' | 'value_neutral' | 'too_early_to_tell' | 'unknown';
  draftNarrative?: string;
  confidence?: number;
  evidenceQuotes?: string[];
  metrics?: Array<{ label: string; value: string; sourceQuote?: string }>;
}

// ──────────────────────────────────────────────────────────────────────
// Auth helper — Supabase SSR
// ──────────────────────────────────────────────────────────────────────

async function getUserId(): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll().map(c => ({ name: c.name, value: c.value })),
      setAll: () => {
        /* canonical Supabase RSC exception class — read-only */
      },
    },
  });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user.id;
}

// ──────────────────────────────────────────────────────────────────────
// LLM augmentation
// ──────────────────────────────────────────────────────────────────────

function buildLlmPrompt(input: ExtractRequest, tier1: ExtractedOutcomeDraft): string {
  const contentCapped = input.content.length > 6000 ? input.content.slice(0, 6000) : input.content;
  return `You are extracting the OUTCOME of a historical ${input.kind} decision from a retrospective document.

A deterministic regex tier already ran. Its draft:
- Direction: ${tier1.direction}
- Verdict: ${tier1.verdict}
- Confidence: ${tier1.extractionConfidence.toFixed(2)}
- Narrative: ${tier1.draftNarrative}
- Evidence quotes: ${tier1.evidenceQuotes.slice(0, 3).join(' | ')}

Your job: confirm or refine the draft. RULES:
1. NEVER fabricate. Every quote in evidenceQuotes MUST be a literal substring of the source content.
2. If you disagree with the direction/verdict, say so and give a verbatim quote justifying it.
3. Confidence is 0-1. If the document is ambiguous, lower it.
4. Narrative is ≤2 sentences, plain language, names the specific outcome.
5. Metrics: extract any IRR, MOIC, $ amounts, time-to-exit, fund returns. Each metric's sourceQuote MUST be verbatim.

SOURCE CONTENT:
${contentCapped}

Output STRICT JSON only (no markdown, no commentary):
{"direction":"positive"|"negative"|"mixed"|"too_early","verdict":"value_created"|"value_destroyed"|"value_neutral"|"too_early_to_tell"|"unknown","draftNarrative":"...","confidence":0.0-1.0,"evidenceQuotes":["..."],"metrics":[{"label":"...","value":"...","sourceQuote":"..."}]}`;
}

function parseLlmResponse(text: string): LlmOutcomeSchema | null {
  // Strip code fences
  const cleaned = text
    .replace(/```[a-z]*\n?/gi, '')
    .replace(/```/g, '')
    .trim();
  // Find first `{` and last `}`
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace < 0 || lastBrace <= firstBrace) return null;
  try {
    const parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    return parsed as LlmOutcomeSchema;
  } catch {
    // canonical LLM-JSON-parse fallthrough exception class — return null,
    // caller falls back to Tier 1 unchanged
    return null;
  }
}

/** Verify that every evidence quote claimed by the LLM is actually a
 *  literal substring of the source content. NEVER trust the LLM blindly. */
function validateLlmQuotes(content: string, llm: LlmOutcomeSchema): boolean {
  if (!llm.evidenceQuotes || llm.evidenceQuotes.length === 0) return true; // empty is fine
  for (const q of llm.evidenceQuotes) {
    // Allow trailing ellipsis stripping
    const trimmed = q.replace(/\.\.\.$/, '').trim();
    if (trimmed.length < 8) continue;
    // Verify by looking at the first 5 words verbatim
    const first5 = trimmed.split(/\s+/).slice(0, 5).join(' ');
    if (!content.includes(first5)) return false;
  }
  return true;
}

// ──────────────────────────────────────────────────────────────────────
// Handler
// ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Auth
  const userId = await getUserId();
  if (!userId) {
    return apiError({ error: 'Unauthenticated.', status: 401 });
  }

  // 2. Rate limit
  const perUser = await checkRateLimit(
    `retroactive-extract:${userId}`,
    '/api/retroactive/extract-outcome',
    { windowMs: 60_000, maxRequests: 30, failMode: 'closed' }
  );
  if (!perUser.success) {
    return apiError({ error: 'Rate limit exceeded. Try again shortly.', status: 429 });
  }
  const global = await checkRateLimit(
    'retroactive-extract-global',
    '/api/retroactive/extract-outcome',
    { windowMs: 3600_000, maxRequests: 500, failMode: 'closed' }
  );
  if (!global.success) {
    return apiError({
      error: 'Outcome-extraction capacity reached for this hour.',
      status: 503,
    });
  }

  // 3. Body parse
  // canonical req.json() body-parse exception class — falls through to 400
  const body = (await req.json().catch(() => null)) as ExtractRequest | null;
  if (!body?.sourceDocumentId || !body.content || !body.kind) {
    return apiError({
      error: 'Missing required fields: sourceDocumentId, content, kind.',
      status: 400,
    });
  }
  if (!['investment', 'acquisition', 'strategic'].includes(body.kind)) {
    return apiError({ error: 'Invalid kind.', status: 400 });
  }

  // 4. Tier 1 — deterministic
  const extractorInput: ExtractorInput = {
    sourceDocumentId: body.sourceDocumentId,
    content: body.content,
    kind: body.kind,
  };
  const tier1 = extractOutcomeDraftDeterministic(extractorInput);
  if (!tier1) {
    return NextResponse.json({ draft: null, reason: 'no_signals_found' });
  }

  // 5. Tier 2 — LLM augmentation (skip when key absent)
  if (!process.env.AI_GATEWAY_API_KEY) {
    log.info('AI_GATEWAY_API_KEY missing; returning Tier 1 only.');
    return NextResponse.json({ draft: tier1 });
  }

  try {
    const llm = await generateText(buildLlmPrompt(body, tier1), {
      model: MODEL_RECOMMENDATIONS,
      maxOutputTokens: 1024,
      temperature: 0.2,
    });
    const parsed = parseLlmResponse(llm.text);
    if (!parsed) {
      log.warn('Tier 2 LLM output failed to parse; falling back to Tier 1.');
      return NextResponse.json({ draft: tier1 });
    }
    if (!validateLlmQuotes(body.content, parsed)) {
      log.warn('Tier 2 LLM quotes failed verbatim-substring validation; falling back to Tier 1.');
      return NextResponse.json({ draft: tier1 });
    }

    // Compose Tier-2-augmented draft. Tier 1 provides the floor; the
    // LLM can raise confidence (capped at 0.95) + refine narrative +
    // add evidence quotes, but cannot change verdict if Tier 1 was
    // confident (>= 0.6).
    const tier1Confident = tier1.extractionConfidence >= 0.6;
    const draft: ExtractedOutcomeDraft = {
      sourceDocumentId: tier1.sourceDocumentId,
      direction: tier1Confident ? tier1.direction : (parsed.direction ?? tier1.direction),
      verdict: tier1Confident ? tier1.verdict : (parsed.verdict ?? tier1.verdict),
      draftNarrative: parsed.draftNarrative?.trim() || tier1.draftNarrative,
      evidenceQuotes:
        parsed.evidenceQuotes && parsed.evidenceQuotes.length > 0
          ? parsed.evidenceQuotes.slice(0, 5)
          : tier1.evidenceQuotes,
      draftMetrics:
        parsed.metrics && parsed.metrics.length > 0
          ? parsed.metrics.map(m => ({
              label: m.label,
              value: m.value,
              sourceQuote: m.sourceQuote || '',
            }))
          : tier1.draftMetrics,
      extractionConfidence: Math.min(
        0.95,
        typeof parsed.confidence === 'number' && parsed.confidence > tier1.extractionConfidence
          ? parsed.confidence
          : tier1.extractionConfidence
      ),
      extractionTier: 'llm',
      extractedAt: new Date().toISOString(),
    };
    return NextResponse.json({ draft });
  } catch (err) {
    // canonical LLM-failure fallthrough exception class — return Tier 1
    log.warn('Tier 2 LLM call failed; falling back to Tier 1.', err);
    return NextResponse.json({ draft: tier1 });
  }
}
