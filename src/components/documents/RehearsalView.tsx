'use client';

/**
 * RehearsalView — State 2 of the document detail page state machine.
 *
 * The user's intent: "Walking into committee in 10 minutes — what will they ask?"
 *
 * Auto-renders for: returning visit + outcome status pending.
 *
 * Locked 2026-05-01 from NotebookLM Q5 synthesis. The shock-value of the
 * grade shrinks to a persistent compact header. The page adapts to tactical
 * preparation:
 *
 *   - Skeptic persona card extracted from the 5-persona boardroom (Q4
 *     synthesis: never chat format — that triggers ChatGPT-wrapper
 *     suspicion). Formal vote stamp + 3 adversarial questions.
 *   - What-If counterfactual slider: toggle off the top bias and watch
 *     the projected DQI recover (Q5 mechanic for verbal defense rehearsal).
 *   - Top-3 fixes restated as one-liners the user can practice saying out
 *     loud before walking into the room.
 *
 * What's HIDDEN here that's in Discovery: the giant grade letter, the
 * dominant hook line, the paywall blur. The user has been here before;
 * they don't need re-shocking. They need ammo.
 */

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Mic2,
  RotateCcw,
  Shield,
  XCircle,
} from 'lucide-react';
import type { AnalysisResult, BiasInstance } from '@/types';
import { dqiColorFor, gradeFromScore } from '@/lib/utils/grade';
import {
  biasUplift,
  formatBiasName,
  rankBias,
  severityColor,
} from './_brief-shared';

interface RehearsalViewProps {
  filename: string;
  documentType?: string | null;
  analysis: AnalysisResult;
  biases: BiasInstance[];
  /** Click → go back to discovery framing. */
  onEnterDiscovery?: () => void;
  /** Click → go to provenance / DPR export. */
  onEnterProvenance?: () => void;
  /** Click → fire DPR export. */
  onExportDpr?: () => void;
}

