'use client';

import { useState } from 'react';
import { Package, Briefcase, DollarSign, Database, Compass, Trophy } from 'lucide-react';
import { NINETY_DAY_ACTIONS, type NinetyDayAction } from './data';

const CATEGORY_ACCENT: Record<NinetyDayAction['category'], string> = {
  product: '#16A34A',
  gtm: '#D97706',
  fundraise: '#7C3AED',
  data: '#0EA5E9',
  positioning: '#DC2626',
  authority: '#EA580C',
};

const CATEGORY_ICON: Record<NinetyDayAction['category'], React.ComponentType<{ size?: number }>> = {
  product: Package,
  gtm: Briefcase,
  fundraise: DollarSign,
  data: Database,
  positioning: Compass,
  authority: Trophy,
};

const EFFORT_LABEL: Record<NinetyDayAction['effort'], string> = {
  small: 'S',
  medium: 'M',
  large: 'L',
};

export function NinetyDayActionPlan() {
  const [activeFilter, setActiveFilter] = useState<NinetyDayAction['category'] | 'all'>('all');

  const filtered =
    activeFilter === 'all'
      ? NINETY_DAY_ACTIONS
      : NINETY_DAY_ACTIONS.filter((a) => a.category === activeFilter);

  const categories: Array<NinetyDayAction['category'] | 'all'> = [
    'all',
    'gtm',
    'product',
    'fundraise',
    'authority',
    'data',
    'positioning',
  ];

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {categories.map((c) => {
          const isActive = activeFilter === c;
          const accent = c === 'all' ? '#16A34A' : CATEGORY_ACCENT[c];
          return (
            <button
              key={c}
              type="button"
              onClick={() => setActiveFilter(c)}
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                border: `1px solid ${isActive ? accent : 'var(--border-color)'}`,
                background: isActive ? `${accent}12` : 'var(--bg-card)',
                color: isActive ? accent : 'var(--text-secondary)',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {c === 'all' ? `All · ${NINETY_DAY_ACTIONS.length}` : c}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((a) => {
          const accent = CATEGORY_ACCENT[a.category];
          const Icon = CATEGORY_ICON[a.category];
          return (
            <div
              key={a.id}
              style={{
                padding: 14,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderLeft: `3px solid ${accent}`,
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
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
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      lineHeight: 1.3,
                    }}
                  >
                    {a.action}
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
                        background: `${accent}12`,
                        color: accent,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {a.category}
                    </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {a.week}
                    </span>
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-secondary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 9,
                      }}
                      title={`Effort: ${a.effort}`}
                    >
                      {EFFORT_LABEL[a.effort]}
                    </span>
                  </div>
                </div>
              </div>

              <div className="action-grid">
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
                    Why
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                    }}
                  >
                    {a.why}
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
                    Success criterion
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                    }}
                  >
                    {a.successCriterion}
                  </div>
                </div>
                <div>
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
                    Blocker
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                    }}
                  >
                    {a.blocker}
                  </div>
                </div>
              </div>

              {a.dependsOn && a.dependsOn.length > 0 && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 10,
                    color: 'var(--text-muted)',
                  }}
                >
                  <strong>Depends on:</strong> {a.dependsOn.join(', ')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        .action-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
        }
        @media (max-width: 900px) {
          .action-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
