/**
 * Unit tests for the Brier scoring library.
 *
 * Covers the pure functions (no Prisma) — the aggregation function
 * `getOrgBrierStats()` is covered separately at the integration-test
 * layer because it touches the DB. The pure math and the categorisation
 * thresholds must never drift, because they back the "Brier scoring +
 * per-org calibration" claim the landing-page showcase and /security
 * page depend on.
 */

import { describe, it, expect } from 'vitest';
import {
  brierCategory,
  canonicalOutcome,
  computeBrier,
  OUTCOME_TO_ACTUAL,
  scoreOutcome,
} from './brier-scoring';

describe('canonicalOutcome', () => {
  it('accepts each canonical code verbatim', () => {
    expect(canonicalOutcome('success')).toBe('success');
    expect(canonicalOutcome('partial_success')).toBe('partial_success');
    expect(canonicalOutcome('inconclusive')).toBe('inconclusive');
    expect(canonicalOutcome('partial_failure')).toBe('partial_failure');
    expect(canonicalOutcome('failure')).toBe('failure');
  });

  it('normalises case + dashes', () => {
    expect(canonicalOutcome('Success')).toBe('success');
    expect(canonicalOutcome('PARTIAL-SUCCESS')).toBe('partial_success');
    expect(canonicalOutcome(' partial_failure ')).toBe('partial_failure');
  });

  it('maps "too_early" / "pending" to inconclusive (legacy nomenclature)', () => {
    expect(canonicalOutcome('too_early')).toBe('inconclusive');
    expect(canonicalOutcome('tooearly')).toBe('inconclusive');
    expect(canonicalOutcome('pending')).toBe('inconclusive');
  });

  it('falls back to inconclusive on unknown or empty input', () => {
    expect(canonicalOutcome('')).toBe('inconclusive');
    expect(canonicalOutcome(null)).toBe('inconclusive');
    expect(canonicalOutcome(undefined)).toBe('inconclusive');
    expect(canonicalOutcome('banana')).toBe('inconclusive');
  });
});

describe('computeBrier', () => {
  it('returns 0 for a perfectly-calibrated prediction', () => {
    // DQI 100 predicting success (actual = 1.0) → (1 - 1)² = 0
    expect(computeBrier(100, 'success')).toBe(0);
    // DQI 0 predicting failure (actual = 0.0) → (0 - 0)² = 0
    expect(computeBrier(0, 'failure')).toBe(0);
  });

  it('returns 1 for the worst-case miscalibration', () => {
    // DQI 100 predicting failure → (1 - 0)² = 1
    expect(computeBrier(100, 'failure')).toBe(1);
    // DQI 0 predicting success → (0 - 1)² = 1
    expect(computeBrier(0, 'success')).toBe(1);
  });

  it('returns 0.25 for an uncertain prediction (DQI 50) on a binary outcome', () => {
    // DQI 50 (p=0.5), outcome success (1.0) → (0.5 - 1)² = 0.25
    expect(computeBrier(50, 'success')).toBe(0.25);
    // Same on failure
    expect(computeBrier(50, 'failure')).toBe(0.25);
  });

  it('is 0 for DQI 50 on "inconclusive" — the one case where 50/50 is right', () => {
    expect(computeBrier(50, 'inconclusive')).toBe(0);
  });

  it('handles the full DQI → probability mapping', () => {
    // DQI 75 (p=0.75) predicting partial_success (0.75) → perfect
    expect(computeBrier(75, 'partial_success')).toBe(0);
    // DQI 25 (p=0.25) predicting partial_failure (0.25) → perfect
    expect(computeBrier(25, 'partial_failure')).toBe(0);
  });

  it('clamps out-of-range DQIs to [0, 100] so pipeline bugs do not produce NaN', () => {
    expect(computeBrier(-50, 'success')).toBe(1); // clamped to 0 → (0 - 1)² = 1
    expect(computeBrier(150, 'failure')).toBe(1); // clamped to 100 → (1 - 0)² = 1
    expect(computeBrier(NaN, 'success')).toBeGreaterThanOrEqual(0); // does not return NaN
  });

  it('rounds to four decimals so the stored value is stable', () => {
    // DQI 72 → p=0.72. outcome success → (0.72 - 1)² = 0.0784
    expect(computeBrier(72, 'success')).toBe(0.0784);
    // Should never return 17-significant-digit float noise
    const score = computeBrier(37, 'partial_success'); // (0.37 - 0.75)² = 0.1444
    expect(score).toBe(0.1444);
    expect(Number.isInteger(score * 10_000)).toBe(true);
  });
});

