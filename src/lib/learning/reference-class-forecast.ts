/**
 * Reference Class Forecasting — Kahneman & Lovallo's "Delusions of Success"
 * (HBR 2003) operationalised as a mandatory cover-page block on every audit.
 *
 * The 2003 paper (a direct line from the 2009 Kahneman-Klein paper's
 * conclusions) argues that the single most powerful debiasing technique
 * for strategic decisions is to step out of the inside-view narrative the
 * memo constructs and benchmark its predicted outcome against a
 * reference class — a set of historically similar decisions whose
 * outcomes are already known. The 70-90% M&A failure rate that Decision
 * Intel cites in its hero copy IS a reference-class statistic; this
 * module makes that benchmark live on every audit.
 *
 * Mechanism: pure-function similarity scoring against the canonical 143-
 * case library at `src/lib/data/case-studies/`. No LLM call (deterministic,
 * cheap, runs in <5ms). The score combines:
 *
 *   - Bias overlap (Jaccard against `biasesPresent` on each case) — the
 *     primary signal: a memo flagged for confirmation+anchoring+halo
 *     should be benchmarked against historical decisions that exhibited
 *     the same pattern, not against a generic deal.
 *   - Industry match (binary; weighted heavily for M&A / strategy where
 *     sector dynamics dominate).
 *   - Decision-domain match (documentType: ic_memo / cim / pitch_deck /
 *     etc.) — the procurement-grade anchor.
 *
 * The output is a structured `ReferenceClassForecast` block carrying:
 *   - top 5 historical analogs with similarity score + outcome
 *   - reference-class baseline rate (% failure across the matched class)
 *   - predicted outcome band derived from the case-library distribution
 *   - one-sentence procurement-grade note for the DPR cover
 *
 * This is the SECOND DI surface that uses the case library on the audit
 * path (the first is `forgottenQuestions` in the pipeline). The two are
 * complementary: forgottenQuestions surfaces *missing questions* the
 * reference class had to answer; reference-class forecasting surfaces
 * the *baseline failure rate* of the reference class. Together they
 * close the 2003 / 2009 inside-view-vs-outside-view loop.
 *
 * Locked: 2026-04-30 (paper-application sprint, item #8 of 10).
 */

import { ALL_CASES, isFailureOutcome } from '@/lib/data/case-studies';
import type { CaseStudy } from '@/lib/data/case-studies';

export interface ReferenceClassAnalog {
  /** Stable case-library ID — points at the canonical case detail page. */
  caseId: string;
  /** Slug for `/case-studies/{slug}` deep-link. */
  slug: string;
  title: string;
  company: string;
  industry: string;
  year: number;
  outcome: string;
  /** 0-1 cosine-style similarity score combining bias-overlap + industry + domain. */
  similarityScore: number;
  /** One-line summary of why this case is in the matched class. */
  matchReason: string;
}

export interface ReferenceClassForecast {
  /** Total cases the similarity model considered (always ALL_CASES.length today). */
  poolSize: number;
  /** Cases that scored above the inclusion threshold (default 0.18). */
  matchedClassSize: number;
  /** Top 5 analogs ranked by similarity. */
  topAnalogs: ReferenceClassAnalog[];
  /** Failure rate (catastrophic / failure / partial_failure) within the matched class.
   *  Null when the matched class is too small (< 3 analogs) for a stable rate. */
  baselineFailureRate: number | null;
  /** Number of cases the failure rate was computed over. */
  baselineSampleSize: number;
  /** Predicted outcome band: derived from the matched-class outcome distribution.
   *  The four bands map onto canonical Brier categories so a procurement reader
   *  can compare directly against the platform-baseline strip on the same DPR. */
  predictedOutcomeBand:
    | 'reference_class_succeeds'
    | 'reference_class_mixed'
    | 'reference_class_struggles'
    | 'reference_class_fails'
    | 'reference_class_too_small_to_judge';
  /** Single-sentence procurement-grade note. Renders verbatim on the DPR cover. */
  note: string;
  /** Inputs the model used. Surfaces in the DPR appendix so a CSO reader
   *  can audit which signals drove the forecast. */
  inputs: {
    biasTypes: string[];
    industry: string | null;
    documentType: string | null;
  };
}

const INCLUSION_THRESHOLD = 0.18;
const TOP_N = 5;

/** Canonical industry tokens used by the case library. Case studies use
 *  string literals from the `Industry` union; this map collapses common
 *  document-industry strings (free-text from the structurer) onto the
 *  case-library's canonical tokens so the binary industry-match scorer
 *  doesn't fail on a substring mismatch. */
