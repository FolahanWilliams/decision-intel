/**
 * AuditDeliverable — the universal MECE-structured presentation model
 * locked 2026-05-20 from the Deep Research synthesis.
 *
 * The same underlying `AnalysisResult` (12-node pipeline output) is
 * composed into FIVE Mutually Exclusive Collectively Exhaustive buckets,
 * each carrying an action title (the Pyramid Principle's horizontal
 * logic) and the typed evidence the UI renders. The same shape powers:
 *
 *   1. /demo — Conversion Surface (constrained, single CTA)
 *   2. /documents/[id] — Executive View (default, action-title-driven)
 *   3. /documents/[id] — Analyst View (controlled Bloomberg-density,
 *      preserves existing layout)
 *
 * MECE buckets (the Pyramid Principle applied to a memo audit):
 *   - reasoningRisks   — What the audit found (biases + compound patterns)
 *   - stressTest       — How the room will react (boardroom + red team)
 *   - historicalAnalogs — What the comparables say (reference-class)
 *   - counterfactuals  — What to fix (what-if scenarios)
 *   - provenance       — How we know (methodology + sources)
 *
 * Action titles are persisted on first generation (LLM augmented via
 * deepseek-v4-flash with deterministic template fallback). The
 * deterministic fallback is ALWAYS valid; the LLM augmentation produces
 * variation, not new content. Stability of grammar + variation of
 * content is the locked discipline.
 */

import type { AnalysisResult, BiasDetectionResult, DecisionTwin, ForgottenQuestion } from '@/types';

/** Severity → confidence chip pair (the value-suppressing-palette
 *  pattern with discrete labels per the Deep Research counter-evidence
 *  on visual fuzziness). Color = severity (red/amber/green); chip =
 *  confidence band (High/Medium/Low); pct = numeric confidence. */
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type ConfidenceBand = 'High' | 'Medium' | 'Low' | 'Unknown';

export interface ValueSuppressingChip {
  severity: Severity;
  band: ConfidenceBand;
  /** Raw 0-100 confidence; null when the upstream signal is missing. */
  pct: number | null;
}

/** Per-finding monetary exposure when the user supplied a ticket size.
 *  Honest math only: ticket × historical-base-rate-of-this-pattern.
 *  Never fabricated. When ticket size is absent, this is null and
 *  surfaces render DQI-lift + base-rate instead. */
export interface ValueAtStake {
  ticketAmount: number;
  ticketCurrency: 'USD' | 'GBP' | 'EUR';
  exposureAmount: number;
  /** Plain-language source of the base-rate (e.g.
   *  "Synergy Mirage · McKinsey/KPMG 70-90% miss rate"). */
  baseRateSource: string;
}

// ──────────────────────────────────────────────────────────────────────
// BUCKET 1 — What the audit found (reasoning risks)
// ──────────────────────────────────────────────────────────────────────

/**
 * A single historical case that carried this reasoning risk — the
 * correlational reference class for a finding. Lean (serializable) shape so
 * the deliverable payload stays small; the composer derives it from the
 * 143-case library at compose time. NEVER a causal claim about this memo
 * (epistemic-honesty lock) — it is "this pattern has appeared here before".
 */
export interface ReferenceClassEntry {
  /** Case-study id (stable). */
  id: string;
  /** Display name, e.g. "WeWork". */
  company: string;
  /** Decision year. */
  year: number;
  /** Human impact label, e.g. "$40B valuation collapse". */
  estimatedImpact: string;
  /** URL-safe slug → /case-studies/[slug]. */
  slug: string;
  /** Outcome direction — drives the red/green marker. */
  direction: 'positive' | 'negative';
}

