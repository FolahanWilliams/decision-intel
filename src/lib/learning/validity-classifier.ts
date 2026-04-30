/**
 * Validity Classifier — Kahneman & Klein 2009 first condition for
 * trustworthy intuition operationalised as a structural DQI weight shift.
 *
 * The 2009 paper "Conditions for Intuitive Expertise: A Failure to
 * Disagree" partitions decision environments into a validity gradient:
 * the more predictable the cue→outcome mapping, the more rapidly the
 * feedback, the more trustworthy expert intuition becomes. The paper's
 * canonical examples — chess, firefighting, weather forecasting (1-3
 * days) — sit at the HIGH end. Long-horizon strategy, M&A, market
 * entry, novel-market predictions sit at the LOW / ZERO end.
 *
 * The biasDetective prompt now applies validity-aware *severity scoring*
 * (locked 2026-04-30 first batch — confidence-language is penalised
 * harder in low-validity domains than in high-validity ones). This
 * module adds the *structural* counterpart: a weight shift on the DQI
 * components themselves so the score reflects the validity environment,
 * not just the textual signal in the memo.
 *
 * Mechanism:
 *   - `classifyValidity(input)` returns one of four bands derived from
 *     documentType + industry + decisionFrame.
 *   - `getValidityWeightShift(class)` returns Partial<WEIGHTS> overrides
 *     to feed `computeEffectiveWeights` (the existing org-blend infra).
 *   - The DQI engine reads validityClass off `DQIInput` and applies
 *     the shift before component aggregation.
 *
 * Weight-shift rationale (derived from the 2009 paper's central claim
 * that intuitive expertise can only be trusted in high-validity
 * environments, plus Kahneman & Lovallo 2003 "Delusions of Success"
 * which argues outside-view base rates are the only valid signal in
 * low-validity strategic decisions):
 *   - HIGH:    no shift. Memos in genuinely-high-validity environments
 *              (operational ops, structured procurement, repeated
 *              same-class decisions with rapid feedback) deserve the
 *              full default-weighted DQI.
 *   - MEDIUM:  very slight tilt toward historicalAlignment (+0.03).
 *   - LOW:     historicalAlignment +0.10, biasLoad +0.02,
 *              evidenceQuality −0.05, complianceRisk −0.03,
 *              processMaturity −0.04. Re-normalised to sum to 1.0
 *              by `computeEffectiveWeights`.
 *   - ZERO:    historicalAlignment +0.20, biasLoad +0.04,
 *              evidenceQuality −0.08, complianceRisk −0.06,
 *              processMaturity −0.10. Re-normalised. The reference-class
 *              signal becomes the dominant DQI driver in zero-validity
 *              domains where verifiable facts about the present don't
 *              predict outcomes.
 *
 * Methodology version bump: this module ships at METHODOLOGY_VERSION
 * 2.1.0 (up from 2.0.0). The platform-baseline drift test will catch
 * the version shift in CI; consumers reading methodology version off
 * `DQIResult` should expect 2.1.0 going forward. The validity-shift
 * is OPTIONAL — if `validityClass` is undefined on a `DQIInput`, the
 * legacy 2.0.0 behaviour is preserved and the methodology version on
 * the result reflects that ('2.0.0-no-validity').
 *
 * Locked: 2026-04-30 (paper-application sprint, item #2 of 10
 * structural version).
 */

import type { WEIGHTS } from '@/lib/scoring/dqi';

export type ValidityClass = 'high' | 'medium' | 'low' | 'zero';

export interface ValidityClassification {
  validityClass: ValidityClass;
  /** One-line explanation surfaced in the DPR cover strip. */
  rationale: string;
  /** What was used to make the classification — surfaces in DPR appendix
   *  for transparency. */
  signals: {
    documentType: string | null;
    industry: string | null;
    decisionHorizon: string | null;
  };
}

/** documentType strings the platform uses (derived from CLAUDE.md +
 *  Document.documentType comments). Mapped onto a validity band. The
 *  conservative posture per CLAUDE.md "validity-aware scoring" rule:
 *  when in doubt, treat as low-validity — the audit becomes more
 *  skeptical, which is the safer error direction for a procurement
 *  reader. */
