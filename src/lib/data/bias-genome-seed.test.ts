import { describe, it, expect } from 'vitest';
import { computeGenomeFromSeed } from './bias-genome-seed';
import { getCaseBySlug, getAllCaseSlugs, getSlugForCase, ALL_CASES } from './case-studies';

/**
 * Locks the bias-genome → /case-studies link integrity (2026-06-15 Ahrefs
 * audit). The /bias-genome page's ToxicComboCard renders every
 * `caseExamples[].slug` as an internal <Link href="/case-studies/{slug}">.
 * A hand-copied `slugFor` here had drifted from the canonical getSlugForCase
 * (it mishandled `&` → it produced "johnson-johnson" not "johnson-and-johnson",
 * and it never appended the disambiguating `-{year}` for duplicate companies),
 * so 15 of those links 404'd in production. The fix is to use the canonical
 * getSlugForCase; this test makes a future regression fail loudly instead of
 * shipping dead links onto a public acquisition surface.
 */
describe('bias-genome seed — case-study link integrity', () => {
  const result = computeGenomeFromSeed();
  const validSlugs = new Set(getAllCaseSlugs());

  it('every toxic-pattern caseExample slug resolves to a real case-study route', () => {
    const broken: string[] = [];
    for (const pattern of result.toxicPatterns) {
      for (const ex of pattern.caseExamples) {
        if (!validSlugs.has(ex.slug) || !getCaseBySlug(ex.slug)) {
          broken.push(`${pattern.name}: /case-studies/${ex.slug} (${ex.company} ${ex.year})`);
        }
      }
    }
    expect(broken, `broken /case-studies links:\n${broken.join('\n')}`).toEqual([]);
  });

  it('emitted slugs equal the canonical getSlugForCase (no hand-rolled drift)', () => {
    for (const pattern of result.toxicPatterns) {
      for (const ex of pattern.caseExamples) {
        const resolved = getCaseBySlug(ex.slug);
        expect(resolved, `unresolved slug ${ex.slug}`).toBeTruthy();
        if (resolved) expect(ex.slug).toBe(getSlugForCase(resolved));
      }
    }
  });

  it('the ampersand + collision cases specifically resolve (the audit offenders)', () => {
    // Representative of the two failure modes the 2026-06-15 audit surfaced.
    const jj = ALL_CASES.find(c => c.company === 'Johnson & Johnson');
    if (jj) {
      const slug = getSlugForCase(jj);
      expect(slug).toContain('johnson-and-johnson'); // & → " and ", never stripped to "johnson-johnson"
      expect(getCaseBySlug(slug)).toBeTruthy();
    }
    // A collision company (multiple GE cases) must carry a disambiguating suffix.
    const geCases = ALL_CASES.filter(c => c.company === 'General Electric');
    if (geCases.length > 1) {
      for (const ge of geCases) {
        const slug = getSlugForCase(ge);
        expect(slug).not.toBe('general-electric'); // bare slug is a 404
        expect(getCaseBySlug(slug)).toBeTruthy();
      }
    }
  });
});
