'use client';

import { motion } from 'framer-motion';
import { HERO } from '@/lib/data/product-overview';

const PILLAR_COLORS = ['#16A34A', '#8B5CF6', '#0EA5E9', '#F59E0B'];

export function FourMomentsHero() {
  return (
    <div
      style={{
        padding: 20,
        background: 'linear-gradient(135deg, rgba(22,163,74,0.09), rgba(14,165,233,0.04))',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#16A34A',
          marginBottom: 6,
        }}
      >
        {HERO.eyebrow}
      </div>
      <h2
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: 'var(--text-primary)',
          margin: 0,
          lineHeight: 1.25,
          maxWidth: 680,
        }}
      >
        {HERO.headline}
      </h2>
      <p
        style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          marginTop: 10,
          marginBottom: 18,
          maxWidth: 720,
        }}
      >
        {HERO.body}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 10,
        }}
      >
        {HERO.pillars.map((pillar, i) => (
          <motion.div
            key={pillar.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 * i }}
            style={{
              padding: 12,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderLeft: `3px solid ${PILLAR_COLORS[i]}`,
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: `${PILLAR_COLORS[i]}20`,
                  color: PILLAR_COLORS[i],
                  fontSize: 11,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  lineHeight: 1.2,
                }}
              >
                {pillar.label}
              </div>
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
              }}
            >
              {pillar.detail}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
