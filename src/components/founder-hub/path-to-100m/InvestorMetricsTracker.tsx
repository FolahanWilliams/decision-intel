'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Briefcase, Activity, Eye } from 'lucide-react';
import { INVESTOR_METRICS, type InvestorMetric } from './data';

const STATUS_COLOR: Record<InvestorMetric['status'], string> = {
  on_track: '#16A34A',
  gap: '#D97706',
  unbuilt: '#DC2626',
};

const STATUS_LABEL: Record<InvestorMetric['status'], string> = {
  on_track: 'On track',
  gap: 'Gap to close',
  unbuilt: 'Not yet built',
};

const CATEGORY_ICON: Record<InvestorMetric['category'], React.ComponentType<{ size?: number }>> = {
  business: Briefcase,
  product: Activity,
  presentation: Eye,
};

const CATEGORY_LABEL: Record<InvestorMetric['category'], string> = {
  business: 'Business + Financial',
  product: 'Product + Engagement',
  presentation: 'Presentation Discipline',
};

export function InvestorMetricsTracker() {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set([INVESTOR_METRICS[0].id]));
  const toggle = (id: string) => {
    const next = new Set(openIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOpenIds(next);
  };

  const grouped = (['business', 'product', 'presentation'] as const).map(cat => ({
    cat,
    metrics: INVESTOR_METRICS.filter(m => m.category === cat),
  }));

  return (
    <div>
      {grouped.map(({ cat, metrics }) => {
        const Icon = CATEGORY_ICON[cat];
        return (
          <div key={cat} style={{ marginBottom: 20 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                fontWeight: 800,
                color: 'var(--text-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 10,
              }}
            >
              <Icon size={12} /> {CATEGORY_LABEL[cat]} · {metrics.length} metrics
            </div>

            {metrics.map(m => {
              const isOpen = openIds.has(m.id);
              const accent = STATUS_COLOR[m.status];
              return (
                <div
                  key={m.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: `1px solid ${isOpen ? accent : 'var(--border-color)'}`,
                    borderLeft: `3px solid ${accent}`,
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 8,
                    overflow: 'hidden',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggle(m.id)}
                    style={{
                      width: '100%',
                      padding: 12,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {m.rank}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {m.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        Now:{' '}
                        {m.diCurrent.length > 60 ? m.diCurrent.slice(0, 60) + '…' : m.diCurrent}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: accent,
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: `${accent}12`,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        flexShrink: 0,
                      }}
                    >
                      {STATUS_LABEL[m.status]}
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
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            marginBottom: 4,
                          }}
                        >
                          What it is
                        </div>
                        <div
                          style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}
                        >
                          {m.whatItIs}
                        </div>
                      </div>

                      <div className="metric-stats">
                        <div>
                          <div
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              color: 'var(--text-muted)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              marginBottom: 4,
                            }}
                          >
                            Current state
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: 'var(--text-secondary)',
                              lineHeight: 1.5,
                            }}
                          >
                            {m.diCurrent}
                          </div>
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              color: '#16A34A',
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              marginBottom: 4,
                            }}
                          >
                            12-month target
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: 'var(--text-secondary)',
                              lineHeight: 1.5,
                            }}
                          >
                            {m.diTarget12mo}
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: 12 }}>
                        <div
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: '#7C3AED',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            marginBottom: 4,
                          }}
                        >
                          Why it matters
                        </div>
                        <div
                          style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}
                        >
                          {m.whyItMatters}
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: 12,
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          lineHeight: 1.5,
                        }}
                      >
                        <strong>Compute:</strong> {m.computeMethod}
                      </div>

                      <div
                        style={{
                          marginTop: 10,
                          padding: 10,
                          background: 'rgba(220,38,38,0.06)',
                          border: '1px solid rgba(220,38,38,0.18)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: '#DC2626',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            marginBottom: 4,
                          }}
                        >
                          Tripwire
                        </div>
                        <div
                          style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}
                        >
                          {m.tripwire}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      <style>{`
        .metric-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 12px;
        }
        @media (max-width: 700px) {
          .metric-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
