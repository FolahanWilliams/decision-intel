'use client';

/**
 * OutcomeDetectionViz
 *
 * Landing-page companion to PipelineLandingTeaser. Where the teaser shows
 * what happens INSIDE the 60-second audit, this viz shows what happens
 * AFTER — the automated outcome detector closing the feedback loop on a
 * past decision by pulling signals from Slack, Drive, web intel, and
 * follow-up memos, then writing calibration back into the Decision
 * Knowledge Graph.
 *
 * Shared visual grammar with the teaser (light theme, green accent, same
 * C palette, Framer Motion, prefers-reduced-motion). Zero interactivity.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FileText,
  MessageSquare,
  Globe,
  Mail,
  CheckCircle2,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { useReducedMotion } from './useReducedMotion';

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
  greenSoft: 'rgba(22, 163, 74, 0.08)',
  greenBorder: 'rgba(22, 163, 74, 0.25)',
  violet: '#7C3AED',
  amber: '#D97706',
};

type Signal = {
  id: string;
  label: string;
  detail: string;
  icon: LucideIcon;
};

const SIGNALS: Signal[] = [
  { id: 'slack', label: 'Slack', detail: '#strategy-emea · "shipped Q2"', icon: MessageSquare },
  { id: 'drive', label: 'Drive', detail: 'Q3_board_update.pdf', icon: FileText },
  { id: 'web', label: 'Web', detail: 'Press release · Oct 15', icon: Globe },
  { id: 'email', label: 'Email', detail: 'Post-mortem draft v1', icon: Mail },
];

const CYCLE_MS = 7400;

export function OutcomeDetectionViz() {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      setPhase(0);
      const timers = [
        setTimeout(() => !cancelled && setPhase(1), 500),
        setTimeout(() => !cancelled && setPhase(2), 1100),
        setTimeout(() => !cancelled && setPhase(3), 1700),
        setTimeout(() => !cancelled && setPhase(4), 2300),
        setTimeout(() => !cancelled && setPhase(5), 3100),
        setTimeout(() => !cancelled && setPhase(6), 4000),
      ];
      return timers;
    };
    let timers = run() ?? [];
    const interval = setInterval(() => {
      timers.forEach(clearTimeout);
      timers = run() ?? [];
    }, CYCLE_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
      timers.forEach(clearTimeout);
    };
  }, [reducedMotion]);

  const effectivePhase = reducedMotion ? 6 : phase;
  const signalActive = (i: number) => effectivePhase >= i + 1;
  const outcomeReady = effectivePhase >= 5;
  const loopPulsing = effectivePhase === 6;

  return (
    <div
      style={{
        background: C.white,
        border: `1px solid ${C.slate200}`,
        borderRadius: 20,
        padding: '26px 28px 22px',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.03)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 22,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: C.green,
              marginBottom: 4,
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            After the audit · Outcome loop
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: C.slate900,
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}
          >
            Every decision closes its own loop &mdash; automatically.
          </div>
        </div>
        {!reducedMotion && (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 12px',
              borderRadius: 999,
              background: C.greenSoft,
              border: `1px solid ${C.greenBorder}`,
              color: C.green,
              fontSize: 10.5,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: C.green,
              }}
              aria-hidden
            />
            detecting
          </motion.div>
        )}
      </div>

      {/* Main layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 1fr) minmax(240px, 1.1fr) minmax(240px, 1.2fr)',
          gap: 18,
          alignItems: 'stretch',
        }}
        className="outcome-viz-row"
      >
        {/* Decision card (left) */}
        <DecisionCard calibrationStamped={loopPulsing || outcomeReady} />

        {/* Signal convergence (middle) */}
        <SignalColumn
          signals={SIGNALS}
          isActive={signalActive}
          reducedMotion={reducedMotion}
          outcomeReady={outcomeReady}
        />

        {/* Outcome card (right) */}
        <OutcomeCard ready={outcomeReady} reducedMotion={reducedMotion} />
      </div>

      {/* Feedback loop strip */}
      <div
        style={{
          marginTop: 16,
          padding: '12px 16px',
          borderRadius: 12,
          background: loopPulsing ? C.greenSoft : C.slate50,
          border: `1px dashed ${loopPulsing ? C.greenBorder : C.slate200}`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 12,
          color: C.slate600,
          transition: 'background 0.4s, border-color 0.4s',
        }}
      >
        <motion.div
          animate={loopPulsing && !reducedMotion ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 1.4, ease: 'easeInOut' }}
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            background: loopPulsing ? C.green : C.slate300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: C.white,
            flexShrink: 0,
            transition: 'background 0.4s',
          }}
        >
          <CheckCircle2 size={13} strokeWidth={2.4} />
        </motion.div>
        <span>
          <span style={{ color: C.slate900, fontWeight: 600 }}>Calibration written back</span>
          <span style={{ margin: '0 8px', color: C.slate300 }}>·</span>
          Decision Knowledge Graph now knows this team over-weights optimism on EMEA plays by 0.08.
          <span style={{ margin: '0 8px', color: C.slate300 }}>·</span>
          <span style={{ color: C.slate500 }}>Next memo gets audited against the updated baseline.</span>
        </span>
      </div>

      {/* Footer link */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 14,
          borderTop: `1px dashed ${C.slate200}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 12, color: C.slate500 }}>
          Four detection channels. Zero manual logging. 146-case benchmark gets one record richer every close.
        </span>
        <Link
          href="/how-it-works"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 999,
            background: C.slate900,
            color: C.white,
            fontSize: 12,
            fontWeight: 600,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          See the full loop <ArrowRight size={12} />
        </Link>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .outcome-viz-row {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
        }
      `}</style>
    </div>
  );
}

