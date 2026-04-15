import type { Metadata } from 'next';
import { PricingPageClient } from './PricingPageClient';

export const metadata: Metadata = {
  title: 'Pricing | Decision Intel',
  description:
    'Pricing that matches the stakes of your decisions. Start free, upgrade to Individual for $249/mo, or bring your corporate strategy team on Strategy for $2,499/mo.',
  openGraph: {
    title: 'Decision Intel | Pricing',
    description:
      'Start free. Upgrade to Individual ($249/mo) or Strategy ($2,499/mo) when the stakes go up.',
    url: '/pricing',
  },
};

export default function PricingPage() {
  return <PricingPageClient />;
}
