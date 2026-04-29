'use client';

import { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  AlertOctagon,
  CheckCircle2,
  Clock,
  MinusCircle,
} from 'lucide-react';
import { SILENT_OBJECTIONS, type SilentObjection } from './data/silent-objections';

const STATUS_ACCENT: Record<SilentObjection['status'], string> = {
  shipped: '#16A34A',
  in_progress: '#D97706',
  planned: '#0EA5E9',
  deferred: '#94A3B8',
};

const STATUS_LABEL: Record<SilentObjection['status'], string> = {
  shipped: 'Shipped',
  in_progress: 'In progress · this week',
  planned: 'Planned · next week',
  deferred: 'Deferred · per founder',
};

const STATUS_ICON: Record<SilentObjection['status'], React.ComponentType<{ size?: number }>> = {
  shipped: CheckCircle2,
  in_progress: Clock,
  planned: Clock,
  deferred: MinusCircle,
};

const TIMEFRAMES = [
  {
    label: '30-day fast-converter window',
    color: '#16A34A',
    archetypes: [
      'Mid-Market PE/VC Associate · £149/mo',
      'Boutique Sell-Side M&A Advisor · £499/deal',
      'Solo Fractional CSO · £149-249/mo',
    ],
    note: 'Acute personal career fear + corporate-card-approval threshold pricing + zero procurement cycle. Single-meeting close on credit card. This is where 30-day paid validation actually happens.',
  },
  {
    label: 'Summer 2026 design-partner wedge',
    color: '#D97706',
    archetypes: [
      'Sankore (Pan-African fund partner)',
      'LRQA / Ian Spaulding (channel partnership)',
    ],
    note: 'Product-rigor partner conversations — not immediate revenue. Approach from a position of UK-validator paid traction, NOT pre-revenue uncertainty. Naira pricing reality means £2K/mo Nigerian feels like £5K/mo.',
  },
  {
    label: '12-month ceiling plays · NOT primary outbound now',
    color: '#DC2626',
    archetypes: [
      'Fortune 500 Chief Strategy Officer',
      'F500 General Counsel / Audit Committee Chair',
      'Management Consultant Partner (McKinsey QuantumBlack)',
    ],
    note: '6-12 month procurement cycle. Requires SOC 2 Type II + EU AI Act mapping + audit-committee sign-off + outcome data flywheel + published reference cases — none of which exist yet. Pitching them at pre-seed is corporate suicide. Wait for wedge references.',
  },
];

export function MarketRealityCheck() {
  const [openIds, setOpenIds] = useState<Set<string>>(
    new Set(SILENT_OBJECTIONS.filter(o => o.status === 'in_progress').map(o => o.id))
  );

  const toggle = (id: string) => {
    const next = new Set(openIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOpenIds(next);
  };

  return (
    <div>
      {/* Honest reframe banner */}
      <div
        style={{
          padding: 14,
          background: 'linear-gradient(135deg, rgba(220,38,38,0.10), rgba(217,119,6,0.05))',
          border: '1px solid rgba(220,38,38,0.20)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 18,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: '#DC2626',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 6,
          }}
        >
          Honest reframe · NotebookLM 2026-04-28 brutal-critique synthesis
        </div>
        <div
          style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.55, fontWeight: 500 }}
        >
          The current strategy is a 12-18 month play, not a 30-day play. Pan-African fund partners,
          F500 CSOs, GCs/audit committees ARE the unicorn revenue ceiling — but they require 6-12
          month procurement cycles you cannot survive pre-revenue. For paid validation in the next
          30 days, stop pitching the cathedral and start pitching individuals with a corporate
          expense card and acute career fear.
        </div>
      </div>

      {/* Time-horizon split */}
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
        Three time-horizons · concentrate on the first
      </div>
      <div className="reality-timeframes">
        {TIMEFRAMES.map((tf, i) => (
          <div
            key={tf.label}
            style={{
              padding: 14,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderTop: `3px solid ${tf.color}`,
              borderRadius: 'var(--radius-md)',
              opacity: i === 0 ? 1 : 0.92,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: tf.color,
                marginBottom: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {tf.label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
              {tf.archetypes.map(a => (
                <div
                  key={a}
                  style={{
                    fontSize: 12,
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    padding: '4px 8px',
                    background: `${tf.color}10`,
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {a}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {tf.note}
            </div>
          </div>
        ))}
      </div>

      {/* Silent objections */}
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
        5 silent objections closing tabs today · the buyer thinks but won&apos;t say
      </div>

      {SILENT_OBJECTIONS.map(o => {
        const isOpen = openIds.has(o.id);
        const accent = STATUS_ACCENT[o.status];
        const Icon = STATUS_ICON[o.status];
        return (
          <div
            key={o.id}
            style={{
              background: 'var(--bg-card)',
              border: `1px solid ${isOpen ? '#DC2626' : 'var(--border-color)'}`,
              borderLeft: '3px solid #DC2626',
              borderRadius: 'var(--radius-md)',
              marginBottom: 10,
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              onClick={() => toggle(o.id)}
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
                  background: 'rgba(220,38,38,0.12)',
                  color: '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertOctagon size={14} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    fontStyle: 'italic',
                    lineHeight: 1.45,
                  }}
                >
                  {o.buyerThinks}
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 10,
                    fontWeight: 700,
                    color: accent,
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: `${accent}12`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginTop: 8,
                  }}
                >
                  <Icon size={11} /> {STATUS_LABEL[o.status]}
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
                      color: '#DC2626',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: 4,
                    }}
                  >
                    Why it kills the deal
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    {o.whyItKills}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 12,
                    padding: 10,
                    background: 'rgba(22,163,74,0.05)',
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
                    Fix this week
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    {o.fixThisWeek}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 8,
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    fontStyle: 'italic',
                  }}
                >
                  Ship by: {o.shipBy}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <style>{`
        .reality-timeframes {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        @media (max-width: 900px) {
          .reality-timeframes {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
