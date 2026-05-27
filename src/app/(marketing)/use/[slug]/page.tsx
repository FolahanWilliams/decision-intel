/**
 * /use/[slug] — per-workflow canonical URL.
 *
 * Shadow-link strategy (mirrors /compare/[slug] lock 2026-05-27):
 * each workflow has its own crawlable canonical URL for LLM
 * retrieval + Google Search Console + AI engine citation. NOT
 * exposed in MarketingNav; discoverable via sitemap.xml, llms.txt,
 * the /use hub, and case-study cross-link blocks.
 *
 * When ChatGPT / Claude / Perplexity / Google AI Overview answer
 * workflow-shaped queries ("how do I audit a strategic memo?" /
 * "pre-mortem before a board decision" / etc.), this page is the
 * canonical citation source — same content the hub renders,
 * different URL, dedicated metadata + JSON-LD per slug.
 *
 * Data SSOT: src/lib/data/use-cases.ts.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ArrowLeft, Workflow } from 'lucide-react';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { UseCaseContent } from '@/components/marketing/use-cases/UseCaseContent';
import { USE_CASES, getUseCaseBySlug, listUseCaseSlugs } from '@/lib/data/use-cases';

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
  return listUseCaseSlugs().map(slug => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const u = getUseCaseBySlug(slug);
  if (!u) return { title: 'Workflow · Decision Intel' };

  const title = `${u.workflow} · Decision Intel`;
  const description = u.oneLiner;
  const url = `${siteUrl}/use/${u.slug}`;

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

export default async function UseSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const u = getUseCaseBySlug(slug);
  if (!u) notFound();

  // JSON-LD: HowTo schema (Google understands workflow pages with
  // this — may surface as a rich snippet) + Article schema (citable
  // article-of-record by LLM crawlers) + BreadcrumbList + FAQPage.
  const howToJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: u.workflow,
    description: u.oneLiner,
    totalTime: 'PT2M',
    step: u.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.title,
      text: step.detail,
    })),
  };

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: u.workflow,
    description: u.oneLiner,
    url: `${siteUrl}/use/${u.slug}`,
    isPartOf: { '@type': 'WebSite', name: 'Decision Intel', url: siteUrl },
    about: {
      '@type': 'Thing',
      name: u.targetPersona,
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Workflows', item: `${siteUrl}/use` },
      {
        '@type': 'ListItem',
        position: 3,
        name: u.workflow,
        item: `${siteUrl}/use/${u.slug}`,
      },
    ],
  };

  const faqJsonLd =
    u.faq.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: u.faq.map(f => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }
      : null;

  // Other workflows for the cross-link block.
  const otherUseCases = USE_CASES.filter(x => x.slug !== u.slug);

  return (
    <main style={{ background: C.white, color: C.slate900, minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
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
            href="/use"
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
            All workflows
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
            <Workflow size={14} />
            {u.eyebrow}
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
            {u.workflow}
          </h1>
        </div>
      </section>

      <UseCaseContent useCase={u} background={C.slate50} />

      {/* Other workflows (internal-link gravity for /use cluster) */}
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
            Other workflows
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            {otherUseCases.map(other => (
              <Link
                key={other.slug}
                href={`/use/${other.slug}`}
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
                  {other.workflow}
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
            Paste a strategic memo and see the audit run end-to-end — free, no card.
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
            {u.ctaLabel}
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}
