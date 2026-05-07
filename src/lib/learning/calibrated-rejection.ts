/**
 * Calibrated Rejection of Subjective Confidence — R²F paper-application
 * #10 (Item 3 lock 2026-05-07).
 *
 * The 2009 Kahneman & Klein paper "Conditions for Intuitive Expertise:
 * A Failure to Disagree" reaches one of the most actionable conclusions
 * in decision research: subjective confidence — how certain a decision-
 * maker FEELS — is not a valid indicator of accuracy unless TWO
 * conditions hold:
 *
 *   1. The environment is HIGH-VALIDITY (Validity Classifier check —
 *      already shipped 2026-04-30 as paper application #2).
 *
 *   2. The decision-maker has had ADEQUATE feedback to learn the
 *      cue→outcome mapping (Feedback Adequacy check — already shipped
 *      2026-04-30 as paper application #6).
 *
 * Both prior detectors are necessary but not sufficient on their own.
 * The Calibrated Rejection detector closes the loop — it explicitly
 * compares (a) the RHETORICAL CONFIDENCE the memo projects (proxied by
 * the bias detective's hits on illusion_of_validity, overconfidence,
 * authority, and anchoring patterns) against (b) the EARNED
 * CONFIDENCE the author has actually paid for (validity class ×
 * feedback adequacy).
 *
 * When the gap is material, the audit surfaces a "Calibrated Rejection"
 * verdict — Margaret-class CSO's most-asked question rendered as a
 * first-class procurement-grade signal: "does this memo's confidence
 * match its evidence?"
 *
 * Verdict bands (calibration gap = max(0, rhetorical - earned)):
 *
 *   well_calibrated       — gap ≤ 0.20. The memo's confidence is in
 *                           range of what its validity + feedback
 *                           adequacy supports. No flag.
 *
 *   mildly_overconfident  — gap 0.20 - 0.40. The memo carries 1-2
 *                           confidence-language bias hits in a
 *                           medium-validity domain or with sparse
 *                           feedback adequacy. Surface but don't alarm.
 *
 *   materially_overconfident
 *                         — gap 0.40 - 0.60. Multiple confidence-
 *                           language hits OR low-validity domain with
 *                           cold-start feedback. Margaret's audit-
 *                           committee-readiness flag fires.
 *
 *   severely_overconfident
 *                         — gap > 0.60. Critical illusion-of-validity
 *                           hits in a zero-validity domain with cold-
 *                           start feedback. The memo's "we're certain"
 *                           language is structurally unsupported by
 *                           the evidence the audit can verify.
 *
 *   cannot_assess         — at least one of (validity, feedback) is
 *                           'unknown' due to schema drift. Surfaces
 *                           honestly rather than fabricating a verdict.
 *
 * Pure function — no LLM call, no I/O. Deterministic for the same input.
 *
 * Wires through three surfaces:
 *   (a) /api/analysis/[id]/insights — extends AnalysisInsightsResponse
 *       with calibratedRejection so the document-detail UI can render
 *       it as a 4th SignalBlock alongside Validity / Outside View /
 *       Author Calibration.
 *   (b) DPR cover R²F strip set — renders as a CalibratedRejectionStrip
 *       between Org Calibration and Counterfactual Impact.
 *   (c) PaperApplicationsCard — surfaces the verdict on the live audit
 *       page with the exact same band as the DPR cover (no drift).
 */

import type { ValidityClass, ValidityClassification } from './validity-classifier';
import type { FeedbackAdequacy, FeedbackAdequacyVerdict } from './feedback-adequacy';

export type CalibratedRejectionVerdict =
  | 'well_calibrated'
  | 'mildly_overconfident'
  | 'materially_overconfident'
  | 'severely_overconfident'
  | 'cannot_assess';

