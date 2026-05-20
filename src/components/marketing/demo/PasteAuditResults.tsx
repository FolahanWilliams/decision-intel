'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Brain,
  Users,
  BookmarkPlus,
  Swords,
  Clock,
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
  Layers,
  Hash,
  Cpu,
  XCircle,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import type { AnalysisResult, BiasDetectionResult, DecisionTwin } from '@/types';
import { DQIBadge } from '@/components/ui/DQIBadge';
import { DiscoverySynthesisLine } from '@/components/analysis/DiscoverySynthesisLine';
import { trackEvent } from '@/lib/analytics/track';
import { buildSaveAuditHref } from '@/lib/utils/demo-claim-url';
import { formatBiasName } from '@/lib/utils/labels';
import { ReferralAffordanceCard } from '@/components/referral/ReferralAffordanceCard';
import { METHODOLOGY_VERSION } from '@/lib/scoring/dqi';
import { PIPELINE_NODES } from '@/lib/data/pipeline-nodes';

const C = {
  white: '#FFFFFF',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
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
  // Caps lifted 2026-05-20 — show ALL detected signal, not a hard top-N
  // slice. Founder feedback: "no point into showing a very watered down
  // version of the audit findings, which makes it look like a cheap gpt
  // wrapper, both by the content, and way it is displayed visually". The
  // pipeline produces depth across 7 surfaces (biases / compound patterns
  // / verifications / forgotten questions / boardroom / red team /
  // inversion); surfacing only top 3 of one class read as a GPT chatbot,
  // not a procurement audit.
  const allBiases: BiasDetectionResult[] = (result.biases ?? [])
    .filter(b => b.found !== false)
    .sort((a, b) => {
      const order = { critical: 4, high: 3, medium: 2, low: 1 } as const;
      return (order[b.severity] ?? 0) - (order[a.severity] ?? 0);
    });
  const primaryBiases = allBiases.filter(b => b.severity === 'critical' || b.severity === 'high');
  const secondaryBiases = allBiases.filter(b => b.severity === 'medium' || b.severity === 'low');

  // Boardroom — show ALL 5 personas the pipeline simulated, not the
  // truncated top-3. The procurement-grade signal is "5 role-primed
  // executives reviewed your memo" not "here's a sample of 3".
  const twins: DecisionTwin[] = result.simulation?.twins ?? [];
  // Hostile objections — show ALL redTeam dissent, not just 2.
  const redTeam = result.preMortem?.redTeam ?? [];
  // Munger inversion — concrete failure-mode actions. Surfaced when the
  // pipeline produced them; otherwise hidden silently.
  const inversion = result.preMortem?.inversion ?? [];
  // Forgotten Questions — the Klein-side R²F output. Distinct section
  // because this is the platform's unique RPD-anchored signal.
  const forgottenQuestions = result.forgottenQuestions?.questions ?? [];
  // Verifications — claim-by-claim fact-check verdicts the verification
  // node produced. Surfaced separately because procurement readers
  // (Margaret-class CSO, James-class GC) recognise these as procurement-
  // grade evidence anchors.
  const verifications = result.factCheck?.verifications ?? [];
  // Compound failure patterns — Synergy Mirage / Conglomerate Fallacy /
  // Winner's Curse / etc. The 22×22 interaction matrix's headline output.
  const compoundPatterns =
    (
      result.compoundScoring as
        | {
            namedPatterns?: Array<{
              patternLabel: string;
              severity?: string;
              biasTypes?: string[];
              description?: string;
            }>;
          }
        | undefined
    )?.namedPatterns ?? [];

  // Provenance strip data — methodology version + canonical pipeline node
  // count + first 12 chars of a content-shaped pseudo-hash derived from
  // (documentId, analysisId). The hash isn't the SHA-256 the persisted DPR
  // carries (that lives on Document.contentHash, not in the SSE result
  // payload), but it gives the cold visitor a procurement-grade-feeling
  // monospace audit-trail strip that mirrors the real DPR cover.
  const provenanceHash = (analysisId ?? documentId).replace(/-/g, '').slice(0, 12);

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
            biasCount={allBiases.length}
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
            {allBiases.length} bias{allBiases.length === 1 ? '' : 'es'} flagged
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
          {compoundPatterns.length > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 700,
                color: C.red,
                background: '#FEF2F2',
                border: `1px solid #FECACA`,
                padding: '6px 12px',
                borderRadius: 999,
              }}
            >
              <AlertTriangle size={12} /> {compoundPatterns.length} compound pattern
              {compoundPatterns.length === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {/* Provenance strip — methodology + pipeline-node count + content
            hash shape. The procurement-grade "real engineering, not
            chatbot" signal: the same 22-bias R²F + 12-node lineage every
            authenticated audit produces lives on the demo too. */}
        <div
          className="paste-audit-provenance"
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: `1px dashed ${C.slate200}`,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            flexWrap: 'wrap',
            fontSize: 11,
            color: C.slate500,
            fontFamily: 'var(--font-mono, monospace)',
            letterSpacing: '0.02em',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Cpu size={11} style={{ color: C.slate400 }} />
            {PIPELINE_NODES.length}-node pipeline
          </span>
          <span style={{ color: C.slate300 }}>·</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Layers size={11} style={{ color: C.slate400 }} />
            R²F · methodology v{METHODOLOGY_VERSION}
          </span>
          <span style={{ color: C.slate300 }}>·</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Hash size={11} style={{ color: C.slate400 }} />
            audit {provenanceHash}
          </span>
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

      {/* Compound failure patterns — Synergy Mirage / Conglomerate Fallacy
          / Winner's Curse / etc. The 22×22 interaction matrix's headline
          output. Surfaced ABOVE the bias catalogue so a procurement reader
          sees the toxic combos before drilling into the individual flags. */}
      {compoundPatterns.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: C.white,
            border: `1px solid ${C.slate200}`,
            borderTop: `3px solid ${C.red}`,
            borderRadius: 16,
            padding: '24px 28px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: '#FEF2F2',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={16} style={{ color: C.red }} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: C.red,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  marginBottom: 2,
                }}
              >
                Compound failure patterns
              </div>
              <h3
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: C.slate900,
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                Named patterns the 22×22 matrix detected
              </h3>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {compoundPatterns.map((p, i) => {
              const col = severityColor(p.severity || 'high');
              return (
                <div
                  key={`${p.patternLabel}-${i}`}
                  style={{
                    border: `1px solid ${col}33`,
                    background: `${col}08`,
                    borderRadius: 10,
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
                    <span style={{ fontSize: 14, fontWeight: 800, color: C.slate900 }}>
                      {p.patternLabel}
                    </span>
                    {p.severity && (
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
                        {p.severity}
                      </span>
                    )}
                  </div>
                  {(p.biasTypes ?? []).length > 0 && (
                    <p
                      style={{
                        fontSize: 12,
                        color: C.slate600,
                        fontFamily: 'var(--font-mono, monospace)',
                        margin: '0 0 6px',
                      }}
                    >
                      {(p.biasTypes ?? []).map(formatBiasName).join(' + ')}
                    </p>
                  )}
                  {p.description && (
                    <p style={{ fontSize: 13, color: C.slate700, lineHeight: 1.55, margin: 0 }}>
                      {p.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Biases — ALL detected biases, primary (critical/high) prominent
          with verbatim excerpt + explanation + mitigation; secondary
          (medium/low) listed below in a denser two-column grid. Cap
          lifted 2026-05-20 from the prior top-3 slice. */}
      {allBiases.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: C.white,
            border: `1px solid ${C.slate200}`,
            borderTop: `3px solid #8B5CF6`,
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
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: C.slate900,
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                Biases the audit caught
              </h3>
              <p style={{ fontSize: 12.5, color: C.slate500, margin: '2px 0 0' }}>
                {allBiases.length} flag{allBiases.length === 1 ? '' : 's'} across the 22-bias R²F
                taxonomy — highest severity first, with the passage that triggered each.
              </p>
            </div>
          </div>

          {primaryBiases.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {primaryBiases.map((b, i) => {
                const col = severityColor(b.severity);
                return (
                  <div
                    key={`primary-${b.biasType}-${i}`}
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
                      {typeof b.confidence === 'number' && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: C.slate500,
                            fontFamily: 'var(--font-mono, monospace)',
                            marginLeft: 'auto',
                          }}
                        >
                          {Math.round(b.confidence * 100)}% confidence
                        </span>
                      )}
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
                        “{b.excerpt}”
                      </p>
                    )}
                    {b.explanation && (
                      <p
                        style={{
                          fontSize: 13,
                          color: C.slate600,
                          lineHeight: 1.55,
                          margin: '0 0 6px',
                        }}
                      >
                        {b.explanation}
                      </p>
                    )}
                    {b.suggestion && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 6,
                          marginTop: 8,
                          paddingTop: 8,
                          borderTop: `1px solid ${C.slate200}`,
                          fontSize: 12.5,
                          color: C.slate700,
                          lineHeight: 1.5,
                        }}
                      >
                        <ShieldCheck
                          size={13}
                          style={{ color: C.green, flexShrink: 0, marginTop: 2 }}
                        />
                        <span>
                          <strong style={{ color: C.slate900 }}>Mitigation:</strong> {b.suggestion}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {secondaryBiases.length > 0 && (
            <div
              style={{
                marginTop: primaryBiases.length > 0 ? 18 : 0,
                paddingTop: primaryBiases.length > 0 ? 14 : 0,
                borderTop: primaryBiases.length > 0 ? `1px solid ${C.slate200}` : 'none',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: C.slate500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  marginBottom: 10,
                }}
              >
                Lower-severity flags · {secondaryBiases.length}
              </div>
              <div
                className="paste-audit-secondary-bias-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: 10,
                }}
              >
                {secondaryBiases.map((b, i) => {
                  const col = severityColor(b.severity);
                  return (
                    <div
                      key={`secondary-${b.biasType}-${i}`}
                      style={{
                        borderLeft: `2px solid ${col}`,
                        background: C.slate50,
                        borderRadius: 6,
                        padding: '10px 12px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: C.slate900 }}>
                          {formatBiasName(b.biasType)}
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: col,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            background: `${col}12`,
                            border: `1px solid ${col}28`,
                            padding: '1px 6px',
                            borderRadius: 3,
                          }}
                        >
                          {b.severity}
                        </span>
                      </div>
                      {b.explanation && (
                        <p
                          style={{
                            fontSize: 12,
                            color: C.slate600,
                            lineHeight: 1.5,
                            margin: 0,
                          }}
                        >
                          {b.explanation.length > 140
                            ? `${b.explanation.slice(0, 140)}…`
                            : b.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.section>
      )}

      {/* Verification — claim-by-claim fact-check verdicts the verification
          node produced. Surfaced separately because procurement readers
          recognise this as procurement-grade evidence anchoring (Margaret-
          class CSO, James-class GC). */}
      {verifications.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: C.white,
            border: `1px solid ${C.slate200}`,
            borderTop: `3px solid #0284C7`,
            borderRadius: 16,
            padding: '24px 28px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 16,
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
              <ShieldCheck size={16} style={{ color: '#0284C7' }} />
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
                Claim verification
              </h3>
              <p style={{ fontSize: 12.5, color: C.slate500, margin: '2px 0 0' }}>
                {verifications.length} claim{verifications.length === 1 ? '' : 's'} cross-checked —
                verified, contradicted, or unverifiable.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {verifications.map((v, i) => {
              const verdictColor =
                v.verdict === 'VERIFIED' ? C.green : v.verdict === 'CONTRADICTED' ? C.red : C.amber;
              const verdictIcon =
                v.verdict === 'VERIFIED' ? (
                  <CheckCircle2 size={14} style={{ color: verdictColor }} />
                ) : v.verdict === 'CONTRADICTED' ? (
                  <XCircle size={14} style={{ color: verdictColor }} />
                ) : (
                  <HelpCircle size={14} style={{ color: verdictColor }} />
                );
              return (
                <div
                  key={`verify-${i}`}
                  style={{
                    border: `1px solid ${C.slate200}`,
                    background: C.slate50,
                    borderRadius: 10,
                    padding: '12px 14px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    {verdictIcon}
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: verdictColor,
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                      }}
                    >
                      {v.verdict}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: C.slate900,
                      lineHeight: 1.5,
                      margin: '0 0 4px',
                    }}
                  >
                    “{v.claim}”
                  </p>
                  <p style={{ fontSize: 12.5, color: C.slate600, lineHeight: 1.55, margin: 0 }}>
                    {v.explanation}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Forgotten Questions — the Klein-side R²F output. The questions
          the memo never asks but historical analogs were forced to
          answer. Distinct section because this is the platform's unique
          RPD-anchored signal — no competitor (Cloverpop / Aera / IBM)
          surfaces this kind of analog-grounded gap. */}
      {forgottenQuestions.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: C.white,
            border: `1px solid ${C.slate200}`,
            borderTop: `3px solid ${C.amber}`,
            borderRadius: 16,
            padding: '24px 28px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 16,
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
              <HelpCircle size={16} style={{ color: C.amber }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: C.slate900,
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                Questions the memo never asks
              </h3>
              <p style={{ fontSize: 12.5, color: C.slate500, margin: '2px 0 0' }}>
                {result.forgottenQuestions?.headline ??
                  `${forgottenQuestions.length} question${forgottenQuestions.length === 1 ? '' : 's'} historical analogs were forced to answer.`}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {forgottenQuestions.map((q, i) => {
              const col = severityColor(q.severity);
              return (
                <div
                  key={`forgotten-${i}`}
                  style={{
                    borderLeft: `3px solid ${col}`,
                    background: C.slate50,
                    borderRadius: 8,
                    padding: '12px 14px',
                  }}
                >
                  <p
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: C.slate900,
                      lineHeight: 1.45,
                      margin: '0 0 6px',
                    }}
                  >
                    {q.question}
                  </p>
                  <p style={{ fontSize: 12.5, color: C.slate600, lineHeight: 1.55, margin: 0 }}>
                    {q.whyItMatters}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginTop: 6,
                      fontSize: 11,
                      color: C.slate500,
                      flexWrap: 'wrap',
                    }}
                  >
                    {q.analogCompany && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontWeight: 700 }}>Analog:</span> {q.analogCompany}
                      </span>
                    )}
                    {q.biasGuarded && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontWeight: 700 }}>Guards against:</span>{' '}
                        {formatBiasName(q.biasGuarded)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* AI Boardroom — all 5 role-primed personas the pipeline ran.
          Cap lifted 2026-05-20 from prior top-3 slice. */}
      {twins.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: C.white,
            border: `1px solid ${C.slate200}`,
            borderTop: `3px solid #0F172A`,
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
                background: C.slate900,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={16} style={{ color: C.white }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
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
                All {twins.length} role-primed personas the simulation node ran — CEO, CFO, board
                chair, GC, audit committee.{' '}
                {result.simulation?.overallVerdict
                  ? `Overall verdict: ${result.simulation.overallVerdict}.`
                  : ''}
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

      {/* Red team / what-if — ALL hostile objections, not just the top 2.
          Cap lifted 2026-05-20. The RAND 10th Man structured-dissent
          output is the procurement-grade artefact a steering committee
          recognises (Margaret-class CSO walks into the board meeting
          with this list pre-answered). */}
      {redTeam.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: C.white,
            border: `1px solid ${C.slate200}`,
            borderTop: `3px solid #D97706`,
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
            <div style={{ flex: 1, minWidth: 0 }}>
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
                All {redTeam.length} pieces of structured dissent the RAND-10th-Man pre-mortem
                produced. The objections your committee should have answered before voting.
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
                    margin: '0 0 4px',
                  }}
                >
                  <span style={{ fontWeight: 700 }}>Targets:</span> {rt.targetClaim}
                </p>
                {rt.reasoning && (
                  <p
                    style={{
                      fontSize: 12,
                      color: C.slate500,
                      lineHeight: 1.55,
                      margin: 0,
                      paddingTop: 6,
                      borderTop: `1px solid ${C.slate200}`,
                      marginTop: 8,
                    }}
                  >
                    {rt.reasoning}
                  </p>
                )}
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Munger inversion — concrete failure-mode actions. The "to fail,
          do this" backward-reasoning the pipeline produces via the
          pre-mortem node. A distinct procurement-grade move (Charlie
          Munger's invert-always-invert) that no GPT-wrapper competitor
          surfaces. */}
      {inversion.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: C.white,
            border: `1px solid ${C.slate200}`,
            borderTop: `3px solid ${C.slate700}`,
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
                background: C.slate100,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RotateCcw size={16} style={{ color: C.slate700 }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: C.slate700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  marginBottom: 2,
                }}
              >
                Inversion · Munger
              </div>
              <h3
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: C.slate900,
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                What guarantees this fails
              </h3>
              <p style={{ fontSize: 12.5, color: C.slate500, margin: '2px 0 0' }}>
                Backward-reasoning failure modes. If any of these read as already-happening, the
                plan needs pressure-testing.
              </p>
            </div>
          </div>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {inversion.map((line, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  background: C.slate50,
                  border: `1px solid ${C.slate200}`,
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: 13,
                  color: C.slate700,
                  lineHeight: 1.55,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.slate400,
                    flexShrink: 0,
                    minWidth: 18,
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
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

      {/* Referral affordance — peak-intent referral surface (locked 2026-05-19,
          follow-up to the access-amendment 1fd98ce9). Mounts AFTER the
          Save+Unlock CTA so the conversion priority is right: save your own
          audit first, then refer if you found it useful. /demo is anonymous,
          so userId is null and the ?ref attribution is a no-op for now —
          the share motion still works. Mount on the authenticated reveal is
          a deliberate follow-up. */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        <ReferralAffordanceCard userId={null} analysisId={analysisId} source="demo_paste" />
      </motion.div>

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
