'use client';

import Link from 'next/link';
import type { BiasGenomeEntry } from '@/lib/data/bias-genome-seed';

const C = {
  white: '#FFFFFF',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate900: '#0F172A',
  green: '#16A34A',
  red: '#DC2626',
  amber: '#F59E0B',
};

function liftColor(lift: number | null): string {
  if (lift == null) return C.slate400;
  if (lift >= 1.4) return C.red;
  if (lift >= 1.05) return C.amber;
  return C.green;
}

function formatLift(lift: number | null): string {
  if (lift == null) return '—';
  return `${lift.toFixed(1)}x`;
}

function formatPrevalence(p: number): string {
  return `${Math.round(p * 100)}%`;
}

interface BiasGenomeTableProps {
  entries: BiasGenomeEntry[];
  /** Max lift in the current view, for bar scaling */
  maxLift: number;
  /** Label for the "in this view" legend */
  scopeLabel?: string;
}

export function BiasGenomeTable({ entries, maxLift, scopeLabel }: BiasGenomeTableProps) {
  const safeMax = Math.max(maxLift, 1.2);

  return (
    <div
      style={{
        background: C.white,
        border: `1px solid ${C.slate200}`,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      {/* Legend */}
      {scopeLabel && (
        <div
          style={{
            padding: '10px 24px',
            background: C.slate50,
            borderBottom: `1px solid ${C.slate200}`,
            fontSize: 11,
            color: C.slate500,
          }}
        >
          {scopeLabel}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '56px 2fr 1.6fr 1fr 1fr 1.6fr',
          padding: '12px 24px',
          background: C.slate50,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: C.slate500,
          borderBottom: `1px solid ${C.slate200}`,
        }}
      >
        <span>#</span>
        <span>Bias</span>
        <span>Failure lift</span>
        <span style={{ textAlign: 'right' }}>Prevalence</span>
        <span style={{ textAlign: 'right' }}>n</span>
        <span>Insight</span>
      </div>

      {entries.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: C.slate400, fontSize: 13 }}>
          No cases in this slice yet. Try a broader filter.
        </div>
      ) : (
        entries.map((e, i) => {
          const pct = e.failureLift != null ? (e.failureLift / safeMax) * 100 : 0;
          const color = liftColor(e.failureLift);
          const lowSample = e.sampleSize < 3;

          return (
            <div
              key={e.biasType}
              style={{
                display: 'grid',
                gridTemplateColumns: '56px 2fr 1.6fr 1fr 1fr 1.6fr',
                padding: '14px 24px',
                alignItems: 'center',
                fontSize: 13,
                borderBottom: i === entries.length - 1 ? 'none' : `1px solid ${C.slate100}`,
                opacity: lowSample ? 0.78 : 1,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 12,
                  color: C.slate400,
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: C.slate900,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  {e.label}
                  {e.taxonomyId && (
                    <Link
                      href={`/taxonomy#${e.biasType}`}
                      style={{
                        fontSize: 10,
                        fontFamily: 'var(--font-mono, monospace)',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: C.slate100,
                        color: C.slate500,
                        textDecoration: 'none',
                      }}
                    >
                      {e.taxonomyId}
                    </Link>
                  )}
                </div>
                {e.topIndustry && (
                  <div
                    style={{
                      fontSize: 11,
                      color: C.slate400,
                      marginTop: 2,
                      textTransform: 'capitalize',
                    }}
                  >
                    Peaks in {e.topIndustry.replace(/_/g, ' ')}
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    background: C.slate100,
                    borderRadius: 999,
                    overflow: 'hidden',
                    minWidth: 60,
                  }}
                  aria-hidden
                >
                  <div
                    style={{
                      width: `${Math.min(100, pct)}%`,
                      height: '100%',
                      background: color,
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
                <span
                  style={{
                    fontWeight: 700,
                    color,
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 13,
                    minWidth: 38,
                    textAlign: 'right',
                  }}
                >
                  {formatLift(e.failureLift)}
                </span>
              </div>

              <span
                style={{
                  textAlign: 'right',
                  color: C.slate600,
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 12.5,
                }}
              >
                {formatPrevalence(e.prevalence)}
              </span>

              <span
                style={{
                  textAlign: 'right',
                  color: lowSample ? C.slate400 : C.slate600,
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 12.5,
                }}
              >
                {e.sampleSize}
                {lowSample && (
                  <span
                    style={{
                      fontSize: 9,
                      color: C.amber,
                      marginLeft: 4,
                      fontWeight: 700,
                    }}
                  >
                    ⚠
                  </span>
                )}
              </span>

              <span style={{ fontSize: 12, color: C.slate500, lineHeight: 1.5 }}>{e.insight}</span>
            </div>
          );
        })
      )}
    </div>
  );
}
