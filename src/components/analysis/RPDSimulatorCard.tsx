'use client';

import { useState } from 'react';
import {
  Compass,
  Loader2,
  Sparkle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  History,
  Telescope,
  ChevronRight,
} from 'lucide-react';
import type { RpdSimulationResult } from '@/types';

// RPD Simulator card (G24 deep, locked 2026-04-27).
//
// Klein's Recognition-Primed Decision framework as a clickable proof point.
// The audit pipeline already implements RPD on the server (rpdRecognition
// node + /api/rpd-simulator endpoint); this card surfaces it to the buyer.
//
// Buyer scenario: a CSO viewing an audited memo on /documents/[id]. The
// audit flagged confirmation_bias + groupthink. She's leaning toward
// "Acquire Acme for $50M Q3." She wants to know: what did historical
// analogs (Time Warner-AOL, Daimler-Chrysler, etc.) do, and what happened?
//
// UX: free-text input (lets the buyer phrase the action in their own
// language) + 3 suggestion chips (low-cost starting points for users
// staring at a blank box). Output renders 7 distinct sections so the
// reader can scan top-down: recommendation badge → mental simulation →
// key assumptions → critical failure points → historical analogs →
// expert perspective → optional modification suggestion.

interface RPDSimulatorCardProps {
  documentId: string;
  /** Optional pre-fill (e.g. from a deep-link or copy-write). */
  initialAction?: string;
}

const SUGGESTION_CHIPS = [
  { label: 'Acquire Acme for $50M Q3', value: 'Acquire Acme for $50M with closing in Q3' },
  {
    label: 'Enter Brazil market by Q4',
    value: 'Enter the Brazil market by Q4 with a local sales team',
  },
  {
    label: 'Reorganize team into pods',
    value: 'Reorganize the engineering team into 5 cross-functional pods',
  },
];

const REC_STYLES: Record<
  RpdSimulationResult['recommendation'],
  { color: string; bg: string; border: string; icon: typeof CheckCircle2; label: string }
> = {
  PROCEED: {
    color: 'var(--success)',
    bg: 'rgba(34, 197, 94, 0.08)',
    border: 'rgba(34, 197, 94, 0.3)',
    icon: CheckCircle2,
    label: 'Proceed',
  },
  MODIFY: {
    color: 'var(--warning)',
    bg: 'rgba(245, 158, 11, 0.08)',
    border: 'rgba(245, 158, 11, 0.3)',
    icon: AlertTriangle,
    label: 'Modify before proceeding',
  },
  ABANDON: {
    color: 'var(--error)',
    bg: 'rgba(239, 68, 68, 0.08)',
    border: 'rgba(239, 68, 68, 0.3)',
    icon: XCircle,
    label: 'Abandon',
  },
};

function ConfidenceMeter({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          width: 80,
          height: 6,
          background: 'var(--bg-card-hover)',
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background:
              pct >= 70
                ? 'var(--success)'
                : pct >= 40
                  ? 'var(--warning)'
                  : 'var(--error)',
            borderRadius: 999,
            transition: 'width 0.4s',
          }}
        />
      </div>
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--text-primary)',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {pct}%
      </span>
    </div>
  );
}

function SimilarityBadge({ similarity }: { similarity: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, similarity)) * 100);
  const color = pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--text-muted)';
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: '2px 6px',
        borderRadius: 999,
        background: 'var(--bg-card)',
        color,
        border: `1px solid ${color}`,
        fontFamily: "'JetBrains Mono', monospace",
        whiteSpace: 'nowrap',
      }}
    >
      {pct}% match
    </span>
  );
}

