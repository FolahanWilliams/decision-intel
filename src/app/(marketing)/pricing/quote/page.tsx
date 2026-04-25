import type { Metadata } from 'next';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ENTERPRISE_QUOTE_DEFAULTS } from '@/lib/stripe';
import { EnterpriseQuoteBuilderClient } from '@/components/billing/EnterpriseQuoteBuilderClient';
import { MarketingNav } from '@/components/marketing/MarketingNav';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

export const metadata: Metadata = {
  title: 'Enterprise quote builder · Decision Intel',
  description:
    'Build a procurement-grade Enterprise quote PDF for Decision Intel — seats, deal overage, retention SLA, volume floor, signature-ready cover page. No login required.',
  alternates: { canonical: `${siteUrl}/pricing/quote` },
  openGraph: {
    title: 'Enterprise quote builder · Decision Intel',
    description:
      'Build a procurement-grade Enterprise quote PDF for Decision Intel. No login required.',
    url: `${siteUrl}/pricing/quote`,
    type: 'website',
  },
  // Procurement teams are the audience; not relevant to public search.
  robots: { index: false, follow: true },
};

export default function PublicEnterpriseQuotePage() {
  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <MarketingNav />
      <ErrorBoundary sectionName="Enterprise Quote Builder (public)">
        <EnterpriseQuoteBuilderClient
          defaults={ENTERPRISE_QUOTE_DEFAULTS}
          apiEndpoint="/api/billing/enterprise-quote-public"
          backHref="/pricing"
          backLabel="Back to pricing"
        />
      </ErrorBoundary>
    </div>
  );
}
