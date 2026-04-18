'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, CheckCircle, MessageSquare } from 'lucide-react';
import { CHALLENGER, MEDDPICC, SPIN } from '@/lib/data/sales-toolkit';

type FrameworkKey = 'challenger' | 'meddpicc' | 'spin';

const FRAMEWORK_META: Record<FrameworkKey, { label: string; color: string; icon: React.ReactNode; subtitle: string }> = {
  challenger: {
    label: 'Challenger Sale',
    color: '#0EA5E9',
    icon: <Target size={14} />,
    subtitle: 'Teach. Tailor. Take control.',
  },
  meddpicc: {
    label: 'MEDDPICC',
    color: '#8B5CF6',
    icon: <CheckCircle size={14} />,
    subtitle: 'Qualify every enterprise opp above $50k.',
  },
  spin: {
    label: 'SPIN',
    color: '#F59E0B',
    icon: <MessageSquare size={14} />,
    subtitle: 'Situation → Problem → Implication → Need-payoff.',
  },
};

export function SalesFrameworkBrowser() {
  const [framework, setFramework] = useState<FrameworkKey>('challenger');

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
        {(Object.keys(FRAMEWORK_META) as FrameworkKey[]).map(key => {
          const meta = FRAMEWORK_META[key];
          const isActive = framework === key;
          return (
            <button
              key={key}
              onClick={() => setFramework(key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: isActive ? '#fff' : 'var(--text-primary)',
                background: isActive ? meta.color : 'var(--bg-card)',
                border: isActive ? `1.5px solid ${meta.color}` : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {meta.icon}
              {meta.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={framework}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {framework === 'challenger' && <ChallengerView />}
          {framework === 'meddpicc' && <MeddpiccView />}
          {framework === 'spin' && <SpinView />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ChallengerView() {
  const meta = FRAMEWORK_META.challenger;
  return (
    <div>
      <div
        style={{
          padding: 12,
          background: `${meta.color}0d`,
          border: `1px solid ${meta.color}30`,
          borderRadius: 'var(--radius-md)',
          marginBottom: 12,
          fontSize: 12,
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
        }}
      >
        {CHALLENGER.intro}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 10,
          marginBottom: 12,
        }}
      >
        {CHALLENGER.pillars.map(p => (
          <div
            key={p.title}
            style={{
              padding: 14,
              background: 'var(--bg-card)',
              border: `1px solid ${meta.color}30`,
              borderLeft: `3px solid ${meta.color}`,
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
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: meta.color,
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {p.number}
              </span>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: meta.color,
                  letterSpacing: '0.04em',
                }}
              >
                {p.title}
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {p.description}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          padding: 10,
          background: 'var(--bg-card)',
          border: `1px dashed ${meta.color}40`,
          borderRadius: 'var(--radius-md)',
          fontSize: 11,
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
          fontStyle: 'italic',
        }}
      >
        <strong style={{ color: meta.color, fontStyle: 'normal' }}>Why this fits DI:</strong>{' '}
        {CHALLENGER.footnote}
      </div>
    </div>
  );
}

function MeddpiccView() {
  const meta = FRAMEWORK_META.meddpicc;
  return (
    <div>
      <div
        style={{
          padding: 12,
          background: `${meta.color}0d`,
          border: `1px solid ${meta.color}30`,
          borderRadius: 'var(--radius-md)',
          marginBottom: 12,
          fontSize: 12,
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
        }}
      >
        {MEDDPICC.intro}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {MEDDPICC.items.map((item, i) => (
          <div
            key={`${item.letter}-${i}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '44px 160px 1fr',
              gap: 12,
              padding: '10px 12px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderLeft: `3px solid ${meta.color}`,
              borderRadius: 'var(--radius-md)',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: meta.color,
                textAlign: 'center',
              }}
            >
              {item.letter}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              {item.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {item.prompt}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SpinView() {
  const meta = FRAMEWORK_META.spin;
  return (
    <div>
      <div
        style={{
          padding: 12,
          background: `${meta.color}0d`,
          border: `1px solid ${meta.color}30`,
          borderRadius: 'var(--radius-md)',
          marginBottom: 12,
          fontSize: 12,
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
        }}
      >
        {SPIN.intro}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SPIN.stages.map(stage => (
          <div
            key={stage.stage}
            style={{
              padding: 14,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderLeft: `3px solid ${meta.color}`,
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: meta.color,
                marginBottom: 4,
              }}
            >
              {stage.stage}
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                marginBottom: 8,
                fontStyle: 'italic',
              }}
            >
              {stage.description}
            </div>
            <ul
              style={{
                margin: 0,
                padding: 0,
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {stage.questions.map((q, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: 12,
                    color: 'var(--text-primary)',
                    padding: '6px 10px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 4,
                    lineHeight: 1.55,
                  }}
                >
                  <span style={{ color: meta.color, fontWeight: 700, marginRight: 6 }}>
                    Q{i + 1}.
                  </span>
                  {q}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
