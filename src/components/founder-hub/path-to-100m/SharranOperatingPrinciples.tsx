'use client';

/**
 * SharranOperatingPrinciples — the canonical home for the 7 Srivatsaa
 * mental models, applied to Decision Intel.
 *
 * Item locked 2026-05-07 from a 4-question NotebookLM master KB
 * synthesis pass against the Sharran video summary. The component is
 * deliberately CONFRONTATIONAL on the 1-1-1 violation table (universal
 * point #1 of the synthesis was that DI today is N-N-N architected for
 * Phase 4 ceiling, not Phase 1 wedge).
 *
 * Layout:
 *   1. Hero subhead — "The 5-exit operator's playbook, applied to DI"
 *   2. 1-1-1 Violation Table — three rows (Traffic / Conversion /
 *      Delivery) showing claimed vs actual-shipped vs fix.
 *   3. 7 Principle Cards — one per principle, each carrying:
 *      - Sharran's framing
 *      - DI-specific applied framing
 *      - phase tag (NOW / LATER / INAPPLICABLE) with rationale
 *      - 90-day action when applicable
 *      - optional CTA to a sibling tool (Valuation Hack / 2× Tomorrow /
 *        10-10 Forever)
 *
 * Cross-references the existing Sharran 1-1-1 lock in CLAUDE.md and the
 * GTM v3.5 wedge motion. Tab id "path_to_100m" stays as the canonical
 * home — this is mounted as a Section inside PathToHundredMillionTab.
 */

import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronDown,
  Layers,
  ShieldCheck,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import {
  ONE_ONE_ONE_VIOLATIONS,
  SHARRAN_PRINCIPLES,
  type PhaseTag,
  type SharranPrinciple,
} from './data/sharran-principles';

const PHASE_META: Record<
  PhaseTag,
  { label: string; color: string; bg: string; border: string; icon: LucideIcon }
> = {
  APPLICABLE_NOW: {
    label: 'NOW',
    color: 'var(--success)',
    bg: 'color-mix(in srgb, var(--success) 10%, transparent)',
    border: 'color-mix(in srgb, var(--success) 35%, var(--border-color))',
    icon: CheckCircle2,
  },
  ABOUT_TO_BE_RELEVANT: {
    label: 'LATER',
    color: 'var(--warning)',
    bg: 'color-mix(in srgb, var(--warning) 10%, transparent)',
    border: 'color-mix(in srgb, var(--warning) 35%, var(--border-color))',
    icon: Clock,
  },
  INAPPLICABLE: {
    label: 'N/A',
    color: 'var(--text-muted)',
    bg: 'var(--bg-tertiary)',
    border: 'var(--border-color)',
    icon: XCircle,
  },
};

export function SharranOperatingPrinciples() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <ViolationTable />
      <PrinciplesGrid />
    </div>
  );
}

/* ───────── 1-1-1 Violation Table ───────── */

function ViolationTable() {
  return (
    <section
      aria-labelledby="sharran-violations-heading"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderLeft: '3px solid var(--error)',
        borderRadius: 'var(--radius-md, 8px)',
        padding: '18px 20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 6,
          color: 'var(--error)',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        <AlertTriangle size={12} strokeWidth={2.5} aria-hidden />
        The 1-1-1 violation table
      </div>
      <h3
        id="sharran-violations-heading"
        style={{
          margin: 0,
          fontSize: 'var(--fs-md, 18px)',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
          marginBottom: 8,
        }}
      >
        Phase 4 ceiling, sold to a Phase 1 buyer.
      </h3>
      <p
        style={{
          margin: 0,
          fontSize: 13.5,
          lineHeight: 1.55,
          color: 'var(--text-secondary)',
          maxWidth: 760,
          marginBottom: 14,
        }}
      >
        Per the master KB Q1 synthesis: the locked Phase 1 wedge motion in CLAUDE.md GTM v3.5 IS
        1-1-1 on paper, but the shipped platform is N-N-N. Three specific violations follow. The
        discipline isn&apos;t &quot;build the wedge&quot; — it&apos;s <em>hide the plumbing</em> for
        Phase 1 users. Every other tab survives as Phase 4 ceiling moat — gated, not deleted.
      </p>

      <div
        style={{
          display: 'grid',
          gap: 10,
        }}
      >
        {ONE_ONE_ONE_VIOLATIONS.map(v => (
          <div
            key={v.pillar}
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr',
              gap: 12,
              padding: '12px 14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm, 6px)',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--error)',
                paddingTop: 2,
              }}
            >
              {v.pillar}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
              <ViolationRow
                label="Wedge claims"
                tone="success"
                body={v.claimed}
              />
              <ViolationRow
                label="Platform actually ships"
                tone="error"
                body={v.actualShipped}
              />
              <ViolationRow label="The fix" tone="info" body={v.fix} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ViolationRow({
  label,
  tone,
  body,
}: {
  label: string;
  tone: 'success' | 'error' | 'info';
  body: string;
}) {
  const color =
    tone === 'success'
      ? 'var(--success)'
      : tone === 'error'
        ? 'var(--error)'
        : 'var(--info)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-primary)' }}>{body}</span>
    </div>
  );
}

