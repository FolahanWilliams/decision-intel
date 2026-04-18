'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, Shield, Rocket } from 'lucide-react';
import { PITCH_REFRAME } from '@/lib/data/sales-toolkit';

type Mode = 'defensive' | 'offensive';

export function PitchReframeToggle() {
  const [mode, setMode] = useState<Mode>('offensive');
  const active = PITCH_REFRAME[mode];

  return (
    <div>
      {/* Toggle */}
      <div
        style={{
          display: 'inline-flex',
          padding: 4,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          marginBottom: 12,
        }}
      >
        <button
          onClick={() => setMode('defensive')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 600,
            color: mode === 'defensive' ? '#fff' : 'var(--text-secondary)',
            background: mode === 'defensive' ? PITCH_REFRAME.defensive.color : 'transparent',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          <Shield size={14} />
          Defensive
        </button>
        <button
          onClick={() => setMode('offensive')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 600,
            color: mode === 'offensive' ? '#fff' : 'var(--text-secondary)',
            background: mode === 'offensive' ? PITCH_REFRAME.offensive.color : 'transparent',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          <Rocket size={14} />
          Offensive
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <PitchPanel
          label={PITCH_REFRAME.defensive.label}
          pitch={PITCH_REFRAME.defensive.pitch}
          attracts={PITCH_REFRAME.defensive.attracts}
          color={PITCH_REFRAME.defensive.color}
          dim={mode !== 'defensive'}
        />
        <PitchPanel
          label={PITCH_REFRAME.offensive.label}
          pitch={PITCH_REFRAME.offensive.pitch}
          attracts={PITCH_REFRAME.offensive.attracts}
          color={PITCH_REFRAME.offensive.color}
          dim={mode !== 'offensive'}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          style={{
            padding: 12,
            background: 'var(--bg-card)',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
          }}
        >
          <ArrowLeftRight size={14} style={{ color: active.color, marginTop: 2, flexShrink: 0 }} />
          <div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: active.color,
                marginBottom: 3,
              }}
            >
              Why this works
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
              }}
            >
              {PITCH_REFRAME.rationale}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function PitchPanel({
  label,
  pitch,
  attracts,
  color,
  dim,
}: {
  label: string;
  pitch: string;
  attracts: string;
  color: string;
  dim: boolean;
}) {
  return (
    <motion.div
      animate={{ opacity: dim ? 0.4 : 1, scale: dim ? 0.98 : 1 }}
      transition={{ duration: 0.2 }}
      style={{
        padding: 14,
        background: dim ? 'var(--bg-card)' : `${color}0d`,
        border: `1px solid ${dim ? 'var(--border-color)' : `${color}50`}`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 'var(--radius-md)',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          color: 'var(--text-primary)',
          lineHeight: 1.55,
          fontStyle: 'italic',
          marginBottom: 10,
        }}
      >
        &ldquo;{pitch}&rdquo;
      </div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
        }}
      >
        Attracts · {attracts}
      </div>
    </motion.div>
  );
}
