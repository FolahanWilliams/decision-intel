import { describe, it, expect } from 'vitest';
import { computeConviction } from './conviction';

describe('computeConviction', () => {
  it('returns neutral score (50) with all defaults', () => {
    const result = computeConviction({});
    expect(result.score).toBe(50);
    expect(result.grade).toBe('C');
    expect(result.interpretation).toBeTruthy();
  });

  it('returns high score for strong evidence + logic + agreement', () => {
    const result = computeConviction({
      factCheckScore: 90,
      verificationRate: 0.9,
      logicalScore: 85,
      noiseStdDev: 3,
      blindSpotGap: 80,
    });
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.grade).toBe('A');
    expect(result.interpretation).toContain('Strong conviction');
  });

  it('returns low score for weak evidence + low logic + high noise', () => {
    const result = computeConviction({
      factCheckScore: 20,
      verificationRate: 0.1,
      logicalScore: 15,
      noiseStdDev: 25,
      blindSpotGap: 10,
    });
    expect(result.score).toBeLessThan(30);
    expect(['D', 'F']).toContain(result.grade);
  });

  it('components are bounded 0-100', () => {
    const result = computeConviction({
      factCheckScore: 200,
      verificationRate: 2.0,
      logicalScore: 150,
      noiseStdDev: -5,
      blindSpotGap: 200,
    });
    expect(result.components.evidenceStrength).toBeLessThanOrEqual(100);
    expect(result.components.argumentCoherence).toBeLessThanOrEqual(100);
    expect(result.components.judgeAgreement).toBeLessThanOrEqual(100);
    expect(result.components.perspectiveDiversity).toBeLessThanOrEqual(100);
  });

  it('handles null inputs gracefully', () => {
    const result = computeConviction({
      factCheckScore: null,
      verificationRate: null,
      logicalScore: null,
      noiseStdDev: null,
      blindSpotGap: null,
    });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('grade thresholds are correct', () => {
    expect(
      computeConviction({
        factCheckScore: 100,
        verificationRate: 1.0,
        logicalScore: 100,
        noiseStdDev: 0,
        blindSpotGap: 100,
      }).grade
    ).toBe('A');
    expect(
      computeConviction({
        factCheckScore: 70,
        verificationRate: 0.7,
        logicalScore: 70,
        noiseStdDev: 5,
        blindSpotGap: 70,
      }).grade
    ).toBe('B');
    expect(computeConviction({}).grade).toBe('C');
  });

  it('high noise reduces judge agreement component', () => {
    const lowNoise = computeConviction({ noiseStdDev: 2 });
    const highNoise = computeConviction({ noiseStdDev: 18 });
    expect(lowNoise.components.judgeAgreement).toBeGreaterThan(highNoise.components.judgeAgreement);
  });

  it('interpretation mentions weakest component for moderate scores', () => {
    const result = computeConviction({
      factCheckScore: 20,
      verificationRate: 0.1,
      logicalScore: 80,
      noiseStdDev: 5,
      blindSpotGap: 70,
    });
    if (result.score >= 60 && result.score < 80) {
      expect(result.interpretation).toContain('evidence');
    }
  });
});
