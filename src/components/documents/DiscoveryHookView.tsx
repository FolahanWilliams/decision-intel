'use client';

/**
 * DiscoveryHookView — State 1 of the document detail page state machine.
 *
 * The user's intent: "Did I mess up? How bad?"
 *
 * Auto-renders for: fresh upload, first read (visit_count === 1).
 *
 * Locked 2026-05-01 from NotebookLM Q5 synthesis. Replaces the dense
 * dashboard for first-time-readers with a single-screen hook that strictly
 * enforces empathic-mode-first. The discipline:
 *
 *   - The hook line is the FIRST and DOMINANT visual element.
 *   - DQI grade + bias names visible (proves the engine ran).
 *   - Excerpts + mitigations BLURRED (paywall conversion mechanism on
 *     free tier; full reveal on paid tier).
 *   - Single primary CTA (unlock or export DPR).
 *   - NO tabs, NO 4-tile grids, NO knowledge graphs, NO RSS feeds.
 *
 * The "I have to screenshot this" moment per Q4 viral synthesis.
 */

import { useMemo } from 'react';
import { ArrowRight, Download, Lock } from 'lucide-react';
import type { AnalysisResult, BiasInstance } from '@/types';
import { dqiColorFor, gradeFromScore } from '@/lib/utils/grade';
import {
  buildCostOfIgnoring,
  deriveDocumentType,
  formatBiasName,
  rankBias,
  severityColor,
} from './_brief-shared';

interface DiscoveryHookViewProps {
  filename: string;
  documentType?: string | null;
  analysis: AnalysisResult;
  biases: BiasInstance[];
  /** Optional dollar exposure when DecisionFrame.value is present. */
  exposure?: { amount: number; currency: string };
  /** True when the user is on free tier — blurs excerpts + mitigations
   *  and replaces the primary CTA with "Unlock the audit". */
  isFree?: boolean;
  /** Click → fire DPR export. */
  onExportDpr?: () => void;
  /** Click → open Share & Export modal (used as Unlock CTA on free tier). */
  onUnlock?: () => void;
  /** Click → switch to Rehearsal state for committee prep. */
  onEnterRehearsal?: () => void;
}

