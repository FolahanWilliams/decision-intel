import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { RelatedDecisions } from '@/components/ui/RelatedDecisions';
import { RootCauseSection } from '@/components/ui/RootCauseSection';
import { ScoreReveal } from '@/components/ui/ScoreReveal';
import { SectionMiniNav } from '@/components/ui/SectionMiniNav';
import { ErrorBoundary } from '@/components/ErrorBoundary';

/**
 * Cognitive Audit detail page.
 *
 * The URL `/dashboard/cognitive-audits/{id}` carries a HumanDecision.id —
 * not an Analysis.id. Every consumer site (decision-log, submit page,
 * meetings, audits page, nudges, knowledge graph) constructs the URL with
 * the HumanDecision.id; the page queries HumanDecision + CognitiveAudit
 * to match.
 *
 * The pre-2026-05-01 version of this page (incorrectly) queried
 * `prisma.analysis.findUnique` and 404-ed every cognitive-audit
 * navigation. Fixed 2026-05-01: the schema for cognitive audits is
 * `HumanDecision { ..., cognitiveAudit: CognitiveAudit?, linkedAnalysisId? }`
 * — CognitiveAudit holds the audit output (DQI, noise, biases as JSON),
 * linkedAnalysisId points at an Analysis row only when the decision was
 * also processed through the document-analysis pipeline. The Related /
 * RootCause sections require an Analysis context, so they only render
 * when linkedAnalysisId is non-null.
 */

const DETAIL_SECTIONS = [
  { id: 'section-scores', label: 'Scores' },
  { id: 'section-summary', label: 'Summary' },
  { id: 'section-biases', label: 'Biases' },
  { id: 'section-graph', label: 'Graph' },
  { id: 'section-root-cause', label: 'Root Cause' },
  { id: 'section-related', label: 'Related' },
];

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

interface BiasFinding {
  biasType?: string;
  type?: string;
  severity?: string;
  excerpt?: string;
  explanation?: string;
  reasoning?: string;
  suggestion?: string;
  mitigation?: string;
  confidence?: number;
}

async function getDecision(id: string, userId: string) {
  try {
    const decision = await prisma.humanDecision.findUnique({
      where: { id },
      include: {
        cognitiveAudit: true,
      },
    });

    if (!decision) return null;

    // Authorization: user must own the decision OR be in the same org.
    if (decision.userId !== userId) {
      if (!decision.orgId) return null;
      const membership = await prisma.teamMember.findFirst({
        where: { userId, orgId: decision.orgId },
      });
      if (!membership) return null;
    }

    return decision;
  } catch (error) {
    console.error('Error fetching cognitive audit:', error);
    return null;
  }
}

function getBiasFindings(audit: { biasFindings: unknown }): BiasFinding[] {
  if (!audit.biasFindings) return [];
  if (Array.isArray(audit.biasFindings)) return audit.biasFindings as BiasFinding[];
  return [];
}

const SEVERITY_PILL_STYLES: Record<string, { background: string; color: string }> = {
  critical: { background: 'rgba(239,68,68,0.15)', color: 'var(--error)' },
  high: { background: 'rgba(234,88,12,0.15)', color: 'var(--severity-high)' },
  medium: { background: 'rgba(217,119,6,0.15)', color: 'var(--warning)' },
  low: { background: 'rgba(22,163,74,0.15)', color: 'var(--success)' },
};

function severityPillStyle(severity: string | undefined): { background: string; color: string } {
  if (!severity) return SEVERITY_PILL_STYLES.medium;
  return SEVERITY_PILL_STYLES[severity] ?? SEVERITY_PILL_STYLES.medium;
}

const SOURCE_LABEL: Record<string, string> = {
  manual: 'Manual submission',
  meeting_transcript: 'Meeting transcript',
  meeting_recording: 'Meeting recording',
  slack: 'Slack thread',
  email: 'Email',
  jira: 'Jira ticket',
  journal: 'Journal entry',
};

