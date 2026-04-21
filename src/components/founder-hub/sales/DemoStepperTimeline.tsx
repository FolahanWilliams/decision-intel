'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Clock, Lightbulb } from 'lucide-react';
import { DEMO_STEPS, DEMO_TOTAL } from '@/lib/data/sales-toolkit';

export function DemoStepperTimeline() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const active = DEMO_STEPS.find(s => s.step === activeStep)!;

  return (
    <div>
      <div
        style={{
          padding: 10,
          background: 'var(--bg-card)',
          border: '1px dashed var(--border-color)',
          borderRadius: 'var(--radius-md)',
          fontSize: 11,
          color: 'var(--text-muted)',
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Clock size={12} style={{ color: '#16A34A' }} />
        <span>
          Total demo time: <strong style={{ color: 'var(--text-primary)' }}>{DEMO_TOTAL}</strong>.
          Follow the sequence for maximum impact. Step 5 is the wow moment — let the silence land.
        </span>
      </div>

      {/* Step rail */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          overflowX: 'auto',
          marginBottom: 14,
          padding: '4px 0',
        }}
      >
        {DEMO_STEPS.map(step => {
          const isActive = step.step === activeStep;
          const isWow = step.isWowMoment;
          return (
            <button
              key={step.step}
              onClick={() => setActiveStep(step.step)}
              style={{
                flex: '0 0 auto',
                width: 150,
                padding: 10,
                background: isActive ? (isWow ? '#F59E0B' : '#16A34A') : 'var(--bg-card)',
                color: isActive ? '#fff' : 'var(--text-primary)',
                border: isActive
                  ? `1.5px solid ${isWow ? '#F59E0B' : '#16A34A'}`
                  : '1px solid var(--border-color)',
                borderLeft: `3px solid ${isWow ? '#F59E0B' : '#16A34A'}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: isActive
                      ? 'rgba(255,255,255,0.22)'
                      : isWow
                        ? 'rgba(245, 158, 11, 0.15)'
                        : 'rgba(22, 163, 74, 0.15)',
                    color: isActive ? '#fff' : isWow ? '#F59E0B' : '#16A34A',
                    fontSize: 10,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {step.step}
                </span>
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: isActive ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)',
                  }}
                >
                  {step.timing}
                </span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                {step.title}
              </div>
              {isWow && (
                <Sparkles
                  size={10}
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    color: isActive ? '#fff' : '#F59E0B',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Detail */}
      <AnimatePresence mode="wait">
        {active && (
          <motion.div
            key={active.step}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            style={{
              padding: 18,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderLeft: `3px solid ${active.isWowMoment ? '#F59E0B' : '#16A34A'}`,
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: 12,
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: active.isWowMoment ? '#F59E0B' : '#16A34A',
                  }}
                >
                  Step {active.step} of {DEMO_STEPS.length} · {active.timing}
                  {active.isWowMoment && ' · WOW MOMENT'}
                </div>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    margin: '2px 0 0',
                  }}
                >
                  {active.title}
                </h3>
              </div>
            </div>

            <DemoBlock label="Action" body={active.action} accent="#16A34A" />
            <div style={{ height: 10 }} />
            <div
              style={{
                padding: 12,
                background: 'rgba(22, 163, 74, 0.05)',
                borderLeft: '2px solid #16A34A',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                fontSize: 11,
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
              }}
            >
              <Lightbulb size={12} style={{ color: '#16A34A', marginTop: 2, flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#16A34A' }}>Tip:</strong> {active.tip}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DemoBlock({ label, body, accent }: { label: string; body: string; accent: string }) {
  return (
    <div
      style={{
        padding: 12,
        background: 'var(--bg-secondary)',
        borderRadius: 6,
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: accent,
          marginBottom: 5,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>{body}</div>
    </div>
  );
}
