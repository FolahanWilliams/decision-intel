'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COUNTERFACTUALS = [
  {
    bias: 'Overconfidence',
    lift: '+18%',
    label: 'outcome probability',
  },
  {
    bias: 'Sunk-Cost',
    lift: '+12%',
    label: 'outcome probability',
  },
  {
    bias: 'Groupthink',
    lift: '+9%',
    label: 'outcome probability',
  },
  {
    bias: 'Anchoring',
    lift: '+14%',
    label: 'outcome probability',
  },
];

const CYCLE_MS = 3200;

export function HeroCounterfactualTease() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setIdx(i => (i + 1) % COUNTERFACTUALS.length);
    }, CYCLE_MS);
    return () => clearInterval(t);
  }, [paused]);

  const current = COUNTERFACTUALS[idx];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 14px',
        background: '#F0FDF4',
        border: '1px solid #BBF7D0',
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        color: '#0F172A',
        whiteSpace: 'nowrap',
        maxWidth: '100%',
        overflow: 'hidden',
      }}
      aria-live="polite"
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: '#16A34A',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          flexShrink: 0,
        }}
      >
        What-if
      </span>
      <AnimatePresence mode="wait">
        <motion.span
          key={current.bias}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            minWidth: 0,
          }}
        >
          <span style={{ color: '#475569', fontWeight: 500 }}>Remove {current.bias}</span>
          <span style={{ color: '#94A3B8' }}>→</span>
          <span style={{ color: '#16A34A', fontWeight: 700 }}>{current.lift}</span>
          <span style={{ color: '#475569', fontWeight: 500 }}>{current.label}</span>
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
