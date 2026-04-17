import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, AlertTriangle, CheckCircle, BookOpen, Shield } from 'lucide-react';
import {
  ALL_CASES,
  getCaseBySlug,
  getSlugForCase,
  getAllCaseSlugs,
  isFailureOutcome,
  isSuccessOutcome,
  type CaseStudy,
} from '@/lib/data/case-studies';
import { computeReferenceClass } from '@/lib/data/reference-class-forecasting';
import { CaseStudyNav, BRAND_COLORS as C } from '../CaseStudyNav';
import { CaseStudyCta } from './CaseStudyCta';
import { CaseStudyGraphSection } from './CaseStudyGraphSection';
import { BiasProfileRadarWrapper as BiasProfileRadar } from '@/components/visualizations/BiasProfileRadarWrapper';
import { formatIndustry, formatDocumentType, formatBiasName, humanize } from '@/lib/utils/labels';
import { PatternFamilyBadge } from '@/components/marketing/case-study/PatternFamilyBadge';
import { DqiEstimateCard } from '@/components/marketing/case-study/DqiEstimateCard';
import { KeyQuotesStrip } from '@/components/marketing/case-study/KeyQuotesStrip';
import { TimelineSection } from '@/components/marketing/case-study/TimelineSection';
import { StakeholderGrid } from '@/components/marketing/case-study/StakeholderGrid';
import { CounterfactualCallout } from '@/components/marketing/case-study/CounterfactualCallout';
import { PostMortemCitationsList } from '@/components/marketing/case-study/PostMortemCitationsList';
import { RelatedCasesStrip } from '@/components/marketing/case-study/RelatedCasesStrip';

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllCaseSlugs().map(slug => ({ slug }));
}

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const caseStudy = getCaseBySlug(slug);
  if (!caseStudy) {
    return { title: 'Case Study Not Found | Decision Intel' };
  }

  const outcomeLabel = outcomeTitle(caseStudy.outcome);
  const title = `${caseStudy.company} (${caseStudy.year}): ${caseStudy.title} | Decision Intel Case Study`;
  const description = `${outcomeLabel} — ${caseStudy.summary}`.slice(0, 180);

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/case-studies/${slug}` },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/case-studies/${slug}`,
      type: 'article',
      images: [
        {
          url: `${siteUrl}/api/og-case-study/${slug}`,
          width: 1200,
          height: 630,
          alt: `${caseStudy.company} — ${caseStudy.title}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${siteUrl}/api/og-case-study/${slug}`],
    },
  };
}

function outcomeTitle(outcome: CaseStudy['outcome']): string {
  switch (outcome) {
    case 'catastrophic_failure':
      return 'Catastrophic failure';
    case 'failure':
      return 'Failure';
    case 'partial_failure':
      return 'Partial failure';
    case 'partial_success':
      return 'Partial success';
    case 'success':
      return 'Success';
    case 'exceptional_success':
      return 'Exceptional success';
  }
}

function outcomeColor(outcome: CaseStudy['outcome']): { bg: string; fg: string } {
  if (isFailureOutcome(outcome)) return { bg: '#FEE2E2', fg: '#991B1B' };
  if (isSuccessOutcome(outcome)) return { bg: '#DCFCE7', fg: '#166534' };
  return { bg: '#FEF3C7', fg: '#92400E' };
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: 'clamp(20px, 3vw, 24px)',
        fontWeight: 700,
        color: C.navy,
        marginBottom: 16,
        letterSpacing: '-0.01em',
      }}
    >
      {children}
    </h2>
  );
}

const OUTCOME_DQI: Record<string, number> = {
  catastrophic_failure: 22,
  failure: 38,
  partial_failure: 52,
  partial_success: 67,
  success: 79,
  exceptional_success: 88,
};

function computeSimulatedDQI(outcome: string, biasCount: number, toxicCount: number) {
  const base = OUTCOME_DQI[outcome] ?? 50;
  const biasMod = Math.max(-8, (4 - biasCount) * 2);
  const toxicMod = Math.max(-6, -toxicCount * 3);
  return Math.max(12, Math.min(96, base + biasMod + toxicMod));
}

