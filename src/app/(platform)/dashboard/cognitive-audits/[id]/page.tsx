import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, ExternalLink, FileText, Network, MessageSquare } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { RelatedDecisions } from '@/components/ui/RelatedDecisions';
import { RootCauseSection } from '@/components/ui/RootCauseSection';
import { SectionMiniNav } from '@/components/ui/SectionMiniNav';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GRADE_THRESHOLDS } from '@/lib/scoring/dqi';
import { getBiasDisplayName } from '@/lib/utils/bias-normalize';
import { SEVERITY_COLORS } from '@/lib/constants/human-audit';

/**
 * Cognitive Audit detail page.
 *
 * The URL `/dashboard/cognitive-audits/{id}` carries a HumanDecision.id
 * (not Analysis.id) — every consumer site (decision-log, submit page,
 * meetings, audits page, nudges, knowledge graph) constructs the URL
 * with the HumanDecision.id; the page queries HumanDecision +
 * CognitiveAudit to match.
 *
 * Visual rewrite 2026-05-01: the prior layout rendered raw bias keys
 * (`overconfidence_bias`) with bare card-on-card formatting. Now uses
 * `getBiasDisplayName` for proper Title Case bias names + canonical
 * SEVERITY_COLORS for severity pills + `GRADE_THRESHOLDS` for the DQI
 * grade label and color + a polished card hierarchy that mirrors the
 * /documents/[id] page.
 *
 * Note: this page renders the SHORT-FORM cognitive-audit pipeline
 * (HumanDecision + CognitiveAudit) which is the right shape for
 * Slack threads, email forwards, meeting transcripts, and journal
 * conversions. For long-form strategic memos uploaded as Documents,
 * the rich /documents/[id] page is canonical (boardroom simulation,
 * reference class forecast, counterfactual impact, full DPR PDF).
 * The InlinePasteMemoCard on /dashboard now routes manual pastes to
 * the Document pipeline, not here.
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
  params: Promise<{ id: string }>;
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
      include: { cognitiveAudit: true },
    });
    if (!decision) return null;
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

const SOURCE_LABEL: Record<string, string> = {
  manual: 'Manual submission',
  meeting_transcript: 'Meeting transcript',
  meeting_recording: 'Meeting recording',
  slack: 'Slack thread',
  email: 'Email forward',
  jira: 'Jira ticket',
  journal: 'Journal entry',
};

const SEVERITY_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

function gradeFor(score: number) {
  return (
    GRADE_THRESHOLDS.find(g => score >= g.min) ??
    GRADE_THRESHOLDS[GRADE_THRESHOLDS.length - 1]
  );
}

function colorMix(varOrHex: string, alpha: string): string {
  return `color-mix(in srgb, ${varOrHex} ${alpha}, transparent)`;
}

function severityColor(severity: string | undefined): string {
  if (!severity) return 'var(--text-muted)';
  return SEVERITY_COLORS[severity] ?? 'var(--text-muted)';
}

export default async function CognitiveAuditDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const decision = await getDecision(id, user.id);
  if (!decision) notFound();

  const audit = decision.cognitiveAudit;
  const biasFindingsRaw = audit ? getBiasFindings(audit) : [];
  const biasFindings = [...biasFindingsRaw].sort((a, b) => {
    const aRank = SEVERITY_RANK[a.severity?.toLowerCase() ?? 'low'] ?? 4;
    const bRank = SEVERITY_RANK[b.severity?.toLowerCase() ?? 'low'] ?? 4;
    return aRank - bRank;
  });
  const sourceLabel = SOURCE_LABEL[decision.source] ?? decision.source;
  const isPending = !audit && decision.status !== 'error';
  const isErrored = !audit && decision.status === 'error';

  const grade = audit ? gradeFor(audit.decisionQualityScore) : null;
  const noiseStats =
    audit?.noiseStats && typeof audit.noiseStats === 'object'
      ? (audit.noiseStats as Record<string, unknown>)
      : null;
  const noiseMean = typeof noiseStats?.mean === 'number' ? noiseStats.mean : null;
  const noiseStdDev =
    typeof noiseStats?.stdDev === 'number' ? noiseStats.stdDev : null;

  return (
    <ErrorBoundary sectionName="Cognitive Audit Detail">
      <SectionMiniNav sections={DETAIL_SECTIONS} />
      <div
        style={{
          maxWidth: 920,
          margin: '0 auto',
          padding: '32px 24px 48px',
        }}
      >
        {/* Hero — source badge, title, logged-at timestamp */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--accent-primary)',
              background: 'rgba(22,163,74,0.08)',
              border: '1px solid rgba(22,163,74,0.22)',
              borderRadius: 999,
              marginBottom: 12,
            }}
          >
            <MessageSquare size={11} strokeWidth={2.4} />
            {sourceLabel}
            {decision.channel ? ` · ${decision.channel}` : ''}
          </div>
          <h1
            style={{
              fontSize: 'var(--fs-page-h1-platform)',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: 'var(--text-primary)',
              margin: '0 0 6px 0',
              lineHeight: 1.15,
            }}
          >
            Cognitive Audit
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13.5, margin: 0 }}>
            Logged {decision.createdAt.toISOString().slice(0, 10)}
            {audit?.modelVersion ? ` · methodology ${audit.modelVersion}` : ''}
          </p>
        </div>

        {/* Pending / errored states render before scores so the user sees status, not stale zeros. */}
        {isPending && (
          <div
            style={{
              padding: '20px 24px',
              borderRadius: 'var(--radius-xl)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderLeft: '3px solid var(--info)',
              marginBottom: 32,
            }}
          >
            <h2
              style={{
                fontSize: 17,
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 6,
              }}
            >
              Audit running &middot; results land here when the analyzer completes
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>
              The cognitive audit pipeline runs bias detection, noise scoring, sentiment, compliance,
              pre-mortem, logical analysis, and SWOT in parallel. Refresh in 30-60 seconds.{' '}
              <code
                style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 12,
                  padding: '1px 6px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {decision.status}
              </code>
            </p>
          </div>
        )}

        {isErrored && (
          <div
            style={{
              padding: '20px 24px',
              borderRadius: 'var(--radius-xl)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderLeft: '3px solid var(--error)',
              marginBottom: 32,
            }}
          >
            <h2
              style={{
                fontSize: 17,
                fontWeight: 600,
                color: 'var(--error)',
                marginBottom: 6,
              }}
            >
              Audit failed
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>
              The cognitive audit pipeline returned an error and the result was not stored. Re-submit
              the decision from{' '}
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

        {audit && grade && (
          <>
            {/* Score row — DQI, Noise, Biases count */}
            <section id="section-scores" style={{ marginBottom: 28 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 12,
                }}
              >
                {/* DQI card with grade pill — the primary metric */}
                <div
                  style={{
                    padding: '20px 22px',
                    borderRadius: 'var(--radius-xl)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderLeft: `3px solid ${grade.color}`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: 'var(--text-muted)',
                      }}
                    >
                      Decision Quality (DQI)
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 32,
                        height: 24,
                        padding: '0 8px',
                        fontSize: 13,
                        fontWeight: 800,
                        color: grade.color,
                        background: colorMix(grade.color, '12%'),
                        border: `1px solid ${colorMix(grade.color, '32%')}`,
                        borderRadius: 'var(--radius-sm)',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {grade.grade}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 36,
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.03em',
                        lineHeight: 1,
                      }}
                    >
                      {Math.round(audit.decisionQualityScore)}
                    </span>
                    <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/ 100</span>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      marginTop: 6,
                    }}
                  >
                    {grade.label}
                  </div>
                </div>

                {/* Noise card */}
                <div
                  style={{
                    padding: '20px 22px',
                    borderRadius: 'var(--radius-xl)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--text-muted)',
                      marginBottom: 8,
                    }}
                  >
                    Noise Score
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span
                      style={{
                        fontSize: 36,
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.03em',
                        lineHeight: 1,
                      }}
                    >
                      {Math.round(audit.noiseScore)}
                    </span>
                    <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/ 100</span>
                  </div>
                  {(noiseMean !== null || noiseStdDev !== null) && (
                    <div
                      style={{
                        fontSize: 11.5,
                        color: 'var(--text-secondary)',
                        marginTop: 6,
                        fontFamily: 'ui-monospace, monospace',
                      }}
                    >
                      {noiseMean !== null && `mean ${noiseMean.toFixed(1)}`}
                      {noiseMean !== null && noiseStdDev !== null && ' · '}
                      {noiseStdDev !== null && `stdDev ${noiseStdDev.toFixed(2)}`}
                    </div>
                  )}
                </div>

                {/* Biases count card */}
                <div
                  style={{
                    padding: '20px 22px',
                    borderRadius: 'var(--radius-xl)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--text-muted)',
                      marginBottom: 8,
                    }}
                  >
                    Biases Detected
                  </div>
                  <div
                    style={{
                      fontSize: 36,
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.03em',
                      lineHeight: 1,
                    }}
                  >
                    {biasFindings.length}
                  </div>
                  {audit.dissenterCount > 0 && (
                    <div
                      style={{
                        fontSize: 11.5,
                        color: 'var(--text-secondary)',
                        marginTop: 6,
                      }}
                    >
                      {audit.dissenterCount} dissenter
                      {audit.dissenterCount === 1 ? '' : 's'} flagged
                      {audit.teamConsensusFlag ? ' · false-consensus pattern' : ''}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Summary */}
            <section id="section-summary" style={{ marginBottom: 28 }}>
              <div
                style={{
                  padding: '24px 26px',
                  borderRadius: 'var(--radius-xl)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <h2
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-muted)',
                    margin: '0 0 12px 0',
                  }}
                >
                  Summary
                </h2>
                <p
                  style={{
                    color: 'var(--text-primary)',
                    lineHeight: 1.7,
                    fontSize: 14.5,
                    margin: 0,
                  }}
                >
                  {audit.summary}
                </p>
              </div>
            </section>

            {/* Detected Biases — sorted by severity desc */}
            {biasFindings.length > 0 && (
              <section id="section-biases" style={{ marginBottom: 28 }}>
                <h2
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-muted)',
                    margin: '0 0 12px 0',
                  }}
                >
                  Detected Biases &middot; sorted by severity
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {biasFindings.map((bias, i) => {
                    const rawType = bias.biasType ?? bias.type ?? `bias_${i + 1}`;
                    const displayName = getBiasDisplayName(rawType);
                    const severity = bias.severity?.toLowerCase();
                    const explanation = bias.explanation ?? bias.reasoning;
                    const mitigation = bias.suggestion ?? bias.mitigation;
                    const sevColor = severityColor(severity);
                    return (
                      <article
                        key={i}
                        style={{
                          padding: '18px 22px',
                          borderRadius: 'var(--radius-lg)',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          borderLeft: `3px solid ${sevColor}`,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: 12,
                            marginBottom: explanation ? 10 : 0,
                          }}
                        >
                          <h3
                            style={{
                              fontSize: 16,
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                              letterSpacing: '-0.01em',
                              margin: 0,
                              lineHeight: 1.3,
                            }}
                          >
                            {displayName}
                          </h3>
                          {severity && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '3px 10px',
                                fontSize: 10.5,
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                color: sevColor,
                                background: colorMix(sevColor, '10%'),
                                border: `1px solid ${colorMix(sevColor, '30%')}`,
                                borderRadius: 999,
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                              }}
                            >
                              {severity}
                            </span>
                          )}
                        </div>

                        {explanation && (
                          <p
                            style={{
                              color: 'var(--text-secondary)',
                              fontSize: 13.5,
                              lineHeight: 1.6,
                              margin: '0 0 12px 0',
                            }}
                          >
                            {explanation}
                          </p>
                        )}

                        {bias.excerpt && (
                          <blockquote
                            style={{
                              padding: '10px 14px',
                              margin: '0 0 12px 0',
                              borderLeft: `2px solid ${colorMix(sevColor, '40%')}`,
                              background: colorMix(sevColor, '4%'),
                              color: 'var(--text-primary)',
                              fontSize: 13,
                              fontStyle: 'italic',
                              lineHeight: 1.55,
                              borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                            }}
                          >
                            &ldquo;{bias.excerpt}&rdquo;
                          </blockquote>
                        )}

                        {mitigation && (
                          <div
                            style={{
                              padding: '10px 14px',
                              background: 'rgba(2,132,199,0.06)',
                              border: '1px solid rgba(2,132,199,0.18)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: 13,
                              lineHeight: 1.55,
                              color: 'var(--text-primary)',
                            }}
                          >
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                color: 'var(--info)',
                                marginRight: 8,
                              }}
                            >
                              Suggestion
                            </span>
                            {mitigation}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Action row — Decision Graph link, optional Document detail link */}
            <section id="section-graph" style={{ marginBottom: 28 }}>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 10,
                  alignItems: 'center',
                }}
              >
                <Link
                  href={`/dashboard/decision-graph?highlight=${id}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 13,
                    fontWeight: 600,
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    textDecoration: 'none',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                  className="cog-audit-action"
                >
                  <Network size={14} style={{ color: 'var(--accent-primary)' }} />
                  View in Decision Graph
                  <ArrowRight size={12} />
                </Link>
                {decision.linkedAnalysisId && (
                  <Link
                    href={`/documents/${decision.linkedAnalysisId}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 13,
                      fontWeight: 600,
                      background: 'rgba(22,163,74,0.06)',
                      color: 'var(--accent-primary)',
                      border: '1px solid rgba(22,163,74,0.22)',
                      textDecoration: 'none',
                    }}
                    className="cog-audit-action"
                  >
                    <FileText size={14} />
                    Linked document analysis
                    <ExternalLink size={12} />
                  </Link>
                )}
              </div>
              <style>{`
                .cog-audit-action:hover {
                  border-color: var(--accent-primary) !important;
                  background: rgba(22,163,74,0.04) !important;
                }
              `}</style>
            </section>

            {/* Root Cause + Related — only when linkedAnalysisId is non-null. */}
            {decision.linkedAnalysisId && (
              <>
                <section id="section-root-cause" style={{ marginBottom: 28 }}>
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
