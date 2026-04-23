import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DecisionProvenanceClient } from './DecisionProvenanceClient';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

export const metadata: Metadata = {
  title: 'Decision Provenance Record · Decision Intel',
  description:
    'The signed, hashed evidence record AI-augmented decision-making is already supposed to produce. Download a 4-page specimen — no login, no gate.',
  alternates: { canonical: `${siteUrl}/decision-provenance` },
  openGraph: {
    title: 'Decision Provenance Record',
    description:
      'The signed, hashed evidence record AI-augmented decision-making is already supposed to produce. Download a 4-page specimen.',
    url: `${siteUrl}/decision-provenance`,
  },
};

export default function DecisionProvenancePage() {
  return (
    <Suspense fallback={null}>
      <DecisionProvenanceClient />
    </Suspense>
  );
}
