'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import {
  SPINE_STEPS,
  STATUS_COLOR,
  STATUS_LABEL,
  type SpineStep,
} from '@/lib/data/positioning-copilot';

export function PositioningSpine() {
  const [openId, setOpenId] = useState<string | null>('category');

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 12,
        }}
      >
        {SPINE_STEPS.map(step => (
          <SpineCard
            key={step.id}
            step={step}
            isOpen={openId === step.id}
            onToggle={() => setOpenId(openId === step.id ? null : step.id)}
          />
        ))}
      </div>
    </div>
  );
}

function SpineCard({
  step,
  isOpen,
  onToggle,
}: {
  step: SpineStep;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const color = STATUS_COLOR[step.status];

  return (
    <motion.div
      layout
      transition={{ duration: 0.2 }}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid var(--border-color)`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 'var(--radius-md)',
        padding: 14,
        cursor: 'pointer',
      }}
      onClick={onToggle}
    >
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: `${color}15`,
              color,
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {step.step}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.2,
              }}
            >
              {step.title}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
              {step.question}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color,
              background: `${color}12`,
              border: `1px solid ${color}30`,
              padding: '3px 7px',
              borderRadius: 4,
              whiteSpace: 'nowrap',
            }}
          >
            {STATUS_LABEL[step.status]}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ color: 'var(--text-muted)', display: 'flex' }}
          >
            <ChevronDown size={14} />
          </motion.div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ paddingTop: 12, fontSize: 12, lineHeight: 1.55 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-muted)',
                  marginBottom: 6,
                }}
              >
                Our answer
              </div>
              <p style={{ color: 'var(--text-primary)', margin: 0 }}>{step.answer}</p>

              <div
                style={{
                  marginTop: 12,
                  padding: 10,
                  background: 'var(--bg-secondary)',
                  borderRadius: 6,
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  borderLeft: '2px solid var(--border-color)',
                }}
              >
                <strong style={{ color: 'var(--text-primary)' }}>Failure mode:</strong>{' '}
                {step.failureMode}
              </div>

              {step.nextAction && (
                <div
                  style={{
                    marginTop: 10,
                    padding: 10,
                    background: `${color}10`,
                    border: `1px solid ${color}30`,
                    borderRadius: 6,
                    fontSize: 11,
                    color: 'var(--text-primary)',
                  }}
                >
                  <strong style={{ color }}>Next move:</strong> {step.nextAction}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
