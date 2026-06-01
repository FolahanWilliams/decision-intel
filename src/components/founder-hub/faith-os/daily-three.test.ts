import { describe, it, expect } from 'vitest';
import { summarizeDailyThree, shiftIsoDate, type DailyGoalLite } from './daily-three';
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