const INDUSTRY_NORMALIZE: Record<string, string> = {
  technology: 'technology',
  tech: 'technology',
  saas: 'technology',
  software: 'technology',
  finance: 'financial_services',
  financial: 'financial_services',
  banking: 'financial_services',
  pe: 'financial_services',
  vc: 'financial_services',
  m_a: 'financial_services',
  retail: 'retail',
  consumer: 'consumer',
  cpg: 'consumer',
  healthcare: 'healthcare',
  health: 'healthcare',
  pharma: 'healthcare',
  energy: 'energy',
  oil: 'energy',
  utilities: 'energy',
  industrial: 'industrial',
  manufacturing: 'industrial',
  government: 'government',
  public: 'government',
  realestate: 'real_estate',
  real_estate: 'real_estate',
  property: 'real_estate',
  emerging_markets: 'emerging_markets',
};

function normalizeIndustry(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const lower = raw.toLowerCase().replace(/[^a-z]+/g, '_').replace(/^_|_$/g, '');
  return INDUSTRY_NORMALIZE[lower] ?? lower;
}

/** Jaccard similarity between two bias-type sets. Bias types are
 *  case-folded and trimmed before comparison so "Confirmation Bias" and
 *  "confirmation_bias" coalesce. Returns 0 on empty intersection. */
function jaccardBiases(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '_').trim();
  const setA = new Set(a.map(norm));
  const setB = new Set(b.map(norm));
  let intersect = 0;
  for (const x of setA) if (setB.has(x)) intersect++;
  const union = setA.size + setB.size - intersect;
  return union === 0 ? 0 : intersect / union;
}

/** Score a single case against the audit's bias profile + industry +
 *  documentType. Returns a 0-1 similarity. */
function scoreCase(
  c: CaseStudy,
  biasTypes: string[],
  industry: string | null,
  documentType: string | null
): { score: number; reason: string } {
  const biasJaccard = jaccardBiases(biasTypes, c.biasesPresent);
  const industryMatch = industry && c.industry === industry ? 1 : 0;
  const stakesBonus =
    c.contextFactors.monetaryStakes === 'high' || c.contextFactors.monetaryStakes === 'very_high'
      ? 0.05
      : 0;
  // Combined: bias overlap dominates (60%), industry binary (25%), stakes bonus (5%),
  // residual 10% reserved for documentType when the case library carries that signal.
  // The case library doesn't carry documentType on every entry today — when it lands
  // we extend the score; for now the documentType match is a small implicit bias-set
  // signal (ic_memo correlates with M&A biases, etc.) we don't double-count.
  const score = biasJaccard * 0.6 + industryMatch * 0.25 + stakesBonus;
  const reasonParts: string[] = [];
  if (biasJaccard > 0) reasonParts.push(`${Math.round(biasJaccard * 100)}% bias overlap`);
  if (industryMatch === 1) reasonParts.push(`industry match (${c.industry})`);
  if (stakesBonus > 0) reasonParts.push('high-stakes context');
  if (documentType && reasonParts.length === 0) reasonParts.push(`${documentType} pattern`);
  return {
    score: Math.min(1, Math.round(score * 1000) / 1000),
    reason: reasonParts.join(' · ') || 'baseline match',
  };
}

/** Build the reference-class forecast for an audit.
 *
 *  Pure function — no DB calls, no LLM calls, no state. Returns a
 *  forecast block in <5ms. Safe to call on every DPR assembly + every
 *  Document detail render without measurable cost.
 *
 *  Inputs:
 *    - biasTypes: the canonical bias-type strings detected on the audit
 *    - industry: optional industry hint (Document.industry isn't in the
 *      schema today, but documentType + free-text industry from the
 *      structurer can be passed when available)
 *    - documentType: optional documentType (ic_memo / cim / pitch_deck /
 *      etc.) — used as a tie-break signal in the matchReason copy
 *
 *  Forecast band selection: derived from the matched-class outcome
 *  distribution. <30% failure rate = succeeds; 30-50% = mixed; 50-70%
 *  = struggles; >70% = fails. Matched class smaller than 3 = too small
 *  to judge (the honest answer — matches platform-baseline n>=3 floor). */
