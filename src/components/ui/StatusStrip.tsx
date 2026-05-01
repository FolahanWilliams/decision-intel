'use client';

import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';

/**
 * StatusStrip — the canonical chip-row pattern used at the top of every
 * detail page (document, decision package, deal). Replaces ad-hoc inline
 * div + span structures.
 *
 * Per DESIGN.md §107 density rule: maximum 6 chips. Above 6 collapses to
 * a "+N more" overflow chip on hover/click.
 *
 * Anatomy:
 *   StatusStrip
 *     └─ StatusChip × N
 *
 * Each chip carries an optional icon, a label, and an optional severity
 * tone. Chips with `tone="primary"` get the accent-green treatment
 * (owner-only badges); `tone="warning"` / `tone="danger"` for state
 * alerts; `tone="muted"` for metadata (timestamps, byline).
 */

export type ChipTone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted';

const TONE_BG: Record<ChipTone, string> = {
  primary: 'color-mix(in srgb, var(--accent-primary) 10%, transparent)',
  success: 'color-mix(in srgb, var(--success) 10%, transparent)',
  warning: 'color-mix(in srgb, var(--warning) 12%, transparent)',
  danger: 'color-mix(in srgb, var(--error) 10%, transparent)',
  info: 'color-mix(in srgb, var(--info) 10%, transparent)',
  muted: 'var(--bg-secondary)',
};

const TONE_FG: Record<ChipTone, string> = {
  primary: 'var(--accent-secondary)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--error)',
  info: 'var(--info)',
  muted: 'var(--text-secondary)',
};

const TONE_BORDER: Record<ChipTone, string> = {
  primary: 'color-mix(in srgb, var(--accent-primary) 30%, transparent)',
  success: 'color-mix(in srgb, var(--success) 30%, transparent)',
  warning: 'color-mix(in srgb, var(--warning) 30%, transparent)',
  danger: 'color-mix(in srgb, var(--error) 30%, transparent)',
  info: 'color-mix(in srgb, var(--info) 30%, transparent)',
  muted: 'var(--border-color)',
};

export interface StatusChipProps {
  icon?: LucideIcon;
  label: ReactNode;
  /** Optional secondary text rendered after the label in muted color. */
  value?: ReactNode;
  tone?: ChipTone;
  /** Optional title attribute for hover tooltips on truncated labels. */
  title?: string;
  /** Optional click handler — wraps in a button. */
  onClick?: () => void;
}

export function StatusChip({
  icon: Icon,
  label,
  value,
  tone = 'muted',
  title,
  onClick,
}: StatusChipProps) {
  const inner = (
    <span
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        background: TONE_BG[tone],
        border: `1px solid ${TONE_BORDER[tone]}`,
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--fs-xs)',
        fontWeight: 500,
        color: TONE_FG[tone],
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {Icon && <Icon size={12} aria-hidden style={{ flexShrink: 0 }} />}
      <span>{label}</span>
      {value != null && (
        <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
          {value}
        </span>
      )}
    </span>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
      >
        {inner}
      </button>
    );
  }

  return inner;
}

export interface StatusStripProps {
  children: ReactNode;
}

export function StatusStrip({ children }: StatusStripProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
        rowGap: 8,
      }}
    >
      {children}
    </div>
  );
}
