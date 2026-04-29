'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Check, EyeOff, Building2, X } from 'lucide-react';
import {
  SIMPLIFIED_FUNNEL,
  FEATURE_VERDICTS,
  type FeatureVerdict,
} from './data/simplified-funnel';

const VERDICT_COLOR: Record<FeatureVerdict['verdict'], string> = {
  keep: '#16A34A',
  hide_flag: '#D97706',
  enterprise_tier: '#0EA5E9',
  kill: '#DC2626',
};

const VERDICT_LABEL: Record<FeatureVerdict['verdict'], string> = {
  keep: 'KEEP · front + center',
  hide_flag: 'HIDE behind feature flag',
  enterprise_tier: 'MOVE to enterprise tier',
  kill: 'KILL',
};

const VERDICT_ICON: Record<FeatureVerdict['verdict'], React.ComponentType<{ size?: number }>> = {
  keep: Check,
  hide_flag: EyeOff,
  enterprise_tier: Building2,
  kill: X,
};

const STEP_ACCENTS = ['#16A34A', '#0EA5E9', '#D97706', '#7C3AED'];

export function SimplifiedThirtyDayFunnel() {
  const [openFunnelId, setOpenFunnelId] = useState<string | null>(SIMPLIFIED_FUNNEL[0].id);
  const [verdictFilter, setVerdictFilter] = useState<FeatureVerdict['verdict'] | 'all'>('all');

  const filteredVerdicts =
    verdictFilter === 'all'
      ? FEATURE_VERDICTS
      : FEATURE_VERDICTS.filter(v => v.verdict === verdictFilter);

  return (
    <div>
      {/* 4-screen funnel */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: 'var(--text-primary)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 10,
        }}
      >
        The 4-screen 30-day conversion funnel
      </div>
      <div className="funnel-grid">
        {SIMPLIFIED_FUNNEL.map((s, i) => {
          const accent = STEP_ACCENTS[i] ?? '#16A34A';
          const isOpen = openFunnelId === s.id;
          return (
            <div
              key={s.id}
              style={{
                background: 'var(--bg-card)',
                border: `1px solid ${isOpen ? accent : 'var(--border-color)'}`,
                borderTop: `3px solid ${accent}`,
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => setOpenFunnelId(isOpen ? null : s.id)}
                style={{
                  width: '100%',
                  padding: 12,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: accent,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {s.step}
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
                      {s.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-secondary)',
                        marginTop: 4,
                        lineHeight: 1.4,
                      }}
                    >
                      {s.what}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, color: 'var(--text-muted)' }}>
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                </div>
              </button>
              {isOpen && (
                <div
                  style={{
                    padding: '0 12px 12px 44px',
                    borderTop: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ marginTop: 10 }}>
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
                      Action
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                        fontStyle: 'italic',
                      }}
                    >
                      {s.action}
                    </div>
                  </div>
                  <div style={{ marginTop: 10 }}>
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
                      Hide / kill from this view
                    </div>
                    <ul style={{ margin: 0, padding: '0 0 0 14px' }}>
                      {s.whatToHide.map(h => (
                        <li
                          key={h}
                          style={{
                            fontSize: 11,
                            color: 'var(--text-secondary)',
                            marginBottom: 3,
                            lineHeight: 1.4,
                          }}
                        >
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Feature verdicts */}
      <div
        style={{
          marginTop: 22,
          fontSize: 11,
          fontWeight: 800,
          color: 'var(--text-primary)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 10,
        }}
      >
        Feature verdicts · keep / hide / move to enterprise / kill
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {(['all', 'keep', 'hide_flag', 'enterprise_tier', 'kill'] as const).map(f => {
          const isActive = verdictFilter === f;
          const accent = f === 'all' ? '#0EA5E9' : VERDICT_COLOR[f];
          const label =
            f === 'all'
              ? `All · ${FEATURE_VERDICTS.length}`
              : `${VERDICT_LABEL[f]} · ${FEATURE_VERDICTS.filter(v => v.verdict === f).length}`;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setVerdictFilter(f)}
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '6px 10px',
                borderRadius: 'var(--radius-full)',
                border: `1px solid ${isActive ? accent : 'var(--border-color)'}`,
                background: isActive ? `${accent}12` : 'var(--bg-card)',
                color: isActive ? accent : 'var(--text-secondary)',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filteredVerdicts.map(v => {
          const accent = VERDICT_COLOR[v.verdict];
          const Icon = VERDICT_ICON[v.verdict];
          return (
            <div
              key={v.id}
              style={{
                padding: 12,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderLeft: `3px solid ${accent}`,
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
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
                <Icon size={13} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {v.feature}
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: accent,
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-full)',
                      background: `${accent}12`,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {VERDICT_LABEL[v.verdict]}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                    marginTop: 4,
                    lineHeight: 1.5,
                  }}
                >
                  {v.why}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .funnel-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        @media (max-width: 1100px) {
          .funnel-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 700px) {
          .funnel-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
