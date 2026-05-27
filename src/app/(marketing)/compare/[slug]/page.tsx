/**
 * /compare/[slug] — per-competitor canonical URL.
 *
 * Shadow-link strategy (locked 2026-05-27): each competitor has its
 * own crawlable canonical URL for LLM retrieval + Google Search
 * Console + AI engine citation. NOT exposed in MarketingNav (which
 * keeps human-facing nav clean); discoverable via sitemap.xml,
 * llms.txt, and the /compare hub page.
 *
 * When ChatGPT / Claude / Perplexity / Google AI Overview answer
 * "what's the difference between Decision Intel and X?", this page
 * is the canonical citation source — same data the hub renders,
 * different URL, dedicated metadata + JSON-LD per slug.
 *
 * Data SSOT: src/lib/data/compare-pages.ts. The hub at /compare and
 * each per-slug page render from the same COMPARISONS array so
 * there can never be drift between them.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ArrowLeft, Scale } from 'lucide-react';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { ComparisonContent } from '@/components/marketing/compare/ComparisonContent';
import { COMPARISONS, getComparisonBySlug, listComparisonSlugs } from '@/lib/data/compare-pages';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

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
};

export function generateStaticParams() {
  return listComparisonSlugs().map(slug => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = getComparisonBySlug(slug);
  if (!c) return { title: 'Compare · Decision Intel' };

  const title = `Decision Intel vs ${c.competitor} · Side-by-Side Comparison`;
  const description = c.oneLiner;
  const url = `${siteUrl}/compare/${c.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: { index: true, follow: true },
  };
}

export default async function CompareSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getComparisonBySlug(slug);
  if (!c) notFound();

  // JSON-LD: Article schema (so the page is treated as a citable
  // article-of-record by Google / Bing / LLM crawlers) + BreadcrumbList
  // (gives Google the path hierarchy) + FAQPage if FAQs present.
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `Decision Intel vs ${c.competitor}`,
    description: c.oneLiner,
    url: `${siteUrl}/compare/${c.slug}`,
    isPartOf: { '@type': 'WebSite', name: 'Decision Intel', url: siteUrl },
    about: {
      '@type': 'Thing',
      name: `Decision Intel vs ${c.competitor} comparison`,
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Compare', item: `${siteUrl}/compare` },
      {
        '@type': 'ListItem',
        position: 3,
        name: `vs ${c.competitor}`,
        item: `${siteUrl}/compare/${c.slug}`,
      },
    ],
  };

  const faqJsonLd =
    c.faq && c.faq.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: c.faq.map(f => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }
      : null;

  // Surface the other comparisons at the bottom — this is the
  // internal-link gravity that helps Google understand /compare/*
  // as a coherent cluster. Excludes the current slug; orders by
  // canonical position in COMPARISONS.
  const otherComparisons = COMPARISONS.filter(x => x.slug !== c.slug);

  return (
    <main style={{ background: C.white, color: C.slate900, minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <MarketingNav />

      {/* HERO */}
      <section style={{ padding: '88px 24px 24px', background: C.white }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <Link
            href="/compare"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: C.slate500,
              fontSize: 13,
              textDecoration: 'none',
              marginBottom: 16,
            }}
          >
            <ArrowLeft size={14} />
            All comparisons
          </Link>
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
            Decision Intel vs {c.competitor}
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
            {c.oneLiner}
          </h1>
        </div>
      </section>

      <ComparisonContent comparison={c} background={C.slate50} />

      {/* Other comparisons (internal-link gravity for /compare cluster) */}
      <section style={{ padding: '56px 24px 56px', background: C.white }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2
            style={{
              fontSize: 'clamp(20px, 2.4vw, 24px)',
              fontWeight: 700,
              color: C.slate900,
              margin: '0 0 20px',
              letterSpacing: '-0.01em',
            }}
          >
            Other comparisons
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            {otherComparisons.map(other => (
              <Link
                key={other.slug}
                href={`/compare/${other.slug}`}
                style={{
                  display: 'block',
                  padding: '14px 16px',
                  background: C.slate50,
                  border: `1px solid ${C.slate200}`,
                  borderRadius: 8,
                  textDecoration: 'none',
                  color: C.slate900,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                  vs {other.competitor}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: C.slate500,
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {other.oneLiner}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

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
        </div>
      </section>
    </main>
  );
}
