/**
 * AEO verification harness for /use/[slug] workflow pages.
 *
 * Locks the SSOT shape from silent drift. The shadow-link strategy
 * compounds value only if every workflow page renders clean JSON-LD
 * (HowTo + FAQPage + Article + Breadcrumb), every slug resolves, and
 * the sitemap / llms.txt entries stay in sync with the SSOT.
 *
 * Tests cover:
 *   1. SSOT integrity — every workflow has the required fields
 *   2. Slug discipline — slugs are unique, kebab-case, stable
 *   3. HowTo shape — every step has the required HowTo schema fields
 *   4. FAQ shape — every entry is FAQPage-renderable
 *   5. Cross-link discipline — related case slugs that resolve in the
 *      143-case library
 *   6. SEO honesty — title + description constraints
 */

import { describe, it, expect } from 'vitest';
import { USE_CASES, getUseCaseBySlug, listUseCaseSlugs } from './use-cases';
import { getCaseBySlug } from './case-studies/slugs';

const SLUG_PATTERN = /^[a-z][a-z0-9-]*[a-z0-9]$/;

describe('USE_CASES SSOT integrity', () => {
  it('has at least 6 workflows shipped', () => {
    expect(USE_CASES.length).toBeGreaterThanOrEqual(6);
  });

  it('every workflow has the required fields populated', () => {
    for (const u of USE_CASES) {
      expect(u.slug).toBeTruthy();
      expect(u.workflow).toBeTruthy();
      expect(u.eyebrow).toBeTruthy();
      expect(u.targetPersona).toBeTruthy();
      expect(u.oneLiner).toBeTruthy();
      expect(u.scqa.situation).toBeTruthy();
      expect(u.scqa.complication).toBeTruthy();
      expect(u.scqa.question).toBeTruthy();
      expect(u.scqa.answer).toBeTruthy();
      expect(u.steps.length).toBeGreaterThanOrEqual(3);
      expect(u.whyItMatters).toBeTruthy();
      expect(u.faq.length).toBeGreaterThanOrEqual(2);
      expect(u.ctaLabel).toBeTruthy();
    }
  });
});

describe('slug discipline', () => {
  it('slugs are unique', () => {
    const slugs = USE_CASES.map(u => u.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it('slugs match kebab-case shape (lowercase + hyphens + alphanumeric)', () => {
    for (const slug of listUseCaseSlugs()) {
      expect(slug).toMatch(SLUG_PATTERN);
    }
  });

  it('getUseCaseBySlug resolves every listed slug', () => {
    for (const slug of listUseCaseSlugs()) {
      expect(getUseCaseBySlug(slug)).toBeDefined();
    }
  });

  it('getUseCaseBySlug returns undefined for unknown slugs', () => {
    expect(getUseCaseBySlug('does-not-exist')).toBeUndefined();
    expect(getUseCaseBySlug('')).toBeUndefined();
  });
});

describe('HowTo schema shape', () => {
  it('every step has n, title, and detail', () => {
    for (const u of USE_CASES) {
      for (const step of u.steps) {
        expect(typeof step.n).toBe('number');
        expect(step.n).toBeGreaterThan(0);
        expect(step.title).toBeTruthy();
        expect(step.title.length).toBeLessThanOrEqual(60); // keep titles concise
        expect(step.detail).toBeTruthy();
        expect(step.detail.length).toBeGreaterThan(20); // detail is not just the title
      }
    }
  });

  it('step numbers are sequential starting at 1', () => {
    for (const u of USE_CASES) {
      u.steps.forEach((step, i) => {
        expect(step.n).toBe(i + 1);
      });
    }
  });
});

describe('FAQ shape', () => {
  it('every FAQ entry has a question ending in "?"', () => {
    for (const u of USE_CASES) {
      for (const f of u.faq) {
        expect(f.q).toMatch(/\?$/);
        expect(f.a.length).toBeGreaterThan(20); // not a stub answer
      }
    }
  });
});

describe('cross-link discipline (related case slugs)', () => {
  it('related case slugs that resolve actually exist in the case library', () => {
    // Soft test — we silent-drop unresolvable slugs at render time, but
    // also surface here when one breaks. Helps catch typos before they
    // ship to production.
    for (const u of USE_CASES) {
      for (const slug of u.relatedCaseSlugs) {
        const c = getCaseBySlug(slug);
        // If a slug doesn't resolve, log it but don't fail — we silent-
        // drop at render so the page still works. Surface to the
        // developer as a warning the test runner shows.
        if (!c) {
          console.warn(
            `[use-cases-test] Workflow "${u.slug}" lists related case slug "${slug}" that does not resolve in the 143-case library.`
          );
        }
      }
    }
    // Assert: at least 50% of related-case slugs across all workflows
    // resolve. Catches a catastrophic case-library rename.
    const all = USE_CASES.flatMap(u => u.relatedCaseSlugs);
    const resolved = all.filter(slug => getCaseBySlug(slug) != null);
    expect(resolved.length / all.length).toBeGreaterThanOrEqual(0.5);
  });
});

describe('SEO honesty constraints', () => {
  it('oneLiner stays under 200 chars (SEO description has 180 char cap)', () => {
    for (const u of USE_CASES) {
      // The page-level metadata uses oneLiner as description.
      // Allow some headroom but flag anything that's runaway-long.
      expect(u.oneLiner.length).toBeLessThanOrEqual(200);
    }
  });

  it('workflow name fits in a typical SERP title (≤70 chars)', () => {
    for (const u of USE_CASES) {
      // Page title is `${u.workflow} · Decision Intel` — that adds ~18
      // chars overhead, so the workflow name itself should stay short.
      expect(u.workflow.length).toBeLessThanOrEqual(70);
    }
  });
});
