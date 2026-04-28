'use client';

import { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Star,
  Briefcase,
  GraduationCap,
  Handshake,
  Network,
  Heart,
} from 'lucide-react';
import { NETWORK_NODES, type NetworkNode } from './data';

const STATUS_COLOR: Record<NetworkNode['status'], string> = {
  active: '#16A34A',
  warm: '#D97706',
  untapped: '#7C3AED',
  cold: '#94A3B8',
};

const RELATIONSHIP_ICON: Record<
  NetworkNode['relationship'],
  React.ComponentType<{ size?: number }>
> = {
  family: Heart,
  advisor: Star,
  school: GraduationCap,
  design_partner: Handshake,
  channel: Network,
  untapped: Briefcase,
};

export function WarmIntroNetworkMap() {
  const [openIds, setOpenIds] = useState<Set<string>>(
    new Set(NETWORK_NODES.filter(n => n.status === 'active').map(n => n.id))
  );

  const toggle = (id: string) => {
    const next = new Set(openIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOpenIds(next);
  };

  return (
    <div>
      {NETWORK_NODES.map(n => {
        const isOpen = openIds.has(n.id);
        const accent = STATUS_COLOR[n.status];
        const Icon = RELATIONSHIP_ICON[n.relationship];
        return (
          <div
            key={n.id}
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
              onClick={() => toggle(n.id)}
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
                <Icon size={14} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {n.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>
                  {n.role}
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
                    {n.status}
                  </span>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {n.relationship.replace('_', ' ')}
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
                    What they unlock
                  </div>
                  <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                    {n.unlocks.map(u => (
                      <li
                        key={u}
                        style={{
                          fontSize: 12,
                          color: 'var(--text-secondary)',
                          marginBottom: 4,
                          lineHeight: 1.5,
                        }}
                      >
                        {u}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ marginTop: 14 }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#7C3AED',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: 8,
                    }}
                  >
                    Ask hierarchy · ladder up, fall back gracefully
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(['tier1', 'tier2', 'tier3'] as const).map((tier, i) => {
                      const tierColors = ['#16A34A', '#D97706', '#0EA5E9'];
                      const tierLabels = [
                        'Tier 1 · ideal',
                        'Tier 2 · high-value',
                        'Tier 3 · fallback',
                      ];
                      return (
                        <div
                          key={tier}
                          style={{
                            padding: 10,
                            background: 'var(--bg-secondary)',
                            border: `1px solid ${tierColors[i]}20`,
                            borderLeft: `3px solid ${tierColors[i]}`,
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          <div
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              color: tierColors[i],
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              marginBottom: 4,
                            }}
                          >
                            {tierLabels[i]}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: 'var(--text-secondary)',
                              lineHeight: 1.5,
                            }}
                          >
                            {n.ask[tier]}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

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
                    Cadence · notes
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <strong>Cadence:</strong> {n.cadence}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      lineHeight: 1.5,
                      marginTop: 4,
                      fontStyle: 'italic',
                    }}
                  >
                    {n.notes}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 12,
                    padding: 10,
                    background: 'rgba(22,163,74,0.06)',
                    border: '1px solid rgba(22,163,74,0.20)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
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
                    Next step
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {n.nextStep}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
