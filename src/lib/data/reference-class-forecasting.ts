/**
 * Reference Class Forecasting (Flyvbjerg / Kahneman "Outside View")
 *
 * Instead of forecasting deal success from inside-view deal specifics,
 * pull the base rate from the comparable historical reference class.
 *
 * Source data: the 146 curated case studies in src/lib/data/case-studies.
 * All math is deterministic and runs at import time on the client — no
 * network, no DB, no async.
 */

import { ALL_CASES, type CaseStudy, type Industry } from './case-studies';
import { isFailureOutcome, isSuccessOutcome } from './case-studies/types';

// Map Deal.sector strings (from the Deal model) onto case-study Industry.
// Deal.sector values: technology | healthcare | industrials | consumer |
// financial_services | energy. Case-study Industry has a wider taxonomy.
const SECTOR_TO_INDUSTRY: Record<string, Industry[]> = {
  technology: ['technology'],
  healthcare: ['healthcare'],
  industrials: ['manufacturing', 'aerospace', 'automotive'],
  consumer: ['retail', 'entertainment', 'media'],
  financial_services: ['financial_services'],
  energy: ['energy'],
};

// Ticket size buckets roughly match DEAL_AUDIT_TIERS in src/lib/stripe.ts
// (Emerging < $10M, Growth < $50M, Core < $200M, Flagship $200M+) but
// relaxed a bit since case studies span more stake levels.
export type StakeBucket = 'small' | 'mid' | 'large' | 'mega';

const STAKE_BUCKETS: Array<{ id: StakeBucket; label: string; monetaryStakes: Array<'low' | 'medium' | 'high' | 'very_high'> }> = [
  { id: 'small', label: 'Emerging (<$10M)', monetaryStakes: ['low', 'medium'] },
  { id: 'mid', label: 'Growth (<$50M)', monetaryStakes: ['medium', 'high'] },
  { id: 'large', label: 'Core (<$200M)', monetaryStakes: ['high', 'very_high'] },
  { id: 'mega', label: 'Flagship ($200M+)', monetaryStakes: ['very_high'] },
];

export function bucketForTicketSize(ticketSize: number | null | undefined): StakeBucket | null {
  if (ticketSize == null || !Number.isFinite(ticketSize)) return null;
  if (ticketSize < 10_000_000) return 'small';
  if (ticketSize < 50_000_000) return 'mid';
  if (ticketSize < 200_000_000) return 'large';
  return 'mega';
}

export interface ReferenceClass {
  /** Human-readable label, e.g. "Technology, Core ($10M–$200M)" */
  label: string;
  /** How the reference class was narrowed: 'industry+stakes' | 'industry' | 'global' */
  matchedBy: 'industry+stakes' | 'industry' | 'global';
  /** Cases in the reference class */
  cases: CaseStudy[];
  /** Total cases in the class */
  n: number;
  /** Share of cases with a failure outcome (0-1) */
  failureRate: number;
  /** Share of cases with a success outcome (0-1) */
  successRate: number;
  /** Top 3 representative failures for the panel */
  topFailures: CaseStudy[];
  /** Top 3 representative successes for the panel */
  topSuccesses: CaseStudy[];
}

export interface ReferenceClassInput {
  /** Deal.sector string, if the document is linked to a deal */
  sector?: string | null;
  /** Deal.ticketSize in USD, if available */
  ticketSize?: number | null;
}

/**
 * Compute a reference class for the given input. Narrowing order:
 *   1. industry + stake bucket (if both available and >= MIN_N cases)
 *   2. industry alone (if >= MIN_N cases)
 *   3. global base rate across all case studies
 */
export function computeReferenceClass(input: ReferenceClassInput): ReferenceClass {
  const MIN_N = 6;

  const industries = input.sector ? SECTOR_TO_INDUSTRY[input.sector] ?? [] : [];
  const bucket = bucketForTicketSize(input.ticketSize);
  const bucketDef = bucket ? STAKE_BUCKETS.find(b => b.id === bucket) : null;

  // 1. Narrowest: industry + stake bucket
  if (industries.length > 0 && bucketDef) {
    const narrow = ALL_CASES.filter(
      c =>
        industries.includes(c.industry) &&
        bucketDef.monetaryStakes.includes(c.contextFactors.monetaryStakes)
    );
    if (narrow.length >= MIN_N) {
      return buildClass(narrow, `${formatIndustries(industries)}, ${bucketDef.label}`, 'industry+stakes');
    }
  }

  // 2. Industry only
  if (industries.length > 0) {
    const industryOnly = ALL_CASES.filter(c => industries.includes(c.industry));
    if (industryOnly.length >= MIN_N) {
      return buildClass(industryOnly, formatIndustries(industries), 'industry');
    }
  }

  // 3. Global base rate
  return buildClass(ALL_CASES, 'All industries and stake levels', 'global');
}

function buildClass(cases: CaseStudy[], label: string, matchedBy: ReferenceClass['matchedBy']): ReferenceClass {
  const failures = cases.filter(c => isFailureOutcome(c.outcome));
  const successes = cases.filter(c => isSuccessOutcome(c.outcome));
  const n = cases.length;

  // Sort by impactScore desc so the highlighted examples are the most
  // memorable ones in the class.
  const topFailures = [...failures].sort((a, b) => b.impactScore - a.impactScore).slice(0, 3);
  const topSuccesses = [...successes].sort((a, b) => b.impactScore - a.impactScore).slice(0, 3);

  return {
    label,
    matchedBy,
    cases,
    n,
    failureRate: n > 0 ? failures.length / n : 0,
    successRate: n > 0 ? successes.length / n : 0,
    topFailures,
    topSuccesses,
  };
}

function formatIndustries(industries: Industry[]): string {
  return industries
    .map(i =>
      i
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    )
    .join(' / ');
}
