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
};

type Signal = {
  id: string;
  label: string;
  detail: string;
  icon: LucideIcon;
};

const SIGNALS: Signal[] = [
  { id: 'slack', label: 'Slack', detail: 'listening to threads', icon: MessageSquare },
  { id: 'drive', label: 'Drive', detail: 'watching folders', icon: FileText },
  { id: 'web', label: 'Web', detail: 'scanning public signals', icon: Globe },
  { id: 'email', label: 'Email', detail: 'monitoring replies', icon: Mail },
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
          <span style={{ color: C.slate900, fontWeight: 600 }}>
            {loopPulsing ? 'Calibration written back' : 'Calibration pending'}
          </span>
          <span style={{ margin: '0 8px', color: C.slate300 }}>·</span>
          <span style={{ color: C.slate500 }}>
            {loopPulsing
              ? 'The Decision Knowledge Graph updates. Your next memo is audited against the new baseline.'
              : 'Once the outcome is detected, the loop writes back to the Decision Knowledge Graph.'}
          </span>
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
          Four detection channels. Zero manual logging. Every outcome compounds the baseline.
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
        gap: 12,
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
        Earlier memo &middot; decision at rest
      </div>

      {/* Abstract document */}
      <div
        style={{
          padding: '12px 12px 14px',
          borderRadius: 10,
          background: C.slate50,
          border: `1px solid ${C.slate200}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
        aria-hidden
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 4,
          }}
        >
          <div
            style={{
              width: 18,
              height: 22,
              borderRadius: 3,
              background: C.white,
              border: `1px solid ${C.slate300}`,
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 6,
                height: 6,
                background: C.slate200,
                borderBottomLeftRadius: 3,
              }}
            />
          </div>
          <div
            style={{
              height: 4,
              borderRadius: 2,
              background: C.slate300,
              width: '60%',
            }}
          />
        </div>
        {[82, 70, 88, 64].map((w, i) => (
          <div
            key={i}
            style={{
              height: 4,
              borderRadius: 2,
              background: C.slate200,
              width: `${w}%`,
            }}
          />
        ))}
      </div>

      {/* Status row (no numbers) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {['audited', 'scored', 'logged'].map(label => (
          <span
            key={label}
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: 999,
              background: C.slate100,
              color: C.slate600,
              border: `1px solid ${C.slate200}`,
              fontFamily: 'var(--font-mono, monospace)',
              letterSpacing: '0.04em',
            }}
          >
            {label}
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
        <CheckCircle2 size={11} strokeWidth={2.4} /> Loop closed
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
        gap: 12,
        position: 'relative',
        transition: 'background 0.5s',
        minHeight: 160,
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
          {ready ? 'Outcome auto-detected' : 'Awaiting convergence'}
        </div>
        {ready && !reducedMotion && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.35, type: 'spring', stiffness: 220 }}
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              background: C.green,
              color: C.white,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={13} strokeWidth={2.6} />
          </motion.div>
        )}
      </div>

      {/* Abstract outcome body — fills in when ready, skeleton otherwise */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 8,
          padding: '6px 0 2px',
        }}
        aria-hidden
      >
        {[78, 62, 48].map((targetWidth, i) => (
          <motion.div
            key={i}
            animate={{
              width: ready ? `${targetWidth}%` : `${Math.max(targetWidth - 30, 20)}%`,
              backgroundColor: ready
                ? [C.green, C.slate700, C.slate400][i]
                : C.slate100,
            }}
            transition={{
              duration: 0.5,
              delay: ready ? 0.15 + i * 0.08 : 0,
            }}
            style={{
              height: 8,
              borderRadius: 4,
            }}
          />
        ))}
      </div>

      {/* Verdict footer */}
      <motion.div
        animate={{
          opacity: ready ? 1 : 0.5,
        }}
        transition={{ duration: 0.4, delay: ready ? 0.35 : 0 }}
        style={{
          fontSize: 11,
          color: ready ? C.slate700 : C.slate400,
          lineHeight: 1.4,
          paddingTop: 4,
          borderTop: `1px dashed ${C.slate200}`,
        }}
      >
        {ready ? (
          <>
            <span style={{ color: C.slate900, fontWeight: 700 }}>Verdict assembled</span>
            <span style={{ margin: '0 6px', color: C.slate300 }}>·</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10.5 }}>
              multi-channel, zero manual logging
            </span>
          </>
        ) : (
          <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10.5 }}>
            Signals still arriving&hellip;
          </span>
        )}
      </motion.div>
    </motion.div>
  );
}
