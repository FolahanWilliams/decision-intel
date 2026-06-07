import { describe, it, expect } from 'vitest';
import {
  confidenceToProbability,
  computeCalibration,
  computeWeakAreas,
  rootCauseBreakdown,
  overconfidentMisses,
  computeProjectedScore,
  computeStreak,
  CALIBRATION_MIN_N,
  type ErrorEntryLite,
  type SessionLite,
  type TestLite,
} from './sat-calibration';

function entry(p: Partial<ErrorEntryLite>): ErrorEntryLite {
  return {
    date: '2026-06-07',
    section: 'math',
    skill: 'linear_equations',
    rootCause: null,
    confidence: null,
    wasCorrect: true,
    ...p,
  };
}

describe('confidenceToProbability', () => {
  it('maps 0-3 to rising subjective probabilities', () => {
    expect(confidenceToProbability(0)).toBe(0.25);
    expect(confidenceToProbability(1)).toBe(0.5);
    expect(confidenceToProbability(2)).toBe(0.75);
    expect(confidenceToProbability(3)).toBe(0.95);
  });
  it('defaults unknown levels to 0.5', () => {
    expect(confidenceToProbability(9)).toBe(0.5);
  });
});

describe('computeCalibration', () => {
  it('returns too_few below the N-floor', () => {
    const r = computeCalibration([entry({ confidence: 3, wasCorrect: false })]);
    expect(r.band).toBe('too_few');
    expect(r.brier).toBeNull();
    expect(r.sampleSize).toBe(1);
  });

  it('ignores untagged entries when counting toward the floor', () => {
    const tagged = Array.from({ length: CALIBRATION_MIN_N }, () =>
      entry({ confidence: 3, wasCorrect: true })
    );
    const withUntagged = [...tagged, entry({ confidence: null, wasCorrect: false })];
    const r = computeCalibration(withUntagged);
    expect(r.sampleSize).toBe(CALIBRATION_MIN_N);
  });

  it('flags overconfidence when high confidence meets low accuracy', () => {
    // 6 entries, all confidence 3 (p=0.95) but all wrong → big positive gap.
    const entries = Array.from({ length: 6 }, () => entry({ confidence: 3, wasCorrect: false }));
    const r = computeCalibration(entries);
    expect(r.band).toBe('overconfident');
    expect(r.gap).toBeGreaterThan(0.1);
    expect(r.accuracy).toBe(0);
    expect(r.brier).toBe(0.903); // (0.95-0)^2 = 0.9025, round3 → 0.903
  });

  it('flags underconfidence when low confidence meets high accuracy', () => {
    const entries = Array.from({ length: 6 }, () => entry({ confidence: 0, wasCorrect: true }));
    const r = computeCalibration(entries);
    expect(r.band).toBe('underconfident');
    expect(r.gap).toBeLessThan(-0.1);
  });

  it('reports well_calibrated when confidence matches outcomes', () => {
    // confidence 3 (p=0.95) and correct → tiny gap.
    const entries = Array.from({ length: 6 }, () => entry({ confidence: 3, wasCorrect: true }));
    const r = computeCalibration(entries);
    expect(r.band).toBe('well_calibrated');
  });
});

describe('computeWeakAreas', () => {
  it('ranks by error rate then volume and respects the min-attempts floor', () => {
    const entries: ErrorEntryLite[] = [
      // quadratics: 3 attempts, 3 wrong → 1.0
      entry({ skill: 'quadratics', wasCorrect: false }),
      entry({ skill: 'quadratics', wasCorrect: false }),
      entry({ skill: 'quadratics', wasCorrect: false }),
      // words_in_context: 4 attempts, 2 wrong → 0.5
      entry({ skill: 'words_in_context', section: 'rw', wasCorrect: false }),
      entry({ skill: 'words_in_context', section: 'rw', wasCorrect: false }),
      entry({ skill: 'words_in_context', section: 'rw', wasCorrect: true }),
      entry({ skill: 'words_in_context', section: 'rw', wasCorrect: true }),
      // transitions: only 1 attempt → excluded by the floor
      entry({ skill: 'transitions', section: 'rw', wasCorrect: false }),
    ];
    const weak = computeWeakAreas(entries);
    expect(weak.map(w => w.skill)).toEqual(['quadratics', 'words_in_context']);
    expect(weak[0].errorRate).toBe(1);
    expect(weak.find(w => w.skill === 'transitions')).toBeUndefined();
  });

  it('honours the limit', () => {
    const entries: ErrorEntryLite[] = [];
    for (const skill of ['a', 'b', 'c']) {
      entries.push(entry({ skill, wasCorrect: false }), entry({ skill, wasCorrect: false }));
    }
    expect(computeWeakAreas(entries, 2)).toHaveLength(2);
  });
});

