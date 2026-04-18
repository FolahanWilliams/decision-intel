'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, FileCode } from 'lucide-react';
import {
  MOAT_LAYERS,
  MOAT_STRENGTH_COLOR,
  MOAT_STRENGTH_LABEL,
  type MoatLayer,
} from '@/lib/data/competitive-positioning';

export function MoatLayersStack() {
  const [activeId, setActiveId] = useState<string>(MOAT_LAYERS[2].id); // very-high moat by default
  const active = MOAT_LAYERS.find(m => m.id === activeId)!;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(260px, 320px) 1fr',
        gap: 16,
      }}
    >
      {/* Stack */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {MOAT_LAYERS.map((layer, i) => {
          const color = MOAT_STRENGTH_COLOR[layer.strength];
          const isActive = layer.id === activeId;
          return (
            <motion.button
              key={layer.id}
              onClick={() => setActiveId(layer.id)}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: 0.04 * i }}
              style={{
                position: 'relative',
                padding: 12,
                background: isActive ? color : 'var(--bg-card)',
                color: isActive ? '#fff' : 'var(--text-primary)',
                border: isActive
                  ? `1.5px solid ${color}`
                  : '1px solid var(--border-color)',
                borderLeft: `3px solid ${color}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                  gap: 6,
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: isActive ? 'rgba(255,255,255,0.2)' : `${color}15`,
                    color: isActive ? '#fff' : color,
                    fontSize: 10,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  L{i + 1}
                </div>
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    padding: '2px 6px',
                    borderRadius: 3,
                    background: isActive ? 'rgba(255,255,255,0.2)' : `${color}18`,
                    color: isActive ? '#fff' : color,
                  }}
                >
                  {MOAT_STRENGTH_LABEL[layer.strength]}
                </span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                {layer.name}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: isActive ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)',
                  marginTop: 2,
                }}
              >
                {layer.timeline}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Detail */}
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
            border: `1px solid var(--border-color)`,
            borderLeft: `3px solid ${MOAT_STRENGTH_COLOR[active.strength]}`,
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: `${MOAT_STRENGTH_COLOR[active.strength]}18`,
                color: MOAT_STRENGTH_COLOR[active.strength],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Lock size={16} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: MOAT_STRENGTH_COLOR[active.strength],
                }}
              >
                {MOAT_STRENGTH_LABEL[active.strength]} · {active.timeline}
              </div>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: '2px 0 0',
                }}
              >
                {active.name}
              </h3>
            </div>
          </div>

          <div
            style={{
              padding: 12,
              background: 'var(--bg-secondary)',
              borderRadius: 6,
              fontSize: 13,
              lineHeight: 1.55,
              color: 'var(--text-primary)',
            }}
          >
            {active.description}
          </div>

          <FileRefBlock files={active.files} />

          <div
            style={{
              padding: 10,
              background: `${MOAT_STRENGTH_COLOR[active.strength]}10`,
              border: `1px solid ${MOAT_STRENGTH_COLOR[active.strength]}30`,
              borderRadius: 6,
              fontSize: 11,
              color: 'var(--text-primary)',
              lineHeight: 1.55,
              fontStyle: 'italic',
            }}
          >
            <strong style={{ color: MOAT_STRENGTH_COLOR[active.strength], fontStyle: 'normal' }}>
              Why this holds:
            </strong>{' '}
            {active.why}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function FileRefBlock({ files }: { files: MoatLayer['files'] }) {
  return (
    <div
      style={{
        padding: 10,
        background: 'rgba(22,163,74,0.06)',
        border: '1px solid rgba(22,163,74,0.2)',
        borderRadius: 6,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
      }}
    >
      <FileCode size={12} style={{ color: '#16A34A', marginTop: 2, flexShrink: 0 }} />
      <div>
        <div
          style={{
            fontSize: 9,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#16A34A',
            marginBottom: 3,
          }}
        >
          In the codebase
        </div>
        <div
          style={{
            fontFamily: 'ui-monospace, Menlo, monospace',
            fontSize: 11,
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            wordBreak: 'break-word',
          }}
        >
          {files}
        </div>
      </div>
    </div>
  );
}
