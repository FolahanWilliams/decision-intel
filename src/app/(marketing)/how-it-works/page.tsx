import type { Metadata } from 'next';
import { Suspense } from 'react';
import { HowItWorksClient } from './HowItWorksClient';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

// Metadata kept neutral 2026-04-26 — banned-vocabulary discipline
// (CLAUDE.md "Marketing Voice"): "12-node pipeline" / "twelve specialized
// agents" must NOT leak into search snippets, OG cards, or Twitter
// previews. The rendered body of /how-it-works can still name the
// pipeline; metadata is a marketing surface.
export const metadata: Metadata = {
  title: 'How It Works · Decision Intel',
  description:
    'How the Decision Intel analysis engine works — cognitive bias detection, decision noise measurement, the Decision Quality Index methodology, and the academic foundation in Kahneman, Klein, and Tetlock.',
  alternates: { canonical: `${siteUrl}/how-it-works` },
  openGraph: {
    title: 'How It Works · Inside the Decision Intel reasoning audit',
    description:
      'Cognitive bias detection, decision noise measurement, the DQI methodology, and the academic foundation in Kahneman, Klein, and Tetlock.',
    url: `${siteUrl}/how-it-works`,
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Inside the Decision Intel reasoning audit',
    description:
      'The bias taxonomy, the DQI methodology, and the academic foundation — publicly documented.',
  },
};

export default function HowItWorksPage() {
  return (
    <Suspense fallback={null}>
      <HowItWorksClient />
    </Suspense>
  );
}
