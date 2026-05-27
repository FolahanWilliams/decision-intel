/**
 * Tests for the target-research workbench helpers.
 *
 * Locks the classifier so a future "tweak the regex" doesn't silently
 * misroute an attendee paste at T-0 before BAFTA. The pre-event prep
 * artefact is high-stakes — the classifier produces the DMs the founder
 * actually sends.
 */

import { describe, it, expect } from 'vitest';
import {
  classifyByRole,
  pickBiasHook,
  generateOpener,
  researchProspect,
  parseAttendeeInput,
  summarizeResearch,
} from './target-research';

// ─── classifyByRole ────────────────────────────────────────────────────

describe('classifyByRole', () => {
  it('matches a corp-dev head', () => {
    expect(classifyByRole('Head of Corporate Development').persona).toBe('midmarket_corp_dev');
    expect(classifyByRole('VP, M&A').persona).toBe('midmarket_corp_dev');
    expect(classifyByRole('Director of M & A').persona).toBe('midmarket_corp_dev');
  });

  it('matches a fractional CSO', () => {
    expect(classifyByRole('Fractional CSO').persona).toBe('fractional_cso');
    expect(classifyByRole('Strategy Consultant').persona).toBe('fractional_cso');
    expect(classifyByRole('Independent Strategy Advisor').persona).toBe('fractional_cso');
  });

  it('matches a smaller-fund GP', () => {
    expect(classifyByRole('General Partner').persona).toBe('smaller_fund_gp');
    expect(classifyByRole('Managing Partner').persona).toBe('smaller_fund_gp');
    expect(classifyByRole('Principal at Acme Ventures').persona).toBe('smaller_fund_gp');
  });

  it('matches a PE-backed CEO / founder', () => {
    expect(classifyByRole('CEO').persona).toBe('pe_backed_founder');
    expect(classifyByRole('Founder & CEO').persona).toBe('pe_backed_founder');
    expect(classifyByRole('Managing Director').persona).toBe('pe_backed_founder');
  });

  it('classifies an established Chief Strategy Officer as fractional_cso', () => {
    // The CSO role pattern is intentionally the secondary fractional_cso
    // match — same memo cadence template applies.
    expect(classifyByRole('Chief Strategy Officer').persona).toBe('fractional_cso');
  });

  it('falls back to company pattern when role missing', () => {
    const result = classifyByRole('', 'Acme Ventures');
    expect(result.persona).toBe('smaller_fund_gp');
    expect(result.why).toContain('classified by company');
  });

  it('returns "other" when nothing matches', () => {
    expect(classifyByRole('Software Engineer').persona).toBe('other');
    expect(classifyByRole('Designer').persona).toBe('other');
    expect(classifyByRole('').persona).toBe('other');
  });

  it('always includes a non-empty rationale', () => {
    for (const input of ['CEO', 'General Partner', 'Software Engineer', '', 'Fractional CSO']) {
      const result = classifyByRole(input);
      expect(result.why.length).toBeGreaterThan(10);
    }
  });
});

// ─── pickBiasHook ──────────────────────────────────────────────────────

describe('pickBiasHook', () => {
  it('returns null for "other"', () => {
    expect(pickBiasHook('other')).toBeNull();
  });

  it('returns a hook with a case name + bias for each wedge persona', () => {
    for (const persona of [
      'fractional_cso',
      'midmarket_corp_dev',
      'smaller_fund_gp',
      'pe_backed_founder',
    ] as const) {
      const hook = pickBiasHook(persona);
      expect(hook).not.toBeNull();
      expect(hook!.case).toBeTruthy();
      expect(hook!.bias).toBeTruthy();
      expect(hook!.whatItDid).toBeTruthy();
    }
  });
});

// ─── generateOpener ────────────────────────────────────────────────────

describe('generateOpener', () => {
  it('substitutes {name} with the first name', () => {
    const result = generateOpener('fractional_cso', 'Marcus Reynolds');
    expect(result).not.toBeNull();
    expect(result!.text).toContain('Marcus');
    expect(result!.text).not.toContain('{name}');
  });

  it('falls back to whole-name when no space', () => {
    const result = generateOpener('fractional_cso', 'Adaeze');
    expect(result!.text).toContain('Adaeze');
  });

  it('reports unsubstituted tokens as pendingSubstitutions', () => {
    const result = generateOpener('midmarket_corp_dev', 'Damien Park');
    // The midmarket_corp_dev opener has {recent-deal-or-thread}
    expect(result!.pendingSubstitutions.length).toBeGreaterThan(0);
    expect(result!.pendingSubstitutions[0]).not.toContain('{');
    expect(result!.pendingSubstitutions[0]).not.toContain('}');
  });

  it('returns null for "other"', () => {
    expect(generateOpener('other', 'Anyone')).toBeNull();
  });
});

