import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ALL_CASES, getCaseBySlug, getSlugForCase } from '@/lib/data/case-studies';
import { MarketingNav, BRAND_COLORS as C } from '@/components/marketing/MarketingNav';
import { formatBiasName } from '@/lib/utils/labels';

import { DemoPageHeader } from '@/components/marketing/demo/DemoPageHeader';
import { DemoDocumentExcerpt } from '@/components/marketing/demo/DemoDocumentExcerpt';
import { DemoRedFlagsAlert } from '@/components/marketing/demo/DemoRedFlagsAlert';
import { DemoPredictedQuestions } from '@/components/marketing/demo/DemoPredictedQuestions';
import { DemoCta } from '@/components/marketing/demo/DemoCta';
import { DqiEstimateCard } from '@/components/marketing/case-study/DqiEstimateCard';
import { TimelineSection } from '@/components/marketing/case-study/TimelineSection';
import { StakeholderGrid } from '@/components/marketing/case-study/StakeholderGrid';
import { CounterfactualCallout } from '@/components/marketing/case-study/CounterfactualCallout';
import { RelatedCasesStrip } from '@/components/marketing/case-study/RelatedCasesStrip';

export const dynamicParams = false;

/** A case qualifies for the live demo surface when it carries full
 *  canonical depth — both the hindsight-stripped document (preDecisionEvidence)
 *  and a DQI estimate. These are the "Tier 2" cases. */
function demoEligibleCases() {
  return ALL_CASES.filter(c => c.preDecisionEvidence != null && c.dqiEstimate != null);
}

export function generateStaticParams() {
  return demoEligibleCases().map(c => ({ slug: getSlugForCase(c) }));
}

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const caseStudy = getCaseBySlug(slug);
  if (!caseStudy || !caseStudy.preDecisionEvidence || !caseStudy.dqiEstimate) {
    return { title: 'Demo Not Found | Decision Intel' };
  }

  const title = `Live demo: Decision Intel on ${caseStudy.company} (${caseStudy.year}) | Decision Intel`;
  const description = `See exactly what Decision Intel would have flagged in ${caseStudy.company}'s ${caseStudy.year} pre-decision document: DQI grade ${caseStudy.dqiEstimate.grade}, ${caseStudy.preDecisionEvidence.detectableRedFlags.length} red flags, simulated CEO questions, counterfactual recommendation. No hindsight.`;

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/demo/${slug}` },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/demo/${slug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function DemoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const caseStudy = getCaseBySlug(slug);
  if (!caseStudy) return notFound();

  const deep = caseStudy.preDecisionEvidence;
  const dqi = caseStudy.dqiEstimate;

  // Guard: only Tier 2 cases qualify. Non-eligible → back to case study.
  if (!deep || !dqi) return notFound();

  const demoJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `Decision Intel · Live Demo (${caseStudy.company})`,
    description: `Interactive demo of the Decision Intel platform using ${caseStudy.company}'s ${caseStudy.year} pre-decision document as input.`,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: `${siteUrl}/demo/${slug}`,
  };

  return (
    <div style={{ background: '#F8FAFC', color: C.slate900, minHeight: '100vh' }}>
      <MarketingNav />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(demoJsonLd) }}
      />

      <DemoPageHeader caseStudy={caseStudy} caseSlug={slug} />

      <main
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px 64px',
        }}
      >
        {/* Hero: prominent DQI card */}
        <section style={{ marginBottom: 32 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#16A34A',
              marginBottom: 10,
            }}
          >
            Top-line result
          </div>
          <DqiEstimateCard dqi={dqi} />
        </section>

        {/* The uploaded document excerpt */}
        <DemoDocumentExcerpt document={deep.document} source={deep.source} date={deep.date} />

        {/* Red flags — the platform's primary output */}
        <DemoRedFlagsAlert flags={deep.detectableRedFlags} />

        {/* Flagged biases — severity chips */}
        {caseStudy.biasesPresent.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#16A34A',
                marginBottom: 8,
              }}
            >
              Cognitive biases detected
            </div>
            <h2
              style={{
                fontSize: 'clamp(20px, 3vw, 24px)',
                fontWeight: 700,
                color: '#0F172A',
                margin: 0,
                marginBottom: 14,
                letterSpacing: '-0.01em',
              }}
            >
              {caseStudy.biasesPresent.length} bias
              {caseStudy.biasesPresent.length === 1 ? '' : 'es'} across the document
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {caseStudy.biasesPresent.map(b => {
                const isPrimary = b === caseStudy.primaryBias;
                return (
                  <span
                    key={b}
                    style={{
                      fontSize: 13,
                      fontWeight: isPrimary ? 700 : 500,
                      background: isPrimary ? '#0F172A' : '#F1F5F9',
                      color: isPrimary ? '#16A34A' : '#334155',
                      border: `1px solid ${isPrimary ? '#16A34A' : '#E2E8F0'}`,
                      padding: '6px 12px',
                      borderRadius: 999,
                    }}
                  >
                    {isPrimary ? '★ ' : ''}
                    {formatBiasName(b)}
                  </span>
                );
              })}
            </div>
          </section>
        )}

        {/* Predicted CEO/board questions */}
        <DemoPredictedQuestions caseStudy={caseStudy} />

        {/* Counterfactual recommendation */}
        {caseStudy.counterfactual && <CounterfactualCallout cf={caseStudy.counterfactual} />}

        {/* Evidence timeline */}
        {caseStudy.timeline && caseStudy.timeline.length > 0 && (
          <TimelineSection timeline={caseStudy.timeline} />
        )}

        {/* Stakeholders */}
        {caseStudy.stakeholders && caseStudy.stakeholders.length > 0 && (
          <StakeholderGrid stakeholders={caseStudy.stakeholders} />
        )}

        {/* Cross-linked cases with the same pattern */}
        {caseStudy.relatedCases && caseStudy.relatedCases.length > 0 && (
          <RelatedCasesStrip ids={caseStudy.relatedCases} />
        )}

        {/* CTA */}
        <DemoCta company={caseStudy.company} />
      </main>
    </div>
  );
}
