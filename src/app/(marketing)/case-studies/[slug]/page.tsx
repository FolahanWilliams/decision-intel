import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, CheckCircle, BookOpen, Shield } from 'lucide-react';
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
import { formatIndustry, formatDocumentType, formatBiasName, humanize } from '@/lib/utils/labels';

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
        fontSize: 24,
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

function Card({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: `1px solid #E2E8F0`,
        borderLeft: accent ? `4px solid ${accent}` : '1px solid #E2E8F0',
        borderRadius: 12,
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
    notFound();
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

  return (
    <div style={{ background: '#F8FAFC', color: C.slate900, minHeight: '100vh' }}>
      <CaseStudyNav />

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
          </div>

          <h1
            style={{
              fontSize: 40,
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
              fontSize: 20,
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

        {/* Deep section — hindsight-stripped memo analysis */}
        {deep ? (
          <section style={{ marginBottom: 40 }}>
            <SectionTitle>What we would have flagged at decision time</SectionTitle>
            <p style={{ fontSize: 14, color: '#475569', marginBottom: 20, lineHeight: 1.6 }}>
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
          </section>
        ) : (
          <section style={{ marginBottom: 40 }}>
            <div
              style={{
                background: '#FEF3C7',
                border: '1px solid #FCD34D',
                borderRadius: 12,
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

        {/* Biases present */}
        {caseStudy.biasesPresent.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <SectionTitle>Biases present in the decision</SectionTitle>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {caseStudy.biasesPresent.map((bias, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    background: '#F1F5F9',
                    color: '#334155',
                    border: '1px solid #E2E8F0',
                    padding: '6px 12px',
                    borderRadius: 8,
                  }}
                >
                  {bias === caseStudy.primaryBias ? '★ ' : ''}
                  {formatBiasName(bias)}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Toxic combinations */}
        {caseStudy.toxicCombinations.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <SectionTitle>Toxic combinations</SectionTitle>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: '#334155' }}>
              {caseStudy.toxicCombinations.map((combo, i) => (
                <li key={i} style={{ marginBottom: 6, lineHeight: 1.6 }}>
                  {combo}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Reference class */}
        <section style={{ marginBottom: 40 }}>
          <SectionTitle>Reference class base rates</SectionTitle>
          <Card>
            <p style={{ fontSize: 13, color: '#64748B', margin: 0, marginBottom: 8 }}>
              Across all {referenceClass.n} curated case studies in our library:
            </p>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#DC2626' }}>
                  {(referenceClass.failureRate * 100).toFixed(0)}%
                </div>
                <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase' }}>
                  base failure rate
                </div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: C.green }}>
                  {(referenceClass.successRate * 100).toFixed(0)}%
                </div>
                <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase' }}>
                  base success rate
                </div>
              </div>
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

        {/* Related */}
        {related.length > 0 && (
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
        )}
      </article>
    </div>
  );
}
