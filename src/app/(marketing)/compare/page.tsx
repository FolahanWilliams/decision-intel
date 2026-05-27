/**
 * /compare — Decision Intel vs the named competitive set (hub page).
 *
 * AEO discipline (locked 2026-05-23, extended 2026-05-27): comparison
 * pages are the third highest-leverage AI-extraction shape (after FAQ
 * + Glossary). When a user asks an AI answer engine "X vs Y" the
 * engine pulls a comparison table verbatim — which means the
 * row-shape, the canonical-line text, and the JSON-LD ItemList all
 * need to be procurement-grade.
 *
 * 2026-05-27 ship: extracted the inline COMPARISONS array into
 * src/lib/data/compare-pages.ts (SSOT) + added 3 new comparisons
 * (Palantir, ChatGPT-for-strategy, McKinsey). Each comparison ALSO
 * has its own canonical URL at /compare/[slug] for LLM retrieval
 * (per-slug pages are SEO/AEO surfaces; this hub page is the
 * human-navigable index that lists all of them). The
 * shadow-link pattern keeps MarketingNav clean while giving every
 * competitor its own crawlable, citable canonical URL.
 *
 * Voice discipline (inherited): each comparison leads with the
 * canonical defensive line, names the competitor's strength
 * HONESTLY, then surfaces specific capability axes. NEVER disparage
 * — every row is verifiable against the competitor's own published
 * documentation.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Scale } from 'lucide-react';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { ComparisonContent } from '@/components/marketing/compare/ComparisonContent';
import { COMPARISONS } from '@/lib/data/compare-pages';
import { CATEGORY_CLAIM, POSITIONING_HERO_PRIMARY } from '@/lib/constants/icp';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

export const metadata: Metadata = {
  title: 'Compare · Decision Intel vs Cloverpop, IBM watsonx, Aera, Palantir, ChatGPT, McKinsey',
  description: `${POSITIONING_HERO_PRIMARY} Side-by-side comparisons on the axes a procurement reader actually scores.`,
  alternates: { canonical: `${siteUrl}/compare` },
  openGraph: {
    title: 'Compare · Decision Intel vs the named competitive set',
    description:
      'Side-by-side on bias detection, regulatory mapping, audit-trail provenance, and the calibration flywheel — across 6 competitors and categories.',
    url: `${siteUrl}/compare`,
  },
  robots: { index: true, follow: true },
};

const C = {
  navy: '#0F172A',
  slate900: '#0F172A',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748B',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  slate50: '#F8FAFC',
  white: '#FFFFFF',
  green: '#16A34A',
  greenSoft: 'rgba(22, 163, 74, 0.08)',
  amber: '#D97706',
};

const comparisonItemListJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  '@id': `${siteUrl}/compare#comparison-list`,
  name: 'Decision Intel · Competitive comparison',
  itemListElement: COMPARISONS.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: {
      '@type': 'Article',
      headline: `Decision Intel vs ${c.competitor}`,
      description: c.oneLiner,
      url: `${siteUrl}/compare/${c.slug}`,
    },
  })),
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
    { '@type': 'ListItem', position: 2, name: 'Compare', item: `${siteUrl}/compare` },
  ],
};

export default function ComparePage() {
  return (
    <main style={{ background: C.white, color: C.slate900, minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(comparisonItemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <MarketingNav />

      {/* HERO */}
      <section style={{ padding: '88px 24px 48px', background: C.white }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 999,
              background: C.greenSoft,
              color: C.green,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 20,
            }}
          >
            <Scale size={14} />
            Compare
          </div>
          <h1
            style={{
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 700,
              lineHeight: 1.15,
              margin: 0,
              color: C.slate900,
              letterSpacing: '-0.02em',
            }}
          >
            Decision Intel vs the named competitive set.
          </h1>
          <p
            style={{
              marginTop: 20,
              fontSize: 18,
              lineHeight: 1.6,
              color: C.slate600,
              maxWidth: 760,
            }}
          >
            {CATEGORY_CLAIM[0].toUpperCase() + CATEGORY_CLAIM.slice(1)} sits in a different category
            than the tools your team has already evaluated. {COMPARISONS.length} side-by-sides on
            the axes that actually move a procurement scorecard. Each comparison has its own
            canonical URL for citation + AI-engine retrieval.
          </p>

          {/* Per-slug deep-link cards — shadow-linked from here so an LLM
              that cites /compare can also point a user at the specific
              /compare/[slug] page if the question is "X vs DI" rather
              than "what does DI compare to in general." */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 10,
              marginTop: 28,
            }}
          >
            {COMPARISONS.map(c => (
              <Link
                key={c.slug}
                href={`/compare/${c.slug}`}
                style={{
                  display: 'block',
                  padding: '12px 14px',
                  background: C.slate50,
                  border: `1px solid ${C.slate200}`,
                  borderRadius: 8,
                  textDecoration: 'none',
                  color: C.slate900,
                  fontSize: 13,
                  fontWeight: 600,
                  lineHeight: 1.4,
                }}
              >
                Decision Intel vs {c.competitor}
                <span
                  style={{
                    color: C.slate500,
                    fontWeight: 400,
                    fontSize: 11,
                    display: 'block',
                    marginTop: 2,
                  }}
                >
                  /compare/{c.slug} →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {COMPARISONS.map((c, ci) => (
        <ComparisonContent
          key={c.slug}
          comparison={c}
          sectionId={c.slug}
          background={ci % 2 === 0 ? C.slate50 : C.white}
        />
      ))}

      {/* CLOSE */}
      <section style={{ padding: '64px 24px 96px', background: C.navy, color: C.white }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <h2
            style={{
              fontSize: 'clamp(24px, 3vw, 32px)',
              fontWeight: 700,
              lineHeight: 1.2,
              margin: 0,
              color: C.white,
              letterSpacing: '-0.01em',
            }}
          >
            Run the audit on a real memo.
          </h2>
          <p
            style={{
              marginTop: 16,
              marginBottom: 28,
              fontSize: 17,
              lineHeight: 1.6,
              color: '#CBD5E1',
            }}
          >
            The category claim is the H1. The category proof is the artefact. Paste a strategic memo
            and see the audit run end-to-end, free.
          </p>
          <div
            style={{
              display: 'inline-flex',
              gap: 12,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <Link
              href="/demo"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                background: C.green,
                color: C.white,
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 8,
                textDecoration: 'none',
              }}
            >
              Run the live demo
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/onepager"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                background: 'transparent',
                color: C.white,
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 8,
                textDecoration: 'none',
                border: `1px solid ${C.slate500}`,
              }}
            >
              Download the one-pager
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
