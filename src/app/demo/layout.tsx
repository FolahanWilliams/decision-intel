import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Audit a Strategic Memo, Closed or Upcoming | Decision Intel Demo',
  description:
    "Run Decision Intel over a deal you've already closed (or your next memo) and see what the committee missed: cognitive biases scored with evidence, steering-committee objections predicted, the decision mapped into the Knowledge Graph. No signup.",
  openGraph: {
    title: "Decision Intel | Run it on a deal you've already closed",
    description:
      "Run it on a deal you've already closed and see what the audit catches against the known outcome. Biases scored, board objections predicted, in 60 seconds.",
    url: '/demo',
  },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
