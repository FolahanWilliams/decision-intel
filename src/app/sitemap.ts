import type { MetadataRoute } from 'next';
import { getAllCaseSlugs } from '@/lib/data/case-studies';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

type ChangeFreq = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;

/**
 * Canonical, indexable, 200-status marketing surfaces — the single source of
 * truth for the XML sitemap. Path is relative (no leading-slash drift), no
 * trailing slash (Next.js `trailingSlash` default is false, so the
 * non-slashed form is canonical and must match `metadataBase` in layout.tsx).
 *
 * INCLUSION RULE: a route belongs here iff it (a) returns 200 (never a
 * redirect), (b) is NOT `robots: { index: false }`, and (c) is a real
 * content surface a search visitor should land on. Adding a new public
 * marketing page? Add it here in the SAME commit — an indexable page absent
 * from the sitemap is organic-discovery suppression (the exact bug Google
 * Search Console surfaced 2026-05-18: 14 high-value pages were missing).
 *
 * DELIBERATELY EXCLUDED (do not "fix" by adding — each is correct):
 *   /login                       — utility page, zero indexable content;
 *                                  sitemapping it manufactures the
 *                                  "Crawled - currently not indexed" signal.
 *   /calibration                 — in-component redirect() → /r2f-standard
 *                                  #calibration. Never sitemap a redirect.
 *   /decision-alpha              — 308 → /proof (next.config). Redirect.
 *   /decision-intel-for-boards   — robots:{index:false} (deliberate).
 *   /design-partner              — robots:{index:false} (unlisted 5-seat
 *                                  program). Sitemap + noindex is a
 *                                  conflicting-signal SEO anti-pattern.
 *   /pricing/quote               — robots:{index:false} (deliberate per
 *                                  CLAUDE.md; the public quote builder).
 *   /demo/[slug], /case-studies/sample/[slug]
 *                                — dynamic; the canonical /case-studies/
 *                                  [slug] entries already carry the
 *                                  equivalent decision content for SEO.
 *                                  Deliberate scope boundary, not an omission.
 */
const STATIC_ROUTES: ReadonlyArray<{
  path: string;
  priority: number;
  changeFrequency: ChangeFreq;
}> = [
  // Tier 1 — the conversion + discovery spine
  { path: '', priority: 1.0, changeFrequency: 'weekly' }, // landing /
  { path: '/how-it-works', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/pricing', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/proof', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/case-studies', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/demo', priority: 0.8, changeFrequency: 'monthly' },
  // Tier 2 — the IP / methodology moat surfaces
  { path: '/r2f-standard', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/bias-genome', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/taxonomy', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/decision-provenance', priority: 0.7, changeFrequency: 'monthly' },
  // Tier 3 — procurement / trust surfaces (CSO / GC / audit-committee path)
  { path: '/security', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/trust', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/regulatory/ai-verify', priority: 0.6, changeFrequency: 'monthly' },
  // Tier 4 — supporting artefacts
  { path: '/onepager', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/simulate-ceo', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(r => ({
    url: `${siteUrl}${r.path}`,
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const caseStudyEntries: MetadataRoute.Sitemap = getAllCaseSlugs().map(slug => ({
    url: `${siteUrl}/case-studies/${slug}`,
    lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...caseStudyEntries];
}