export interface CalibratedRejection {
  verdict: CalibratedRejectionVerdict;
  /** 0-1 scale of rhetorical confidence detected in the memo. Derived
   *  from the bias detective's hits on confidence-language biases,
   *  weighted by per-bias severity. */
  rhetoricalConfidenceScore: number;
  /** 0-1 scale of earned confidence the author has paid for through
   *  the validity classification × feedback adequacy lookup. */
  earnedConfidenceScore: number;
  /** The gap = max(0, rhetorical - earned). Higher values mean the
   *  memo projects more certainty than its evidence supports. */
  calibrationGap: number;
  /** Specific bias-type signals that triggered the rhetorical-confidence
   *  score. Surfaces in the DPR strip + UI tooltip so the procurement
   *  reader can see exactly which detectors fired. */
  triggers: string[];
  /** Procurement-grade one-line note for the cover strip + UI. */
  note: string;
}

/** Confidence-language biases — these are the bias detective signals
 *  that proxy "rhetorical confidence" in the memo. The weight is the
 *  contribution to the 0-1 rhetorical-confidence score per per-bias
 *  detection (severity-weighted at compute time). */
const CONFIDENCE_LANGUAGE_WEIGHTS: Record<string, number> = {
  illusion_of_validity: 0.4, // DI-B-021 — first-class detector for the K&K 2009 mechanism
  overconfidence_bias: 0.35,
  authority_bias: 0.2, // confidence projected from authority claims
  anchoring_bias: 0.1, // weighted lower — anchoring is confidence-adjacent but not direct
};

const SEVERITY_MULTIPLIER: Record<string, number> = {
  critical: 1.0,
  high: 0.85,
  medium: 0.6,
  low: 0.35,
};

const VALIDITY_SCORE: Record<ValidityClass, number> = {
  high: 1.0,
  medium: 0.7,
  low: 0.4,
  zero: 0.1,
};

const FEEDBACK_SCORE: Record<FeedbackAdequacyVerdict, number> = {
  adequate: 1.0,
  sparse: 0.5,
  cold_start: 0.15,
  unknown: 0.5, // schema drift fallback — neither penalise nor reward
};

