import { describe, expect, it } from 'vitest';
import {
  computePlatformCalibrationBaseline,
  computeBrierFairPredictedDqi,
  mapCaseOutcomeToCode,
  formatBaselineLine,
  formatClassificationLine,
} from './platform-baseline';
import { ALL_CASES } from '@/lib/data/case-studies';

describe('platform-baseline', () => {
  describe('mapCaseOutcomeToCode', () => {
    it('collapses six-value CaseOutcome onto the five-value OutcomeCode', () => {
      expect(mapCaseOutcomeToCode('success')).toBe('success');
      expect(mapCaseOutcomeToCode('exceptional_success')).toBe('success');
      expect(mapCaseOutcomeToCode('partial_success')).toBe('partial_success');
      expect(mapCaseOutcomeToCode('partial_failure')).toBe('partial_failure');
      expect(mapCaseOutcomeToCode('failure')).toBe('failure');
      expect(mapCaseOutcomeToCode('catastrophic_failure')).toBe('failure');
    });
  });

  describe('computeBrierFairPredictedDqi', () => {
    it('does not peek at outcome — same predicted DQI regardless of outcome label', () => {
      // A case with the same biases + context factors should score the
      // same predicted DQI whether it ended in success or failure.
      const caseWithBiases = ALL_CASES.find(
        c => c.biasesPresent.length > 0 && c.contextFactors !== undefined
      );
      expect(caseWithBiases).toBeDefined();
      if (!caseWithBiases) return;

      const baseScore = computeBrierFairPredictedDqi(caseWithBiases);
      const successClone = { ...caseWithBiases, outcome: 'success' as const };
      const failureClone = { ...caseWithBiases, outcome: 'failure' as const };

      expect(computeBrierFairPredictedDqi(successClone)).toBe(baseScore);
      expect(computeBrierFairPredictedDqi(failureClone)).toBe(baseScore);
    });

    it('returns scores in [0, 100]', () => {
      for (const c of ALL_CASES) {
        const score = computeBrierFairPredictedDqi(c);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }
    });

    it('penalises bias load — more biases yields a lower predicted DQI', () => {
      const cleanCase = ALL_CASES[0];
      const heavyClone = { ...cleanCase, biasesPresent: Array(20).fill('confirmation_bias') };
      const cleanClone = { ...cleanCase, biasesPresent: [] };

      expect(computeBrierFairPredictedDqi(heavyClone)).toBeLessThan(
        computeBrierFairPredictedDqi(cleanClone)
      );
    });
  });

  describe('computePlatformCalibrationBaseline', () => {
    it('scores every case in the library', () => {
      const baseline = computePlatformCalibrationBaseline();
      expect(baseline.n).toBe(ALL_CASES.length);
      expect(baseline.n).toBeGreaterThanOrEqual(143);
    });

    it('returns a defensible mean Brier in [0, 1]', () => {
      const baseline = computePlatformCalibrationBaseline();
      expect(baseline.meanBrier).toBeGreaterThanOrEqual(0);
      expect(baseline.meanBrier).toBeLessThanOrEqual(1);
      expect(baseline.medianBrier).toBeGreaterThanOrEqual(0);
      expect(baseline.medianBrier).toBeLessThanOrEqual(1);
    });

    it('mean Brier sits in the fair band or better (≤ 0.30)', () => {
      // The seed methodology uses bias-load + context factors only, with
      // evidenceQuality neutralised to avoid hindsight peeking. Tetlock's
      // brierCategory thresholds bucket scores at 0.10 / 0.20 / 0.35 —
      // we require the corpus mean to land in 'fair' or better. The
      // narrative: today's seed beats 'poor', target is to converge
      // toward the 'good' / 'excellent' bands as customer outcomes
      // accumulate via Outcome Gate enforcement.
      const baseline = computePlatformCalibrationBaseline();
      expect(baseline.meanBrier).toBeLessThanOrEqual(0.3);
      expect(['excellent', 'good', 'fair']).toContain(baseline.meanCategory);
    });

    it('classification accuracy beats coin-flip (> 0.5)', () => {
      // The Brier number is the academic anchor; classification accuracy
      // at the C/D boundary (DQI 55) is the more procurement-readable
      // shape of the same evidence. A methodology that beats coin-flip
      // on a labelled corpus is the minimum bar; we expect substantial
      // headroom.
      const baseline = computePlatformCalibrationBaseline();
      expect(baseline.classificationAccuracy).toBeGreaterThan(0.5);
      expect(baseline.classificationCounts.scored).toBeGreaterThan(0);
      expect(baseline.classificationCounts.correct).toBe(
        Math.round(baseline.classificationAccuracy * baseline.classificationCounts.scored)
      );
    });

    it('distribution counts sum to n', () => {
      const baseline = computePlatformCalibrationBaseline();
      const sum =
        baseline.distribution.excellent +
        baseline.distribution.good +
        baseline.distribution.fair +
        baseline.distribution.poor;
      expect(sum).toBe(baseline.n);
    });

    it('byOutcome breakdown only includes outcome codes that appear in the corpus', () => {
      const baseline = computePlatformCalibrationBaseline();
      for (const entry of baseline.byOutcome) {
        expect(entry.n).toBeGreaterThan(0);
        expect(entry.meanBrier).toBeGreaterThanOrEqual(0);
        expect(entry.meanBrier).toBeLessThanOrEqual(1);
      }
      const totalCovered = baseline.byOutcome.reduce((s, e) => s + e.n, 0);
      expect(totalCovered).toBe(baseline.n);
    });

    it('caches across calls — returns identical object reference', () => {
      const a = computePlatformCalibrationBaseline();
      const b = computePlatformCalibrationBaseline();
      expect(a).toBe(b);
    });

    it('methodology version + data source are stable identifiers', () => {
      const baseline = computePlatformCalibrationBaseline();
      expect(baseline.methodologyVersion).toBe('2.0.0-seed');
      expect(baseline.dataSource).toBe('seed-case-studies');
    });
  });

  describe('formatBaselineLine', () => {
    it('renders the canonical procurement-grade line', () => {
      const baseline = computePlatformCalibrationBaseline();
      const line = formatBaselineLine(baseline);
      expect(line).toMatch(/^Platform calibration baseline · Brier \d\.\d{3}/);
      expect(line).toMatch(/over \d+ audited corporate decisions$/);
    });
  });
});

describe('formatClassificationLine', () => {
  it('renders the procurement-readable accuracy line', () => {
    const baseline = computePlatformCalibrationBaseline();
    const line = formatClassificationLine(baseline);
    expect(line).toMatch(/^\d+% classification accuracy/);
    expect(line).toMatch(/of \d+ historical decisions\)$/);
  });
});
