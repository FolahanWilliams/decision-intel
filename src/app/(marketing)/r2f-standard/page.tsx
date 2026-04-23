import type { Metadata } from 'next';
import { Suspense } from 'react';
import { R2FStandardClient } from './R2FStandardClient';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

export const metadata: Metadata = {
  title: 'The Recognition-Rigor Framework · A voluntary standard · Decision Intel',
  description:
    'R²F — the Recognition-Rigor Framework. The operationalised synthesis of Kahneman’s debiasing and Klein’s Recognition-Primed Decision tradition, published as a voluntary standard any strategy product can self-assess against.',
  alternates: { canonical: `${siteUrl}/r2f-standard` },
  openGraph: {
    title: 'The Recognition-Rigor Framework · R²F',
    description:
      'A voluntary, first-party standard for human-AI strategic reasoning. Kahneman rigor + Klein recognition, arbitrated into one artifact.',
    url: `${siteUrl}/r2f-standard`,
  },
};

export default function R2FStandardPage() {
  return (
    <Suspense fallback={null}>
      <R2FStandardClient />
    </Suspense>
  );
}