export function RPDSimulatorCard({ documentId, initialAction = '' }: RPDSimulatorCardProps) {
  const [action, setAction] = useState(initialAction);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RpdSimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    if (!action.trim() || running) return;
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/rpd-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, chosenAction: action.trim() }),
      });
      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errData.error ?? `Simulation failed (${res.status})`);
      }
      const data = (await res.json()) as RpdSimulationResult;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'RPD simulation failed');
    } finally {
      setRunning(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <section
      className="card"
      aria-labelledby="rpd-simulator-heading"
      style={{ marginTop: 'var(--spacing-lg)' }}
    >
      <div className="card-body">
        {/* Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            marginBottom: 'var(--spacing-md)',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(99, 102, 241, 0.12)',
              color: '#a5b4fc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Compass size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              id="rpd-simulator-heading"
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              RPD Simulator
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Klein · Recognition-Primed Decision
              </span>
            </h2>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 13,
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              Test the action you&apos;re leaning toward. The simulator pulls the closest
              historical analogs from the case library, simulates the call forward, and tells you
              what the comparable firms got right and got wrong.
            </p>
          </div>
        </header>

        {/* Input + suggestions */}
        {!result && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              marginBottom: 'var(--spacing-md)',
            }}
          >
            <label
              htmlFor="rpd-action-input"
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              What action are you leaning toward?
            </label>
            <textarea
              id="rpd-action-input"
              value={action}
              onChange={e => setAction(e.target.value)}
              placeholder="e.g. Acquire Acme for $50M with closing in Q3, or enter Brazil market with a local sales team"
              rows={3}
              maxLength={500}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--bg-card-hover)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: 13,
                lineHeight: 1.5,
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
              disabled={running}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                fontSize: 11,
                color: 'var(--text-muted)',
              }}
            >
              <span>{action.length}/500</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                rate-limit: 5 simulations / hour
              </span>
            </div>

            {/* Suggestion chips — lower the blank-box friction. */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  marginRight: 4,
                }}
              >
                Or start with:
              </span>
              {SUGGESTION_CHIPS.map(chip => (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setAction(chip.value)}
                  disabled={running}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card-hover)',
                    color: 'var(--text-secondary)',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: running ? 'not-allowed' : 'pointer',
                    opacity: running ? 0.5 : 1,
                  }}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Run button */}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                type="button"
                onClick={handleRun}
                disabled={!action.trim() || running}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-primary)',
                  color: '#fff',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: !action.trim() || running ? 'not-allowed' : 'pointer',
                  opacity: !action.trim() || running ? 0.6 : 1,
                }}
              >
                {running ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Sparkle size={14} />
                )}
                {running ? 'Simulating…' : 'Run RPD simulation'}
              </button>
            </div>

            {error && (
              <div
                role="alert"
                style={{
                  marginTop: 4,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: 'var(--error)',
                  fontSize: 12,
                }}
              >
                {error}
              </div>
            )}
          </div>
        )}

        {/* Result */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {/* Recommendation badge */}
            {(() => {
              const rec = REC_STYLES[result.recommendation];
              const Icon = rec.icon;
              return (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: rec.bg,
                    border: `1px solid ${rec.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <Icon size={18} style={{ color: rec.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: rec.color,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      Recommendation
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {rec.label}
                    </div>
                  </div>
                  <ConfidenceMeter value={result.mentalSimulation.confidenceLevel} />
                </div>
              );
            })()}

            {/* Mental simulation */}
            <div>
              <div className="section-heading" style={{ marginBottom: 8 }}>
                Likely outcome · {result.mentalSimulation.timeHorizon}
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {result.mentalSimulation.likelyOutcome}
              </p>
            </div>

            {/* Key assumptions + Critical failure points */}
            <div
              className="rpd-detail-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--spacing-md)',
              }}
            >
              <div>
                <div className="section-heading" style={{ marginBottom: 8 }}>
                  Key assumptions to validate
                </div>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 18,
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  {result.mentalSimulation.keyAssumptions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div
                  className="section-heading"
                  style={{ marginBottom: 8, color: 'var(--error)' }}
                >
                  Critical failure points
                </div>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 18,
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  {result.mentalSimulation.criticalFailurePoints.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Historical analogs */}
            {result.historicalAnalogs.length > 0 ? (
              <div>
                <div
                  className="section-heading"
                  style={{
                    marginBottom: 4,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <History size={12} />
                  Historical analogs · {result.historicalAnalogs.length}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    marginBottom: 8,
                    fontStyle: 'italic',
                  }}
                >
                  Pulled from the Decision Intel 135-case reference library, ranked by structural
                  similarity to your current decision.
                </div>
                <div
                  className="rpd-analogs-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: 8,
                  }}
                >
                  {result.historicalAnalogs.map((analog, i) => (
                    <div
                      key={i}
                      style={{
                        padding: 10,
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-card)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            lineHeight: 1.3,
                          }}
                        >
                          {analog.dealTitle}
                        </span>
                        <SimilarityBadge similarity={analog.similarity} />
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          fontStyle: 'italic',
                          lineHeight: 1.4,
                        }}
                      >
                        Action: {analog.action}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-secondary)',
                          lineHeight: 1.4,
                        }}
                      >
                        <strong style={{ color: 'var(--text-primary)' }}>Outcome:</strong>{' '}
                        {analog.outcome}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: 12,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card-hover)',
                  border: '1px dashed var(--border-color)',
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                }}
              >
                <History size={12} style={{ display: 'inline', marginRight: 6 }} />
                No close analogs in the 135-case library — your action is structurally novel.
                The recommendation above relies more heavily on the mental simulation than on
                pattern matching; treat it as directional guidance and validate the assumptions
                deliberately.
              </div>
            )}

            {/* Expert perspective */}
            {result.expertPerspective && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card-hover)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                <Telescope
                  size={16}
                  style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }}
                />
                <div>
                  <div className="section-heading" style={{ marginBottom: 4 }}>
                    Expert perspective
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                    }}
                  >
                    {result.expertPerspective}
                  </p>
                </div>
              </div>
            )}

            {/* Modification suggestion */}
            {result.recommendation === 'MODIFY' && result.modificationSuggestion && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(245, 158, 11, 0.06)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                }}
              >
                <div
                  className="section-heading"
                  style={{ marginBottom: 4, color: 'var(--warning)' }}
                >
                  Suggested modification
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                  }}
                >
                  {result.modificationSuggestion}
                </p>
              </div>
            )}

            {/* Reset / re-run */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <ChevronRight size={12} style={{ transform: 'rotate(180deg)' }} />
                Try a different action
              </button>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @media (max-width: 640px) {
          .rpd-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
