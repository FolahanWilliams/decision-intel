'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, CheckCircle2 } from 'lucide-react';
import { DQ_CHAIN } from '@/lib/data/research-foundations';

// Howard & Matheson's six-link Decision Quality Chain.
// Rendered as a horizontal chain with clickable links; each link reveals DI
// coverage. "A chain is only as strong as its weakest link" — so each link
// carries an explicit shipped/not-shipped indicator.

export function DecisionQualityChain() {
  const [activeNum, setActiveNum] = useState<number>(1);
  const active = DQ_CHAIN.find(l => l.num === activeNum) ?? DQ_CHAIN[0];

  return (
    <section
      style={{
        padding: 18,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(14, 165, 233, 0.18)',
            color: '#0EA5E9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Link2 size={16} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            Howard & Matheson — Decision Quality Chain
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            Six links. A decision is only as strong as its weakest. Every DI audit scores every
            link. Click any link to see its coverage.
          </div>
        </div>
      </div>

      {/* Chain visualization */}
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: 0,
          marginBottom: 14,
          overflowX: 'auto',
          padding: '8px 0',
        }}
      >
        {DQ_CHAIN.map((link, i) => {
          const isActive = activeNum === link.num;
          const isLast = i === DQ_CHAIN.length - 1;
          return (
            <div
              key={link.num}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 0,
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => setActiveNum(link.num)}
                style={{
                  padding: 10,
                  width: 130,
                  minHeight: 100,
                  background: isActive ? '#0EA5E9' : 'var(--bg-card)',
                  border: `1px solid ${isActive ? '#0EA5E9' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  transition: 'all 0.12s ease',
                  position: 'relative',
                }}
              >
                {/* Shipped indicator */}
                <span
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: link.shipped ? '#16A34A' : '#F59E0B',
                  }}
                />
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: isActive ? '#fff' : '#0EA5E9',
                    color: isActive ? '#0EA5E9' : '#fff',
                    fontSize: 12,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {link.num}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: isActive ? '#fff' : 'var(--text-primary)',
                    lineHeight: 1.3,
                  }}
                >
                  {link.label}
                </span>
              </button>
              {!isLast && (
                <svg width="24" height="12" viewBox="0 0 24 12" style={{ flexShrink: 0 }}>
                  <line x1="2" y1="6" x2="22" y2="6" stroke="var(--border-color)" strokeWidth={2} />
                  <polygon points="22,2 22,10 26,6" fill="var(--border-color)" />
                </svg>
              )}
            </div>
          );
        })}
      </div>

      {/* Active link detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active.num}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          style={{
            padding: 14,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: '3px solid #0EA5E9',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#0EA5E9',
                padding: '3px 8px',
                background: 'rgba(14, 165, 233, 0.14)',
                borderRadius: 4,
              }}
            >
              Link {active.num} of 6 · {active.label}
            </span>
            {active.shipped && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#16A34A',
                  padding: '3px 8px',
                  background: 'rgba(22, 163, 74, 0.14)',
                  borderRadius: 4,
                }}
              >
                <CheckCircle2 size={10} /> Shipped
              </span>
            )}
          </div>
          <h4
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 6px',
              lineHeight: 1.3,
            }}
          >
            {active.question}
          </h4>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-primary)',
              lineHeight: 1.55,
            }}
          >
            {active.diCoverage}
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
