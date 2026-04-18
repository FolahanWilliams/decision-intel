'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertTriangle, ArrowRight } from 'lucide-react';
import {
  POSITIONING_FLOW,
  FLOW_CLOSING,
  type FlowStep,
} from '@/lib/data/positioning-frameworks';

const FLAG_COLOR: Record<FlowStep['diFlag'], string> = {
  yes: '#16A34A',
  partial: '#F59E0B',
  no: '#EF4444',
};

const FLAG_ICON: Record<FlowStep['diFlag'], React.ReactNode> = {
  yes: <Check size={12} />,
  partial: <AlertTriangle size={12} />,
  no: <X size={12} />,
};

const FLAG_LABEL: Record<FlowStep['diFlag'], string> = {
  yes: 'YES',
  partial: 'PARTIAL',
  no: 'NO',
};

export function PositioningFlow() {
  const [openId, setOpenId] = useState<string | null>(null);

  const firstPartialOrNo = POSITIONING_FLOW.find(s => s.diFlag !== 'yes');

  return (
    <div>
      {/* Status chip */}
      <div
        style={{
          padding: 12,
          background: 'var(--bg-card)',
          border: `1px solid var(--border-color)`,
          borderLeft: `3px solid ${firstPartialOrNo ? '#F59E0B' : '#16A34A'}`,
          borderRadius: 'var(--radius-md)',
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: firstPartialOrNo ? '#F59E0B' : '#16A34A',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {firstPartialOrNo ? <AlertTriangle size={14} /> : <Check size={14} />}
        </div>
        <div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: firstPartialOrNo ? '#F59E0B' : '#16A34A',
            }}
          >
            Diagnostic
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
            {firstPartialOrNo
              ? `First weak step: Step ${firstPartialOrNo.step} — ${firstPartialOrNo.title}. Fix this before scaling outreach.`
              : 'All 8 positioning checks pass. Ship.'}
          </div>
        </div>
      </div>

      {/* Flowchart */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 10,
        }}
      >
        {POSITIONING_FLOW.map(step => {
          const color = FLAG_COLOR[step.diFlag];
          const isOpen = openId === step.id;
          return (
            <motion.div
              key={step.id}
              layout
              transition={{ duration: 0.18 }}
              onClick={() => setOpenId(isOpen ? null : step.id)}
              style={{
                background: 'var(--bg-card)',
                border: `1px solid ${isOpen ? color : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)',
                padding: 14,
                cursor: 'pointer',
                position: 'relative',
                boxShadow: isOpen ? `0 0 0 2px ${color}22` : 'none',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: `${color}18`,
                    color,
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
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    flex: 1,
                  }}
                >
                  {step.title}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 7px',
                    background: `${color}15`,
                    color,
                    borderRadius: 4,
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    border: `1px solid ${color}40`,
                  }}
                >
                  {FLAG_ICON[step.diFlag]}
                  {FLAG_LABEL[step.diFlag]}
                </div>
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  fontStyle: 'italic',
                  marginBottom: isOpen ? 10 : 0,
                }}
              >
                {step.question}
              </div>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div
                      style={{
                        paddingTop: 4,
                        fontSize: 12,
                        color: 'var(--text-primary)',
                        lineHeight: 1.5,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: '#16A34A',
                          marginBottom: 4,
                        }}
                      >
                        What YES looks like
                      </div>
                      {step.yesAnswer}
                      <div
                        style={{
                          marginTop: 10,
                          padding: 10,
                          background: 'rgba(239, 68, 68, 0.06)',
                          borderLeft: '2px solid #EF4444',
                          borderRadius: 4,
                          fontSize: 11,
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <strong style={{ color: '#EF4444' }}>If NO:</strong> {step.noFailure}
                      </div>
                      <div
                        style={{
                          marginTop: 10,
                          padding: 10,
                          background: `${color}10`,
                          borderLeft: `2px solid ${color}`,
                          borderRadius: 4,
                          fontSize: 11,
                          color: 'var(--text-primary)',
                        }}
                      >
                        <strong style={{ color }}>Decision Intel now:</strong> {step.diNote}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Closing principles */}
      <div
        style={{
          marginTop: 14,
          padding: 14,
          background: 'linear-gradient(135deg, rgba(22,163,74,0.1), rgba(14,165,233,0.05))',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#16A34A',
            marginBottom: 8,
          }}
        >
          {FLOW_CLOSING.principle}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {FLOW_CLOSING.rules.map((r, i) => (
            <div
              key={r}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '5px 10px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              <span style={{ color: '#16A34A', fontWeight: 800, fontSize: 10 }}>{i + 1}.</span>
              {r}
              {i < FLOW_CLOSING.rules.length - 1 && (
                <ArrowRight size={10} style={{ color: 'var(--text-muted)', marginLeft: 2 }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
