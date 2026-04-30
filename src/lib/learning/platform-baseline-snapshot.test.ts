import { describe, expect, it } from 'vitest';
import { computePlatformCalibrationBaseline } from './platform-baseline';
import { PLATFORM_BASELINE_SNAPSHOT } from './platform-baseline-snapshot';

/**
 * Drift test for the bundle-safe snapshot of the platform calibration
 * baseline. The snapshot literals in `platform-baseline-snapshot.ts`
 * power client surfaces (landing credibility strip) that can't afford
 * to import the full case library; this test asserts they stay in
 * sync with the live function.
 *
 * If this test fails after a case-library change or a formula change:
 *   1. Read the actual baseline numbers from
 *      `npx vitest run src/lib/learning/platform-baseline.test.ts`.
 *   2. Update the literals in `platform-baseline-snapshot.ts`.
 *   3. Update `PLATFORM_BASELINE_SNAPSHOT_COMPUTED_AT` to today's ISO date.
 */
describe('platform-baseline-snapshot drift', () => {
  it('snapshot literals match the live computation', () => {
    const live = computePlatformCalibrationBaseline();
    const snap = PLATFORM_BASELINE_SNAPSHOT;

    // Allow tiny rounding drift on the floats — within 0.005 (half a
    // basis point) is below display precision and not a real signal.
    expect(snap.n).toBe(live.n);
    expect(Math.abs(snap.meanBrier - live.meanBrier)).toBeLessThanOrEqual(0.005);
    expect(Math.abs(snap.medianBrier - live.medianBrier)).toBeLessThanOrEqual(0.005);
    expect(snap.meanCategory).toBe(live.meanCategory);
    expect(Math.abs(snap.classificationAccuracy - live.classificationAccuracy)).toBeLessThanOrEqual(
      0.005
    );
    expect(snap.classificationCounts.correct).toBe(live.classificationCounts.correct);
    expect(snap.classificationCounts.scored).toBe(live.classificationCounts.scored);
    expect(snap.methodologyVersion).toBe(live.methodologyVersion);
    // Bootstrap CI fields — seeded mulberry32 means the CI is fully
    // deterministic, so the literals must match exactly to within
    // display rounding. The drift test catches any silent change to
    // either the sample variance OR the bootstrap seed.
    expect(Math.abs(snap.brierCi95.lower - live.brierCi95.lower)).toBeLessThanOrEqual(0.005);
    expect(Math.abs(snap.brierCi95.upper - live.brierCi95.upper)).toBeLessThanOrEqual(0.005);
    expect(Math.abs(snap.brierCi95.halfWidth - live.brierCi95.halfWidth)).toBeLessThanOrEqual(
      0.005
    );
    expect(snap.bootstrapIterations).toBe(live.bootstrapIterations);
    expect(snap.bootstrapSeed).toBe(live.bootstrapSeed);
  });
});
