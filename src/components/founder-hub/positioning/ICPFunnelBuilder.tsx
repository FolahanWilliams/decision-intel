'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ICP_STEPS, ICP_CLOSING } from '@/lib/data/positioning-frameworks';

function formatCount(n: number): string {
  if (n >= 100000) return `${(n / 1000).toFixed(0)}K`;
  if (n >= 10000) return `${(n / 1000).toFixed(0)}K`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return `${n}`;
}

export function ICPFunnelBuilder() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const active = ICP_STEPS.find(s => s.step === activeStep)!;
  const max = ICP_STEPS[0].universeSize;
  const min = ICP_STEPS[ICP_STEPS.length - 1].universeSize;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(260px, 320px) 1fr',
        gap: 16,
      }}
    >
      {/* Funnel visualization */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: 14,
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            marginBottom: 4,
          }}
        >
          Narrowing funnel
        </div>
        <div
          style={{
            fontSize: 10,
            color: 'var(--text-muted)',
            marginBottom: 10,
          }}
        >
          {formatCount(max)} → {formatCount(min)} accounts
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {ICP_STEPS.map(step => {
            const widthPct = Math.max(
              12,
              Math.min(100, (Math.log(step.universeSize) / Math.log(max)) * 100)
            );
            const isActive = step.step === activeStep;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.step)}
                style={{
                  position: 'relative',
                  width: `${widthPct}%`,
                  alignSelf: 'center',
                  padding: '8px 10px',
                  background: isActive ? '#16A34A' : 'var(--bg-secondary)',
                  color: isActive ? '#fff' : 'var(--text-primary)',
                  border: isActive ? '1.5px solid #16A34A' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <div
                      style={{
                        fontSize: 8,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: isActive ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)',
                      }}
                    >
                      Step {step.step}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        lineHeight: 1.2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {step.title}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: isActive ? 'rgba(255,255,255,0.95)' : 'var(--text-muted)',
                      flexShrink: 0,
                    }}
                  >
                    {formatCount(step.universeSize)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Closing box */}
        <div
          style={{
            marginTop: 12,
            padding: 10,
            background: 'rgba(22, 163, 74, 0.08)',
            border: '1px solid rgba(22, 163, 74, 0.3)',
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
              marginBottom: 4,
            }}
          >
            {ICP_CLOSING.title}
          </div>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              fontSize: 10,
              color: 'var(--text-primary)',
              lineHeight: 1.55,
            }}
          >
            {ICP_CLOSING.bullets.map(b => (
              <li
                key={b}
                style={{
                  paddingLeft: 10,
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 7,
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: '#16A34A',
                  }}
                />
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Step detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.18 }}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: '3px solid #16A34A',
            borderRadius: 'var(--radius-md)',
            padding: 18,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
              marginBottom: 10,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                }}
              >
                Step {active.step} of {ICP_STEPS.length}
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
              <div style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                {active.question}
              </div>
            </div>
            <div
              style={{
                padding: '6px 10px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                fontSize: 18,
                fontWeight: 800,
                color: '#16A34A',
              }}
            >
              {formatCount(active.universeSize)}
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
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#16A34A',
                marginBottom: 6,
              }}
            >
              Our answer
            </div>
            {active.diAnswer}
          </div>

          <div
            style={{
              padding: 10,
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 6,
              fontSize: 11,
              color: 'var(--text-primary)',
            }}
          >
            <strong style={{ color: '#F59E0B' }}>Narrow to:</strong> {active.narrowTo}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
