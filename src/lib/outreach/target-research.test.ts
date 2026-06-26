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
  it('matches a self-funded searcher', () => {
    expect(classifyByRole('Self-funded searcher').persona).toBe('self_funded_searcher');
    expect(classifyByRole('Search Fund Principal').persona).toBe('self_funded_searcher');
    expect(classifyByRole('Acquisition entrepreneur (ETA)').persona).toBe('self_funded_searcher');
  });

  it('matches a serial acquirer', () => {
    expect(classifyByRole('Serial acquirer').persona).toBe('serial_acquirer');
    expect(classifyByRole('Roll-up operator').persona).toBe('serial_acquirer');
    expect(classifyByRole('Building a holdco').persona).toBe('serial_acquirer');
  });

  it('matches an independent sponsor', () => {
    expect(classifyByRole('Independent Sponsor').persona).toBe('independent_sponsor');
    expect(classifyByRole('Fundless sponsor').persona).toBe('independent_sponsor');
  });

  it('classifies a generic CEO / founder via the catch-all as independent_sponsor', () => {
    // The CEO / founder / operator catch-all defaults to the lead persona —
    // likely a searcher who closed or a sponsor between deals.
    expect(classifyByRole('CEO').persona).toBe('independent_sponsor');
    expect(classifyByRole('Founder & Operating Partner').persona).toBe('independent_sponsor');
  });

  it('falls back to company pattern when role missing', () => {
    const result = classifyByRole('', 'Acme Ventures');
    expect(result.persona).toBe('independent_sponsor');
    expect(result.why).toContain('classified by company');
  });

  it('returns "other" when nothing matches', () => {
    expect(classifyByRole('Software Engineer').persona).toBe('other');
    expect(classifyByRole('Designer').persona).toBe('other');
    expect(classifyByRole('').persona).toBe('other');
  });

  it('always includes a non-empty rationale', () => {
    for (const input of [
      'CEO',
      'Independent Sponsor',
      'Software Engineer',
      '',
      'Serial acquirer',
    ]) {
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
      'independent_sponsor',
      'self_funded_searcher',
      'serial_acquirer',
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
    const result = generateOpener('independent_sponsor', 'Marcus Reynolds');
    expect(result).not.toBeNull();
    expect(result!.text).toContain('Marcus');
    expect(result!.text).not.toContain('{name}');
  });

  it('falls back to whole-name when no space', () => {
    const result = generateOpener('independent_sponsor', 'Adaeze');
    expect(result!.text).toContain('Adaeze');
  });

  it('reports unsubstituted tokens as pendingSubstitutions', () => {
    const result = generateOpener('self_funded_searcher', 'Damien Park');
    // The self_funded_searcher opener has a {sector} token left to fill
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
      title: 'Independent Sponsor',
      company: 'Marlin Industries',
    });
    expect(result.persona).toBe('independent_sponsor');
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
      researchProspect({ name: 'A', title: 'Independent Sponsor' }),
      researchProspect({ name: 'B', title: 'Self-funded searcher' }),
      researchProspect({ name: 'C', title: 'Serial acquirer running a roll-up' }),
      researchProspect({ name: 'D', title: 'CEO' }), // catch-all → independent_sponsor
      researchProspect({ name: 'E', title: 'Designer' }),
    ];
    const summary = summarizeResearch(researched);
    expect(summary.total).toBe(5);
    // 'Independent Sponsor' + 'CEO' (catch-all) both map to independent_sponsor.
    expect(summary.byPersona.independent_sponsor).toBe(2);
    expect(summary.byPersona.self_funded_searcher).toBe(1);
    expect(summary.byPersona.serial_acquirer).toBe(1);
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
