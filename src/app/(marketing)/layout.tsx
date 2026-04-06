import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Decision Intel — Grammarly for Strategic Decisions | AI Bias & Noise Detection',
  description:
    'Decision Intel is the AI-powered decision hygiene platform that detects cognitive bias, measures decision noise, and calibrates your team\'s judgment — like Grammarly for strategic decisions. Used by M&A teams, corporate strategy, investment committees, and boards.',
  openGraph: {
    title: 'Decision Intel — Grammarly for Strategic Decisions',
    description:
      'Detect cognitive bias and decision noise in any strategic document — board memos, deal theses, strategy proposals. AI-powered, always-on, <60 seconds per audit.',
    url: '/',
    siteName: 'Decision Intel',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Decision Intel — Grammarly for Strategic Decisions',
    description:
      'Every strategic memo has hidden biases. We find them in <60 seconds — before they cost your organization millions.',
  },
  keywords: [
    // Core positioning
    'grammarly for decisions',
    'decision hygiene platform',
    'cognitive bias detection AI',
    'decision noise reduction',
    // Enterprise audiences
    'M&A decision audit',
    'corporate strategy bias detection',
    'investment committee analysis',
    'board decision quality',
    'executive decision-making tool',
    // Product capabilities
    'AI bias detection',
    'decision intelligence platform',
    'strategic risk assessment',
    'cognitive audit software',
    'decision playbooks',
    'compliance mapping SOX FCA',
    'outcome tracking',
    'decision knowledge graph',
    // Research-backed
    'Kahneman decision noise',
    'cognitive bias enterprise',
    'decision quality score',
  ],
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Decision Intel',
  alternateName: 'Grammarly for Strategic Decisions',
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'Decision Intelligence',
  operatingSystem: 'Web',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://decisionintel.io',
  description:
    'AI-powered decision hygiene platform that detects cognitive bias and noise in high-stakes enterprise decisions. Like Grammarly catches grammar errors before you hit send, Decision Intel catches cognitive biases before you sign the deal. Built for M&A teams, corporate strategy, investment committees, and boards.',
  featureList: [
    '20+ cognitive bias types detected automatically',
    'Decision noise measurement via 3-judge AI jury',
    'Toxic combination detection (compound bias patterns)',
    'Compliance mapping: SOX, FCA, EU AI Act, Basel III, GDPR, SEC, LPOA',
    'Audit Defense Packet PDF export with regulatory citations',
    'Passive outcome inference from documents, Slack, and web intelligence',
    'Decision knowledge graph with entity resolution',
    'Calibrated risk scoring that improves with every confirmed outcome',
    'Dr. Red Team adversarial challenge persona',
    'Playbook auto-suggestion based on detected bias fingerprint',
  ],
  offers: [
    {
      '@type': 'Offer',
      name: 'Starter',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free — 3 decision analyses per month. Try the bias engine on any strategic document.',
    },
    {
      '@type': 'Offer',
      name: 'Professional',
      price: '349',
      priceCurrency: 'USD',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '349',
        priceCurrency: 'USD',
        billingDuration: 'P1M',
      },
      description: 'For decision-makers running strategic documents through the bias engine. 50 analyses/month, 20+ bias types, outcome tracking.',
    },
    {
      '@type': 'Offer',
      name: 'Team',
      price: '999',
      priceCurrency: 'USD',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '999',
        priceCurrency: 'USD',
        billingDuration: 'P1M',
      },
      description: 'For decision committees with pipeline + Slack integration. 250 analyses/month, Decision Rooms, compliance mapping, team calibration.',
    },
  ],
  screenshot: process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/opengraph-image.tsx`
    : undefined,
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </div>
  );
}
