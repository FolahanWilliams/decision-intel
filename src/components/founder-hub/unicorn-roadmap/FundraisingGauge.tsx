'use client';

import { motion } from 'framer-motion';
import { Check, Square } from 'lucide-react';
import { READINESS, type ReadinessCheck } from './data';
import { SectionHeader } from './UnicornTimeline';
import { usePersistedChecks } from './use-persisted-checks';

const STORAGE_KEY = 'di-unicorn-roadmap-readiness';

const AREA_META: Record<ReadinessCheck['area'], { color: string; label: string }> = {
  traction: { color: '#16A34A', label: 'Traction' },
  product: { color: '#7C3AED', label: 'Product' },
  team: { color: '#DB2777', label: 'Team' },
  story: { color: '#0EA5E9', label: 'Story' },
  financials: { color: '#F59E0B', label: 'Financials' },
};

export function FundraisingGauge() {
  const { checks, toggle } = usePersistedChecks(STORAGE_KEY);
  const done = READINESS.filter(r => checks[r.id]).length;
  const pct = Math.round((done / READINESS.length) * 100);

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
        eyebrow="Pre-seed readiness"
        title={`${pct}% of the seed-ready bar.`}
        subtitle="Twelve checkpoints. Green when complete. Lock the round when every area shows proof."
      />
      <div style={{ padding: '20px 24px 28px' }}>
        <ArcGauge pct={pct} />
        <div style={{ marginTop: 24, display: 'grid', gap: 10 }}>
          {READINESS.map((r, i) => {
            const area = AREA_META[r.area];
            const isDone = !!checks[r.id];
            return (
              <motion.button
                key={r.id}
                onClick={() => toggle(r.id)}
                aria-pressed={isDone}
                initial={{ opacity: 0, y: 4 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '22px 90px 1fr 200px',
                  gap: 14,
                  alignItems: 'center',
                  padding: 12,
                  borderRadius: 10,
                  background: isDone ? 'rgba(22,163,74,0.08)' : 'var(--bg-elevated)',
                  border: `1px solid ${isDone ? 'rgba(22,163,74,0.35)' : 'var(--border-primary)'}`,
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  transition: 'background 0.2s, border-color 0.2s',
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 5,
                    background: isDone ? 'var(--accent-primary)' : 'transparent',
                    border: `1.5px solid ${isDone ? 'var(--accent-primary)' : 'var(--text-muted)'}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isDone ? <Check size={12} color="#fff" strokeWidth={3} /> : <Square size={0} />}
                </span>
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    color: area.color,
                    background: `${area.color}15`,
                    border: `1px solid ${area.color}30`,
                    padding: '3px 8px',
                    borderRadius: 4,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontFamily: 'var(--font-mono, monospace)',
                    textAlign: 'center',
                  }}
                >
                  {area.label}
                </span>
                <span
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    lineHeight: 1.35,
                    textDecoration: isDone ? 'line-through' : 'none',
                    opacity: isDone ? 0.7 : 1,
                  }}
                >
                  {r.label}
                </span>
                <span
                  style={{
                    fontSize: 11.5,
                    color: 'var(--text-muted)',
                    lineHeight: 1.45,
                    fontStyle: 'italic',
                  }}
                >
                  {r.required}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ArcGauge({ pct }: { pct: number }) {
  const radius = 80;
  const strokeW = 12;
  const circumference = Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <svg width={220} height={130} viewBox="0 0 220 130" aria-hidden>
        <defs>
          <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#16A34A" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>
        </defs>
        {/* Background track */}
        <path
          d={`M 20 110 A ${radius} ${radius} 0 0 1 200 110`}
          fill="none"
          stroke="var(--border-primary)"
          strokeWidth={strokeW}
          strokeLinecap="round"
        />
        {/* Progress */}
        <motion.path
          d={`M 20 110 A ${radius} ${radius} 0 0 1 200 110`}
          fill="none"
          stroke="url(#gauge-grad)"
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* Center label */}
        <text
          x="110"
          y="92"
          fontSize="34"
          fontWeight="800"
          fill="var(--text-primary)"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="-0.02em"
        >
          {pct}%
        </text>
        <text
          x="110"
          y="112"
          fontSize="10"
          fontWeight="800"
          fill="var(--text-muted)"
          textAnchor="middle"
          fontFamily="var(--font-mono, monospace)"
          letterSpacing="0.14em"
        >
          SEED-READY
        </text>
      </svg>
    </div>
  );
}
