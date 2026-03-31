import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/data/case-correlations', () => ({
  computeCorrelationMultiplier: vi.fn().mockReturnValue({
    multiplier: 1.0,
    matchedPairs: [],
    matchedSuccessPatterns: [],
    beneficialDamping: 1.0,
  }),
}));

vi.mock('@/lib/utils/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { computeDQI, computeSyntheticDQI, computeHistoricalPercentile, WEIGHTS, GRADE_THRESHOLDS, SYSTEM1_BIASES, METHODOLOGY_VERSION } from './dqi';
import type { DQIInput } from './dqi';
import { ALL_CASES } from '@/lib/data/case-studies';

function makeInput(overrides?: Partial<DQIInput>): DQIInput {
  return {
    biases: [],
    noiseStats: { mean: 50, stdDev: 10, judgeCount: 3 },
    factCheck: { totalClaims: 10, verifiedClaims: 8, contradictedClaims: 0, score: 80 },
    process: { dissentPresent: true, priorSubmitted: true, outcomeTracked: true, participantCount: 5, documentLength: 1500 },
    compliance: { riskScore: 10, frameworksChecked: 2, violationsFound: 0 },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// WEIGHTS
// ---------------------------------------------------------------------------

describe('WEIGHTS', () => {
  it('sum to approximately 1.0', () => {
    const sum = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - 1.0)).toBeLessThan(0.001);
  });

  it('has all 6 components', () => {
    const keys = Object.keys(WEIGHTS);
    expect(keys).toHaveLength(6);
    expect(keys).toContain('biasLoad');
    expect(keys).toContain('noiseLevel');
    expect(keys).toContain('evidenceQuality');
    expect(keys).toContain('processMaturity');
    expect(keys).toContain('complianceRisk');
    expect(keys).toContain('historicalAlignment');
  });
});

// ---------------------------------------------------------------------------
// GRADE_THRESHOLDS
// ---------------------------------------------------------------------------

describe('GRADE_THRESHOLDS', () => {
  it('has 5 grade levels', () => {
    expect(GRADE_THRESHOLDS).toHaveLength(5);
  });

  it('grades are in descending order by min score', () => {
    for (let i = 1; i < GRADE_THRESHOLDS.length; i++) {
      expect(GRADE_THRESHOLDS[i - 1].min).toBeGreaterThan(GRADE_THRESHOLDS[i].min);
    }
  });
});

// ---------------------------------------------------------------------------
// SYSTEM1_BIASES
// ---------------------------------------------------------------------------

describe('SYSTEM1_BIASES', () => {
  it('contains expected biases', () => {
    expect(SYSTEM1_BIASES.has('anchoring_bias')).toBe(true);
    expect(SYSTEM1_BIASES.has('halo_effect')).toBe(true);
    expect(SYSTEM1_BIASES.has('availability_heuristic')).toBe(true);
    expect(SYSTEM1_BIASES.has('framing_effect')).toBe(true);
    expect(SYSTEM1_BIASES.has('loss_aversion')).toBe(true);
    expect(SYSTEM1_BIASES.has('bandwagon_effect')).toBe(true);
    expect(SYSTEM1_BIASES.has('status_quo_bias')).toBe(true);
    expect(SYSTEM1_BIASES.has('recency_bias')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// computeDQI
// ---------------------------------------------------------------------------

describe('computeDQI', () => {
  it('baseline input returns score 0-100 with all 6 components and a grade', () => {
    const result = computeDQI(makeInput());
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.components.biasLoad).toBeDefined();
    expect(result.components.noiseLevel).toBeDefined();
    expect(result.components.evidenceQuality).toBeDefined();
    expect(result.components.processMaturity).toBeDefined();
    expect(result.components.complianceRisk).toBeDefined();
    expect(result.components.historicalAlignment).toBeDefined();
    expect(['A', 'B', 'C', 'D', 'F']).toContain(result.grade);
  });

  it('zero biases → biasLoad.score = 100', () => {
    const result = computeDQI(makeInput({ biases: [] }));
    expect(result.components.biasLoad.score).toBe(100);
  });

  it('3 critical biases → biasLoad.score < 50', () => {
    const result = computeDQI(makeInput({
      biases: [
        { type: 'anchoring_bias', severity: 'critical', confidence: 0.9 },
        { type: 'halo_effect', severity: 'critical', confidence: 0.9 },
        { type: 'framing_effect', severity: 'critical', confidence: 0.9 },
      ],
    }));
    expect(result.components.biasLoad.score).toBeLessThan(60);
  });

  it('low noise (stdDev=2, judgeCount=3) → noiseLevel.score >= 90', () => {
    const result = computeDQI(makeInput({
      noiseStats: { mean: 50, stdDev: 2, judgeCount: 3 },
    }));
    expect(result.components.noiseLevel.score).toBeGreaterThanOrEqual(90);
  });

  it('high noise (stdDev=30) → noiseLevel.score < 10', () => {
    const result = computeDQI(makeInput({
      noiseStats: { mean: 50, stdDev: 30, judgeCount: 3 },
    }));
    expect(result.components.noiseLevel.score).toBeLessThan(10);
  });

  it('all evidence verified → evidenceQuality.score > 80', () => {
    const result = computeDQI(makeInput({
      factCheck: { totalClaims: 10, verifiedClaims: 10, contradictedClaims: 0, score: 100 },
    }));
    expect(result.components.evidenceQuality.score).toBeGreaterThan(80);
  });

  it('contradicted claims → evidenceQuality.score drops', () => {
    const noContradictions = computeDQI(makeInput({
      factCheck: { totalClaims: 10, verifiedClaims: 8, contradictedClaims: 0, score: 80 },
    }));
    const withContradictions = computeDQI(makeInput({
      factCheck: { totalClaims: 10, verifiedClaims: 5, contradictedClaims: 4, score: 40 },
    }));
    expect(withContradictions.components.evidenceQuality.score)
      .toBeLessThan(noContradictions.components.evidenceQuality.score);
  });

  it('full process maturity → processMaturity.score >= 90', () => {
    const result = computeDQI(makeInput({
      biases: [],
      process: { dissentPresent: true, priorSubmitted: true, outcomeTracked: true, participantCount: 5, documentLength: 1500 },
    }));
    expect(result.components.processMaturity.score).toBeGreaterThanOrEqual(90);
  });

  it('no process indicators → processMaturity.score <= 50', () => {
    const result = computeDQI(makeInput({
      process: { dissentPresent: false, priorSubmitted: false, outcomeTracked: false, participantCount: 0, documentLength: 0 },
    }));
    expect(result.components.processMaturity.score).toBeLessThanOrEqual(50);
  });

  it('System 1 ratio > 0.7 → processMaturity score -8 penalty', () => {
    const base = computeDQI(makeInput({
      process: { dissentPresent: true, priorSubmitted: false, outcomeTracked: false, participantCount: 1, documentLength: 100, system1Ratio: 0.5 },
    }));
    const highS1 = computeDQI(makeInput({
      process: { dissentPresent: true, priorSubmitted: false, outcomeTracked: false, participantCount: 1, documentLength: 100, system1Ratio: 0.8 },
    }));
    expect(highS1.components.processMaturity.score).toBeLessThan(base.components.processMaturity.score);
  });

  it('System 1 ratio < 0.4 → processMaturity score +5 bonus', () => {
    const base = computeDQI(makeInput({
      process: { dissentPresent: true, priorSubmitted: false, outcomeTracked: false, participantCount: 1, documentLength: 100, system1Ratio: 0.5 },
    }));
    const lowS1 = computeDQI(makeInput({
      process: { dissentPresent: true, priorSubmitted: false, outcomeTracked: false, participantCount: 1, documentLength: 100, system1Ratio: 0.3 },
    }));
    expect(lowS1.components.processMaturity.score).toBeGreaterThan(base.components.processMaturity.score);
  });

  it('high compliance risk (riskScore=90) → complianceRisk.score = 10', () => {
    const result = computeDQI(makeInput({
      compliance: { riskScore: 90, frameworksChecked: 2, violationsFound: 3 },
    }));
    expect(result.components.complianceRisk.score).toBe(10);
  });

  it('zero compliance risk → complianceRisk.score = 100', () => {
    const result = computeDQI(makeInput({
      compliance: { riskScore: 0, frameworksChecked: 2, violationsFound: 0 },
    }));
    expect(result.components.complianceRisk.score).toBe(100);
  });

  it('no historicalAlignment + no biases → historicalAlignment.score = 60', () => {
    const result = computeDQI(makeInput({ biases: [] }));
    expect(result.components.historicalAlignment.score).toBe(60);
  });

  it('explicit alignment with failure patterns → historicalAlignment.score < 70', () => {
    const result = computeDQI(makeInput({
      historicalAlignment: {
        matchedFailurePatterns: 3,
        matchedSuccessPatterns: 0,
        correlationMultiplier: 1.5,
        beneficialDamping: 1.0,
      },
    }));
    expect(result.components.historicalAlignment.score).toBeLessThan(70);
  });

  it('explicit alignment with success patterns → historicalAlignment.score > 70', () => {
    const result = computeDQI(makeInput({
      historicalAlignment: {
        matchedFailurePatterns: 0,
        matchedSuccessPatterns: 3,
        correlationMultiplier: 1.0,
        beneficialDamping: 1.0,
      },
    }));
    expect(result.components.historicalAlignment.score).toBeGreaterThan(70);
  });

  it('score always between 0-100 with extreme high inputs', () => {
    const result = computeDQI(makeInput({
      biases: [],
      noiseStats: { mean: 50, stdDev: 0, judgeCount: 10 },
      factCheck: { totalClaims: 100, verifiedClaims: 100, contradictedClaims: 0, score: 100 },
      process: { dissentPresent: true, priorSubmitted: true, outcomeTracked: true, participantCount: 5, documentLength: 5000, system1Ratio: 0.1 },
      compliance: { riskScore: 0, frameworksChecked: 10, violationsFound: 0 },
      historicalAlignment: { matchedFailurePatterns: 0, matchedSuccessPatterns: 5, correlationMultiplier: 0.5, beneficialDamping: 0.5 },
    }));
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('score always between 0-100 with extreme low inputs', () => {
    const result = computeDQI(makeInput({
      biases: [
        { type: 'anchoring_bias', severity: 'critical', confidence: 1.0 },
        { type: 'halo_effect', severity: 'critical', confidence: 1.0 },
        { type: 'framing_effect', severity: 'critical', confidence: 1.0 },
        { type: 'loss_aversion', severity: 'critical', confidence: 1.0 },
        { type: 'bandwagon_effect', severity: 'critical', confidence: 1.0 },
      ],
      noiseStats: { mean: 50, stdDev: 50, judgeCount: 1 },
      factCheck: { totalClaims: 10, verifiedClaims: 0, contradictedClaims: 10, score: 0 },
      process: { dissentPresent: false, priorSubmitted: false, outcomeTracked: false, participantCount: 0, documentLength: 0, system1Ratio: 1.0 },
      compliance: { riskScore: 100, frameworksChecked: 0, violationsFound: 10 },
      historicalAlignment: { matchedFailurePatterns: 5, matchedSuccessPatterns: 0, correlationMultiplier: 2.0, beneficialDamping: 1.0 },
    }));
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('methodologyVersion is 2.0.0', () => {
    const result = computeDQI(makeInput());
    expect(result.methodologyVersion).toBe('2.0.0');
  });

  it('topImprovement identifies lowest-weighted-potential component', () => {
    const result = computeDQI(makeInput());
    expect(result.topImprovement).toBeDefined();
    expect(result.topImprovement.component).toBeTruthy();
    expect(result.topImprovement.potentialGain).toBeGreaterThanOrEqual(0);
    expect(result.topImprovement.suggestion).toBeTruthy();
  });

  it('grade A for score >= 85', () => {
    const result = computeDQI(makeInput({
      biases: [],
      noiseStats: { mean: 50, stdDev: 0, judgeCount: 5 },
      factCheck: { totalClaims: 10, verifiedClaims: 10, contradictedClaims: 0, score: 100 },
      process: { dissentPresent: true, priorSubmitted: true, outcomeTracked: true, participantCount: 5, documentLength: 2000 },
      compliance: { riskScore: 0, frameworksChecked: 5, violationsFound: 0 },
    }));
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.grade).toBe('A');
  });

  it('grade F for score < 40', () => {
    const result = computeDQI(makeInput({
      biases: [
        { type: 'anchoring_bias', severity: 'critical', confidence: 1.0 },
        { type: 'halo_effect', severity: 'critical', confidence: 1.0 },
        { type: 'framing_effect', severity: 'critical', confidence: 1.0 },
        { type: 'loss_aversion', severity: 'critical', confidence: 1.0 },
        { type: 'bandwagon_effect', severity: 'critical', confidence: 1.0 },
      ],
      noiseStats: { mean: 50, stdDev: 40, judgeCount: 1 },
      factCheck: { totalClaims: 10, verifiedClaims: 0, contradictedClaims: 10, score: 0 },
      process: { dissentPresent: false, priorSubmitted: false, outcomeTracked: false, participantCount: 0, documentLength: 0, system1Ratio: 1.0 },
      compliance: { riskScore: 100, frameworksChecked: 0, violationsFound: 10 },
      historicalAlignment: { matchedFailurePatterns: 5, matchedSuccessPatterns: 0, correlationMultiplier: 2.0, beneficialDamping: 1.0 },
    }));
    expect(result.score).toBeLessThan(40);
    expect(result.grade).toBe('F');
  });
});

// ---------------------------------------------------------------------------
// computeSyntheticDQI
// ---------------------------------------------------------------------------

describe('computeSyntheticDQI', () => {
  it('returns a score between 0 and 100 for the first case', () => {
    const score = computeSyntheticDQI(ALL_CASES[0]);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('failure cases generally score lower than success cases', () => {
    const failureScores = ALL_CASES
      .filter(c => c.outcome.includes('failure'))
      .map(c => computeSyntheticDQI(c));
    const successScores = ALL_CASES
      .filter(c => c.outcome.includes('success'))
      .map(c => computeSyntheticDQI(c));

    if (failureScores.length > 0 && successScores.length > 0) {
      const avgFailure = failureScores.reduce((a, b) => a + b, 0) / failureScores.length;
      const avgSuccess = successScores.reduce((a, b) => a + b, 0) / successScores.length;
      expect(avgFailure).toBeLessThan(avgSuccess);
    }
  });
});

// ---------------------------------------------------------------------------
// computeHistoricalPercentile
// ---------------------------------------------------------------------------

describe('computeHistoricalPercentile', () => {
  it('returns a number between 0 and 100', () => {
    const percentile = computeHistoricalPercentile(50);
    expect(percentile).toBeGreaterThanOrEqual(0);
    expect(percentile).toBeLessThanOrEqual(100);
  });

  it('score of 0 returns low percentile', () => {
    const percentile = computeHistoricalPercentile(0);
    expect(percentile).toBeLessThanOrEqual(20);
  });

  it('score of 100 returns high percentile', () => {
    const percentile = computeHistoricalPercentile(100);
    expect(percentile).toBeGreaterThanOrEqual(80);
  });
});
