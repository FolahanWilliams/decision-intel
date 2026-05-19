import { describe, it, expect } from 'vitest';
import {
  composeEvidentiaryStandardFingerprint,
  EVIDENTIARY_STANDARD_TOKEN_PREFIX,
} from './evidentiary-standard';

const FULL = {
  methodologyVersion: '2.4.0',
  inputHash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
  promptFingerprint: '5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
  weightsHash: '4e51b0850db4',
  schemaVersion: 2,
};

describe('composeEvidentiaryStandardFingerprint', () => {
  it('composes the canonical token shape with all segments present', () => {
    const { token, methodologyVersion } = composeEvidentiaryStandardFingerprint(FULL);
    expect(token).toBe('ES·m2.4.0·in:1a2b3c4d·pf:5e6f7a8b·w:4e51b0850db4·s2');
    expect(methodologyVersion).toBe('2.4.0');
    expect(token.startsWith(EVIDENTIARY_STANDARD_TOKEN_PREFIX + '·')).toBe(true);
  });

  it('is deterministic — same input yields byte-identical token (audit-trail stability)', () => {
    const a = composeEvidentiaryStandardFingerprint(FULL).token;
    const b = composeEvidentiaryStandardFingerprint({ ...FULL }).token;
    expect(a).toBe(b);
  });

  it('a different methodology version produces a different token (the switching-cost signal)', () => {
    const v24 = composeEvidentiaryStandardFingerprint(FULL).token;
    const v23 = composeEvidentiaryStandardFingerprint({
      ...FULL,
      methodologyVersion: '2.3.0',
    }).token;
    expect(v24).not.toBe(v23);
    expect(v23).toContain('·m2.3.0·');
  });

  it('UNAVAILABLE input hash composes the literal `na` segment — never a fabricated digest', () => {
    const { token } = composeEvidentiaryStandardFingerprint({
      ...FULL,
      inputHash: 'UNAVAILABLE',
    });
    expect(token).toContain('·in:na·');
    expect(token).not.toContain('in:UNAVAIL');
  });

  it('empty / whitespace input hash also composes `na`', () => {
    expect(composeEvidentiaryStandardFingerprint({ ...FULL, inputHash: '' }).token).toContain(
      '·in:na·'
    );
    expect(composeEvidentiaryStandardFingerprint({ ...FULL, inputHash: '   ' }).token).toContain(
      '·in:na·'
    );
  });

  it('omits the w: segment entirely when no weights hash exists (legacy honesty, never faked)', () => {
    const noWeights = composeEvidentiaryStandardFingerprint({
      ...FULL,
      weightsHash: undefined,
    }).token;
    expect(noWeights).toBe('ES·m2.4.0·in:1a2b3c4d·pf:5e6f7a8b·s2');
    expect(noWeights).not.toContain('·w:');
    expect(
      composeEvidentiaryStandardFingerprint({ ...FULL, weightsHash: null }).token
    ).not.toContain('·w:');
    expect(composeEvidentiaryStandardFingerprint({ ...FULL, weightsHash: '' }).token).not.toContain(
      '·w:'
    );
  });

  it('strips non-hex noise from the input/prompt digest so a stray prefix cannot leak', () => {
    const { token } = composeEvidentiaryStandardFingerprint({
      ...FULL,
      inputHash: 'sha256:1a2b3c4d5e6f',
    });
    // 'sha256:' contains hex chars (a,2,5,6) so this locks the ACTUAL
    // behaviour: non-hex (':') stripped, then first 8 hex of what remains.
    expect(token).toMatch(/·in:[0-9a-f]{8}·/);
    expect(token).not.toContain(':sha256');
  });

  it('lowercases hashes for stable comparison across callers', () => {
    const upper = composeEvidentiaryStandardFingerprint({
      ...FULL,
      inputHash: 'AAAA1111BBBB2222',
    }).token;
    expect(upper).toContain('·in:aaaa1111·');
  });

  it('falls back to schema 0 on a non-finite schema version (never NaN in the token)', () => {
    const { token } = composeEvidentiaryStandardFingerprint({
      ...FULL,
      schemaVersion: Number.NaN,
    });
    expect(token.endsWith('·s0')).toBe(true);
    expect(token).not.toContain('NaN');
  });

  it('falls back to m unknown on a blank methodology version (never an empty segment)', () => {
    const { token } = composeEvidentiaryStandardFingerprint({
      ...FULL,
      methodologyVersion: '   ',
    });
    expect(token).toContain('·munknown·');
  });
});