function dqiGrade(score: number): { grade: string; color: string; label: string } {
  if (score >= 85) return { grade: 'A', color: '#22c55e', label: 'Excellent' };
  if (score >= 70) return { grade: 'B', color: '#84cc16', label: 'Good' };
  if (score >= 55) return { grade: 'C', color: '#eab308', label: 'Fair' };
  if (score >= 40) return { grade: 'D', color: '#f97316', label: 'Poor' };
  return { grade: 'F', color: '#ef4444', label: 'Critical' };
}

function guessSeverity(bias: string, isPrimary: boolean): string {
  if (isPrimary) return 'critical';
  if (
    [
      'overconfidence_bias',
      'groupthink',
      'confirmation_bias',
      'sunk_cost_fallacy',
      'anchoring_bias',
      'authority_bias',
    ].includes(bias)
  )
    return 'high';
  if (['framing_effect', 'loss_aversion', 'bandwagon_effect'].includes(bias)) return 'medium';
  return 'medium';
}

const SEV_META: Record<string, { bar: string; bg: string; text: string; fill: number }> = {
  critical: { bar: '#DC2626', bg: '#FEE2E2', text: '#991B1B', fill: 88 },
  high: { bar: '#F97316', bg: '#FFF7ED', text: '#C2410C', fill: 62 },
  medium: { bar: '#EAB308', bg: '#FEF3C7', text: '#A16207', fill: 38 },
};

const TOXIC_DESCRIPTIONS: Record<string, string> = {
  'Echo Chamber':
    "Group members reinforce each other's views, systematically filtering out dissenting signals.",
  'Sunk Ship':
    'Commitment to a failing course escalates to justify sunk costs, even as evidence mounts.',
  'Blind Sprint':
    'Overconfidence combined with planning fallacy creates unstoppable momentum toward failure.',
  'Yes Committee':
    'Authority bias meets groupthink — the group converges on whatever leadership signals it wants.',
  'Optimism Trap':
    'Overconfidence and availability bias create a systematically positive outlook that ignores base rates.',
  'Status Quo Lock':
    'Loss aversion combined with status quo bias makes even clearly beneficial change feel impossible.',
  'Doubling Down':
    'Confirmation bias reinforces sunk cost thinking into an escalating commitment loop.',
  'Golden Child':
    'A favored initiative receives uncritical support, with scrutiny reserved for alternatives.',
};

function Card({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: `1px solid #E2E8F0`,
        borderLeft: accent ? `4px solid ${accent}` : '1px solid #E2E8F0',
        borderRadius: 16,
        padding: 24,
      }}
    >
      {children}
    </div>
  );
}

