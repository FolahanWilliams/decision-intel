/**
 * Synergy Defensibility Scorer tests (pure-function unit tests).
 * Locks the BCG/McKinsey base-rate bands + severity transitions so a
 * future change to either the rates or the severity-rule cascade has
 * to update the test expectations explicitly — no silent drift.
 */
import { describe, it, expect } from 'vitest';
import { scoreSynergyClaim, aggregateDefensibility } from './synergy-defensibility';

describe('scoreSynergyClaim', () => {
  it('all-three-elements present → low severity, score 3', () => {
    const result = scoreSynergyClaim({
      type: 'revenue',
      hasMechanism: true,
      hasOwner: true,
      hasMilestone: true,
    });
    expect(result.score).toBe(3);
    expect(result.severity).toBe('low');
    expect(result.missing).toEqual([]);
    expect(result.verdict).toContain('All three');
  });

  it('zero elements present → critical severity', () => {
    const result = scoreSynergyClaim({
      type: 'revenue',
      hasMechanism: false,
      hasOwner: false,
      hasMilestone: false,
    });
    expect(result.score).toBe(0);
    expect(result.severity).toBe('critical');
    expect(result.missing).toEqual(['mechanism', 'owner', 'milestone']);
    expect(result.verdict).toContain('Synergy Mirage critical');
  });

  it('one element present → high severity', () => {
    const result = scoreSynergyClaim({
      type: 'cost_cogs',
      hasMechanism: true,
      hasOwner: false,
      hasMilestone: false,
    });
    expect(result.score).toBe(1);
    expect(result.severity).toBe('high');
    expect(result.missing).toEqual(['owner', 'milestone']);
  });

  it('two elements present → medium severity (most-prevalent failure shape)', () => {
    const result = scoreSynergyClaim({
      type: 'revenue',
      hasMechanism: true,
      hasOwner: true,
      hasMilestone: false,
    });
    expect(result.score).toBe(2);
    expect(result.severity).toBe('medium');
    expect(result.missing).toEqual(['milestone']);
  });

  it('revenue base-rate band is 30-50% per BCG/McKinsey anchors', () => {
    const result = scoreSynergyClaim({
      type: 'revenue',
      hasMechanism: true,
      hasOwner: true,
      hasMilestone: true,
    });
    expect(result.baseRateLow).toBe(0.3);
    expect(result.baseRateHigh).toBe(0.5);
    expect(result.verdict).toContain('30-50%');
  });

  it('cost-cogs base-rate band is 60-80%', () => {
    const result = scoreSynergyClaim({
      type: 'cost_cogs',
      hasMechanism: true,
      hasOwner: true,
      hasMilestone: true,
    });
    expect(result.baseRateLow).toBe(0.6);
    expect(result.baseRateHigh).toBe(0.8);
  });

  it('cost-opex base-rate band is 50-70%', () => {
    const result = scoreSynergyClaim({
      type: 'cost_opex',
      hasMechanism: false,
      hasOwner: false,
      hasMilestone: false,
    });
    expect(result.baseRateLow).toBe(0.5);
    expect(result.baseRateHigh).toBe(0.7);
  });

  it('unknown type uses the widest band (30-80%)', () => {
    const result = scoreSynergyClaim({
      type: 'unknown',
      hasMechanism: true,
      hasOwner: false,
      hasMilestone: true,
    });
    expect(result.baseRateLow).toBe(0.3);
    expect(result.baseRateHigh).toBe(0.8);
  });

  it('verdict mentions specific missing elements (not generic)', () => {
    const result = scoreSynergyClaim({
      type: 'revenue',
      hasMechanism: false,
      hasOwner: true,
      hasMilestone: false,
    });
    expect(result.verdict).toContain('mechanism');
    expect(result.verdict).toContain('milestone');
  });
});

describe('aggregateDefensibility', () => {
  it('empty input → totalClaims=0', () => {
    const result = aggregateDefensibility([]);
    expect(result.totalClaims).toBe(0);
    expect(result.fullyDefendedPct).toBe(0);
    expect(result.summary).toContain('No synergy claims');
  });

  it('all critical → flags portfolio under-defence', () => {
    const claims = [
      scoreSynergyClaim({
        type: 'revenue',
        hasMechanism: false,
        hasOwner: false,
        hasMilestone: false,
      }),
      scoreSynergyClaim({
        type: 'cost_opex',
        hasMechanism: false,
        hasOwner: false,
        hasMilestone: false,
      }),
    ];
    const result = aggregateDefensibility(claims);
    expect(result.totalClaims).toBe(2);
    expect(result.severityCounts.critical).toBe(2);
    expect(result.fullyDefendedPct).toBe(0);
    expect(result.summary).toContain('high or critical');
  });

  it('all fully defended → 100% defended summary', () => {
    const claims = [
      scoreSynergyClaim({
        type: 'revenue',
        hasMechanism: true,
        hasOwner: true,
        hasMilestone: true,
      }),
      scoreSynergyClaim({
        type: 'cost_cogs',
        hasMechanism: true,
        hasOwner: true,
        hasMilestone: true,
      }),
    ];
    const result = aggregateDefensibility(claims);
    expect(result.fullyDefendedPct).toBe(100);
    expect(result.severityCounts.low).toBe(2);
    expect(result.summary).toContain('fully defended');
  });

  it('mixed portfolio → reports per-severity counts', () => {
    const claims = [
      scoreSynergyClaim({
        type: 'revenue',
        hasMechanism: false,
        hasOwner: false,
        hasMilestone: false,
      }), // critical
      scoreSynergyClaim({
        type: 'revenue',
        hasMechanism: true,
        hasOwner: false,
        hasMilestone: false,
      }), // high
      scoreSynergyClaim({
        type: 'cost_cogs',
        hasMechanism: true,
        hasOwner: true,
        hasMilestone: false,
      }), // medium
      scoreSynergyClaim({
        type: 'cost_cogs',
        hasMechanism: true,
        hasOwner: true,
        hasMilestone: true,
      }), // low
    ];
    const result = aggregateDefensibility(claims);
    expect(result.totalClaims).toBe(4);
    expect(result.severityCounts.critical).toBe(1);
    expect(result.severityCounts.high).toBe(1);
    expect(result.severityCounts.medium).toBe(1);
    expect(result.severityCounts.low).toBe(1);
    expect(result.fullyDefendedPct).toBe(25);
  });
});
