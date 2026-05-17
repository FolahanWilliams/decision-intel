import { describe, it, expect } from 'vitest';
import {
  computeValueAtStake,
  buildOrgRoiSummary,
  formatRoiMoney,
  ROI_CALIBRATION_MIN_OUTCOMES,
  type DecisionRoiInput,
} from './decision-roi';

function dec(over: Partial<DecisionRoiInput> = {}): DecisionRoiInput {
  return {
    name: 'Project Atlas',
    ticketSize: 50_000_000,
    currency: 'USD',
    topPatternFailRate: 45,
    topPatternLabel: 'Synergy Mirage',
    cohortSampleSize: 28,
    ...over,
  };
}

describe('computeValueAtStake', () => {
  it('computes ticket × failRate/100 and aggregates', () => {
    const r = computeValueAtStake([dec(), dec({ ticketSize: 10_000_000, topPatternFailRate: 30 })]);
    expect(r.empty).toBe(false);
    expect(r.perDecision[0].valueAtStake).toBe(22_500_000); // 50M × 45%
    expect(r.totalValueAtStake).toBe(22_500_000 + 3_000_000); // + 10M × 30%
    expect(r.decisionsFlagged).toBe(2);
    expect(r.decisionsWithTicket).toBe(2);
  });

  it('sorts perDecision by exposure desc', () => {
    const r = computeValueAtStake([
      dec({ name: 'small', ticketSize: 1_000_000, topPatternFailRate: 10 }),
      dec({ name: 'big', ticketSize: 90_000_000, topPatternFailRate: 50 }),
    ]);
    expect(r.perDecision[0].name).toBe('big');
  });

  it('excludes decisions with no ticket', () => {
    const r = computeValueAtStake([dec({ ticketSize: null }), dec()]);
    expect(r.decisionsWithTicket).toBe(1);
    expect(r.decisionsFlagged).toBe(1);
  });

  it('excludes decisions with a ticket but no flagged-pattern cohort (never invents)', () => {
    const r = computeValueAtStake([
      dec({ topPatternFailRate: null, topPatternLabel: null, cohortSampleSize: null }),
    ]);
    expect(r.empty).toBe(true);
    expect(r.decisionsWithTicket).toBe(1);
    expect(r.decisionsFlagged).toBe(0);
    expect(r.totalValueAtStake).toBe(0);
  });

  it('excludes a flagged pattern with a zero/empty cohort', () => {
    expect(computeValueAtStake([dec({ cohortSampleSize: 0 })]).empty).toBe(true);
    expect(computeValueAtStake([dec({ topPatternFailRate: 0 })]).empty).toBe(true);
  });

  it('reports the dominant currency and only sums same-currency decisions', () => {
    const r = computeValueAtStake([
      dec({ currency: 'USD', ticketSize: 10_000_000, topPatternFailRate: 50 }),
      dec({ currency: 'USD', ticketSize: 20_000_000, topPatternFailRate: 50 }),
      dec({ currency: 'GBP', ticketSize: 99_000_000, topPatternFailRate: 50 }),
    ]);
    expect(r.currency).toBe('USD');
    expect(r.decisionsFlagged).toBe(2); // only the 2 USD ones contribute
    expect(r.totalValueAtStake).toBe(5_000_000 + 10_000_000);
  });

  it('empty input → honest empty result', () => {
    const r = computeValueAtStake([]);
    expect(r.empty).toBe(true);
    expect(r.currency).toBe('USD');
    expect(r.totalValueAtStake).toBe(0);
  });

  it('does not mutate input', () => {
    const arr = [dec(), dec({ ticketSize: 1_000_000 })];
    computeValueAtStake(arr);
    expect(arr[0].ticketSize).toBe(50_000_000);
  });
});

describe('buildOrgRoiSummary calibration bands', () => {
  const vas = computeValueAtStake([dec()]);
  const quarterly = {
    estimatedSavings: 1_200_000,
    currency: 'GBP',
    improvedDecisions: 3,
    totalDecisions: 7,
  };

  it('unlocks state when no scored outcomes', () => {
    const s = buildOrgRoiSummary({
      valueAtStake: vas,
      quarterly,
      brier: { count: 0, avg: 0 },
      baselineBrier: 0.258,
    });
    expect(s.calibration.state).toBe('unlocks');
    expect(s.calibration.orgBrier).toBeNull();
    expect(s.calibration.delta).toBeNull();
    expect(s.calibration.message).toContain('unlocks once you log outcomes');
  });

  it('emerging state below the N-floor', () => {
    const s = buildOrgRoiSummary({
      valueAtStake: vas,
      quarterly,
      brier: { count: ROI_CALIBRATION_MIN_OUTCOMES - 1, avg: 0.3 },
      baselineBrier: 0.258,
    });
    expect(s.calibration.state).toBe('emerging');
    expect(s.calibration.orgBrier).toBe(0.3);
    expect(s.calibration.delta).toBeNull();
    expect(s.calibration.message).toContain('Emerging signal');
  });

  it('live state at/above the N-floor — positive delta when sharper', () => {
    const s = buildOrgRoiSummary({
      valueAtStake: vas,
      quarterly,
      brier: { count: 9, avg: 0.2 },
      baselineBrier: 0.258,
    });
    expect(s.calibration.state).toBe('live');
    expect(s.calibration.delta).toBeCloseTo(0.058, 3);
    expect(s.calibration.message).toContain('sharper than the platform-seed baseline');
  });

  it('live state — non-positive delta is framed honestly, not as failure', () => {
    const s = buildOrgRoiSummary({
      valueAtStake: vas,
      quarterly,
      brier: { count: 9, avg: 0.31 },
      baselineBrier: 0.258,
    });
    expect(s.calibration.state).toBe('live');
    expect(s.calibration.delta).toBeLessThan(0);
    expect(s.calibration.message).toContain('the loop is working');
  });

  it('passes quarterly savings through verbatim (consumes the canonical, no recompute)', () => {
    const s = buildOrgRoiSummary({
      valueAtStake: vas,
      quarterly,
      brier: { count: 0, avg: 0 },
      baselineBrier: 0.258,
    });
    expect(s.savings.estimatedSavings).toBe(1_200_000);
    expect(s.savings.currency).toBe('GBP');
    expect(s.savings.improvedDecisions).toBe(3);
    expect(s.savings.totalDecisions).toBe(7);
  });
});

describe('formatRoiMoney', () => {
  it('formats with magnitude suffixes + currency symbol', () => {
    expect(formatRoiMoney(22_500_000, 'USD')).toBe('$22.5M');
    expect(formatRoiMoney(1_400_000, 'GBP')).toBe('£1.4M');
    expect(formatRoiMoney(2_000_000_000, 'EUR')).toBe('€2.0B');
    expect(formatRoiMoney(40_000, 'USD')).toBe('$40K');
    expect(formatRoiMoney(500, 'NGN')).toBe('NGN 500');
  });
});
