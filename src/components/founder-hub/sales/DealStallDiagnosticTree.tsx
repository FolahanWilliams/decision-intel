'use client';

/**
 * Deal Stall Diagnostic Tree — when a strong-meeting buyer goes silent
 * for 2-3 weeks, what's the structured diagnostic + recovery move?
 *
 * Interactive visualization: 5 stall causes ranked by probability
 * (High / Medium / Low), each with a diagnostic signal, a recovery move,
 * and the literal recovery script Folahan sends.
 *
 * Source data: src/lib/data/sales-toolkit.ts DEAL_STALL_DIAGNOSTICS,
 * grounded in NotebookLM master KB synthesis (note 75e173e9).
 *
 * The visual: a horizontal probability ladder (High → Medium → Low) with
 * stall-cause cards in each band. Click any to expand the recovery
 * playbook. Pure CSS + Framer Motion; no SVG dependency.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ArrowRight, Mail } from 'lucide-react';
import { DEAL_STALL_DIAGNOSTICS, type DealStallDiagnostic } from '@/lib/data/sales-toolkit';

const PROBABILITY_COLORS: Record<DealStallDiagnostic['probability'], string> = {
  High: '#DC2626',
  Medium: '#D97706',
  Low: '#0EA5E9',
};

const PROBABILITY_BG: Record<DealStallDiagnostic['probability'], string> = {
  High: 'rgba(220,38,38,0.06)',
  Medium: 'rgba(217,119,6,0.06)',
  Low: 'rgba(14,165,233,0.06)',
};

export function DealStallDiagnosticTree() {
  const [activeId, setActiveId] = useState<string>(DEAL_STALL_DIAGNOSTICS[0].id);
  const active = DEAL_STALL_DIAGNOSTICS.find(d => d.id === activeId)!;

  // Group by probability band
  const grouped = DEAL_STALL_DIAGNOSTICS.reduce<
    Record<DealStallDiagnostic['probability'], DealStallDiagnostic[]>
  >(
    (acc, d) => {
      acc[d.probability].push(d);
      return acc;
    },
    { High: [], Medium: [], Low: [] }
  );

  return (
    <div>
      {/* Symptom anchor */}
      <div
        style={{
          padding: 12,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderLeft: '3px solid #94A3B8',
          borderRadius: 'var(--radius-md)',
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <AlertCircle size={16} style={{ color: '#94A3B8', flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Symptom:</strong> a design-partner
          candidate had a strong meeting (the WeWork or Dangote live audit landed; they leaned
          forward) — but they&apos;ve gone silent for 2-3 weeks. Below: 5 root causes ranked by
          probability + the recovery move for each.
        </span>
      </div>

      {/* Probability bands */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
        {(['High', 'Medium', 'Low'] as const).map(band => {
          const items = grouped[band];
          if (items.length === 0) return null;
          const color = PROBABILITY_COLORS[band];
          const bg = PROBABILITY_BG[band];
          return (
            <div
              key={band}
              style={{
                padding: 10,
                background: bg,
                border: `1px solid ${color}30`,
                borderLeft: `3px solid ${color}`,
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: 8,
                }}
              >
                {band} probability ({items.length})
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 6,
                }}
              >
                {items.map(d => {
                  const isActive = d.id === activeId;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setActiveId(d.id)}
                      style={{
                        padding: '8px 12px',
                        background: isActive ? color : 'var(--bg-card)',
                        color: isActive ? '#fff' : 'var(--text-primary)',
                        border: `1px solid ${isActive ? color : 'var(--border-color)'}`,
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: 12,
                        fontWeight: isActive ? 700 : 600,
                        lineHeight: 1.3,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {d.title}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          style={{
            padding: 18,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: `3px solid ${PROBABILITY_COLORS[active.probability]}`,
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: PROBABILITY_COLORS[active.probability],
                background: PROBABILITY_BG[active.probability],
                padding: '2px 8px',
                borderRadius: 999,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {active.probability} probability
            </span>
          </div>

          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: 10,
            }}
          >
            {active.title}
          </div>

          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: PROBABILITY_COLORS[active.probability],
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 4,
              }}
            >
              Diagnostic
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.55 }}>
              {active.diagnostic}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: '#16A34A',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <ArrowRight size={10} />
              Recovery move
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.55 }}>
              {active.recoveryMove}
            </div>
          </div>

          <div
            style={{
              padding: 12,
              background: 'var(--bg-secondary)',
              borderLeft: '2px solid #16A34A',
              borderRadius: 4,
              fontSize: 12,
              color: 'var(--text-primary)',
              fontStyle: 'italic',
              lineHeight: 1.55,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: '#16A34A',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontStyle: 'normal',
              }}
            >
              <Mail size={10} />
              Folahan literally sends
            </div>
            {active.recoveryScript}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
