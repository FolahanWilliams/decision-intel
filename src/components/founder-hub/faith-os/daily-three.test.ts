import { describe, it, expect } from 'vitest';
import {
  summarizeDailyThree,
  shiftIsoDate,
  summarizeWeek,
  computeDisciplineExecutionCorrelation,
  type DailyGoalLite,
  type CheckinLite,
} from './daily-three';
import { DAILY_THREE_MAX } from './content';

const TODAY = '2026-06-01';

function g(date: string, partial: Partial<DailyGoalLite> = {}): DailyGoalLite {
  return {
    date,
    status: partial.status ?? 'open',
    isHighlight: partial.isHighlight ?? false,
    committed: partial.committed ?? false,
  };
}

describe('shiftIsoDate', () => {
  it('shifts forward and backward without DST drift', () => {
    expect(shiftIsoDate('2026-06-01', -1)).toBe('2026-05-31');
    expect(shiftIsoDate('2026-06-01', 1)).toBe('2026-06-02');
    expect(shiftIsoDate('2026-01-01', -1)).toBe('2025-12-31');
    expect(shiftIsoDate('2026-03-01', -1)).toBe('2026-02-28'); // 2026 not a leap year
  });
});

describe('summarizeDailyThree — today / cap', () => {
  it('empty input is fully zeroed with all slots free', () => {
    const s = summarizeDailyThree([], TODAY);
    expect(s.todayActiveCount).toBe(0);
    expect(s.slotsLeft).toBe(DAILY_THREE_MAX);
    expect(s.todayCommitted).toBe(false);
    expect(s.currentStreak).toBe(0);
    expect(s.completionRate).toBe(0);
    expect(s.highlightHitRate).toBe(0);
    expect(s.perDay).toHaveLength(30);
  });

  it('counts only open + done toward the cap; released/carried free a slot', () => {
    const s = summarizeDailyThree(
      [
        g(TODAY, { status: 'open' }),
        g(TODAY, { status: 'done' }),
        g(TODAY, { status: 'released' }),
        g(TODAY, { status: 'carried' }),
      ],
      TODAY
    );
    expect(s.todayActiveCount).toBe(2);
    expect(s.slotsLeft).toBe(1);
  });

  it('slotsLeft never goes negative even past the cap', () => {
    const s = summarizeDailyThree([g(TODAY), g(TODAY), g(TODAY), g(TODAY)], TODAY);
    expect(s.todayActiveCount).toBe(4);
    expect(s.slotsLeft).toBe(0);
  });

  it('todayCommitted requires ≥1 active goal AND all active committed', () => {
    expect(summarizeDailyThree([g(TODAY, { committed: true })], TODAY).todayCommitted).toBe(true);
    expect(
      summarizeDailyThree([g(TODAY, { committed: true }), g(TODAY, { committed: false })], TODAY)
        .todayCommitted
    ).toBe(false);
    // A released-but-committed goal doesn't count as an active goal, so a
    // single committed active goal alongside it is still fully committed.
    expect(
      summarizeDailyThree(
        [g(TODAY, { committed: true }), g(TODAY, { status: 'released', committed: false })],
        TODAY
      ).todayCommitted
    ).toBe(true);
  });
});

describe('summarizeDailyThree — streak', () => {
  it('counts consecutive days ending today', () => {
    const s = summarizeDailyThree([g(TODAY), g('2026-05-31'), g('2026-05-30')], TODAY);
    expect(s.currentStreak).toBe(3);
  });

  it('breaks on a gap day', () => {
    const s = summarizeDailyThree(
      [g(TODAY), g('2026-05-31'), g('2026-05-29')], // 05-30 missing
      TODAY
    );
    expect(s.currentStreak).toBe(2);
  });

  it('gives grace for an empty in-progress today (streak counts through yesterday)', () => {
    const s = summarizeDailyThree([g('2026-05-31'), g('2026-05-30')], TODAY);
    expect(s.currentStreak).toBe(2);
  });

  it('a day with only released/carried goals does NOT extend the streak', () => {
    const s = summarizeDailyThree(
      [g(TODAY), g('2026-05-31', { status: 'released' }), g('2026-05-30')],
      TODAY
    );
    expect(s.currentStreak).toBe(1);
  });
});

