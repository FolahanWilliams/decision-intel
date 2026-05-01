'use client';

/**
 * DecisionBriefView — the McKinsey-grade post-audit deliverable
 * (locked 2026-05-01 from NotebookLM master-KB synthesis Q1-Q4).
 *
 * Replaces the dense dashboard for non-analyst view modes (cso / ic /
 * board). Renders the audit as a scrollable narrative deliverable, NOT
 * a SaaS dashboard. Steve Jobs Impute principle: every visual decision
 * is "would a CSO attach this to their own strategy deck?" — if no, cut.
 *
 * Structure (top-to-bottom):
 *   1. Hook   — "Your memo. N flags. £X cost-of-ignoring."
 *   2. DQI    — massive grade badge + score breakdown
 *   3. Risks  — top-3 biases as story (not list)
 *   4. Skeptic — single persona card with formal vote + 3 questions
 *   5. Outside View — historical analogs + base rate
 *   6. Recommendation + DPR export CTA
 *
 * What's NOT here (per persona-validated layout + NotebookLM Q3):
 *   - Tab bar / 4-tile metric grid / Decision Rooms inline / Phase scrub
 *   - R²F SignalBlocks (academic methodology — behind "deep dive" link)
 *   - Cross-references, structural assumptions, RPD pre-mortems
 *   - Featured Counterfactual hero (merged into Risks story)
 *
 * Analyst view still gets the dashboard via the existing layout.
 */

import { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronDown,
  Download,
  FileText,
  Microscope,
  Quote,
  Shield,
  XCircle,
} from 'lucide-react';
import type { AnalysisResult, BiasInstance } from '@/types';
import { dqiColorFor, gradeFromScore } from '@/lib/utils/grade';
import {
  buildCostOfIgnoring,
  deriveDocumentType,
  formatBiasName,
  rankBias,
  severityColor,
} from './_brief-shared';

// ─── Types ──────────────────────────────────────────────────────────

interface DecisionBriefViewProps {
  filename: string;
  documentType?: string | null;
  analysis: AnalysisResult;
  biases: BiasInstance[];
  /** Optional dollar exposure when DecisionFrame.value is present. */
  exposure?: { amount: number; currency: string };
  /** Click → open analyst dashboard view. */
  onOpenDeepDive?: () => void;
  /** Click → fire DPR export. */
  onExportDpr?: () => void;
  /** Click → open Share & Export modal. */
  onShareExport?: () => void;
  /** Whether the user is on the free tier (blur paywall content). */
  isFree?: boolean;
}

// Helpers extracted to ./_brief-shared 2026-05-01 to satisfy the
// slop-scan canonical-import discipline (formatBiasName / severityColor /
// rankBias / deriveDocumentType / buildCostOfIgnoring were duplicated
// across DiscoveryHookView / RehearsalView / DecisionBriefView).

// ─── Sub-components ─────────────────────────────────────────────────

