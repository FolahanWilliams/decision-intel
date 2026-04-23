/**
 * Reference-class forecast — compute which historical cases in the seed
 * corpus this memo resembles based on overlapping bias signature. Pure
 * function, no IO, client-safe.
 *
 * The 135-case figure referenced in marketing is the deduped corpus
 * count locked 2026-04-16. This function uses the live ALL_CASES length
 * so the numbers stay truthful even when the corpus is rebalanced.
 *
 * "Match" = case shares ≥ MIN_OVERLAP biases with the memo. Bias-signature
 * overlap is a coarse proxy for strategic analogy; it's defensible at a
 * demo because every input is traceable to a concrete case study.
 */

import { ALL_CASES, isFailureOutcome, type CaseStudy } from '@/lib/data/case-studies';
import { getSlugForCase } from '@/lib/data/case-studies/slugs';

const MIN_OVERLAP_STRONG = 2;
const MIN_OVERLAP_FALLBACK = 1;

export interface ReferenceClassResult {
  /** Corpus size at compute time — use directly instead of hardcoding 135. */
  corpusSize: number;
  /** Cases matching the bias signature at the tighter threshold. */
  matches: number;
  /** Subset of `matches` that failed. */
  failures: number;
  /** Subset of `matches` that succeeded. */
  successes: number;
  /** failures / matches (0..1), or null when matches === 0. */
  failureRate: number | null;
  /** 'strong' = ≥ MIN_OVERLAP_STRONG biases overlap; 'loose' = fallback; 'none' = no overlap. */
  band: 'strong' | 'loose' | 'none';
  /** Top matching cases, sorted by overlap desc then year desc. At most `limit`. */
  topMatches: Array<{
    slug: string;
    company: string;
    year: number;
    outcome: CaseStudy['outcome'];
    overlap: string[];
  }>;
}

function intersect(a: string[], b: string[]): string[] {
  const set = new Set(a);
  return b.filter(x => set.has(x));
}

export function computeReferenceClass(
  biasTypes: string[],
  options?: { limit?: number }
): ReferenceClassResult {
  const limit = options?.limit ?? 3;
  const corpusSize = ALL_CASES.length;

  if (biasTypes.length === 0) {
    return {
      corpusSize,
      matches: 0,
      failures: 0,
      successes: 0,
      failureRate: null,
      band: 'none',
      topMatches: [],
    };
  }

  // Score every case by overlap size.
  const scored = ALL_CASES.map(c => {
    const overlap = intersect(biasTypes, c.biasesPresent);
    return { case: c, overlap };
  }).filter(s => s.overlap.length > 0);

  const strongMatches = scored.filter(s => s.overlap.length >= MIN_OVERLAP_STRONG);
  const band: ReferenceClassResult['band'] =
    strongMatches.length > 0
      ? 'strong'
      : scored.some(s => s.overlap.length >= MIN_OVERLAP_FALLBACK)
        ? 'loose'
        : 'none';

  const matchPool = band === 'strong' ? strongMatches : band === 'loose' ? scored : [];

  const failures = matchPool.filter(s => isFailureOutcome(s.case.outcome)).length;
  const successes = matchPool.length - failures;
  const failureRate = matchPool.length === 0 ? null : failures / matchPool.length;

  const topMatches = [...matchPool]
    .sort((a, b) => {
      if (b.overlap.length !== a.overlap.length) {
        return b.overlap.length - a.overlap.length;
      }
      return b.case.year - a.case.year;
    })
    .slice(0, limit)
    .map(s => ({
      slug: getSlugForCase(s.case),
      company: s.case.company,
      year: s.case.year,
      outcome: s.case.outcome,
      overlap: s.overlap,
    }));

  return {
    corpusSize,
    matches: matchPool.length,
    failures,
    successes,
    failureRate,
    band,
    topMatches,
  };
}
