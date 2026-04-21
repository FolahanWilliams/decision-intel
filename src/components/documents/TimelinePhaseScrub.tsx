'use client';

/**
 * TimelinePhaseScrub — the temporal axis for a single decision. Three
 * positions that capture the product's actual story:
 *
 *   • Before  — what the platform thinks about the memo today (the full
 *                analyst/cso/board experience; default state, renders the
 *                existing tabbed content unchanged).
 *   • During  — what the user actually decided to do with it. This is the
 *                Human Decision / journal-entry moment. If nothing is
 *                logged, the panel prompts one.
 *   • After   — the outcome + recalibrated DQI + Brier + lessons. If no
 *                outcome has landed, the panel prompts one.
 *
 * Persists via ?phase=before|during|after on the URL plus localStorage so
 * a user stays on the same phase as they navigate between documents.
 *
 * The scrub component only owns the control strip. The phase-specific
 * panels live below (PhaseDuringPanel, PhaseAfterPanel) and are rendered
 * conditionally by the document-detail page.
 */

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowRight, Circle, PenLine, Target, TrendingUp, Activity } from 'lucide-react';

export type DocumentPhase = 'before' | 'during' | 'after';

const PHASES: Array<{
  key: DocumentPhase;
  label: string;
  hint: string;
}> = [
  { key: 'before', label: 'Before outcome', hint: 'What the platform thinks now' },
  { key: 'during', label: 'What you decided', hint: 'The human-decision record' },
  { key: 'after', label: 'After outcome', hint: 'Recalibrated DQI + Brier + lessons' },
];

interface TimelinePhaseScrubProps {
  phase: DocumentPhase;
  onChange: (next: DocumentPhase) => void;
}

