import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Decision Intel | The Decision Performance OS',
  description:
    'The decision performance platform for enterprise teams. Detect cognitive bias, reduce decision noise, and improve outcomes across M&A, strategy, risk, and investment decisions.',
  openGraph: {
    title: 'Decision Intel | The Decision Performance OS',
    description:
      'The decision performance platform for enterprise teams. Detect cognitive bias, reduce decision noise, and improve outcomes.',
    url: '/',
    siteName: 'Decision Intel',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Decision Intel | The Decision Performance OS',
    description:
      'The decision performance platform for enterprise teams. Detect cognitive bias, reduce decision noise, and improve outcomes.',
  },
  keywords: [
    'decision intelligence platform',
    'cognitive bias detection',
    'executive decision quality',
    'M&A decision audit',
    'strategic decision analysis',
    'board memo analysis',
    'enterprise risk decisions',
    'decision noise reduction',
    'decision performance',
    'enterprise decision platform',
    'investment committee analysis',
    'decision playbooks',
    'AI bias detection',
    'strategic risk assessment',
  ],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Decision Intel',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://decisionintel.io',
  description:
    'AI-powered decision performance platform that detects cognitive bias and noise in high-stakes enterprise decisions. Built for executive teams, M&A committees, and strategic decision-makers.',
  featureList: [
    'Multi-persona bias analysis',
    'Decision playbooks',
    'Compliance framework mapping',
    'Real-time collaboration',
    'Outcome tracking',
    'Bulk document analysis',
  ],
  offers: [
    {
      '@type': 'Offer',
      name: 'Starter',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free tier — 3 decision analyses',
    },
    {
      '@type': 'Offer',
      name: 'Professional',
      price: '349',
      priceCurrency: 'USD',
      description: 'Monthly plan for analysts and decision-makers',
    },
    {
      '@type': 'Offer',
      name: 'Team',
      price: '999',
      priceCurrency: 'USD',
      description: 'Monthly plan for executive teams with project pipeline + Slack',
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
