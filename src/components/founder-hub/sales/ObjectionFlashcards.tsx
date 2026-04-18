'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield } from 'lucide-react';
import { SALES_OBJECTIONS, type SalesObjection } from '@/lib/data/sales-toolkit';

export function ObjectionFlashcards() {
  const [activeId, setActiveId] = useState<string>(SALES_OBJECTIONS[0].id);
  const active = SALES_OBJECTIONS.find(o => o.id === activeId)!;

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 6,
          marginBottom: 14,
        }}
      >
        {SALES_OBJECTIONS.map((obj: SalesObjection) => {
          const isActive = obj.id === activeId;
          return (
            <button
              key={obj.id}
              onClick={() => setActiveId(obj.id)}
              style={{
                padding: 10,
                background: isActive ? '#F59E0B' : 'var(--bg-card)',
                color: isActive ? '#fff' : 'var(--text-primary)',
                border: isActive ? '1.5px solid #F59E0B' : '1px solid var(--border-color)',
                borderLeft: '3px solid #F59E0B',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  fontStyle: 'italic',
                  lineHeight: 1.35,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical' as const,
                  overflow: 'hidden',
                }}
              >
                {obj.objection}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active objection detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          style={{
            padding: 18,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: '3px solid #F59E0B',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={14} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#F59E0B',
                }}
              >
                Objection
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  fontStyle: 'italic',
                }}
              >
                {active.objection}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: 14,
              background: 'var(--bg-secondary)',
              borderLeft: '2px solid #16A34A',
              borderRadius: 6,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#16A34A',
                marginBottom: 5,
              }}
            >
              Your response
            </div>
            <p
              style={{
                fontSize: 13,
                color: 'var(--text-primary)',
                lineHeight: 1.65,
                margin: 0,
              }}
            >
              {active.response}
            </p>
          </div>

          <div
            style={{
              padding: 10,
              background: 'rgba(14, 165, 233, 0.06)',
              borderLeft: '2px solid #0EA5E9',
              borderRadius: 4,
              fontSize: 11,
              color: 'var(--text-secondary)',
              fontStyle: 'italic',
            }}
          >
            <strong style={{ color: '#0EA5E9', fontStyle: 'normal' }}>Tone:</strong> {active.tone}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
