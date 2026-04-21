/**
 * Brier Scoring — proper-scoring-rule calibration of DQI predictions
 * against confirmed outcomes.
 *
 * Background: a Brier score measures the mean squared error between a
 * predicted probability and the actual outcome. For a single prediction:
 *
 *   brier = (predicted_probability − actual_outcome) ²
 *
 * It has two important properties:
 *   1. It is a *proper* scoring rule — the forecaster's Brier is
 *      minimised iff they report their true belief, so it cannot be
 *      gamed.
 *   2. Lower is better. 0 is perfect calibration, 1 is worst case.
 *      Tetlock's superforecasters averaged ~0.13 over the 20-year
 *      Good Judgment Project; CIA analysts on the same questions
 *      averaged ~0.23.
 *
 * Mapping to Decision Intel:
 *   - Predicted probability = DQI / 100. The DQI is already a 0–100
 *     score where higher means "more likely to produce a good outcome,"
 *     so dividing by 100 yields a probability of a good decision.
 *   - Actual outcome is mapped from the five DecisionOutcome.outcome
 *     values onto [0, 1] where 1.0 = full success, 0.0 = catastrophic
 *     failure. See OUTCOME_TO_ACTUAL below.
 *
 * The Brier score is computed once per DecisionOutcome row at outcome-
 * submission time (see /api/outcomes/track). Per-org aggregates drive
 * the calibration-quality chart on /dashboard/outcome-flywheel.
 *
 * This is the math backing the "Brier scoring + per-org recalibration"
 * claim on the landing-page showcase, /security, and the Platform
 * Foundations curriculum.
 */

export type OutcomeCode =
  | 'success'
  | 'partial_success'
  | 'inconclusive'
  | 'partial_failure'
  | 'failure';

/** Mapping from the five DecisionOutcome.outcome codes onto the [0, 1]
 *  interval representing "how good was this decision, objectively." The
 *  edges (0.0 and 1.0) are reserved for unambiguous success / failure;
 *  the 0.5 midpoint carries "inconclusive" because a decision whose
 *  outcome cannot be scored should score every prediction evenly.
 *
 *  Changing these values rewrites the meaning of every previously-stored
 *  Brier score, so bump a schema version alongside any change. */
export const OUTCOME_TO_ACTUAL: Record<OutcomeCode, number> = {
  success: 1.0,
  partial_success: 0.75,
  inconclusive: 0.5,
  partial_failure: 0.25,
  failure: 0.0,
};

/** Coerce a free-form outcome string into one of the five canonical
 *  codes. The POST /api/outcomes/track handler currently accepts
 *  `too_early` as a synonym for `inconclusive` (pre-flywheel
 *  nomenclature) — map it here so the handler doesn't have to. Any
 *  unknown value falls back to `inconclusive` so a caller typo never
 *  produces a wildly-inflated Brier score. */
export function canonicalOutcome(raw: string | null | undefined): OutcomeCode {
  if (!raw) return 'inconclusive';
  const k = raw.toLowerCase().replace(/-/g, '_').trim();
  if (
    k === 'success' ||
    k === 'partial_success' ||
    k === 'failure' ||
    k === 'partial_failure' ||
    k === 'inconclusive'
  ) {
    return k as OutcomeCode;
  }
  if (k === 'too_early' || k === 'tooearly' || k === 'pending') return 'inconclusive';
  return 'inconclusive';
}

/** Core Brier calculation for a single (prediction, outcome) pair.
 *  Predicted probability is the DQI divided by 100 and clamped to
 *  [0, 1] so out-of-range DQIs (a pipeline bug) still produce a
 *  well-defined score instead of NaN. NaN / non-finite inputs are
 *  treated as worst-case (1.0) — strictly safer than propagating NaN
 *  into stored analytics rows. */
export function computeBrier(predictedDqi: number, outcomeCode: OutcomeCode): number {
  if (!Number.isFinite(predictedDqi)) return 1;
  const p = Math.max(0, Math.min(1, predictedDqi / 100));
  const actual = OUTCOME_TO_ACTUAL[outcomeCode];
  const brier = (p - actual) ** 2;
  // Round to 4 decimals so the stored value compares cleanly in tests
  // and displays without float noise. 4 decimals is still well below
  // meaningful precision for any reasonable sample size.
  return Math.round(brier * 10_000) / 10_000;
}