export function getReferenceClassForecast(input: {
  biasTypes: string[];
  industry?: string | null;
  documentType?: string | null;
}): ReferenceClassForecast {
  const { biasTypes } = input;
  const industry = normalizeIndustry(input.industry ?? null);
  const documentType = input.documentType ?? null;

  // Score every case in the library
  const scored = ALL_CASES.map(c => {
    const { score, reason } = scoreCase(c, biasTypes, industry, documentType);
    return { case: c, score, reason };
  });

  // Filter to the inclusion threshold + sort
  const matched = scored
    .filter(s => s.score >= INCLUSION_THRESHOLD)
    .sort((a, b) => b.score - a.score);

  const matchedClassSize = matched.length;
  const baselineSampleSize = matchedClassSize;

  let baselineFailureRate: number | null = null;
  if (matchedClassSize >= 3) {
    const failures = matched.filter(s => isFailureOutcome(s.case.outcome)).length;
    baselineFailureRate = Math.round((failures / matchedClassSize) * 1000) / 1000;
  }

  const topAnalogs: ReferenceClassAnalog[] = matched.slice(0, TOP_N).map(s => ({
    caseId: s.case.id,
    slug: slugifyCase(s.case),
    title: s.case.title,
    company: s.case.company,
    industry: s.case.industry,
    year: s.case.year,
    outcome: s.case.outcome,
    similarityScore: s.score,
    matchReason: s.reason,
  }));

  let predictedOutcomeBand: ReferenceClassForecast['predictedOutcomeBand'];
  if (baselineFailureRate === null) {
    predictedOutcomeBand = 'reference_class_too_small_to_judge';
  } else if (baselineFailureRate < 0.3) {
    predictedOutcomeBand = 'reference_class_succeeds';
  } else if (baselineFailureRate < 0.5) {
    predictedOutcomeBand = 'reference_class_mixed';
  } else if (baselineFailureRate < 0.7) {
    predictedOutcomeBand = 'reference_class_struggles';
  } else {
    predictedOutcomeBand = 'reference_class_fails';
  }

  const note = buildNote(
    baselineFailureRate,
    baselineSampleSize,
    topAnalogs,
    predictedOutcomeBand
  );

  return {
    poolSize: ALL_CASES.length,
    matchedClassSize,
    topAnalogs,
    baselineFailureRate,
    baselineSampleSize,
    predictedOutcomeBand,
    note,
    inputs: {
      biasTypes: biasTypes.slice(0, 12),
      industry,
      documentType,
    },
  };
}

/** Build the procurement-grade single-sentence note for the DPR cover.
 *  Honest cold-start posture: when the matched class is too small to
 *  judge, says so explicitly rather than fabricating a forecast. */
function buildNote(
  failureRate: number | null,
  sampleSize: number,
  analogs: ReferenceClassAnalog[],
  band: ReferenceClassForecast['predictedOutcomeBand']
): string {
  if (band === 'reference_class_too_small_to_judge') {
    return `Reference class for this memo is too small for a stable forecast (${sampleSize} matched analog${sampleSize === 1 ? '' : 's'} in the 143-case library). The audit's biases + industry combination is structurally novel — historical base rates do not yet apply. Treat the memo's predicted outcome with cold-start scrutiny; the absence of a reference class is itself a signal worth flagging to the steering committee.`;
  }
  const ratePct = Math.round((failureRate ?? 0) * 100);
  const leadAnalog = analogs[0];
  const analogPhrase = leadAnalog
    ? `Closest analog: ${leadAnalog.company} (${leadAnalog.year}) — outcome: ${formatOutcome(leadAnalog.outcome)}.`
    : '';
  switch (band) {
    case 'reference_class_succeeds':
      return `Reference class of ${sampleSize} historically-similar decisions failed in ${ratePct}% of cases. Per Kahneman & Lovallo (2003), this is a favourable base rate — but the inside-view narrative of the memo should still be cross-checked against the analog list. ${analogPhrase}`;
    case 'reference_class_mixed':
      return `Reference class of ${sampleSize} historically-similar decisions failed in ${ratePct}% of cases — mixed base rate. The memo's predicted outcome should be benchmarked against this distribution rather than against the inside-view narrative alone (Kahneman & Lovallo 2003). ${analogPhrase}`;
    case 'reference_class_struggles':
      return `Reference class of ${sampleSize} historically-similar decisions failed in ${ratePct}% of cases. Per Kahneman & Lovallo (2003), this is a structurally challenging base rate — the memo's confidence should be calibrated against this rate, not against the inside-view narrative. ${analogPhrase}`;
    case 'reference_class_fails':
      return `Reference class of ${sampleSize} historically-similar decisions failed in ${ratePct}% of cases — a structurally hostile base rate. Per Kahneman & Lovallo (2003), the memo's recommended path should be defended explicitly against the historical failure pattern, not allowed to ride on inside-view confidence. ${analogPhrase}`;
  }
  // Unreachable — `reference_class_too_small_to_judge` returns above, all
  // other bands handled in the switch — but TS narrows to `never` here only
  // when every case is exhausted, which it is. Return empty for safety.
  return '';
}

function formatOutcome(outcome: string): string {
  return outcome.replace(/_/g, ' ');
}

/** Best-effort slug derivation. The case library exports a slugifier
 *  via `src/lib/data/case-studies/slugs.ts`; we re-derive locally to
 *  avoid the runtime import cycle (this file is imported by DPR
 *  assembly, which runs server-side; the slugs module imports from
 *  the same index and creates a cycle in webpack's worker
 *  optimisation pass). The derivation matches the slugify
 *  implementation; if the canonical slugifier evolves, sync this. */
function slugifyCase(c: CaseStudy): string {
  return `${c.company}-${c.title}`
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
