import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Decision Intel — Audit Strategic Memos Before the Board Sees Them',
  description:
    'Decision Intel audits strategic memos, board decks, and market-entry recommendations in 60 seconds. 30+ cognitive biases detected, steering-committee questions predicted, outcomes tracked in a living Decision Knowledge Graph. Built for corporate strategy teams.',
  openGraph: {
    title: 'Decision Intel — Audit Strategic Memos Before the Board Sees Them',
    description:
      'Audit any strategic memo, board deck, or market-entry recommendation in 60 seconds. 30+ cognitive biases, predicted CEO/board questions, and a Decision Knowledge Graph that compounds quarter after quarter.',
    url: '/',
    siteName: 'Decision Intel',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Decision Intel — Audit Strategic Memos Before the Board Sees Them',
    description:
      'The same lens that exposed Kodak, Blockbuster, and Nokia now audits your strategic memos in 60 seconds.',
  },
  keywords: [
    // Core positioning
    'strategic memo audit',
    'decision intelligence platform',
    'cognitive bias detection AI',
    'decision knowledge graph',
    // Enterprise audiences
    'corporate strategy tool',
    'chief strategy officer software',
    'steering committee preparation',
    'board deck review',
    'market entry analysis',
    // Product capabilities
    'AI bias detection',
    'decision quality index',
    'strategic risk assessment',
    'cognitive audit software',
    'decision playbooks',
    'compliance mapping SOX FCA',
    'outcome tracking',
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

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

const jsonLd = [
  // ─── SoftwareApplication ────────────────────────────────────────────────
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Decision Intel',
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Decision Intelligence',
    operatingSystem: 'Web',
    url: siteUrl,
    description:
      'Decision intelligence platform for corporate strategy teams. Upload strategic memos, board decks, and market-entry recommendations; get a 60-second audit that scores 30+ cognitive biases, predicts steering-committee objections, and adds every decision to a living Decision Knowledge Graph that compounds quarter after quarter.',
    featureList: [
      '30+ cognitive biases detected automatically',
      'Steering-committee question prediction (CEO, board, parent company)',
      'Decision Knowledge Graph — compounds across every memo',
      'Decision Quality Index (DQI) — score every memo, benchmark across 135 historical decisions',
      'Toxic combination detection (compound bias patterns)',
      'Compliance mapping: SOX, FCA, EU AI Act, Basel III, GDPR, SEC, LPOA',
      'Audit Defense Packet PDF export with regulatory citations',
      'Passive outcome inference from documents, Slack, and web intelligence',
      'Calibrated risk scoring that improves with every confirmed outcome',
      'Boardroom Simulation — rehearse objections before the real meeting',
    ],
    offers: [
      {
        '@type': 'Offer',
        name: 'Free',
        price: '0',
        priceCurrency: 'USD',
        description:
          'Free — 4 memo audits per month. See what we flag on any strategic document.',
      },
      {
        '@type': 'Offer',
        name: 'Individual',
        price: '249',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '249',
          priceCurrency: 'USD',
          billingDuration: 'P1M',
        },
        description:
          'For the high-stakes strategist. 15 audits/month, 30+ bias types, forgotten-question prediction, and your Personal Decision History.',
      },
      {
        '@type': 'Offer',
        name: 'Strategy',
        price: '2499',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '2499',
          priceCurrency: 'USD',
          billingDuration: 'P1M',
        },
        description:
          'For corporate strategy teams. Unlimited audits, team Decision Knowledge Graph, Decision Rooms, Slack + Drive integrations, compliance mapping, and team calibration.',
      },
      {
        '@type': 'Offer',
        name: 'Enterprise',
        priceCurrency: 'USD',
        description:
          'For Fortune 500 strategy functions. Multi-division deployment, SSO, custom taxonomy, dedicated support, SLA. Contact sales.',
      },
    ],
    screenshot: `${siteUrl}/opengraph-image`,
  },

  // ─── Organization (Google Knowledge Panel) ──────────────────────────────
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Decision Intel',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description:
      'Decision Intel is a decision intelligence platform for corporate strategy teams. Audit strategic memos and board decks for 30+ cognitive biases, predict steering-committee questions, and compound every decision into a living Decision Knowledge Graph.',
    foundingDate: '2024',
    sameAs: ['https://www.linkedin.com/company/decision-intel'],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      url: `${siteUrl}/pricing`,
    },
  },

  // ─── FAQPage (Google FAQ Rich Results) ──────────────────────────────────
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How is sensitive data protected?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'All documents are encrypted with AES-256-GCM at rest and TLS 1.3 in transit. A GDPR anonymization layer removes PII before any AI processing. Your data never leaves our SOC 2 certified infrastructure.',
        },
      },
      {
        '@type': 'Question',
        name: 'How long does integration take?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Less than 30 minutes. Upload documents directly, connect via OAuth for Slack, or use our REST API for bulk processing.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does outcome tracking work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Outcomes are detected automatically from follow-up documents, Slack messages, and web intelligence. You confirm with one click. Each reported outcome makes your future analyses more accurate.',
        },
      },
      {
        '@type': 'Question',
        name: 'How is Decision Intel different from ChatGPT?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'ChatGPT gives one opinion from one model. Decision Intel uses 3 independent judges for noise measurement, a bias interaction matrix for compound scoring, 30+ cognitive biases benchmarked across 135 historical decisions, and an outcome flywheel that gets smarter with every confirmed decision.',
        },
      },
    ],
  },

  // ─── WebSite (Google Sitelinks Search Box) ──────────────────────────────
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Decision Intel',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/case-studies?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-page">
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      {children}
    </div>
  );
}
