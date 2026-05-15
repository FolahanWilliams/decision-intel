'use client';

/**
 * AccentCard — a card primitive with a 2-3px top accent stripe.
 *
 * The platform's existing `.card` class renders a flat white card with
 * a 1px border. When you stack 5+ of them in a column (Settings tabs,
 * Decision Log, dashboard widgets) every card looks identical and the
 * eye has nothing to anchor on. The founder flagged this 2026-05-09
 * evening as "too many white cards with no visual distinction tightly
 * packed."
 *
 * Fix: a small primitive with an `accent` prop. Each accent maps to a
 * CSS-variable colour for the top stripe, so semantic role becomes
 * visible at a glance:
 *
 *   primary  → green   — primary actions, the "hero" card on a tab
 *   info     → indigo  — informational / data / export surfaces
 *   success  → green   — security / verified / "all good" status
 *   warning  → amber   — contextual nudges, low-stakes attention
 *   danger   → red     — destructive zones (delete account, force-push)
 *   muted    → gray    — neutral / informational, no semantic colour
 *
 * Forward-looking rule: when adding a new card to any platform surface,
 * default to AccentCard with a deliberate accent choice. Falling back
 * to bare `<div className="card">` is fine for one-off surfaces but
 * any tab / page with ≥3 cards stacked should use AccentCard so the
 * eye has visual hierarchy.
 */

import type { CSSProperties, ReactNode } from 'react';

export type AccentColor = 'primary' | 'info' | 'success' | 'warning' | 'danger' | 'muted';

const ACCENT_COLORS: Record<AccentColor, string> = {
  primary: 'var(--accent-primary)',
  info: 'var(--accent-secondary, #6366f1)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--error)',
  muted: 'var(--text-muted)',
};

export interface AccentCardProps {
  accent: AccentColor;
  /** Optional eyebrow + icon row at the top of the card. */
  title?: ReactNode;
  /** Optional explicit border-top thickness in px (default 2). */
  thickness?: number;
  /** Apply a subtle tinted background matching the accent. */
  tinted?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Optional DOM id — for cards that are deep-link anchor targets
   *  (e.g. `#documents`). Without this, migrating an anchored bare
   *  `.card` to AccentCard would silently drop the fragment link. */
  id?: string;
  /**
   * Override styles on the inner body wrapper. Use when you need
   * full-bleed content (`{ padding: 0 }`) — e.g. a list of rows that
   * span edge-to-edge inside the card. Default body padding is
   * 16-18px depending on whether `title` is present.
   */
  bodyStyle?: CSSProperties;
  children: ReactNode;
}

/**
 * Render a card wrapper with a top accent stripe. The stripe replaces
 * the normal top border so the card height stays stable.
 */
export function AccentCard({
  accent,
  title,
  thickness = 2,
  tinted = false,
  className,
  style,
  bodyStyle,
  id,
  children,
}: AccentCardProps) {
  const color = ACCENT_COLORS[accent];

  const baseStyle: CSSProperties = {
    background: tinted ? `color-mix(in srgb, ${color} 4%, var(--bg-card))` : 'var(--bg-card)',
    border: `1px solid ${tinted ? `color-mix(in srgb, ${color} 22%, var(--border-color))` : 'var(--border-color)'}`,
    borderTop: `${thickness}px solid ${color}`,
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    ...style,
  };

  const defaultBodyPadding = title ? '16px 18px' : '18px';

  return (
    <div id={id} className={className} style={baseStyle}>
      {title && (
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          {title}
        </div>
      )}
      <div style={{ padding: defaultBodyPadding, ...bodyStyle }}>{children}</div>
    </div>
  );
}
