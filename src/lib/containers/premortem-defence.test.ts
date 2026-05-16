/**
 * V2 pure-gate regression suite (ship 2026-05-16). Locks the shared
 * outcome-gate predicate so the server hard-gate and the client guard
 * can never diverge. No I/O — the orchestration (API route) is a thin
 * wrapper around these.
 */

import { describe, it, expect } from 'vitest';
import {
  requiresPremortemDefence,
  parsePremortemDefence,
  isPremortemDefenceComplete,
  checkPremortemDefenceGate,
  MIN_DEFENCE_CHARS,
} from './premortem-defence';

const goodAnswer = (pattern = 'deal_fever') => ({
  pattern,
  question: 'Where is the named operational owner for the synergy claim?',
  writtenDefence: 'The CFO owns it; the 90-day milestone is the ERP cutover, tracked in the plan.',
});

const fullDefence = {
  answers: [goodAnswer('deal_fever'), goodAnswer('winners_curse'), goodAnswer('synergy_mirage')],
  answeredByUserId: 'user_123',
  answeredAt: '2026-05-16T10:00:00.000Z',
};

describe('requiresPremortemDefence', () => {
  it('fires only for acquisition-mode containers with ≥1 analyzed doc', () => {
    expect(requiresPremortemDefence({ kind: 'acquisition', analyzedDocCount: 1 })).toBe(true);
    expect(requiresPremortemDefence({ kind: 'acquisition', analyzedDocCount: 0 })).toBe(false);
    expect(requiresPremortemDefence({ kind: 'investment', analyzedDocCount: 5 })).toBe(false);
    expect(requiresPremortemDefence({ kind: 'strategic', analyzedDocCount: 3 })).toBe(false);
  });
});

describe('parsePremortemDefence — defensive', () => {
  it('parses a well-formed blob', () => {
    const p = parsePremortemDefence(fullDefence);
    expect(p).not.toBeNull();
    expect(p!.answers).toHaveLength(3);
    expect(p!.answeredByUserId).toBe('user_123');
  });
  it('returns null on null / non-object / missing answers', () => {
    expect(parsePremortemDefence(null)).toBeNull();
    expect(parsePremortemDefence('nope')).toBeNull();
    expect(parsePremortemDefence({ answeredByUserId: 'u', answeredAt: 'x' })).toBeNull();
  });
  it('returns null when answeredByUserId is absent', () => {
    expect(parsePremortemDefence({ answers: [goodAnswer()], answeredAt: 'x' })).toBeNull();
  });
  it('drops answers with an invalid pattern, returns null when none survive', () => {
    expect(
      parsePremortemDefence({
        answers: [{ pattern: 'not_a_pattern', question: 'q', writtenDefence: 'd' }],
        answeredByUserId: 'u',
        answeredAt: 'x',
      })
    ).toBeNull();
  });
  it('keeps only valid answers in a mixed blob', () => {
    const p = parsePremortemDefence({
      answers: [goodAnswer('deal_fever'), { pattern: 'bogus', question: 'q', writtenDefence: 'd' }],
      answeredByUserId: 'u',
      answeredAt: 'x',
    });
    expect(p!.answers).toHaveLength(1);
  });
});

describe('isPremortemDefenceComplete', () => {
  it('true when every answer has a substantive written defence', () => {
    expect(isPremortemDefenceComplete(fullDefence)).toBe(true);
  });
  it('false when any answer is a stub (below MIN_DEFENCE_CHARS)', () => {
    const stub = {
      ...fullDefence,
      answers: [goodAnswer('deal_fever'), { ...goodAnswer('winners_curse'), writtenDefence: 'ok' }],
    };
    expect('ok'.length).toBeLessThan(MIN_DEFENCE_CHARS);
    expect(isPremortemDefenceComplete(stub)).toBe(false);
  });
  it('false for null / malformed', () => {
    expect(isPremortemDefenceComplete(null)).toBe(false);
    expect(isPremortemDefenceComplete({})).toBe(false);
  });
});

describe('checkPremortemDefenceGate — the shared predicate', () => {
  it('always allows non-acquisition / empty containers (no regression)', () => {
    expect(
      checkPremortemDefenceGate({ kind: 'investment', analyzedDocCount: 9, premortemDefence: null })
        .allowed
    ).toBe(true);
    expect(
      checkPremortemDefenceGate({
        kind: 'acquisition',
        analyzedDocCount: 0,
        premortemDefence: null,
      }).allowed
    ).toBe(true);
  });
  it('BLOCKS acquisition + analyzed when no defence recorded', () => {
    const v = checkPremortemDefenceGate({
      kind: 'acquisition',
      analyzedDocCount: 2,
      premortemDefence: null,
    });
    expect(v.allowed).toBe(false);
    expect(v.code).toBe('PREMORTEM_DEFENCE_REQUIRED');
    expect(v.reason).toMatch(/pre-mortem/i);
  });
  it('BLOCKS when the defence is a stub', () => {
    const stub = {
      answers: [{ pattern: 'deal_fever', question: 'q', writtenDefence: 'no' }],
      answeredByUserId: 'u',
      answeredAt: 'x',
    };
    expect(
      checkPremortemDefenceGate({
        kind: 'acquisition',
        analyzedDocCount: 2,
        premortemDefence: stub,
      }).allowed
    ).toBe(false);
  });
  it('ALLOWS once a complete defence is recorded', () => {
    expect(
      checkPremortemDefenceGate({
        kind: 'acquisition',
        analyzedDocCount: 2,
        premortemDefence: fullDefence,
      }).allowed
    ).toBe(true);
  });
});
