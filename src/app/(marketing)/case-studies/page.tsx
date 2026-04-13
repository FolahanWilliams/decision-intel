import type { Metadata } from 'next';
import { ALL_CASES, getSlugForCase, type CaseStudy } from '@/lib/data/case-studies';
import { CaseStudyNav, BRAND_COLORS as C } from './CaseStudyNav';
import { CaseStudyGrid } from './CaseStudyGrid';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

export const metadata: Metadata = {
  title: `${ALL_CASES.length} real decisions we would have flagged | Decision Intel`,
  description: `A public library of ${ALL_CASES.length} curated case studies — failures and successes — analyzed with the same bias and noise framework we run on live strategic decisions. Search by company, industry, or outcome.`,
  alternates: { canonical: `${siteUrl}/case-studies` },
  openGraph: {
    title: `${ALL_CASES.length} real decisions we would have flagged`,
    description: `Curated case studies from SEC filings, NTSB reports, and post-mortems. Failure and success decisions analyzed with the same bias framework we run on live strategic decisions.`,
    url: `${siteUrl}/case-studies`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${ALL_CASES.length} real decisions we would have flagged`,
    description: `A public library of curated case studies analyzed with the same bias framework we run on live strategic decisions.`,
  },
};

function lessonPreview(c: CaseStudy): string {
  const first = c.lessonsLearned[0];
  if (!first) return '';
  return first.length > 140 ? `${first.slice(0, 137)}…` : first;
}

export default function CaseStudyIndexPage() {
  const cases = ALL_CASES.map(c => ({
    slug: getSlugForCase(c),
    company: c.company,
    title: c.title,
    year: c.year,
    industry: c.industry,
    outcome: c.outcome,
    primaryBias: c.primaryBias,
    lessonPreview: lessonPreview(c),
    hasDeepAnalysis: !!c.preDecisionEvidence,
  }));

  const industries = Array.from(new Set(ALL_CASES.map(c => c.industry))).sort();
  const deepCount = cases.filter(c => c.hasDeepAnalysis).length;

  return (
    <div style={{ background: '#F8FAFC', color: C.slate900, minHeight: '100vh' }}>
      <CaseStudyNav />

      {/* Hero */}
      <section
        style={{
          background: C.navy,
          color: C.white,
          padding: '64px 24px 72px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-block',
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: C.green,
              marginBottom: 16,
            }}
          >
            Case Study Library
          </div>
          <h1
            style={{
              fontSize: 'clamp(28px, 5vw, 48px)',
              fontWeight: 800,
              lineHeight: 1.1,
              margin: 0,
              marginBottom: 20,
              letterSpacing: '-0.02em',
            }}
          >
            {ALL_CASES.length} real decisions.
            <br />
            Here&apos;s what we would have flagged
            <br />
            before the outcome was known.
          </h1>
          <p
            style={{
              fontSize: 'clamp(14px, 2.5vw, 18px)',
              color: '#CBD5E1',
              lineHeight: 1.6,
              maxWidth: 680,
              margin: 0,
            }}
          >
            Curated from SEC filings, NTSB reports, FDA actions, and post-mortems. Every case runs
            through the same bias and noise framework we apply to live strategic memos. {deepCount}{' '}
            include the full hindsight-stripped memo analysis. Search by company, industry, or
            outcome.
          </p>

          <div style={{ display: 'flex', gap: 24, marginTop: 32, flexWrap: 'wrap' }}>
            <Stat value={String(ALL_CASES.length)} label="curated cases" />
            <Stat value={String(deepCount)} label="deep analyses" />
            <Stat value={String(industries.length)} label="industries" />
          </div>
        </div>
      </section>

      <main
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '40px 24px 96px',
        }}
      >
        <CaseStudyGrid cases={cases} industries={industries} />
      </main>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontSize: 'clamp(24px, 4vw, 32px)',
          fontWeight: 800,
          color: C.white,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#94A3B8',
          marginTop: 6,
        }}
      >
        {label}
      </div>
    </div>
  );
}
