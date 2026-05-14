/**
 * PMI signal auto-extraction from IC-memo / synergy-model / integration-plan
 * content.
 *
 * Locked 2026-05-13 (M-3 ship). Closes the friction-collapse gap on the
 * post-close audit loop per CLAUDE.md Tier 2.2 deferred follow-up
 * ("IC-memo PMI signal auto-extraction via deepseek-v4-flash (currently
 * the user types signals in by hand; LLM extraction would pre-populate
 * from IC memo content)").
 *
 * Architecture rule: this is an ASSIST layer. The PmiTrackerTab manual
 * entry path stays canonical; the extraction is a UX accelerator that
 * surfaces *suggestions*, which the user accepts / edits / rejects.
 * Outputs NEVER persist directly — every accepted signal still goes
 * through POST /api/decisions/[id]/pmi-signals so the audit log + ID
 * + idempotency guarantees stay intact.
 *
 * Failure mode is fail-soft: on gateway error / timeout / parse failure
 * the function returns an empty `signals: []` array and the UI degrades
 * gracefully to the manual-entry flow (CLAUDE.md "fire-and-forget
 * exceptions need comments" — every silent fallback is annotated).
 *
 * Cost ceiling: deepseek-v4-flash ~$0.0002 per extraction. Typical IC
 * memo content is 3K-8K chars truncated to 6K. 1 call per click;
 * 30-second cache on the response keyed off documentId so repeated
 * "Extract" clicks within a session don't re-bill.
 */

import { generateText } from '@/lib/ai/providers/gateway';
import { MODEL_RECOMMENDATIONS } from '@/lib/ai/gateway-models';
import { trackApiUsage } from '@/lib/utils/cost-tracker';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('PmiExtraction');

// Canonical PMI signal keys — mirror src/app/api/decisions/[id]/pmi-signals/route.ts
// PMI_SIGNAL_KEYS. Keep in lockstep; the canonical-import rule applies if a
// future ship moves these to a shared module.
export const PMI_SIGNAL_KEYS = [
  'synergy_realisation_pct',
  'talent_retention_pct',
  'integration_cost_vs_forecast',
  'day_one_milestone_hit_rate',
  'customer_retention_pct',
  'revenue_growth_vs_forecast',
] as const;

export type PmiSignalKey = (typeof PMI_SIGNAL_KEYS)[number];

const VALID_HORIZONS = [90, 180, 365] as const;
export type PmiHorizon = (typeof VALID_HORIZONS)[number];

/**
 * A single extraction suggestion. Mirrors the shape POST /pmi-signals
 * expects, plus a `quote` field carrying the verbatim memo passage that
 * supports the extracted claim. The quote is the procurement-grade
 * evidence anchor — if the user rejects a suggestion, the quote
 * explains why; if they accept it, the quote can be persisted to the
 * `proxy` field as the IC-memo claim string.
 */
export interface ExtractedPmiSignal {
  key: PmiSignalKey;
  /** The verbatim memo passage supporting this extraction (≤300 chars). */
  quote: string;
  /** Plain-language proxy description (the IC memo's claim, paraphrased). */
  proxy: string;
  /** Tracking horizon — derived from memo or default 180. */
  horizonDays: PmiHorizon;
  /**
   * Predicted confidence (0-1). For percent metrics, this is the
   * predicted percent value divided by 100. For ratio metrics
   * (integration_cost_vs_forecast, revenue_growth_vs_forecast), this
   * is the confidence-of-hit on a 0-1 scale, NOT the ratio itself.
   */
  predictedConfidence: number;
  /** Why the extractor inferred this signal (provenance for trust). */
  rationale: string;
}

export interface ExtractionResult {
  signals: ExtractedPmiSignal[];
  /** True when the LLM call succeeded; false on fallback. */
  llmSucceeded: boolean;
  /** Truncated content length (chars passed to the LLM). */
  contentChars: number;
}

const MAX_CONTENT_CHARS = 6000;
const GATEWAY_TIMEOUT_MS = 12_000;

const SYSTEM_PROMPT = `You are the post-close audit-loop extractor for Decision Intel — a procurement-grade decision-quality platform that audits the reasoning behind high-stakes corporate-development and M&A decisions.

Your job: read an IC memo (or synergy model / integration plan) for an acquisition decision and extract Post-Merger Integration (PMI) signals the buyer COMMITTED TO in writing. These signals will be tracked against actuals after the deal closes to compute per-signal Brier scores.

Extract at most 6 signals from this canonical key set:
- synergy_realisation_pct — % of projected synergies achieved at horizon
- talent_retention_pct — % of identified key talent retained at horizon
- integration_cost_vs_forecast — actual integration cost ÷ forecast (1.0 = on plan)
- day_one_milestone_hit_rate — % of day-1 integration milestones hit by 90d
- customer_retention_pct — % of acquired customer base retained at horizon
- revenue_growth_vs_forecast — actual revenue growth ÷ forecast (1.0 = on plan)

For each signal, extract:
- key (one of the 6 above)
- quote (verbatim memo passage, ≤300 chars, supporting the extraction)
- proxy (plain-language paraphrase of the IC-memo claim)
- horizonDays (90, 180, or 365 — read from memo wording; default 180 if unclear)
- predictedConfidence (0-1; for percent metrics divide the claimed % by 100;
  for ratio metrics use confidence-of-hitting-the-claim, NOT the ratio itself)
- rationale (one short sentence: WHY this signal was extracted)

Discipline:
- ONLY extract a signal when the memo makes a CONCRETE COMMITMENT (specific %, dollar figure, milestone). Aspirational language ("we hope to retain key talent") is NOT a commitment.
- NEVER fabricate a quote. The quote field must be a literal substring of the memo.
- NEVER infer signals not directly supported. Empty array is the correct output for a memo that has no committed PMI metrics.
- Do not extract more than ONE signal per key (latest commitment wins).

Output format: strict JSON. No prose outside the JSON.
{"signals": [{"key":"...","quote":"...","proxy":"...","horizonDays":180,"predictedConfidence":0.7,"rationale":"..."}]}

If the document is not an IC memo / synergy model / integration plan, or if no committed PMI metrics are present, return: {"signals": []}`;