export function DiscoveryHookView({
  filename: _filename,
  documentType,
  analysis,
  biases,
  exposure,
  isFree = false,
  onExportDpr,
  onUnlock,
  onEnterRehearsal,
}: DiscoveryHookViewProps) {
  const score = analysis.overallScore ?? 0;
  const grade = gradeFromScore(score);
  const scoreColor = dqiColorFor(score);

  const topBiases = useMemo(
    () => [...biases].sort((a, b) => rankBias(b) - rankBias(a)).slice(0, 3),
    [biases]
  );

  const docType = deriveDocumentType(documentType);
  const costOfIgnoring = buildCostOfIgnoring(exposure, topBiases).display;
  const biasCountLabel =
    topBiases.length === 0
      ? 'No flags'
      : `${topBiases.length} flag${topBiases.length === 1 ? '' : 's'}`;

  const primaryAction = isFree
    ? { label: 'Unlock the audit', icon: Lock, onClick: onUnlock }
    : { label: 'Export DPR PDF', icon: Download, onClick: onExportDpr };
  const PrimaryIcon = primaryAction.icon;

  return (
    <article
      style={{
        maxWidth: 760,
        margin: '0 auto',
        padding: '0 24px 64px',
      }}
      aria-label="Discovery — the audit verdict"
    >
      {/* Eyebrow */}
      <div
        style={{
          fontSize: 'var(--fs-3xs)',
          fontWeight: 600,
          color: 'var(--text-muted)',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          marginTop: 48,
          marginBottom: 22,
        }}
      >
        Audit complete · 60 seconds
      </div>

      {/* THE HOOK LINE — the dominant visual element on this page */}
      <h1
        style={{
          fontFamily: 'var(--font-display, "Instrument Serif", Georgia, serif)',
          fontSize: 'clamp(36px, 5vw, 60px)',
          lineHeight: 1.05,
          fontWeight: 400,
          letterSpacing: '-0.02em',
          color: 'var(--text-primary)',
          margin: 0,
          marginBottom: 56,
        }}
      >
        Your {docType}.{' '}
        <span style={{ color: topBiases.length === 0 ? 'var(--success)' : 'var(--error)' }}>
          {biasCountLabel}.
        </span>{' '}
        <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          {costOfIgnoring}.
        </span>{' '}
        Here&rsquo;s the fix.
      </h1>

      {/* Grade + DQI */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '180px 1fr',
          gap: 48,
          alignItems: 'center',
          paddingBottom: 48,
          borderBottom: '1px solid var(--border-color)',
          marginBottom: 48,
        }}
        className="discovery-hook-grade"
      >
        <div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 110,
              fontWeight: 800,
              lineHeight: 1,
              color: scoreColor,
              letterSpacing: '-0.05em',
            }}
          >
            {grade}
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 'var(--fs-md)',
              fontWeight: 500,
              color: 'var(--text-muted)',
              marginTop: 8,
            }}
          >
            DQI {Math.round(score)}/100
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 'var(--fs-3xs)',
              fontWeight: 600,
              color: 'var(--text-muted)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            Decision Quality
          </div>
          <p
            style={{
              fontSize: 'var(--fs-md)',
              lineHeight: 1.55,
              color: 'var(--text-secondary)',
              margin: 0,
            }}
          >
            Recognition-Rigor Framework — Kahneman&rsquo;s rigor + Klein&rsquo;s recognition,
            arbitrated through a 12-node pipeline. Hashed and tamper-evident; the
            full audit record is one click away.
          </p>
        </div>
      </div>

      {/* THE 3 FLAGS — names visible, excerpts + suggestions blurred for free tier */}
      {topBiases.length > 0 && (
        <section style={{ marginBottom: 56 }}>
          <div
            style={{
              fontSize: 'var(--fs-3xs)',
              fontWeight: 600,
              color: 'var(--text-muted)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 20,
            }}
          >
            The flags
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {topBiases.map((bias, i) => {
              const accent = severityColor(bias.severity);
              return (
                <div
                  key={bias.id ?? `${bias.biasType}-${i}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 1fr',
                    gap: 16,
                    alignItems: 'baseline',
                    paddingBottom: 16,
                    borderBottom: '1px solid var(--border-color)',
                  }}
                  className="discovery-hook-flag"
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-display, "Instrument Serif", Georgia, serif)',
                      fontSize: 36,
                      fontWeight: 400,
                      lineHeight: 1,
                      color: accent,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        flexWrap: 'wrap',
                        marginBottom: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 'var(--fs-lg)',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {formatBiasName(bias.biasType)}
                      </span>
                      <span
                        style={{
                          fontSize: 'var(--fs-3xs)',
                          fontWeight: 700,
                          color: accent,
                          background: 'var(--bg-secondary)',
                          border: `1px solid ${accent}`,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        {bias.severity}
                      </span>
                      <span
                        style={{
                          fontSize: 'var(--fs-xs)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {Math.round((bias.confidence ?? 0.7) * 100)}% confidence
                      </span>
                    </div>
                    {/* Excerpt + suggestion blurred for free tier — Q3 paywall mechanism */}
                    <div
                      style={{
                        position: 'relative',
                        filter: isFree ? 'blur(5px)' : 'none',
                        userSelect: isFree ? 'none' : 'auto',
                        pointerEvents: isFree ? 'none' : 'auto',
                      }}
                    >
                      {bias.excerpt && (
                        <div
                          style={{
                            fontSize: 'var(--fs-sm)',
                            color: 'var(--text-secondary)',
                            fontStyle: 'italic',
                            lineHeight: 1.55,
                            marginBottom: 6,
                          }}
                        >
                          &ldquo;
                          {bias.excerpt.length > 180
                            ? `${bias.excerpt.slice(0, 180)}…`
                            : bias.excerpt}
                          &rdquo;
                        </div>
                      )}
                      {bias.suggestion && (
                        <div
                          style={{
                            fontSize: 'var(--fs-sm)',
                            color: 'var(--text-primary)',
                            lineHeight: 1.55,
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>Harden with:</span> {bias.suggestion}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {isFree && (
            <div
              style={{
                marginTop: 24,
                padding: '16px 20px',
                background: 'var(--bg-secondary)',
                border: '1px dashed var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <Lock size={16} style={{ color: 'var(--text-muted)' }} aria-hidden />
              <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  Excerpts and mitigation playbooks unlock with the audit.
                </span>{' '}
                Plus 19 regulatory framework citations + Decision Provenance Record PDF.
              </div>
            </div>
          )}
        </section>
      )}

      {/* PRIMARY CTA */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        {primaryAction.onClick && (
          <button
            type="button"
            onClick={primaryAction.onClick}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '14px 28px',
              background: 'var(--accent-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--fs-md)',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(22,163,74,0.18)',
            }}
          >
            <PrimaryIcon size={16} aria-hidden />
            {primaryAction.label}
          </button>
        )}
        {!isFree && onEnterRehearsal && (
          <button
            type="button"
            onClick={onEnterRehearsal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 22px',
              background: 'transparent',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--fs-sm)',
              fontWeight: 500,
              cursor: 'pointer',
            }}
            title="Walking into the room? Switch to Rehearsal mode for predicted Skeptic questions + What-If simulator."
          >
            Rehearse for the room
            <ArrowRight size={14} aria-hidden />
          </button>
        )}
      </div>

      {/* Tiny calibration / outcome-gate prompt */}
      <p
        style={{
          fontSize: 'var(--fs-xs)',
          color: 'var(--text-muted)',
          maxWidth: 520,
          margin: 0,
          lineHeight: 1.55,
        }}
      >
        Your closed outcome teaches the platform YOUR decision pattern. After 3 outcomes,
        the audit calibrates to you — not the generic 143-case library.
      </p>

      <style jsx>{`
        @media (max-width: 700px) {
          .discovery-hook-grade {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .discovery-hook-flag {
            grid-template-columns: 32px 1fr !important;
            gap: 12px !important;
          }
        }
      `}</style>
    </article>
  );
}
