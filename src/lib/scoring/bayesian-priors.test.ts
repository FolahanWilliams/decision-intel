import { describe, it, expect } from 'vitest';
import {
  BIAS_BASE_RATES,
  getBiasBaseRate,
  getAllBaseRates,
  applyBayesianPriors,
  type DecisionPrior,
} from './bayesian-priors';
import { BIAS_EDUCATION } from '@/lib/constants/bias-education';

/**
 * Locks the base-rate engine that feeds the Decision-Priors / belief-delta
 * path (consumed by risk-compiler `applyBayesianAdjustment`). The load-bearing
 * invariant: every key in the canonical 22-bias taxonomy must carry an explicit
 * base rate + citation — a missing key silently falls through to 0.5 and
 * de-tunes the prior path for that bias (the 2026-06-05 backfill closed a
 * 6-bias gap, including the two most Tetlock-relevant detectors,
 * illusion_of_validity + inside_view_dominance).
 */

const TAXONOMY_KEYS = Object.keys(BIAS_EDUCATION);

describe('BIAS_BASE_RATES — taxonomy coverage invariant', () => {
  it('covers every key in the canonical bias taxonomy (no silent 0.5 fallthrough)', () => {
    const missing = TAXONOMY_KEYS.filter(k => !(k in BIAS_BASE_RATES));
    expect(missing).toEqual([]);
  });

  it('includes the 6 keys backfilled 2026-06-05', () => {
    for (const k of [
      'halo_effect',
      'gamblers_fallacy',
      'zeigarnik_effect',
      'paradox_of_choice',
      'illusion_of_validity',
      'inside_view_dominance',
    ]) {
      expect(BIAS_BASE_RATES[k]).toBeGreaterThan(0);
      expect(BIAS_BASE_RATES[k]).toBeLessThan(1);
    }
  });

  it('every base rate is a probability in (0, 1)', () => {
    for (const [, rate] of Object.entries(BIAS_BASE_RATES)) {
      expect(rate).toBeGreaterThan(0);
      expect(rate).toBeLessThan(1);
    }
  });
});

describe('getAllBaseRates — citation coverage (lockstep with BIAS_BASE_RATES)', () => {
  it('gives every taxonomy bias a real citation, never the "General research" fallback', () => {
    const rows = getAllBaseRates();
    const byType = new Map(rows.map(r => [r.biasType, r.citation]));
    for (const k of TAXONOMY_KEYS) {
      // Every taxonomy key must be in BIAS_BASE_RATES (covered above) AND carry
      // a specific citation, not the generic fallback.
      expect(byType.get(k), `missing citation for ${k}`).toBeDefined();
      expect(byType.get(k)).not.toBe('General research');
    }
  });

  it('is sorted by base rate descending', () => {
    const rows = getAllBaseRates();
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1].baseRate).toBeGreaterThanOrEqual(rows[i].baseRate);
    }
  });
});

describe('getBiasBaseRate', () => {
  it('returns the mapped rate for a known bias', () => {
    expect(getBiasBaseRate('illusion_of_validity')).toBe(BIAS_BASE_RATES['illusion_of_validity']);
  });

  it('falls back to 0.5 for an unknown bias key', () => {
    expect(getBiasBaseRate('not_a_real_bias')).toBe(0.5);
  });
});

describe('applyBayesianPriors', () => {
  const prior: DecisionPrior = { beliefScore: 0.8, confidence: 0.7 };

  it('produces a posterior in (0, 1) for each detected bias', () => {
    const result = applyBayesianPriors(
      70,
      [
        { type: 'illusion_of_validity', confidence: 0.7, severity: 'high' },
        { type: 'inside_view_dominance', confidence: 0.6, severity: 'medium' },
      ],
      prior
    );
    expect(result.biasAdjustments).toHaveLength(2);
    for (const adj of result.biasAdjustments) {
      expect(adj.posteriorConfidence).toBeGreaterThan(0);
      expect(adj.posteriorConfidence).toBeLessThanOrEqual(0.99);
    }
  });

  it('beliefDelta is analysis-implied probability minus the user belief', () => {
    // rawScore 40 → analysis implies 0.40; user believed 0.80 → delta -0.40
    const result = applyBayesianPriors(
      40,
      [{ type: 'confirmation_bias', confidence: 0.8, severity: 'high' }],
      { beliefScore: 0.8, confidence: 0.9 }
    );
    expect(result.beliefDelta).toBeCloseTo(-0.4, 5);
  });

  it('a backfilled bias is no longer scored at the 0.5 default base rate', () => {
    // illusion_of_validity (0.66) and an unknown key (0.5 default) under the
    // SAME llm confidence + prior should yield different posteriors — proving
    // the backfilled rate is actually in effect.
    const known = applyBayesianPriors(
      70,
      [{ type: 'illusion_of_validity', confidence: 0.7, severity: 'high' }],
      prior
    ).biasAdjustments[0].posteriorConfidence;
    const unknown = applyBayesianPriors(
      70,
      [{ type: 'not_a_real_bias', confidence: 0.7, severity: 'high' }],
      prior
    ).biasAdjustments[0].posteriorConfidence;
    expect(known).not.toBe(unknown);
  });

  it('returns empty adjustments when no biases are detected', () => {
    const result = applyBayesianPriors(85, [], prior);
    expect(result.biasAdjustments).toEqual([]);
    expect(result.adjustedScore).toBeGreaterThanOrEqual(0);
    expect(result.adjustedScore).toBeLessThanOrEqual(100);
  });
});
