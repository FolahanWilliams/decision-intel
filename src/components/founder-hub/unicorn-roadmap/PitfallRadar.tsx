'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { PITFALLS, type Pitfall } from './data';
import { SectionHeader } from './UnicornTimeline';

const SEVERITY_META: Record<Pitfall['severity'], { color: string; label: string }> = {
  critical: { color: '#EF4444', label: 'Critical' },
  high: { color: '#F59E0B', label: 'High' },
  medium: { color: '#3B82F6', label: 'Medium' },
};

const LIKELIHOOD_META: Record<Pitfall['likelihood'], string> = {
  likely: 'Likely',
  possible: 'Possible',
  watch: 'Watch',
};

export function PitfallRadar() {
  const [open, setOpen] = useState<string | null>('solo');

  return (
    <section
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 32,
      }}
    >
      <SectionHeader
        eyebrow="The failure modes"
        title="Ten ways this dies. Mitigations on file."
        subtitle="Each pitfall has a tripwire — a concrete signal that triggers escalation."
      />
      <div style={{ padding: '18px 22px 28px', display: 'grid', gap: 10 }}>
        {PITFALLS.map((p, i) => {
          const sev = SEVERITY_META[p.severity];
          const isOpen = open === p.id;
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
              style={{
                borderRadius: 10,
                background: 'var(--bg-elevated)',
                border: `1px solid ${isOpen ? sev.color : 'var(--border-primary)'}`,
                overflow: 'hidden',
                transition: 'border-color 0.2s',
              }}
            >
              <button
                onClick={() => setOpen(isOpen ? null : p.id)}
                style={{
                  width: '100%',
                  padding: 14,
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'grid',
                  gridTemplateColumns: '28px 1fr auto',
                  alignItems: 'center',
                  gap: 14,
                  color: 'var(--text-primary)',
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: `${sev.color}18`,
                    border: `1px solid ${sev.color}40`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AlertTriangle size={14} color={sev.color} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.01em',
                      lineHeight: 1.35,
                    }}
                  >
                    {p.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      fontFamily: 'var(--font-mono, monospace)',
                      marginTop: 3,
                    }}
                  >
                    <span style={{ color: sev.color }}>{sev.label}</span>
                    <span style={{ margin: '0 6px', color: 'var(--border-primary)' }}>·</span>
                    {LIKELIHOOD_META[p.likelihood]}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono, monospace)',
                    letterSpacing: '0.1em',
                  }}
                >
                  {isOpen ? '–' : '+'}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{
                      borderTop: '1px solid var(--border-primary)',
                      padding: '14px 18px 16px 56px',
                      display: 'grid',
                      gap: 10,
                    }}
                  >
                    <DetailRow label="Mitigation" body={p.mitigation} />
                    <DetailRow label="Tripwire" body={p.tripwire} accent={sev.color} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function DetailRow({ label, body, accent }: { label: string; body: string; accent?: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 9.5,
          fontWeight: 800,
          color: accent ?? 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          fontFamily: 'var(--font-mono, monospace)',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{body}</div>
    </div>
  );
}
