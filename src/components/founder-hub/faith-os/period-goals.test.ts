import { describe, it, expect } from 'vitest';
import {
  weekStartIso,
  weekKeyFor,
  quarterKeyFor,
  periodKeyFor,
  weekLabel,
  quarterLabel,
  periodLabel,
  isActivePeriodStatus,
  periodSlotsLeft,
  PERIOD_GOAL_MAX,
  type PeriodGoalLite,
} from './period-goals';
import { DAILY_THREE_MAX } from './content';

describe('period keys', () => {
  it('week start snaps back to Sunday', () => {
    expect(weekStartIso('2026-06-01')).toBe('2026-05-31'); // Mon → prior Sun
    expect(weekStartIso('2026-05-31')).toBe('2026-05-31'); // Sun → itself
    expect(weekStartIso('2026-06-06')).toBe('2026-05-31'); // Sat → same week's Sun
    expect(weekStartIso('2026-06-07')).toBe('2026-06-07'); // next Sun
  });

  it('week key is the Sunday-start ISO date', () => {
    expect(weekKeyFor('2026-06-03')).toBe('2026-05-31');
  });

  it('quarter key maps months to Q1-Q4', () => {
    expect(quarterKeyFor('2026-01-15')).toBe('2026-Q1');
    expect(quarterKeyFor('2026-04-01')).toBe('2026-Q2');
    expect(quarterKeyFor('2026-09-30')).toBe('2026-Q3');
    expect(quarterKeyFor('2026-12-31')).toBe('2026-Q4');
  });

  it('periodKeyFor dispatches by period', () => {
    expect(periodKeyFor('week', '2026-06-01')).toBe('2026-05-31');
    expect(periodKeyFor('quarter', '2026-06-01')).toBe('2026-Q2');
  });
});

describe('period labels', () => {
  it('formats week + quarter labels', () => {
    expect(weekLabel('2026-05-31')).toBe('Week of May 31');
    expect(quarterLabel('2026-Q2')).toBe('Q2 2026');
    expect(periodLabel('week', '2026-05-31')).toBe('Week of May 31');
    expect(periodLabel('quarter', '2026-Q2')).toBe('Q2 2026');
  });
});

describe('period cap', () => {
  it('mirrors the daily cap of three', () => {
    expect(PERIOD_GOAL_MAX).toBe(DAILY_THREE_MAX);
    expect(PERIOD_GOAL_MAX).toBe(3);
  });

  it('isActivePeriodStatus counts only open + done', () => {
    expect(isActivePeriodStatus('open')).toBe(true);
    expect(isActivePeriodStatus('done')).toBe(true);
    expect(isActivePeriodStatus('carried')).toBe(false);
    expect(isActivePeriodStatus('released')).toBe(false);
  });

  it('slotsLeft counts only active goals; carried/released free a slot', () => {
    const goals: PeriodGoalLite[] = [
      { status: 'open' },
      { status: 'done' },
      { status: 'released' },
      { status: 'carried' },
    ];
    expect(periodSlotsLeft(goals)).toBe(1);
    expect(periodSlotsLeft([])).toBe(3);
    expect(periodSlotsLeft([{ status: 'open' }, { status: 'open' }, { status: 'open' }])).toBe(0);
  });
});
