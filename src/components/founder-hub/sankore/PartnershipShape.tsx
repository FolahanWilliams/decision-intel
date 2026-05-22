'use client';

/**
 * PartnershipShape — what I get / what they get / how to frame it.
 * Locked 2026-05-21 after the TT-meeting reframe conversation.
 *
 * Reverses the prior "founding-pilot at £1,999/mo" framing into a
 * 12-week in-person embed at the London office where the trade is
 * custom internal product in exchange for reference + access +
 * network + retroactive calibration. Reads from PARTNERSHIP_SHAPE +
 * TT_MEETING_DISCIPLINE in sankore-brief-data.ts.
 */

import { ArrowRight, ArrowLeft, Lock, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { PARTNERSHIP_SHAPE, TT_MEETING_DISCIPLINE } from './sankore-brief-data';

export function PartnershipShape() {
  const me = PARTNERSHIP_SHAPE.filter(p => p.side === 'me');
  const them = PARTNERSHIP_SHAPE.filter(p => p.side === 'them');

  return (
    <section
      style={{
        marginTop: 20,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderTop: '3px solid var(--accent-primary)',
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
          color: 'var(--accent-primary)',
          marginBottom: 6,
        }}
      >
        <ArrowRight size={12} /> Partnership shape · what each side gets
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
        12-week in-person embed at the London office — partnership, not pilot
      </h2>
      <p
        style={{
          fontSize: 'var(--fs-sm)',
          color: 'var(--text-secondary)',
          margin: '0 0 20px',
          lineHeight: 1.6,
        }}
      >
        The trade is custom internal product in exchange for reference + access + network +
        retroactive calibration. Not a £1,999/mo founding-pilot. Bigger and structurally different.
      </p>

      <div
        className="partnership-shape-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
        }}
      >
        <ExchangeColumn
          label="What I get"
          accent="var(--accent-primary)"
          icon={<ArrowLeft size={13} />}
          items={me}
        />
        <ExchangeColumn
          label="What Sankore gets"
          accent="var(--accent-secondary, #6366f1)"
          icon={<ArrowRight size={13} />}
          items={them}
        />
      </div>

      {/* Framing line */}
      <div
        style={{
          marginTop: 18,
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(99, 102, 241, 0.07)',
          border: '1px solid var(--accent-secondary, #6366f1)',
        }}
      >
        <div
          style={{
            fontSize: 'var(--fs-3xs)',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--accent-secondary, #6366f1)',
            marginBottom: 5,
          }}
        >
          How to frame the meeting
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 'var(--fs-xs)',
            color: 'var(--text-primary)',
            lineHeight: 1.6,
            fontWeight: 600,
          }}
        >
          {TT_MEETING_DISCIPLINE.framing}
        </p>
      </div>

      {/* Do / Don't lists */}
      <div
        className="partnership-disciplines-grid"
        style={{
          marginTop: 14,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
        }}
      >
        <DisciplineList
          label="Do"
          accent="var(--success)"
          icon={<CheckCircle2 size={11} />}
          items={TT_MEETING_DISCIPLINE.doDoList}
        />
        <DisciplineList
          label="Do not"
          accent="var(--error)"
          icon={<AlertOctagon size={11} />}
          items={TT_MEETING_DISCIPLINE.doNotList}
        />
      </div>

      <style jsx>{`
        @media (max-width: 800px) {
          .partnership-shape-grid,
          .partnership-disciplines-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

function ExchangeColumn({
  label,
  accent,
  icon,
  items,
}: {
  label: string;
  accent: string;
  icon: React.ReactNode;
  items: ReadonlyArray<(typeof PARTNERSHIP_SHAPE)[number]>;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderTop: `3px solid ${accent}`,
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px',
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
          letterSpacing: '0.1em',
          color: accent,
          marginBottom: 10,
        }}
      >
        {icon}
        {label}
      </div>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {items.map(it => (
          <li
            key={it.ingredient}
            style={{
              borderLeft: `2px solid ${accent}40`,
              paddingLeft: 10,
            }}
          >
            <div
              style={{
                fontSize: 'var(--fs-xs)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 3,
              }}
            >
              {it.ingredient}
            </div>
            <div
              style={{
                fontSize: 'var(--fs-2xs)',
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
                marginBottom: 4,
              }}
            >
              {it.detail}
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
              <Lock size={9} style={{ marginTop: 2, flexShrink: 0 }} />
              {it.unrepeatability}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DisciplineList({
  label,
  accent,
  icon,
  items,
}: {
  label: string;
  accent: string;
  icon: React.ReactNode;
  items: ReadonlyArray<string>;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${accent}`,
        borderRadius: 'var(--radius-sm)',
        padding: '10px 12px',
      }}
    >
      <div
        style={{
          fontSize: 'var(--fs-3xs)',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: accent,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {items.map((it, idx) => (
          <li
            key={idx}
            style={{
              display: 'grid',
              gridTemplateColumns: '14px 1fr',
              gap: 8,
              fontSize: 'var(--fs-2xs)',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              alignItems: 'flex-start',
            }}
          >
            <span style={{ color: accent, marginTop: 2 }}>{icon}</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
