import type { Metadata } from 'next';
import { Suspense } from 'react';
import { HowItWorksClient } from './HowItWorksClient';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

export const metadata: Metadata = {
  title: 'How It Works — The 12-node pipeline behind every Decision Intel audit',
  description:
    'A general-but-detailed look inside the Decision Intel analysis engine: twelve specialized agents, thirty cognitive biases, a ten-pattern interaction model, and the Decision Quality Index methodology. Grounded in Kahneman, Klein, and Tetlock.',
  alternates: { canonical: `${siteUrl}/how-it-works` },
  openGraph: {
    title: 'How It Works — Inside the Decision Intel engine',
    description:
      'Twelve specialized agents. Thirty cognitive biases. A ten-pattern interaction model. Under sixty seconds.',
    url: `${siteUrl}/how-it-works`,
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Inside the Decision Intel engine',
    description:
      'The 12-node pipeline, the DQI formula, and the academic foundation — publicly documented.',
  },
};

export default function HowItWorksPage() {
  return (
    <Suspense fallback={null}>
      <HowItWorksClient />
    </Suspense>
  );
}