describe('summarizeDailyThree — rates + per-day strip', () => {
  it('completion rate is done over active across the window', () => {
    const s = summarizeDailyThree(
      [
        g(TODAY, { status: 'done' }),
        g(TODAY, { status: 'done' }),
        g(TODAY, { status: 'open' }),
        g(TODAY, { status: 'released' }), // excluded from denominator
      ],
      TODAY
    );
    expect(s.completionRate).toBeCloseTo(2 / 3, 5);
  });

  it('highlight hit rate is over days that had a highlight', () => {
    const s = summarizeDailyThree(
      [
        g(TODAY, { isHighlight: true, status: 'done' }),
        g('2026-05-31', { isHighlight: true, status: 'open' }),
        g('2026-05-30', { isHighlight: false, status: 'done' }), // no highlight that day
      ],
      TODAY
    );
    expect(s.highlightDays).toBe(2);
    expect(s.highlightHitRate).toBeCloseTo(0.5, 5);
  });

  it('per-day strip is windowDays long, oldest → newest, ending today', () => {
    const s = summarizeDailyThree([g(TODAY, { status: 'done' })], TODAY, 7);
    expect(s.perDay).toHaveLength(7);
    expect(s.perDay[0].date).toBe('2026-05-26');
    expect(s.perDay[6].date).toBe(TODAY);
    expect(s.perDay[6].set).toBe(1);
    expect(s.perDay[6].done).toBe(1);
    expect(s.daysActive).toBe(1);
  });

  it('ignores goals outside the window for the per-day strip but not the streak math window', () => {
    const s = summarizeDailyThree([g('2026-04-01')], TODAY, 7);
    // Outside the 7-day strip → no active days surfaced in perDay
    expect(s.perDay.every(d => d.set === 0)).toBe(true);
    expect(s.daysActive).toBe(0);
  });
});

describe('summarizeWeek', () => {
  const WEEK_START = '2026-05-31'; // a Sunday

  it('covers exactly 7 days Sun → Sat', () => {
    const w = summarizeWeek([], WEEK_START);
    expect(w.perDay).toHaveLength(7);
    expect(w.perDay[0].date).toBe('2026-05-31');
    expect(w.perDay[6].date).toBe('2026-06-06');
    expect(w.set).toBe(0);
    expect(w.completionRate).toBe(0);
  });

  it('aggregates set/done across the week and excludes released', () => {
    const w = summarizeWeek(
      [
        g('2026-05-31', { status: 'done' }),
        g('2026-06-01', { status: 'done' }),
        g('2026-06-01', { status: 'open' }),
        g('2026-06-01', { status: 'released' }), // excluded
      ],
      WEEK_START
    );
    expect(w.set).toBe(3);
    expect(w.done).toBe(2);
    expect(w.completionRate).toBeCloseTo(2 / 3, 5);
    expect(w.daysActive).toBe(2);
  });

  it('counts highlight days + hits within the week', () => {
    const w = summarizeWeek(
      [
        g('2026-05-31', { isHighlight: true, status: 'done' }),
        g('2026-06-02', { isHighlight: true, status: 'open' }),
      ],
      WEEK_START
    );
    expect(w.highlightDays).toBe(2);
    expect(w.highlightHits).toBe(1);
    expect(w.highlightHitRate).toBeCloseTo(0.5, 5);
  });

  it('ignores goals from outside the week', () => {
    const w = summarizeWeek([g('2026-06-07', { status: 'done' })], WEEK_START); // next Sunday
    expect(w.set).toBe(0);
  });
});

describe('computeDisciplineExecutionCorrelation', () => {
  function chk(date: string, sfcZero: boolean): CheckinLite {
    return { date, sfcZero };
  }

  it('has no signal until both buckets reach the floor', () => {
    const c = computeDisciplineExecutionCorrelation(
      [g('2026-06-01', { status: 'done' })],
      [chk('2026-06-01', true)],
      TODAY,
      30
    );
    expect(c.hasSignal).toBe(false);
    expect(c.sfcZeroDays).toBe(1);
    expect(c.otherDays).toBe(0);
  });

  it('separates SFC-zero vs other days and computes completion per bucket', () => {
    const goals: DailyGoalLite[] = [];
    const checkins: CheckinLite[] = [];
    // 3 SFC-zero days, each 1 done goal → completion 1.0
    for (let i = 0; i < 3; i++) {
      const d = shiftIsoDate(TODAY, -i);
      goals.push(g(d, { status: 'done' }));
      checkins.push(chk(d, true));
    }
    // 3 non-zero days, each 1 open goal → completion 0
    for (let i = 3; i < 6; i++) {
      const d = shiftIsoDate(TODAY, -i);
      goals.push(g(d, { status: 'open' }));
      checkins.push(chk(d, false));
    }
    const c = computeDisciplineExecutionCorrelation(goals, checkins, TODAY, 30);
    expect(c.sfcZeroDays).toBe(3);
    expect(c.otherDays).toBe(3);
    expect(c.sfcZeroCompletion).toBeCloseTo(1, 5);
    expect(c.otherCompletion).toBeCloseTo(0, 5);
    expect(c.delta).toBeCloseTo(1, 5);
    expect(c.hasSignal).toBe(true);
  });

  it('skips days with goals but no checkin (cannot classify)', () => {
    const c = computeDisciplineExecutionCorrelation(
      [g('2026-06-01', { status: 'done' })],
      [], // no checkins
      TODAY,
      30
    );
    expect(c.sfcZeroDays).toBe(0);
    expect(c.otherDays).toBe(0);
    expect(c.hasSignal).toBe(false);
  });
});
