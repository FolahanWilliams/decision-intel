'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, AlertTriangle } from 'lucide-react';
import {
  SALES_STEPS,
  SALES_PRINCIPLES,
  type SalesStep,
} from '@/lib/data/positioning-frameworks';

export function SalesCallScript() {
  const [openId, setOpenId] = useState<string | null>('customer');

  return (
    <div>
      {/* Step rail */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          marginBottom: 12,
          padding: 6,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 6,
        }}
      >
        {SALES_STEPS.map(step => {
          const isOpen = openId === step.id;
          return (
            <button
              key={step.id}
              onClick={() => setOpenId(step.id)}
              style={{
                padding: '6px 10px',
                fontSize: 11,
                fontWeight: 600,
                color: isOpen ? '#fff' : 'var(--text-secondary)',
                background: isOpen ? '#16A34A' : 'transparent',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                transition: 'all 0.12s ease',
              }}
            >
              {step.step}. {step.title}
            </button>
          );
        })}
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {SALES_STEPS.map(step => (
          <StepCard
            key={step.id}
            step={step}
            isOpen={openId === step.id}
            onToggle={() => setOpenId(openId === step.id ? null : step.id)}
          />
        ))}
      </div>

      {/* Principles */}
      <div
        style={{
          marginTop: 16,
          padding: 14,
          background: 'linear-gradient(135deg, rgba(22,163,74,0.08), rgba(139,92,246,0.04))',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#16A34A',
            marginBottom: 8,
          }}
        >
          Great salespeople always
        </div>
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 6,
          }}
        >
          {SALES_PRINCIPLES.map(p => (
            <li
              key={p}
              style={{
                fontSize: 11,
                color: 'var(--text-primary)',
                padding: '6px 10px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 4,
                lineHeight: 1.4,
              }}
            >
              {p}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StepCard({
  step,
  isOpen,
  onToggle,
}: {
  step: SalesStep;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      layout
      transition={{ duration: 0.18 }}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid var(--border-color)`,
        borderLeft: `3px solid #16A34A`,
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: 'rgba(22, 163, 74, 0.15)',
              color: '#16A34A',
              fontSize: 11,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {step.step}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              {step.title}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
              {step.purpose}
            </div>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          style={{ color: 'var(--text-muted)', flexShrink: 0 }}
        >
          <ChevronDown size={14} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 14px 14px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <ScriptBlock label="You ask" body={step.youAsk} accent="#16A34A" />
                <ScriptBlock label="They say" body={step.theyMightSay} accent="#64748B" />
                <ScriptBlock label="You respond" body={step.youRespond} accent="#8B5CF6" />
              </div>
              <div
                style={{
                  padding: 10,
                  background: 'rgba(239, 68, 68, 0.06)',
                  borderLeft: '2px solid #EF4444',
                  borderRadius: 4,
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 6,
                }}
              >
                <AlertTriangle size={12} style={{ color: '#EF4444', marginTop: 1, flexShrink: 0 }} />
                <div>
                  <strong style={{ color: '#EF4444' }}>Trap to avoid:</strong> {step.trapToAvoid}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ScriptBlock({
  label,
  body,
  accent,
}: {
  label: string;
  body: string;
  accent: string;
}) {
  return (
    <div
      style={{
        padding: 10,
        background: 'var(--bg-secondary)',
        border: `1px solid var(--border-color)`,
        borderLeft: `2px solid ${accent}`,
        borderRadius: 4,
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: accent,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 12,
          color: 'var(--text-primary)',
          lineHeight: 1.5,
          fontStyle: 'italic',
        }}
      >
        {body}
      </div>
    </div>
  );
}
