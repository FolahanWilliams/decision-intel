import { describe, it, expect } from 'vitest';
import { computeDQChain } from './dq-chain';

describe('computeDQChain', () => {
  it('returns six elements in canonical order', () => {
    const r = computeDQChain({});
    expect(r.elements.map(e => e.id)).toEqual([
      'frame',
      'alternatives',
      'information',
      'values',
      'reasoning',
      'commitment',
    ]);
  });

  it('clamps every element score between 0 and 100', () => {
    const r = computeDQChain({
      biasCount: 999,
      noiseStdDev: 999,
      cognitiveAnalysis: {
        blindSpotGap: 0,
        blindSpots: Array.from({ length: 100 }, (_, i) => ({
          name: `b${i}`,
          description: 'x',
        })),
        counterArguments: [],
      },
    });
    for (const e of r.elements) {
      expect(e.score).toBeGreaterThanOrEqual(0);
      expect(e.score).toBeLessThanOrEqual(100);
    }
  });

  it('chain score equals the minimum of element scores', () => {
    const r = computeDQChain({
      hasDecisionFrame: true,
      hasOwner: true,
      hasDefaultAction: true,
      logicalAnalysis: { score: 95, fallacies: [], conclusion: 'Go ahead with the deal.' },
      swotAnalysis: {
        strengths: ['a', 'b'],
        weaknesses: ['c'],
        opportunities: ['d'],
        threats: ['e'],
        strategicAdvice: 'Proceed with a stop-loss.',
      },
      factCheck: { totalClaims: 10, verifiedClaims: 9, contradictedClaims: 0, score: 90 },
      noiseStdDev: 0,
      biasCount: 1000, // catastrophic reasoning
      preMortemCount: 3,
    });
    expect(r.chainScore).toBe(Math.min(...r.elements.map(e => e.score)));
    expect(r.weakestLink).toBe('reasoning');
  });

  it('identifies commitment as the weakest link when owner and action are missing', () => {
    const r = computeDQChain({
      hasDecisionFrame: true,
      hasOwner: false,
      hasDefaultAction: false,
      logicalAnalysis: { score: 90, fallacies: [], conclusion: 'Ship it.' },
      swotAnalysis: {
        strengths: ['a', 'b', 'c'],
        weaknesses: ['d', 'e'],
        opportunities: ['f'],
        threats: ['g'],
        strategicAdvice: 'Well reasoned.',
      },
      factCheck: { totalClaims: 10, verifiedClaims: 10, contradictedClaims: 0, score: 100 },
      noiseStdDev: 0.5,
      biasCount: 0,
    });
    expect(r.weakestLink).toBe('commitment');
  });

  it('returns a strong chain summary when all elements are high', () => {
    const r = computeDQChain({
      hasDecisionFrame: true,
      hasOwner: true,
      hasDefaultAction: true,
      logicalAnalysis: {
        score: 95,
        fallacies: [],
        conclusion: 'The acquisition is recommended at the agreed valuation.',
        assumptions: ['a', 'b', 'c'],
        verdict: 'APPROVED',
      },
      swotAnalysis: {
        strengths: ['a', 'b', 'c'],
        weaknesses: ['d', 'e'],
        opportunities: ['f', 'g'],
        threats: ['h', 'i'],
        strategicAdvice: 'Proceed with integration milestones.',
      },
      cognitiveAnalysis: {
        blindSpotGap: 90,
        blindSpots: [],
        counterArguments: [
          { perspective: 'Regulatory', argument: 'EU may block', confidence: 0.6 },
          { perspective: 'Market', argument: 'Saturated', confidence: 0.5 },
        ],
      },
      factCheck: { totalClaims: 20, verifiedClaims: 19, contradictedClaims: 0, score: 95 },
      noiseStdDev: 0.3,
      biasCount: 1,
      preMortemCount: 4,
    });
    expect(r.chainScore).toBeGreaterThanOrEqual(75);
    expect(r.summary).toContain('Strong chain');
  });

  it('returns a critically weak summary when a link is below 35', () => {
    const r = computeDQChain({
      hasDecisionFrame: false,
      hasOwner: false,
      hasDefaultAction: false,
      biasCount: 50,
      noiseStdDev: 20,
    });
    expect(r.chainScore).toBeLessThan(50);
    expect(r.summary.toLowerCase()).toMatch(/critically weak|bottlenecked/);
  });

  it('does not crash on entirely empty input', () => {
    const r = computeDQChain({});
    expect(r.elements).toHaveLength(6);
    expect(typeof r.chainScore).toBe('number');
    expect(typeof r.summary).toBe('string');
  });

  it('rewards explicit counter-arguments on the alternatives score', () => {
    const withCounters = computeDQChain({
      swotAnalysis: {
        strengths: ['a'],
        weaknesses: ['b'],
        opportunities: ['c'],
        threats: ['d'],
        strategicAdvice: '',
      },
      cognitiveAnalysis: {
        blindSpotGap: 50,
        blindSpots: [],
        counterArguments: [
          { perspective: 'A', argument: 'a', confidence: 0.5 },
          { perspective: 'B', argument: 'b', confidence: 0.5 },
          { perspective: 'C', argument: 'c', confidence: 0.5 },
        ],
      },
    });
    const withoutCounters = computeDQChain({
      swotAnalysis: {
        strengths: ['a'],
        weaknesses: ['b'],
        opportunities: ['c'],
        threats: ['d'],
        strategicAdvice: '',
      },
    });
    const altWith = withCounters.elements.find(e => e.id === 'alternatives')!.score;
    const altWithout = withoutCounters.elements.find(e => e.id === 'alternatives')!.score;
    expect(altWith).toBeGreaterThan(altWithout);
  });
});