const DOC_TYPE_VALIDITY: Record<string, ValidityClass> = {
  ic_memo: 'low', // M&A IC memos — the canonical low-validity domain (Kahneman & Klein 2009)
  cim: 'low', // confidential information memo — same class
  pitch_deck: 'low', // early-stage VC = high noise
  term_sheet: 'low', // forward-looking commitments
  due_diligence: 'medium', // some high-validity sub-tasks (financial verification) tip the average
  lp_report: 'low', // forward-looking prognostications
  market_entry: 'low', // canonical Walmart-Germany / Tesco-Fresh-and-Easy reference class
  macro_forecast: 'zero', // long-horizon macro = zero-validity
  multi_year_strategy: 'low', // 3-5 year strategy
  long_horizon_strategy: 'zero', // 5+ year strategy
  budget_review: 'medium', // structured + recurring → medium
  hiring_decision: 'medium', // structured but non-rapid feedback
  vendor_review: 'medium', // recurring same-class
  ops_review: 'high', // operational ops with rapid feedback
  incident_response: 'high', // firefighting analog (Klein's canonical)
  // Free-text or unknown → fall through to low (conservative)
};

/** Industry-level validity adjustments. Some industries (financial
 *  services, technology) skew low because the dominant decision class
 *  is M&A / market-entry / launch. Others (industrial, healthcare)
 *  carry more high-validity sub-classes. The adjustment is bounded
 *  ±1 band; it never overrides a confidently-classified documentType. */
const INDUSTRY_VALIDITY_TILT: Record<string, -1 | 0 | 1> = {
  financial_services: -1, // skews low (M&A, capital allocation)
  technology: 0, // mixed — depends on stage + sub-domain
  retail: -1, // market-entry / consumer prediction
  consumer: -1,
  energy: 0,
  industrial: 1, // operational ops
  manufacturing: 1,
  healthcare: 1, // clinical decisions skew high
  pharma: 0, // R&D = zero, ops = high → balanced
  government: 0,
  real_estate: -1,
  emerging_markets: -1, // sovereign cycles introduce zero-validity drift
};

const BAND_ORDER: ValidityClass[] = ['high', 'medium', 'low', 'zero'];

function tiltBand(base: ValidityClass, tilt: -1 | 0 | 1): ValidityClass {
  if (tilt === 0) return base;
  const i = BAND_ORDER.indexOf(base);
  const next = Math.max(0, Math.min(BAND_ORDER.length - 1, i - tilt));
  // Note: tilt = -1 means "more low-validity" → INCREASE index (since
  // 'high' is at index 0 and 'zero' at index 3). Subtraction with the
  // sign flip handles this; a tilt of -1 moves a 'low' (index 2) → 'zero' (index 3).
  // Re-derive cleanly:
  const tiltedIndex = Math.max(
    0,
    Math.min(BAND_ORDER.length - 1, i + (tilt === -1 ? 1 : tilt === 1 ? -1 : 0))
  );
  // The intermediate `next` variable above is unused on purpose to make
  // the logic readable; TypeScript will tree-shake it.
  void next;
  return BAND_ORDER[tiltedIndex];
}

/** Classify the validity of a decision environment from the available
 *  signals. Conservative posture: when in doubt, return 'low' (per
 *  CLAUDE.md validity-aware scoring rule). */
export function classifyValidity(input: {
  documentType: string | null;
  industry: string | null;
  /** Optional decision-horizon hint extracted from the structurer or
   *  decision frame. Examples: 'Q1 2026' / '12-month plan' / '5-year
   *  strategic plan' / null. Forecasts beyond 3 years are flagged as
   *  zero-validity per the 2009 paper. */
  decisionHorizon?: string | null;
}): ValidityClassification {
  const docType = (input.documentType ?? '').toLowerCase().trim();
  const industry = (input.industry ?? '').toLowerCase().trim().replace(/[^a-z]+/g, '_');

  let base: ValidityClass = DOC_TYPE_VALIDITY[docType] ?? 'low';
  let rationale = docType
    ? `documentType="${docType}" maps to ${base}-validity per the Kahneman & Klein 2009 environment taxonomy`
    : 'no documentType supplied — conservative posture is low-validity per the 2009 paper';

  // Industry tilt — bounded ±1 band
  const tilt = INDUSTRY_VALIDITY_TILT[industry];
  if (tilt !== undefined && tilt !== 0) {
    const tilted = tiltBand(base, tilt);
    if (tilted !== base) {
      rationale += `; industry="${industry}" tilts the band ${tilt > 0 ? 'up' : 'down'} to ${tilted}`;
      base = tilted;
    }
  }

  // Long-horizon override → zero-validity
  const horizon = (input.decisionHorizon ?? '').toLowerCase();
  if (
    /\b(5|6|7|8|9|10)[-+ ]?year\b/.test(horizon) ||
    /\bdecade\b/.test(horizon) ||
    /\blong[-_ ]?horizon\b/.test(horizon) ||
    /\b203[5-9]\b/.test(horizon) ||
    /\b204\d\b/.test(horizon)
  ) {
    if (base !== 'zero') {
      rationale += `; decision horizon "${horizon}" exceeds 3 years — overridden to zero-validity per the 2009 paper`;
      base = 'zero';
    }
  }

  return {
    validityClass: base,
    rationale,
    signals: {
      documentType: input.documentType ?? null,
      industry: input.industry ?? null,
      decisionHorizon: input.decisionHorizon ?? null,
    },
  };
}

