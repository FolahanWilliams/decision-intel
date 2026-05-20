/**
 * Per-finding exposure math — locked 2026-05-20.
 *
 * Honest math only. When the user supplies a ticket size on the /demo
 * paste form (or the in-product Decision Frame value), every reasoning-
 * risk finding receives an exposure figure computed as:
 *
 *   ticket × historical_base_rate_of_this_pattern
 *
 * The historical base rate is anchored to the named pattern (Synergy
 * Mirage, Winner's Curse, etc.) when the bias participates in one, or
 * to the bias's severity-anchored failure rate otherwise. This is the
 * SAME math the `computeValueAtStake` helper in `decision-roi.ts` uses
 * — we reuse the pattern but apply it per-finding (not per-decision).
 *
 * When ticket is absent, every consumer renders DQI-lift + base-rate
 * instead. We NEVER fabricate dollar figures; null-when-missing is the
 * load-bearing discipline.
 */

import type { Severity, ValueAtStake } from './types';

/** Historical failure rates anchored to named patterns. Sources cited
 *  inline so the source-link drawer can surface them at render time. */
const PATTERN_BASE_RATES: Readonly<Record<string, { rate: number; source: string }>> = {
  'Synergy Mirage': {
    rate: 0.8,
    source: 'McKinsey/KPMG: 70-90% of M&A deals miss projected synergies',
  },
  'Conglomerate Fallacy': {
    rate: 0.575,
    source: 'Lang & Stulz 1994: 50-65% diversification discount on conglomerate acquisitions',
  },
  "Winner's Curse": {
    rate: 0.7,
    source: 'Capen 1971 / Bazerman & Samuelson 1983: auction overpayment',
  },
  'The Yes Committee': {
    rate: 0.65,
    source: 'Microsoft-Nokia: $249B in market-cap evaporation',
  },
  'The Sunk Ship': {
    rate: 0.6,
    source: 'Lockheed Martin reach-forward losses — deal-escalation cohort',
  },
  'The Echo Chamber': {
    rate: 0.55,
    source: 'Janis 1972: groupthink + confirmation in confidential settings',
  },
  'The Blind Sprint': {
    rate: 0.6,
    source: 'Klein 2003: availability + overconfidence under time pressure',
  },
  'The Optimism Trap': {
    rate: 0.55,
    source: 'Kahneman & Lovallo 2003: planning fallacy + overconfidence',
  },
  'Reference-Class Blindness': {
    rate: 0.65,
    source: 'Kahneman & Lovallo 2003: inside-view dominance fail mode',
  },
  'Coherent Confidence': {
    rate: 0.55,
    source: 'Kahneman & Klein 2009: illusion of validity + overconfidence',
  },
};

/** Severity-anchored fallback rates when no named pattern fires.
 *  These are deliberately conservative — strategy-team base rates
 *  drawn from the case-library cohort. */
const SEVERITY_BASE_RATES: Readonly<Record<Severity, { rate: number; source: string }>> = {
  critical: {
    rate: 0.55,
    source: 'Reference-class corpus: critical-severity bias cohort failure rate',
  },
  high: {
    rate: 0.35,
    source: 'Reference-class corpus: high-severity bias cohort failure rate',
  },
  medium: {
    rate: 0.2,
    source: 'Reference-class corpus: medium-severity bias cohort failure rate',
  },
  low: {
    rate: 0.08,
    source: 'Reference-class corpus: low-severity bias cohort failure rate',
  },
};

export interface ValueAtStakeInput {
  ticketAmount: number;
  ticketCurrency: 'USD' | 'GBP' | 'EUR';
  severity: Severity;
  /** When the finding is itself a named pattern OR participates in one,
   *  the rate-lookup runs against this label first. */
  namedPatternLabel?: string;
}

/**
 * Compute the honest per-finding exposure. Returns null when the
 * ticket is absent or non-positive, so consumers can simply check
 * for null and render the DQI-lift fallback.
 */
export function computeFindingValueAtStake(input: ValueAtStakeInput): ValueAtStake | null {
  const { ticketAmount, ticketCurrency, severity, namedPatternLabel } = input;
  if (!Number.isFinite(ticketAmount) || ticketAmount <= 0) return null;

  let rate: number;
  let source: string;
  if (namedPatternLabel && PATTERN_BASE_RATES[namedPatternLabel]) {
    ({ rate, source } = PATTERN_BASE_RATES[namedPatternLabel]);
  } else {
    ({ rate, source } = SEVERITY_BASE_RATES[severity]);
  }

  return {
    ticketAmount,
    ticketCurrency,
    exposureAmount: Math.round(ticketAmount * rate),
    baseRateSource: source,
  };
}

/** Format an exposure amount with currency for display. Keeps the
 *  number short (rounds millions/billions to 1 decimal) so it fits in
 *  action titles + cards without wrapping. */
export function formatExposureLabel(value: ValueAtStake): string {
  const symbol = value.ticketCurrency === 'USD' ? '$' : value.ticketCurrency === 'GBP' ? '£' : '€';
  const amt = value.exposureAmount;
  if (amt >= 1_000_000_000) return `${symbol}${(amt / 1_000_000_000).toFixed(1)}B`;
  if (amt >= 1_000_000) return `${symbol}${(amt / 1_000_000).toFixed(1)}M`;
  if (amt >= 1_000) return `${symbol}${Math.round(amt / 1_000)}K`;
  return `${symbol}${amt.toLocaleString()}`;
}

/**
 * Parse a human-shorthand ticket-amount input ("50M", "2.5B", "500K",
 * "1,200,000", "$50M") into an absolute number. Returns null on empty
 * or unparseable input — caller treats null as "no ticket supplied".
 *
 * Forgives commas, currency symbols, whitespace; accepts K (thousand),
 * M (million), B (billion). Case-insensitive on suffixes.
 */
export function parseTicketAmount(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[$£€,\s]/g, '').trim();
  if (!cleaned) return null;
  const match = /^([0-9]*\.?[0-9]+)([kmb]?)$/i.exec(cleaned);
  if (!match) return null;
  const base = parseFloat(match[1]);
  if (!Number.isFinite(base) || base <= 0) return null;
  const suffix = match[2].toLowerCase();
  const multiplier =
    suffix === 'b' ? 1_000_000_000 : suffix === 'm' ? 1_000_000 : suffix === 'k' ? 1_000 : 1;
  return Math.round(base * multiplier);
}

/** Format a ticket amount the same way (used on the cover summary). */
export function formatTicketLabel(amount: number, currency: 'USD' | 'GBP' | 'EUR'): string {
  return formatExposureLabel({
    ticketAmount: amount,
    ticketCurrency: currency,
    exposureAmount: amount,
    baseRateSource: '',
  });
}

// Exports for tests
export const PATTERN_BASE_RATES_EXPORTED = PATTERN_BASE_RATES;
export const SEVERITY_BASE_RATES_EXPORTED = SEVERITY_BASE_RATES;