export function TimelinePhaseScrub({ phase, onChange }: TimelinePhaseScrubProps) {
  const activeIdx = PHASES.findIndex(p => p.key === phase);
  // Progress line — 0 -> 50 -> 100% depending on position. Gives the
  // control the feel of a scrubber, not just a segmented pill set.
  const progressPct = activeIdx === 0 ? 0 : activeIdx === 1 ? 50 : 100;

  return (
    <div
      role="tablist"
      aria-label="Decision phase"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '16px 18px',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        marginBottom: 'var(--spacing-md)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Activity size={12} /> Decision timeline
        </span>
        <span style={{ letterSpacing: 0, textTransform: 'none', fontWeight: 500 }}>
          {PHASES[activeIdx]?.hint}
        </span>
      </div>

      {/* Rail with dots + progress line */}
      <div style={{ position: 'relative', height: 36 }}>
        {/* Track */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '50%',
            left: 16,
            right: 16,
            height: 2,
            background: 'var(--border-color)',
            transform: 'translateY(-50%)',
            borderRadius: 1,
          }}
        />
        {/* Progress */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '50%',
            left: 16,
            width: `calc(${progressPct}% - ${progressPct > 0 ? 16 : 0}px + ${progressPct === 100 ? 16 : 0}px)`,
            height: 2,
            background: 'var(--accent-primary)',
            transform: 'translateY(-50%)',
            borderRadius: 1,
            transition: 'width 0.35s cubic-bezier(.22,1,.36,1)',
          }}
        />
        <div
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '100%',
          }}
        >
          {PHASES.map((p, i) => {
            const isActive = p.key === phase;
            const isPast = i < activeIdx;
            const dotStyle: CSSProperties = {
              width: 28,
              height: 28,
              borderRadius: '50%',
              background:
                isActive || isPast
                  ? 'var(--accent-primary)'
                  : 'var(--bg-card)',
              border: `2px solid ${
                isActive || isPast
                  ? 'var(--accent-primary)'
                  : 'var(--border-color)'
              }`,
              color: isActive || isPast ? '#ffffff' : 'var(--text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: isActive
                ? '0 0 0 4px rgba(22,163,74,0.18), var(--shadow-sm)'
                : 'none',
            };
            return (
              <button
                key={p.key}
                role="tab"
                aria-selected={isActive}
                aria-label={p.label}
                onClick={() => onChange(p.key)}
                style={dotStyle}
                title={p.hint}
              >
                <Circle size={8} fill="currentColor" strokeWidth={0} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Labels row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 12.5,
          fontWeight: 600,
        }}
      >
        {PHASES.map(p => {
          const isActive = p.key === phase;
          return (
            <button
              key={p.key}
              onClick={() => onChange(p.key)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
                transition: 'color 0.2s',
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── PhaseDuringPanel ────────────────────────────────────────────────

interface PhaseDuringPanelProps {
  documentId: string;
  analysisId?: string;
  hasHumanDecision?: boolean;
  humanDecisionSummary?: string;
  humanDecisionDate?: string;
}

export function PhaseDuringPanel({
  documentId,
  analysisId,
  hasHumanDecision = false,
  humanDecisionSummary,
  humanDecisionDate,
}: PhaseDuringPanelProps) {
  if (hasHumanDecision && humanDecisionSummary) {
    return (
      <div
        className="card"
        style={{
          borderLeft: '3px solid var(--accent-primary)',
          marginBottom: 'var(--spacing-md)',
        }}
      >
        <div className="card-body">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 10,
            }}
          >
            <PenLine size={18} style={{ color: 'var(--accent-primary)' }} />
            <h3
              style={{
                fontSize: 17,
                fontWeight: 700,
                margin: 0,
                color: 'var(--text-primary)',
              }}
            >
              What you decided
            </h3>
            {humanDecisionDate && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  marginLeft: 'auto',
                }}
              >
                Logged {humanDecisionDate}
              </span>
            )}
          </div>
          <p
            style={{
              fontSize: 14.5,
              lineHeight: 1.7,
              color: 'var(--text-secondary)',
              marginBottom: 14,
              whiteSpace: 'pre-wrap',
            }}
          >
            {humanDecisionSummary}
          </p>
          <Link
            href="/dashboard/decision-log"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--accent-primary)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Open Decision Log <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{
        border: '1px dashed var(--border-color)',
        background: 'var(--bg-tertiary)',
        marginBottom: 'var(--spacing-md)',
      }}
    >
      <div className="card-body" style={{ textAlign: 'center', padding: '36px 24px' }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'rgba(22,163,74,0.1)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 14,
          }}
        >
          <PenLine size={22} style={{ color: 'var(--accent-primary)' }} />
        </div>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 8px',
          }}
        >
          You haven&rsquo;t logged the decision yet.
        </h3>
        <p
          style={{
            fontSize: 14,
            color: 'var(--text-secondary)',
            maxWidth: 480,
            margin: '0 auto 18px',
            lineHeight: 1.65,
          }}
        >
          When you commit to a direction — approve, modify, reject, escalate — log it here. The
          record becomes the anchor for outcome scoring 60/90 days from now, and the decision
          joins the Decision Knowledge Graph.
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <Link
            href={`/dashboard/cognitive-audits/submit?source=manual${
              analysisId ? `&analysisId=${analysisId}` : documentId ? `&documentId=${documentId}` : ''
            }`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-primary)',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Log this decision <ArrowRight size={13} />
          </Link>
          <Link
            href="/dashboard/decision-log"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Open Decision Log
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── PhaseAfterPanel ─────────────────────────────────────────────────

export interface RecalibratedDqiSummary {
  originalScore: number;
  recalibratedScore: number;
  delta: number;
  recalibratedGrade: string;
  brierScore?: number;
  brierCategory?: 'excellent' | 'good' | 'fair' | 'poor';
}

interface PhaseAfterPanelProps {
  documentId: string;
  analysisId?: string;
  hasOutcome?: boolean;
  recalibratedDqi?: RecalibratedDqiSummary;
  outcomeLabel?: string;
  lessonsLearned?: string;
}

const BRIER_COLOR: Record<
  NonNullable<RecalibratedDqiSummary['brierCategory']>,
  string
> = {
  excellent: '#16A34A',
  good: '#38BDF8',
  fair: '#F59E0B',
  poor: '#EF4444',
};

const BRIER_LABEL: Record<
  NonNullable<RecalibratedDqiSummary['brierCategory']>,
  string
