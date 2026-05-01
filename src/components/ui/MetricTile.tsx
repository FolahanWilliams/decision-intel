'use client';

import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';

/**
 * MetricTile — the canonical compact card for the "key findings" stat row
 * (DESIGN.md §104, "Compact card" tier).
 *
 * Single metric + label + optional sparkline / chip / sub-text. Used in
 * 3-4 column grids above the tab bar on detail pages (document detail,
 * decision package, deal). Replaces 100+ lines of inline duplicated
 * `card / padding 20px / fontSize 10px / hardcoded hex severity` JSX
 * across the codebase.
 *
 * Anatomy:
 *   - eyebrow label (11px / 600 / muted / caps)
 *   - primary value (24px / 700 / band-colored)
 *   - optional value suffix ("/100", "%") in muted weight 400
 *   - optional sub-line (11px / muted) — e.g. "3 high severity"
 *
 * Severity is supplied as a CSS color expression — callers pass in the
 * already-resolved color from `dqiColorFor()` or `SEVERITY_COLORS[...]`.
 * Never invent a local hex map; that's the drift-class bug pattern
 * locked in CLAUDE.md "SEVERITY_COLORS canonical-import discipline."
 */

export interface MetricTileProps {
  /** Eyebrow label — keep under 24 chars. Auto-uppercase via styling. */
  label: string;
  /** Primary value, rendered at 24px / 700. */
  value: ReactNode;
  /** Optional value suffix — "/100", "%", "x". Muted weight 400. */
  suffix?: string;
  /** Optional sub-line beneath the value — e.g. "3 high severity". */
  subline?: ReactNode;
  /** Resolved CSS color expression for the value. Drives the band hue. */
  valueColor?: string;
  /** Optional icon next to the eyebrow label. */
  icon?: LucideIcon;
  /** Disabled / inactive state — used when the metric is undefined. */
  muted?: boolean;
}

export function MetricTile({
  label,
  value,
  suffix,
  subline,
  valueColor,
  icon: Icon,
  muted = false,
}: MetricTileProps) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 'var(--fs-3xs)',
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {Icon && <Icon size={11} aria-hidden />}
        <span>{label}</span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 6,
        }}
      >
        <span
          style={{
            fontSize: 'var(--fs-xl)',
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            color: muted ? 'var(--text-muted)' : valueColor || 'var(--text-primary)',
            lineHeight: 1.1,
            letterSpacing: '-0.01em',
          }}
        >
          {value}
        </span>
        {suffix && (
          <span
            style={{
              fontSize: 'var(--fs-xs)',
              fontWeight: 400,
              color: 'var(--text-muted)',
            }}
          >
            {suffix}
          </span>
        )}
      </div>
      {subline && (
        <div
          style={{
            fontSize: 'var(--fs-3xs)',
            color: 'var(--text-muted)',
            lineHeight: 1.4,
          }}
        >
          {subline}
        </div>
      )}
    </div>
  );
}

/**
 * MetricTileGrid — responsive grid wrapper for MetricTile.
 * 4-up on desktop ≥1024px, 2-up on tablet, single-column on mobile.
 */
export function MetricTileGrid({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}
