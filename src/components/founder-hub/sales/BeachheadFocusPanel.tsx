'use client';

/**
 * BeachheadFocusPanel — the ICP-focus surface (locked 2026-06-24).
 *
 * The one genuinely-additive insight from the June-2026 independent strategy
 * brief ("Auditing the reasoning, not the data"), made into a dynamic founder-hub
 * surface: sell to the fiduciary GATEKEEPER who is accountable for the call but
 * does NOT author it; the AUTHOR who champions their own live deal is the trap.
 *
 * It is the antidote to "spread too thin" — it plots the four LOCKED v3.5 wedge
 * personas on a gatekeeper↔author axis so the founder sees which ONE to lead with
 * and how to de-risk the author personas (the retro cold-open). It SHARPENS the
 * wedge; it does not pivot it. All data reads the SSOT in icp.ts — no drift.
 */

import { useState } from 'react';
import { Crosshair, ShieldCheck, Repeat, ArrowRight, FileSignature } from 'lucide-react';
import {
  WEDGE_GATEKEEPER_AXIS,
  BEACHHEAD_FOCUS,
  getPhase1Persona,
  type Phase1PersonaId,
} from '@/lib/constants/icp';

type AxisRole = 'gatekeeper' | 'mixed' | 'author';

const AXIS_COLOR: Record<AxisRole, string> = {
  gatekeeper: 'var(--success)',
  mixed: 'var(--warning)',
  author: 'var(--error)',
};
const AXIS_LABEL: Record<AxisRole, string> = {
  gatekeeper: 'Gatekeeper',
  mixed: 'Mixed',
  author: 'Author',
};

// Display-only short labels (the SSOT labels are long). Presentation, not data.
const SHORT: Record<Exclude<Phase1PersonaId, 'other'>, string> = {
  independent_sponsor: 'Indie sponsor',
  self_funded_searcher: 'Searcher (ETA)',
  serial_acquirer: 'Serial acquirer',
};

const ROWS = WEDGE_GATEKEEPER_AXIS.map(a => ({
  ...a,
  label: getPhase1Persona(a.persona)?.label ?? a.persona,
  short: SHORT[a.persona],
})).sort((a, b) => a.gatekeeperScore - b.gatekeeperScore);

const LEAD = BEACHHEAD_FOCUS.leadPersona;
const LEAD_LABEL = getPhase1Persona(LEAD)?.label ?? LEAD;

