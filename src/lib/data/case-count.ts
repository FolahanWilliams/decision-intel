/**
 * Bundle-safe historical-case-count snapshot (locked 2026-06-09 — cost/perf
 * sweep, sibling of src/lib/constants/bias-count.ts).
 *
 * The canonical source is HISTORICAL_CASE_COUNT = ALL_CASES.length in
 * src/lib/data/case-studies/index.ts — but that module graph is ~170KB of
 * case content. Importing it into a CLIENT component for one integer ships
 * the full 143-case library to the visitor's browser; MarketingNav mounts on
 * EVERY marketing page.
 *
 * Same pattern as platform-baseline-snapshot.ts: a literal mirror whose
 * drift from canonical is caught by case-count.test.ts in CI. When the case
 * library grows, the test fails loudly and this literal is bumped in the
 * same commit.
 *
 * Rule: CLIENT components that only need the COUNT import from here.
 * Anything that needs actual cases (ProofPageClient, CaseStudyCarousel,
 * the bias-genome seed) keeps importing from case-studies directly.
 */

// drift-tolerant — literal mirror of ALL_CASES.length;
// lockstep enforced by case-count.test.ts.
export const HISTORICAL_CASE_COUNT_SNAPSHOT = 143;