function isPmiSignalKey(value: unknown): value is PmiSignalKey {
  return typeof value === 'string' && (PMI_SIGNAL_KEYS as readonly string[]).includes(value);
}

function isPmiHorizon(value: unknown): value is PmiHorizon {
  return typeof value === 'number' && (VALID_HORIZONS as readonly number[]).includes(value);
}

function clamp01(n: unknown): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) return 0.5;
  return Math.max(0, Math.min(1, n));
}

function safeString(v: unknown, maxLen: number): string {
  if (typeof v !== 'string') return '';
  return v.slice(0, maxLen).trim();
}

/**
 * Parse the LLM's JSON response into a validated ExtractedPmiSignal[].
 * Defensive: any cell that fails validation is dropped silently; the
 * function returns only the cells that pass. Empty array is a valid
 * outcome (memo had no committed PMI metrics).
 */
export function parseExtractionResponse(rawText: string): ExtractedPmiSignal[] {
  // Strip markdown code-fence noise the LLM occasionally adds.
  const trimmed = rawText.trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    // canonical body-parse exception class — LLM output malformed,
    // fall through to empty array (UI degrades to manual entry).
    return [];
  }
  if (!parsed || typeof parsed !== 'object') return [];
  const signalsRaw = (parsed as { signals?: unknown }).signals;
  if (!Array.isArray(signalsRaw)) return [];

  const seenKeys = new Set<PmiSignalKey>();
  const result: ExtractedPmiSignal[] = [];
  for (const item of signalsRaw) {
    if (!item || typeof item !== 'object') continue;
    const candidate = item as Record<string, unknown>;
    if (!isPmiSignalKey(candidate.key)) continue;
    if (seenKeys.has(candidate.key)) continue;
    const horizon = isPmiHorizon(candidate.horizonDays)
      ? candidate.horizonDays
      : (180 satisfies PmiHorizon);
    const quote = safeString(candidate.quote, 300);
    const proxy = safeString(candidate.proxy, 400);
    if (!quote || !proxy) continue;
    seenKeys.add(candidate.key);
    result.push({
      key: candidate.key,
      quote,
      proxy,
      horizonDays: horizon,
      predictedConfidence: clamp01(candidate.predictedConfidence),
      rationale: safeString(candidate.rationale, 300),
    });
  }
  return result;
}

export interface ExtractInput {
  /** Raw document content (post-decryption). */
  content: string;
  /** Document type hint (helps the LLM know what kind of artifact this is). */
  documentType?: string | null;
  /** Container name for telemetry (optional). */
  containerName?: string;
}

/**
 * Extract PMI signals from memo content via the AI Gateway.
 *
 * Returns an ExtractionResult with `llmSucceeded: false` and empty
 * signals array on any failure path. The PmiTrackerTab manual-entry
 * flow remains the canonical capture path; this layer is OPTIONAL.
 */
export async function extractPmiSignalsFromMemo(input: ExtractInput): Promise<ExtractionResult> {
  const content = (input.content ?? '').slice(0, MAX_CONTENT_CHARS);
  if (content.length < 200) {
    // Too short to contain a meaningful PMI commitment. Fail-soft.
    return { signals: [], llmSucceeded: false, contentChars: content.length };
  }

  const userPrompt = `Document type: ${input.documentType ?? 'unknown'}
${input.containerName ? `Container: ${input.containerName}\n` : ''}
Memo content (truncated to ${MAX_CONTENT_CHARS} chars):
---
${content}
---

Extract the committed PMI signals as strict JSON per the schema in the system prompt.`;

  try {
    // The gateway's generateText doesn't expose AbortSignal directly;
    // wrap with Promise.race for a hard timeout ceiling per
    // GATEWAY_TIMEOUT_MS so a stalled gateway call doesn't keep the
    // user staring at a spinner.
    const response = await Promise.race([
      generateText(userPrompt, {
        model: MODEL_RECOMMENDATIONS,
        system: SYSTEM_PROMPT,
        temperature: 0.2,
        maxOutputTokens: 1200,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('pmi-extraction timeout')), GATEWAY_TIMEOUT_MS)
      ),
    ]);

    // Track usage — Vercel dashboard captures the cost, but local
    // visibility on this call surfaces it in the founder hub usage log.
    trackApiUsage({
      provider: 'gateway',
      operation: 'pmi-extraction',
      tokens: (response.inputTokens ?? 0) + (response.outputTokens ?? 0),
      metadata: {
        model: MODEL_RECOMMENDATIONS,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
      },
    });

    const signals = parseExtractionResponse(response.text);
    return { signals, llmSucceeded: true, contentChars: content.length };
  } catch (err) {
    // canonical fire-and-forget exception — extraction is OPTIONAL,
    // manual entry remains the canonical path. Log for telemetry but
    // never surface as a hard error to the user.
    log.warn('pmi extraction failed; falling back to manual entry', { err });
    return { signals: [], llmSucceeded: false, contentChars: content.length };
  }
}
