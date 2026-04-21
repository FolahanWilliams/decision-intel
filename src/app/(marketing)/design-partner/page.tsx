import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DesignPartnerClient } from './DesignPartnerClient';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

export const metadata: Metadata = {
  title: 'Design Partner Program · Decision Intel',
  description:
    'Five seats. Twelve months. Fortune 500 corporate strategy teams shaping the Recognition-Rigor Framework alongside us. $1,999/mo — 20% off list, locked for Year 1.',
  alternates: { canonical: `${siteUrl}/design-partner` },
  openGraph: {
    title: 'Design Partner Program · Decision Intel',
    description:
      'Five seats at $1,999/mo (20% off list) for Fortune 500 corporate strategy teams who want to shape the native system of record for strategic reasoning.',
    url: `${siteUrl}/design-partner`,
  },
  // Design partners arrive via warm intros, not organic search. Keep the
  // page out of the discovery index — it is intentionally a warm-intro
  // landing surface.
  robots: { index: false, follow: true },
};

export default function DesignPartnerPage() {
  return (
    <Suspense fallback={null}>
      <DesignPartnerClient />
    </Suspense>
  );
}