function DecisionCard({ calibrationStamped }: { calibrationStamped: boolean }) {
  return (
    <div
      style={{
        border: `1px solid ${C.slate200}`,
        borderRadius: 14,
        padding: '14px 16px',
        background: C.white,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        position: 'relative',
      }}
    >
      <div
        style={{
          fontSize: 9.5,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: C.slate400,
          fontFamily: 'var(--font-mono, monospace)',
        }}
      >
        Q1 &middot; decision at rest
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.slate900, lineHeight: 1.3 }}>
        EMEA expansion recommendation
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 10px',
          background: C.slate50,
          borderRadius: 8,
          border: `1px solid ${C.slate200}`,
        }}
      >
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: C.slate900,
            color: C.white,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 800,
            fontFamily: 'var(--font-mono, monospace)',
          }}
        >
          B
        </span>
        <span style={{ fontSize: 11, color: C.slate600 }}>
          <span style={{ fontWeight: 700, color: C.slate900 }}>DQI 74</span> at decision time
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {['Planning fallacy', 'Confirmation', 'Optimism'].map(bias => (
          <span
            key={bias}
            style={{
              fontSize: 10,
              fontWeight: 500,
              padding: '3px 7px',
              borderRadius: 999,
              background: C.slate100,
              color: C.slate600,
              border: `1px solid ${C.slate200}`,
            }}
          >
            {bias}
          </span>
        ))}
      </div>
      <motion.div
        animate={{
          opacity: calibrationStamped ? 1 : 0,
          y: calibrationStamped ? 0 : 6,
        }}
        transition={{ duration: 0.4 }}
        style={{
          fontSize: 10,
          color: C.green,
          fontWeight: 700,
          fontFamily: 'var(--font-mono, monospace)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          pointerEvents: 'none',
        }}
        aria-hidden={!calibrationStamped}
      >
        <CheckCircle2 size={11} strokeWidth={2.4} /> Calibration updated
      </motion.div>
    </div>
  );
}