// ─── researchProspect ──────────────────────────────────────────────────

describe('researchProspect', () => {
  it('composes classify + pick + generate', () => {
    const result = researchProspect({
      name: 'Damien Park',
      title: 'Head of Corporate Development',
      company: 'Marlin Industries',
    });
    expect(result.persona).toBe('midmarket_corp_dev');
    expect(result.biasHook).not.toBeNull();
    expect(result.opener).not.toBeNull();
    expect(result.opener).toContain('Damien');
  });

  it('handles missing fields gracefully', () => {
    const result = researchProspect({ name: 'Unknown Person' });
    expect(result.persona).toBe('other');
    expect(result.biasHook).toBeNull();
    expect(result.opener).toBeNull();
  });

  it('trims input', () => {
    const result = researchProspect({ name: '  Marcus  ', title: '  CEO  ' });
    expect(result.name).toBe('Marcus');
    expect(result.title).toBe('CEO');
  });
});

// ─── parseAttendeeInput ────────────────────────────────────────────────

describe('parseAttendeeInput', () => {
  it('parses comma-separated lines', () => {
    const input = `Marcus Reynolds, Fractional CSO, Reynolds Strategy
Damien Park, Head of Corporate Development, Marlin Industries`;
    const parsed = parseAttendeeInput(input);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toEqual({
      name: 'Marcus Reynolds',
      title: 'Fractional CSO',
      company: 'Reynolds Strategy',
    });
  });

  it('parses pipe-separated lines', () => {
    const parsed = parseAttendeeInput('Aisha Okafor | General Partner | Pan-African Capital');
    expect(parsed[0]).toEqual({
      name: 'Aisha Okafor',
      title: 'General Partner',
      company: 'Pan-African Capital',
    });
  });

  it('parses "Name - Title at Company"', () => {
    const parsed = parseAttendeeInput('Henrik Olsson - CEO at Helix Manufacturing');
    expect(parsed[0]).toEqual({
      name: 'Henrik Olsson',
      title: 'CEO',
      company: 'Helix Manufacturing',
    });
  });

  it('parses "Name (Title, Company)"', () => {
    const parsed = parseAttendeeInput('Margaret Chen (Chief Strategy Officer, Apex Corp)');
    expect(parsed[0]).toEqual({
      name: 'Margaret Chen',
      title: 'Chief Strategy Officer',
      company: 'Apex Corp',
    });
  });

  it('parses bare name', () => {
    const parsed = parseAttendeeInput('Adaeze');
    expect(parsed[0]).toEqual({ name: 'Adaeze', title: null, company: null });
  });

  it('skips blank + comment lines', () => {
    const input = `# Strategy World London — Tier 1 targets
Marcus Reynolds, Fractional CSO

Aisha Okafor, GP
# end of list`;
    const parsed = parseAttendeeInput(input);
    expect(parsed).toHaveLength(2);
  });

  it('parses LinkedIn-export "Name — Company" shape', () => {
    const parsed = parseAttendeeInput('Henrik Olsson — Helix Manufacturing');
    expect(parsed[0]).toEqual({
      name: 'Henrik Olsson',
      title: null,
      company: 'Helix Manufacturing',
    });
  });
});

// ─── summarizeResearch ─────────────────────────────────────────────────

describe('summarizeResearch', () => {
  it('counts by persona + ready/needs-review', () => {
    const researched = [
      researchProspect({ name: 'A', title: 'Head of Corp Dev' }),
      researchProspect({ name: 'B', title: 'Fractional CSO' }),
      researchProspect({ name: 'C', title: 'General Partner' }),
      researchProspect({ name: 'D', title: 'CEO' }),
      researchProspect({ name: 'E', title: 'Designer' }),
    ];
    const summary = summarizeResearch(researched);
    expect(summary.total).toBe(5);
    expect(summary.byPersona.midmarket_corp_dev).toBe(1);
    expect(summary.byPersona.fractional_cso).toBe(1);
    expect(summary.byPersona.smaller_fund_gp).toBe(1);
    expect(summary.byPersona.pe_backed_founder).toBe(1);
    expect(summary.byPersona.other).toBe(1);
    expect(summary.ready).toBe(4);
    expect(summary.needsReview).toBe(1);
  });

  it('handles empty input', () => {
    const summary = summarizeResearch([]);
    expect(summary.total).toBe(0);
    expect(summary.ready).toBe(0);
    expect(summary.needsReview).toBe(0);
  });
});
