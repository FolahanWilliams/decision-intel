/**
 * Regression suite for the pairwise bias interaction matrix.
 *
 * Locked invariants (M-1 ship 2026-05-13 — 22×22 extension):
 * - Matrix covers every entry in BIAS_EDUCATION (canonical superset check).
 * - Every row has exactly N entries (square matrix).
 * - Self-interaction is always neutral (weight 1.0).
 * - The canonical "Coherent Confidence" toxic combo (DI-B-021) and
 *   "Reference-Class Blindness" toxic combo (DI-B-022) anchor weights
 *   match the CLAUDE.md paper-application locks.
 */

import { describe, it, expect } from 'vitest';
import {
  INTERACTION_MATRIX,
  MATRIX_BIAS_KEYS,
  MATRIX_DIMENSION,
  getInteractionWeight,
  getStrongestInteractions,
} from './interaction-matrix';

describe('interaction-matrix shape', () => {
  // drift-tolerant — locked to BIAS_EDUCATION.length (currently 22 after
  // the 2026-04-30 paper-application sprint added DI-B-021 + DI-B-022;
  // when DI-B-023 lands this test must update in lockstep per the
  // CLAUDE.md "Adding a new bias is a load-bearing cascade" rule).
  it('matrix dimension matches BIAS_EDUCATION cardinality', async () => {
    const { BIAS_EDUCATION } = await import('@/lib/constants/bias-education');
    const taxonomyCount = Object.keys(BIAS_EDUCATION).length;
    expect(MATRIX_DIMENSION).toBe(taxonomyCount);
    expect(MATRIX_BIAS_KEYS).toHaveLength(taxonomyCount);
    expect(Object.keys(INTERACTION_MATRIX)).toHaveLength(taxonomyCount);
  });

  it('is square — every row has exactly MATRIX_DIMENSION entries', () => {
    for (const biasA of MATRIX_BIAS_KEYS) {
      const row = INTERACTION_MATRIX[biasA];
      expect(row).toBeDefined();
      expect(Object.keys(row)).toHaveLength(MATRIX_DIMENSION);
    }
  });

  it('every row contains exactly the canonical bias keys (no extras, no gaps)', () => {
    const canonical = new Set(MATRIX_BIAS_KEYS);
    for (const biasA of MATRIX_BIAS_KEYS) {
      const row = INTERACTION_MATRIX[biasA];
      const rowKeys = new Set(Object.keys(row));
      expect(rowKeys.size).toBe(canonical.size);
      for (const key of canonical) {
        expect(rowKeys.has(key)).toBe(true);
      }
    }
  });

  it('self-interaction is always neutral (weight 1.0)', () => {
    for (const bias of MATRIX_BIAS_KEYS) {
      const entry = INTERACTION_MATRIX[bias][bias];
      expect(entry.weight).toBe(1.0);
      expect(entry.direction).toBe('neutral');
    }
  });

  it('all weights fall in the [0.5, 2.0] sane band', () => {
    for (const biasA of MATRIX_BIAS_KEYS) {
      for (const biasB of MATRIX_BIAS_KEYS) {
        const entry = INTERACTION_MATRIX[biasA][biasB];
        expect(entry.weight).toBeGreaterThanOrEqual(0.5);
        expect(entry.weight).toBeLessThanOrEqual(2.0);
      }
    }
  });

  it('direction matches weight semantics', () => {
    for (const biasA of MATRIX_BIAS_KEYS) {
      for (const biasB of MATRIX_BIAS_KEYS) {
        const { weight, direction } = INTERACTION_MATRIX[biasA][biasB];
        if (weight > 1.0) expect(direction).toBe('amplifies');
        else if (weight < 1.0) expect(direction).toBe('dampens');
        else expect(direction).toBe('neutral');
      }
    }
  });
});

describe('DI-B-021 Coherent Confidence toxic combo anchors', () => {
  // Per CLAUDE.md DI-B-021 paper application lock: IV+OC=1.5, IV+CB=1.4,
  // IV+HE=1.3, IV+AU=1.3. The "how biasB affects biasA" semantic means
  // we verify both directions where the lock applies.
  it('illusion_of_validity × overconfidence_bias = 1.5 in both directions', () => {
    expect(getInteractionWeight('overconfidence_bias', 'illusion_of_validity')).toBe(1.5);
    expect(getInteractionWeight('illusion_of_validity', 'overconfidence_bias')).toBe(1.5);
  });

  it('illusion_of_validity × confirmation_bias = 1.4 in both directions', () => {
    expect(getInteractionWeight('confirmation_bias', 'illusion_of_validity')).toBe(1.4);
    expect(getInteractionWeight('illusion_of_validity', 'confirmation_bias')).toBe(1.4);
  });

  it('illusion_of_validity × halo_effect = 1.3 in both directions', () => {
    expect(getInteractionWeight('halo_effect', 'illusion_of_validity')).toBe(1.3);
    expect(getInteractionWeight('illusion_of_validity', 'halo_effect')).toBe(1.3);
  });

  it('illusion_of_validity × authority_bias = 1.3 (IV → AU)', () => {
    // The asymmetry is documented: IV strongly amplifies AU's effect on
    // narrative confidence, but AU only modestly amplifies IV (1.2).
    expect(getInteractionWeight('illusion_of_validity', 'authority_bias')).toBe(1.3);
  });
});

