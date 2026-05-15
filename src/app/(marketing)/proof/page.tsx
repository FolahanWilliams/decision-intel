import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getDeepCases } from '@/lib/data/case-studies';
import { BIAS_EDUCATION } from '@/lib/constants/bias-education';
import { ProofPageClient } from './ProofPageClient';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';
const deepCount = getDeepCases().length;
// Derived — "30+ bias" deprecated per CR-3 (2026-05-13).
const BIAS_COUNT = Object.keys(BIAS_EDUCATION).length;

export const metadata: Metadata = {
  title: `Proof — ${deepCount} documents we would have flagged, before the outcome was known | Decision Intel`,
  description: `Real memos, SEC filings, and earnings calls from before Enron collapsed, before Boeing grounded the 737 MAX, before FTX unwound. Run through the same bias detection methodology we apply to your next strategic memo.`,
  alternates: { canonical: `${siteUrl}/proof` },
  openGraph: {
    title: `Proof — ${deepCount} decisions, flagged at the time, not in hindsight`,
    description: `The Decision Intel bias taxonomy applied to the actual pre-decision documents — no hindsight used. Click any case to see the memo and what we would have caught.`,
    url: `${siteUrl}/proof`,
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${deepCount} decisions, flagged at the time, not in hindsight`,
    description: `Real memos from before the outcome was known — run through the same ${BIAS_COUNT}-bias detector we use on live strategic memos.`,
  },
};

export default function ProofPage() {
  return (
    <Suspense fallback={null}>
      <ProofPageClient />
    </Suspense>
  );
}
