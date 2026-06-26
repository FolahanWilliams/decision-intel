import { describe, it, expect } from 'vitest';
import {
  selectOnepagerAnchor,
  pickOnepagerArchetypeId,
  buildOnepagerInstruction,
  type OnepagerRequest,
} from './onepager';
import type { CaseStudy } from '@/lib/data/case-studies/types';

function caseFixture(over: Partial<CaseStudy> = {}): CaseStudy {
  return {
    industry: 'technology',
    outcome: 'failure',
    impactScore: 60,
    company: 'Kodak',
    title: 'Kodak digital photography exit',
    primaryBias: 'Confirmation Bias',
    ...over,
  } as unknown as CaseStudy;
}

const req: OnepagerRequest = {
  prospectCompany: 'TargetCo',
  prospectRole: 'Head of Corporate Development',
  sector: 'Technology',
};

describe('selectOnepagerAnchor', () => {
  it('returns a PUBLIC case from the injected library', () => {
    const lib = [caseFixture({ company: 'Kodak', industry: 'technology' })];
    const anchor = selectOnepagerAnchor('Technology', lib);
    expect(anchor?.company).toBe('Kodak');
    // structural anti-own-deal: the anchor is one of the injected cases
    expect(lib.map(c => c.company)).toContain(anchor?.company);
  });

  it('returns null when the sector does not map', () => {
    expect(selectOnepagerAnchor('Agriculture', [caseFixture()])).toBeNull();
  });

  it('returns null when the library has no case in the sector', () => {
    expect(selectOnepagerAnchor('Aerospace', [caseFixture({ industry: 'technology' })])).toBeNull();
  });
});

describe('pickOnepagerArchetypeId', () => {
  it('routes fund / GP / cross-border to cross_border_reality', () => {
    expect(pickOnepagerArchetypeId('Financial Services', 'Fund GP')).toBe('cross_border_reality');
    // ETA persona ids carry no cross-border keyword, so the signal comes from
    // the sector/role (here an emerging-markets sector with a searcher persona).
    expect(
      pickOnepagerArchetypeId('Emerging markets manufacturing', 'Searcher', 'self_funded_searcher')
    ).toBe('cross_border_reality');
    expect(pickOnepagerArchetypeId('Pan-African retail', 'Corp Dev')).toBe('cross_border_reality');
  });

  it('defaults to billion_dollar_autopsy', () => {
    expect(pickOnepagerArchetypeId('Technology', 'Head of Corp Dev')).toBe(
      'billion_dollar_autopsy'
    );
  });
});

describe('buildOnepagerInstruction', () => {
  const anchor = caseFixture({
    company: 'WeWork',
    title: 'WeWork S-1',
    primaryBias: 'Illusion of Validity',
  });
  const out = buildOnepagerInstruction(req, anchor);

  it('names the public anchor as the only referenceable case', () => {
    expect(out).toContain('WeWork');
    expect(out).toContain('Anchor EXCLUSIVELY on WeWork');
  });

  it('carries the hard ego-safe / invent-nothing constraint', () => {
    expect(out).toContain('NO information about TargetCo');
    expect(out).toContain('must INVENT none');
    expect(out).toContain('never audits the reader');
    expect(out).toContain('unaudited reasoning');
  });

  it('defers banned-vocabulary enforcement to the system-prompt guard', () => {
    expect(out).toContain('banned-vocabulary guard is already in the system prompt');
    expect(out).toContain('no accusatory framing');
  });
});
