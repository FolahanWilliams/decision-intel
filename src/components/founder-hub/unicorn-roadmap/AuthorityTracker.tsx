'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Zap } from 'lucide-react';
import { AUTHORITY_SIGNALS } from './data';
import { SectionHeader } from './UnicornTimeline';

/**
 * AuthorityTracker — grid of 6 signals tracking founder-market fit
 * (content, conversations, citations). Each card shows current/target
 * + compounding flag. Intentionally simple — this is a spreadsheet
 * the founder updates weekly.
 */
export function AuthorityTracker() {
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
        eyebrow="Founder authority"
        title="Signals that close doors without saying your age."
        subtitle="Track weekly. Compounding signals earn disproportionate returns — prioritize them."
      />
      <div
        style={{
          padding: '20px 24px 28px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 14,
        }}
      >
        {AUTHORITY_SIGNALS.map((s, i) => {
          const pct = s.target === 0 ? 0 : Math.min(100, (s.current / s.target) * 100);
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              style={{
                padding: 16,
                borderRadius: 12,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-primary)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  fontSize: 9.5,
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  fontFamily: 'var(--font-mono, monospace)',
                  marginBottom: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {s.compounding ? (
                  <>
                    <TrendingUp size={11} color="var(--accent-primary)" />
                    <span style={{ color: 'var(--accent-primary)' }}>Compounding</span>
                  </>
                ) : (
                  <>
                    <Zap size={11} color="var(--text-muted)" />
                    <span>Flow</span>
                  </>
                )}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.35,
                  marginBottom: 12,
                }}
              >
                {s.label}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
                <span
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  {s.current}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 700 }}>
                  / {s.target} {s.unit}
                </span>
              </div>
              <div
                style={{
                  height: 4,
                  borderRadius: 2,
                  background: 'var(--bg-card)',
                  overflow: 'hidden',
                  border: '1px solid var(--border-primary)',
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: 0.2 + i * 0.05 }}
                  style={{
                    height: '100%',
                    background: 'var(--accent-primary)',
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