export function BeachheadFocusPanel() {
  const [selected, setSelected] = useState<Phase1PersonaId>(LEAD);
  const sel = ROWS.find(r => r.persona === selected) ?? ROWS[0];
  const selColor = AXIS_COLOR[sel.axisRole];

  return (
    <div>
      {/* The additive insight, stated once */}
      <p
        style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
          margin: '0 0 14px',
        }}
      >
        The deepest fix for &ldquo;spread too thin&rdquo; is one buyer. An independent 70-source
        strategy pass landed on the sharpest lens for picking that buyer:{' '}
        <strong style={{ color: 'var(--text-primary)' }}>
          sell to the fiduciary gatekeeper who is accountable for the call but does not author it
        </strong>
        . Selling to the author — who champions their own live deal — is the structural trap that
        has sunk decision-software before. Here is where each of your four wedge personas sits.
      </p>

      {/* The spectrum */}
      <div
        style={{
          padding: '20px 18px 14px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--error)' }}>
            ← AUTHOR · the trap
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)' }}>
            GATEKEEPER · the buyer →
          </span>
        </div>

        {/* track */}
        <div style={{ position: 'relative', height: 56 }}>
          <div
            style={{
              position: 'absolute',
              top: 9,
              left: 0,
              right: 0,
              height: 6,
              borderRadius: 999,
              background:
                'linear-gradient(90deg, color-mix(in srgb, var(--error) 55%, transparent), color-mix(in srgb, var(--warning) 45%, transparent), color-mix(in srgb, var(--success) 60%, transparent))',
            }}
          />
          {ROWS.map((r, i) => {
            const isSel = r.persona === selected;
            const isLead = r.persona === LEAD;
            const color = AXIS_COLOR[r.axisRole];
            // adjacent dots (close scores) alternate label height to avoid collision
            const labelTop = i % 2 === 0 ? 26 : 40;
            return (
              <button
                key={r.persona}
                onClick={() => setSelected(r.persona)}
                aria-pressed={isSel}
                aria-label={`Select ${r.label}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: `${r.gatekeeperScore * 100}%`,
                  transform: 'translateX(-50%)',
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    width: isSel ? 22 : 16,
                    height: isSel ? 22 : 16,
                    borderRadius: '50%',
                    background: color,
                    border: isSel ? '3px solid var(--bg-card)' : '2px solid var(--bg-card)',
                    boxShadow: isSel
                      ? `0 0 0 3px ${color}, 0 2px 8px color-mix(in srgb, ${color} 50%, transparent)`
                      : isLead
                        ? `0 0 0 2px color-mix(in srgb, ${color} 60%, transparent)`
                        : 'none',
                    margin: '0 auto',
                    transition: 'all 120ms ease',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: labelTop,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                    fontSize: 10,
                    fontWeight: isSel ? 700 : 500,
                    color: isSel ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}
                >
                  {isLead && '★ '}
                  {r.short}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* selected persona detail */}
      <div
        style={{
          padding: 16,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderTop: `3px solid ${selColor}`,
          borderRadius: 'var(--radius-lg)',
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            {sel.label}
          </span>
          {sel.persona === LEAD && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--success)',
                background: 'color-mix(in srgb, var(--success) 12%, transparent)',
                padding: '2px 8px',
                borderRadius: 999,
              }}
            >
              ★ LEAD BEACHHEAD
            </span>
          )}
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: selColor,
              background: `color-mix(in srgb, ${selColor} 12%, transparent)`,
              padding: '2px 8px',
              borderRadius: 999,
            }}
          >
            {AXIS_LABEL[sel.axisRole]}
          </span>
        </div>

        <p
          style={{
            fontSize: 12.5,
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
            margin: '0 0 12px',
          }}
        >
          {sel.accountability}
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: 12,
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <span
            style={{
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11,
              fontWeight: 700,
              color: sel.approach === 'retro' ? 'var(--warning)' : 'var(--success)',
            }}
          >
            {sel.approach === 'retro' ? <Repeat size={13} /> : <ArrowRight size={13} />}
            {sel.approach === 'retro' ? 'RETRO open' : 'FORWARD open'}
          </span>
          <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {sel.approachNote}
          </span>
        </div>
      </div>

      {/* the focus discipline — one buyer, one motion, one proof */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10,
          marginBottom: 12,
        }}
      >
        {[
          {
            icon: <Crosshair size={15} />,
            label: 'One buyer',
            body: BEACHHEAD_FOCUS.oneBuyer,
            accent: 'var(--success)',
          },
          {
            icon: <Repeat size={15} />,
            label: 'One motion',
            body: BEACHHEAD_FOCUS.oneMotion,
            accent: 'var(--info)',
          },
          {
            icon: <FileSignature size={15} />,
            label: 'One proof',
            body: BEACHHEAD_FOCUS.oneProof,
            accent: 'var(--accent-secondary)',
          },
        ].map(card => (
          <div
            key={card.label}
            style={{
              padding: 12,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderTop: `3px solid ${card.accent}`,
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 6,
                color: card.accent,
              }}
            >
              {card.icon}
              <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                {card.label}
              </span>
            </div>
            <p
              style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}
            >
              {card.body}
            </p>
          </div>
        ))}
      </div>

      {/* the guardrail — sharpens, doesn't pivot */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          padding: 12,
          background: 'color-mix(in srgb, var(--warning) 7%, transparent)',
          border: '1px solid color-mix(in srgb, var(--warning) 25%, transparent)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <ShieldCheck size={15} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
          <strong style={{ color: 'var(--text-primary)' }}>
            This sharpens the wedge — it does not pivot it.
          </strong>{' '}
          Lead with {LEAD_LABEL}. {BEACHHEAD_FOCUS.notThis}
        </p>
      </div>
    </div>
  );
}
