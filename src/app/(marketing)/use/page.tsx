/**
 * /use — workflow-pages hub.
 *
 * Shadow-link strategy (mirrors /compare lock 2026-05-27): each use
 * case has its own crawlable /use/[slug] page for LLM retrieval +
 * Google Search Console + AI engine citation. The hub renders all
 * use cases inline so a human visitor (typically arrived via the
 * footer or a case-study cross-link) sees the full surface in one
 * page. LLMs and the sitemap know about each individually.
 *
 * Not exposed in MarketingNav — same reasoning as /compare: keeps
 * human-facing nav clean while the AEO surface compounds.
 *
 * Data SSOT: src/lib/data/use-cases.ts.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Workflow } from 'lucide-react';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { UseCaseContent } from '@/components/marketing/use-cases/UseCaseContent';
import { USE_CASES } from '@/lib/data/use-cases';

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

export const metadata: Metadata = {
  title: 'Decision Intel · Workflows · Audit any strategic decision',
  description:
    'Workflow-specific reasoning audits — strategic memo, IC memo, board deck, fund thesis, M&A bias, pre-mortem. Each shipped against the 22-bias Recognition-Rigor Framework on a 143-case reference library.',
  alternates: { canonical: `${siteUrl}/use` },
  openGraph: {
    title: 'Decision Intel · Workflows',
    description:
      'Six workflow-specific reasoning audits — strategic memo, IC memo, board deck, fund thesis, M&A bias, pre-mortem.',
    url: `${siteUrl}/use`,
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export default function UseHubPage() {
  // ItemList JSON-LD — Google understands hub pages with this schema.
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Decision Intel workflows',
    description: 'Workflow-specific reasoning audits across strategic decision artefacts.',
    numberOfItems: USE_CASES.length,
    itemListElement: USE_CASES.map((u, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${siteUrl}/use/${u.slug}`,
      name: u.workflow,
      description: u.oneLiner,
    })),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Workflows', item: `${siteUrl}/use` },
    ],
  };

  return (
    <main style={{ background: C.white, color: C.slate900, minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <MarketingNav />

      {/* HERO */}
      <section style={{ padding: '88px 24px 32px', background: C.white }}>
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
            <Workflow size={14} />
            Workflows
          </div>
          <h1
            style={{
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 700,
              lineHeight: 1.15,
              margin: 0,
              color: C.slate900,
              letterSpacing: '-0.02em',
              maxWidth: 820,
            }}
          >
            Workflow-specific audits across every strategic decision artefact.
          </h1>
          <p
            style={{
              marginTop: 16,
              fontSize: 17,
              lineHeight: 1.6,
              color: C.slate600,
              maxWidth: 720,
            }}
          >
            Strategic memo, IC memo, board deck, fund thesis, M&amp;A acquisition, pre-mortem. Each
            workflow runs through the same Recognition-Rigor Framework pipeline — calibrated against
            the same 143-case reference library — with the overlays specific to that artefact class.
          </p>

          {/* Quick jump strip */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: 28,
            }}
          >
            {USE_CASES.map(u => (
              <Link
                key={u.slug}
                href={`#${u.slug}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '6px 12px',
                  background: C.slate50,
                  border: `1px solid ${C.slate200}`,
                  borderRadius: 999,
                  color: C.slate700,
                  fontSize: 13,
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                {u.workflow}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Each use case inline — alternating backgrounds for rhythm */}
      {USE_CASES.map((u, i) => (
        <UseCaseContent
          key={u.slug}
          useCase={u}
          sectionId={u.slug}
          background={i % 2 === 0 ? C.slate50 : C.white}
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
            One pipeline. Six workflow surfaces. Same calibrated audit.
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
            Paste a memo and see the audit run end-to-end — free, no card.
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
