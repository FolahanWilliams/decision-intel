import { describe, it, expect } from 'vitest';
import {
  assembleCorpus,
  isSynthesisReady,
  reflectionDayCount,
  buildSynthesisPrompt,
  parseSynthesis,
  mockSynthesis,
  SYNTHESIS_MIN_DAYS,
  type SynthesisCheckinRow,
  type SynthesisReflectionRow,
} from './synthesis';

function morning(date: string, plan?: string): SynthesisCheckinRow {
  return { date, kind: 'morning', escapePlan: plan };
}
function night(date: string, stayedOnTrack: boolean): SynthesisCheckinRow {
  return { date, kind: 'night', stayedOnTrack };
}
function refl(
  date: string,
  mind?: number,
  energy?: number,
  intention?: number,
  note?: string,
  tomorrow?: string
): SynthesisReflectionRow {
  return { date, mind, energy, intention, note, tomorrow };
}

describe('reflectionDayCount + isSynthesisReady (honest N-floor)', () => {
  it('counts distinct days with a rating OR text, ignores empty rows', () => {
    const rows = [
      refl('2026-06-14', 8),
      refl('2026-06-15', undefined, undefined, undefined, 'rough day'),
      refl('2026-06-16'), // empty — ignored
      refl('2026-06-16', undefined, undefined, undefined, undefined, 'phone in the hall'), // same day
    ];
    expect(reflectionDayCount(rows)).toBe(3); // 14, 15, 16 (the empty 16 doesn't add)
  });

  it('refuses synthesis below the floor', () => {
    const few = Array.from({ length: SYNTHESIS_MIN_DAYS - 1 }, (_, i) =>
      refl(`2026-06-${String(14 + i).padStart(2, '0')}`, 7)
    );
    expect(isSynthesisReady(few)).toBe(false);
    const enough = Array.from({ length: SYNTHESIS_MIN_DAYS }, (_, i) =>
      refl(`2026-06-${String(14 + i).padStart(2, '0')}`, 7)
    );
    expect(isSynthesisReady(enough)).toBe(true);
  });
});

describe('assembleCorpus', () => {
  const checkins: SynthesisCheckinRow[] = [
    morning('2026-06-14', 'read, phone in the hall'),
    night('2026-06-14', true),
    morning('2026-06-15', 'gym after work'),
    night('2026-06-15', false), // slip
    morning('2026-06-16', 'piano then Bible'),
    night('2026-06-16', true),
  ];
  const reflections: SynthesisReflectionRow[] = [
    refl('2026-06-14', 8, 7, 6, 'solid day', 'wake earlier'),
    refl('2026-06-15', 3, 4, 2, 'sat around, TikTok all day'),
    refl('2026-06-16', 7, 8, 7, 'back on plan'),
  ];

  it('counts engaged days, clean/slip, and reflection days', () => {
    const c = assembleCorpus(checkins, reflections);
    expect(c.dayNumber).toBe(3);
    expect(c.cleanCount).toBe(2);
    expect(c.slipCount).toBe(1);
    expect(c.reflectionDays).toBe(3);
    expect(c.slipDates).toEqual(['2026-06-15']);
  });

  it('captures morning plans and reflections, ordered ascending', () => {
    const c = assembleCorpus(checkins, reflections);
    expect(c.morningPlans.map(p => p.plan)).toEqual([
      'read, phone in the hall',
      'gym after work',
      'piano then Bible',
    ]);
    expect(c.reflections.map(r => r.date)).toEqual(['2026-06-14', '2026-06-15', '2026-06-16']);
    expect(c.reflections[1].note).toBe('sat around, TikTok all day');
  });

  it('includes the 1-10 factor trends (no 6-10 dropped — the scale-bug guard)', () => {
    const c = assembleCorpus(checkins, reflections);
    const mind = c.factorTrends.find(t => t.id === 'mind');
    // mind values are 8, 3, 7 — the 8 and 7 must NOT be dropped (pre-fix they were)
    expect(mind?.count).toBe(3);
    expect(mind?.series.map(s => s.value)).toEqual([8, 3, 7]);
  });
});

describe('buildSynthesisPrompt', () => {
  it('grounds the prompt in the actual data (plans, notes, the one-nudge rule)', () => {
    const corpus = assembleCorpus(
      [morning('2026-06-14', 'phone in the hall'), night('2026-06-14', true)],
      [refl('2026-06-14', 8, 7, 6, 'good day')]
    );
    const p = buildSynthesisPrompt(corpus);
    expect(p).toContain('phone in the hall'); // his own words
    expect(p).toContain('good day');
    expect(p).toContain('EXACTLY ONE forward nudge');
    expect(p).toContain('pattern-spotter, NOT a coach');
    expect(p).not.toContain('capstone'); // not the day-66 framing by default
  });

  it('switches to capstone framing for the day-66 close', () => {
    const corpus = assembleCorpus([], [refl('2026-06-14', 8)]);
    expect(buildSynthesisPrompt(corpus, true)).toContain('DAY-66 capstone');
  });
});

describe('parseSynthesis (defensive)', () => {
  const valid = JSON.stringify({
    arc: 'Trending up over the first week.',
    patterns: [
      { title: 'Mornings matter', detail: 'On-track nights follow specific morning plans.' },
      { title: 'TikTok trigger', detail: 'Low days start with the feed.' },
    ],
    nudge: {
      observation: 'phone in hall never makes the plan',
      action: 'make it the standing rule',
    },
  });

  it('parses a valid payload', () => {
    const r = parseSynthesis(valid);
    expect(r?.arc).toContain('Trending up');
    expect(r?.patterns).toHaveLength(2);
    expect(r?.nudge.action).toBe('make it the standing rule');
  });

  it('strips markdown code fences', () => {
    expect(parseSynthesis('```json\n' + valid + '\n```')).not.toBeNull();
  });

  it('returns null on malformed / empty / missing fields', () => {
    expect(parseSynthesis('not json')).toBeNull();
    expect(parseSynthesis('{}')).toBeNull();
    expect(parseSynthesis(JSON.stringify({ arc: 'x', patterns: [], nudge: {} }))).toBeNull();
    expect(
      parseSynthesis(
        JSON.stringify({ arc: 'x', patterns: [{ title: 't', detail: 'd' }], nudge: {} })
      )
    ).toBeNull(); // no action
  });
});

describe('mockSynthesis (deterministic, no key)', () => {
  it('produces a valid result grounded in the corpus', () => {
    const corpus = assembleCorpus(
      [morning('2026-06-14', 'read'), night('2026-06-14', true), night('2026-06-15', false)],
      [refl('2026-06-14', 8), refl('2026-06-15', 3)]
    );
    const m = mockSynthesis(corpus);
    expect(m.arc).toBeTruthy();
    expect(m.patterns.length).toBeGreaterThan(0);
    expect(m.nudge.action).toBeTruthy();
    // mentions the slip honestly
    expect(m.patterns.some(p => /slip/i.test(p.title) || /slip/i.test(p.detail))).toBe(true);
  });
});
