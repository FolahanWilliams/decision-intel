import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Decision Intel | The Decision Performance OS',
  description:
    'Audit strategic documents for cognitive bias, decision noise, and blind spots. Purpose-built for executive teams making high-stakes decisions — M&A, strategy, risk, and investment committees.',
  openGraph: {
    title: 'Decision Intel | The Decision Performance OS',
    description:
      'Audit strategic documents for cognitive bias and decision noise. Built for high-stakes executive teams.',
    url: '/',
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
  ],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Decision Intel',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    'AI-powered platform that audits high-stakes decisions for cognitive bias and noise. Built for executive teams, M&A committees, and strategic decision-makers.',
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
