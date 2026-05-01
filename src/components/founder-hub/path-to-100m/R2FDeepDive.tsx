'use client';

import { useState } from 'react';
import { Brain, Lightbulb, GitMerge, ChevronRight, ChevronDown } from 'lucide-react';
import { R2F_CURRENT, R2F_MOAT_LEVERS } from './data/r2f';

const SIDE_ACCENT = {
  kahneman: '#0EA5E9',
  klein: '#D97706',
  arbitration: '#7C3AED',
};

const SIDE_ICON = {
  kahneman: Brain,
  klein: Lightbulb,
  arbitration: GitMerge,
};

const EFFORT_COLOR = {
  small: '#16A34A',
  medium: '#D97706',
  large: '#DC2626',
};

export function R2FDeepDive() {
  const [openLeverIds, setOpenLeverIds] = useState<Set<string>>(new Set([R2F_MOAT_LEVERS[0].id]));

  const toggleLever = (id: string) => {
    const next = new Set(openLeverIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOpenLeverIds(next);
  };

  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: '#7C3AED',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 10,
        }}
      >
        {/* drift-tolerant — pillar + node count refers to the R²F-specific subset (3 paper-anchored pillars across 7 named pipeline nodes), not the full 12-node pipeline. */}
        Current state · 3 pillars · 7 pipeline nodes
      </div>

      <div className="r2f-grid">
        {R2F_CURRENT.map(p => {
          const Icon = SIDE_ICON[p.side];
          const accent = SIDE_ACCENT[p.side];
          return (
            <div
              key={p.id}
              style={{
                background: 'var(--bg-card)',
                border: `1px solid var(--border-color)`,
                borderTop: `3px solid ${accent}`,
                borderRadius: 'var(--radius-md)',
                padding: 14,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: `${accent}18`,
                    color: accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={14} />
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}
                >
                  {p.label}
                </div>
              </div>

              <div style={{ marginBottom: 8 }}>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-muted)',
                    marginBottom: 4,
                  }}
                >
                  Pipeline nodes
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {p.pipelineNodes.map(n => (
                    <span
                      key={n}
                      style={{
                        fontSize: 10,
                        padding: '2px 8px',
                        background: `${accent}10`,
                        color: accent,
                        borderRadius: 'var(--radius-full)',
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  marginBottom: 8,
                }}
              >
                {p.whatItDoes}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                  fontStyle: 'italic',
                }}
              >
                {p.whyItMatters}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 22,
          fontSize: 11,
          fontWeight: 800,
          color: '#7C3AED',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 10,
        }}
      >
        5 levers to deepen the moat (NotebookLM 2026-04-27 synthesis)
      </div>

      {R2F_MOAT_LEVERS.map(l => {
        const isOpen = openLeverIds.has(l.id);
        return (
          <div
            key={l.id}
            style={{
              background: 'var(--bg-card)',
              border: `1px solid ${isOpen ? '#7C3AED' : 'var(--border-color)'}`,
              borderLeft: '3px solid #7C3AED',
              borderRadius: 'var(--radius-md)',
              marginBottom: 10,
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              onClick={() => toggleLever(l.id)}
              style={{
                width: '100%',
                padding: 14,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: '#7C3AED',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {l.rank}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}
                >
                  {l.title}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    marginTop: 4,
                    fontStyle: 'italic',
                  }}
                >
                  {l.shortPitch}
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6,
                    marginTop: 6,
                    fontSize: 10,
                  }}
                >
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: `${EFFORT_COLOR[l.estimatedEffort]}18`,
                      color: EFFORT_COLOR[l.estimatedEffort],
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {l.estimatedEffort} effort
                  </span>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Ship by: {l.shipBy}
                  </span>
                </div>
              </div>
              <div style={{ flexShrink: 0, color: 'var(--text-muted)' }}>
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
            </button>

            {isOpen && (
              <div
                style={{
                  padding: '0 14px 14px 50px',
                  borderTop: '1px solid var(--border-color)',
                }}
              >
                <div style={{ marginTop: 12 }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--text-muted)',
                      marginBottom: 4,
                    }}
                  >
                    Source
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.55,
                    }}
                  >
                    {l.source}
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: '#16A34A',
                      marginBottom: 4,
                    }}
                  >
                    What to build
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.55,
                    }}
                  >
                    {l.whatToBuild}
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: '#7C3AED',
                      marginBottom: 4,
                    }}
                  >
                    How it deepens the moat
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.55,
                    }}
                  >
                    {l.howItDeepensMoat}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 12,
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    fontStyle: 'italic',
                  }}
                >
                  Estimated cost: {l.estimatedCost}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <style>{`
        .r2f-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        @media (max-width: 900px) {
          .r2f-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
