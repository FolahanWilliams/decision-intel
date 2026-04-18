'use client';

import { ClipboardCheck, Eye, Users, Activity } from 'lucide-react';
import { HYGIENE_QUADRANTS } from '@/lib/data/research-foundations';

// Sibony's Decision Hygiene framework: checklists, pre-mortems, structured
// independent assessment, noise audits. Rendered as a 2x2 quadrant grid
// with DI feature mapping per quadrant.

const QUADRANT_META: Array<{ icon: React.ReactNode; accent: string }> = [
  { icon: <ClipboardCheck size={16} />, accent: '#16A34A' },
  { icon: <Eye size={16} />, accent: '#F59E0B' },
  { icon: <Users size={16} />, accent: '#0EA5E9' },
  { icon: <Activity size={16} />, accent: '#EF4444' },
];

export function DecisionHygieneQuadrants() {
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
            background: 'rgba(22, 163, 74, 0.18)',
            color: '#16A34A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ClipboardCheck size={16} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            Sibony — Decision Hygiene
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            Four practices that reduce noise without requiring domain expertise. Every one is
            embedded in the platform.
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 12,
        }}
      >
        {HYGIENE_QUADRANTS.map((q, i) => {
          const meta = QUADRANT_META[i] ?? QUADRANT_META[0];
          return (
            <div
              key={q.title}
              style={{
                padding: 14,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderLeft: `3px solid ${meta.accent}`,
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: `${meta.accent}22`,
                    color: meta.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {meta.icon}
                </span>
                <h4
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}
                >
                  {q.title}
                </h4>
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.55,
                  margin: '0 0 10px',
                }}
              >
                {q.description}
              </p>
              <div
                style={{
                  padding: 8,
                  background: 'var(--bg-elevated, var(--bg-secondary))',
                  border: `1px solid ${meta.accent}33`,
                  borderRadius: 'var(--radius-sm, 4px)',
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: meta.accent,
                    marginBottom: 3,
                  }}
                >
                  In Decision Intel
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-primary)',
                    lineHeight: 1.55,
                  }}
                >
                  {q.diFeature}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
