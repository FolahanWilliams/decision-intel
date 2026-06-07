import { describe, it, expect } from 'vitest';
import {
  argumentReadiness,
  normalizeArgumentResult,
  mockArgumentResult,
  isArgumentCategory,
  ARGUMENT_RUBRIC_KEYS,
  type ArgumentInput,
} from './argument-builder';

const full: ArgumentInput = {
  claim: 'DI is more than a wrapper.',
  evidence: 'The accumulating decision→outcome record compounds per org.',
  counterargument:
    'A competent team can rebuild the audit engine in weeks, so the engine is not a moat at all.',
  rebuttal: 'True for the engine — but the embedded record + enforced process is what compounds.',
};

describe('isArgumentCategory', () => {
  it('accepts known categories, rejects others', () => {
    expect(isArgumentCategory('moat_defense')).toBe(true);
    expect(isArgumentCategory('investor_objection')).toBe(true);
    expect(isArgumentCategory('nonsense')).toBe(false);
    expect(isArgumentCategory(null)).toBe(false);
  });
});

describe('argumentReadiness', () => {
  it('is complete only when all four parts are filled', () => {
    expect(argumentReadiness(full).complete).toBe(true);
    expect(argumentReadiness(full).missing).toEqual([]);
  });
  it('reports the missing parts', () => {
    const r = argumentReadiness({ claim: 'x', evidence: '  ' });
    expect(r.complete).toBe(false);
    expect(r.missing).toContain('evidence');
    expect(r.missing).toContain('counterargument');
    expect(r.missing).toContain('rebuttal');
    expect(r.missing).not.toContain('claim');
  });
});

describe('normalizeArgumentResult', () => {
  it('clamps scores and fills defaults', () => {
    const out = normalizeArgumentResult({
      overall: 250,
      subScores: { clarity: 9, logic: 0, evidence: 4 }, // rebuttal missing
      strengths: ['good claim', 42],
      improvements: 'not an array',
      steelmanVerdict: 'strawman',
      modelAnswer: 'better version',
    });
    expect(out.overall).toBe(100);
    expect(out.subScores.clarity).toBe(5);
    expect(out.subScores.logic).toBe(1);
    expect(out.subScores.evidence).toBe(4);
    expect(out.subScores.rebuttal).toBe(3); // default
    expect(out.strengths).toEqual(['good claim']); // non-strings dropped
    expect(out.improvements).toEqual([]); // non-array → []
    expect(out.steelmanVerdict).toBe('strawman');
    expect(out.modelAnswer).toBe('better version');
  });
  it('covers every rubric key and defaults an unknown verdict to weak', () => {
    const out = normalizeArgumentResult({});
    for (const k of ARGUMENT_RUBRIC_KEYS) expect(out.subScores[k]).toBe(3);
    expect(out.steelmanVerdict).toBe('weak');
    expect(out.overall).toBe(60);
  });
});

describe('mockArgumentResult', () => {
  it('flags a short counterargument as a weak steelman', () => {
    const out = mockArgumentResult({ ...full, counterargument: 'nope' });
    expect(out.steelmanVerdict).toBe('weak');
    expect(out.overall).toBe(0); // honest: no real grade without a key
  });
  it('accepts a substantive counterargument as a steelman', () => {
    expect(mockArgumentResult(full).steelmanVerdict).toBe('steelman');
  });
});
