'use client';

/**
 * FiveAdaptations — the 5-product roadmap to maximize Sankore leverage.
 * Locked 2026-05-21. Reads from FIVE_ADAPTATIONS in sankore-brief-data.ts.
 *
 * Each card shows: rank, title, status, what it does, why FOR Sankore,
 * build cost, discipline note. Visualizes the sequence — #1 first
 * (retroactive audit mode, founder-approved to ship next), then #2-#5
 * gated behind founder approval on the CONTAINER_MODES cascade.
 */

import { Wrench, ArrowRight } from 'lucide-react';
import { FIVE_ADAPTATIONS } from './sankore-brief-data';

const STATUS_META: Record<
  (typeof FIVE_ADAPTATIONS)[number]['status'],
  { label: string; color: string; bg: string }
> = {
  shipped: {
    label: 'SHIPPED',
    color: 'var(--success)',
    bg: 'color-mix(in srgb, var(--success) 14%, transparent)',
  },
  'in-progress': {
    label: 'IN PROGRESS',
    color: 'var(--warning)',
    bg: 'color-mix(in srgb, var(--warning) 14%, transparent)',
  },
  queued: {
    label: 'QUEUED',
    color: 'var(--text-muted)',
    bg: 'color-mix(in srgb, var(--text-muted) 14%, transparent)',
  },
};

export function FiveAdaptations() {
  return (
    <section
      style={{
        marginTop: 20,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderTop: '3px solid var(--warning)',
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
          color: 'var(--warning)',
          marginBottom: 6,
        }}
      >
        <Wrench size={12} /> Five product adaptations · the Sankore roadmap
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
        Five product adaptations to maximize the embed leverage
      </h2>
      <p
        style={{
          fontSize: 'var(--fs-sm)',
          color: 'var(--text-secondary)',
          margin: '0 0 20px',
          lineHeight: 1.6,
        }}
      >
        Each adaptation compounds Sankore embeddedness specifically. Sequence matters — the
        dashboard (#5) cannot ship before the underlying container modes (#2-3) exist. Retroactive
        audit mode (#1) ships first because it compresses 12 months of forward calibration into 12
        weeks of retroactive work — the single highest-leverage move.
      </p>

      <ol
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {FIVE_ADAPTATIONS.map(a => {
          const status = STATUS_META[a.status];
          return (
            <li
              key={a.n}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderLeft: `3px solid ${status.color}`,
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap',
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--text-primary)',
                    color: 'var(--bg-card)',
                    fontSize: 'var(--fs-xs)',
                    fontWeight: 800,
                  }}
                >
                  {a.n}
                </span>
                <h3
                  style={{
                    fontSize: 'var(--fs-sm)',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    margin: 0,
                    flex: '1 1 220px',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {a.title}
                </h3>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 'var(--fs-3xs)',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: status.color,
                    background: status.bg,
                    padding: '3px 9px',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  {status.label}
                </span>
              </div>
              <p
                style={{
                  margin: '0 0 10px',
                  fontSize: 'var(--fs-xs)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                }}
              >
                {a.description}
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  marginBottom: 8,
                }}
                className="adaptation-grid"
              >
                <div>
                  <div
                    style={{
                      fontSize: 'var(--fs-3xs)',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--accent-primary)',
                      marginBottom: 4,
                    }}
                  >
                    Why FOR Sankore
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 'var(--fs-2xs)',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.55,
                    }}
                  >
                    {a.whyForSankore}
                  </p>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 'var(--fs-3xs)',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--text-muted)',
                      marginBottom: 4,
                    }}
                  >
                    Build cost
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 'var(--fs-2xs)',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.55,
                      fontFamily: 'var(--font-mono, monospace)',
                    }}
                  >
                    {a.buildCost}
                  </p>
                </div>
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'flex-start',
                  gap: 5,
                  fontSize: 'var(--fs-3xs)',
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                  fontStyle: 'italic',
                }}
              >
                <ArrowRight size={10} style={{ marginTop: 2, flexShrink: 0 }} />
                {a.disciplineNote}
              </div>
            </li>
          );
        })}
      </ol>

      <style jsx>{`
        @media (max-width: 720px) {
          .adaptation-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
