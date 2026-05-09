/**
 * Synergy Defensibility Scorer (locked 2026-05-09, synergy-parser deepening).
 *
 * Pure-function scorer for individual synergy claims extracted from a
 * synergy model spreadsheet. Implements the BCG / McKinsey-anchored rule
 * that a synergy claim is defensible iff it carries a NAMED OPERATIONAL
 * MECHANISM, NAMED ACCOUNTABLE EXECUTIVE, and MEASURABLE 90-DAY MILESTONE.
 *
 * Base-rate realisation by claim type (per BCG integration best-practices
 * + McKinsey 2019 "Where mergers go wrong" + KPMG global M&A benchmarks):
 *   - Revenue synergies: 30-50% realised vs projected
 *   - Cost/COGS synergies: 60-80% realised vs projected
 *   - Cost/OpEx synergies: 50-70% realised vs projected
 *   - CapEx synergies: 60-80% realised vs projected
 *
 * The defensibility score determines severity:
 *   - 0 of 3 elements present → critical (full Synergy Mirage)
 *   - 1 of 3 → high (one anchor, two missing)
 *   - 2 of 3 → medium (most-prevalent failure shape: mechanism + owner
 *                       but no measurable milestone)
 *   - 3 of 3 → low (well-defended, but base-rate gap remains)
 *
 * NO LLM CALL. Deterministic. Same input → same output.
 *
 * Used by:
 *   - src/lib/parsers/synergy-model-parser.ts (called per claim during
 *     spreadsheet extraction)
 *   - src/lib/utils/file-parser.ts (embeds the scored claims inline in
 *     the text content for synergy_model uploads, so the structurer +
 *     biasDetective see structured defensibility data without needing
 *     a new state field on the audit graph)
 */

export type SynergyClaimType = 'revenue' | 'cost_cogs' | 'cost_opex' | 'capex' | 'unknown';

export interface SynergyClaimInput {
  /** Whether the claim row carries an explicit operational-mechanism description. */
  hasMechanism: boolean;
  /** Whether the claim row carries an explicit accountable-executive name. */
  hasOwner: boolean;
  /** Whether the claim row carries an explicit measurable milestone (90-day or otherwise). */
  hasMilestone: boolean;
  /** Synergy classification — drives the base-rate realisation band. */
  type: SynergyClaimType;
}

export type DefensibilitySeverity = 'critical' | 'high' | 'medium' | 'low';

export interface SynergyDefensibilityScore {
  /** 0-3: count of (mechanism + owner + milestone) elements present. */
  score: number;
  /** Names of missing elements, in canonical order. */
  missing: Array<'mechanism' | 'owner' | 'milestone'>;
  /** Severity band for procurement-grade flagging. */
  severity: DefensibilitySeverity;
  /** Base-rate realisation band for this claim type — BCG/McKinsey anchors. */
  baseRateLow: number;
  baseRateHigh: number;
  /** One-line procurement-grade verdict naming the gap and the base rate. */
  verdict: string;
}

const BASE_RATES: Record<SynergyClaimType, { low: number; high: number; label: string }> = {
  revenue: { low: 0.3, high: 0.5, label: 'revenue synergy' },
  cost_cogs: { low: 0.6, high: 0.8, label: 'COGS synergy' },
  cost_opex: { low: 0.5, high: 0.7, label: 'OpEx synergy' },
  capex: { low: 0.6, high: 0.8, label: 'CapEx synergy' },
  unknown: { low: 0.3, high: 0.8, label: 'synergy (type unclassified)' },
};

const ALL_ELEMENTS: Array<'mechanism' | 'owner' | 'milestone'> = [
  'mechanism',
  'owner',
  'milestone',
];

export function scoreSynergyClaim(claim: SynergyClaimInput): SynergyDefensibilityScore {
  const present: Array<'mechanism' | 'owner' | 'milestone'> = [];
  if (claim.hasMechanism) present.push('mechanism');
  if (claim.hasOwner) present.push('owner');
  if (claim.hasMilestone) present.push('milestone');

  const score = present.length;
  const missing = ALL_ELEMENTS.filter(e => !present.includes(e));

  let severity: DefensibilitySeverity;
  if (score === 0) severity = 'critical';
  else if (score === 1) severity = 'high';
  else if (score === 2) severity = 'medium';
  else severity = 'low';

  const baseRate = BASE_RATES[claim.type];
  const lowPct = Math.round(baseRate.low * 100);
  const highPct = Math.round(baseRate.high * 100);

  let verdict: string;
  if (score === 3) {
    verdict = `All three defensibility elements present. ${baseRate.label} base-rate realisation: ${lowPct}-${highPct}%; even fully defended claims should be discounted to that band before underwriting the deal.`;
  } else if (score === 0) {
    verdict = `No mechanism, owner, or milestone — Synergy Mirage critical. ${baseRate.label} base-rate realisation is ${lowPct}-${highPct}%; this claim has zero structural support to clear that base rate.`;
  } else {
    const missingPhrase =
      missing.length === 1
        ? `Missing ${missing[0]}.`
        : `Missing ${missing.slice(0, -1).join(', ')}, and ${missing[missing.length - 1]}.`;
    verdict = `${missingPhrase} ${baseRate.label} base-rate realisation is ${lowPct}-${highPct}%; claim is structurally under-defended for that band.`;
  }

  return {
    score,
    missing,
    severity,
    baseRateLow: baseRate.low,
    baseRateHigh: baseRate.high,
    verdict,
  };
}

/**
 * Aggregate defensibility across a portfolio of synergy claims. Used to
 * generate a single-line summary at the top of the structured-claims
 * block embedded in the synergy_model text content.
 */
export interface PortfolioDefensibility {
  totalClaims: number;
  /** Distribution of severity bands across all claims. */
  severityCounts: Record<DefensibilitySeverity, number>;
  /** % of claims with all three elements present. */
  fullyDefendedPct: number;
  /** Procurement-grade summary line. */
  summary: string;
}

export function aggregateDefensibility(
  scores: SynergyDefensibilityScore[]
): PortfolioDefensibility {
  const totalClaims = scores.length;
  const severityCounts: Record<DefensibilitySeverity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  for (const s of scores) severityCounts[s.severity] += 1;

  const fullyDefended = severityCounts.low;
  const fullyDefendedPct = totalClaims === 0 ? 0 : Math.round((fullyDefended / totalClaims) * 100);

  const criticalAndHigh = severityCounts.critical + severityCounts.high;
  let summary: string;
  if (totalClaims === 0) {
    summary = 'No synergy claims extracted from the spreadsheet.';
  } else if (fullyDefendedPct === 100) {
    summary = `All ${totalClaims} claims fully defended (mechanism + owner + milestone present). Apply base-rate realisation discount before underwriting.`;
  } else if (criticalAndHigh === totalClaims) {
    summary = `All ${totalClaims} claims under-defended at high or critical severity. The synergy model carries no structural anchors against the canonical Synergy Mirage failure mode.`;
  } else {
    summary = `${totalClaims} claims · ${severityCounts.critical} critical · ${severityCounts.high} high · ${severityCounts.medium} medium · ${severityCounts.low} fully defended (${fullyDefendedPct}%). The under-defended share is the Synergy Mirage exposure.`;
  }

  return { totalClaims, severityCounts, fullyDefendedPct, summary };
}
