import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Decision Intel | AI Due Diligence for PE & VC',
  description:
    'Audit deal memos, IC papers, and investment theses for cognitive bias and decision noise. Purpose-built for private equity and venture capital investment committees.',
  openGraph: {
    title: 'Decision Intel | AI Due Diligence for PE & VC',
    description:
      'Audit deal memos and investment theses for cognitive bias. Purpose-built for PE & VC.',
    url: '/',
  },
  keywords: [
    'due diligence AI',
    'private equity decision making',
    'venture capital bias detection',
    'investment committee bias audit',
    'deal memo analysis',
    'cognitive bias PE',
    'IC memo review',
    'decision noise reduction',
  ],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Decision Intel',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    'AI-powered platform that audits investment decisions for cognitive bias and noise. Purpose-built for PE/VC investment committees.',
  offers: [
    {
      '@type': 'Offer',
      name: 'Noise Audit',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free tier — 3 document analyses',
    },
    {
      '@type': 'Offer',
      name: 'Individual Partner',
      price: '349',
      priceCurrency: 'USD',
      description: 'Monthly plan for deal partners',
    },
    {
      '@type': 'Offer',
      name: 'Fund',
      price: '1999',
      priceCurrency: 'USD',
      description: 'Monthly plan for full IC teams with deal pipeline + Slack',
    },
  ],
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
