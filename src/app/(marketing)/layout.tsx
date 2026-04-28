import type { Metadata } from 'next';
import { SOC2_JSON_LD_DATA_PROTECTION } from '@/lib/constants/trust-copy';

export const metadata: Metadata = {
  title: 'Decision Intel · The native reasoning layer for every high-stakes call',
  description:
    'Decision Intel audits every board memo, simulates steering-committee objections, runs what-if interventions, and compounds your team’s judgment into a living Decision Knowledge Graph, so decision quality, scalability, and reliability improve quarter after quarter.',
  openGraph: {
    title: 'Decision Intel · The native reasoning layer for every high-stakes call',
    description:
      'Governance on the reasoning layer, not just the data. Audit every strategic memo, simulate the boardroom, run what-if interventions, and compound your team’s judgment quarter after quarter.',
    url: '/',
    siteName: 'Decision Intel',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Decision Intel · The native reasoning layer for every high-stakes call',
    description:
      'Audit the reasoning behind every strategic memo. Simulate the boardroom. Run what-if interventions. Compound your team’s judgment quarter after quarter.',
  },
  keywords: [
    // Category-creator positioning
    'reasoning layer',
    'decision provenance record',
    'recognition-rigor framework',
    'strategic decision auditing',
    'decision quality platform',
    // Product identity
    'decision knowledge graph',
    'strategic memo audit',
    'ai boardroom simulation',
    'counterfactual decision analysis',
    'decision quality index',
    'cognitive bias detection AI',
    // Enterprise audiences
    'corporate strategy platform',
    'chief strategy officer software',
    'steering committee preparation',
    'board deck review',
    'market entry analysis',
    // Compliance + trust
    'strategic decision governance',
    'compliance mapping SOX FCA',
    'EU AI Act decision tool',
    // Research-backed
    'Kahneman decision noise',
    'Tetlock forecasting',
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
    applicationSubCategory: 'Strategic Decision Governance',
    operatingSystem: 'Web',
    url: siteUrl,
    description:
      'The native reasoning layer for every high-stakes call. Decision Intel audits every strategic memo, simulates the questions the room will ask, runs what-if interventions, and compounds your team’s judgment into a living Decision Knowledge Graph so decision quality, scalability, and reliability improve quarter after quarter.',
    featureList: [
      'Decision Knowledge Graph: every strategic call, compounded in one living system',
      'AI boardroom simulation: CEO, CFO, and board objections rehearsed before the meeting',
      'Human-AI reasoning audit: every recommendation traceable to the evidence that triggered it',
      'What-if interventions: see how removing a bias changes outcome probability',
      'Decision Quality Index (DQI): benchmarked against a 135-case public reference library',
      '30+ cognitive biases detected automatically, with severity scoring and evidence excerpts',
      'Compliance mapping: SOX, FCA, EU AI Act, Basel III, GDPR, SEC, LPOA',
      'Board-ready PDF export with regulatory citations',
      'Closed-loop outcome tracking: every confirmed outcome recalibrates the signal',
      'Integrations: Slack, Google Drive, email, Stripe billing',
    ],
    offers: [
      {
        '@type': 'Offer',
        name: 'Free',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free: 4 memo audits per month. See what we flag on any strategic document.',
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
      'Decision Intel is the native reasoning layer for every high-stakes call. Chief Strategy Officers, corporate development teams, and fund partners use Decision Intel to audit every strategic memo, simulate the questions the room will ask, run what-if interventions, and compound their team’s judgment into a living Decision Knowledge Graph.',
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
          text: SOC2_JSON_LD_DATA_PROTECTION,
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
        name: 'How is Decision Intel different from ChatGPT or a general AI assistant?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'ChatGPT gives one opinion from one model: ungoverned, untraceable, unaudited. Decision Intel is the native reasoning layer underneath every high-stakes call. It measures the noise in your reasoning the same way Kahneman did in the insurance underwriter study, simulates an AI boardroom of CEO, CFO, and board personas, runs what-if interventions against a 135-case public reference library, and compounds every confirmed outcome back into a calibrated Decision Quality Index your audit committee can defend. Not a chatbot; a reasoning layer, checkable from memo to outcome.',
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
