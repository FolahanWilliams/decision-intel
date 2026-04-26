'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { WEWORK_AUDIT } from '@/lib/data/audits/wework-s1-2019';

/**
 * CounterfactualLiftViz — Interactive demonstration of the WHAT-IF
 * mechanic that drives every audit. Built 2026-04-26 to make the
 * counterfactual claim concrete on /how-it-works: cold visitors see
 * "shows exactly what shifts when you remove them" in the landing
 * subhead and have no felt sense of what that means.
 *
 * Renders the real WeWork S-1 audit (data in
 * src/lib/data/audits/wework-s1-2019.ts) with three biases attached.
 * The visitor toggles each bias chip — biases ON means "still in the
 * memo, dragging DQI down"; biases OFF means "mitigated, returning
 * the lift to the DQI." The gauge animates between scores in real
 * time. The grade band (A/B/C/D/F) updates colour as the DQI crosses
 * thresholds.
 *
 * Replaces the prior fictional "Project Heliograph" specimen — using a
 * real, public, famous-outcome document (WeWork's 2019 S-1) makes the
 * lift numbers feel earned, not arbitrary, and ties this section to
 * the WeWork narrative on the landing page for one continuous story.
 *
 * Pure React + Framer Motion. No backend call, no LLM round trip;
 * the counterfactual lift weights are calibrated against the same
 * scoring rubric as the production DQI calculation, so the page is
 * deterministic for any reader. Mobile: gauge stacks above the chips.
 */

const BASE_DQI = WEWORK_AUDIT.baseDqi;
const BIASES = WEWORK_AUDIT.biases;

const C = {
  white: '#FFFFFF',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate700: '#334155',
  slate900: '#0F172A',
  green: '#16A34A',
  greenLight: '#DCFCE7',
  amber: '#F59E0B',
  amberLight: '#FEF3C7',
  red: '#DC2626',
};

function gradeFor(score: number): { letter: string; color: string; label: string } {
  if (score >= 85) return { letter: 'A', color: C.green, label: 'Board-ready' };
  if (score >= 70) return { letter: 'B', color: '#10B981', label: 'Strong, minor work' };
  if (score >= 55) return { letter: 'C', color: '#FACC15', label: 'Material gaps' };
  if (score >= 40) return { letter: 'D', color: C.amber, label: 'Hold' };
  return { letter: 'F', color: C.red, label: 'Reject as drafted' };
}

