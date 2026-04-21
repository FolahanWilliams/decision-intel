import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SimulateCeoClient } from './SimulateCeoClient';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

export const metadata: Metadata = {
  title: 'Simulate my CEO · Decision Intel',
  description:
    'Paste a strategic memo + a one-line CEO profile. Get back the three questions the CEO is most likely to ask. Free, no login. Uses the same primed-persona engine as the full Decision Intel pipeline.',
  alternates: { canonical: `${siteUrl}/simulate-ceo` },
  openGraph: {
    title: 'Simulate my CEO · Decision Intel',
    description:
      'Paste a memo + a one-line CEO profile — get the three questions the CEO is most likely to ask. Free, no login.',
    url: `${siteUrl}/simulate-ceo`,
  },
};

export default function SimulateCeoPage() {
  return (
    <Suspense fallback={null}>
      <SimulateCeoClient />
    </Suspense>
  );
}
