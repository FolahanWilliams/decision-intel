import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Decision Intel — Grammarly for Strategic Decisions | AI Bias & Noise Detection',
  description:
    "Decision Intel is the AI-powered decision hygiene platform that detects cognitive bias, measures decision noise, and calibrates your team's judgment — like Grammarly for strategic decisions. Used by M&A teams, corporate strategy, investment committees, and boards.",
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

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

const jsonLd = [
  // ─── SoftwareApplication ────────────────────────────────────────────────
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Decision Intel',
    alternateName: 'Grammarly for Strategic Decisions',
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Decision Intelligence',
    operatingSystem: 'Web',
    url: siteUrl,
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
        description:
          'Free — 3 decision analyses per month. Try the bias engine on any strategic document.',
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
        description:
          'For decision-makers running strategic documents through the bias engine. 50 analyses/month, 20+ bias types, outcome tracking.',
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
        description:
          'For decision committees with pipeline + Slack integration. 250 analyses/month, Decision Rooms, compliance mapping, team calibration.',
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
      'Decision Intel is the AI-powered cognitive bias detection platform for PE/VC and M&A teams. Audit strategic documents for hidden biases, measure decision noise, and track outcomes.',
    foundingDate: '2024',
    sameAs: [
      'https://www.linkedin.com/company/decision-intel',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      url: `${siteUrl}/#pricing`,
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
          text: 'ChatGPT gives one opinion from one model. Decision Intel uses 3 independent judges for noise measurement, a 20×20 bias interaction matrix for compound scoring, 31 domain-specific biases, and an outcome flywheel that gets smarter with every decision.',
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
