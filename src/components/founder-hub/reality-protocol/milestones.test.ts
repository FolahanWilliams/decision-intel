import { describe, it, expect } from 'vitest';
import {
  PROTOCOL_MILESTONES,
  PROTOCOL_TOTAL_DAYS,
  milestoneToReveal,
  milestoneDaysAtOrBelow,
} from './content';

describe('PROTOCOL_MILESTONES (the thresholds)', () => {
  it('is two grounds, ascending, with day 66 = the protocol length', () => {
    const days = PROTOCOL_MILESTONES.map(m => m.day);
    expect(days).toEqual([14, PROTOCOL_TOTAL_DAYS]);
    expect(days[1]).toBe(66);
    // ascending — milestoneToReveal + the dismiss cascade assume it
    expect([...days].sort((a, b) => a - b)).toEqual(days);
  });

  it('the day-66 reveal is a threshold (sending), day-14 is new ground', () => {
    expect(PROTOCOL_MILESTONES.find(m => m.day === 66)?.kind).toBe('threshold');
    expect(PROTOCOL_MILESTONES.find(m => m.day === 14)?.kind).toBe('ground');
  });

  it('every reveal carries a real KJV anchor verse + body lines', () => {
    for (const m of PROTOCOL_MILESTONES) {
      expect(m.verse.ref).toMatch(/\d/);
      expect(m.verse.text.length).toBeGreaterThan(20);
      expect(m.lines.length).toBeGreaterThan(0);
      expect(m.title.length).toBeGreaterThan(0);
    }
  });
});

describe('milestoneToReveal (surprise-on-arrival, never a countdown)', () => {
  it('shows nothing before the first ground is reached', () => {
    expect(milestoneToReveal(0, [])).toBeNull();
    expect(milestoneToReveal(13, [])).toBeNull();
  });

  it('reveals the ground the first time it is reached', () => {
    expect(milestoneToReveal(14, [])?.day).toBe(14);
    expect(milestoneToReveal(20, [])?.day).toBe(14); // still unseen, still reached
  });

  it('once seen, that ground never re-surfaces', () => {
    expect(milestoneToReveal(20, [14])).toBeNull();
    expect(milestoneToReveal(65, [14])).toBeNull();
  });

  it('at the day-66 threshold, reveals the close', () => {
    expect(milestoneToReveal(66, [14])?.day).toBe(66);
    expect(milestoneToReveal(70, [14])?.day).toBe(66);
  });

  it('a fresh device past several grounds shows the most recent, not an old one', () => {
    // never seen either, already at day 70 → show the threshold, not day 14
    expect(milestoneToReveal(70, [])?.day).toBe(66);
  });

  it('with everything seen, shows nothing', () => {
    expect(milestoneToReveal(70, [14, 66])).toBeNull();
  });
});

describe('milestoneDaysAtOrBelow (the dismiss cascade)', () => {
  it('dismissing the threshold marks every lower ground seen too', () => {
    expect(milestoneDaysAtOrBelow(66)).toEqual([14, 66]);
  });

  it('dismissing the first ground marks only itself', () => {
    expect(milestoneDaysAtOrBelow(14)).toEqual([14]);
  });

  it('a lower ground never trails a higher one after dismissal', () => {
    // dismiss day 66 at day 70 having never seen day 14 → both marked → nothing left
    const seen = milestoneDaysAtOrBelow(66);
    expect(milestoneToReveal(70, seen)).toBeNull();
  });
});