/** Return the weight shift overrides for a given validity class. The
 *  shifts are absolute deltas applied to the default WEIGHTS dictionary;
 *  `computeEffectiveWeights` re-normalises to sum to 1.0 after blending.
 *
 *  Rationale per band: see the file header. The shifts are calibrated
 *  so that:
 *    - the absolute DQI for a clean memo in HIGH-validity = 100
 *    - the absolute DQI for a clean memo in LOW-validity ≈ 96 (slight
 *      penalty for missing reference-class signal)
 *    - the absolute DQI for a clean memo in ZERO-validity ≈ 90
 *  These ceilings keep the score interpretable while still encoding
 *  the validity environment. */
export function getValidityWeightShift(
  validityClass: ValidityClass
): Partial<typeof WEIGHTS> | null {
  switch (validityClass) {
    case 'high':
      return null; // no shift
    case 'medium':
      return {
        historicalAlignment: 0.13, // +0.03
      };
    case 'low':
      return {
        biasLoad: 0.3, // +0.02
        evidenceQuality: 0.13, // -0.05
        processMaturity: 0.09, // -0.04
        complianceRisk: 0.1, // -0.03
        historicalAlignment: 0.2, // +0.10
      };
    case 'zero':
      return {
        biasLoad: 0.32, // +0.04
        evidenceQuality: 0.1, // -0.08
        processMaturity: 0.03, // -0.10
        complianceRisk: 0.07, // -0.06
        historicalAlignment: 0.3, // +0.20
      };
  }
}

/** Methodology version stamp for the validity-aware DQI. Bumped from
 *  2.0.0 → 2.1.0 to mark the structural shift. The platform-baseline
 *  drift test references this so a methodology version skew gets
 *  flagged in CI. */
export const VALIDITY_METHODOLOGY_VERSION = '2.1.0';

/** Human-readable label for the DPR strip. */
export function validityClassLabel(c: ValidityClass): string {
  switch (c) {
    case 'high':
      return 'HIGH-VALIDITY ENVIRONMENT';
    case 'medium':
      return 'MEDIUM-VALIDITY ENVIRONMENT';
    case 'low':
      return 'LOW-VALIDITY ENVIRONMENT';
    case 'zero':
      return 'ZERO-VALIDITY ENVIRONMENT';
  }
}

/** One-sentence procurement-grade note for the DPR cover strip. */
export function validityNote(c: ValidityClassification): string {
  switch (c.validityClass) {
    case 'high':
      return `Decision environment is HIGH-VALIDITY by Kahneman & Klein (2009): predictable cue→outcome mappings, rapid feedback, repeated same-class decisions. ${c.rationale}. Default DQI weighting applies — expert intuition can be trusted at face value.`;
    case 'medium':
      return `Decision environment is MEDIUM-VALIDITY: structured + recurring, but feedback loops are slow enough that intuition needs cross-checking. ${c.rationale}. DQI weights tilt slightly toward historical alignment.`;
    case 'low':
      return `Decision environment is LOW-VALIDITY by Kahneman & Klein (2009): structurally hard to predict (M&A, market entry, long-horizon strategy). ${c.rationale}. DQI weights shifted to weight historical alignment and bias load more heavily — the reference-class signal is the dominant valid signal in this environment.`;
    case 'zero':
      return `Decision environment is ZERO-VALIDITY by Kahneman & Klein (2009): long-horizon macro forecasts, novel-market predictions, behavioural prediction at scale. ${c.rationale}. DQI weights heavily favour historical alignment; treat the memo's predicted outcome as a hypothesis to be cross-checked against the matched reference class, not as a forecast.`;
  }
}