describe('DI-B-022 Reference-Class Blindness toxic combo anchors', () => {
  // Per CLAUDE.md DI-B-022 paper application lock: ID+PF=1.6, ID+OC=1.5,
  // ID+IV=1.4, ID+CB=1.3.
  it('inside_view_dominance × planning_fallacy = 1.6 in both directions', () => {
    expect(getInteractionWeight('inside_view_dominance', 'planning_fallacy')).toBe(1.6);
    expect(getInteractionWeight('planning_fallacy', 'inside_view_dominance')).toBe(1.6);
  });

  it('inside_view_dominance × overconfidence_bias = 1.5 in both directions', () => {
    expect(getInteractionWeight('inside_view_dominance', 'overconfidence_bias')).toBe(1.5);
    expect(getInteractionWeight('overconfidence_bias', 'inside_view_dominance')).toBe(1.5);
  });

  it('inside_view_dominance × illusion_of_validity = 1.4 in both directions', () => {
    expect(getInteractionWeight('inside_view_dominance', 'illusion_of_validity')).toBe(1.4);
    expect(getInteractionWeight('illusion_of_validity', 'inside_view_dominance')).toBe(1.4);
  });

  it('inside_view_dominance × confirmation_bias = 1.3 in both directions', () => {
    expect(getInteractionWeight('inside_view_dominance', 'confirmation_bias')).toBe(1.3);
    expect(getInteractionWeight('confirmation_bias', 'inside_view_dominance')).toBe(1.3);
  });
});

describe('getInteractionWeight fallback', () => {
  it('returns 1.0 for unknown biases (matrix-miss fallback)', () => {
    expect(getInteractionWeight('made_up_bias', 'overconfidence_bias')).toBe(1.0);
    expect(getInteractionWeight('overconfidence_bias', 'made_up_bias')).toBe(1.0);
    expect(getInteractionWeight('unknown_a', 'unknown_b')).toBe(1.0);
  });
});

describe('getStrongestInteractions', () => {
  it('returns top-N non-self non-neutral interactions sorted by distance from 1.0', () => {
    const top = getStrongestInteractions('inside_view_dominance', 5);
    expect(top).toHaveLength(5);
    // First should be planning_fallacy at 1.6 (most distant from 1.0).
    expect(top[0]?.bias).toBe('planning_fallacy');
    expect(top[0]?.weight).toBe(1.6);
    // No self in results.
    expect(top.find(t => t.bias === 'inside_view_dominance')).toBeUndefined();
    // Sorted by descending |weight - 1|.
    for (let i = 1; i < top.length; i++) {
      const prev = Math.abs((top[i - 1]?.weight ?? 1) - 1);
      const curr = Math.abs((top[i]?.weight ?? 1) - 1);
      expect(prev).toBeGreaterThanOrEqual(curr);
    }
  });

  it('returns empty array for unknown bias', () => {
    expect(getStrongestInteractions('not_a_bias')).toEqual([]);
  });
});

describe('matrix coverage parity with BIAS_EDUCATION taxonomy', () => {
  // M-1 ship lock: the matrix must cover every entry in BIAS_EDUCATION.
  // Without this assertion, a future paper-application sprint that adds
  // DI-B-023 would silently leave the matrix at 22 while the taxonomy
  // grew to 23 — the same drift class that prompted M-1.
  it('MATRIX_BIAS_KEYS is a superset of BIAS_EDUCATION keys', async () => {
    const { BIAS_EDUCATION } = await import('@/lib/constants/bias-education');
    const taxonomyKeys = new Set(Object.keys(BIAS_EDUCATION));
    const matrixKeys = new Set(MATRIX_BIAS_KEYS);
    const missing: string[] = [];
    for (const key of taxonomyKeys) {
      if (!matrixKeys.has(key)) missing.push(key);
    }
    expect(missing).toEqual([]);
  });
});
