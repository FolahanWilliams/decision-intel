/**
 * Clean-audit reassurance SSOT — "the audit found nothing. Did it have value?"
 * (locked 2026-06-22).
 *
 * The friction this solves: when an audit surfaces zero biases, the prior
 * copy was a terse italic line ("No biases detected... exceptionally clean
 * or still in flight"). A first-time user reads that as a NULL result and
 * concludes Decision Intel had no value on this memo. That is the exact
 * wrong takeaway: a clean pass is a VERIFIED result, not a blank, and on
 * the asymmetric-tail logic (CLAUDE.md one-liner) it is the whole reason
 * you run the audit on every memo, not just the suspicious ones.
 *
 * This file is the result-time sibling of UPLOAD_UNIVERSAL.calibration in
 * upload-guidance.ts (which calibrates the DQI expectation at UPLOAD time).
 * It is the single source the result surfaces read from:
 *   - the doc-detail Findings tab (CleanAuditPanel, full version)
 *   - the dashboard post-upload reveal (InlineAnalysisResultCard, compact)
 *
 * Voice rules (mirror the pain-framing + epistemic-honesty locks in
 * icp.ts): name a MISSING PROCESS, never broken thinking. Honest about
 * what a clean audit does NOT mean — it surfaces risk indicators
 * correlated with poor outcomes, it never promises the decision succeeds
 * (correlation, not causation). The "decorrelated lenses, not independent
 * judges" framing is preserved per the noise-jury honesty lock.
 *
 * Em-dash-clean by design (same posture as upload-guidance.ts) so the same
 * strings stay safe if a marketing surface ever consumes them.
 *
 * Forward-looking rule: edit copy HERE only; both result surfaces read by
 * import. The taxonomy count is derived from BIAS_COUNT so it cannot drift.
 */

import { BIAS_COUNT } from '@/lib/constants/bias-count';

export interface CleanAuditNextStep {
  label: string;
  detail: string;
}

export const CLEAN_AUDIT = {
  eyebrow: 'Audited clean',

  /** The headline that reframes "empty" as "verified". */
  headline: 'No high-risk reasoning patterns surfaced. That is a verified result, not a blank.',

  /** The asymmetric-tail argument for WHY a clean pass is worth having. */
  why: "Most strong memos pass cleanly. The ones that don't are the ones that erode capital, and you cannot tell the clean memo from the catastrophic one without auditing both. A clean pass is the verification, not the absence of one.",

  /** What the audit actually did, so "nothing found" reads as rigor, not a skipped step. */
  whatRan: `Your reasoning was scanned against the ${BIAS_COUNT}-bias R²F taxonomy, then pressure-tested through three decorrelated lenses (a skeptical analyst, a hostile regulator, and a contrarian strategist) and an adversarial meta-judge. None of them found a pattern worth flagging.`,

  /** What the clean result gives the user. */
  means: [
    'The DQI still scores how well the reasoning holds together. A clean scan with a strong DQI is the procurement-grade record an audit committee actually wants to see.',
    'Your Decision Provenance Record is hashed and tamper-evident whether or not biases were found. The clean record is itself the deliverable, the defensible proof the call was audited before it was made.',
  ],

  /** The epistemic-honesty caveat — what a clean audit does NOT mean. */
  honesty:
    'A clean audit means your reasoning carries no obvious bias signature for a fresh reviewer to attack. It surfaces risk indicators correlated with poor outcomes; it does not promise the decision succeeds. No audit can settle that. Only the outcome can.',

  /** What to do next — the founder-requested "and what to do in future". */
  nextSteps: [
    {
      label: 'Log the outcome when it lands',
      detail:
        'A clean-reasoning decision that still wins or loses is your highest-value calibration data. It teaches the platform what a clean memo actually predicts for you specifically.',
    },
    {
      label: 'Pressure-test the edges',
      detail:
        'Open the Stress test and Perspectives tabs to see how the call holds up against the questions a board or committee would ask.',
    },
    {
      label: 'Keep the record',
      detail:
        'Export the Decision Provenance Record as your shareable, defensible proof that the reasoning was audited before capital moved.',
    },
  ] satisfies CleanAuditNextStep[],

  /**
   * Compact variant for the dashboard post-upload reveal, where space is
   * tight and the full explanation lives one click away on the detail page.
   */
  inlineBody:
    "Clean is a result, not a blank. Most strong memos pass; the ones that don't are the ones that erode capital, and you can only tell them apart by auditing both. Open Deep Dive to see what a clean audit gives you.",
} as const;