interface BiasInput {
  biasType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

interface ComputeInput {
  validity: ValidityClassification;
  feedback: FeedbackAdequacy;
  /** Per-bias instances flagged by the bias detective. Only
   *  confidence-language biases (illusion_of_validity / overconfidence /
   *  authority / anchoring) contribute to the rhetorical-confidence
   *  score. Other biases (confirmation, planning fallacy, etc.) are
   *  surfaced separately but do NOT inflate the calibration gap because
   *  they reflect a different mechanism. */
  biases: BiasInput[];
}

/**
 * Compute the calibrated-rejection verdict.
 *
 * Algorithm:
 *   1. Sum severity-weighted hits across confidence-language biases →
 *      rhetorical confidence ∈ [0, 1].
 *   2. Multiply validity-class score × feedback-adequacy score → earned
 *      confidence ∈ [0, 1].
 *   3. gap = max(0, rhetorical - earned).
 *   4. Map gap to verdict band, with a `cannot_assess` short-circuit
 *      when validity or feedback is 'unknown' / 'zero' under schema
 *      drift conditions.
 *
 * Pure function — same input → same output.
 */
export function computeCalibratedRejection(input: ComputeInput): CalibratedRejection {
  // Schema-drift fallback — if validity or feedback couldn't be
  // computed, surface that honestly rather than fabricating a band.
  if (input.feedback.verdict === 'unknown') {
    return {
      verdict: 'cannot_assess',
      rhetoricalConfidenceScore: 0,
      earnedConfidenceScore: 0,
      calibrationGap: 0,
      triggers: [],
      note: 'Calibration cannot be assessed — feedback adequacy lookup unavailable on this analysis. Per Kahneman & Klein 2009, both validity and feedback are necessary for confidence to carry weight; if either is unknown, the cover signal is honest rather than fabricated.',
    };
  }

  // 1. Rhetorical confidence — sum severity-weighted hits across
  //    confidence-language biases, capped at 1.0.
  const triggers: string[] = [];
  let rhetorical = 0;
  for (const bias of input.biases) {
    const weight = CONFIDENCE_LANGUAGE_WEIGHTS[bias.biasType];
    if (!weight) continue;
    const sevMult = SEVERITY_MULTIPLIER[bias.severity] ?? 0;
    rhetorical += weight * sevMult;
    triggers.push(`${bias.biasType} (${bias.severity})`);
  }
  rhetorical = Math.min(1.0, rhetorical);

  // 2. Earned confidence = validity × feedback. Both are normalised
  //    to [0, 1]; the product produces the [0, 1] earned scale.
  const earned =
    VALIDITY_SCORE[input.validity.validityClass] * FEEDBACK_SCORE[input.feedback.verdict];

  // 3. Gap — the procurement-grade signal.
  const gap = Math.max(0, rhetorical - earned);

  // 4. Verdict band thresholds (locked 2026-05-07; tuned conservatively
  //    so 'severely_overconfident' is a procurement-blocker class, not
  //    a "couple of confident phrases" class). When tightening, update
  //    here only — every consumer reads from the verdict.
  let verdict: CalibratedRejectionVerdict;
  if (gap <= 0.2) verdict = 'well_calibrated';
  else if (gap <= 0.4) verdict = 'mildly_overconfident';
  else if (gap <= 0.6) verdict = 'materially_overconfident';
  else verdict = 'severely_overconfident';

  return {
    verdict,
    rhetoricalConfidenceScore: round2(rhetorical),
    earnedConfidenceScore: round2(earned),
    calibrationGap: round2(gap),
    triggers,
    note: buildNote(verdict, input.validity, input.feedback, triggers, gap),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function buildNote(
  verdict: CalibratedRejectionVerdict,
  validity: ValidityClassification,
  feedback: FeedbackAdequacy,
  triggers: string[],
  gap: number
): string {
  const validityLabel =
    validity.validityClass === 'high'
      ? 'high-validity'
      : validity.validityClass === 'medium'
        ? 'medium-validity'
        : validity.validityClass === 'low'
          ? 'low-validity'
          : 'zero-validity';
  const feedbackLabel =
    feedback.verdict === 'adequate'
      ? 'adequate closed-loop history'
      : feedback.verdict === 'sparse'
        ? 'sparse closed-loop history'
        : feedback.verdict === 'cold_start'
          ? 'cold-start (no closed-loop history yet)'
          : 'unknown closed-loop history';

  switch (verdict) {
    case 'well_calibrated':
      return `Memo's confidence language is in range of what the ${validityLabel} domain + ${feedbackLabel} support. No procurement-stage flag fires. Calibration gap ${gap.toFixed(2)}.`;
    case 'mildly_overconfident':
      return `Memo carries some confidence-language hits (${triggers.length} trigger${triggers.length !== 1 ? 's' : ''}) but the gap (${gap.toFixed(2)}) sits below the audit-committee-readiness threshold. Surface but don't alarm. ${validityLabel} domain · ${feedbackLabel}.`;
    case 'materially_overconfident':
      return `Audit-committee-readiness flag: the memo projects more certainty (gap ${gap.toFixed(2)}) than its ${validityLabel} domain + ${feedbackLabel} earn. Per Kahneman & Klein 2009, subjective confidence is not a valid accuracy indicator without both conditions. Trigger detectors: ${triggers.slice(0, 3).join(', ')}.`;
    case 'severely_overconfident':
      return `Procurement-blocker class: the memo's confidence language is structurally unsupported by its evidence (gap ${gap.toFixed(2)}). ${validityLabel} domain × ${feedbackLabel} produces materially less earned confidence than the rhetoric claims. Recommend revising the language to match the calibrated band before audit-committee submission.`;
    case 'cannot_assess':
      return 'Calibration cannot be assessed — feedback adequacy lookup unavailable.';
  }
}

/** Surface a one-word band label for the DPR strip + UI eyebrow. */
export function calibratedRejectionVerdictLabel(verdict: CalibratedRejectionVerdict): string {
  switch (verdict) {
    case 'well_calibrated':
      return 'Calibrated';
    case 'mildly_overconfident':
      return 'Mildly overconfident';
    case 'materially_overconfident':
      return 'Materially overconfident';
    case 'severely_overconfident':
      return 'Severely overconfident';
    case 'cannot_assess':
      return 'Cannot assess';
  }
}
