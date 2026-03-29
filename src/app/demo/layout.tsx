import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Watch Demo — Decision Intel Cognitive Bias Auditing',
  description:
    'Watch a walkthrough of Decision Intel auditing real strategic documents for cognitive bias, or try the interactive demo with real-world case studies. No login required.',
  openGraph: {
    title: 'Decision Intel — Watch the Demo',
    description:
      'See cognitive bias auditing in action on real strategic documents. Interactive demo included.',
    url: '/demo',
  },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