export function CounterfactualLiftViz() {
  // mitigated[id] = true means "removed from the memo, lift returned to the DQI"
  const [mitigated, setMitigated] = useState<Record<string, boolean>>({});

  const totalLift = useMemo(
    () =>
      BIASES.reduce((sum, b) => (mitigated[b.id] ? sum + b.liftIfMitigated : sum), 0),
    [mitigated]
  );
  const currentDqi = Math.min(100, BASE_DQI + totalLift);
  const grade = gradeFor(currentDqi);

  return (
    <div className="cflift-grid">
      {/* LEFT — bias chips */}
      <div className="cflift-chips">
        <div
          style={{
            background: C.white,
            border: `1px solid ${C.slate200}`,
            borderRadius: 16,
            padding: '20px 22px 18px',
          }}
        >
          {/* Sample memo header — real WeWork S-1 audit, not a specimen */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: C.green,
                marginBottom: 4,
              }}
            >
              Real audit · public document
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: C.slate900,
                marginBottom: 4,
              }}
            >
              {WEWORK_AUDIT.documentName}
            </div>
            <div style={{ fontSize: 12, color: C.slate500 }}>
              {WEWORK_AUDIT.documentSubtitle} &middot; {BIASES.length} biases flagged. Click any to
              mitigate it and watch the DQI lift.
            </div>
          </div>

          {/* Bias toggle chips */}
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {BIASES.map(bias => {
              const isMitigated = !!mitigated[bias.id];
              const sevColor =
                bias.severity === 'high' ? C.red : bias.severity === 'medium' ? C.amber : C.slate400;
              return (
                <li key={bias.id}>
                  <button
                    type="button"
                    onClick={() => setMitigated(m => ({ ...m, [bias.id]: !m[bias.id] }))}
                    aria-pressed={isMitigated}
                    style={{
                      width: '100%',
                      background: isMitigated ? C.greenLight : C.white,
                      border: `1px solid ${isMitigated ? C.green : C.slate200}`,
                      borderRadius: 12,
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.18s, border-color 0.18s',
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        background: isMitigated ? C.green : C.slate100,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'background 0.18s',
                      }}
                    >
                      {isMitigated ? (
                        <Check size={13} color={C.white} strokeWidth={3} />
                      ) : (
                        <X size={13} color={sevColor} strokeWidth={2.5} />
                      )}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 2,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13.5,
                            fontWeight: 700,
                            color: isMitigated ? C.slate500 : C.slate900,
                            textDecoration: isMitigated ? 'line-through' : 'none',
                          }}
                        >
                          {bias.label}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: C.slate400,
                            fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {bias.taxonomyId}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: C.slate500,
                          lineHeight: 1.45,
                        }}
                      >
                        {bias.excerpt}
                      </div>
                    </div>
                    <div
                      style={{
                        flexShrink: 0,
                        textAlign: 'right',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: isMitigated ? C.green : C.slate400,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {isMitigated ? 'Mitigated' : 'Lift'}
                      </div>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 800,
                          color: isMitigated ? C.green : C.slate700,
                          fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                          letterSpacing: '-0.01em',
                          lineHeight: 1,
                        }}
                      >
                        +{bias.liftIfMitigated}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          <div
            style={{
              marginTop: 14,
              padding: '10px 12px',
              background: C.slate50,
              border: `1px solid ${C.slate200}`,
              borderRadius: 10,
              fontSize: 11.5,
              color: C.slate500,
              lineHeight: 1.5,
            }}
          >
            Lift weights are calibrated against the same rubric as the live DQI calculation, so
            the same memo always returns the same number. The mitigated ceiling stays in the
            D-range because the underlying decision had structural failures beyond bias.
          </div>
        </div>
      </div>

      {/* RIGHT — DQI gauge */}
      <div className="cflift-gauge">
        <div
          style={{
            background: C.white,
            border: `1px solid ${C.slate200}`,
            borderRadius: 16,
            padding: '28px 24px 24px',
            textAlign: 'center',
            boxShadow:
              '0 8px 24px -8px rgba(15,23,42,0.10), 0 2px 4px rgba(15,23,42,0.04)',
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: C.green,
              marginBottom: 14,
            }}
          >
            Decision Quality Index
          </div>

          {/* Gauge ring */}
          <DqiGauge score={currentDqi} grade={grade} />

          <div
            style={{
              marginTop: 18,
              fontSize: 13,
              color: C.slate500,
              lineHeight: 1.55,
            }}
          >
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontFamily: 'var(--font-mono, ui-monospace, monospace)' }}>
                {BASE_DQI}
              </span>
              {' as drafted · '}
              <motion.span
                key={currentDqi}
                initial={{ color: grade.color }}
                animate={{ color: grade.color }}
                style={{
                  fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                  fontWeight: 700,
                }}
              >
                {currentDqi}
              </motion.span>
              {' if all flagged biases mitigated'}
            </div>
            <div style={{ fontSize: 12, color: C.slate400 }}>
              Total lift available:{' '}
              <span style={{ fontFamily: 'var(--font-mono, ui-monospace, monospace)' }}>
                +{BIASES.reduce((s, b) => s + b.liftIfMitigated, 0)}
              </span>
              {' DQI points'}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .cflift-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
          gap: 24px;
          align-items: start;
        }
        .cflift-chips, .cflift-gauge { width: 100%; }
        .cflift-gauge { position: sticky; top: 80px; }
        @media (max-width: 900px) {
          .cflift-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .cflift-gauge {
            position: static;
            order: -1;
          }
        }
      `}</style>
    </div>
  );
}

function DqiGauge({
  score,
  grade,
}: {
  score: number;
  grade: { letter: string; color: string; label: string };
}) {
  // Half-circle gauge: -90deg = 0, 90deg = 100. We render an SVG arc.
  const angle = -90 + (score / 100) * 180;
  const radius = 78;
  const cx = 100;
  const cy = 100;
  const circumference = Math.PI * radius;
  const dash = (score / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: 200, height: 130, margin: '0 auto' }}>
      <svg width="200" height="130" viewBox="0 0 200 130" aria-hidden>
        {/* Background arc */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={C.slate100}
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Score arc */}
        <motion.path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={grade.color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - dash }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* Needle */}
        <motion.line
          x1={cx}
          y1={cy}
          x2={cx + radius * 0.92 * Math.cos((angle * Math.PI) / 180)}
          y2={cy + radius * 0.92 * Math.sin((angle * Math.PI) / 180)}
          stroke={C.slate900}
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={false}
          animate={{
            x2: cx + radius * 0.92 * Math.cos((angle * Math.PI) / 180),
            y2: cy + radius * 0.92 * Math.sin((angle * Math.PI) / 180),
          }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
        <circle cx={cx} cy={cy} r="6" fill={C.slate900} />
      </svg>
      {/* Score readout overlay */}
      <div
        style={{
          position: 'absolute',
          top: 38,
          left: 0,
          right: 0,
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <motion.div
          key={`score-${score}`}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            fontSize: 36,
            fontWeight: 800,
            color: C.slate900,
            fontFamily: 'var(--font-mono, ui-monospace, monospace)',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          {score}
        </motion.div>
      </div>
      {/* Grade badge below gauge */}
      <div
        style={{
          marginTop: -8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <motion.span
          key={`grade-${grade.letter}`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.22 }}
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: C.white,
            background: grade.color,
            padding: '4px 12px',
            borderRadius: 8,
            fontFamily: 'var(--font-mono, ui-monospace, monospace)',
            letterSpacing: '0.04em',
          }}
        >
          {grade.letter}
        </motion.span>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: C.slate500 }}>
          {grade.label}
        </span>
      </div>
    </div>
  );
}
