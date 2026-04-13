import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Audit a Strategic Memo in 60 Seconds | Decision Intel Demo',
  description:
    'Try the interactive demo. Pick a famous corporate decision (Kodak, Blockbuster, Nokia) and watch Decision Intel score cognitive biases, predict steering-committee objections, and map the decision into the Knowledge Graph.',
  openGraph: {
    title: 'Decision Intel | Interactive Demo',
    description:
      'Audit a strategic memo in 60 seconds. Score cognitive biases, predict board objections, and see the Knowledge Graph come to life.',
    url: '/demo',
  },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
