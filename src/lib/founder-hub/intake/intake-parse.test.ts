import { describe, it, expect } from 'vitest';
import {
  matchByName,
  normalizeIntakeActions,
  resolvePick,
  isActionReady,
  type IntakeContext,
  type RawIntakeAction,
} from './intake-parse';

const ctx: IntakeContext = {
  openGoals: [
    { id: 'g1', text: 'Ship the vocab engine' },
    { id: 'g2', text: 'Send 5 LinkedIn DMs' },
  ],
  prospects: [
    { id: 'p1', name: 'Jane Doe', company: 'AcmeCo', stage: 'dm_sent' },
    { id: 'p2', name: 'Bob Smith', company: 'Initech', stage: 'replied' },
  ],
};

describe('matchByName', () => {
  const cands = [
    { id: 'p1', name: 'Jane Doe @ AcmeCo' },
    { id: 'p2', name: 'Bob Smith @ Initech' },
  ];
  it('matches on a distinctive token', () => {
    expect(matchByName('jane', cands)).toEqual(['p1']);
    expect(matchByName('talked to Bob today', cands)).toEqual(['p2']);
  });
  it('matches on company too', () => {
    expect(matchByName('AcmeCo', cands)).toEqual(['p1']);
  });
  it('returns empty on no match', () => {
    expect(matchByName('Zog', cands)).toEqual([]);
    expect(matchByName('', cands)).toEqual([]);
  });
  it('ignores sub-3-char noise tokens', () => {
    expect(matchByName('to', cands)).toEqual([]);
  });
});

describe('normalizeIntakeActions', () => {
  it('drops unknown action types', () => {
    const raw: RawIntakeAction[] = [
      { type: 'launch_rocket', fields: {} },
      { type: 'daily_goal', fields: { text: 'x' } },
    ];
    const out = normalizeIntakeActions(raw, ctx);
    expect(out).toHaveLength(1);
    expect(out[0].type).toBe('daily_goal');
  });

  it('assigns deterministic ids and coerces field kinds', () => {
    const raw: RawIntakeAction[] = [
      { type: 'sat_session', fields: { minutes: '30', attempted: 10, correct: '8' } },
      {
        type: 'faith_checkin',
        fields: { sfcZero: 'true', prayer: true, scripture: 1, notes: '  good day  ' },
      },
    ];
    const out = normalizeIntakeActions(raw, ctx);
    expect(out[0].id).toBe('act-0');
    expect(out[1].id).toBe('act-1');
    expect(out[0].fields.minutes).toBe(30);
    expect(out[0].fields.attempted).toBe(10);
    expect(out[0].fields.correct).toBe(8);
    expect(out[1].fields.sfcZero).toBe(true);
    expect(out[1].fields.scripture).toBe(true);
    expect(out[1].fields.notes).toBe('good day');
  });

  it('only keeps fields declared in the action spec', () => {
    const raw: RawIntakeAction[] = [
      { type: 'daily_goal', fields: { text: 'x', bogus: 'drop me' } },
    ];
    const out = normalizeIntakeActions(raw, ctx);
    expect(out[0].fields.text).toBe('x');
    expect(out[0].fields.bogus).toBeUndefined();
  });

  it('complete_goal resolves a single fuzzy match to a targetId', () => {
    const raw: RawIntakeAction[] = [
      { type: 'complete_goal', targetName: 'finished the vocab engine' },
    ];
    const out = normalizeIntakeActions(raw, ctx);
    expect(out[0].targetId).toBe('g1');
    expect(out[0].needsPick).toBeFalsy();
    expect(out[0].fields.matchedLabel).toBe('Ship the vocab engine');
  });

  it('complete_goal with no match flags needsPick + candidates', () => {
    const raw: RawIntakeAction[] = [{ type: 'complete_goal', targetName: 'something unrelated' }];
    const out = normalizeIntakeActions(raw, ctx);
    expect(out[0].needsPick).toBe(true);
    expect(out[0].targetId).toBeUndefined();
    expect(out[0].candidates).toHaveLength(2);
    expect(out[0].note).toContain("Couldn't match");
  });

  it('prospect_advance matches and carries the stage field', () => {
    const raw: RawIntakeAction[] = [
      { type: 'prospect_advance', targetName: 'Jane', fields: { stage: 'replied' } },
    ];
    const out = normalizeIntakeActions(raw, ctx);
    expect(out[0].targetId).toBe('p1');
    expect(out[0].fields.stage).toBe('replied');
    expect(out[0].fields.matchedLabel).toBe('Jane Doe @ AcmeCo');
  });

  it('returns [] for non-array input', () => {
    expect(normalizeIntakeActions(undefined as unknown as RawIntakeAction[], ctx)).toEqual([]);
  });
});

describe('resolvePick', () => {
  it('binds the chosen target and clears the pick flag', () => {
    const [action] = normalizeIntakeActions(
      [{ type: 'prospect_advance', targetName: 'nobody', fields: { stage: 'replied' } }],
      ctx
    );
    expect(action.needsPick).toBe(true);
    const resolved = resolvePick(action, 'p2');
    expect(resolved.targetId).toBe('p2');
    expect(resolved.needsPick).toBe(false);
    expect(resolved.fields.matchedLabel).toBe('Bob Smith @ Initech');
  });
});

describe('isActionReady', () => {
  it('target-bound action is not ready until a target is bound', () => {
    const [a] = normalizeIntakeActions([{ type: 'complete_goal', targetName: 'nope' }], ctx);
    expect(isActionReady(a)).toBe(false);
    expect(isActionReady(resolvePick(a, 'g1'))).toBe(true);
  });
  it('create action needs its primary field', () => {
    const [empty] = normalizeIntakeActions([{ type: 'prospect_create', fields: {} }], ctx);
    expect(isActionReady(empty)).toBe(false);
    const [named] = normalizeIntakeActions(
      [{ type: 'prospect_create', fields: { name: 'Jane' } }],
      ctx
    );
    expect(isActionReady(named)).toBe(true);
  });
  it('an optional-primary action (reflection) is always ready', () => {
    const [r] = normalizeIntakeActions([{ type: 'daily_reflection', fields: {} }], ctx);
    expect(isActionReady(r)).toBe(true);
  });
});
