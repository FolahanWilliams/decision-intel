import { describe, it, expect } from 'vitest';
import {
  EVENTS,
  hasEventEnded,
  formatEventCountdown,
  getHighestPriorityUpcomingEvent,
  getNextEvent,
  type PrepEvent,
} from './event-prep';

// Synthetic events so the pure-function math is locked independently of the
// real (date-changing) EVENTS calendar. Spread a real event for the unused
// fields; only startDate/endDate/priority/name matter to these functions.
const base = EVENTS[0];
function mkEvent(
  startDate: string,
  endDate: string,
  priority: PrepEvent['priority'] = 'high',
  name = 'Test Event'
): PrepEvent {
  return { ...base, startDate, endDate, priority, name };
}
const at = (iso: string) => new Date(iso);

describe('hasEventEnded — keyed on endDate, not startDate (the multi-day fix)', () => {
  const multi = mkEvent('2026-06-09', '2026-06-10'); // BAFTA-shaped 2-day event

  it('is false on the start day', () => {
    expect(hasEventEnded(multi, at('2026-06-09T08:00:00Z'))).toBe(false);
  });

  it('is false on the FINAL day — a running multi-day event must stay current', () => {
    // This is the exact bug: daysUntil(start) is already negative here, but the
    // event is still running, so it must NOT be treated as ended.
    expect(hasEventEnded(multi, at('2026-06-10T12:00:00Z'))).toBe(false);
  });

  it('is true the day after the end', () => {
    expect(hasEventEnded(multi, at('2026-06-11T12:00:00Z'))).toBe(true);
  });

  it('single-day event: false on the day, true the day after', () => {
    const single = mkEvent('2026-06-15', '2026-06-15');
    expect(hasEventEnded(single, at('2026-06-15T12:00:00Z'))).toBe(false);
    expect(hasEventEnded(single, at('2026-06-16T12:00:00Z'))).toBe(true);
  });
});

describe('formatEventCountdown', () => {
  const ev = mkEvent('2026-06-20', '2026-06-21');

  it('future → "N days away"', () => {
    expect(formatEventCountdown(ev, at('2026-06-17T12:00:00Z'))).toBe('3 days away');
  });
  it('day before → "Tomorrow"', () => {
    expect(formatEventCountdown(ev, at('2026-06-19T12:00:00Z'))).toBe('Tomorrow');
  });
  it('start day → "Happening now"', () => {
    expect(formatEventCountdown(ev, at('2026-06-20T08:00:00Z'))).toBe('Happening now');
  });
  it('final day → "Happening now" (NOT a negative "T--1d" / "Past")', () => {
    expect(formatEventCountdown(ev, at('2026-06-21T12:00:00Z'))).toBe('Happening now');
  });
  it('after the end → "Past"', () => {
    expect(formatEventCountdown(ev, at('2026-06-23T12:00:00Z'))).toBe('Past');
  });
});

describe('selectors — never return an ended event', () => {
  it('getHighestPriorityUpcomingEvent + getNextEvent only return not-yet-ended events', () => {
    for (const day of ['2026-05-01', '2026-06-09', '2026-06-10', '2026-06-24', '2026-07-15']) {
      const today = at(day + 'T12:00:00Z');
      const picked = getHighestPriorityUpcomingEvent(today);
      if (picked) expect(hasEventEnded(picked, today)).toBe(false);
      const next = getNextEvent(today);
      if (next) expect(hasEventEnded(next, today)).toBe(false);
    }
  });
});

describe('BAFTA-day-2 regression — a highest-priority multi-day event is NOT dropped for a lower-priority overlap on its final day', () => {
  // Synthetic fixture (per the file header philosophy + the prior block's own
  // note): the real EVENTS calendar no longer carries a multi-day 'highest'
  // event after the 2026-06-26 ETA pivot rotated BAFTA/Strategy World out, so
  // the selection logic is locked against an injected calendar rather than a
  // date-rotating one. `getHighestPriorityUpcomingEvent` accepts an optional
  // events arg precisely for this.
  const multiDayHighest = mkEvent('2026-06-09', '2026-06-10', 'highest', 'BAFTA-class 2-day');
  const lowerPriorityOverlap = mkEvent('2026-06-10', '2026-06-10', 'high', 'Single-day overlap');
  const calendar = [lowerPriorityOverlap, multiDayHighest]; // unsorted on purpose

  it('returns the highest-priority event on its own final day', () => {
    const finalDay = at(multiDayHighest.endDate + 'T12:00:00Z');
    // Before the fix: the highest event had daysUntil < 0 on its final day → was
    // filtered out → a lower-priority OVERLAPPING event (or null) was returned.
    expect(hasEventEnded(multiDayHighest, finalDay)).toBe(false);
    expect(getHighestPriorityUpcomingEvent(finalDay, calendar)?.priority).toBe('highest');
    expect(getHighestPriorityUpcomingEvent(finalDay, calendar)?.startDate).toBe(
      multiDayHighest.startDate
    );
  });
});
