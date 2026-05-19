/**
 * Decision ROI — the persistent per-org value surface (core-flow
 * friction audit #2, locked 2026-05-17).
 *
 * The retention/moat thesis is "embeddedness with MEASURABLE ROI";
 * Phase-1 graduation is literally scored on the pilot seeing it. The
 * 2026-05-17 audit found the product had NO PERSISTENT steady-state
 * per-org ROI surface — DiscoveryGradeImpactCard is a single cold
 * one-slide ($-at-risk on a $50M decision) live on /demo + /dashboard,
 * not a persistent value narrative; every steady-state analytics
 * surface rendered metrics, never the narrative. (NB: the original
 * 2026-05-17 "dead code" framing was itself a false-negative grep —
 * the card is live-mounted; corrected per the CLAUDE.md C4 lock
 * 2026-05-18. This file's job is the STEADY-STATE surface, distinct
 * from that cold one-slide.)
 *
 * This SSOT composes — never duplicates — the canonical computations:
 *   • value-at-stake (DAY-1, NOT outcome-gated): the per-decision
 *     `ticket × historicalFailRate/100` math (shared with the
 *     DiscoveryGradeImpact cold one-slide; this is the steady-state
 *     home for the same formula).
 *     Computable from the first audited decision with a ticket size +
 *     a flagged pattern. This is what makes the surface honest on a
 *     pilot's day one WITHOUT longitudinal data — the founder
 *     constraint ("no fancy longitudinal-data-dependent things now").
 *   • estimatedSavings: `getQuarterlyImpact` (outcome-gated, canonical
 *     in outcome-scoring.ts) — consumed, not recomputed.
 *   • calibration delta: `getOrgBrierStats` vs the platform baseline —
 *     consumed, staged with honest sparse bands (≥5 to be "live",
 *     mirroring the Vohra HXC N-floor + feedback-adequacy discipline).
 *
 * Pure-function-first (mirrors operational-proxy-gate / intel-brief):
 * the math + composition are PURE + unit-tested; the route is the only
 * I/O wrapper. Honesty is procurement-grade — value-at-stake is a flag
 * of EXPOSURE the audit surfaced, never a prediction of loss, and the
 * label says so.
 */

// ─── Day-1 value-at-stake (pure) ─────────────────────────────────────────────

export interface DecisionRoiInput {
  /** Decision/container display name. */
  name: string;
  /** Ticket / deal size the user entered. null = no ticket on record. */
  ticketSize: number | null;
  currency: string;
  /** Historical failure rate (0-100) of the top flagged pattern for
   *  this decision, from its toxic-combination cohort. null = nothing
   *  flagged with a historical cohort. */
  topPatternFailRate: number | null;
  topPatternLabel: string | null;
  /** Cohort size backing the fail rate — for honest sparse disclosure. */
  cohortSampleSize: number | null;
}

export interface ValueAtStakeEntry {
  name: string;
  ticketSize: number;
  currency: string;
  failRate: number;
  patternLabel: string;
  cohortSampleSize: number;
  valueAtStake: number;
}

export interface ValueAtStakeResult {
  /** Total flagged exposure, in the dominant currency. */
  totalValueAtStake: number;
  currency: string;
  /** Decisions that had a ticket size on record. */
  decisionsWithTicket: number;
  /** Decisions where a pattern with a historical cohort was flagged
   *  AND a ticket was on record (the ones that contribute). */
  decisionsFlagged: number;
  /** Per-decision breakdown, sorted by exposure desc. */
  perDecision: ValueAtStakeEntry[];
  /** True when no decision had both a ticket + a flagged pattern —
   *  the surface then shows an honest "add ticket sizes" nudge. */
  empty: boolean;
}

/**
 * Pure. Aggregate flagged exposure across the org's audited decisions.
 * Only decisions with BOTH a positive ticket size AND a flagged
 * pattern that carries a historical cohort contribute — anything else
 * is excluded (never invent a number). When the org's tickets span
 * currencies, the dominant currency (most decisions) is reported and
 * only same-currency decisions are summed, with the rest disclosed via
 * `decisionsWithTicket` vs `perDecision.length`.
 */
export function computeValueAtStake(decisions: DecisionRoiInput[]): ValueAtStakeResult {
  const withTicket = decisions.filter(d => typeof d.ticketSize === 'number' && d.ticketSize > 0);

  const contributing = withTicket.filter(
    d =>
      typeof d.topPatternFailRate === 'number' &&
      d.topPatternFailRate > 0 &&
      typeof d.cohortSampleSize === 'number' &&
      d.cohortSampleSize > 0 &&
      d.topPatternLabel
  );

  if (contributing.length === 0) {
    return {
      totalValueAtStake: 0,
      currency: withTicket[0]?.currency ?? 'USD',
      decisionsWithTicket: withTicket.length,
      decisionsFlagged: 0,
      perDecision: [],
      empty: true,
    };
  }

  // Dominant currency = the one most contributing decisions use.
  const currencyCounts = new Map<string, number>();
  for (const d of contributing) {
    currencyCounts.set(d.currency, (currencyCounts.get(d.currency) ?? 0) + 1);
  }
  const dominantCurrency = [...currencyCounts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
  )[0][0];

  const perDecision: ValueAtStakeEntry[] = contributing
    .filter(d => d.currency === dominantCurrency)
    .map(d => ({
      name: d.name,
      ticketSize: d.ticketSize as number,
      currency: d.currency,
      failRate: d.topPatternFailRate as number,
      patternLabel: d.topPatternLabel as string,
      cohortSampleSize: d.cohortSampleSize as number,
      valueAtStake: Math.round((d.ticketSize as number) * ((d.topPatternFailRate as number) / 100)),
    }))
    .sort((a, b) => b.valueAtStake - a.valueAtStake);

  return {
    totalValueAtStake: perDecision.reduce((sum, e) => sum + e.valueAtStake, 0),
    currency: dominantCurrency,
    decisionsWithTicket: withTicket.length,
    decisionsFlagged: perDecision.length,
    perDecision,
    empty: false,
  };
}