describe('brierCategory', () => {
  it('maps perfect scores to excellent', () => {
    expect(brierCategory(0)).toBe('excellent');
    expect(brierCategory(0.05)).toBe('excellent');
    expect(brierCategory(0.1)).toBe('excellent');
  });

  it('maps well-calibrated scores to good', () => {
    expect(brierCategory(0.11)).toBe('good');
    expect(brierCategory(0.15)).toBe('good');
    expect(brierCategory(0.2)).toBe('good');
  });

  it('maps middling scores to fair', () => {
    expect(brierCategory(0.21)).toBe('fair');
    expect(brierCategory(0.3)).toBe('fair');
    expect(brierCategory(0.35)).toBe('fair');
  });

  it('maps poorly-calibrated scores to poor', () => {
    expect(brierCategory(0.36)).toBe('poor');
    expect(brierCategory(0.5)).toBe('poor');
    expect(brierCategory(1)).toBe('poor');
  });
});

describe('scoreOutcome (integration of compute + category)', () => {
  it('returns both score and category in a single call', () => {
    const r = scoreOutcome(85, 'success');
    // DQI 85 → p=0.85, actual 1.0 → (0.85-1)² = 0.0225 → excellent
    expect(r.score).toBe(0.0225);
    expect(r.category).toBe('excellent');
  });

  it('surfaces a poor calibration when the prediction is wildly off', () => {
    const r = scoreOutcome(90, 'failure');
    // p=0.9, actual=0 → 0.81 → poor
    expect(r.score).toBe(0.81);
    expect(r.category).toBe('poor');
  });

  it('tracks Tetlock-superforecaster Brier (~0.13) as "good"', () => {
    // Sanity check: the intellectual anchor for the "good" band is
    // Tetlock's superforecaster average ~0.13. Confirm the category
    // boundaries keep honouring that claim.
    expect(brierCategory(0.13)).toBe('good');
  });
});

describe('OUTCOME_TO_ACTUAL mapping invariants', () => {
  it('success is 1.0, failure is 0.0, midpoint is 0.5', () => {
    // These are load-bearing for the math — if anyone changes them
    // without migrating historical Brier scores, every comparison
    // across time breaks. Hard-code the contract.
    expect(OUTCOME_TO_ACTUAL.success).toBe(1.0);
    expect(OUTCOME_TO_ACTUAL.failure).toBe(0.0);
    expect(OUTCOME_TO_ACTUAL.inconclusive).toBe(0.5);
    expect(OUTCOME_TO_ACTUAL.partial_success).toBe(0.75);
    expect(OUTCOME_TO_ACTUAL.partial_failure).toBe(0.25);
  });

  it('is monotonic in outcome quality', () => {
    expect(OUTCOME_TO_ACTUAL.failure).toBeLessThan(OUTCOME_TO_ACTUAL.partial_failure);
    expect(OUTCOME_TO_ACTUAL.partial_failure).toBeLessThan(OUTCOME_TO_ACTUAL.inconclusive);
    expect(OUTCOME_TO_ACTUAL.inconclusive).toBeLessThan(OUTCOME_TO_ACTUAL.partial_success);
    expect(OUTCOME_TO_ACTUAL.partial_success).toBeLessThan(OUTCOME_TO_ACTUAL.success);
  });
});
