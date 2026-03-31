import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/utils/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import {
  computeCrossCaseCorrelations,
  getTopDangerousBiasPairs,
  getTopSeverityPredictors,
  getIndustryProfile,
  computeCorrelationMultiplier,
} from './case-correlations';

describe('computeCrossCaseCorrelations', () => {
  it('returns object with all expected arrays', () => {
    const result = computeCrossCaseCorrelations();
    expect(result).toHaveProperty('biasCooccurrences');
    expect(result).toHaveProperty('industryProfiles');
    expect(result).toHaveProperty('severityPredictors');
    expect(result).toHaveProperty('contextAmplifiers');
    expect(result).toHaveProperty('biasOutcomeDivergence');
    expect(result).toHaveProperty('successPatterns');
    expect(Array.isArray(result.biasCooccurrences)).toBe(true);
    expect(Array.isArray(result.industryProfiles)).toBe(true);
    expect(Array.isArray(result.severityPredictors)).toBe(true);
    expect(Array.isArray(result.contextAmplifiers)).toBe(true);
    expect(Array.isArray(result.biasOutcomeDivergence)).toBe(true);
    expect(Array.isArray(result.successPatterns)).toBe(true);
  });

  it('biasCooccurrences is non-empty', () => {
    const result = computeCrossCaseCorrelations();
    expect(result.biasCooccurrences.length).toBeGreaterThan(0);
  });

  it('industryProfiles is non-empty', () => {
    const result = computeCrossCaseCorrelations();
    expect(result.industryProfiles.length).toBeGreaterThan(0);
  });

  it('each industry profile has industry, caseCount > 0, topBiases array', () => {
    const result = computeCrossCaseCorrelations();
    for (const profile of result.industryProfiles) {
      expect(typeof profile.industry).toBe('string');
      expect(profile.industry.length).toBeGreaterThan(0);
      expect(profile.caseCount).toBeGreaterThan(0);
      expect(Array.isArray(profile.topBiases)).toBe(true);
    }
  });
});

describe('getTopDangerousBiasPairs', () => {
  it('returns array of length <= n', () => {
    const n = 5;
    const pairs = getTopDangerousBiasPairs(n);
    expect(pairs.length).toBeLessThanOrEqual(n);
  });

  it('each pair has biasA, biasB, amplificationRatio', () => {
    const pairs = getTopDangerousBiasPairs(10);
    for (const pair of pairs) {
      expect(typeof pair.biasA).toBe('string');
      expect(typeof pair.biasB).toBe('string');
      expect(typeof pair.amplificationRatio).toBe('number');
    }
  });

  it('sorted descending by amplificationRatio', () => {
    const pairs = getTopDangerousBiasPairs(10);
    for (let i = 1; i < pairs.length; i++) {
      expect(pairs[i - 1].amplificationRatio).toBeGreaterThanOrEqual(pairs[i].amplificationRatio);
    }
  });

  it('all amplificationRatio > 0', () => {
    const pairs = getTopDangerousBiasPairs(10);
    for (const pair of pairs) {
      expect(pair.amplificationRatio).toBeGreaterThan(0);
    }
  });
});

describe('getTopSeverityPredictors', () => {
  it('returns array of length <= n', () => {
    const n = 5;
    const predictors = getTopSeverityPredictors(n);
    expect(predictors.length).toBeLessThanOrEqual(n);
  });

  it('each predictor has factor, lift, category', () => {
    const predictors = getTopSeverityPredictors(10);
    for (const pred of predictors) {
      expect(typeof pred.factor).toBe('string');
      expect(typeof pred.lift).toBe('number');
      expect(['bias', 'context', 'pattern', 'structural']).toContain(pred.category);
    }
  });
});

describe('getIndustryProfile', () => {
  it("'technology' returns profile with caseCount > 0", () => {
    const profile = getIndustryProfile('technology');
    expect(profile).toBeDefined();
    expect(profile!.caseCount).toBeGreaterThan(0);
  });

  it("'financial_services' returns profile with caseCount > 0", () => {
    const profile = getIndustryProfile('financial_services');
    expect(profile).toBeDefined();
    expect(profile!.caseCount).toBeGreaterThan(0);
  });

  it("'nonexistent_industry' returns undefined", () => {
    const profile = getIndustryProfile('nonexistent_industry');
    expect(profile).toBeUndefined();
  });

  it('returned profile has topBiases, avgImpactScore, catastrophicRate', () => {
    const profile = getIndustryProfile('technology');
    expect(profile).toBeDefined();
    expect(Array.isArray(profile!.topBiases)).toBe(true);
    expect(typeof profile!.avgImpactScore).toBe('number');
    expect(typeof profile!.catastrophicRate).toBe('number');
  });
});

describe('computeCorrelationMultiplier', () => {
  it('with no biases returns multiplier close to 1.0 and empty matchedPairs', () => {
    const result = computeCorrelationMultiplier([], {});
    expect(result.multiplier).toBeCloseTo(1.0, 1);
    expect(result.matchedPairs).toHaveLength(0);
  });

  it('with known failure-pattern biases returns multiplier >= 1.0', () => {
    const result = computeCorrelationMultiplier(
      ['confirmation_bias', 'overconfidence'],
      {}
    );
    expect(result.multiplier).toBeGreaterThanOrEqual(1.0);
  });

  it('returns matchedPairs array and matchedSuccessPatterns array', () => {
    const result = computeCorrelationMultiplier(
      ['confirmation_bias', 'overconfidence'],
      {}
    );
    expect(Array.isArray(result.matchedPairs)).toBe(true);
    expect(Array.isArray(result.matchedSuccessPatterns)).toBe(true);
  });

  it('returns beneficialDamping as number', () => {
    const result = computeCorrelationMultiplier(
      ['confirmation_bias'],
      { dissentEncouraged: true }
    );
    expect(typeof result.beneficialDamping).toBe('number');
  });
});
