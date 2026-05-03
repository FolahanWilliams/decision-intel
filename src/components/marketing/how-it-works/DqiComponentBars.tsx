'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const C = {
  white: '#FFFFFF',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0F172A',
  green: '#16A34A',
  greenLight: '#DCFCE7',
  amber: '#F59E0B',
  red: '#DC2626',
  violet: '#7C3AED',
  blue: '#3B82F6',
};

/**
 * Canonical 6 DQI components — weights match FOUNDER_CONTEXT exactly.
 * If the founder context changes, update this table.
 */
const DQI_COMPONENTS: Array<{
  label: string;
  weight: number;
  measures: string;
  color: string;
}> = [
  {
    label: 'Bias Load',
    weight: 28,
    measures:
      'Severity-weighted count of detected cognitive biases, normalized to document complexity.',
    color: C.red,
  },
  {
    label: 'Noise Level',
    weight: 18,
    measures:
      'Inter-judge variance from the three-judge noise panel. Low variance = stable reasoning.',
    color: C.amber,
  },
  {
    label: 'Evidence Quality',
    weight: 18,
    measures:
      'Share of quantitative claims that verify against grounded search, plus source reliability.',
    color: C.blue,
  },
  {
    label: 'Process Maturity',
    weight: 13,
    measures: 'Was a prior submitted, outcomes tracked, dissent present, right committee size?',
    color: C.violet,
  },
  {
    label: 'Compliance Risk',
    weight: 13,
    measures:
      'Inverse of the seven-framework regulatory exposure score from the Verification node.',
    color: C.green,
  },
  {
    label: 'Historical Alignment',
    weight: 10,
    measures:
      'Pattern match against 143 historical cases. Prior failure signatures drag the score down.',
    color: C.slate600,
  },
];

const GRADES: Array<{
  grade: string;
  range: string;
  color: string;
  interpretation: string;
}> = [
  {
    grade: 'A',
    range: '85+',
    color: C.green,
    interpretation: 'Board-ready. Strong reasoning across the stack.',
  },
  {
    grade: 'B',
    range: '70–84',
    color: '#22C55E',
    interpretation: 'Mostly solid. Address the flagged biases before the vote.',
  },
  {
    grade: 'C',
    range: '55–69',
    color: C.amber,
    interpretation: 'Mixed. Several reasoning gaps need explicit treatment.',
  },
  {
    grade: 'D',
    range: '40–54',
    color: '#EA580C',
    interpretation: 'Weak. Rework required before the committee reviews.',
  },
  {
    grade: 'F',
    range: '0–39',
    color: C.red,
    interpretation: 'Critical. Reset the memo before re-circulating.',
  },
];

export function DqiComponentBars() {
  const maxWeight = Math.max(...DQI_COMPONENTS.map(c => c.weight));
  // Single IntersectionObserver on the outer container for mobile-safe
  // staggered animation — see PipelineFlowDiagram for the rationale.
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, margin: '-40px' });

  return (
    <div
      ref={containerRef}
      style={{
        background: C.white,
        border: `1px solid ${C.slate200}`,
        borderRadius: 16,
        padding: '28px 32px',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: C.slate400,
          marginBottom: 4,
        }}
      >
        DQI v2.0.0 · six weighted components
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: C.slate900,
          marginBottom: 20,
          letterSpacing: '-0.01em',
        }}
      >
        How a memo becomes a score between 0 and 100.
      </div>

      {/* Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {DQI_COMPONENTS.map((c, i) => {
          const widthPct = (c.weight / maxWeight) * 100;
          return (
            <div key={c.label}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 4,
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: C.slate900 }}>{c.label}</span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: c.color,
                    fontFamily: 'var(--font-mono, monospace)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {c.weight}%
                </span>
              </div>
              <div
                style={{
                  height: 8,
                  borderRadius: 999,
                  background: C.slate100,
                  overflow: 'hidden',
                  marginBottom: 6,
                }}
                aria-hidden
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={inView ? { width: `${widthPct}%` } : { width: 0 }}
                  transition={{ duration: 0.7, delay: 0.05 + i * 0.06, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    background: `linear-gradient(90deg, ${c.color}66 0%, ${c.color} 100%)`,
                    borderRadius: 999,
                  }}
                />
              </div>
              <p
                style={{
                  fontSize: 12.5,
                  color: C.slate500,
                  margin: 0,
                  lineHeight: 1.55,
                }}
              >
                {c.measures}
              </p>
            </div>
          );
        })}
      </div>

      {/* Grade scale */}
      <div
        style={{
          marginTop: 28,
          paddingTop: 24,
          borderTop: `1px dashed ${C.slate200}`,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: C.slate400,
            marginBottom: 12,
          }}
        >
          Grade scale
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 8,
          }}
          className="dqi-grade-grid"
        >
          {GRADES.map(g => (
            <div
              key={g.grade}
              style={{
                background: C.slate100,
                borderRadius: 12,
                padding: '14px 14px',
                borderTop: `3px solid ${g.color}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: g.color,
                    fontFamily: 'var(--font-mono, monospace)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                  }}
                >
                  {g.grade}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: C.slate500,
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  {g.range}
                </span>
              </div>
              <p style={{ fontSize: 11.5, color: C.slate600, margin: 0, lineHeight: 1.45 }}>
                {g.interpretation}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .dqi-grade-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