> = {
  excellent: 'Superforecaster',
  good: 'Analyst',
  fair: 'Amateur',
  poor: 'Coin-flip',
};

export function PhaseAfterPanel({
  documentId,
  analysisId,
  hasOutcome = false,
  recalibratedDqi,
  outcomeLabel,
  lessonsLearned,
}: PhaseAfterPanelProps) {
  if (hasOutcome && recalibratedDqi) {
    const delta = recalibratedDqi.delta;
    const deltaColor =
      delta > 0 ? 'var(--success)' : delta < 0 ? 'var(--error)' : 'var(--text-muted)';
    const deltaSign = delta > 0 ? '+' : '';
    return (
      <div
        className="card"
        style={{
          borderLeft: '3px solid var(--accent-primary)',
          marginBottom: 'var(--spacing-md)',
        }}
      >
        <div className="card-body">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 14,
              flexWrap: 'wrap',
            }}
          >
            <TrendingUp size={18} style={{ color: 'var(--accent-primary)' }} />
            <h3
              style={{
                fontSize: 17,
                fontWeight: 700,
                margin: 0,
                color: 'var(--text-primary)',
              }}
            >
              After the outcome
            </h3>
            {outcomeLabel && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginLeft: 'auto',
                }}
              >
                {outcomeLabel}
              </span>
            )}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 16,
              marginBottom: 14,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: 4,
                }}
              >
                Original DQI
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: 'var(--text-secondary)',
                }}
              >
                {recalibratedDqi.originalScore.toFixed(0)}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: 4,
                }}
              >
                Recalibrated
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  display: 'inline-flex',
                  alignItems: 'baseline',
                  gap: 8,
                }}
              >
                {recalibratedDqi.recalibratedScore.toFixed(0)}
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>
                  · {recalibratedDqi.recalibratedGrade}
                </span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: deltaColor,
                  marginTop: 4,
                }}
              >
                {deltaSign}
                {delta.toFixed(1)} from original
              </div>
            </div>
            {recalibratedDqi.brierScore != null && recalibratedDqi.brierCategory && (
              <div>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: 4,
                  }}
                >
                  Brier
                </div>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: BRIER_COLOR[recalibratedDqi.brierCategory],
                  }}
                >
                  {recalibratedDqi.brierScore.toFixed(3)}
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: BRIER_COLOR[recalibratedDqi.brierCategory],
                    marginTop: 4,
                  }}
                >
                  {BRIER_LABEL[recalibratedDqi.brierCategory]}
                </div>
              </div>
            )}
          </div>
          {lessonsLearned && (
            <div
              style={{
                padding: 14,
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-tertiary)',
                fontSize: 14,
                lineHeight: 1.65,
                color: 'var(--text-secondary)',
              }}
            >
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: 6,
                }}
              >
                Lessons learned
              </div>
              {lessonsLearned}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{
        border: '1px dashed var(--border-color)',
        background: 'var(--bg-tertiary)',
        marginBottom: 'var(--spacing-md)',
      }}
    >
      <div className="card-body" style={{ textAlign: 'center', padding: '36px 24px' }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'rgba(22,163,74,0.1)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 14,
          }}
        >
          <Target size={22} style={{ color: 'var(--accent-primary)' }} />
        </div>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 8px',
          }}
        >
          No outcome logged yet.
        </h3>
        <p
          style={{
            fontSize: 14,
            color: 'var(--text-secondary)',
            maxWidth: 480,
            margin: '0 auto 18px',
            lineHeight: 1.65,
          }}
        >
          When the real-world result lands — deal closed, initiative shipped, recommendation
          accepted or rejected — report it here. Decision Intel recalibrates the DQI, scores
          a Brier, and feeds the lesson back into the Knowledge Graph so every future call
          inherits this one&rsquo;s signal.
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <Link
            href={`/dashboard/outcome-flywheel${
              analysisId ? `?analysisId=${analysisId}` : documentId ? `?documentId=${documentId}` : ''
            }`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-primary)',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Report outcome <ArrowRight size={13} />
          </Link>
          <Link
            href="/dashboard/outcome-flywheel"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Open Flywheel
          </Link>
        </div>
      </div>
    </div>
  );
}
