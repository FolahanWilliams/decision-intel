import { describe, it, expect } from 'vitest';
import {
  confidenceToProbability,
  computeCalibration,
  computeWeakAreas,
  rootCauseBreakdown,
  overconfidentMisses,
  computeProjectedScore,
  computeStreak,
  computeCalibrationBySkill,
  computeCalibrationTrend,
  daysUntil,
  isDueForReview,
  effectiveQuality,
  updateResponseMsEma,
  nextFailedTypes,
  pickAdaptiveQuizType,
  VOCAB_FAST_MS,
  VOCAB_SLOW_MS,
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

describe('computeCalibrationBySkill', () => {
  it('buckets by skill and sorts most-overconfident first', () => {
    const entries: ErrorEntryLite[] = [
      // algebra: 5 confident-and-correct → well calibrated
      ...Array.from({ length: 5 }, () =>
        entry({ skill: 'algebra', confidence: 3, wasCorrect: true })
      ),
      // inferences: 5 confident-and-wrong → overconfident (big positive gap)
      ...Array.from({ length: 5 }, () =>
        entry({ skill: 'inferences', section: 'rw', confidence: 3, wasCorrect: false })
      ),
    ];
    const out = computeCalibrationBySkill(entries);
    expect(out[0].skill).toBe('inferences');
    expect(out[0].band).toBe('overconfident');
    expect(out.find(s => s.skill === 'algebra')?.band).toBe('well_calibrated');
  });

  it('ignores untagged entries', () => {
    const out = computeCalibrationBySkill([entry({ skill: 'algebra', confidence: null })]);
    expect(out).toHaveLength(0);
  });
});

describe('computeCalibrationTrend', () => {
  it('buckets confidence-tagged entries into Sunday-start weeks', () => {
    // 2026-06-07 is a Sunday; 2026-06-10 is the same week; 2026-06-15 next week.
    const entries: ErrorEntryLite[] = [
      entry({ date: '2026-06-07', confidence: 3, wasCorrect: true }),
      entry({ date: '2026-06-10', confidence: 3, wasCorrect: true }),
      entry({ date: '2026-06-15', confidence: 3, wasCorrect: false }),
    ];
    const trend = computeCalibrationTrend(entries);
    expect(trend).toHaveLength(2);
    expect(trend[0].weekStart).toBe('2026-06-07');
    expect(trend[0].n).toBe(2);
    expect(trend[1].n).toBe(1);
    expect(trend[1].brier).toBe(0.903); // (0.95-0)^2 → round3
  });

  it('windows to the most recent N weeks', () => {
    const entries: ErrorEntryLite[] = [];
    // 10 distinct weeks
    for (let w = 0; w < 10; w++) {
      const d = new Date('2026-01-04T00:00:00Z'); // a Sunday
      d.setUTCDate(d.getUTCDate() + w * 7);
      entries.push(entry({ date: d.toISOString().slice(0, 10), confidence: 2, wasCorrect: true }));
    }
    expect(computeCalibrationTrend(entries, 4)).toHaveLength(4);
  });
});

describe('daysUntil', () => {
  it('counts forward days', () => {
    expect(daysUntil('2026-11-08', '2026-11-01')).toBe(7);
  });
  it('is negative for past dates', () => {
    expect(daysUntil('2026-06-01', '2026-06-07')).toBe(-6);
  });
});

describe('isDueForReview', () => {
  const now = new Date('2026-06-07T12:00:00Z').getTime();
  it('schedules a miss with no due date as due now', () => {
    expect(isDueForReview({ wasCorrect: false, nextDue: null }, now)).toBe(true);
  });
  it('excludes correct answers + archived', () => {
    expect(isDueForReview({ wasCorrect: true, nextDue: null }, now)).toBe(false);
    expect(isDueForReview({ wasCorrect: false, reviewArchived: true, nextDue: null }, now)).toBe(
      false
    );
  });
  it('respects a future due date', () => {
    expect(isDueForReview({ wasCorrect: false, nextDue: '2026-06-10T00:00:00Z' }, now)).toBe(false);
    expect(isDueForReview({ wasCorrect: false, nextDue: '2026-06-05T00:00:00Z' }, now)).toBe(true);
  });
});

describe('effectiveQuality (honest vocab SR)', () => {
  it('wrong + confident is the worst case (0) — the baited System-1 miss', () => {
    expect(effectiveQuality({ correct: false, confidence: 2 })).toBe(0);
    expect(effectiveQuality({ correct: false, confidence: 3 })).toBe(0);
  });
  it('wrong + unsure is a lesser lapse (1)', () => {
    expect(effectiveQuality({ correct: false, confidence: 0 })).toBe(1);
    expect(effectiveQuality({ correct: false, confidence: 1 })).toBe(1);
    expect(effectiveQuality({ correct: false, confidence: null })).toBe(1);
  });
  it('correct + certain is 5; correct + fairly-sure is 4', () => {
    expect(effectiveQuality({ correct: true, confidence: 3 })).toBe(5);
    expect(effectiveQuality({ correct: true, confidence: 2 })).toBe(4);
  });
  it('correct but unsure is downgraded to 3 (you guessed right — do not over-extend)', () => {
    expect(effectiveQuality({ correct: true, confidence: 1 })).toBe(3);
    expect(effectiveQuality({ correct: true, confidence: 0 })).toBe(3);
  });
  it('fast + correct bumps quality (capped at 5)', () => {
    expect(effectiveQuality({ correct: true, confidence: 2, responseMs: VOCAB_FAST_MS - 1 })).toBe(
      5
    );
    // already-5 stays 5
    expect(effectiveQuality({ correct: true, confidence: 3, responseMs: VOCAB_FAST_MS - 1 })).toBe(
      5
    );
  });
  it('slow + correct nudges down but never resets the streak (floored at 3)', () => {
    expect(effectiveQuality({ correct: true, confidence: 2, responseMs: VOCAB_SLOW_MS + 1 })).toBe(
      3
    );
    // unsure-correct (3) slow stays at the 3 floor, never drops to a failing <3
    expect(effectiveQuality({ correct: true, confidence: 1, responseMs: VOCAB_SLOW_MS + 1 })).toBe(
      3
    );
  });
  it('a wrong answer ignores response time entirely', () => {
    expect(effectiveQuality({ correct: false, confidence: 0, responseMs: 100 })).toBe(1);
  });
});

describe('updateResponseMsEma', () => {
  it('seeds with the first sample', () => {
    expect(updateResponseMsEma(null, 5000)).toBe(5000);
    expect(updateResponseMsEma(0, 5000)).toBe(5000);
  });
  it('moves toward the new sample by alpha', () => {
    expect(updateResponseMsEma(5000, 10000)).toBe(6500); // 5000 + 0.3*5000
  });
  it('ignores non-positive samples', () => {
    expect(updateResponseMsEma(5000, 0)).toBe(5000);
  });
});

describe('nextFailedTypes (per-type failure memory)', () => {
  it('adds a type on a miss, removes it on a pass, dedupes', () => {
    expect(nextFailedTypes([], 'cloze', false)).toEqual(['cloze']);
    expect(nextFailedTypes(['cloze'], 'cloze', false)).toEqual(['cloze']);
    expect(nextFailedTypes(['cloze', 'definition'], 'cloze', true)).toEqual(['definition']);
    expect(nextFailedTypes(['definition'], 'cloze', true)).toEqual(['definition']);
  });
});

describe('pickAdaptiveQuizType', () => {
  const all = ['cloze', 'definition', 'reverse'] as const;
  it('returns null when no types are available', () => {
    expect(pickAdaptiveQuizType([], [], 0)).toBeNull();
  });
  it('prefers a failed (weak-angle) type that is available', () => {
    expect(pickAdaptiveQuizType([...all], ['reverse'], 0)).toBe('reverse');
  });
  it('rotates deterministically when there is no weak angle', () => {
    expect(pickAdaptiveQuizType([...all], [], 0)).toBe('cloze');
    expect(pickAdaptiveQuizType([...all], [], 1)).toBe('definition');
    expect(pickAdaptiveQuizType([...all], [], 3)).toBe('cloze');
  });
  it('ignores a failed type that is not currently available', () => {
    expect(pickAdaptiveQuizType([...all], ['synonym'], 1)).toBe('definition');
  });
});
