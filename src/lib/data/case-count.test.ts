import { describe, expect, it } from 'vitest';
import { HISTORICAL_CASE_COUNT_SNAPSHOT } from './case-count';
import { HISTORICAL_CASE_COUNT } from './case-studies';

describe('case-count snapshot', () => {
  it('mirrors HISTORICAL_CASE_COUNT (ALL_CASES.length) exactly', () => {
    // The snapshot exists so client bundles (MarketingNav on every marketing
    // page) don't carry the ~170KB case library for one integer. When the
    // case library grows, bump the snapshot in the same commit — this test
    // is the lockstep enforcement.
    expect(HISTORICAL_CASE_COUNT_SNAPSHOT).toBe(HISTORICAL_CASE_COUNT);
  });
});
