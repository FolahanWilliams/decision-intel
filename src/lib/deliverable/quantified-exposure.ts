/**
 * Quantified exposure — the actuarial top-line — locked 2026-07-02.
 *
 * The Taktile move + the reason a buyer bites: not "we found biases", but "this
 * audit surfaces ~$X of capital exposure you'd otherwise carry, and here is the
 * evidence." The per-finding value-at-stake numbers already exist; this
 * CONSOLIDATES them into ONE headline statement, backed by the derivation (deal
 * size × the detected pattern's cited historical base rate) and the precedent
 * (the closest historical analog — the last time this pattern fired at scale).
 *
 * HONESTY (load-bearing — the sharp-MD test):
 *  - The number is deal-size × a CITED base rate, nothing else. Never the paper's
 *    fabricated portfolio-% / $509K / Jensen's-alpha figures (the do-not-quote
 *    attribution trap). Null when no ticket is present — never fabricated.
 *  - Aggregation is MAX single-pattern exposure, never a SUM (summing failure
 *    modes on the same capital double-counts it).
 *  - Framing is "exposure surfaced / the committee would carry uncaught", NEVER
 *    "we saved you $X" (a causal/counterfactual overclaim). Same correlational
 *    discipline as the epistemic-honesty lock.
 *
 * Pure — no I/O, no LLM, no scoring impact. Display-only.
 */

import type { ReasoningRiskFinding, ReferenceClassEntry } from './types';

export interface QuantifiedExposure {
  /** The consolidated exposure (max single-pattern), in the ticket currency. */
  exposureAmount: number;
  currency: 'USD' | 'GBP' | 'EUR';
  /** The decision size the exposure is a fraction of. */
  ticketAmount: number;
  /** The cited historical rate that drove it (0-100), derived from exposure/ticket. */
  baseRatePct: number;
  /** Plain-language attribution for the rate (e.g. "McKinsey/KPMG synergy-miss research"). */
  baseRateSource: string;
  /** The pattern (or bias) that drives the exposure. */
  drivingLabel: string;
  /** 'compound_pattern' when a toxic combination drives it — the strongest case. */
  drivingKind: ReasoningRiskFinding['kind'];
  /** The closest historical precedent, when one is on the driving finding. */
  precedent?: ReferenceClassEntry;
}

/**
 * Consolidate the per-finding value-at-stake into one actuarial exposure.
 * Returns null when no finding carries a ticket-backed exposure (the deliverable
 * then renders the DQI-lift value framing instead — never a fabricated number).
 */
export function computeQuantifiedExposure(
  findings: ReasoningRiskFinding[]
): QuantifiedExposure | null {
  let driver: ReasoningRiskFinding | null = null;
  for (const f of findings) {
    if (!f.valueAtStake) continue;
    if (!driver || f.valueAtStake.exposureAmount > (driver.valueAtStake?.exposureAmount ?? 0)) {
      // Prefer a compound pattern over a lone bias at equal exposure — the
      // toxic-combination case is the differentiator.
      if (
        !driver ||
        f.valueAtStake.exposureAmount > (driver.valueAtStake?.exposureAmount ?? 0) ||
        (f.kind === 'compound_pattern' && driver.kind !== 'compound_pattern')
      ) {
        driver = f;
      }
    }
  }
  if (!driver || !driver.valueAtStake) return null;

  const v = driver.valueAtStake;
  if (v.ticketAmount <= 0) return null;
  const baseRatePct = Math.round((v.exposureAmount / v.ticketAmount) * 100);

  // The precedent: a negative (failure) analog leads; else the first analog.
  const precedent =
    driver.referenceClass?.find(r => r.direction === 'negative') ?? driver.referenceClass?.[0];

  return {
    exposureAmount: v.exposureAmount,
    currency: v.ticketCurrency,
    ticketAmount: v.ticketAmount,
    baseRatePct,
    baseRateSource: v.baseRateSource,
    drivingLabel: driver.label,
    drivingKind: driver.kind,
    precedent,
  };
}
