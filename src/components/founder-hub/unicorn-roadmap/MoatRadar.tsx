'use client';

import { motion } from 'framer-motion';
import { MOATS } from './data';
import { SectionHeader } from './UnicornTimeline';

/**
 * MoatRadar — shows 4 moats as parallel progress bars with current
 * strength vs target. Each moat card has: name, one-liner, proof
 * required to lock it, and an animated progress bar comparing
 * current/target.
 */
export function MoatRadar() {
  return (
    <section
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 32,
      }}
    >
      <SectionHeader
        eyebrow="The moat"
        title="Four defensibility stacks. Each compounds or decays."
        subtitle="Current strength vs target by Q4 2026. Proof required to lock each."
      />
      <div style={{ padding: '20px 24px 28px', display: 'grid', gap: 16 }}>
        {MOATS.map((m, i) => (
          <MoatCard key={m.id} moat={m} index={i} />
        ))}
      </div>
    </section>
  );
}

function MoatCard({ moat, index }: { moat: (typeof MOATS)[number]; index: number }) {
  const gap = moat.targetStrength - moat.currentStrength;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      style={{
        padding: 18,
        borderRadius: 12,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-primary)',
        borderLeft: `3px solid ${moat.color}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px', minWidth: 0 }}>
          <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
            {moat.name}
          </h4>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '6px 0 0', lineHeight: 1.55 }}>
            {moat.oneLiner}
          </p>
        </div>
        <div style={{ textAlign: 'right', minWidth: 120 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'var(--font-mono, monospace)' }}>
            strength
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {moat.currentStrength}
            <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 700 }}>
              {' '}/ {moat.targetStrength}
            </span>
          </div>
          {gap > 0 && (
            <div style={{ fontSize: 10.5, color: moat.color, fontWeight: 700, fontFamily: 'var(--font-mono, monospace)' }}>
              +{gap} to lock
            </div>
          )}
        </div>
      </div>
      <MoatBar current={moat.currentStrength} target={moat.targetStrength} color={moat.color} />
      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55 }}>
        <span style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: 'var(--font-mono, monospace)', marginRight: 8 }}>
          proof required
        </span>
        {moat.proofRequired}
      </div>
    </motion.div>
  );
}

function MoatBar({ current, target, color }: { current: number; target: number; color: string }) {
  return (
    <div style={{ marginTop: 14, position: 'relative', height: 10, borderRadius: 5, background: 'var(--bg-card)', overflow: 'hidden', border: '1px solid var(--border-primary)' }}>
      {/* Target ghost */}
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: `${target}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'absolute', inset: 0, width: `${target}%`, background: `${color}22` }}
      />
      {/* Current fill */}
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: `${current}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'absolute', inset: 0, width: `${current}%`, background: color }}
      />
      {/* Target marker */}
      <div
        style={{
          position: 'absolute',
          left: `${target}%`,
          top: -3,
          bottom: -3,
          width: 2,
          background: color,
          transform: 'translateX(-1px)',
        }}
      />
    </div>
  );
}