export interface ReasoningRiskFinding {
  kind: 'bias' | 'compound_pattern';
  /** Canonical id — biasType for biases, patternLabel for patterns. */
  id: string;
  /** Human-friendly display label (formatBiasName for biases). */
  label: string;
  /** Severity-coded; mirrors AnalysisResult severity. */
  chip: ValueSuppressingChip;
  /** Verbatim memo passage(s) supporting the finding. */
  excerpt: string;
  /** Plain-language explanation (kept short — drawer carries depth). */
  explanation: string;
  /** Suggested mitigation (passes through to "what to fix" linkage). */
  mitigation: string;
  /** For compound patterns: the constituent bias keys. */
  participatingBiases?: string[];
  /** Optional exposure (only when ticket size supplied). */
  valueAtStake?: ValueAtStake | null;
  /** Top historical cases that carried this reasoning risk (bias findings
   *  only; failures first, by impact). Correlational grounding, not cause. */
  referenceClass?: ReferenceClassEntry[];
}

export interface ReasoningRisksBucket {
  /** LLM-generated or template fallback; ≤15 words, active sentence. */
  actionTitle: string;
  /** All findings, sorted critical → low. */
  findings: ReasoningRiskFinding[];
  /** Quick counts for top-of-bucket summary. */
  counts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    namedPatterns: number;
  };
}

// ──────────────────────────────────────────────────────────────────────
// BUCKET 2 — How the room will react (stress test)
// ──────────────────────────────────────────────────────────────────────

export interface StressTestObjection {
  /** APPROVE / REJECT / REVISE / RED_TEAM */
  kind: 'boardroom' | 'red_team';
  persona: string;
  role: string;
  vote?: 'APPROVE' | 'REJECT' | 'REVISE';
  /** The hostile question or objection in their voice. */
  objection: string;
  /** The reasoning behind the objection (drawer content). */
  reasoning: string;
  /** Red-team: which memo claim is the objection targeting. */
  targetClaim?: string;
}

export interface StressTestBucket {
  actionTitle: string;
  overallVerdict?: 'APPROVED' | 'REJECTED' | 'MIXED';
  objections: StressTestObjection[];
  /** Headline counts for the comparative-matrix top bar. */
  counts: {
    approve: number;
    reject: number;
    revise: number;
    redTeam: number;
  };
}

// ──────────────────────────────────────────────────────────────────────
// BUCKET 3 — What the comparables say (historical analogs)
// ──────────────────────────────────────────────────────────────────────

export interface AnalogQuestion {
  question: string;
  whyItMatters: string;
  biasGuarded: string;
  severity: Severity;
  analogCompany?: string;
}

export interface HistoricalAnalogsBucket {
  actionTitle: string;
  /** "Forgotten questions" — what the analogs had to answer that this
   *  memo doesn't. The Klein-side R²F output. */
  forgottenQuestions: AnalogQuestion[];
  /** Optional headline summary. */
  headline?: string;
  /** Which case-library entries fed the analogs (for source-link). */
  analogsUsed: string[];
}

// ──────────────────────────────────────────────────────────────────────
// BUCKET 4 — What to fix (counterfactuals)
// ──────────────────────────────────────────────────────────────────────

export interface CounterfactualScenario {
  /** The bias / pattern the scenario removes (id matching a bucket-1
   *  finding so the slider can be wired to that card). */
  targetFindingId: string;
  /** Human label of what's being mitigated. */
  targetLabel: string;
  /** Projected DQI if this bias is fully mitigated. */
  projectedDqi: number;
  /** Projected delta from current DQI. */
  delta: number;
  /** Plain-language mitigation step. */
  mitigation: string;
}

export interface CounterfactualsBucket {
  actionTitle: string;
  /** Current DQI (pre-mitigation baseline). */
  currentDqi: number;
  /** Best-case DQI if ALL listed scenarios are mitigated. */
  bestCaseDqi: number;
  scenarios: CounterfactualScenario[];
  /** The Munger inversion list — failure-mode actions to AVOID. */
  inversionFailureModes: string[];
}

// ──────────────────────────────────────────────────────────────────────
// BUCKET 5 — How we know (provenance)
// ──────────────────────────────────────────────────────────────────────