// ─── Calibration + savings composition (pure) ────────────────────────────────

/** ≥ this many Brier-scored outcomes before the org calibration delta
 *  is shown as a real signal — mirrors the Vohra HXC N-floor + the
 *  feedback-adequacy sparse-honesty discipline. Below it, the surface
 *  is honest that the signal is still emerging. */
export const ROI_CALIBRATION_MIN_OUTCOMES = 5;

export type CalibrationState = 'unlocks' | 'emerging' | 'live';

export interface OrgRoiSummary {
  valueAtStake: ValueAtStakeResult;
  calibration: {
    state: CalibrationState;
    /** Scored-outcome count driving the state. */
    outcomeCount: number;
    /** Org mean Brier — present when emerging|live. */
    orgBrier: number | null;
    /** Platform-seed baseline mean Brier (the honest comparator until
     *  the org has its own). */
    baselineBrier: number;
    /** baselineBrier - orgBrier when live (positive = org sharper than
     *  the seed baseline). null otherwise. */
    delta: number | null;
    message: string;
  };
  savings: {
    /** Canonical getQuarterlyImpact value — null when not yet
     *  computable (no closed outcomes this quarter). */
    estimatedSavings: number | null;
    currency: string;
    improvedDecisions: number;
    totalDecisions: number;
  };
}

export interface BuildOrgRoiInput {
  valueAtStake: ValueAtStakeResult;
  /** From getQuarterlyImpact (outcome-scoring.ts) — consumed verbatim. */
  quarterly: {
    estimatedSavings: number | null;
    currency: string;
    improvedDecisions: number;
    totalDecisions: number;
  };
  /** From getOrgBrierStats — consumed verbatim. */
  brier: { count: number; avg: number };
  /** PLATFORM_BASELINE_SNAPSHOT mean Brier (the seed comparator). */
  baselineBrier: number;
}

/**
 * Pure composition. Leads with the day-1 value-at-stake (always real);
 * stages the calibration delta with honest bands so a sparse pilot is
 * never shown a fabricated "your calibration sharpened" claim.
 */
export function buildOrgRoiSummary(input: BuildOrgRoiInput): OrgRoiSummary {
  const { valueAtStake, quarterly, brier, baselineBrier } = input;

  let calibration: OrgRoiSummary['calibration'];
  if (brier.count === 0) {
    calibration = {
      state: 'unlocks',
      outcomeCount: 0,
      orgBrier: null,
      baselineBrier,
      delta: null,
      message:
        'Your calibration delta unlocks once you log outcomes. Until then you are measured against the platform-seed baseline.',
    };
  } else if (brier.count < ROI_CALIBRATION_MIN_OUTCOMES) {
    calibration = {
      state: 'emerging',
      outcomeCount: brier.count,
      orgBrier: brier.avg,
      baselineBrier,
      delta: null,
      message: `Emerging signal — ${brier.count} of ${ROI_CALIBRATION_MIN_OUTCOMES} outcomes needed before your calibration is statistically meaningful. Keep closing the loop.`,
    };
  } else {
    const delta = Number((baselineBrier - brier.avg).toFixed(3));
    calibration = {
      state: 'live',
      outcomeCount: brier.count,
      orgBrier: brier.avg,
      baselineBrier,
      delta,
      message:
        delta > 0
          ? `Your decisions calibrate sharper than the platform-seed baseline by ${delta.toFixed(3)} Brier across ${brier.count} closed outcomes.`
          : `Your calibration is ${Math.abs(delta).toFixed(3)} Brier off the platform-seed baseline across ${brier.count} closed outcomes — the loop is working; keep logging.`,
    };
  }

  return {
    valueAtStake,
    calibration,
    savings: {
      estimatedSavings: quarterly.estimatedSavings,
      currency: quarterly.currency,
      improvedDecisions: quarterly.improvedDecisions,
      totalDecisions: quarterly.totalDecisions,
    },
  };
}

// ─── Display helper (pure) ───────────────────────────────────────────────────

/** Compact money formatter — mirrors DiscoveryGradeImpactCard's so the
 *  warm persistent surface reads consistently with the cold one. */
export function formatRoiMoney(value: number, currency: string): string {
  const abs = Math.abs(value);
  const symbol =
    currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : `${currency} `;
  if (abs >= 1_000_000_000) return `${symbol}${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${symbol}${(value / 1_000).toFixed(0)}K`;
  return `${symbol}${value.toFixed(0)}`;
}
