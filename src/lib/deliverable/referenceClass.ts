/**
 * Reference-class derivation for deliverable findings — the single source of
 * truth for "which historical cases ground this reasoning risk".
 *
 * Pure: takes a bias key, returns the top cases from the 143-case library that
 * carried that bias, failures first, ranked by impact. Used by the composer
 * (buildAuditDeliverable) to enrich each bias finding; both the always-on
 * FindingCards and the Decision-network graph render the SAME entries from the
 * composed payload, so the two surfaces can never drift.
 *
 * Honesty discipline (per the epistemic-honesty lock): a reference class is
 * correlational grounding — "this pattern has appeared here before" — never a
 * claim that the bias CAUSED this memo's outcome. Consumers must carry that
 * caveat in their copy.
 */

import { getCasesByBias } from '@/lib/data/case-studies';
import { isFailureOutcome, type CaseStudy } from '@/lib/data/case-studies/types';
import { getSlugForCase } from '@/lib/data/case-studies/slugs';
import type { ReferenceClassEntry } from './types';

function toEntry(c: CaseStudy): ReferenceClassEntry {
  return {
    id: c.id,
    company: c.company,
    year: c.year,
    estimatedImpact: c.estimatedImpact,
    slug: getSlugForCase(c),
    direction: c.impactDirection,
  };
}

/**
 * Top `limit` historical cases carrying `biasKey` — failures first, then by
 * impact magnitude. Returns [] when the bias has no library coverage.
 */
export function buildReferenceClass(biasKey: string, limit = 3): ReferenceClassEntry[] {
  return [...getCasesByBias(biasKey)]
    .sort((a, b) => {
      const af = isFailureOutcome(a.outcome) ? 1 : 0;
      const bf = isFailureOutcome(b.outcome) ? 1 : 0;
      if (af !== bf) return bf - af;
      return b.impactScore - a.impactScore;
    })
    .slice(0, limit)
    .map(toEntry);
}