export interface ProvenanceBucket {
  actionTitle: string;
  methodologyVersion: string;
  pipelineNodeCount: number;
  matrixDimension: number;
  /** SHA-256 prefix of the audited content; the drawer carries the
   *  full hash. Anchored to Document.contentHash when persisted, or a
   *  derived hash on the demo where the SSE payload doesn't carry it. */
  auditHashPrefix: string;
  /** Tetlock-anchored Brier baseline (the snapshot). */
  calibrationBaseline: {
    meanBrier: number;
    sampleSize: number;
    classificationAccuracy: number;
  };
  /** Frameworks flagged for the detected jurisdictions; rendered as
   *  pills with the regulatory-crosswalk drawer behind each. */
  regulatoryFrameworks: Array<{
    id: string;
    label: string;
    region: string;
  }>;
  /** Optional: claim-by-claim verification results (procurement-grade
   *  evidence anchors). */
  claimVerifications?: Array<{
    claim: string;
    verdict: 'VERIFIED' | 'CONTRADICTED' | 'UNVERIFIABLE';
    explanation: string;
    sourceUrl?: string;
  }>;
}

// ──────────────────────────────────────────────────────────────────────
// SCQA Executive Summary — the cover page grammar (Pyramid apex)
// ──────────────────────────────────────────────────────────────────────

export interface SCQAExecutiveSummary {
  /** Cover action title — the strongest sentence in the deliverable.
   *  ≤15 words, active conclusion, contains a count or metric. */
  actionTitle: string;
  /** Situation — what was audited (1 line). */
  situation: string;
  /** Complication — what the audit found wrong (1 line). */
  complication: string;
  /** Question — what the reader must decide (1 line). */
  question: string;
  /** Answer — the recommended next action (1 line). */
  answer: string;
  /** DQI score + grade band (rendered as the cover gauge). */
  dqi: {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
  };
}

// ──────────────────────────────────────────────────────────────────────
// Composite shape passed through the UI
// ──────────────────────────────────────────────────────────────────────

export interface AuditDeliverable {
  /** Stable ID — anchored to Analysis.id when present, or Document.id
   *  on the demo (where the analysis row may not yet exist client-side). */
  id: string;
  /** The composed-at timestamp; cache key for action-title runtime cache. */
  composedAt: string;
  /** SCQA cover (Pyramid apex). */
  cover: SCQAExecutiveSummary;
  /** The 5 MECE buckets. */
  reasoningRisks: ReasoningRisksBucket;
  stressTest: StressTestBucket;
  historicalAnalogs: HistoricalAnalogsBucket;
  counterfactuals: CounterfactualsBucket;
  provenance: ProvenanceBucket;
  /** Source-of-truth pointer back to the underlying result — drawer
   *  drill-downs and the Analyst view re-render against this directly. */
  source: {
    analysisResult: AnalysisResult;
    documentId: string;
    analysisId: string | null;
    /** Optional ticket size; when present, drives valueAtStake on each
     *  reasoning-risk finding. */
    ticket?: {
      amount: number;
      currency: 'USD' | 'GBP' | 'EUR';
    };
  };
}

// ──────────────────────────────────────────────────────────────────────
// Composer input options
// ──────────────────────────────────────────────────────────────────────

export interface BuildDeliverableOptions {
  documentId: string;
  analysisId: string | null;
  /** When present, every reasoning-risk finding receives a
   *  valueAtStake computed honestly from ticket × pattern-base-rate. */
  ticket?: {
    amount: number;
    currency: 'USD' | 'GBP' | 'EUR';
  };
  /** Optional pre-fetched action titles (from the LLM endpoint).
   *  When absent, the composer falls back to deterministic templates. */
  actionTitles?: Partial<{
    cover: string;
    reasoningRisks: string;
    stressTest: string;
    historicalAnalogs: string;
    counterfactuals: string;
    provenance: string;
  }>;
}

// ──────────────────────────────────────────────────────────────────────
// Re-exports so consumers import everything from one place
// ──────────────────────────────────────────────────────────────────────

export type { BiasDetectionResult, DecisionTwin, ForgottenQuestion };
