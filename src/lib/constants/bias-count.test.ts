import { describe, expect, it } from 'vitest';
import { BIAS_COUNT } from './bias-count';
import { BIAS_EDUCATION } from './bias-education';

describe('bias-count snapshot', () => {
  it('mirrors Object.keys(BIAS_EDUCATION).length exactly', () => {
    // The snapshot exists so client bundles (MarketingNav on every marketing
    // page) don't carry the full 41.5KB education object for one integer.
    // When a new bias lands in BIAS_EDUCATION, bump BIAS_COUNT in the same
    // commit — this test is the lockstep enforcement.
    expect(BIAS_COUNT).toBe(Object.keys(BIAS_EDUCATION).length);
  });
});