export function RehearsalView({
  filename: _filename,
  documentType: _documentType,
  analysis,
  biases,
  onEnterDiscovery,
  onEnterProvenance,
  onExportDpr,
}: RehearsalViewProps) {
  const score = analysis.overallScore ?? 0;
  const grade = gradeFromScore(score);
  const scoreColor = dqiColorFor(score);

  const topBiases = useMemo(
    () => [...biases].sort((a, b) => rankBias(b) - rankBias(a)).slice(0, 3),
    [biases]
  );

  // What-If state: which biases the user has "fixed" in their rehearsal sim.
  const [fixedBiasIds, setFixedBiasIds] = useState<Set<string>>(new Set());
  const projectedScore = useMemo(() => {
    let projected = score;
    for (const b of topBiases) {
      const id = b.id ?? `${b.biasType}`;
      if (fixedBiasIds.has(id)) projected += biasUplift(b);
    }
    return Math.min(100, Math.round(projected));
  }, [score, topBiases, fixedBiasIds]);
  const projectedGrade = gradeFromScore(projectedScore);
  const projectedColor = dqiColorFor(projectedScore);
  const projectedUplift = projectedScore - score;

  // Pull a Skeptic-persona question from the simulation if present.
  const skepticQuestions = useMemo<string[]>(() => {
    const sim = analysis.simulation as
      | { skeptic?: { questions?: string[] }; personas?: Array<{ role?: string; questions?: string[] }> }
      | null
      | undefined;
    if (!sim) return [];
    if (sim.skeptic?.questions?.length) return sim.skeptic.questions.slice(0, 3);
    const skepticPersona = sim.personas?.find(p =>
      (p.role ?? '').toLowerCase().includes('skeptic')
    );
    if (skepticPersona?.questions?.length) return skepticPersona.questions.slice(0, 3);
    return [];
  }, [analysis]);

  const verdict = (analysis.metaVerdict ?? '').toLowerCase();
  const stamp = verdict.includes('approv')
    ? {
        label: 'Approve',
        color: 'var(--success)',
        bg: 'color-mix(in srgb, var(--success) 12%, transparent)',
        icon: Check,
      }
    : verdict.includes('reject')
      ? {
          label: 'Reject',
          color: 'var(--error)',
          bg: 'color-mix(in srgb, var(--error) 12%, transparent)',
          icon: XCircle,
        }
      : {
          label: 'Abstain',
          color: 'var(--warning)',
          bg: 'color-mix(in srgb, var(--warning) 14%, transparent)',
          icon: AlertTriangle,
        };
  const StampIcon = stamp.icon;

  function toggleFix(b: BiasInstance) {
    const id = b.id ?? b.biasType;
    setFixedBiasIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <article
      style={{
        maxWidth: 880,
        margin: '0 auto',
        padding: '0 24px 64px',
      }}
      aria-label="Rehearsal — prepare for the room"
    >
      {/* Compact verdict header — DQI shrinks because the user has seen it before */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          paddingTop: 32,
          paddingBottom: 24,
          borderBottom: '1px solid var(--border-color)',
          marginBottom: 32,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 'var(--fs-3xs)',
              fontWeight: 600,
              color: 'var(--text-muted)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Rehearsal · prepare for the room
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display, "Instrument Serif", Georgia, serif)',
              fontSize: 'clamp(28px, 3vw, 40px)',
              lineHeight: 1.15,
              fontWeight: 400,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            What will the room ask?
          </h1>
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 8,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
        >
          <span style={{ fontSize: 32, color: scoreColor, lineHeight: 1 }}>{grade}</span>
          <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>
            DQI {Math.round(score)}/100
          </span>
        </div>
      </header>

      {/* THE SKEPTIC — featured persona card with formal stamp + 3 questions */}
      <section style={{ marginBottom: 56 }}>
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
              marginBottom: 24,
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
                  The hardest questions your room will ask
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
              <StampIcon size={12} aria-hidden />
              Vote: {stamp.label}
            </span>
          </div>

          {skepticQuestions.length > 0 ? (
            <ol
              style={{
                margin: 0,
                paddingLeft: 0,
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              {skepticQuestions.map((q, i) => (
                <li
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 1fr',
                    gap: 16,
                    alignItems: 'baseline',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-display, "Instrument Serif", Georgia, serif)',
                      fontSize: 28,
                      fontWeight: 400,
                      color: 'var(--accent-primary)',
                      lineHeight: 1,
                    }}
                  >
                    Q{i + 1}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-display, "Instrument Serif", Georgia, serif)',
                      fontSize: 'clamp(18px, 1.8vw, 22px)',
                      lineHeight: 1.45,
                      fontWeight: 400,
                      color: 'var(--text-primary)',
                      fontStyle: 'italic',
                      letterSpacing: '-0.005em',
                    }}
                  >
                    &ldquo;{q}&rdquo;
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <div
              style={{
                fontSize: 'var(--fs-sm)',
                color: 'var(--text-secondary)',
                fontStyle: 'italic',
                lineHeight: 1.55,
              }}
            >
              The boardroom simulation hasn&rsquo;t produced a Skeptic transcript for this
              memo yet. Open the analyst dashboard for the full 5-persona output.
            </div>
          )}
        </div>
      </section>

      {/* WHAT-IF SIMULATOR — toggle biases off, watch the projected DQI recover */}
      {topBiases.length > 0 && (
        <section style={{ marginBottom: 56 }}>
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
            What-If · rehearse the fix
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-display, "Instrument Serif", Georgia, serif)',
              fontSize: 'clamp(22px, 2.2vw, 28px)',
              lineHeight: 1.25,
              fontWeight: 400,
              letterSpacing: '-0.01em',
              color: 'var(--text-primary)',
              margin: 0,
              marginBottom: 20,
            }}
          >
            Toggle a fix on. Watch the grade recover.
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 220px',
              gap: 24,
              alignItems: 'flex-start',
            }}
            className="rehearsal-whatif-grid"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topBiases.map(b => {
                const id = b.id ?? b.biasType;
                const fixed = fixedBiasIds.has(id);
                const accent = severityColor(b.severity);
                const uplift = biasUplift(b);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleFix(b)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '14px 18px',
                      background: fixed
                        ? 'color-mix(in srgb, var(--success) 8%, var(--bg-card))'
                        : 'var(--bg-card)',
                      border: `1px solid ${fixed ? 'var(--success)' : 'var(--border-color)'}`,
                      borderLeft: `3px solid ${fixed ? 'var(--success)' : accent}`,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: 'var(--fs-sm)',
                      transition: 'all 150ms ease-out',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 'var(--radius-sm)',
                          border: `2px solid ${fixed ? 'var(--success)' : 'var(--border-color)'}`,
                          background: fixed ? 'var(--success)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {fixed && <Check size={11} style={{ color: '#fff' }} aria-hidden />}
                      </div>
                      <span
                        style={{
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                        }}
                      >
                        Fix {formatBiasName(b.biasType)}
                      </span>
                    </div>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 'var(--fs-xs)',
                        fontWeight: 700,
                        color: fixed ? 'var(--success)' : 'var(--text-muted)',
                      }}
                    >
                      +{uplift}
                    </span>
                  </button>
                );
              })}
              {fixedBiasIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => setFixedBiasIds(new Set())}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: 'var(--fs-xs)',
                    cursor: 'pointer',
                    padding: '6px 0',
                    alignSelf: 'flex-start',
                  }}
                >
                  <RotateCcw size={11} aria-hidden />
                  Reset
                </button>
              )}
            </div>

            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-xl)',
                padding: 24,
                textAlign: 'center',
                position: 'sticky',
                top: 24,
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
                Projected
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 64,
                  fontWeight: 800,
                  lineHeight: 1,
                  color: projectedColor,
                  letterSpacing: '-0.04em',
                }}
              >
                {projectedGrade}
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 'var(--fs-sm)',
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  marginTop: 6,
                }}
              >
                DQI {projectedScore}/100
              </div>
              {projectedUplift > 0 && (
                <div
                  style={{
                    marginTop: 14,
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-full)',
                    background: 'color-mix(in srgb, var(--success) 12%, transparent)',
                    color: 'var(--success)',
                    fontSize: 'var(--fs-xs)',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  +{projectedUplift} from current
                </div>
              )}
              {projectedUplift === 0 && (
                <div
                  style={{
                    marginTop: 14,
                    fontSize: 'var(--fs-xs)',
                    color: 'var(--text-muted)',
                    fontStyle: 'italic',
                  }}
                >
                  Toggle a fix to project the lift.
                </div>
              )}
            </div>
          </div>

          <style jsx>{`
            @media (max-width: 700px) {
              .rehearsal-whatif-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>
        </section>
      )}

      {/* Footer actions — go back to discovery framing OR forward to provenance */}
      <footer
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          paddingTop: 32,
          borderTop: '1px solid var(--border-color)',
        }}
      >
        {onEnterDiscovery && (
          <button
            type="button"
            onClick={onEnterDiscovery}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 20px',
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--fs-sm)',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={14} aria-hidden />
            Back to verdict
          </button>
        )}
        {onExportDpr && (
          <button
            type="button"
            onClick={onExportDpr}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 20px',
              background: 'var(--accent-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--fs-sm)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Mic2 size={14} aria-hidden />
            Export rehearsal record
          </button>
        )}
        {onEnterProvenance && (
          <button
            type="button"
            onClick={onEnterProvenance}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 20px',
              background: 'transparent',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--fs-sm)',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Decision is made — view provenance
            <ArrowRight size={14} aria-hidden />
          </button>
        )}
      </footer>
    </article>
  );
}
