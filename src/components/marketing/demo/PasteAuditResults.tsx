'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Brain, Users, BookmarkPlus, Swords, Clock, CheckCircle2 } from 'lucide-react';
import type { AnalysisResult, BiasDetectionResult, DecisionTwin } from '@/types';
import { DQIBadge } from '@/components/ui/DQIBadge';
import { DiscoverySynthesisLine } from '@/components/analysis/DiscoverySynthesisLine';
import { trackEvent } from '@/lib/analytics/track';
import { buildSaveAuditHref } from '@/lib/utils/demo-claim-url';
import { formatBiasName } from '@/lib/utils/labels';

const C = {
  white: '#FFFFFF',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0F172A',
  green: '#16A34A',
  greenLight: '#DCFCE7',
  greenSoft: '#F0FDF4',
  amber: '#D97706',
  red: '#DC2626',
  orange: '#EA580C',
};

function severityColor(severity: string): string {
  if (severity === 'critical') return '#DC2626';
  if (severity === 'high') return '#EA580C';
  if (severity === 'medium') return '#D97706';
  return '#16A34A';
}

interface PasteAuditResultsProps {
  documentId: string;
  analysisId: string | null;
  result: AnalysisResult;
}

export function PasteAuditResults({ documentId, analysisId, result }: PasteAuditResultsProps) {
  const topBiases: BiasDetectionResult[] = (result.biases ?? [])
    .filter(b => b.found !== false)
    .sort((a, b) => {
      const order = { critical: 4, high: 3, medium: 2, low: 1 } as const;
      return (order[b.severity] ?? 0) - (order[a.severity] ?? 0);
    })
    .slice(0, 3);

  const twins: DecisionTwin[] = (result.simulation?.twins ?? []).slice(0, 3);
  const redTeam = (result.preMortem?.redTeam ?? []).slice(0, 2);

  // Demo claim flow (D9, locked 2026-04-27): the wow-moment audit lives
  // under DEMO_USER_ID for 24h. The Save CTA routes through signup → claim
  // → owned doc so the audit transfers ownership to the new user. Visitors
  // who close the tab and come back later beyond 24h fall through to the
  // existing deepDiveHref path (which 403s on a demo-owned doc, but the
  // /onboarding/claim error UI handles the "no longer claimable" case).
  // URL-builder extracted to lib/utils/demo-claim-url 2026-05-10 (first-
  // impression audit) — pure function with vitest coverage so a typo
  // can't silently orphan a Strategy World prospect's demo audit.
  const saveAuditHref = buildSaveAuditHref({ analysisId, documentId });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* DQI Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: C.white,
          border: `2px solid ${C.green}`,
          borderRadius: 20,
          padding: '32px 32px 28px',
          boxShadow: '0 14px 40px rgba(22,163,74,0.14)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 24,
            flexWrap: 'wrap',
            marginBottom: 18,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: C.green,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                marginBottom: 8,
              }}
            >
              Your audit
            </div>
            <h2
              style={{
                fontSize: 'clamp(22px, 3vw, 28px)',
                fontWeight: 800,
                color: C.slate900,
                margin: 0,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              Decision Quality Index &middot;{' '}
              <span style={{ color: C.green }}>{Math.round(result.overallScore)}/100</span>
            </h2>
          </div>
          <DQIBadge score={result.overallScore} size="md" />
        </div>

        <p style={{ fontSize: 15, color: C.slate600, lineHeight: 1.65, margin: '0 0 14px' }}>
          {result.summary}
        </p>

        {/* GTM v3.5 Discovery-Grade synthesis line — single visceral hook for
            the Phase 1 conversion mechanic at coffee chats / London events.
            Renders BEFORE the noise / bias-count chips so the prospect hears
            "X flags · ~£Y at risk · 60-second audit" in one breath. */}
        <div style={{ margin: '0 -28px 14px', borderRadius: 12, overflow: 'hidden' }}>
          <DiscoverySynthesisLine
            analysisId={analysisId}
            biasCount={topBiases.length}
            variant="demo"
          />
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: C.slate600,
              background: C.slate50,
              border: `1px solid ${C.slate200}`,
              padding: '6px 12px',
              borderRadius: 999,
            }}
          >
            Noise score: {Math.round(result.noiseScore)}/100
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: C.slate600,
              background: C.slate50,
              border: `1px solid ${C.slate200}`,
              padding: '6px 12px',
              borderRadius: 999,
            }}
          >
            {topBiases.length} bias{topBiases.length === 1 ? '' : 'es'} flagged
          </span>
          {result.simulation && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                color: C.slate600,
                background: C.slate50,
                border: `1px solid ${C.slate200}`,
                padding: '6px 12px',
                borderRadius: 999,
              }}
            >
              Boardroom verdict: {result.simulation.overallVerdict}
            </span>
          )}
        </div>

        {/* Inline Save CTA — anchored to the score-reveal moment so a cold
            reader sees the conversion path the instant the wow lands.
            Strengthened 2026-05-10 first-impression audit:
              · Loss-aversion framing ("expires in 24h" is the actual
                window the demo audit lives under DEMO_USER_ID before
                the orphan rule kicks in — naming it converts harder
                than passive "save your audit").
              · Stacks on mobile (≤520px) so the CTA never crushes.
              · Bigger button + Clock icon makes the urgency unmissable.
            B3 base shipped 2026-04-28; founder asked for first-impression
            polish before Strategy World London T-30. */}
        <div
          className="paste-audit-save-cta"
          style={{
            marginTop: 18,
            paddingTop: 16,
            borderTop: `1px solid ${C.slate200}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              minWidth: 0,
              flex: '1 1 240px',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: '#FEF3C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Clock size={14} style={{ color: C.amber }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: C.slate900,
                  lineHeight: 1.4,
                  marginBottom: 2,
                }}
              >
                This audit expires in 24 hours
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: C.slate500,
                  lineHeight: 1.5,
                }}
              >
                Free account keeps the audit, lets you re-edit passages, and unlocks the full
                12-node breakdown.
              </div>
            </div>
          </div>
          <Link
            href={saveAuditHref}
            onClick={() =>
              trackEvent('demo_save_audit_clicked', {
                analysisId: analysisId ?? undefined,
                documentId,
                claimFlow: 'enabled',
                placement: 'inline_score_reveal',
              })
            }
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 14,
              fontWeight: 700,
              color: C.white,
              background: C.green,
              padding: '11px 20px',
              borderRadius: 10,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 14px rgba(22,163,74,0.28)',
              flexShrink: 0,
            }}
          >
            Save audit <ArrowRight size={14} />
          </Link>
        </div>
      </motion.div>

      {/* Top biases */}
      {topBiases.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: C.white,
            border: `1px solid ${C.slate200}`,
            borderRadius: 16,
            padding: '24px 28px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: '#F5F3FF',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Brain size={16} style={{ color: '#8B5CF6' }} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: C.slate900,
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                Top biases in your memo
              </h3>
              <p style={{ fontSize: 12.5, color: C.slate500, margin: '2px 0 0' }}>
                Highest-severity first, with the passage that triggered each flag.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {topBiases.map((b, i) => {
              const col = severityColor(b.severity);
              return (
                <div
                  key={`${b.biasType}-${i}`}
                  style={{
                    borderLeft: `3px solid ${col}`,
                    background: C.slate50,
                    borderRadius: 8,
                    padding: '14px 16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 6,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13.5,
                        fontWeight: 800,
                        color: C.slate900,
                      }}
                    >
                      {formatBiasName(b.biasType)}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: col,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        background: `${col}15`,
                        border: `1px solid ${col}35`,
                        padding: '2px 8px',
                        borderRadius: 4,
                      }}
                    >
                      {b.severity}
                    </span>
                  </div>
                  {b.excerpt && (
                    <p
                      style={{
                        fontSize: 13,
                        color: C.slate700,
                        fontStyle: 'italic',
                        lineHeight: 1.55,
                        margin: '0 0 6px',
                      }}
                    >
                      “{b.excerpt.slice(0, 200)}
                      {b.excerpt.length > 200 ? '…' : ''}”
                    </p>
                  )}
                  <p style={{ fontSize: 13, color: C.slate500, lineHeight: 1.55, margin: 0 }}>
                    {b.explanation?.slice(0, 180)}
                    {b.explanation && b.explanation.length > 180 ? '…' : ''}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* AI Boardroom */}
      {twins.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: C.white,
            border: `1px solid ${C.slate200}`,
            borderRadius: 16,
            padding: '24px 28px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: '#E0F2FE',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={16} style={{ color: '#0284C7' }} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: C.slate900,
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                The AI boardroom
              </h3>
              <p style={{ fontSize: 12.5, color: C.slate500, margin: '2px 0 0' }}>
                How role-primed CEO, CFO, and board personas would respond to your memo.
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 12,
            }}
          >
            {twins.map((t, i) => {
              const voteColor =
                t.vote === 'APPROVE' ? C.green : t.vote === 'REJECT' ? C.red : C.amber;
              return (
                <div
                  key={`${t.name}-${i}`}
                  style={{
                    background: C.slate50,
                    border: `1px solid ${C.slate200}`,
                    borderRadius: 12,
                    padding: '14px 16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 6,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: C.slate900 }}>
                        {t.name}
                      </div>
                      <div style={{ fontSize: 11.5, color: C.slate500 }}>{t.role}</div>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: voteColor,
                        background: `${voteColor}15`,
                        border: `1px solid ${voteColor}35`,
                        padding: '3px 8px',
                        borderRadius: 4,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {t.vote}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 12.5,
                      color: C.slate600,
                      lineHeight: 1.55,
                      margin: '6px 0 0',
                    }}
                  >
                    {t.rationale}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Red team / what-if */}
      {redTeam.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: C.white,
            border: `1px solid ${C.slate200}`,
            borderRadius: 16,
            padding: '24px 28px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: '#FEF3C7',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Swords size={16} style={{ color: '#D97706' }} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: C.slate900,
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                What-if: the hostile objections
              </h3>
              <p style={{ fontSize: 12.5, color: C.slate500, margin: '2px 0 0' }}>
                The structured dissent your memo should have answered before the board meeting.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {redTeam.map((rt, i) => (
              <div
                key={i}
                style={{
                  background: C.slate50,
                  border: `1px solid ${C.slate200}`,
                  borderRadius: 10,
                  padding: '12px 14px',
                }}
              >
                <p
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: C.slate900,
                    lineHeight: 1.45,
                    margin: '0 0 4px',
                  }}
                >
                  “{rt.objection}”
                </p>
                <p
                  style={{
                    fontSize: 12.5,
                    color: C.slate600,
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  <span style={{ fontWeight: 700 }}>Targets:</span> {rt.targetClaim}
                </p>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Save + unlock CTA */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: '#0F172A',
          color: C.white,
          borderRadius: 20,
          padding: '28px 30px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 11,
            fontWeight: 800,
            color: '#BBF7D0',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
          }}
        >
          <BookmarkPlus size={12} /> Save this audit
        </div>
        <h3
          style={{
            fontSize: 'clamp(22px, 3.2vw, 28px)',
            fontWeight: 800,
            color: C.white,
            margin: 0,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
          }}
        >
          Connect this decision to your Decision Knowledge Graph.
        </h3>
        <p style={{ fontSize: 15, color: '#CBD5E1', lineHeight: 1.6, margin: 0 }}>
          Create a free account to save this audit, see the counterfactuals and full bias-network
          graph, and start compounding every strategic call your team makes.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
          <Link
            href={saveAuditHref}
            onClick={() =>
              trackEvent('demo_save_audit_clicked', {
                analysisId: analysisId ?? undefined,
                documentId,
                claimFlow: 'enabled',
              })
            }
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
              fontWeight: 700,
              color: C.slate900,
              background: C.green,
              padding: '12px 22px',
              borderRadius: 10,
              textDecoration: 'none',
              boxShadow: '0 6px 20px rgba(22,163,74,0.3)',
            }}
          >
            Save this audit &mdash; free <ArrowRight size={14} />
          </Link>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13.5,
              fontWeight: 600,
              color: '#CBD5E1',
              textDecoration: 'none',
              padding: '12px 10px',
            }}
          >
            Back to the landing page
          </Link>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
            marginTop: 4,
          }}
        >
          {['4 audits/month on the free tier', 'No card required', 'Delete any audit anytime'].map(
            t => (
              <span
                key={t}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  color: '#94A3B8',
                }}
              >
                <CheckCircle2 size={12} style={{ color: C.green }} />
                {t}
              </span>
            )
          )}
        </div>
      </motion.section>

      {/* Mobile stack — CTA row collapses cleanly below 520px so the
          Save Audit button never crushes the loss-aversion copy. Locked
          2026-05-10 first-impression audit. */}
      <style jsx>{`
        @media (max-width: 520px) {
          :global(.paste-audit-save-cta) {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          :global(.paste-audit-save-cta a) {
            justify-content: center !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
