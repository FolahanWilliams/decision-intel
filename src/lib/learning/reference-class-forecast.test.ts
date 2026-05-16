/**
 * Reference Class Forecasting regression suite.
 *
 * reference-class-forecast.ts renders on EVERY DPR cover — a procurement
 * reader scrutinises this block. CLAUDE.md: "pure-function similarity
 * scoring … deterministic, runs in <5ms." Until this suite it had zero
 * tests despite being one of the most-read procurement surfaces.
 *
 * Locks: pool size = full library, honest cold-start (too-small →
 * null rate), Jaccard-driven matching, score ∈ [0,1] + descending sort,
 * band thresholds, toxic-combination boost, input truncation,
 * determinism. Asserts structural invariants (not specific case IDs,
 * which evolve with the library).
 */

import { describe, it, expect } from 'vitest';
import { getReferenceClassForecast } from './reference-class-forecast';
import { ALL_CASES } from '@/lib/data/case-studies';

describe('getReferenceClassForecast — pool + cold-start honesty', () => {
  it('considers the entire canonical case library', () => {
    const f = getReferenceClassForecast({ biasTypes: ['confirmation_bias'] });
    expect(f.poolSize).toBe(ALL_CASES.length);
  });

  it('returns an honest "too small to judge" verdict when nothing matches', () => {
    const f = getReferenceClassForecast({
      biasTypes: ['a_bias_no_case_has', 'another_unknown_bias'],
      industry: null,
    });
    expect(f.matchedClassSize).toBe(0);
    expect(f.baselineFailureRate).toBeNull();
    expect(f.predictedOutcomeBand).toBe('reference_class_too_small_to_judge');
    expect(f.topAnalogs).toEqual([]);
    expect(f.note).toContain('too small');
  });
});

describe('getReferenceClassForecast — matched class', () => {
  const rich = getReferenceClassForecast({
    biasTypes: ['confirmation_bias', 'overconfidence_bias', 'anchoring_bias', 'halo_effect'],
    industry: 'technology',
    documentType: 'ic_memo',
  });

  it('surfaces analogs above the inclusion threshold', () => {
    expect(rich.matchedClassSize).toBeGreaterThan(0);
    expect(rich.topAnalogs.length).toBeGreaterThan(0);
    expect(rich.topAnalogs.length).toBeLessThanOrEqual(5);
  });

  it('ranks analogs by descending similarity, all scores in [0,1]', () => {
    for (let i = 1; i < rich.topAnalogs.length; i++) {
      expect(rich.topAnalogs[i - 1].similarityScore).toBeGreaterThanOrEqual(
        rich.topAnalogs[i].similarityScore
      );
    }
    for (const a of rich.topAnalogs) {
      expect(a.similarityScore).toBeGreaterThanOrEqual(0);
      expect(a.similarityScore).toBeLessThanOrEqual(1);
      expect(a.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('computes a baseline failure rate once the matched class clears n>=3', () => {
    if (rich.matchedClassSize >= 3) {
      expect(rich.baselineFailureRate).not.toBeNull();
      expect(rich.baselineFailureRate!).toBeGreaterThanOrEqual(0);
      expect(rich.baselineFailureRate!).toBeLessThanOrEqual(1);
      expect([
        'reference_class_succeeds',
        'reference_class_mixed',
        'reference_class_struggles',
        'reference_class_fails',
      ]).toContain(rich.predictedOutcomeBand);
    }
  });

  it('truncates the echoed input bias list to 12', () => {
    const many = Array.from({ length: 30 }, (_, i) => `bias_${i}`);
    const f = getReferenceClassForecast({ biasTypes: many });
    expect(f.inputs.biasTypes.length).toBeLessThanOrEqual(12);
  });
});

describe('getReferenceClassForecast — toxic-combination boost', () => {
  it('a matching named pattern lifts structurally-analogous failures even cross-industry', () => {
    // Pick a toxic combination that actually exists on at least one case.
    const tagged = ALL_CASES.find(c => c.toxicCombinations && c.toxicCombinations.length > 0);
    expect(tagged).toBeDefined();
    const pattern = tagged!.toxicCombinations[0];

    const withBoost = getReferenceClassForecast({
      biasTypes: ['confirmation_bias'],
      toxicCombinations: [pattern],
    });
    const withoutBoost = getReferenceClassForecast({
      biasTypes: ['confirmation_bias'],
    });
    // The boost is additive, so the matched class can only grow or stay equal.
    expect(withBoost.matchedClassSize).toBeGreaterThanOrEqual(withoutBoost.matchedClassSize);
    const boostedAnalog = withBoost.topAnalogs.find(a =>
      a.matchReason.includes('same failure pattern')
    );
    expect(boostedAnalog).toBeDefined();
  });
});

describe('getReferenceClassForecast — determinism', () => {
  it('is a pure function — identical input yields identical output', () => {
    const input = {
      biasTypes: ['confirmation_bias', 'overconfidence_bias'],
      industry: 'financial_services',
      documentType: 'ic_memo',
    };
    expect(getReferenceClassForecast(input)).toEqual(getReferenceClassForecast(input));
  });
});
