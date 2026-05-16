import { describe, it, expect } from 'vitest';
import {
  normalizeSectorToIndustry,
  pickAnchorCase,
  matchPersona,
  prefillOpener,
  buildProspectShortlist,
  MAX_SHORTLIST_ENTRIES,
} from './prospect-shortlist';
import type { CaseStudy } from '@/lib/data/case-studies/types';
import type { WedgePersona, DmTemplate } from '@/lib/data/event-prep';
import type { OutreachIntelItem } from './intel-brief';

function caseFixture(over: Partial<CaseStudy> = {}): CaseStudy {
  return {
    industry: 'technology',
    outcome: 'failure',
    impactScore: 50,
    company: 'AcmeCo',
    title: 'AcmeCo strategy failure',
    primaryBias: 'Confirmation Bias',
    ...over,
  } as unknown as CaseStudy;
}

const PERSONAS: WedgePersona[] = [
  {
    id: 'fractional_cso',
    label: 'Fractional CSO',
    band: 'b',
    industries: ['technology', 'financial_services', 'manufacturing', 'retail', 'healthcare'],
    selfArticulatedPain: 'p',
    canonicalBiasHooks: [],
  },
  {
    id: 'midmarket_corp_dev',
    label: 'Head of Corp Dev',
    band: 'b',
    industries: ['technology', 'financial_services', 'manufacturing', 'healthcare'],
    selfArticulatedPain: 'p',
    canonicalBiasHooks: [],
  },
];

const TEMPLATES: DmTemplate[] = [
  {
    personaId: 'fractional_cso',
    opener: 'Hi {name} — saw {topic}. Quick context...',
    curiosityReply: '',
    discoveryAsk: '',
    introducerFollowUp: '',
  },
  {
    personaId: 'midmarket_corp_dev',
    opener: 'Hi {name} — congrats on the {recent-deal-or-thread}. Reason for the DM...',
    curiosityReply: '',
    discoveryAsk: '',
    introducerFollowUp: '',
  },
];

function item(over: Partial<OutreachIntelItem> = {}): OutreachIntelItem {
  return {
    headline: 'BigCo acquires SmallCo for $3B',
    whyItMatters: 'Integration risk worth watching.',
    sector: 'Technology',
    biasAngle: 'synergy projections of this shape often rest on planning fallacy',
    sourceTitle: 'BigCo buys SmallCo',
    sourceLink: 'https://n.com/a',
    ...over,
  };
}

const slugFor = (c: CaseStudy) => c.company.toLowerCase().replace(/\s+/g, '-');

describe('normalizeSectorToIndustry', () => {
  it('maps exact labels', () => {
    expect(normalizeSectorToIndustry('Technology')).toBe('technology');
    expect(normalizeSectorToIndustry('Financial Services')).toBe('financial_services');
  });
  it('maps synonyms', () => {
    expect(normalizeSectorToIndustry('Fintech')).toBe('financial_services');
    expect(normalizeSectorToIndustry('Pharma')).toBe('healthcare');
    expect(normalizeSectorToIndustry('Industrials')).toBe('manufacturing');
  });
  it('maps via substring', () => {
    expect(normalizeSectorToIndustry('Financial Services & Insurance')).toBe('financial_services');
  });
  it('returns null for unknown / empty', () => {
    expect(normalizeSectorToIndustry('Agriculture')).toBeNull();
    expect(normalizeSectorToIndustry('   ')).toBeNull();
  });
});

describe('pickAnchorCase', () => {
  it('prefers failure-class outcomes over successes', () => {
    const win = caseFixture({ company: 'WinCo', outcome: 'success', impactScore: 99 });
    const fail = caseFixture({ company: 'FailCo', outcome: 'failure', impactScore: 10 });
    expect(pickAnchorCase('technology', [win, fail])?.company).toBe('FailCo');
  });
  it('picks highest impactScore among failures', () => {
    const a = caseFixture({ company: 'A', outcome: 'failure', impactScore: 40 });
    const b = caseFixture({ company: 'B', outcome: 'catastrophic_failure', impactScore: 90 });
    expect(pickAnchorCase('technology', [a, b])?.company).toBe('B');
  });
  it('tiebreaks deterministically by company', () => {
    const z = caseFixture({ company: 'Zeta', outcome: 'failure', impactScore: 50 });
    const a = caseFixture({ company: 'Alpha', outcome: 'failure', impactScore: 50 });
    expect(pickAnchorCase('technology', [z, a])?.company).toBe('Alpha');
  });
  it('returns null when no case in the industry', () => {
    expect(pickAnchorCase('aerospace', [caseFixture({ industry: 'technology' })])).toBeNull();
  });
});

