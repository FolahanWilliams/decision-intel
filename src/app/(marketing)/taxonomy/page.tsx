import type { Metadata } from 'next';
import { CaseStudyNav } from '../case-studies/CaseStudyNav';
import { TaxonomyClient } from './TaxonomyClient';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

export const metadata: Metadata = {
  title: 'Cognitive Bias Taxonomy · Decision Intel',
  description:
    'Twenty cognitive biases with stable, permanent IDs (DI-B-001 through DI-B-020). Each bias includes a named historical failure, debiasing techniques, and a primary academic citation. Cite these IDs in research, audits, and regulatory filings.',
  alternates: { canonical: `${siteUrl}/taxonomy` },
  openGraph: {
    title: 'Cognitive Bias Taxonomy · Decision Intel',
    description:
      'Twenty biases. Twenty research anchors. Stable IDs, named failures, academic citations — the full Decision Intel taxonomy.',
    url: `${siteUrl}/taxonomy`,
  },
};

export default function TaxonomyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <CaseStudyNav />
      <TaxonomyClient />
    </div>
  );
}
