/**
 * Platform Calibration Baseline — bundle-safe snapshot
 *
 * The canonical computation lives in `platform-baseline.ts` and imports
 * the full case-study library (~750KB). Client bundles cannot pay that
 * cost just to render a Brier number on the landing-page credibility
 * strip, so this file pins the same numbers as plain literals + a tiny
 * shape that costs ~200 bytes in the bundle.
 *
 * REGENERATION
 * ────────────
 * Whenever `ALL_CASES` (the case-study library) OR
 * `computeBrierFairPredictedDqi` (the per-case predicted-DQI formula)
 * changes:
 *
 *   1. Run `npm run regen:baseline-snapshot` (or copy the values from
 *      the test output of `src/lib/learning/platform-baseline.test.ts`).
 *   2. Update the constants below to match.
 *   3. The drift test in `platform-baseline-snapshot.test.ts` will catch
 *      any divergence between this file and the live function and fail
 *      CI.
 *
 * The snapshot is the safe-to-import shape for client components and
 * any module that wants the calibration numbers without paying the
 * case-library bundle cost. Server components and API routes should
 * call `computePlatformCalibrationBaseline()` directly so they always
 * see the live value.
 */

export const PLATFORM_BASELINE_SNAPSHOT = {
  /** Total cases in the corpus when this snapshot was last regenerated. */
  n: 143,
  /** Mean Brier score across the corpus. Tetlock superforecasters ~0.13;
   *  CIA analysts ~0.23; coin-flip 0.25. */
  meanBrier: 0.258,
  /** Median Brier — comparable shape to mean. */
  medianBrier: 0.26,
  /** brierCategory bucket for the mean. excellent ≤ 0.10, good ≤ 0.20,
   *  fair ≤ 0.35, poor > 0.35. */
  meanCategory: 'fair' as const,
  /** Classification accuracy at the C/D grade boundary (DQI 55). */
  classificationAccuracy: 0.524,
  /** correct / scored — the numerator/denominator behind the percentage. */
  classificationCounts: { correct: 75, scored: 143 },
  /** 95% CI on the mean Brier from a 10,000-iteration bootstrap with
   *  replacement, seeded mulberry32. halfWidth is the ±X figure that
   *  surfaces in marketing copy. */
  brierCi95: { lower: 0.245, upper: 0.27, halfWidth: 0.012 },
  /** Iterations used to derive `brierCi95` (deterministic via seed). */
  bootstrapIterations: 10_000,
  /** Pinned seed so a procurement auditor can reproduce the CI. */
  bootstrapSeed: 17_039_507,
  /** Methodology version — bump alongside the formula in
   *  computeBrierFairPredictedDqi when it changes. */
  methodologyVersion: '2.0.0-seed' as const,
} as const;

/** ISO date the snapshot was last regenerated. Update with the constants. */
export const PLATFORM_BASELINE_SNAPSHOT_COMPUTED_AT = '2026-04-30';

/**
 * Procurement-grade methodology footnote — Margaret + James persona ask.
 * Mirrors `formatCalibrationFootnote` in platform-baseline.ts but uses the
 * snapshot literals so client bundles can render it without paying the
 * case-library bundle cost. The snapshot drift test in
 * `platform-baseline-snapshot.test.ts` keeps this and the live function
 * in lock-step.
 */
export const PLATFORM_BASELINE_FOOTNOTE = `n = ${PLATFORM_BASELINE_SNAPSHOT.n} historical corporate decisions · mean Brier ${PLATFORM_BASELINE_SNAPSHOT.meanBrier.toFixed(3)} ± ${PLATFORM_BASELINE_SNAPSHOT.brierCi95.halfWidth.toFixed(3)} (95% CI, ${PLATFORM_BASELINE_SNAPSHOT.bootstrapIterations.toLocaleString('en-US')}-iteration bootstrap, seed ${PLATFORM_BASELINE_SNAPSHOT.bootstrapSeed}) · methodology v${PLATFORM_BASELINE_SNAPSHOT.methodologyVersion} · computed ${PLATFORM_BASELINE_SNAPSHOT_COMPUTED_AT}`;
