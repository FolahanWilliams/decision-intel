/**
 * Bundle-safe bias-count snapshot (locked 2026-06-09 — cost/perf sweep).
 *
 * The canonical source of the taxonomy count is Object.keys(BIAS_EDUCATION)
 * .length, but bias-education.ts is ~41.5KB of education content — importing
 * it into a CLIENT component just for the integer ships the full taxonomy to
 * the visitor's browser. MarketingNav mounts on EVERY marketing page, so the
 * cost was paid by every visitor.
 *
 * Same pattern as platform-baseline-snapshot.ts: a tiny literal mirror whose
 * drift from canonical is caught by bias-count.test.ts in CI. When DI-B-023
 * lands in BIAS_EDUCATION, the test fails loudly and this literal is bumped
 * in the same commit (the bias-taxonomy cascade in CLAUDE.md gains one line).
 *
 * Rule: CLIENT components that only need the COUNT import from here. Anything
 * that needs the actual entries (TaxonomyClient, HowItWorksClient, the
 * Education Room) keeps importing BIAS_EDUCATION directly.
 */

// drift-tolerant — literal mirror of Object.keys(BIAS_EDUCATION).length;
// lockstep enforced by bias-count.test.ts.
export const BIAS_COUNT = 22;