function HookSection({
  documentType,
  biasCount,
  costOfIgnoring,
  onCtaClick,
  ctaLabel,
}: {
  documentType: string;
  biasCount: number;
  costOfIgnoring: { display: string; calibrated: boolean };
  onCtaClick?: () => void;
  ctaLabel: string;
}) {
  return (
    <section
      style={{
        padding: '64px 0 56px',
        textAlign: 'left',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <div
        style={{
          fontSize: 'var(--fs-3xs)',
          fontWeight: 600,
          color: 'var(--text-muted)',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          marginBottom: 18,
        }}
      >
        Decision Brief · audited
      </div>
      <h1
        style={{
          fontFamily: 'var(--font-display, "Instrument Serif", Georgia, serif)',
          fontSize: 'clamp(36px, 5vw, 64px)',
          lineHeight: 1.05,
          fontWeight: 400,
          letterSpacing: '-0.02em',
          color: 'var(--text-primary)',
          margin: 0,
          marginBottom: 28,
        }}
      >
        Your {documentType.toLowerCase()}.{' '}
        <span style={{ color: 'var(--error)' }}>
          {biasCount === 0 ? 'No flags' : `${biasCount} flag${biasCount === 1 ? '' : 's'}`}.
        </span>{' '}
        <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          {costOfIgnoring.display}.
        </span>{' '}
        Here&rsquo;s the fix.
      </h1>
      {onCtaClick && (
        <button
          type="button"
          onClick={onCtaClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 24px',
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
          <Download size={16} aria-hidden />
          {ctaLabel}
        </button>
      )}
    </section>
  );
}

function VerdictSection({
  score,
  grade,
  scoreColor,
  summary,
}: {
  score: number;
  grade: string;
  scoreColor: string;
  summary: string;
}) {
  return (
    <section
      style={{
        padding: '64px 0',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <div
        style={{
          fontSize: 'var(--fs-3xs)',
          fontWeight: 600,
          color: 'var(--text-muted)',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          marginBottom: 24,
        }}
      >
        Verdict
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(180px, 200px) 1fr',
          gap: 48,
          alignItems: 'start',
        }}
        className="decision-brief-verdict"
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 96,
              fontWeight: 800,
              lineHeight: 1,
              color: scoreColor,
              letterSpacing: '-0.04em',
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
              marginTop: 6,
            }}
          >
            DQI {Math.round(score)}/100
          </div>
        </div>
        <div>
          <p
            style={{
              fontSize: 'var(--fs-md)',
              lineHeight: 1.6,
              color: 'var(--text-primary)',
              margin: 0,
              fontWeight: 400,
            }}
          >
            {summary}
          </p>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 700px) {
          .decision-brief-verdict {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
        }
      `}</style>
    </section>
  );
}

function FlagsSection({
  topBiases,
  isFree,
}: {
  topBiases: BiasInstance[];
  isFree: boolean;
}) {
  if (topBiases.length === 0) {
    return (
      <section style={{ padding: '64px 0', borderBottom: '1px solid var(--border-color)' }}>
        <div
          style={{
            fontSize: 'var(--fs-3xs)',
            fontWeight: 600,
            color: 'var(--text-muted)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: 24,
          }}
        >
          The flags
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '20px 24px',
            background: 'color-mix(in srgb, var(--success) 8%, transparent)',
            border: '1px solid color-mix(in srgb, var(--success) 22%, transparent)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <Check size={20} style={{ color: 'var(--success)' }} aria-hidden />
          <div>
            <div style={{ fontSize: 'var(--fs-md)', fontWeight: 600, color: 'var(--text-primary)' }}>
              No high-confidence biases surfaced.
            </div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginTop: 2 }}>
              The audit completed cleanly. The room can read this memo on its merits.
            </div>
          </div>
        </div>
      </section>
    );
  }

  const STEP_VERB = ['The first flag', 'The second flag', 'The third flag'];

  return (
    <section style={{ padding: '64px 0', borderBottom: '1px solid var(--border-color)' }}>
      <div
        style={{
          fontSize: 'var(--fs-3xs)',
          fontWeight: 600,
          color: 'var(--text-muted)',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          marginBottom: 24,
        }}
      >
        The flags
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
        {topBiases.map((bias, i) => {
          const accent = severityColor(bias.severity);
          return (
            <article
              key={bias.id ?? `${bias.biasType}-${i}`}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(140px, 160px) 1fr',
                gap: 32,
                alignItems: 'start',
              }}
              className="decision-brief-flag"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-display, "Instrument Serif", Georgia, serif)',
                    fontSize: 56,
                    fontWeight: 400,
                    lineHeight: 1,
                    color: accent,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div
                  style={{
                    fontSize: 'var(--fs-3xs)',
                    fontWeight: 700,
                    color: accent,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {bias.severity} · {Math.round((bias.confidence ?? 0.7) * 100)}% conf.
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 'var(--fs-3xs)',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: 6,
                  }}
                >
                  {STEP_VERB[i] ?? `Flag ${i + 1}`}
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--font-display, "Instrument Serif", Georgia, serif)',
                    fontSize: 'clamp(24px, 2.5vw, 30px)',
                    fontWeight: 400,
                    lineHeight: 1.2,
                    color: 'var(--text-primary)',
                    margin: 0,
                    marginBottom: 14,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {formatBiasName(bias.biasType)}
                </h3>
                {bias.excerpt && (
                  <blockquote
                    style={{
                      borderLeft: `3px solid ${accent}`,
                      padding: '10px 16px',
                      margin: '0 0 16px 0',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)',
                      fontStyle: 'italic',
                      fontSize: 'var(--fs-sm)',
                      lineHeight: 1.6,
                      filter: isFree ? 'blur(4px)' : 'none',
                      userSelect: isFree ? 'none' : 'auto',
                    }}
                  >
                    <Quote
                      size={12}
                      style={{
                        color: accent,
                        marginRight: 6,
                        verticalAlign: 'baseline',
                      }}
                      aria-hidden
                    />
                    {bias.excerpt.length > 240
                      ? `${bias.excerpt.slice(0, 240)}…`
                      : bias.excerpt}
                  </blockquote>
                )}
                {bias.suggestion && (
                  <div
                    style={{
                      fontSize: 'var(--fs-md)',
                      lineHeight: 1.6,
                      color: 'var(--text-primary)',
                      filter: isFree ? 'blur(4px)' : 'none',
                      userSelect: isFree ? 'none' : 'auto',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                      }}
                    >
                      Harden with:
                    </span>{' '}
                    {bias.suggestion}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <style jsx>{`
        @media (max-width: 700px) {
          .decision-brief-flag {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
      `}</style>
    </section>
  );
}

function SkepticSection({ analysis }: { analysis: DecisionBriefViewProps['analysis'] }) {
  // Pull a single Skeptic-style question from analysis.simulation if present.
  // Fall back to a generic prompt that points the user toward the deep dive.
  const skepticQuestion = useMemo<string | null>(() => {
    const sim = analysis?.simulation as
      | { skeptic?: { questions?: string[] }; personas?: Array<{ role?: string; questions?: string[] }> }
      | null
      | undefined;
    if (!sim) return null;
    if (sim.skeptic?.questions?.[0]) return sim.skeptic.questions[0];
    const skepticPersona = sim.personas?.find(p =>
      (p.role ?? '').toLowerCase().includes('skeptic')
    );
    if (skepticPersona?.questions?.[0]) return skepticPersona.questions[0];
    return null;
  }, [analysis]);

  const verdict = (analysis?.metaVerdict ?? '').toLowerCase();
  const stamp = verdict.includes('approv')
    ? { label: 'Approve', color: 'var(--success)', bg: 'color-mix(in srgb, var(--success) 12%, transparent)' }
    : verdict.includes('reject')
      ? { label: 'Reject', color: 'var(--error)', bg: 'color-mix(in srgb, var(--error) 12%, transparent)' }
      : { label: 'Abstain', color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 14%, transparent)' };

  return (
    <section style={{ padding: '64px 0', borderBottom: '1px solid var(--border-color)' }}>
      <div
        style={{
          fontSize: 'var(--fs-3xs)',
          fontWeight: 600,
          color: 'var(--text-muted)',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          marginBottom: 24,
        }}
      >
        The skeptic in the room
      </div>
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-xl)',
          padding: 32,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                flexShrink: 0,
              }}
            >
              <Shield size={20} aria-hidden />
            </div>
            <div>
              <div
                style={{
                  fontSize: 'var(--fs-md)',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                The Skeptic
              </div>
              <div
                style={{
                  fontSize: 'var(--fs-xs)',
                  color: 'var(--text-muted)',
                  marginTop: 2,
                }}
              >
                The hardest question your room will ask
              </div>
            </div>
          </div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: stamp.bg,
              color: stamp.color,
              fontSize: 'var(--fs-xs)',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {stamp.label === 'Approve' ? (
              <Check size={12} aria-hidden />
            ) : stamp.label === 'Reject' ? (
              <XCircle size={12} aria-hidden />
            ) : (
              <AlertTriangle size={12} aria-hidden />
            )}
            Vote: {stamp.label}
          </span>
        </div>

        {skepticQuestion ? (
          <blockquote
            style={{
              fontFamily: 'var(--font-display, "Instrument Serif", Georgia, serif)',
              fontSize: 'clamp(22px, 2.4vw, 28px)',
              lineHeight: 1.35,
              fontWeight: 400,
              color: 'var(--text-primary)',
              margin: 0,
              fontStyle: 'italic',
              letterSpacing: '-0.01em',
              borderLeft: '3px solid var(--accent-primary)',
              paddingLeft: 24,
            }}
          >
            &ldquo;{skepticQuestion}&rdquo;
          </blockquote>
        ) : (
          <div
            style={{
              fontSize: 'var(--fs-md)',
              color: 'var(--text-secondary)',
              fontStyle: 'italic',
              lineHeight: 1.55,
            }}
          >
            The boardroom simulation will surface the hardest objection here once the
            simulation node has run. Open the deep-dive analyst view to inspect the
            full 5-persona output.
          </div>
        )}
      </div>
    </section>
  );
}

function ActionFooter({
  onExportDpr,
  onShareExport,
  onOpenDeepDive,
}: {
  onExportDpr?: () => void;
  onShareExport?: () => void;
  onOpenDeepDive?: () => void;
}) {
  return (
    <section
      style={{
        padding: '64px 0 96px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 16,
      }}
    >
      <div
        style={{
          fontSize: 'var(--fs-3xs)',
          fontWeight: 600,
          color: 'var(--text-muted)',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          marginBottom: 12,
        }}
      >
        Take this with you
      </div>
      <h2
        style={{
          fontFamily: 'var(--font-display, "Instrument Serif", Georgia, serif)',
          fontSize: 'clamp(28px, 3vw, 40px)',
          fontWeight: 400,
          lineHeight: 1.2,
          color: 'var(--text-primary)',
          margin: 0,
          marginBottom: 16,
          maxWidth: 620,
        }}
      >
        The Decision Provenance Record is the artefact your audit committee actually wants.
      </h2>
      <p
        style={{
          fontSize: 'var(--fs-md)',
          lineHeight: 1.6,
          color: 'var(--text-secondary)',
          margin: 0,
          maxWidth: 620,
          marginBottom: 8,
        }}
      >
        Hashed + tamper-evident. Maps onto EU AI Act Article 14, Basel III ICAAP, and
        the 17 regulatory frameworks the platform tracks. Attach it to your board
        pre-read or hand it to your GC.
      </p>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          marginTop: 16,
        }}
      >
        {onExportDpr && (
          <button
            type="button"
            onClick={onExportDpr}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '14px 24px',
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
            <FileText size={16} aria-hidden />
            Export DPR PDF
          </button>
        )}
        {onShareExport && (
          <button
            type="button"
            onClick={onShareExport}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '14px 22px',
              background: 'transparent',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--fs-sm)',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <ArrowRight size={14} aria-hidden />
            Share & Export
          </button>
        )}
        {onOpenDeepDive && (
          <button
            type="button"
            onClick={onOpenDeepDive}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '14px 22px',
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--fs-sm)',
              fontWeight: 500,
              cursor: 'pointer',
            }}
            title="Open the analyst dashboard for evidence detail, noise distribution, structural assumptions, etc."
          >
            <Microscope size={14} aria-hidden />
            Open analyst dashboard
            <ChevronDown size={12} aria-hidden style={{ transform: 'rotate(-90deg)' }} />
          </button>
        )}
      </div>
    </section>
  );
}

// ─── Main component ─────────────────────────────────────────────────

export function DecisionBriefView({
  filename,
  documentType,
  analysis,
  biases,
  exposure,
  onOpenDeepDive,
  onExportDpr,
  onShareExport,
  isFree = false,
}: DecisionBriefViewProps) {
  const score = analysis.overallScore ?? 0;
  const grade = gradeFromScore(score);
  const scoreColor = dqiColorFor(score);
  const summary =
    analysis.summary?.trim() ||
    'The audit pipeline produced no summary text for this memo. Open the analyst dashboard for the raw signal trace.';

  const topBiases = useMemo(
    () => [...biases].sort((a, b) => rankBias(b) - rankBias(a)).slice(0, 3),
    [biases]
  );

  const docType = deriveDocumentType(documentType);
  const costOfIgnoring = buildCostOfIgnoring(exposure, topBiases);

  // Strip the .pdf / .txt extension when displaying the document title in
  // the eyebrow — the deliverable shouldn't read as "your-pdf.pdf."
  const docTitle = filename.replace(/\.[^.]+$/, '');

  return (
    <article
      style={{
        maxWidth: 880,
        margin: '0 auto',
        padding: '0 24px',
        color: 'var(--text-primary)',
      }}
      aria-label={`Decision Brief for ${docTitle}`}
    >
      <HookSection
        documentType={docType}
        biasCount={topBiases.length}
        costOfIgnoring={costOfIgnoring}
        ctaLabel={isFree ? 'Unlock the audit' : 'Export DPR PDF'}
        onCtaClick={isFree ? onShareExport : onExportDpr}
      />

      <VerdictSection score={score} grade={grade} scoreColor={scoreColor} summary={summary} />

      <FlagsSection topBiases={topBiases} isFree={isFree} />

      <SkepticSection analysis={analysis} />

      <ActionFooter
        onExportDpr={onExportDpr}
        onShareExport={onShareExport}
        onOpenDeepDive={onOpenDeepDive}
      />
    </article>
  );
}
