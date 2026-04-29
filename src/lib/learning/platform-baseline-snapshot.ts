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
  /** Methodology version — bump alongside the formula in
   *  computeBrierFairPredictedDqi when it changes. */
  methodologyVersion: '2.0.0-seed' as const,
} as const;

/** ISO date the snapshot was last regenerated. Update with the constants. */
export const PLATFORM_BASELINE_SNAPSHOT_COMPUTED_AT = '2026-04-29';
