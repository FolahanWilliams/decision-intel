'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, AlertOctagon, Eye } from 'lucide-react';
import { FAILURE_MODES, type FailureMode } from './data';

const EXPOSURE_COLOR: Record<FailureMode['diExposure'], string> = {
  critical: '#DC2626',
  high: '#D97706',
  medium: '#0EA5E9',
  low: '#16A34A',
};

const EXPOSURE_LABEL: Record<FailureMode['diExposure'], string> = {
  critical: 'CRITICAL · active threat',
  high: 'HIGH · monitor monthly',
  medium: 'MEDIUM · monitor quarterly',
  low: 'LOW · annual review',
};

export function FailureModesWatchtower() {
  const [openIds, setOpenIds] = useState<Set<string>>(
    new Set(FAILURE_MODES.filter(f => f.diExposure === 'critical').map(f => f.id))
  );

  const toggle = (id: string) => {
    const next = new Set(openIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOpenIds(next);
  };

  return (
    <div>
      {FAILURE_MODES.map(f => {
        const isOpen = openIds.has(f.id);
        const accent = EXPOSURE_COLOR[f.diExposure];
        return (
          <div
            key={f.id}
            style={{
              background: 'var(--bg-card)',
              border: `1px solid ${isOpen ? accent : 'var(--border-color)'}`,
              borderLeft: `3px solid ${accent}`,
              borderRadius: 'var(--radius-md)',
              marginBottom: 10,
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              onClick={() => toggle(f.id)}
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
                <AlertOctagon size={14} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {f.trap}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Killed: {f.killedCompany}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: accent,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: `${accent}12`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginTop: 6,
                    display: 'inline-block',
                  }}
                >
                  {EXPOSURE_LABEL[f.diExposure]}
                </div>
              </div>
              <div style={{ flexShrink: 0, color: 'var(--text-muted)' }}>
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
            </button>

            {isOpen && (
              <div
                style={{
                  padding: '0 14px 14px 52px',
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
                    Diagnostic
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    {f.diagnostic}
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#16A34A',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: 4,
                    }}
                  >
                    Countermove
                  </div>
                  <ul style={{ margin: 0, padding: '0 0 0 18px' }}>
                    {f.countermove.map(c => (
                      <li
                        key={c}
                        style={{
                          fontSize: 12,
                          color: 'var(--text-secondary)',
                          marginBottom: 4,
                          lineHeight: 1.5,
                        }}
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  style={{
                    marginTop: 12,
                    padding: 10,
                    background: 'rgba(220,38,38,0.06)',
                    border: '1px solid rgba(220,38,38,0.18)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#DC2626',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: 4,
                    }}
                  >
                    Tripwire
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {f.tripwire}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 10,
                    padding: 10,
                    background: 'rgba(14,165,233,0.05)',
                    border: '1px solid rgba(14,165,233,0.20)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#0EA5E9',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: 4,
                    }}
                  >
                    <Eye size={11} /> What to watch
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {f.whatToWatch}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 10,
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    fontStyle: 'italic',
                  }}
                >
                  Source: {f.evidence}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
