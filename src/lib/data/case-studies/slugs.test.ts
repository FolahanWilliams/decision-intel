import { describe, it, expect } from 'vitest';
import {
  slugify,
  getCaseBySlug,
  getCaseById,
  getAllCaseSlugs,
  getSlugForCase,
  getDeepCases,
} from './slugs';
import { ALL_CASES } from './index';

describe('slugify', () => {
  it('lowercases, hyphenates, and strips punctuation', () => {
    expect(slugify('Theranos')).toBe('theranos');
    expect(slugify('AOL Time Warner')).toBe('aol-time-warner');
    expect(slugify('Long-Term Capital Management')).toBe('long-term-capital-management');
    expect(slugify('Boeing 737 MAX')).toBe('boeing-737-max');
  });

  it('normalizes accented characters', () => {
    expect(slugify('Crédit Agricole')).toBe('credit-agricole');
  });

  it('replaces ampersands with "and"', () => {
    expect(slugify('Procter & Gamble')).toBe('procter-and-gamble');
  });

  it('trims leading and trailing separators', () => {
    expect(slugify('  !Tesla!  ')).toBe('tesla');
  });
});

describe('slug map', () => {
  it('produces a unique slug for every case study', () => {
    const slugs = getAllCaseSlugs();
    expect(slugs.length).toBe(ALL_CASES.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('allows round-tripping case -> slug -> case by id', () => {
    for (const c of ALL_CASES.slice(0, 20)) {
      const slug = getSlugForCase(c);
      const found = getCaseBySlug(slug);
      expect(found?.id).toBe(c.id);
    }
  });

  it('returns undefined for unknown slugs and ids', () => {
    expect(getCaseBySlug('not-a-real-case-xyz')).toBeUndefined();
    expect(getCaseById('cs-does-not-exist')).toBeUndefined();
  });

  it('looks up by id as well as slug', () => {
    const first = ALL_CASES[0];
    expect(getCaseById(first.id)?.id).toBe(first.id);
  });
});

describe('getDeepCases', () => {
  it('only returns cases with preDecisionEvidence populated', () => {
    const deep = getDeepCases();
    expect(deep.length).toBeGreaterThan(0);
    for (const c of deep) {
      expect(c.preDecisionEvidence).toBeDefined();
    }
  });
});
