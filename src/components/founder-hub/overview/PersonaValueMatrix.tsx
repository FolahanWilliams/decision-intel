'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ArrowRight } from 'lucide-react';
import { PERSONA_ROWS, type PersonaRow } from '@/lib/data/product-overview';

const PERSONA_COLOR: Record<PersonaRow['icon'], string> = {
  strategy: '#16A34A',
  ma: '#8B5CF6',
  risk: '#EF4444',
  board: '#F59E0B',
  exec: '#0EA5E9',
};

export function PersonaValueMatrix() {
  const [activeId, setActiveId] = useState<string>(PERSONA_ROWS[0].id);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(220px, 260px) 1fr',
        gap: 12,
      }}
    >
      {/* Left column — persona selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {PERSONA_ROWS.map(row => {
          const color = PERSONA_COLOR[row.icon];
          const isActive = row.id === activeId;
          return (
            <button
              key={row.id}
              onClick={() => setActiveId(row.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: 10,
                background: isActive ? color : 'var(--bg-card)',
                color: isActive ? '#fff' : 'var(--text-primary)',
                border: isActive ? `1.5px solid ${color}` : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: isActive ? 'rgba(255,255,255,0.18)' : `${color}18`,
                  color: isActive ? '#fff' : color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Users size={14} />
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {row.persona}
              </div>
            </button>
          );
        })}
      </div>

      {/* Right column — detail */}
      <AnimatePresence mode="wait">
        {(() => {
          const row = PERSONA_ROWS.find(r => r.id === activeId)!;
          const color = PERSONA_COLOR[row.icon];
          return (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.18 }}
              style={{
                padding: 16,
                background: 'var(--bg-card)',
                border: `1px solid var(--border-color)`,
                borderLeft: `3px solid ${color}`,
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color,
                }}
              >
                {row.persona}
              </div>

              <div
                style={{
                  padding: 12,
                  background: 'rgba(239, 68, 68, 0.06)',
                  border: '1px solid rgba(239, 68, 68, 0.18)',
                  borderRadius: 6,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#EF4444',
                    marginBottom: 4,
                  }}
                >
                  Their pain
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {row.pain}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                <ArrowRight size={14} />
              </div>

              <div
                style={{
                  padding: 12,
                  background: `${color}0d`,
                  border: `1px solid ${color}40`,
                  borderRadius: 6,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color,
                    marginBottom: 4,
                  }}
                >
                  What we deliver
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {row.deliverable}
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
