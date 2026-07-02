import { describe, it, expect } from 'vitest';
import { noiseConvergenceBand } from './noise-convergence';

describe('noiseConvergenceBand — the stable, honest presentation', () => {
  it('the founder’s two runs (67.3 and 59.3) land in the SAME band — the wobble stops flipping the signal', () => {
    // Both are "this decision reads very differently by lens" — the same finding,
    // shown as false-precise points before. A stable band is the fix.
    expect(noiseConvergenceBand(67.3).band).toBe(noiseConvergenceBand(59.3).band);
    expect(noiseConvergenceBand(67.3).band).toBe('volatile');
  });

  it('maps the four bands across the range', () => {
    expect(noiseConvergenceBand(0).band).toBe('robust');
    expect(noiseConvergenceBand(14).band).toBe('robust');
    expect(noiseConvergenceBand(15).band).toBe('moderate');
    expect(noiseConvergenceBand(34).band).toBe('moderate');
    expect(noiseConvergenceBand(35).band).toBe('sensitive');
    expect(noiseConvergenceBand(54).band).toBe('sensitive');
    expect(noiseConvergenceBand(55).band).toBe('volatile');
    expect(noiseConvergenceBand(100).band).toBe('volatile');
  });

  it('ordinary estimator wobble stays inside one band (the whole point)', () => {
    // A stdDev of 20 vs 22 → noiseScore 60 vs 66 → both volatile.
    expect(noiseConvergenceBand(60).band).toBe(noiseConvergenceBand(66).band);
    // A moderate decision that wobbles 20 → 30 stays moderate.
    expect(noiseConvergenceBand(20).band).toBe(noiseConvergenceBand(30).band);
  });

  it('is total: clamps out-of-range + non-finite input rather than throwing', () => {
    expect(noiseConvergenceBand(-10).band).toBe('robust'); // clamped up to 0
    expect(noiseConvergenceBand(1000).band).toBe('volatile'); // finite → clamped to 100
    expect(noiseConvergenceBand(NaN).band).toBe('robust'); // non-finite → treated as 0
    expect(noiseConvergenceBand(Infinity).band).toBe('robust'); // non-finite → treated as 0
  });

  it('every band carries a non-empty label + reader hint', () => {
    for (const score of [5, 25, 45, 80]) {
      const c = noiseConvergenceBand(score);
      expect(c.label.length).toBeGreaterThan(0);
      expect(c.hint.length).toBeGreaterThan(20);
    }
  });
});