describe('rootCauseBreakdown', () => {
  it('counts only wrong answers, bucketing untagged', () => {
    const entries: ErrorEntryLite[] = [
      entry({ wasCorrect: false, rootCause: 'trap' }),
      entry({ wasCorrect: false, rootCause: 'trap' }),
      entry({ wasCorrect: false, rootCause: null }),
      entry({ wasCorrect: true, rootCause: 'careless' }), // correct → ignored
    ];
    const b = rootCauseBreakdown(entries);
    expect(b.trap).toBe(2);
    expect(b.untagged).toBe(1);
    expect(b.careless).toBeUndefined();
  });
});

describe('overconfidentMisses', () => {
  it('returns confident-but-wrong entries only', () => {
    const entries: ErrorEntryLite[] = [
      entry({ confidence: 3, wasCorrect: false }), // ✓
      entry({ confidence: 2, wasCorrect: false }), // ✓
      entry({ confidence: 1, wasCorrect: false }), // not confident
      entry({ confidence: 3, wasCorrect: true }), // not a miss
      entry({ confidence: null, wasCorrect: false }), // untagged
    ];
    expect(overconfidentMisses(entries)).toHaveLength(2);
  });
});

describe('computeProjectedScore', () => {
  it('returns nulls with no tests', () => {
    const r = computeProjectedScore([]);
    expect(r.projectedTotal).toBeNull();
    expect(r.sampleSize).toBe(0);
  });

  it('averages section scores independently and sums for the projected total', () => {
    const tests: TestLite[] = [
      { date: '2026-06-01', section: 'full', rwScore: 700, mathScore: 760, totalScore: 1460 },
      { date: '2026-06-05', section: 'math', rwScore: null, mathScore: 780, totalScore: null },
    ];
    const r = computeProjectedScore(tests);
    expect(r.rwAvg).toBe(700); // only one R&W score
    expect(r.mathAvg).toBe(770); // (760+780)/2
    expect(r.projectedTotal).toBe(1470);
  });

  it('windows to the most recent N section scores', () => {
    const tests: TestLite[] = Array.from({ length: 7 }, (_, i) => ({
      date: `2026-06-0${i + 1}`,
      section: 'math',
      rwScore: null,
      mathScore: 600 + i * 10, // 600..660; most recent (06-07) = 660
      totalScore: null,
    }));
    const r = computeProjectedScore(tests, 3);
    // most recent 3 math scores: 660, 650, 640 → avg 650
    expect(r.mathAvg).toBe(650);
  });
});

describe('computeStreak', () => {
  const s = (date: string, completed = true): SessionLite => ({ date, completed });

  it('returns zero with no completed sessions', () => {
    expect(computeStreak([s('2026-06-01', false)])).toEqual({ current: 0, longest: 0 });
  });

  it('counts a live current streak ending today', () => {
    const r = computeStreak([s('2026-06-05'), s('2026-06-06'), s('2026-06-07')], '2026-06-07');
    expect(r.current).toBe(3);
    expect(r.longest).toBe(3);
  });

  it('keeps the streak live if the most recent day is yesterday', () => {
    const r = computeStreak([s('2026-06-05'), s('2026-06-06')], '2026-06-07');
    expect(r.current).toBe(2);
  });

  it('breaks the current streak if the last day is older than yesterday', () => {
    const r = computeStreak([s('2026-06-01'), s('2026-06-02')], '2026-06-07');
    expect(r.current).toBe(0);
    expect(r.longest).toBe(2);
  });

  it('finds the longest run across a gap', () => {
    const r = computeStreak(
      [s('2026-06-01'), s('2026-06-02'), s('2026-06-03'), s('2026-06-06'), s('2026-06-07')],
      '2026-06-07'
    );
    expect(r.longest).toBe(3);
    expect(r.current).toBe(2);
  });

  it('dedupes multiple sessions on the same day', () => {
    const r = computeStreak([s('2026-06-07'), s('2026-06-07')], '2026-06-07');
    expect(r.current).toBe(1);
  });
});