export default async function CaseStudyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const caseStudy = getCaseBySlug(slug);
  if (!caseStudy) {
    return notFound();
  }

  const outcome = outcomeColor(caseStudy.outcome);
  const outcomeLabel = outcomeTitle(caseStudy.outcome);
  const deep = caseStudy.preDecisionEvidence;

  // Blend sector → Deal.sector if it maps. Our reference-class helper
  // takes Deal.sector strings; case studies use a wider industry taxonomy
  // so for the snapshot we just pass null and get the global base rate.
  const referenceClass = computeReferenceClass({});

  const related = ALL_CASES.filter(
    c => c.industry === caseStudy.industry && c.id !== caseStudy.id
  ).slice(0, 3);

  const dqiScore = computeSimulatedDQI(
    caseStudy.outcome,
    caseStudy.biasesPresent.length,
    caseStudy.toxicCombinations.length
  );
  const dqi = dqiGrade(dqiScore);

  const simulatedBiases = caseStudy.biasesPresent.map(bias => ({
    id: bias,
    biasType: bias,
    severity: guessSeverity(bias, bias === caseStudy.primaryBias),
    excerpt: '',
    explanation: '',
    suggestion: '',
    confidence: bias === caseStudy.primaryBias ? 0.95 : 0.75,
  }));

  const caseStudyJsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: `${caseStudy.company} (${caseStudy.year}): ${caseStudy.title}`,
      description: caseStudy.summary,
      author: { '@type': 'Organization', name: 'Decision Intel' },
      publisher: {
        '@type': 'Organization',
        name: 'Decision Intel',
        logo: { '@type': 'ImageObject', url: `${siteUrl}/logo.png` },
      },
      datePublished: `${caseStudy.year}-01-01`,
      image: `${siteUrl}/api/og-case-study/${slug}`,
      mainEntityOfPage: `${siteUrl}/case-studies/${slug}`,
      about: caseStudy.biasesPresent.map(b => ({
        '@type': 'Thing',
        name: formatBiasName(b),
      })),
      keywords: [
        caseStudy.company,
        formatIndustry(caseStudy.industry),
        ...caseStudy.biasesPresent.map(formatBiasName),
        ...(caseStudy.toxicCombinations || []),
        'cognitive bias',
        'decision analysis',
      ].join(', '),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Decision Intel',
          item: siteUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Case Studies',
          item: `${siteUrl}/case-studies`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: `${caseStudy.company} (${caseStudy.year})`,
          item: `${siteUrl}/case-studies/${slug}`,
        },
      ],
    },
  ];

  return (
    <div style={{ background: '#F8FAFC', color: C.slate900, minHeight: '100vh' }}>
      <CaseStudyNav />
      {caseStudyJsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <article
        style={{
          maxWidth: 880,
          margin: '0 auto',
          padding: '48px 24px 96px',
        }}
      >
        <Link
          href="/case-studies"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: '#475569',
            textDecoration: 'none',
            marginBottom: 24,
          }}
        >
          <ArrowLeft size={14} />
          All case studies
        </Link>

        {/* Header */}
        <header style={{ marginBottom: 40 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                background: outcome.bg,
                color: outcome.fg,
                padding: '4px 10px',
                borderRadius: 999,
              }}
            >
              {outcomeLabel}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                background: '#F1F5F9',
                color: '#475569',
                padding: '4px 10px',
                borderRadius: 999,
              }}
            >
              {formatIndustry(caseStudy.industry)}
            </span>
            <span style={{ fontSize: 13, color: '#64748B' }}>{caseStudy.year}</span>
            {caseStudy.patternFamily && <PatternFamilyBadge family={caseStudy.patternFamily} />}
          </div>

          <h1
            style={{
              fontSize: 'clamp(28px, 5vw, 40px)',
              fontWeight: 800,
              color: C.navy,
              lineHeight: 1.15,
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            {caseStudy.company}
          </h1>
          <p
            style={{
              fontSize: 'clamp(16px, 3vw, 20px)',
              color: '#334155',
              marginTop: 8,
              fontWeight: 500,
              lineHeight: 1.4,
            }}
          >
            {caseStudy.title}
          </p>
          <p
            style={{
              fontSize: 14,
              color: '#64748B',
              marginTop: 16,
              fontStyle: 'italic',
            }}
          >
            Estimated impact: {caseStudy.estimatedImpact}
          </p>

          {/* DQI Score — prefer canonical (Tier 2) estimate, fallback to simulated */}
          <div style={{ marginTop: 24 }}>
            {caseStudy.dqiEstimate ? (
              <DqiEstimateCard dqi={caseStudy.dqiEstimate} />
            ) : (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 12,
                  background: '#0F172A',
                  borderRadius: 12,
                  padding: '12px 20px',
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    border: `3px solid ${dqi.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                  }}
                >
                  <span style={{ fontSize: 18, fontWeight: 800, color: dqi.color, lineHeight: 1 }}>
                    {dqi.grade}
                  </span>
                  <span style={{ fontSize: 9, color: '#94A3B8', lineHeight: 1 }}>{dqiScore}</span>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#16A34A',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Decision Quality Index (simulated)
                  </div>
                  <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 2 }}>
                    {dqi.label} &mdash; {caseStudy.biasesPresent.length} biases detected
                    {caseStudy.toxicCombinations.length > 0 &&
                      `, ${caseStudy.toxicCombinations.length} toxic combinations`}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tier 2: Live demo CTA — eligibility = has preDecisionEvidence + dqiEstimate */}
          {caseStudy.dqiEstimate && deep && (
            <Link
              href={`/demo/${slug}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                marginTop: 16,
                padding: '12px 18px',
                background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                color: '#FFFFFF',
                borderRadius: 999,
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.01em',
                boxShadow: '0 4px 18px rgba(22, 163, 74, 0.28)',
              }}
            >
              See this case as a live audit
              <ArrowRight size={14} />
            </Link>
          )}
        </header>

        {/* Summary */}
        <section style={{ marginBottom: 40 }}>
          <p
            style={{
              fontSize: 18,
              color: '#1E293B',
              lineHeight: 1.6,
              fontWeight: 500,
              margin: 0,
            }}
          >
            {caseStudy.summary}
          </p>
        </section>

        {/* Decision context */}
        <section style={{ marginBottom: 40 }}>
          <SectionTitle>Decision context</SectionTitle>
          <p style={{ fontSize: 15, color: '#334155', lineHeight: 1.7, margin: 0 }}>
            {caseStudy.decisionContext}
          </p>
        </section>

        {/* Context factors — decision anatomy */}
        <section style={{ marginBottom: 40 }}>
          <SectionTitle>Decision anatomy</SectionTitle>
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 16,
              padding: '20px 24px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16,
            }}
          >
            {(
              [
                {
                  label: 'Monetary stakes',
                  value:
                    caseStudy.contextFactors.monetaryStakes === 'very_high'
                      ? 'Very high'
                      : caseStudy.contextFactors.monetaryStakes === 'high'
                        ? 'High'
                        : caseStudy.contextFactors.monetaryStakes === 'medium'
                          ? 'Medium'
                          : 'Low',
                  risk:
                    caseStudy.contextFactors.monetaryStakes === 'very_high' ||
                    caseStudy.contextFactors.monetaryStakes === 'high',
                },
                {
                  label: 'Dissent suppressed',
                  value: caseStudy.contextFactors.dissentAbsent ? 'Yes' : 'No',
                  risk: caseStudy.contextFactors.dissentAbsent,
                },
                {
                  label: 'Time pressure',
                  value: caseStudy.contextFactors.timePressure ? 'Present' : 'None',
                  risk: caseStudy.contextFactors.timePressure,
                },
                {
                  label: 'Unanimous consensus',
                  value: caseStudy.contextFactors.unanimousConsensus ? 'Yes' : 'No',
                  risk: caseStudy.contextFactors.unanimousConsensus,
                },
                {
                  label: 'Decision participants',
                  value: String(caseStudy.contextFactors.participantCount),
                  risk: caseStudy.contextFactors.participantCount <= 2,
                },
                {
                  label: 'Dissent encouraged',
                  value: caseStudy.contextFactors.dissentEncouraged ? 'Yes' : 'No',
                  risk: !caseStudy.contextFactors.dissentEncouraged,
                },
                {
                  label: 'External advisors',
                  value: caseStudy.contextFactors.externalAdvisors ? 'Yes' : 'No',
                  risk: !caseStudy.contextFactors.externalAdvisors,
                },
                {
                  label: 'Iterative process',
                  value: caseStudy.contextFactors.iterativeProcess ? 'Yes' : 'No',
                  risk: !caseStudy.contextFactors.iterativeProcess,
                },
              ] as Array<{ label: string; value: string; risk: boolean }>
            ).map(({ label, value, risk }) => (
              <div key={label}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#94A3B8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 4,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: risk ? '#DC2626' : '#16A34A',
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 10, margin: '10px 0 0' }}>
            Red = risk factor present · Green = protective factor present
          </p>
        </section>

        {/* Deep section — hindsight-stripped memo analysis */}
        {deep ? (
          <section style={{ marginBottom: 40 }}>
            {/* Platform Analysis banner */}
            <div
              style={{
                background: '#0F172A',
                borderRadius: '12px 12px 0 0',
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Shield size={16} style={{ color: '#16A34A' }} />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#16A34A',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                  }}
                >
                  Decision Intel Platform Analysis
                </span>
              </div>
              <span style={{ fontSize: 11, color: '#64748B' }}>
                Source: {formatDocumentType(deep.documentType)} · {deep.date}
              </span>
            </div>
            <div
              style={{
                border: '1px solid #1E293B',
                borderTop: 'none',
                borderRadius: '0 0 12px 12px',
                padding: '24px 20px',
                background: '#FFFFFF',
                marginBottom: 20,
              }}
            >
              <p
                style={{
                  fontSize: 14,
                  color: '#475569',
                  marginBottom: 20,
                  lineHeight: 1.6,
                  margin: '0 0 20px',
                }}
              >
                The analysis below was produced from the pre-decision document only &mdash; no
                hindsight. This is what the platform would have surfaced if it had been running{' '}
                {caseStudy.year > 2000 ? `in ${deep.date}` : `at the time`}.
              </p>

              <div style={{ display: 'grid', gap: 20 }}>
                <Card accent={C.navy}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: '#64748B',
                      marginBottom: 8,
                    }}
                  >
                    {formatDocumentType(deep.documentType)} &middot; {deep.date}
                  </div>
                  <blockquote
                    style={{
                      fontSize: 15,
                      color: '#1E293B',
                      lineHeight: 1.65,
                      margin: 0,
                      paddingLeft: 16,
                      borderLeft: `3px solid ${C.slate200}`,
                      fontStyle: 'italic',
                    }}
                  >
                    &ldquo;{deep.document}&rdquo;
                  </blockquote>
                  <p
                    style={{
                      marginTop: 12,
                      fontSize: 12,
                      color: '#64748B',
                    }}
                  >
                    Source: {deep.source}
                  </p>
                </Card>

                {deep.detectableRedFlags.length > 0 && (
                  <Card accent="#DC2626">
                    <h3
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#991B1B',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <AlertTriangle size={14} /> Red flags detectable at decision time
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: '#334155' }}>
                      {deep.detectableRedFlags.map((flag, i) => (
                        <li key={i} style={{ marginBottom: 8, lineHeight: 1.6 }}>
                          {flag}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {deep.flaggableBiases.length > 0 && (
                  <Card accent="#7C3AED">
                    <h3
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#5B21B6',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Shield size={14} /> Cognitive biases the platform would have flagged
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {deep.flaggableBiases.map((bias, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            background: '#EDE9FE',
                            color: '#5B21B6',
                            padding: '6px 12px',
                            borderRadius: 999,
                          }}
                        >
                          {formatBiasName(bias)}
                        </span>
                      ))}
                    </div>
                  </Card>
                )}

                <Card accent={C.green}>
                  <h3
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#15803D',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: 12,
                    }}
                  >
                    Hypothetical analysis
                  </h3>
                  <p style={{ fontSize: 15, color: '#334155', lineHeight: 1.7, margin: 0 }}>
                    {deep.hypotheticalAnalysis}
                  </p>
                </Card>
              </div>
            </div>
          </section>
        ) : (
          <section style={{ marginBottom: 40 }}>
            <div
              style={{
                background: '#FEF3C7',
                border: '1px solid #FCD34D',
                borderRadius: 16,
                padding: 16,
                fontSize: 13,
                color: '#92400E',
                lineHeight: 1.6,
              }}
            >
              <strong>Deep hindsight-stripped analysis coming soon.</strong> This case is part of
              our ongoing backfill to reconstruct what the platform would have flagged at decision
              time. The summary and bias profile below are drawn from primary sources.
            </div>
          </section>
        )}

        {/* Tier 2: Timeline — "what was visible, and when" */}
        {caseStudy.timeline && caseStudy.timeline.length > 0 && (
          <TimelineSection timeline={caseStudy.timeline} />
        )}

        {/* Tier 2: Key quotes — primary-source voices */}
        {caseStudy.keyQuotes && caseStudy.keyQuotes.length > 0 && (
          <KeyQuotesStrip quotes={caseStudy.keyQuotes} />
        )}

        {/* Tier 2: Stakeholders — who advocated, dissented, stayed silent */}
        {caseStudy.stakeholders && caseStudy.stakeholders.length > 0 && (
          <StakeholderGrid stakeholders={caseStudy.stakeholders} />
        )}

        {/* Biases present — severity bar chart */}
        {caseStudy.biasesPresent.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <SectionTitle>Biases present in the decision</SectionTitle>
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 16,
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              {caseStudy.biasesPresent.map(bias => {
                const sev = guessSeverity(bias, bias === caseStudy.primaryBias);
                const m = SEV_META[sev] || SEV_META.medium;
                return (
                  <div key={bias} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 160,
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      {bias === caseStudy.primaryBias && (
                        <span style={{ color: '#DC2626', fontSize: 11, flexShrink: 0 }}>★</span>
                      )}
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: bias === caseStudy.primaryBias ? 700 : 500,
                          color: '#1E293B',
                          lineHeight: 1.3,
                        }}
                      >
                        {formatBiasName(bias)}
                      </span>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        background: '#F1F5F9',
                        borderRadius: 4,
                        height: 8,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${m.fill}%`,
                          height: '100%',
                          background: m.bar,
                          borderRadius: 4,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: m.text,
                        background: m.bg,
                        padding: '3px 9px',
                        borderRadius: 999,
                        flexShrink: 0,
                        minWidth: 58,
                        textAlign: 'center',
                      }}
                    >
                      {sev}
                    </span>
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 10, margin: '10px 0 0' }}>
              ★ Primary driver · Severity estimated from bias type and decision outcome
            </p>
          </section>
        )}

        {/* Analysis Dashboard: 3D Graph + Bias Radar */}
        {caseStudy.biasesPresent.length >= 2 && (
          <section style={{ marginBottom: 40 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
              <CaseStudyGraphSection
                biases={caseStudy.biasesPresent}
                primaryBias={caseStudy.primaryBias}
                toxicCombinations={caseStudy.toxicCombinations}
                company={caseStudy.company}
              />
              {simulatedBiases.length >= 3 && (
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: 16,
                    overflow: 'hidden',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                  }}
                >
                  <div
                    style={{
                      padding: '14px 16px 12px',
                      borderBottom: '1px solid #E2E8F0',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                        color: '#7C3AED',
                        marginBottom: 3,
                      }}
                    >
                      Bias Intensity Profile
                    </div>
                    <div style={{ fontSize: 14, color: '#64748B' }}>
                      Severity × confidence across {simulatedBiases.length} detected biases
                    </div>
                  </div>
                  <div style={{ height: 360, padding: '8px 0' }}>
                    <BiasProfileRadar biases={simulatedBiases} />
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Toxic combinations — pattern cards */}
        {caseStudy.toxicCombinations.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <SectionTitle>Toxic combinations</SectionTitle>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 12,
              }}
            >
              {caseStudy.toxicCombinations.map((combo, i) => (
                <div
                  key={i}
                  style={{
                    background: '#FFF7ED',
                    border: '1px solid #FED7AA',
                    borderLeft: '4px solid #EA580C',
                    borderRadius: 12,
                    padding: '14px 16px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#C2410C',
                      marginBottom: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: '#EA580C',
                        color: '#FFFFFF',
                        fontSize: 10,
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      !
                    </span>
                    {combo}
                  </div>
                  <div style={{ fontSize: 13, color: '#7C2D12', lineHeight: 1.55 }}>
                    {TOXIC_DESCRIPTIONS[combo] ||
                      'Compound cognitive failure pattern identified in this decision.'}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tier 2: Counterfactual — what a bias-adjusted process would have done */}
        {caseStudy.counterfactual && <CounterfactualCallout cf={caseStudy.counterfactual} />}

        {/* Reference class */}
        <section style={{ marginBottom: 40 }}>
          <SectionTitle>Reference class base rates</SectionTitle>
          <Card>
            <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px' }}>
              Across all {referenceClass.n} curated case studies in our library:
            </p>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 20 }}>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{ fontSize: 'clamp(24px, 4vw, 28px)', fontWeight: 800, color: '#DC2626' }}
                >
                  {(referenceClass.failureRate * 100).toFixed(0)}%
                </div>
                <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase' }}>
                  base failure rate
                </div>
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 'clamp(24px, 4vw, 28px)',
                    fontWeight: 800,
                    color: '#F59E0B',
                  }}
                >
                  {((1 - referenceClass.failureRate - referenceClass.successRate) * 100).toFixed(0)}
                  %
                </div>
                <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase' }}>
                  partial / mixed
                </div>
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{ fontSize: 'clamp(24px, 4vw, 28px)', fontWeight: 800, color: C.green }}
                >
                  {(referenceClass.successRate * 100).toFixed(0)}%
                </div>
                <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase' }}>
                  base success rate
                </div>
              </div>
            </div>
            {/* Stacked bar */}
            <div
              style={{
                display: 'flex',
                height: 10,
                borderRadius: 8,
                overflow: 'hidden',
                gap: 2,
              }}
            >
              <div
                style={{
                  flex: referenceClass.failureRate,
                  background: '#DC2626',
                  borderRadius: '8px 0 0 8px',
                }}
              />
              <div
                style={{
                  flex: 1 - referenceClass.failureRate - referenceClass.successRate,
                  background: '#F59E0B',
                }}
              />
              <div
                style={{
                  flex: referenceClass.successRate,
                  background: '#16A34A',
                  borderRadius: '0 8px 8px 0',
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                gap: 16,
                marginTop: 8,
                fontSize: 11,
                color: '#94A3B8',
                flexWrap: 'wrap',
              }}
            >
              <span>
                <span style={{ color: '#DC2626' }}>■</span> Failure
              </span>
              <span>
                <span style={{ color: '#F59E0B' }}>■</span> Partial
              </span>
              <span>
                <span style={{ color: '#16A34A' }}>■</span> Success
              </span>
            </div>
          </Card>
        </section>

        {/* Lessons learned */}
        {caseStudy.lessonsLearned.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <SectionTitle>Lessons learned</SectionTitle>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 15, color: '#334155' }}>
              {caseStudy.lessonsLearned.map((lesson, i) => (
                <li key={i} style={{ marginBottom: 10, lineHeight: 1.7 }}>
                  {lesson}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Tier 2: Post-mortem citations — primary-source discipline marker */}
        {caseStudy.postMortemCitations && caseStudy.postMortemCitations.length > 0 && (
          <PostMortemCitationsList citations={caseStudy.postMortemCitations} />
        )}

        {/* Source */}
        <section style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
            Source: {caseStudy.source} ({humanize(caseStudy.sourceType)})
          </p>
        </section>

        {/* CTA */}
        <section style={{ marginBottom: 40 }}>
          <CaseStudyCta slug={slug} company={caseStudy.company} hasDeepAnalysis={!!deep} />
        </section>

        {/* Related — prefer explicit cross-links (Tier 2), fallback to industry */}
        {caseStudy.relatedCases && caseStudy.relatedCases.length > 0 ? (
          <RelatedCasesStrip ids={caseStudy.relatedCases} />
        ) : related.length > 0 ? (
          <section>
            <SectionTitle>Related cases in {formatIndustry(caseStudy.industry)}</SectionTitle>
            <div style={{ display: 'grid', gap: 12 }}>
              {related.map(r => {
                const rOutcome = outcomeColor(r.outcome);
                const rSlug = getSlugForCase(r);
                return (
                  <Link
                    key={r.id}
                    href={`/case-studies/${rSlug}`}
                    style={{
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <Card>
                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          alignItems: 'center',
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background: rOutcome.bg,
                            color: rOutcome.fg,
                            padding: '3px 8px',
                            borderRadius: 999,
                          }}
                        >
                          {outcomeTitle(r.outcome)}
                        </span>
                        {isFailureOutcome(r.outcome) ? (
                          <AlertTriangle size={12} color="#DC2626" />
                        ) : isSuccessOutcome(r.outcome) ? (
                          <CheckCircle size={12} color={C.green} />
                        ) : (
                          <BookOpen size={12} color="#F59E0B" />
                        )}
                        <span style={{ fontSize: 12, color: '#64748B' }}>{r.year}</span>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>
                        {r.company}
                      </div>
                      <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{r.title}</div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}
      </article>
    </div>
  );
}