export default async function CognitiveAuditDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const decision = await getDecision(id, user.id);

  if (!decision) {
    notFound();
  }

  const audit = decision.cognitiveAudit;
  const biasFindings = audit ? getBiasFindings(audit) : [];
  const sourceLabel = SOURCE_LABEL[decision.source] ?? decision.source;
  const isPending = !audit && decision.status !== 'error';
  const isErrored = !audit && decision.status === 'error';

  return (
    <ErrorBoundary sectionName="Cognitive Audit Detail">
      <SectionMiniNav sections={DETAIL_SECTIONS} />
      <div className="container mx-auto px-4 py-8" style={{ maxWidth: 900 }}>
        <div style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontSize: 'clamp(24px, 4vw, 30px)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 8,
            }}
          >
            Cognitive Audit Detail
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {sourceLabel}
            {decision.channel ? ` · ${decision.channel}` : ''} · logged{' '}
            {decision.createdAt.toISOString().slice(0, 10)}
          </p>
        </div>

        {/* Pending or errored states render before scores so the user sees status, not stale zeros. */}
        {isPending && (
          <div
            style={{
              padding: 24,
              borderRadius: 'var(--radius-xl)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderLeft: '3px solid var(--info)',
              marginBottom: 32,
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 8,
              }}
            >
              Audit running &middot; results land here when the analyzer completes
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
              The cognitive audit pipeline runs bias detection, noise scoring, sentiment
              analysis, compliance check, pre-mortem, logical analysis, and SWOT in parallel.
              Refresh the page in 30-60 seconds. Status:{' '}
              <code style={{ fontFamily: 'ui-monospace, monospace' }}>{decision.status}</code>.
            </p>
          </div>
        )}

        {isErrored && (
          <div
            style={{
              padding: 24,
              borderRadius: 'var(--radius-xl)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderLeft: '3px solid var(--error)',
              marginBottom: 32,
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: 'var(--error)',
                marginBottom: 8,
              }}
            >
              Audit failed
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
              The cognitive audit pipeline returned an error and the result was not stored.
              Re-submit the decision from{' '}
              <Link
                href="/dashboard/cognitive-audits/submit"
                style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}
              >
                /dashboard/cognitive-audits/submit
              </Link>{' '}
              or check the founder admin audit log for the error trace.
            </p>
          </div>
        )}

        {audit && (
          <>
            {/* Overall Scores */}
            <section id="section-scores">
              <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                style={{ marginBottom: 32 }}
              >
                <div
                  style={{
                    padding: 24,
                    borderRadius: 'var(--radius-xl)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <ScoreReveal
                    score={audit.decisionQualityScore}
                    label="Decision Quality (DQI)"
                    showGrade
                  />
                </div>

                <div
                  style={{
                    padding: 24,
                    borderRadius: 'var(--radius-xl)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <ScoreReveal score={audit.noiseScore} label="Noise Score" duration={1200} />
                  {audit.noiseStats && typeof audit.noiseStats === 'object' && (
                    <p
                      style={{
                        marginTop: 8,
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        fontFamily: 'ui-monospace, monospace',
                      }}
                    >
                      mean{' '}
                      {String((audit.noiseStats as Record<string, unknown>).mean ?? '—')} ·
                      stdDev{' '}
                      {String((audit.noiseStats as Record<string, unknown>).stdDev ?? '—')}
                    </p>
                  )}
                </div>

                <div
                  style={{
                    padding: 24,
                    borderRadius: 'var(--radius-xl)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <h3
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--text-muted)',
                      marginBottom: 8,
                    }}
                  >
                    Biases Detected
                  </h3>
                  <p
                    style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-primary)' }}
                  >
                    {biasFindings.length}
                  </p>
                  {audit.dissenterCount > 0 && (
                    <p
                      style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}
                    >
                      {audit.dissenterCount} dissenter
                      {audit.dissenterCount === 1 ? '' : 's'} flagged
                      {audit.teamConsensusFlag ? ' · false-consensus pattern' : ''}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Summary */}
            <section id="section-summary">
              <div
                style={{
                  padding: 24,
                  borderRadius: 'var(--radius-xl)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  marginBottom: 32,
                }}
              >
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: 16,
                  }}
                >
                  Summary
                </h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {audit.summary}
                </p>
              </div>
            </section>

            {/* Detected Biases */}
            <section id="section-biases">
              {biasFindings.length > 0 && (
                <div
                  style={{
                    padding: 24,
                    borderRadius: 'var(--radius-xl)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    marginBottom: 32,
                  }}
                >
                  <h2
                    style={{
                      fontSize: 20,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: 16,
                    }}
                  >
                    Detected Biases
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {biasFindings.map((bias, i) => {
                      const label = bias.biasType ?? bias.type ?? `Bias ${i + 1}`;
                      const severity = bias.severity?.toLowerCase();
                      const explanation = bias.explanation ?? bias.reasoning;
                      const mitigation = bias.suggestion ?? bias.mitigation;
                      const pill = severityPillStyle(severity);
                      return (
                        <div
                          key={i}
                          style={{
                            padding: 16,
                            borderRadius: 'var(--radius-lg)',
                            background: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              marginBottom: 8,
                              gap: 12,
                            }}
                          >
                            <h3 style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                              {label}
                            </h3>
                            {severity && (
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: 'var(--radius-sm)',
                                  fontSize: 12,
                                  fontWeight: 500,
                                  whiteSpace: 'nowrap',
                                  ...pill,
                                }}
                              >
                                {severity}
                              </span>
                            )}
                          </div>

                          {explanation && (
                            <p
                              style={{
                                color: 'var(--text-muted)',
                                fontSize: 14,
                                marginBottom: 8,
                                lineHeight: 1.55,
                              }}
                            >
                              {explanation}
                            </p>
                          )}

                          {bias.excerpt && (
                            <blockquote
                              style={{
                                paddingLeft: 16,
                                borderLeft: '2px solid var(--border-hover)',
                                color: 'var(--text-muted)',
                                fontSize: 14,
                                fontStyle: 'italic',
                                margin: 0,
                              }}
                            >
                              &ldquo;{bias.excerpt}&rdquo;
                            </blockquote>
                          )}

                          {mitigation && (
                            <div
                              style={{
                                marginTop: 12,
                                padding: 12,
                                background: 'rgba(2,132,199,0.08)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid rgba(2,132,199,0.2)',
                              }}
                            >
                              <p
                                style={{
                                  color: 'var(--info)',
                                  fontSize: 14,
                                  margin: 0,
                                  lineHeight: 1.55,
                                }}
                              >
                                <strong>Suggestion:</strong> {mitigation}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* Decision Graph link */}
            <section id="section-graph">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  marginTop: 0,
                  marginBottom: 32,
                }}
              >
                <Link
                  href={`/dashboard/decision-graph?highlight=${id}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: 14,
                    fontWeight: 500,
                    background: 'rgba(2,132,199,0.08)',
                    color: 'var(--info)',
                    border: '1px solid rgba(2,132,199,0.2)',
                    textDecoration: 'none',
                    transition: 'background 0.15s',
                  }}
                >
                  View in Decision Graph
                </Link>
                {decision.linkedAnalysisId && (
                  <Link
                    href={`/documents/${decision.linkedAnalysisId}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: 14,
                      fontWeight: 500,
                      background: 'rgba(22,163,74,0.08)',
                      color: 'var(--success)',
                      border: '1px solid rgba(22,163,74,0.2)',
                      textDecoration: 'none',
                    }}
                  >
                    View linked document analysis
                  </Link>
                )}
              </div>
            </section>

            {/* Root Cause + Related — only when linkedAnalysisId is non-null. */}
            {decision.linkedAnalysisId && (
              <>
                <section id="section-root-cause">
                  {decision.orgId && (
                    <RootCauseSection
                      analysisId={decision.linkedAnalysisId}
                      orgId={decision.orgId}
                    />
                  )}
                </section>
                <section id="section-related">
                  <RelatedDecisions analysisId={decision.linkedAnalysisId} />
                </section>
              </>
            )}
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}
