'use client';

/**
 * LongitudinalGoals — the 12-week embed + 12-month outcome arc.
 * Locked 2026-05-21. Reads from LONGITUDINAL_GOALS in
 * sankore-brief-data.ts.
 *
 * Horizon swimlanes (12-week · 6-month · 12-month · 24-month) — visual
 * progression from "what locks in by the end of the embed" through
 * "what the embed unlocks 24 months out (cross-border M&A ceiling)".
 */

import { Clock, Target } from 'lucide-react';
import { LONGITUDINAL_GOALS } from './sankore-brief-data';

const HORIZON_META: Record<
  (typeof LONGITUDINAL_GOALS)[number]['horizon'],
  { label: string; color: string; ordinal: number }
> = {
  '12-week': { label: '12-week · embed window', color: 'var(--accent-primary)', ordinal: 1 },
  '6-month': { label: '6-month · post-embed compounding', color: 'var(--info)', ordinal: 2 },
  '12-month': {
    label: '12-month · network activation',
    color: 'var(--accent-secondary, #6366f1)',
    ordinal: 3,
  },
  '24-month': { label: '24-month · ceiling unlock', color: 'var(--warning)', ordinal: 4 },
};

export function LongitudinalGoals() {
  // Group by horizon
  const grouped = new Map<string, (typeof LONGITUDINAL_GOALS)[number][]>();
  for (const g of LONGITUDINAL_GOALS) {
    const arr = grouped.get(g.horizon) ?? [];
    arr.push(g);
    grouped.set(g.horizon, arr);
  }
  const ordered = Array.from(grouped.entries()).sort(
    (a, b) =>
      HORIZON_META[a[0] as keyof typeof HORIZON_META].ordinal -
      HORIZON_META[b[0] as keyof typeof HORIZON_META].ordinal
  );

  return (
    <section
      style={{
        marginTop: 20,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderTop: '3px solid var(--info)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 22px',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 'var(--fs-2xs)',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--info)',
          marginBottom: 6,
        }}
      >
        <Clock size={12} /> Longitudinal goals · 12-week → 24-month arc
      </div>
      <h2
        style={{
          fontSize: 'var(--fs-lg)',
          fontWeight: 800,
          color: 'var(--text-primary)',
          margin: '0 0 4px',
          letterSpacing: '-0.018em',
        }}
      >
        What the embed locks in — and what compounds after it
      </h2>
      <p
        style={{
          fontSize: 'var(--fs-sm)',
          color: 'var(--text-secondary)',
          margin: '0 0 20px',
          lineHeight: 1.6,
        }}
      >
        The 12-week embed is the lever. The 6-, 12-, and 24-month outcomes are what the lever moves
        — across the GTM v3.5 Phase 1 → Phase 3 sequencing and the F500 cross-border M&A ceiling.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {ordered.map(([horizon, goals]) => {
          const meta = HORIZON_META[horizon as keyof typeof HORIZON_META];
          return (
            <div
              key={horizon}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderLeft: `4px solid ${meta.color}`,
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 'var(--fs-2xs)',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: meta.color,
                  marginBottom: 10,
                }}
              >
                <Target size={12} />
                {meta.label}
              </div>
              <ul
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                {goals.map((g, idx) => (
                  <li
                    key={idx}
                    style={{
                      borderLeft: `2px solid ${meta.color}40`,
                      paddingLeft: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 'var(--fs-sm)',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: 4,
                        lineHeight: 1.4,
                      }}
                    >
                      {g.goal}
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--fs-xs)',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.55,
                        marginBottom: 6,
                      }}
                    >
                      <strong style={{ color: 'var(--text-primary)' }}>Why it matters: </strong>
                      {g.whyItMatters}
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--fs-2xs)',
                        color: meta.color,
                        fontWeight: 700,
                        lineHeight: 1.5,
                      }}
                    >
                      Success signal — {g.successSignal}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
