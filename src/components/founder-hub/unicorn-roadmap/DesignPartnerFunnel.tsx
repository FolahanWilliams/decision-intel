'use client';

import { motion } from 'framer-motion';
import { FUNNEL } from './data';
import { SectionHeader } from './UnicornTimeline';

/**
 * DesignPartnerFunnel — trapezoid funnel. Each stage is a horizontal bar
 * whose width is proportional to the target (cold funnel) and whose fill
 * is the current progress. Conversion ratios shown between stages.
 */
export function DesignPartnerFunnel() {
  const maxTarget = Math.max(...FUNNEL.map(s => s.target));
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
        eyebrow="The pipeline"
        title="From warm intro to paying reference."
        subtitle="Five stages, realistic target ratios. Refresh weekly on Friday."
      />
      <div style={{ padding: '22px 28px 32px' }}>
        <div style={{ display: 'grid', gap: 14 }}>
          {FUNNEL.map((stage, i) => {
            const widthPct = (stage.target / maxTarget) * 100;
            const fillPct = stage.target === 0 ? 0 : (stage.current / stage.target) * 100;
            const prev = i > 0 ? FUNNEL[i - 1] : null;
            const conversion =
              prev && prev.target > 0
                ? Math.round((stage.target / prev.target) * 100)
                : null;

            return (
              <div key={stage.id}>
                {conversion !== null && (
                  <div
                    style={{
                      textAlign: 'center',
                      fontSize: 9.5,
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      fontFamily: 'var(--font-mono, monospace)',
                      marginBottom: 6,
                    }}
                  >
                    ↓ {conversion}% conversion target
                  </div>
                )}
                <StageRow stage={stage} widthPct={widthPct} fillPct={fillPct} index={i} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StageRow({
  stage,
  widthPct,
  fillPct,
  index,
}: {
  stage: (typeof FUNNEL)[number];
  widthPct: number;
  fillPct: number;
  index: number;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4, delay: index * 0.08 }}
        style={{
          width: `${widthPct}%`,
          minWidth: 260,
          padding: '14px 18px',
          borderRadius: 10,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-primary)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Fill */}
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${fillPct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 + index * 0.05, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(22,163,74,0.20) 0%, rgba(22,163,74,0.08) 100%)',
            zIndex: 0,
          }}
        />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
                lineHeight: 1.3,
              }}
            >
              {stage.label}
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: 'var(--text-muted)',
                marginTop: 2,
              }}
            >
              {stage.subtitle}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1,
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              {stage.current}
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 700 }}>
                {' '}/ {stage.target}
              </span>
            </div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: 'var(--accent-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                fontFamily: 'var(--font-mono, monospace)',
                marginTop: 2,
              }}
            >
              {stage.target === 0 ? '—' : `${Math.round((stage.current / stage.target) * 100)}%`}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
