import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Interactive Demo — See Cognitive Bias Auditing in Action',
  description:
    'Explore a live cognitive bias audit of real-world decisions. See how Decision Intel detects biases, logical fallacies, and decision noise in case studies like the Microsoft-Nokia acquisition.',
  openGraph: {
    title: 'Decision Intel — Interactive Demo',
    description:
      'Explore a live cognitive bias audit. See biases, logical fallacies, and decision noise detected in real-world case studies.',
    url: '/demo',
  },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
