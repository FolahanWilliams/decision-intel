/**
 * Slug helpers for the public case study library at /case-studies/[slug].
 *
 * Slugs are derived deterministically from a case's `company` field. When two
 * cases share a company name (e.g. multiple Boeing incidents), the year is
 * appended to disambiguate. The slug set is stable across builds — it is
 * consumed by `generateStaticParams`, the sitemap, and outreach URLs, so any
 * change to this function is effectively an SEO-visible migration.
 */

import { ALL_CASES } from './index';
import type { CaseStudy } from './types';

/** Lowercase, hyphenate, strip non-alphanumerics. No external deps. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Build the full slug index once, at import time. Handles collisions by
 * appending `-<year>`, and if two cases share both company + year, falls
 * back to appending the case id tail.
 */
function buildSlugMap(): {
  bySlug: Map<string, CaseStudy>;
  byId: Map<string, CaseStudy>;
  slugOf: Map<string, string>;
} {
  const bySlug = new Map<string, CaseStudy>();
  const byId = new Map<string, CaseStudy>();
  const slugOf = new Map<string, string>();

  // Count base slug frequencies to detect collisions.
  const baseCounts = new Map<string, number>();
  for (const c of ALL_CASES) {
    const base = slugify(c.company);
    baseCounts.set(base, (baseCounts.get(base) ?? 0) + 1);
  }

  for (const c of ALL_CASES) {
    byId.set(c.id, c);
    const base = slugify(c.company) || slugify(c.title) || c.id;
    let slug = base;

    if ((baseCounts.get(base) ?? 0) > 1) {
      slug = `${base}-${c.year}`;
    }

    // Still collides (same company + year) — append the id tail.
    if (bySlug.has(slug)) {
      const tail = c.id
        .replace(/[^a-z0-9]+/gi, '')
        .slice(-4)
        .toLowerCase();
      slug = `${slug}-${tail}`;
    }

    bySlug.set(slug, c);
    slugOf.set(c.id, slug);
  }

  return { bySlug, byId, slugOf };
}

// Lazy singleton: `./index.ts` re-exports from this module, so touching
// ALL_CASES at import time creates a circular-init hazard during bundling
// and test runs. Build the slug map on first access instead.
let SLUG_MAP: ReturnType<typeof buildSlugMap> | null = null;
function getSlugMap() {
  if (!SLUG_MAP) SLUG_MAP = buildSlugMap();
  return SLUG_MAP;
}

export function getCaseBySlug(slug: string): CaseStudy | undefined {
  return getSlugMap().bySlug.get(slug);
}

export function getCaseById(id: string): CaseStudy | undefined {
  return getSlugMap().byId.get(id);
}

export function getSlugForCase(caseStudy: CaseStudy): string {
  return getSlugMap().slugOf.get(caseStudy.id) ?? slugify(caseStudy.company);
}

export function getAllCaseSlugs(): string[] {
  return Array.from(getSlugMap().bySlug.keys());
}

/** Cases that have the full hindsight-stripped `preDecisionEvidence` field. */
export function getDeepCases(): CaseStudy[] {
  return ALL_CASES.filter(c => c.preDecisionEvidence != null);
}
