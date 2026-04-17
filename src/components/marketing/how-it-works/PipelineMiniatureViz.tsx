'use client';

/**
 * PipelineMiniatureViz
 *
 * Compact auto-animating pipeline stub for the hero — three stacked
 * zone strips where dots travel through sequentially on an infinite
 * loop. Communicates "something is happening inside" at a glance.
 * Static if prefers-reduced-motion.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from './useReducedMotion';

const C = {
  navy: '#0F172A',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate700: '#334155',
  slate900: '#0F172A',
  white: '#FFFFFF',
  green: '#16A34A',
  violet: '#7C3AED',
};

const ZONES: Array<{
  key: string;
  label: string;
  nodes: number;
  accent: string;
  description: string;
}> = [
  {
    key: 'preprocessing',
    label: '01 · Preprocessing',
    nodes: 3,
    accent: C.violet,
    description: 'Redact · Structure · Contextualize',
  },
  {
    key: 'analysis',
    label: '02 · Analysis (parallel)',
    nodes: 7,
    accent: C.green,
    description: 'Seven specialized agents run at once',
  },
  {
    key: 'synthesis',
    label: '03 · Synthesis',
    nodes: 2,
    accent: C.slate900,
    description: 'Reconcile · Score deterministically',
  },
];

export function PipelineMiniatureViz() {
  const [activeIdx, setActiveIdx] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(() => {
      setActiveIdx(i => (i + 1) % ZONES.length);
    }, 1500);
    return () => clearInterval(id);
  }, [reducedMotion]);

  return (
    <div
      style={{
        background: C.navy,
        border: `1px solid rgba(255,255,255,0.08)`,
        borderRadius: 16,
        padding: '24px 22px 22px',
        color: C.white,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative ambient grid */}
      <svg
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.08,
          pointerEvents: 'none',
        }}
        width="100%"
        height="100%"
      >
        <defs>
          <pattern id="hero-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#94A3B8" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>

      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: C.green,
          marginBottom: 4,
          position: 'relative',
        }}
      >
        12-node pipeline · under 60 seconds
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: C.white,
          marginBottom: 18,
          letterSpacing: '-0.01em',
          position: 'relative',
        }}
      >
        What happens when you press audit.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
        {ZONES.map((z, i) => {
          const isActive = activeIdx === i && !reducedMotion;
          return (
            <div
              key={z.key}
              style={{
                padding: '14px 16px',
                borderRadius: 12,
                background: isActive
                  ? `linear-gradient(90deg, ${z.accent}28 0%, rgba(15, 23, 42, 0.2) 100%)`
                  : 'rgba(255, 255, 255, 0.035)',
                border: `1px solid ${isActive ? `${z.accent}66` : 'rgba(255, 255, 255, 0.08)'}`,
                transition: 'background 0.45s, border-color 0.45s',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 8,
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: isActive ? z.accent : C.slate400,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontFamily: 'var(--font-mono, monospace)',
                    transition: 'color 0.4s',
                  }}
                >
                  {z.label}
                </span>
                <span style={{ fontSize: 10, color: C.slate400 }}>
                  {z.nodes} node{z.nodes === 1 ? '' : 's'}
                </span>
              </div>

              {/* Node pips */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {Array.from({ length: z.nodes }).map((_, n) => (
                  <motion.div
                    key={n}
                    style={{
                      flex: 1,
                      height: 6,
                      borderRadius: 999,
                      background: isActive ? z.accent : 'rgba(255, 255, 255, 0.12)',
                      transition: 'background 0.4s',
                    }}
                    animate={
                      isActive
                        ? { opacity: [0.4, 1, 0.4], scaleY: [1, 1.4, 1] }
                        : { opacity: 0.6, scaleY: 1 }
                    }
                    transition={{
                      duration: 1.2,
                      repeat: isActive ? Infinity : 0,
                      delay: isActive ? n * 0.08 : 0,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: isActive ? C.white : C.slate400,
                  transition: 'color 0.4s',
                }}
              >
                {z.description}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 11,
          color: C.slate400,
          flexWrap: 'wrap',
          gap: 6,
          position: 'relative',
        }}
      >
        <span>Scroll for the full diagram →</span>
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            color: C.green,
            fontWeight: 700,
          }}
        >
          DQI · 0–100 · A–F
        </span>
      </div>
    </div>
  );
}
