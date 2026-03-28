import { describe, it, expect } from 'vitest';
import { computeConsensusScore } from './consensus-scoring';

describe('computeConsensusScore', () => {
  it('returns divided with 0 score for empty priors', () => {
    const result = computeConsensusScore([]);
    expect(result.score).toBe(0);
    expect(result.convergenceLevel).toBe('divided');
    expect(result.unanimityWarning).toBe(false);
    expect(result.dissentQuality).toBe(0);
  });

  it('returns strong with 100 score for single prior', () => {
    const result = computeConsensusScore([
      { userId: 'u1', defaultAction: 'approve', confidence: 80 },
    ]);
    expect(result.score).toBe(100);
    expect(result.convergenceLevel).toBe('strong');
    expect(result.unanimityWarning).toBe(false);
  });

  it('detects unanimity warning when all priors agree', () => {
    const result = computeConsensusScore([
      { userId: 'u1', defaultAction: 'approve', confidence: 80 },
      { userId: 'u2', defaultAction: 'approve', confidence: 85 },
      { userId: 'u3', defaultAction: 'approve', confidence: 75 },
    ]);
    expect(result.unanimityWarning).toBe(true);
    expect(result.unanimityMessage).toContain('Unanimous agreement');
    expect(result.unanimityMessage).toContain('Strebulaev');
    expect(result.actionGroupCount).toBe(1);
  });

  it('does NOT warn when priors disagree on action', () => {
    const result = computeConsensusScore([
      { userId: 'u1', defaultAction: 'approve', confidence: 80 },
      { userId: 'u2', defaultAction: 'reject', confidence: 70 },
      { userId: 'u3', defaultAction: 'approve', confidence: 60 },
    ]);
    expect(result.unanimityWarning).toBe(false);
    expect(result.unanimityMessage).toBeNull();
    expect(result.actionGroupCount).toBe(2);
  });

  it('computes higher dissent quality when actions are diverse', () => {
    const diverse = computeConsensusScore([
      { userId: 'u1', defaultAction: 'approve', confidence: 90 },
      { userId: 'u2', defaultAction: 'reject', confidence: 30 },
      { userId: 'u3', defaultAction: 'defer', confidence: 50 },
    ]);
    const unanimous = computeConsensusScore([
      { userId: 'u1', defaultAction: 'approve', confidence: 80 },
      { userId: 'u2', defaultAction: 'approve', confidence: 82 },
      { userId: 'u3', defaultAction: 'approve', confidence: 78 },
    ]);
    expect(diverse.dissentQuality).toBeGreaterThan(unanimous.dissentQuality);
  });

  it('identifies dissenters by confidence divergence', () => {
    const result = computeConsensusScore([
      { userId: 'u1', defaultAction: 'approve', confidence: 80 },
      { userId: 'u2', defaultAction: 'approve', confidence: 85 },
      { userId: 'u3', defaultAction: 'approve', confidence: 20 }, // outlier
    ]);
    expect(result.dissenterIds).toContain('u3');
  });

  it('classifies convergence levels correctly', () => {
    // Strong: unanimous with tight confidence
    const strong = computeConsensusScore([
      { userId: 'u1', defaultAction: 'approve', confidence: 80 },
      { userId: 'u2', defaultAction: 'approve', confidence: 82 },
    ]);
    expect(strong.convergenceLevel).toBe('strong');

    // Divided: opposite actions with different confidence
    const divided = computeConsensusScore([
      { userId: 'u1', defaultAction: 'approve', confidence: 95 },
      { userId: 'u2', defaultAction: 'reject', confidence: 10 },
    ]);
    expect(['weak', 'divided']).toContain(divided.convergenceLevel);
  });
});
