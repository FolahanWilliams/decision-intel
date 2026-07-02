import { describe, it, expect } from 'vitest';
import {
  parseAchResult,
  computeNonDiagnosticShare,
  buildAchPrompt,
  type AchEvidenceItem,
} from './ach';

const ev = (diagnosticity: AchEvidenceItem['diagnosticity']): AchEvidenceItem => ({
  claim: 'a supporting claim from the memo',
  diagnosticity,
  note: 'why',
});

describe('computeNonDiagnosticShare — deterministic, derived not trusted', () => {
  it('is the fraction tagged non_diagnostic', () => {
    expect(
      computeNonDiagnosticShare([
        ev('non_diagnostic'),
        ev('non_diagnostic'),
        ev('supports_thesis_only'),
      ])
    ).toBeCloseTo(2 / 3, 5);
  });
  it('empty list → 0 (no confirmation-theater claim without evidence)', () => {
    expect(computeNonDiagnosticShare([])).toBe(0);
  });
  it('all diagnostic → 0; all non-diagnostic → 1', () => {
    expect(computeNonDiagnosticShare([ev('supports_thesis_only'), ev('supports_bear_only')])).toBe(
      0
    );
    expect(computeNonDiagnosticShare([ev('non_diagnostic'), ev('non_diagnostic')])).toBe(1);
  });
});

describe('parseAchResult — total + defensive', () => {
  const good = {
    thesis: 'The AI data-center demand arrives on our committed timeline.',
    competingHypothesis: 'Demand slips; capital is spent before a single tenant signs.',
    evidence: [
      {
        claim: 'TAM growing 30% a year',
        diagnosticity: 'non_diagnostic',
        note: 'true in a boom or a bust',
      },
      {
        claim: 'One signed anchor tenant',
        diagnosticity: 'supports_thesis_only',
        note: 'discriminates',
      },
    ],
    missingDiagnosticTests: ['signed take-or-pay contracts at committed capacity'],
    whatWouldHaveToBeTrue: ['tenants sign before the long-lead capital commits'],
    watchItems: ['lease-up slips past the financing reserve window'],
  };

  it('parses a well-formed payload and RECOMPUTES the share from evidence', () => {
    const r = parseAchResult(good)!;
    expect(r).not.toBeNull();
    expect(r.thesis).toContain('demand');
    expect(r.evidence).toHaveLength(2);
    expect(r.nonDiagnosticShare).toBe(0.5); // 1 of 2 non-diagnostic, derived
    expect(r.missingDiagnosticTests[0]).toContain('take-or-pay');
    expect(r.watchItems).toHaveLength(1);
  });

  it('ignores an LLM-claimed nonDiagnosticShare and recomputes it', () => {
    const r = parseAchResult({ ...good, nonDiagnosticShare: 0.99 })!;
    expect(r.nonDiagnosticShare).toBe(0.5); // recomputed, not the claimed 0.99
  });

  it('returns null without a thesis AND a bear case', () => {
    expect(parseAchResult({ ...good, thesis: '' })).toBeNull();
    expect(parseAchResult({ ...good, competingHypothesis: '' })).toBeNull();
  });

  it('returns null when no evidence is classifiable', () => {
    expect(parseAchResult({ ...good, evidence: [] })).toBeNull();
    expect(
      parseAchResult({ ...good, evidence: [{ claim: 'x', diagnosticity: 'bogus_tag', note: 'n' }] })
    ).toBeNull();
  });

  it('drops malformed evidence items but keeps the valid ones', () => {
    const r = parseAchResult({
      ...good,
      evidence: [
        { claim: 'valid claim here', diagnosticity: 'non_diagnostic', note: 'n' },
        { claim: 'x', diagnosticity: 'invalid', note: 'n' }, // dropped: bad tag
        { diagnosticity: 'non_diagnostic', note: 'n' }, // dropped: no claim
        'not an object', // dropped
      ],
    })!;
    expect(r.evidence).toHaveLength(1);
    expect(r.nonDiagnosticShare).toBe(1);
  });

  it('is total on junk input', () => {
    expect(parseAchResult(null)).toBeNull();
    expect(parseAchResult('string')).toBeNull();
    expect(parseAchResult(42)).toBeNull();
    expect(parseAchResult({})).toBeNull();
  });

  it('omits watchItems when absent rather than emitting an empty array', () => {
    const r = parseAchResult({ ...good, watchItems: [] })!;
    expect(r.watchItems).toBeUndefined();
  });
});

describe('buildAchPrompt — carries Heuer + the honesty guardrails', () => {
  it('names the one rule (consistent-with-everything = zero value) + the ego-safe framing', () => {
    const p = buildAchPrompt('THE MEMO CONTENT');
    expect(p).toContain('ZERO diagnostic value');
    expect(p.toLowerCase()).toContain('bear case');
    expect(p).toContain('PROCESS observation');
    expect(p).toContain('THE MEMO CONTENT');
    expect(p).toContain('non_diagnostic');
  });
  it('threads an as-of note (blind-mode discipline) when supplied', () => {
    expect(buildAchPrompt('x', 'As of the document date only.')).toContain(
      'As of the document date only.'
    );
  });
});
