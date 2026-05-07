'use client';

/**
 * TenTenForeverOverlay — surfaces the 7 missing relationship slots from
 * the master KB Q3 synthesis (Sharran's "10-10 Forever" rule applied to
 * Decision Intel's existing 3 named nodes Mr. Reiner / Mr. Gabe / Sankore).
 *
 * Item locked 2026-05-07. Designed to mount alongside (not replace) the
 * existing WarmIntroNetworkMap. The map shows who DI is already
 * cultivating; this overlay shows who DI must add to make the 10-10
 * roster complete.
 *
 * Each slot card carries:
 *   - the role name + the missing-slot rationale
 *   - which channel (existing node) to find them through
 *   - the target cadence
 *   - the phase the slot is most load-bearing for
 *
 * Anchor: id="ten_ten_forever" — referenced from
 * SharranOperatingPrinciples principle #6 CTA.
 */

import {
  Briefcase,
  Building2,
  Compass,
  GraduationCap,
  Layers,
  ShieldCheck,
  Network,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { TEN_TEN_FOREVER_SLOTS, type TenTenSlot } from './data/sharran-principles';

const ROLE_ICON: Record<string, LucideIcon> = {
  vendor_continuity_engineer: ShieldCheck,
  governance_coalition_insider: Layers,
  elite_consulting_channel: Briefcase,
  f500_gc_validator: Building2,
  agentic_shift_technologist: Compass,
  fractional_cso_evangelist: Network,
  behavioral_science_anchor: GraduationCap,
};

const PHASE_COLOR: Record<TenTenSlot['phase'], string> = {
  'Phase 1': 'var(--success)',
  'Phase 2': 'var(--info)',
  'Phase 3': 'var(--warning)',
  'Phase 4': 'var(--error)',
  'Cross-phase': 'var(--accent-primary)',
};

const CADENCE_LABEL: Record<TenTenSlot['cadence'], string> = {
  monthly: 'Monthly cadence',
  quarterly: 'Quarterly cadence',
  annual: 'Annual cadence',
  'ad-hoc': 'Ad-hoc · trigger-based',
};

export function TenTenForeverOverlay() {
  return (
    <div id="ten_ten_forever" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div
        style={{
          background: 'color-mix(in srgb, var(--accent-primary) 6%, transparent)',
          border: '1px solid color-mix(in srgb, var(--accent-primary) 25%, var(--border-color))',
          borderRadius: 'var(--radius-md, 8px)',
          padding: '14px 16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--accent-primary)',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          <Users size={12} strokeWidth={2.5} aria-hidden />
          Sharran 10-10 Forever overlay · 7 missing slots
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: 1.6,
            color: 'var(--text-primary)',
          }}
        >
          The existing Warm-Intro Network Map names Mr. Reiner / Mr. Gabe / Sankore as the load-bearing
          relationships today. The 10-10 Forever rule (identify the 10 people you would invest in for
          the next 10 years) catches the 7 specific person-types still missing — each maps to a Phase
          1-4 risk the existing 3 nodes don&apos;t cover. Every slot below carries a channel back to
          the existing roster (e.g. find the Vendor Continuity Engineer via Mr. Reiner&apos;s Wiz
          network).
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 10,
        }}
      >
        {TEN_TEN_FOREVER_SLOTS.map(slot => (
          <SlotCard key={slot.id} slot={slot} />
        ))}
      </div>
    </div>
  );
}

function SlotCard({ slot }: { slot: TenTenSlot }) {
  const Icon = ROLE_ICON[slot.id] ?? Users;
  const phaseColor = PHASE_COLOR[slot.phase];

  return (
    <article
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${phaseColor}`,
        borderRadius: 'var(--radius-md, 8px)',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-sm, 6px)',
            background: 'color-mix(in srgb, var(--accent-primary) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--accent-primary) 25%, var(--border-color))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary)',
            flexShrink: 0,
          }}
          aria-hidden
        >
          <Icon size={15} strokeWidth={2.25} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.005em',
              marginBottom: 2,
            }}
          >
            {slot.role}
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: phaseColor,
              background: `color-mix(in srgb, ${phaseColor} 10%, transparent)`,
              border: `1px solid color-mix(in srgb, ${phaseColor} 28%, var(--border-color))`,
              padding: '2px 7px',
              borderRadius: 999,
            }}
          >
            {slot.phase} · {CADENCE_LABEL[slot.cadence]}
          </div>
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: 3,
          }}
        >
          Why this slot
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--text-primary)' }}>
          {slot.whyItMatters}
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--accent-primary)',
            marginBottom: 3,
          }}
        >
          How to find them
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--text-primary)' }}>
          {slot.channelToFind}
        </div>
      </div>
    </article>
  );
}
