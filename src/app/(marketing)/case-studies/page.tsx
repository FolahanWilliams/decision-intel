import type { Metadata } from 'next';
import { ALL_CASES, getSlugForCase, type CaseStudy } from '@/lib/data/case-studies';
import { CaseStudyNav, BRAND_COLORS as C } from './CaseStudyNav';
import { CaseStudyGrid } from './CaseStudyGrid';
import { IndustryDistributionChart } from './IndustryDistributionChart';
import { FeaturedDeepCases } from './FeaturedDeepCases';

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
    biasCount: c.biasesPresent.length,
    toxicCount: c.toxicCombinations.length,
    impactScore: c.impactScore,
    estimatedImpact: c.estimatedImpact,
  }));

  const industries = Array.from(new Set(ALL_CASES.map(c => c.industry))).sort();
  const deepCount = cases.filter(c => c.hasDeepAnalysis).length;

  // Tier 2 cases = carries keyQuotes (canonical depth marker).
  const tier2Cases = ALL_CASES.filter(c => (c.keyQuotes?.length ?? 0) > 0);

  // Year span for the hero — earliest to latest case.
  const years = ALL_CASES.map(c => c.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  // Industry distribution counts.
  const industryCounts = Object.entries(
    ALL_CASES.reduce<Record<string, number>>((acc, c) => {
      acc[c.industry] = (acc[c.industry] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([industry, count]) => ({ industry, count }));

  return (
    <div style={{ background: '#F8FAFC', color: C.slate900, minHeight: '100vh' }}>
      <CaseStudyNav />

      {/* Hero */}
      <section
        style={{
          background: `linear-gradient(180deg, ${C.navy} 0%, #1E293B 100%)`,
          color: C.white,
          padding: '72px 24px 64px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          className="case-studies-hero-grid"
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            alignItems: 'start',
          }}
        >
          {/* Copy + stats */}
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: C.green,
                marginBottom: 16,
              }}
            >
              Case Study Library · {minYear}–{maxYear}
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
              through the same bias and noise framework we apply to live strategic memos.{' '}
              {deepCount} carry hindsight-stripped pre-decision evidence; {tier2Cases.length} are at
              full canonical depth with timelines, named stakeholders, and counterfactuals.
            </p>

            <div style={{ display: 'flex', gap: 28, marginTop: 32, flexWrap: 'wrap' }}>
              <Stat value={String(ALL_CASES.length)} label="curated cases" />
              <Stat value={String(deepCount)} label="Tier 1+ analyses" />
              <Stat value={String(tier2Cases.length)} label="Tier 2 canonical" />
              <Stat value={String(industries.length)} label="industries" />
            </div>
          </div>

          {/* Industry distribution band */}
          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
              padding: '20px 22px',
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: C.green,
                marginBottom: 16,
              }}
            >
              Industry distribution
            </div>
            <IndustryDistributionChart counts={industryCounts} surface="dark" />
          </div>
        </div>
      </section>

      <main
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '48px 24px 96px',
        }}
      >
        {tier2Cases.length > 0 && <FeaturedDeepCases cases={tier2Cases} />}
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
