import type { Metadata } from 'next';
import { Suspense } from 'react';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { DemoPasteFlow } from '@/components/marketing/demo/DemoPasteFlow';
import { ALL_CASES, getSlugForCase } from '@/lib/data/case-studies';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

export const metadata: Metadata = {
  title: 'Try the demo · Decision Intel',
  description:
    'Audit a strategic memo in 60 seconds. Paste any board recommendation or market-entry analysis, and the real Decision Intel audit runs against it: cognitive-bias detection, boardroom simulation, counterfactual ROI, regulatory mapping. One free audit, no login.',
  alternates: { canonical: `${siteUrl}/demo` },
  openGraph: {
    title: 'Try the demo · Decision Intel',
    description:
      'Audit a strategic memo in 60 seconds. The same audit a paid run produces. No login.',
    url: `${siteUrl}/demo`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Try the demo · Decision Intel',
    description:
      'Audit a strategic memo in 60 seconds. The same audit a paid run produces. No login.',
  },
};

interface FamousCaseLink {
  slug: string;
  company: string;
  year: number;
  industry: string;
}

function deepCases(): FamousCaseLink[] {
  return ALL_CASES.filter(c => c.preDecisionEvidence != null && c.dqiEstimate != null)
    .slice(0, 6)
    .map(c => ({
      slug: getSlugForCase(c),
      company: c.company,
      year: c.year,
      industry: c.industry,
    }));
}

export default function DemoPage() {
  const famousCases = deepCases();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Decision Intel · Live Demo',
    description:
      'Run the full Decision Intel audit against any strategic memo. No login.',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: `${siteUrl}/demo`,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };

  return (
    <div style={{ background: '#F8FAFC', color: '#0F172A', minHeight: '100vh' }}>
      <MarketingNav />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={null}>
        <DemoPasteFlow famousCases={famousCases} />
      </Suspense>
    </div>
  );
}