function SignalColumn({
  signals,
  isActive,
  reducedMotion,
  outcomeReady,
}: {
  signals: Signal[];
  isActive: (i: number) => boolean;
  reducedMotion: boolean;
  outcomeReady: boolean;
}) {
  return (
    <div
      style={{
        borderRadius: 14,
        border: `1px dashed ${C.slate200}`,
        background: outcomeReady ? C.greenSoft : C.slate50,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        transition: 'background 0.5s',
      }}
    >
      <div
        style={{
          fontSize: 9.5,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: C.slate400,
          fontFamily: 'var(--font-mono, monospace)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>Signal convergence</span>
        <span style={{ color: outcomeReady ? C.green : C.slate400 }}>
          {signals.filter((_, i) => isActive(i)).length}/4
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {signals.map((s, i) => {
          const active = isActive(i);
          const Icon = s.icon;
          return (
            <motion.div
              key={s.id}
              animate={{
                opacity: active ? 1 : 0.35,
                x: active ? 0 : -4,
              }}
              transition={{ duration: 0.35 }}
              style={{
                display: 'grid',
                gridTemplateColumns: '26px 1fr auto',
                alignItems: 'center',
                gap: 8,
                padding: '7px 9px',
                borderRadius: 8,
                background: active ? C.white : 'transparent',
                border: `1px solid ${active ? C.slate200 : 'transparent'}`,
                boxShadow: active ? '0 1px 2px rgba(15,23,42,0.04)' : 'none',
                transition: 'background 0.35s, border-color 0.35s',
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  background: active ? C.green : C.slate200,
                  color: active ? C.white : C.slate500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.35s, color 0.35s',
                  position: 'relative',
                }}
              >
                <Icon size={13} strokeWidth={2.2} />
                {active && !reducedMotion && (
                  <motion.span
                    aria-hidden
                    animate={{ opacity: [0, 1, 0], scale: [0.9, 1.25, 1.5] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.1 }}
                    style={{
                      position: 'absolute',
                      inset: -3,
                      borderRadius: 9,
                      border: `1.5px solid ${C.green}`,
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: C.slate900 }}>{s.label}</div>
                <div
                  style={{
                    fontSize: 10.5,
                    color: C.slate500,
                    fontFamily: 'var(--font-mono, monospace)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.detail}
                </div>
              </div>
              <ArrowRight
                size={12}
                color={active ? C.green : C.slate300}
                style={{ transition: 'color 0.35s' }}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function OutcomeCard({ ready, reducedMotion }: { ready: boolean; reducedMotion: boolean }) {
  return (
    <motion.div
      animate={{
        opacity: ready ? 1 : 0.55,
        borderColor: ready ? C.greenBorder : C.slate200,
      }}
      transition={{ duration: 0.4 }}
      style={{
        border: `1px solid ${C.slate200}`,
        borderRadius: 14,
        padding: '14px 16px',
        background: ready
          ? `linear-gradient(180deg, ${C.white} 0%, ${C.greenSoft} 100%)`
          : C.white,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        position: 'relative',
        transition: 'background 0.5s',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: ready ? C.green : C.slate400,
            fontFamily: 'var(--font-mono, monospace)',
            transition: 'color 0.4s',
          }}
        >
          Q3 &middot; outcome auto-detected
        </div>
        {ready && !reducedMotion && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.35, type: 'spring', stiffness: 220 }}
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              background: C.green,
              color: C.white,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={12} strokeWidth={2.6} />
          </motion.div>
        )}
      </div>

      <motion.div
        animate={{ opacity: ready ? 1 : 0 }}
        transition={{ duration: 0.4, delay: ready ? 0.1 : 0 }}
        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        <div
          style={{
            padding: '8px 10px',
            borderRadius: 8,
            background: C.white,
            border: `1px solid ${C.slate200}`,
          }}
        >
          <div
            style={{
              fontSize: 9.5,
              color: C.slate500,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 3,
            }}
          >
            Revenue vs forecast
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: C.slate900,
                fontFamily: 'var(--font-mono, monospace)',
                letterSpacing: '-0.02em',
              }}
            >
              $4.2M
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.green,
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              +11% vs modeled
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6,
          }}
        >
          <MiniStat label="Verdict" value="Beat model" tone="green" />
          <MiniStat label="DQI delta" value="+0.03" tone="green" />
          <MiniStat label="Benchmark" value="147th case" tone="slate" />
          <MiniStat label="Bias profile" value="Optimism −0.08" tone="violet" />
        </div>
      </motion.div>

      {!ready && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: '8px 4px 12px',
          }}
          aria-hidden
        >
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                height: 10,
                borderRadius: 5,
                background: C.slate100,
                width: i === 0 ? '80%' : i === 1 ? '62%' : '70%',
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'green' | 'slate' | 'violet';
}) {
  const color = tone === 'green' ? C.green : tone === 'violet' ? C.violet : C.slate700;
  return (
    <div
      style={{
        padding: '7px 9px',
        borderRadius: 7,
        background: C.white,
        border: `1px solid ${C.slate200}`,
      }}
    >
      <div
        style={{
          fontSize: 9,
          color: C.slate500,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          color,
          fontFamily: 'var(--font-mono, monospace)',
          letterSpacing: '-0.01em',
        }}
      >
        {value}
      </div>
    </div>
  );
}
