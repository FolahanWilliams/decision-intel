import { describe, it, expect } from 'vitest';
import { computeQuantifiedExposure } from './quantified-exposure';
import type { ReasoningRiskFinding, ValueAtStake } from './types';

function vas(over: Partial<ValueAtStake> = {}): ValueAtStake {
  return {
    ticketAmount: 50_000_000,
    ticketCurrency: 'USD',
    exposureAmount: 40_000_000,
    baseRateSource: 'McKinsey/KPMG synergy-realisation research',
    ...over,
  };
}

function finding(over: Partial<ReasoningRiskFinding> = {}): ReasoningRiskFinding {
  return {
    kind: 'bias',
    id: 'x',
    label: 'X',
    chip: { severity: 'high', band: 'High', pct: 70 },
    excerpt: '',
    explanation: '',
    mitigation: '',
    ...over,
  };
}

describe('computeQuantifiedExposure', () => {
  it('consolidates to the MAX single-pattern exposure (never a sum)', () => {
    const q = computeQuantifiedExposure([
      finding({ id: 'a', valueAtStake: vas({ exposureAmount: 40_000_000 }) }),
      finding({ id: 'b', valueAtStake: vas({ exposureAmount: 12_000_000 }) }),
    ]);
    expect(q).not.toBeNull();
    // 40M, not 52M — the same $50M capital can't be lost twice.
    expect(q!.exposureAmount).toBe(40_000_000);
  });

  it('derives the base-rate % from exposure / ticket', () => {
    const q = computeQuantifiedExposure([
      finding({
        kind: 'compound_pattern',
        label: 'Synergy Mirage',
        valueAtStake: vas({ ticketAmount: 50_000_000, exposureAmount: 40_000_000 }),
      }),
    ]);
    expect(q!.baseRatePct).toBe(80); // 40/50
    expect(q!.ticketAmount).toBe(50_000_000);
    expect(q!.drivingLabel).toBe('Synergy Mirage');
    expect(q!.drivingKind).toBe('compound_pattern');
    expect(q!.baseRateSource).toContain('McKinsey');
  });

  it('surfaces the precedent — a negative analog leads', () => {
    const q = computeQuantifiedExposure([
      finding({
        kind: 'compound_pattern',
        valueAtStake: vas(),
        referenceClass: [
          {
            id: 'up',
            slug: 'apple',
            company: 'Apple',
            year: 2007,
            estimatedImpact: 'held up',
            direction: 'positive',
          },
          {
            id: 'we',
            slug: 'wework',
            company: 'WeWork',
            year: 2019,
            estimatedImpact: '$47B → collapse',
            direction: 'negative',
          },
        ],
      }),
    ]);
    expect(q!.precedent?.company).toBe('WeWork');
  });

  it('returns null when NO finding carries a ticket-backed exposure', () => {
    expect(computeQuantifiedExposure([finding(), finding()])).toBeNull();
    expect(computeQuantifiedExposure([])).toBeNull();
  });

  it('returns null on a zero / invalid ticket (never divides by zero)', () => {
    expect(
      computeQuantifiedExposure([finding({ valueAtStake: vas({ ticketAmount: 0 }) })])
    ).toBeNull();
  });

  it('the exposure never exceeds the ticket (honesty invariant)', () => {
    const q = computeQuantifiedExposure([
      finding({ valueAtStake: vas({ ticketAmount: 10_000_000, exposureAmount: 8_000_000 }) }),
    ]);
    expect(q!.exposureAmount).toBeLessThanOrEqual(q!.ticketAmount);
    expect(q!.baseRatePct).toBeLessThanOrEqual(100);
  });
});