export type BrierCategory = 'excellent' | 'good' | 'fair' | 'poor';

/** Bucket a Brier score into a categorical label for chart grouping
 *  and per-org leaderboards. Thresholds chosen to roughly mirror the
 *  Tetlock superforecaster distribution — 'excellent' is the
 *  superforecaster band, 'good' is the informed-analyst band,
 *  'fair' is the motivated-amateur band, 'poor' is where coin-flip
 *  lives. Keep in sync with UI label colours. */
export function brierCategory(score: number): BrierCategory {
  if (score <= 0.1) return 'excellent';
  if (score <= 0.2) return 'good';
  if (score <= 0.35) return 'fair';
  return 'poor';
}

/** Convenience: compute both score and category in one call. Returned
 *  as a `{ score, category }` shape so call sites can persist both in
 *  a single Prisma update. */
export function scoreOutcome(
  predictedDqi: number,
  outcomeCode: OutcomeCode
): { score: number; category: BrierCategory } {
  const score = computeBrier(predictedDqi, outcomeCode);
  return { score, category: brierCategory(score) };
}

// ── Per-org aggregation (DB-touching; imported lazily by UI) ────────

import type { PrismaClient } from '@prisma/client';

export interface OrgBrierStats {
  /** Number of outcomes used to compute the average. */
  count: number;
  /** Mean Brier across all outcomes — the headline calibration number. */
  avg: number;
  /** Median Brier — robust to a single badly-miscalibrated decision. */
  median: number;
  /** Category distribution for stacked-bar visualisation. */
  distribution: Record<BrierCategory, number>;
  /** Trend indicator derived from comparing the first half of the
   *  sample to the second half. null when sample is too small to
   *  distinguish signal from noise. */
  trend: 'improving' | 'flat' | 'degrading' | null;
}

/** Fetch the per-org Brier trend for the outcome-flywheel dashboard.
 *  Uses the `DecisionOutcome_orgId_brierScore_idx` composite index.
 *  Callers should handle `count === 0` as "no data yet" rather than
 *  rendering zeroes. */
export async function getOrgBrierStats(
  prisma: PrismaClient,
  orgId: string,
  lookbackDays = 365
): Promise<OrgBrierStats> {
  const from = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);
  const rows = await prisma.decisionOutcome.findMany({
    where: {
      orgId,
      brierScore: { not: null },
      reportedAt: { gte: from },
    },
    select: { brierScore: true, brierCategory: true, reportedAt: true },
    orderBy: { reportedAt: 'asc' },
  });

  if (rows.length === 0) {
    return {
      count: 0,
      avg: 0,
      median: 0,
      distribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
      trend: null,
    };
  }

  const scores = rows.map(r => r.brierScore).filter((s): s is number => typeof s === 'number');
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const sorted = [...scores].sort((a, b) => a - b);
  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

  const distribution: Record<BrierCategory, number> = {
    excellent: 0,
    good: 0,
    fair: 0,
    poor: 0,
  };
  for (const row of rows) {
    const cat = (row.brierCategory as BrierCategory | null) ?? brierCategory(row.brierScore ?? 1);
    distribution[cat] = (distribution[cat] ?? 0) + 1;
  }

  // Trend: require at least 8 outcomes before attempting a signal.
  // Compare first-half mean to second-half mean; an improvement >= 0.03
  // (half a category width) is meaningful given typical sample variance.
  let trend: OrgBrierStats['trend'] = null;
  if (scores.length >= 8) {
    const half = Math.floor(scores.length / 2);
    const firstAvg = scores.slice(0, half).reduce((a, b) => a + b, 0) / half;
    const secondAvg = scores.slice(-half).reduce((a, b) => a + b, 0) / half;
    const delta = secondAvg - firstAvg;
    if (delta <= -0.03)
      trend = 'improving'; // lower Brier = better
    else if (delta >= 0.03) trend = 'degrading';
    else trend = 'flat';
  }

  return {
    count: scores.length,
    avg: Math.round(avg * 10_000) / 10_000,
    median: Math.round(median * 10_000) / 10_000,
    distribution,
    trend,
  };
}
