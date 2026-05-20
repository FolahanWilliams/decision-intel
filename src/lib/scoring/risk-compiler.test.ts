/**
 * risk-compiler.test.ts — unit tests for the pure-math helpers extracted
 * from riskScorerNode (2026-05-20 refactor).
 *
 * Coverage scope is the PURE helpers only — the Prisma-dependent loaders
 * + the compound/bayesian wrappers are covered by the broader nodes.test.ts
 * + the dqi-distribution-check regression suite (both untouched, both
 * still green). The intent of this file is to lock the math of the
 * extracted penalties + the score-composition order so a future inlining
 * of "fix" math can't drift without these tests catching it.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateNoisePenalty,
  calculateTrustPenalty,
  calculateLogicPenalty,
  calculateEchoChamberPenalty,
  composeOverallScore,
  buildCalibrationHeadline,
  buildCalibrationInsight,
  CALIBRATION_UNLOCK,
} from './risk-compiler';

describe('calculateNoisePenalty', () => {
  it('returns 0 for null / undefined / 0 stdDev', () => {
    expect(calculateNoisePenalty(null)).toBe(0);
    expect(calculateNoisePenalty(undefined)).toBe(0);
    expect(calculateNoisePenalty(0)).toBe(0);
  });

  it('scales stdDev by 5', () => {
    expect(calculateNoisePenalty(1)).toBe(5);
    expect(calculateNoisePenalty(2.5)).toBe(12.5);
    expect(calculateNoisePenalty(10)).toBe(50);
  });
});

describe('calculateTrustPenalty', () => {
  it('treats missing factCheck as moderate (trustScore=50)', () => {
    expect(calculateTrustPenalty(null)).toEqual({ trustScore: 50, trustPenalty: 15 });
    expect(calculateTrustPenalty(undefined)).toEqual({ trustScore: 50, trustPenalty: 15 });
  });

  it('treats error status as moderate (trustScore=50)', () => {
    expect(calculateTrustPenalty({ status: 'error' })).toEqual({
      trustScore: 50,
      trustPenalty: 15,
    });
  });

  it('uses factCheck.score when present', () => {
    expect(calculateTrustPenalty({ score: 100 })).toEqual({ trustScore: 100, trustPenalty: 0 });
    expect(calculateTrustPenalty({ score: 80 })).toEqual({ trustScore: 80, trustPenalty: 6 });
    expect(calculateTrustPenalty({ score: 0 })).toEqual({ trustScore: 0, trustPenalty: 30 });
  });

  it('defaults missing score to 50 even on success status', () => {
    expect(calculateTrustPenalty({ status: 'success' })).toEqual({
      trustScore: 50,
      trustPenalty: 15,
    });
  });
});

describe('calculateLogicPenalty', () => {
  it('treats missing logic score as no penalty (default 100)', () => {
    expect(calculateLogicPenalty(undefined)).toBe(0);
    expect(calculateLogicPenalty(null)).toBe(0);
  });

  it('respects genuine score of 0', () => {
    expect(calculateLogicPenalty(0)).toBe(40);
  });

  it('scales (100 - score) by 0.4', () => {
    expect(calculateLogicPenalty(100)).toBe(0);
    expect(calculateLogicPenalty(75)).toBe(10);
    expect(calculateLogicPenalty(50)).toBe(20);
  });
});

describe('calculateEchoChamberPenalty', () => {
  it('treats missing diversity score as no penalty (default 100)', () => {
    expect(calculateEchoChamberPenalty(undefined)).toBe(0);
    expect(calculateEchoChamberPenalty(null)).toBe(0);
  });

  it('respects 0 = tunnel vision (max penalty)', () => {
    expect(calculateEchoChamberPenalty(0)).toBe(30);
  });

  it('scales (100 - score) by 0.3', () => {
    expect(calculateEchoChamberPenalty(100)).toBe(0);
    expect(calculateEchoChamberPenalty(70)).toBe(9);
    expect(calculateEchoChamberPenalty(50)).toBe(15);
  });
});

describe('composeOverallScore', () => {
  const ZERO_PENALTIES = {
    biasDeductions: 0,
    noisePenalty: 0,
    trustPenalty: 0,
    logicPenalty: 0,
    diversityPenalty: 0,
    feedbackAdjustment: 0,
  };

  it('returns 100 for a clean memo (no penalties)', () => {
    expect(composeOverallScore(ZERO_PENALTIES)).toBe(100);
  });

  it('subtracts all components from base 100', () => {
    expect(
      composeOverallScore({
        biasDeductions: 20,
        noisePenalty: 5,
        trustPenalty: 6,
        logicPenalty: 10,
        diversityPenalty: 9,
        feedbackAdjustment: 4,
      })
    ).toBe(46);
  });

  it('rounds (not truncates) fractional penalties', () => {
    // 100 - 1.5 - 1.5 - 1.5 - 1.5 - 1.5 - 1.5 = 91 (rounded from 91.0)
    expect(
      composeOverallScore({
        biasDeductions: 1.5,
        noisePenalty: 1.5,
        trustPenalty: 1.5,
        logicPenalty: 1.5,
        diversityPenalty: 1.5,
        feedbackAdjustment: 1.5,
      })
    ).toBe(91);
    // 100 - 0.6 - 0.6 - 0.6 - 0.6 - 0.6 - 0.6 = 96.4 → rounds to 96
    expect(
      composeOverallScore({
        biasDeductions: 0.6,
        noisePenalty: 0.6,
        trustPenalty: 0.6,
        logicPenalty: 0.6,
        diversityPenalty: 0.6,
        feedbackAdjustment: 0.6,
      })
    ).toBe(96);
  });

  it('clamps below to 0 even when penalties exceed base', () => {
    expect(
      composeOverallScore({
        ...ZERO_PENALTIES,
        biasDeductions: 200,
      })
    ).toBe(0);
  });

  it("clamps above to 100 (defensive; penalties shouldn't be negative but if they are)", () => {
    expect(
      composeOverallScore({
        ...ZERO_PENALTIES,
        biasDeductions: -50,
      })
    ).toBe(100);
  });

  it('honors custom base score (defensive)', () => {
    expect(composeOverallScore({ ...ZERO_PENALTIES, baseScore: 80 })).toBe(80);
  });
});

describe('buildCalibrationHeadline', () => {
  it('cold-start hint when sample size below unlock', () => {
    const result = buildCalibrationHeadline(0, 0, 'default', []);
    expect(result).toContain('5 more to go');
    expect(result).toContain('5 confirmed outcomes');
  });

  it('cold-start countdown reflects remaining sample size', () => {
    expect(buildCalibrationHeadline(0, 4, 'default', [])).toContain('1 more to go');
    expect(buildCalibrationHeadline(0, 1, 'default', [])).toContain('4 more to go');
  });

  it('default-source headline at unlock when no causal weights yet', () => {
    const result = buildCalibrationHeadline(0, 5, 'default', []);
    expect(result).toContain('5 confirmed outcomes');
    expect(result).toContain('no bias-outcome patterns detected yet');
  });

  it('near-baseline message when delta is within 1 point', () => {
    const result = buildCalibrationHeadline(0, 8, 'causal', [
      { biasType: 'anchoring_bias', dangerMultiplier: 1.2, sampleSize: 6 },
    ]);
    expect(result).toContain('matches industry baseline closely');
  });

  it('negative delta names a riskier-than-it-looks framing + dominant bias', () => {
    const result = buildCalibrationHeadline(-5, 10, 'causal', [
      { biasType: 'sunk_cost_fallacy', dangerMultiplier: 1.8, sampleSize: 6 },
    ]);
    expect(result).toContain('5 points riskier');
    expect(result).toContain('sunk cost fallacy');
    expect(result).toContain('1.8x');
  });

  it('positive delta names a safer-than-baseline framing', () => {
    const result = buildCalibrationHeadline(7, 12, 'causal', [
      { biasType: 'confirmation_bias', dangerMultiplier: 0.6, sampleSize: 8 },
    ]);
    expect(result).toContain('7 points better');
    expect(result).toContain('confirmation bias');
  });

  it('picks the bias with largest deviation from 1.0 as dominant', () => {
    // anchoring 1.05 (delta 0.05) vs sunk_cost 0.4 (delta 0.6) — sunk_cost wins
    const result = buildCalibrationHeadline(-3, 10, 'causal', [
      { biasType: 'anchoring_bias', dangerMultiplier: 1.05, sampleSize: 6 },
      { biasType: 'sunk_cost_fallacy', dangerMultiplier: 0.4, sampleSize: 6 },
    ]);
    expect(result).toContain('sunk cost fallacy');
    expect(result).not.toContain('anchoring');
  });
});

describe('buildCalibrationInsight', () => {
  it('exposes calibration delta + source + unlock threshold', () => {
    const insight = buildCalibrationInsight({
      overallScore: 82,
      staticOverallScore: 78,
      causalWeightsForReport: [
        {
          biasType: 'overconfidence_bias',
          dangerMultiplier: 1.4,
          failureCount: 6,
          successCount: 2,
          sampleSize: 8,
        },
      ],
      sampleSize: 12,
    });
    expect(insight.calibratedOverallScore).toBe(82);
    expect(insight.staticOverallScore).toBe(78);
    expect(insight.calibrationDelta).toBe(4);
    expect(insight.calibrationSource).toBe('causal');
    expect(insight.unlockThreshold).toBe(CALIBRATION_UNLOCK);
    expect(insight.sampleSize).toBe(12);
    expect(insight.headline).toContain('4 points better');
  });

  it('falls back to default source when no causal weights', () => {
    const insight = buildCalibrationInsight({
      overallScore: 70,
      staticOverallScore: 70,
      causalWeightsForReport: [],
      sampleSize: 6,
    });
    expect(insight.calibrationSource).toBe('default');
    expect(insight.calibrationDelta).toBe(0);
    expect(insight.headline).toContain('no bias-outcome patterns detected yet');
  });

  it('cold-start headline at sub-unlock sample size', () => {
    const insight = buildCalibrationInsight({
      overallScore: 75,
      staticOverallScore: 75,
      causalWeightsForReport: [],
      sampleSize: 2,
    });
    expect(insight.headline).toContain('3 more to go');
  });
});
