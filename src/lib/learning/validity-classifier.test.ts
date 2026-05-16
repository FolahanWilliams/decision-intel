/**
 * Validity Classifier regression suite.
 *
 * validity-classifier.ts drives a STRUCTURAL DQI weight shift across all
 * three DQI computation paths and stamps the methodology version
 * (2.0.0 → 2.1.0). CLAUDE.md: "the methodology version is now the audit
 * signature." A silent regression here re-weights every audit in a
 * validity-classified domain. Pure function — fully deterministic.
 *
 * Locks: conservative-low default, doc-type → band map, bounded ±1
 * industry tilt, long-horizon → zero override, weight-shift contract
 * (high → null; monotonic historicalAlignment escalation), methodology
 * version stamp.
 */

import { describe, it, expect } from 'vitest';
import {
  classifyValidity,
  getValidityWeightShift,
  validityClassLabel,
  validityNote,
  VALIDITY_METHODOLOGY_VERSION,
  type ValidityClass,
} from './validity-classifier';

describe('classifyValidity — base document-type mapping', () => {
  it('defaults to low-validity when documentType is unknown/null (conservative posture)', () => {
    expect(classifyValidity({ documentType: null, industry: null }).validityClass).toBe('low');
    expect(
      classifyValidity({ documentType: 'something_unmapped', industry: null }).validityClass
    ).toBe('low');
  });

  it('maps canonical document types to their documented bands', () => {
    expect(classifyValidity({ documentType: 'ic_memo', industry: null }).validityClass).toBe(
      'low'
    );
    expect(classifyValidity({ documentType: 'ops_review', industry: null }).validityClass).toBe(
      'high'
    );
    expect(
      classifyValidity({ documentType: 'macro_forecast', industry: null }).validityClass
    ).toBe('zero');
    expect(
      classifyValidity({ documentType: 'due_diligence', industry: null }).validityClass
    ).toBe('medium');
  });

  it('carries the signals block through for DPR-appendix transparency', () => {
    const c = classifyValidity({ documentType: 'ic_memo', industry: 'technology' });
    expect(c.signals).toEqual({
      documentType: 'ic_memo',
      industry: 'technology',
      decisionHorizon: null,
    });
    expect(c.rationale).toContain('ic_memo');
  });
});

describe('classifyValidity — bounded industry tilt', () => {
  it('financial_services tilts a high-validity ops_review down to medium', () => {
    const c = classifyValidity({ documentType: 'ops_review', industry: 'Financial Services' });
    expect(c.validityClass).toBe('medium');
    expect(c.rationale).toContain('tilts');
  });

  it('financial_services tilts a low ic_memo down to zero (clamped at band edge)', () => {
    expect(
      classifyValidity({ documentType: 'ic_memo', industry: 'financial_services' }).validityClass
    ).toBe('zero');
  });

  it('an industrial tilt lifts a low ic_memo up to medium', () => {
    expect(
      classifyValidity({ documentType: 'ic_memo', industry: 'industrial' }).validityClass
    ).toBe('medium');
  });

  it('tilt never pushes past the band extremes', () => {
    // ops_review is already 'high' (index 0); a +1 industrial tilt cannot
    // overshoot above 'high'.
    expect(
      classifyValidity({ documentType: 'ops_review', industry: 'manufacturing' }).validityClass
    ).toBe('high');
  });
});

describe('classifyValidity — long-horizon override', () => {
  it('overrides any band to zero when the decision horizon exceeds 3 years', () => {
    const c = classifyValidity({
      documentType: 'ops_review', // would be 'high'
      industry: null,
      decisionHorizon: '5-year strategic plan',
    });
    expect(c.validityClass).toBe('zero');
    expect(c.rationale).toContain('zero-validity');
  });

  it('decade / 204x horizons also force zero', () => {
    expect(
      classifyValidity({
        documentType: 'budget_review',
        industry: null,
        decisionHorizon: 'a decade out',
      }).validityClass
    ).toBe('zero');
    expect(
      classifyValidity({
        documentType: 'budget_review',
        industry: null,
        decisionHorizon: 'through 2045',
      }).validityClass
    ).toBe('zero');
  });
});

describe('getValidityWeightShift', () => {
  it('returns no shift for high-validity (default weighting applies)', () => {
    expect(getValidityWeightShift('high')).toBeNull();
  });

  it('medium tilts only historicalAlignment', () => {
    const shift = getValidityWeightShift('medium');
    expect(shift).not.toBeNull();
    expect(Object.keys(shift!)).toEqual(['historicalAlignment']);
  });

  it('low and zero carry the documented five-component shift', () => {
    for (const band of ['low', 'zero'] as ValidityClass[]) {
      const shift = getValidityWeightShift(band)!;
      expect(Object.keys(shift).sort()).toEqual(
        ['biasLoad', 'complianceRisk', 'evidenceQuality', 'historicalAlignment', 'processMaturity'].sort()
      );
    }
  });

  it('historicalAlignment weight escalates monotonically medium → low → zero', () => {
    const m = getValidityWeightShift('medium')!.historicalAlignment!;
    const l = getValidityWeightShift('low')!.historicalAlignment!;
    const z = getValidityWeightShift('zero')!.historicalAlignment!;
    expect(m).toBeLessThan(l);
    expect(l).toBeLessThan(z);
  });
});

describe('methodology version + surface copy', () => {
  it('stamps methodology version 2.1.0', () => {
    expect(VALIDITY_METHODOLOGY_VERSION).toBe('2.1.0');
  });

  it('produces a label + procurement note for every band', () => {
    for (const band of ['high', 'medium', 'low', 'zero'] as ValidityClass[]) {
      const c = classifyValidity({ documentType: 'ic_memo', industry: null });
      expect(validityClassLabel(band)).toMatch(/VALIDITY ENVIRONMENT$/);
      expect(validityNote({ ...c, validityClass: band }).length).toBeGreaterThan(40);
    }
  });
});
