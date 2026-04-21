'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, ChevronRight } from 'lucide-react';
import { STREBULAEV_PRINCIPLES } from '@/lib/data/research-foundations';

// Strebulaev's 9 VC decision-science principles in a radial grid layout.
// Each tile reveals FOR THE PRODUCT / FOR THE STARTUP / ACTIONS on click.

export function StrebulaevPrinciples() {
  const [activeNum, setActiveNum] = useState<number>(1);
  const active = STREBULAEV_PRINCIPLES.find(p => p.num === activeNum) ?? STREBULAEV_PRINCIPLES[0];

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
            background: 'rgba(139, 92, 246, 0.18)',
            color: '#8B5CF6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Layers size={16} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            Strebulaev&rsquo;s 9 principles of VC decision science
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            Stanford GSB research on venture-capital decision-making. Each principle has a direct
            Decision Intel product implication and a founder-startup implication.
          </div>
        </div>
      </div>

      {/* Principle grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 8,
          marginBottom: 14,
        }}
      >
        {STREBULAEV_PRINCIPLES.map(p => {
          const isActive = activeNum === p.num;
          return (
            <button
              key={p.num}
              onClick={() => setActiveNum(p.num)}
              style={{
                padding: 10,
                background: isActive ? p.color : 'var(--bg-card)',
                border: `1px solid ${isActive ? p.color : 'var(--border-color)'}`,
                borderLeft: `3px solid ${p.color}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.12s ease',
                minHeight: 64,
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
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: isActive ? '#fff' : p.color,
                    color: isActive ? p.color : '#fff',
                    fontSize: 10,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {p.num}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: isActive ? '#fff' : 'var(--text-primary)',
                    lineHeight: 1.3,
                  }}
                >
                  {p.principle}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active principle detail */}
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
            borderLeft: `3px solid ${active.color}`,
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: active.color,
                color: '#fff',
                fontSize: 13,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {active.num}
            </span>
            <h4
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {active.principle}
            </h4>
          </div>
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
              margin: '0 0 12px',
              fontStyle: 'italic',
            }}
          >
            {active.summary}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 10,
              marginBottom: 12,
            }}
          >
            <PrincipleBox label="For the product" color="#16A34A" body={active.product} />
            <PrincipleBox label="For the startup" color="#22C55E" body={active.startup} />
          </div>

          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: active.color,
              marginBottom: 4,
            }}
          >
            Action items
          </div>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {active.actions.map(a => (
              <li
                key={a}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 6,
                  fontSize: 12,
                  color: 'var(--text-primary)',
                  lineHeight: 1.5,
                }}
              >
                <ChevronRight
                  size={12}
                  style={{ color: active.color, flexShrink: 0, marginTop: 3 }}
                />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

function PrincipleBox({ label, color, body }: { label: string; color: string; body: string }) {
  return (
    <div
      style={{
        padding: 10,
        background: 'var(--bg-elevated, var(--bg-secondary))',
        border: `1px solid ${color}33`,
        borderRadius: 'var(--radius-sm, 4px)',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.55 }}>{body}</div>
    </div>
  );
}
