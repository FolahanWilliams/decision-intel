import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AiVerifyMappingClient } from './AiVerifyMappingClient';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

export const metadata: Metadata = {
  title: 'AI Verify Principle Mapping · Decision Intel',
  description:
    "Every Decision Provenance Record maps to the 11 internationally-recognised AI governance principles codified by AI Verify — Singapore IMDA's governance framework, aligned with EU and OECD. The reference implementation Fortune 500 procurement teams can hand to their GC.",
  alternates: { canonical: `${siteUrl}/regulatory/ai-verify` },
  openGraph: {
    title: 'AI Verify Principle Mapping · Decision Intel',
    description:
      'Decision Intel aligned with the 11 internationally-recognised AI governance principles codified by AI Verify (Singapore IMDA).',
    url: `${siteUrl}/regulatory/ai-verify`,
  },
};

export default function AiVerifyMappingPage() {
  return (
    <Suspense fallback={null}>
      <AiVerifyMappingClient />
    </Suspense>
  );
}
