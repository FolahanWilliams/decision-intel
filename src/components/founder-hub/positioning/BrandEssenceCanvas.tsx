'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BRAND_STEPS, type BrandStep } from '@/lib/data/positioning-frameworks';
import { STATUS_COLOR, STATUS_LABEL } from '@/lib/data/positioning-copilot';

export function BrandEssenceCanvas() {
  const [activeId, setActiveId] = useState<string>('essence');
  const active = BRAND_STEPS.find(s => s.id === activeId)!;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 360px) 1fr',
        gap: 16,
        alignItems: 'stretch',
      }}
    >
      {/* Canvas grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 6,
          alignContent: 'start',
        }}
      >
        {BRAND_STEPS.map(step => (
          <CanvasCell
            key={step.id}
            step={step}
            isActive={step.id === activeId}
            onClick={() => setActiveId(step.id)}
          />
        ))}
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
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: `3px solid ${STATUS_COLOR[active.status]}`,
            borderRadius: 'var(--radius-md)',
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
            }}
          >
            Step {active.step}
          </div>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '2px 0 4px',
            }}
          >
            {active.title}
          </h3>
          <p
            style={{
              fontSize: 12,
              fontStyle: 'italic',
              color: 'var(--text-secondary)',
              margin: '0 0 14px',
            }}
          >
            {active.question}
          </p>

          <div
            style={{
              padding: 12,
              background: 'var(--bg-secondary)',
              borderRadius: 6,
              fontSize: 13,
              lineHeight: 1.6,
              color: 'var(--text-primary)',
              marginBottom: 12,
              flex: 1,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: STATUS_COLOR[active.status],
                marginBottom: 6,
              }}
            >
              Our answer · {STATUS_LABEL[active.status]}
            </div>
            {active.diAnswer}
          </div>

          <div
            style={{
              padding: 10,
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 6,
              fontSize: 11,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: '#EF4444' }}>If weak:</strong> {active.ifWeak}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function CanvasCell({
  step,
  isActive,
  onClick,
}: {
  step: BrandStep;
  isActive: boolean;
  onClick: () => void;
}) {
  const color = STATUS_COLOR[step.status];
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left',
        padding: 12,
        minHeight: 92,
        background: isActive ? color : 'var(--bg-card)',
        color: isActive ? '#fff' : 'var(--text-primary)',
        border: isActive ? `1.5px solid ${color}` : `1px solid var(--border-color)`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        transition: 'all 0.15s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: isActive ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)',
          }}
        >
          Step {step.step}
        </span>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            background: isActive ? '#fff' : color,
          }}
        />
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          lineHeight: 1.2,
        }}
      >
        {step.title}
      </div>
      <div
        style={{
          fontSize: 10,
          color: isActive ? 'rgba(255,255,255,0.85)' : 'var(--text-secondary)',
          lineHeight: 1.35,
        }}
      >
        {step.question}
      </div>
    </button>
  );
}
