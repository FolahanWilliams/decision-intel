import { describe, it, expect } from 'vitest';
import {
  computeProtocolState,
  checkinsForDay,
  selectVerse,
  finishIso,
  calendarDaysElapsed,
  shiftIso,
  todayIso,
  type RealityCheckinLite,
} from './tree-growth';
import {
  PROTOCOL_START_ISO,
  CHECKINS_TO_BLOOM,
  PROTOCOL_TOTAL_DAYS,
  RISING_VERSE_REFS,
  VERSES,
} from './content';

function m(date: string): RealityCheckinLite {
  return { date, kind: 'morning' };
}
function n(date: string, stayedOnTrack: boolean): RealityCheckinLite {
  return { date, kind: 'night', stayedOnTrack };
}

describe('finishIso', () => {
  it('lands on 19 Aug 2026 from the 14 Jun start (66 days)', () => {
    expect(finishIso()).toBe('2026-08-19');
    expect(finishIso(PROTOCOL_START_ISO)).toBe('2026-08-19');
  });
});

describe('shiftIso', () => {
  it('shifts without DST/month/year drift', () => {
    expect(shiftIso('2026-06-30', 1)).toBe('2026-07-01');
    expect(shiftIso('2026-01-01', -1)).toBe('2025-12-31');
    expect(shiftIso('2026-03-01', -1)).toBe('2026-02-28'); // 2026 is not a leap year
  });
});

describe('calendarDaysElapsed', () => {
  it('is 0 on the start day and never negative before it', () => {
    expect(calendarDaysElapsed('2026-06-14')).toBe(0);
    expect(calendarDaysElapsed('2026-06-01')).toBe(0); // pre-start clamps to 0
    expect(calendarDaysElapsed('2026-08-19')).toBe(PROTOCOL_TOTAL_DAYS);
  });
});

describe('todayIso', () => {
  it('formats a Date as a local YYYY-MM-DD key', () => {
    expect(todayIso(new Date(2026, 5, 14))).toBe('2026-06-14');
    expect(todayIso(new Date(2026, 11, 3))).toBe('2026-12-03');
  });
});

describe('computeProtocolState', () => {
  it('is an empty seed with no check-ins', () => {
    const s = computeProtocolState([]);
    expect(s.totalCheckins).toBe(0);
    expect(s.progress).toBe(0);
    expect(s.dayNumber).toBe(0);
    expect(s.bloom).toBe(false);
    expect(s.stageLabel).toBe('A seed in the soil');
  });

  it('grows from showing up — each check-in adds progress', () => {
    const one = computeProtocolState([m('2026-06-14')]);
    const two = computeProtocolState([m('2026-06-14'), n('2026-06-14', true)]);
    expect(two.totalCheckins).toBe(2);
    expect(two.progress).toBeGreaterThan(one.progress);
    expect(two.progress).toBeCloseTo(2 / CHECKINS_TO_BLOOM, 10);
  });

  it('INVARIANT: a slip is a check-in — it GROWS the tree, never resets it', () => {
    const clean = computeProtocolState([m('2026-06-14'), n('2026-06-14', true)]);
    const slip = computeProtocolState([m('2026-06-15'), n('2026-06-15', false)]);
    // A slip night contributes the SAME tree growth as a clean night.
    expect(slip.progress).toBeCloseTo(clean.progress, 10);
    expect(slip.totalCheckins).toBe(2);
  });

  it('INVARIANT: progress only ever increases as check-ins accumulate (no reset)', () => {
    const rows: RealityCheckinLite[] = [];
    let prev = -1;
    for (let i = 0; i < 10; i++) {
      const date = shiftIso(PROTOCOL_START_ISO, i);
      rows.push(m(date));
      // alternate clean / slip nights — the slip must NOT drop progress
      rows.push(n(date, i % 2 === 0));
      const p = computeProtocolState(rows).progress;
      expect(p).toBeGreaterThanOrEqual(prev);
      prev = p;
    }
  });

  it('tallies clean vs slip nights honestly (data, not a verdict)', () => {
    const s = computeProtocolState([
      n('2026-06-14', true),
      n('2026-06-15', false),
      n('2026-06-16', true),
      n('2026-06-17', true),
    ]);
    expect(s.cleanCount).toBe(3);
    expect(s.slipCount).toBe(1);
  });

  it('counts engaged days distinctly and caps dayNumber at the window', () => {
    const rows: RealityCheckinLite[] = [];
    for (let i = 0; i < 80; i++) rows.push(m(shiftIso(PROTOCOL_START_ISO, i)));
    const s = computeProtocolState(rows);
    expect(s.engagedDays).toBe(80);
    expect(s.dayNumber).toBe(PROTOCOL_TOTAL_DAYS); // capped at 66
  });

  it('blooms once check-ins reach the target and clamps progress at 1', () => {
    const rows: RealityCheckinLite[] = [];
    for (let i = 0; i < PROTOCOL_TOTAL_DAYS + 5; i++) {
      const date = shiftIso(PROTOCOL_START_ISO, i);
      rows.push(m(date), n(date, true));
    }
    const s = computeProtocolState(rows);
    expect(s.progress).toBe(1);
    expect(s.bloom).toBe(true);
    expect(s.stageLabel).toBe('In full bloom');
  });
});

describe('checkinsForDay', () => {
  it('separates the morning and night rows for a date', () => {
    const got = checkinsForDay(
      [m('2026-06-14'), n('2026-06-14', false), m('2026-06-15')],
      '2026-06-14'
    );
    expect(got.morning?.kind).toBe('morning');
    expect(got.night?.kind).toBe('night');
    expect(got.night?.stayedOnTrack).toBe(false);
  });
});

describe('selectVerse', () => {
  it('is deterministic for the same date + kind', () => {
    const a = selectVerse({ dateIso: '2026-06-14', kind: 'morning' });
    const b = selectVerse({ dateIso: '2026-06-14', kind: 'morning' });
    expect(a.ref).toBe(b.ref);
  });

  it('differs between morning and night slots', () => {
    const morning = selectVerse({ dateIso: '2026-06-14', kind: 'morning' });
    const night = selectVerse({ dateIso: '2026-06-14', kind: 'night' });
    expect(morning.ref).not.toBe(night.ref);
  });

  it('surfaces a rising verse on a slip night', () => {
    const v = selectVerse({ dateIso: '2026-06-14', kind: 'night', slipped: true });
    expect(RISING_VERSE_REFS).toContain(v.ref);
  });

  it('always returns a real verse from the pool', () => {
    for (let i = 0; i < 40; i++) {
      const v = selectVerse({ dateIso: shiftIso('2026-06-14', i), kind: 'morning' });
      expect(VERSES.some(x => x.ref === v.ref)).toBe(true);
    }
  });
});
