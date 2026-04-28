'use client';

/**
 * SalesMovesGrid — compact card grid for rendering SalesMove[] arrays.
 *
 * Used by the Sales Toolkit to surface the three v2 framework libraries:
 *   • SALES_FRAMEWORK_GAPS (5 missing-framework moves)
 *   • AGE_ASYMMETRY_TACTICS (6 tactics for the 16yo×F500-CSO dynamic)
 *   • VOSS_TACTICS (5 Chris Voss tactics applied to DI personas)
 *
 * Each card is collapsed by default to keep the section scannable; click
 * to expand verbatim + mechanism + anti-pattern. Locked: 2026-04-28.
 */

import { useState } from 'react';
import { Quote, ChevronDown, ChevronUp, AlertTriangle, Lightbulb } from 'lucide-react';
import type { SalesMove } from '@/lib/data/sales-toolkit';

interface Props {
  moves: SalesMove[];
  /** Optional accent for headers + borders. */
  accent?: string;
}

export function SalesMovesGrid({ moves, accent = '#6366F1' }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {moves.map(move => {
        const isOpen = expanded === move.id;
        return (
          <div
            key={move.id}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => setExpanded(isOpen ? null : move.id)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'transparent',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                  {move.framework}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  <strong>When to fire:</strong> {move.whenToFire}
                </div>
              </div>
              <span style={{ flexShrink: 0, color: 'var(--text-muted)' }}>
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </span>
            </button>

            {isOpen && (
              <div
                style={{
                  padding: '0 12px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  borderTop: `1px solid ${accent}25`,
                  paddingTop: 10,
                }}
              >
                <div
                  style={{
                    padding: 10,
                    background: 'var(--bg-elevated)',
                    borderLeft: `3px solid ${accent}`,
                    borderRadius: 4,
                    fontSize: 13,
                    fontStyle: 'italic',
                    color: 'var(--text-primary)',
                    lineHeight: 1.5,
                  }}
                >
                  <Quote size={12} style={{ display: 'inline', marginRight: 4, color: accent, verticalAlign: '-1px' }} />
                  {move.verbatim}
                </div>

                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#16A34A', marginRight: 4 }}>
                    <Lightbulb size={11} /> Mechanism:
                  </span>
                  {move.mechanism}
                </div>

                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#DC2626', marginRight: 4 }}>
                    <AlertTriangle size={11} /> Anti-pattern:
                  </span>
                  {move.antiPattern}
                </div>

                {(move.scoresOn || move.bestForPersona) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                    {move.scoresOn && (
                      <span
                        style={{
                          padding: '2px 8px',
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 4,
                        }}
                      >
                        Sparring rubric: <strong style={{ color: 'var(--text-primary)' }}>{move.scoresOn}</strong>
                      </span>
                    )}
                    {move.bestForPersona && (
                      <span
                        style={{
                          padding: '2px 8px',
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 4,
                        }}
                      >
                        Best for: <strong style={{ color: 'var(--text-primary)' }}>{move.bestForPersona}</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
