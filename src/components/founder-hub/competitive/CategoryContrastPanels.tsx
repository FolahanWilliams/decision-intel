'use client';

import { motion } from 'framer-motion';
import { Crosshair } from 'lucide-react';
import { ELEVATOR_PITCH, CATEGORY_CONTRAST } from '@/lib/data/competitive-positioning';

export function CategoryContrastPanels() {
  return (
    <div>
      <div
        style={{
          padding: 16,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderLeft: '3px solid #16A34A',
          borderRadius: 'var(--radius-md)',
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 10,
          }}
        >
          <Crosshair size={16} style={{ color: '#16A34A' }} />
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#16A34A',
            }}
          >
            Elevator Pitch
          </div>
        </div>
        <blockquote
          style={{
            fontSize: 15,
            fontStyle: 'italic',
            color: 'var(--text-primary)',
            borderLeft: '3px solid #16A34A',
            paddingLeft: 14,
            margin: 0,
            lineHeight: 1.65,
          }}
        >
          &ldquo;{ELEVATOR_PITCH.quote}&rdquo;
        </blockquote>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 12,
          marginBottom: 14,
        }}
      >
        {[CATEGORY_CONTRAST.cloverpop, CATEGORY_CONTRAST.decisionIntel].map((side, i) => (
          <motion.div
            key={side.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 * i }}
            style={{
              position: 'relative',
              padding: 16,
              background: `${side.accent}0d`,
              border: `1px solid ${side.accent}40`,
              borderTop: `3px solid ${side.accent}`,
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: side.accent,
                marginBottom: 4,
              }}
            >
              {side.label}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: 6,
                lineHeight: 1.25,
              }}
            >
              {side.role}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {side.tagline}
            </div>
          </motion.div>
        ))}
      </div>

      <div
        style={{
          padding: 14,
          background: 'var(--bg-card)',
          border: '1px dashed var(--border-color)',
          borderRadius: 'var(--radius-md)',
          fontSize: 13,
          color: 'var(--text-primary)',
          lineHeight: 1.6,
        }}
      >
        {ELEVATOR_PITCH.closing}
      </div>
    </div>
  );
}
