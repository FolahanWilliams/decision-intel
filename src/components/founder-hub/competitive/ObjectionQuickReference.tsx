'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield } from 'lucide-react';
import { COMMON_OBJECTIONS, type Objection } from '@/lib/data/competitive-positioning';

export function ObjectionQuickReference() {
  const [activeId, setActiveId] = useState<string>(COMMON_OBJECTIONS[0].id);
  const active = COMMON_OBJECTIONS.find(o => o.id === activeId)!;

  return (
    <div>
      {/* Objection chips */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          marginBottom: 14,
        }}
      >
        {COMMON_OBJECTIONS.map((obj: Objection) => {
          const isActive = obj.id === activeId;
          return (
            <button
              key={obj.id}
              onClick={() => setActiveId(obj.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: isActive ? '#fff' : 'var(--text-primary)',
                background: isActive ? '#0EA5E9' : 'var(--bg-card)',
                border: isActive ? '1.5px solid #0EA5E9' : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left',
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '2px 6px',
                  borderRadius: 3,
                  background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(14,165,233,0.15)',
                  color: isActive ? '#fff' : '#0EA5E9',
                }}
              >
                {obj.tag}
              </span>
              <span
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical' as const,
                  overflow: 'hidden',
                  maxWidth: 240,
                }}
              >
                {obj.objection}
              </span>
            </button>
          );
        })}
      </div>

      {/* Detail card */}
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
            borderLeft: '3px solid #0EA5E9',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: 'rgba(14,165,233,0.15)',
                color: '#0EA5E9',
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
                  color: '#EF4444',
                }}
              >
                Objection · {active.tag}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  fontStyle: 'italic',
                  marginTop: 2,
                }}
              >
                &ldquo;{active.objection}&rdquo;
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 12,
              padding: 14,
              background: 'var(--bg-secondary)',
              borderLeft: '2px solid #16A34A',
              borderRadius: 6,
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
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {active.response}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
