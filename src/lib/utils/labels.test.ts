import { describe, it, expect } from 'vitest';
import {
  humanize,
  formatBiasName,
  formatToxicCombination,
  formatIndustry,
  formatOutcome,
  formatDocumentType,
} from './labels';

describe('humanize', () => {
  it('converts snake_case to Title Case', () => {
    expect(humanize('confirmation_bias')).toBe('Confirmation Bias');
    expect(humanize('planning_fallacy')).toBe('Planning Fallacy');
  });

  it('converts kebab-case to Title Case', () => {
    expect(humanize('real-estate')).toBe('Real Estate');
  });

  it('preserves known acronyms uppercase', () => {
    expect(humanize('sec_filing')).toBe('SEC Filing');
    expect(humanize('fda_action')).toBe('FDA Action');
    expect(humanize('ntsb_report')).toBe('NTSB Report');
    expect(humanize('gdpr_compliance')).toBe('GDPR Compliance');
  });

  it('returns already-formatted input untouched in casing', () => {
    expect(humanize('Already Formatted')).toBe('Already Formatted');
  });

  it('returns empty string for empty / null / undefined', () => {
    expect(humanize('')).toBe('');
    expect(humanize(null)).toBe('');
    expect(humanize(undefined)).toBe('');
  });

  it('collapses repeated separators', () => {
    expect(humanize('foo__bar--baz')).toBe('Foo Bar Baz');
  });
});

describe('formatBiasName', () => {
  it('resolves canonical catalog keys', () => {
    expect(formatBiasName('confirmation_bias')).toBe('Confirmation Bias');
    expect(formatBiasName('sunk_cost_fallacy')).toBe('Sunk Cost Fallacy');
    expect(formatBiasName('anchoring_bias')).toBe('Anchoring Bias');
    expect(formatBiasName('halo_effect')).toBe('Halo Effect');
  });

  it('passes through already-formatted display names', () => {
    expect(formatBiasName('Confirmation Bias')).toBe('Confirmation Bias');
  });

  it('humanizes unknown bias keys instead of leaking snake_case', () => {
    // Not in BIAS_CATEGORIES — should still render nicely.
    expect(formatBiasName('optimism_bias')).toBe('Optimism Bias');
    expect(formatBiasName('narrative_fallacy')).toBe('Narrative Fallacy');
  });

  it('handles empty input', () => {
    expect(formatBiasName('')).toBe('');
    expect(formatBiasName(null)).toBe('');
  });
});

describe('formatToxicCombination', () => {
  it('resolves alias map entries', () => {
    expect(formatToxicCombination('echo_chamber')).toBe('Echo Chamber');
    expect(formatToxicCombination('sunk_ship')).toBe('Sunk Ship');
  });

  it('humanizes unknown toxic combinations', () => {
    expect(formatToxicCombination('custom_pattern')).toBe('Custom Pattern');
  });
});

describe('formatIndustry', () => {
  it('humanizes industry enums', () => {
    expect(formatIndustry('financial_services')).toBe('Financial Services');
    expect(formatIndustry('real_estate')).toBe('Real Estate');
    expect(formatIndustry('technology')).toBe('Technology');
  });
});

describe('formatOutcome', () => {
  it('humanizes outcome enums', () => {
    expect(formatOutcome('catastrophic_failure')).toBe('Catastrophic Failure');
    expect(formatOutcome('partial_success')).toBe('Partial Success');
    expect(formatOutcome('exceptional_success')).toBe('Exceptional Success');
  });
});

describe('formatDocumentType', () => {
  it('humanizes document types', () => {
    expect(formatDocumentType('board_memo')).toBe('Board Memo');
    expect(formatDocumentType('earnings_call')).toBe('Earnings Call');
  });
});
