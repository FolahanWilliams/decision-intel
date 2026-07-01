/**
 * Live Market-Context Enricher — locked 2026-07-01.
 *
 * The intelligence layer is DB-first (the RSS NewsArticle table), so a cold
 * audit of a specific company finds nothing — newsCount 0, a grey tile, and the
 * pipeline misses the current market context a strategic decision has to defend
 * against. This closes that: given the company the document is about, it runs a
 * LIVE Gemini-grounded (googleSearch) search for the CURRENT, CITED developments
 * around that company + decision and returns a structured snapshot. It reuses
 * the exact grounded-search-for-structured-data pattern getIndustryBenchmarks
 * already ships (macroContext.ts) — a 6th non-fatal source in assembleContext's
 * parallel fan-out.
 *
 * Honest by construction: the prompt demands search-verifiable developments only
 * and an EMPTY signals array when nothing current is found — never fabricate.
 * The pure `parseMarketSnapshot` drops any signal without a source, and the
 * whole call is non-fatal + null-safe (no company / any error / timeout → null,
 * so the audit is byte-identical to today for a company-less document).
 */

import { createLogger } from '@/lib/utils/logger';
import { withTimeout } from '@/lib/utils/resilience';

const log = createLogger('MarketContextEnricher');

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MarketSignal {
  /** One-line development ("Announced $X acquisition of Y", "CFO departed"). */
  headline: string;
  /** A sentence of context on why it matters to the decision. */
  detail: string;
  /** Where it was found — required; a signal with no source is dropped. */
  source: string;
  /** When the event happened, when the model could date it. */
  date?: string;
}

export interface MarketSnapshot {
  company: string;
  /** 1-3 sentence current market position relevant to the decision. */
  summary: string;
  /** Recent, cited developments (may be empty — that is an honest result). */
  signals: MarketSignal[];
  /** When this snapshot was assembled. */
  asOf: string;
}

export interface MarketContextRequest {
  /** The company the document's decision is about. */
  company: string;
  /** Sector, when known — sharpens the search. */
  industry?: string;
  /** A short description of the strategic decision (topics work as a proxy). */
  decisionSummary?: string;
}

const MAX_SIGNALS = 6;
const ENRICH_TIMEOUT_MS = 15_000;

// ─── Pure parse (deterministic, testable) ────────────────────────────────────

/**
 * Parse the grounded model's raw text into a MarketSnapshot. Tolerant of
 * ```json fences; returns null on any structural failure. Drops signals with no
 * source (the anti-fabrication guard — an uncited "development" is noise). A
 * snapshot with a real summary but zero signals is VALID (nothing current found).
 */
export function parseMarketSnapshot(raw: string, company: string): MarketSnapshot | null {
  if (!raw || !company.trim()) return null;
  let obj: unknown;
  try {
    obj = JSON.parse(
      raw
        .replace(/```json\n?/g, '')
        .replace(/```/g, '')
        .trim()
    );
  } catch {
    return null;
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
  const rec = obj as Record<string, unknown>;

  const summary = typeof rec.summary === 'string' ? rec.summary.trim() : '';
  const rawSignals = Array.isArray(rec.signals) ? rec.signals : [];
  const signals: MarketSignal[] = rawSignals
    .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object' && !Array.isArray(s))
    .map(s => ({
      headline: typeof s.headline === 'string' ? s.headline.trim() : '',
      detail: typeof s.detail === 'string' ? s.detail.trim() : '',
      source: typeof s.source === 'string' ? s.source.trim() : '',
      date: typeof s.date === 'string' && s.date.trim() ? s.date.trim() : undefined,
    }))
    // Anti-fabrication: a signal must name a source AND a headline.
    .filter(s => s.headline.length > 0 && s.source.length > 0)
    .slice(0, MAX_SIGNALS);

  // Nothing usable at all → null (renders as no market context, not an empty box).
  if (!summary && signals.length === 0) return null;

  return {
    company: company.trim(),
    summary,
    signals,
    asOf: new Date().toISOString(),
  };
}

// ─── I/O (non-fatal, null-safe) ──────────────────────────────────────────────

function buildPrompt(req: MarketContextRequest): string {
  const industryLine = req.industry ? `Sector: ${req.industry}.` : '';
  const decisionLine = req.decisionSummary
    ? `The decision under review concerns: ${req.decisionSummary}.`
    : '';
  return `You are gathering CURRENT market context on "${req.company}" for a strategic-decision audit.
${industryLine}
${decisionLine}

Use Google Search to find RECENT, VERIFIABLE developments about ${req.company} that a decision-maker committing capital right now would have to account for: acquisitions / divestitures, funding or raises, leadership changes, regulatory actions, litigation, earnings surprises, major competitive or market-position moves, and analyst / activist commentary.

Return a JSON object:
{
  "summary": "1-3 sentences on ${req.company}'s current market position relevant to the decision",
  "signals": [
    { "headline": "one-line development", "detail": "why it matters to this decision", "source": "publication / outlet you found it in", "date": "when it happened, if known" }
  ]
}

Rules: include ONLY developments you can verify via search. Every signal MUST cite a source. If you find nothing current and relevant, return an empty "signals" array — do NOT invent developments. Do not editorialize about the company's reasoning; report the facts.`;
}

/**
 * Run the live grounded market-context search. Returns null on no-company / any
 * error / timeout — the caller treats null as "no market context", so a failure
 * never changes the audit vs. today. Non-fatal by contract.
 */
export async function enrichMarketContext(
  req: MarketContextRequest
): Promise<MarketSnapshot | null> {
  const company = req.company?.trim();
  if (!company) return null;

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const { getRequiredEnvVar } = await import('@/lib/env');
    const genAI = new GoogleGenerativeAI(getRequiredEnvVar('GOOGLE_API_KEY'));

    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL_NAME || 'gemini-3-flash-preview',
      tools: [{ googleSearch: {} } as Record<string, unknown>],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
    });

    const result = await withTimeout(
      () => model.generateContent(buildPrompt({ ...req, company })),
      ENRICH_TIMEOUT_MS,
      'Market context search timeout'
    );

    const text = result.response?.text?.() || '';
    const snapshot = parseMarketSnapshot(text, company);
    if (snapshot) {
      log.info(`Market context for "${company}": ${snapshot.signals.length} signal(s)`);
    }
    return snapshot;
  } catch (err) {
    log.warn('Market context enrichment failed:', err instanceof Error ? err.message : String(err));
    return null;
  }
}