describe('matchPersona', () => {
  it('returns the first persona (array-order priority) covering the industry', () => {
    expect(matchPersona('technology', PERSONAS)?.id).toBe('fractional_cso');
  });
  it('falls through to a later persona when the first does not cover it', () => {
    const narrow: WedgePersona[] = [
      { ...PERSONAS[0], industries: ['retail'] },
      { ...PERSONAS[1], industries: ['healthcare'] },
    ];
    expect(matchPersona('healthcare', narrow)?.id).toBe('midmarket_corp_dev');
  });
  it('returns null when no persona covers the industry', () => {
    expect(matchPersona('aerospace', PERSONAS)).toBeNull();
  });
});

describe('prefillOpener', () => {
  it('substitutes deal/topic placeholders, leaves {name}', () => {
    const out = prefillOpener(
      'Hi {name} — congrats on the {recent-deal-or-thread}.',
      'BigCo buys SmallCo'
    );
    expect(out).toBe('Hi {name} — congrats on the BigCo buys SmallCo.');
  });
  it('substitutes {topic}', () => {
    expect(prefillOpener('saw {topic}', 'Deal X')).toBe('saw Deal X');
  });
});

describe('buildProspectShortlist', () => {
  it('builds an entry anchored on a PUBLIC case from the injected library', () => {
    const pub = caseFixture({
      company: 'Kodak',
      industry: 'technology',
      outcome: 'failure',
      impactScore: 80,
    });
    const out = buildProspectShortlist([item()], [pub], PERSONAS, TEMPLATES, slugFor);
    expect(out).toHaveLength(1);
    expect(out[0].anchorCaseCompany).toBe('Kodak');
    expect(out[0].anchorCaseSlug).toBe('kodak');
    expect(out[0].personaId).toBe('fractional_cso');
    expect(out[0].dmOpener).toContain('BigCo acquires SmallCo'); // opener prefilled with intel
    // structural anti-own-deal guarantee: the anchor is one of the injected cases
    expect([pub.company]).toContain(out[0].anchorCaseCompany);
  });

  it('skips items whose sector does not map to an industry', () => {
    const out = buildProspectShortlist(
      [item({ sector: 'Agriculture' })],
      [caseFixture()],
      PERSONAS,
      TEMPLATES,
      slugFor
    );
    expect(out).toHaveLength(0);
  });

  it('skips when no persona covers the industry', () => {
    const out = buildProspectShortlist(
      [item({ sector: 'Aerospace' })],
      [caseFixture({ industry: 'aerospace' })],
      PERSONAS,
      TEMPLATES,
      slugFor
    );
    expect(out).toHaveLength(0);
  });

  it('skips when no public case exists in the industry', () => {
    const out = buildProspectShortlist(
      [item({ sector: 'Technology' })],
      [],
      PERSONAS,
      TEMPLATES,
      slugFor
    );
    expect(out).toHaveLength(0);
  });

  it('dedupes by persona + anchor case', () => {
    const pub = caseFixture({ company: 'Kodak', industry: 'technology', outcome: 'failure' });
    const out = buildProspectShortlist(
      [item({ headline: 'Deal 1' }), item({ headline: 'Deal 2' })],
      [pub],
      PERSONAS,
      TEMPLATES,
      slugFor
    );
    expect(out).toHaveLength(1); // same persona + same anchor → deduped
  });

  it('caps at MAX_SHORTLIST_ENTRIES', () => {
    // One persona covering every industry + one distinct failure case
    // per industry → distinct (persona+slug) pairs that dedupe can't
    // collapse, so the cap is the only bound.
    const sectors = [
      'Technology',
      'Financial Services',
      'Healthcare',
      'Energy',
      'Automotive',
      'Retail',
      'Aerospace',
      'Government',
      'Entertainment',
      'Media',
      'Real Estate',
      'Telecommunications',
      'Manufacturing',
    ];
    const allIndustryPersona: WedgePersona[] = [
      {
        ...PERSONAS[0],
        industries: [
          'technology',
          'financial_services',
          'healthcare',
          'manufacturing',
          'retail',
          'telecommunications',
          'aerospace',
          'automotive',
          'entertainment',
          'government',
        ],
      },
    ];
    const cases = sectors.map((_, i) =>
      caseFixture({
        company: `Co${i}`,
        industry: normalizeSectorToIndustry(sectors[i]) ?? 'technology',
        outcome: 'failure',
        impactScore: 90,
      })
    );
    const items = sectors.map((s, i) => item({ headline: `Deal ${i}`, sector: s }));
    const out = buildProspectShortlist(items, cases, allIndustryPersona, TEMPLATES, slugFor);
    expect(out.length).toBe(MAX_SHORTLIST_ENTRIES);
  });
});