/* ───────── Principles Grid ───────── */

function PrinciplesGrid() {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set([SHARRAN_PRINCIPLES[0].id]));
  const toggle = (id: string) => {
    const next = new Set(openIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOpenIds(next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {SHARRAN_PRINCIPLES.map(p => (
        <PrincipleCard
          key={p.id}
          principle={p}
          open={openIds.has(p.id)}
          onToggle={() => toggle(p.id)}
        />
      ))}
    </div>
  );
}

function PrincipleCard({
  principle,
  open,
  onToggle,
}: {
  principle: SharranPrinciple;
  open: boolean;
  onToggle: () => void;
}) {
  const phase = PHASE_META[principle.phaseTag];
  const PhaseIcon = phase.icon;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${open ? phase.border : 'var(--border-color)'}`,
        borderLeft: `3px solid ${phase.color}`,
        borderRadius: 'var(--radius-md, 8px)',
        overflow: 'hidden',
        transition: 'border-color 0.15s ease',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            background: phase.bg,
            border: `1px solid ${phase.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: phase.color,
            fontSize: 12,
            fontWeight: 800,
            flexShrink: 0,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {principle.number}
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
            {principle.name}
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              lineHeight: 1.45,
            }}
          >
            {principle.subhead}
          </div>
        </div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: '0.08em',
            color: phase.color,
            background: phase.bg,
            border: `1px solid ${phase.border}`,
            padding: '3px 8px',
            borderRadius: 999,
            flexShrink: 0,
          }}
        >
          <PhaseIcon size={10} strokeWidth={2.5} aria-hidden />
          {phase.label}
        </span>
        <span style={{ color: 'var(--text-muted)', flexShrink: 0 }} aria-hidden>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>

      {open && (
        <div
          style={{
            padding: '4px 16px 16px 56px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <PrincipleSection
            label="Sharran's framing"
            body={principle.sharranFraming}
            icon={Layers}
            tone="muted"
          />
          <PrincipleSection
            label="Applied to Decision Intel"
            body={principle.appliedToDi}
            icon={ShieldCheck}
            tone="primary"
          />
          <div
            style={{
              padding: '10px 12px',
              background: phase.bg,
              border: `1px solid ${phase.border}`,
              borderRadius: 'var(--radius-sm, 6px)',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: phase.color,
                marginBottom: 4,
              }}
            >
              <PhaseIcon size={11} strokeWidth={2.5} aria-hidden />
              Phase fit · {phase.label}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-primary)', lineHeight: 1.55 }}>
              {principle.phaseRationale}
            </div>
          </div>
          {principle.ninetyDayAction && (
            <div
              style={{
                padding: '10px 12px',
                background: 'color-mix(in srgb, var(--accent-primary) 6%, transparent)',
                border: '1px solid color-mix(in srgb, var(--accent-primary) 25%, var(--border-color))',
                borderLeft: '3px solid var(--accent-primary)',
                borderRadius: 'var(--radius-sm, 6px)',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--accent-primary)',
                  marginBottom: 4,
                }}
              >
                90-day action
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-primary)', lineHeight: 1.55 }}>
                {principle.ninetyDayAction}
              </div>
            </div>
          )}
          {principle.cta && <PrincipleCta cta={principle.cta} />}
        </div>
      )}
    </div>
  );
}

function PrincipleSection({
  label,
  body,
  icon: Icon,
  tone,
}: {
  label: string;
  body: string;
  icon: LucideIcon;
  tone: 'muted' | 'primary';
}) {
  const labelColor = tone === 'primary' ? 'var(--accent-primary)' : 'var(--text-muted)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: labelColor,
        }}
      >
        <Icon size={11} strokeWidth={2.5} aria-hidden />
        {label}
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)' }}>{body}</div>
    </div>
  );
}

function PrincipleCta({ cta }: { cta: NonNullable<SharranPrinciple['cta']> }) {
  // The surfaceId-based CTAs scroll to a sibling section on the same
  // page (PathToHundredMillionTab). Each Section component carries the
  // matching id as a DOM anchor.
  const handleClick = () => {
    if (cta.surfaceId) {
      const el = window.document.getElementById(cta.surfaceId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    if (cta.href) {
      window.open(cta.href, '_blank', 'noopener');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        alignSelf: 'flex-start',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 14px',
        background: 'var(--accent-primary)',
        color: '#fff',
        border: 'none',
        borderRadius: 'var(--radius-sm, 6px)',
        fontSize: 12.5,
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'opacity 0.15s ease, transform 0.15s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.opacity = '0.92';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.opacity = '1';
        e.currentTarget.style.transform = '';
      }}
    >
      {cta.label}
    </button>
  );
}
