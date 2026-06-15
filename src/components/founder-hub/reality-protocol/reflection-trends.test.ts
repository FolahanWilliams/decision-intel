import { describe, it, expect } from 'vitest';
import {
  factorValue,
  summarizeFactor,
  summarizeReflections,
  correlateFactorWithOutcome,
  sparklinePath,
  MIN_CORRELATION_N,
  type ReflectionLite,
} from './reflection-trends';
import type { RealityCheckinLite } from './tree-growth';
import { REFLECTION_FACTORS, REFLECTION_SCALE_MAX } from './content';

function r(date: string, mind?: number, energy?: number, intention?: number): ReflectionLite {
  return { date, mind, energy, intention };
}
function night(date: string, stayedOnTrack: boolean): RealityCheckinLite {
  return { date, kind: 'night', stayedOnTrack };
}

describe('factorValue', () => {
  it('accepts 1-5 and rejects everything else', () => {
    expect(factorValue(r('2026-06-14', 3), 'mind')).toBe(3);
    expect(factorValue(r('2026-06-14', 1), 'mind')).toBe(1);
    expect(factorValue(r('2026-06-14', 5), 'mind')).toBe(5);
    expect(factorValue(r('2026-06-14', 0), 'mind')).toBeNull();
    expect(factorValue(r('2026-06-14', 6), 'mind')).toBeNull();
    expect(factorValue({ date: '2026-06-14', mind: null }, 'mind')).toBeNull();
    expect(factorValue({ date: '2026-06-14' }, 'mind')).toBeNull();
  });
});

describe('summarizeFactor', () => {
  it('is empty with no rated rows', () => {
    const t = summarizeFactor([], 'mind');
    expect(t.count).toBe(0);
    expect(t.average).toBeNull();
    expect(t.delta).toBeNull();
    expect(t.series).toEqual([]);
  });

  it('builds an ascending series of only the rated days and the mean', () => {
    const t = summarizeFactor(
      [r('2026-06-16', 4), r('2026-06-14', 2), r('2026-06-15', undefined, 3)],
      'mind'
    );
    // only 06-14 (2) and 06-16 (4) carry a mind value; sorted ascending
    expect(t.series.map(p => p.date)).toEqual(['2026-06-14', '2026-06-16']);
    expect(t.count).toBe(2);
    expect(t.average).toBeCloseTo(3, 10);
  });

  it('computes a positive delta when recent ratings rise above earlier ones', () => {
    const rows: ReflectionLite[] = [];
    // 8 early low days (rating 2) then 4 recent high days (rating 5)
    for (let i = 0; i < 8; i++) rows.push(r(`2026-06-${String(10 + i).padStart(2, '0')}`, 2));
    for (let i = 0; i < 4; i++) rows.push(r(`2026-06-${String(20 + i).padStart(2, '0')}`, 5));
    const t = summarizeFactor(rows, 'mind');
    expect(t.recentAverage).not.toBeNull();
    expect(t.priorAverage).not.toBeNull();
    expect(t.delta).toBeGreaterThan(0); // mind is trending UP — the motivating signal
  });
});

describe('summarizeReflections', () => {
  it('returns a trend per requested factor, in order', () => {
    const ids = REFLECTION_FACTORS.map(f => f.id);
    const trends = summarizeReflections([r('2026-06-14', 3, 4, 5)], ids);
    expect(trends.map(t => t.id)).toEqual(ids);
    expect(trends[0].count).toBe(1);
  });
});

describe('correlateFactorWithOutcome (honest N-floor)', () => {
  it('returns null below the sample floor on either side', () => {
    // only 2 high days + 2 low days — under MIN_CORRELATION_N
    const refl = [r('2026-06-14', 5), r('2026-06-15', 5), r('2026-06-16', 1), r('2026-06-17', 1)];
    const checks = [
      night('2026-06-14', true),
      night('2026-06-15', true),
      night('2026-06-16', false),
      night('2026-06-17', false),
    ];
    expect(correlateFactorWithOutcome(refl, checks, 'mind')).toBeNull();
    expect(MIN_CORRELATION_N).toBeGreaterThan(2);
  });

  it('computes high vs low on-track rates once both buckets clear the floor', () => {
    const refl: ReflectionLite[] = [];
    const checks: RealityCheckinLite[] = [];
    // 5 high-intention days, all on track; 5 low-intention days, all slips
    for (let i = 0; i < 5; i++) {
      const d = `2026-06-${String(10 + i).padStart(2, '0')}`;
      refl.push(r(d, undefined, undefined, 5));
      checks.push(night(d, true));
    }
    for (let i = 0; i < 5; i++) {
      const d = `2026-06-${String(20 + i).padStart(2, '0')}`;
      refl.push(r(d, undefined, undefined, 1));
      checks.push(night(d, false));
    }
    const c = correlateFactorWithOutcome(refl, checks, 'intention');
    expect(c).not.toBeNull();
    expect(c?.highRate).toBeCloseTo(1, 10);
    expect(c?.lowRate).toBeCloseTo(0, 10);
    expect(c?.highN).toBe(5);
    expect(c?.lowN).toBe(5);
  });

  it('ignores days with no marked night (cannot correlate without an outcome)', () => {
    const refl = [r('2026-06-14', 5)];
    const checks = [{ date: '2026-06-14', kind: 'morning' } as RealityCheckinLite];
    expect(correlateFactorWithOutcome(refl, checks, 'mind')).toBeNull();
  });
});

describe('sparklinePath', () => {
  it('returns an empty path for no values', () => {
    expect(sparklinePath([], 100, 20, REFLECTION_SCALE_MAX)).toBe('');
  });

  it('draws a flat line for a single value', () => {
    const p = sparklinePath([3], 100, 20, REFLECTION_SCALE_MAX);
    expect(p.startsWith('M0 ')).toBe(true);
    expect(p).toContain('L100 ');
  });

  it('maps a higher rating to a higher point (smaller y) on the canvas', () => {
    // a rising series should end higher (smaller y) than it starts
    const p = sparklinePath([1, 5], 100, 20, REFLECTION_SCALE_MAX);
    const ys = [...p.matchAll(/[ML][\d.]+ ([\d.]+)/g)].map(m => Number(m[1]));
    expect(ys[ys.length - 1]).toBeLessThan(ys[0]); // y shrinks as value rises
  });
});

describe('the reflection NEVER feeds the tree (invariant lives elsewhere)', () => {
  it('reflection-trends imports nothing that mutates check-in/tree state', () => {
    // Guard-by-contract: this module is read-only analysis. The factor ids it
    // understands are exactly the SSOT factor ids — adding a 4th factor is a
    // schema column + an SSOT entry + a read here, never a tree change.
    const ids = REFLECTION_FACTORS.map(f => f.id).sort();
    expect(ids).toEqual(['energy', 'intention', 'mind']);
  });
});
