'use client';

import { type ReactNode } from 'react';
import { type LucideIcon, Info } from 'lucide-react';

/**
 * SignalBlock — the canonical R²F surface card pattern (DESIGN.md §156).
 *
 * Used for procurement-grade Recognition-Rigor Framework signals:
 *   - Validity Classification (Kahneman & Klein 2009)
 *   - Reference Class Forecast (Kahneman & Lovallo 2003)
 *   - Feedback Adequacy (Kahneman & Klein 2009)
 *   - Org Calibration (per-org Brier-scored recalibration)
 *   - Counterfactual Impact (top-3 bias scenarios)
 *
 * Anatomy:
 *   eyebrow → verdict pill → primary metric → one-sentence rationale → citation footer
 *
 * Mirrors the DPR cover-page strip aesthetic so the same artefact shape
 * appears on the live audit page AND the exported PDF — buyer recognition
 * compounds across surfaces.
 *
 * Use the default plain-language eyebrow on cold-context surfaces. The
 * technical name (R²F / Reference Class Forecast / etc.) lives in the
 * footer citation, not the eyebrow.
 */

export type SignalBand =
  | 'critical' // immediate concern (red-bordered)
  | 'high' // notable concern (orange-bordered)
  | 'medium' // worth flagging (amber-bordered)
  | 'low' // green-light (green-bordered)
  | 'neutral' // informational (slate-bordered)
  | 'unknown'; // cold-start / insufficient data (slate-dashed)

const BAND_BORDER: Record<SignalBand, string> = {
  critical: 'var(--error)',
  high: 'var(--severity-high)',
  medium: 'var(--warning)',
  low: 'var(--success)',
  neutral: 'var(--text-muted)',
  unknown: 'var(--text-muted)',
};

const BAND_PILL_BG: Record<SignalBand, string> = {
  critical: 'color-mix(in srgb, var(--error) 12%, transparent)',
  high: 'color-mix(in srgb, var(--severity-high) 12%, transparent)',
  medium: 'color-mix(in srgb, var(--warning) 14%, transparent)',
  low: 'color-mix(in srgb, var(--success) 12%, transparent)',
  neutral: 'color-mix(in srgb, var(--text-muted) 10%, transparent)',
  unknown: 'color-mix(in srgb, var(--text-muted) 8%, transparent)',
};

const BAND_PILL_FG: Record<SignalBand, string> = {
  critical: 'var(--error)',
  high: 'var(--severity-high)',
  medium: 'var(--warning)',
  low: 'var(--success)',
  neutral: 'var(--text-secondary)',
  unknown: 'var(--text-muted)',
};

export interface SignalBlockProps {
  /** Plain-language category label (e.g. "Outside View · Reference Class").
   *  NEVER lead with technical name on cold-context surfaces. */
  eyebrow: string;
  /** The band-colored verdict pill text (e.g. "STRUGGLES", "ADEQUATE", "HIGH-VALIDITY"). */
  verdict: string;
  /** Severity / outcome band — drives the left border + pill color. */
  band: SignalBand;
  /** The primary metric or claim — the headline of this signal. */
  metric?: ReactNode;
  /** One-sentence plain-language rationale beneath the metric. */
  rationale?: ReactNode;
  /** Optional small lucide icon next to the eyebrow. */
  icon?: LucideIcon;
  /** Tiny footer line — academic citation + methodology version stamp.
   *  Example: "Kahneman & Lovallo 2003 · methodology v2.1.0-validity". */
  citation?: ReactNode;
  /** Optional info-tooltip body shown on hover of the (i) icon next to the eyebrow.
   *  Use this to surface the technical name on cold-context surfaces. */
  tooltip?: string;
  /** Optional click handler — wraps the whole block in a button with subtle hover. */
  onClick?: () => void;
  /** Optional href — wraps in an anchor instead of a button. */
  href?: string;
  /** Compact density — reduces padding, used in tight grid layouts. */
  compact?: boolean;
  /** Children render below the rationale, before the citation footer. */
  children?: ReactNode;
  /** Stable test/anchor id. */
  id?: string;
}

export function SignalBlock({
  eyebrow,
  verdict,
  band,
  metric,
  rationale,
  icon: Icon,
  citation,
  tooltip,
  onClick,
  href,
  compact = false,
  children,
  id,
}: SignalBlockProps) {
  const inner = (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${BAND_BORDER[band]}`,
        borderRadius: 'var(--radius-lg)',
        padding: compact ? '14px 16px' : '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? 8 : 10,
        height: '100%',
        transition: 'transform 150ms ease-out, box-shadow 150ms ease-out',
      }}
    >
      {/* Eyebrow */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 'var(--fs-3xs)',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}
      >
        {Icon && <Icon size={12} aria-hidden />}
        <span>{eyebrow}</span>
        {tooltip && (
          <span
            tabIndex={0}
            title={tooltip}
            aria-label={tooltip}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              cursor: 'help',
              opacity: 0.6,
            }}
          >
            <Info size={11} aria-hidden />
          </span>
        )}
      </div>

      {/* Verdict pill */}
      <div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            background: BAND_PILL_BG[band],
            color: BAND_PILL_FG[band],
            fontSize: 'var(--fs-3xs)',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {verdict}
        </span>
      </div>

      {/* Primary metric */}
      {metric != null && (
        <div
          style={{
            fontSize: 'var(--fs-xl)',
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
          }}
        >
          {metric}
        </div>
      )}

      {/* Rationale */}
      {rationale != null && (
        <p
          style={{
            margin: 0,
            fontSize: 'var(--fs-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
          }}
        >
          {rationale}
        </p>
      )}

      {children}

      {/* Citation footer */}
      {citation != null && (
        <>
          <hr
            style={{
              border: 0,
              borderTop: '1px solid var(--border-color)',
              margin: '4px 0 0 0',
              width: '100%',
            }}
          />
          <div
            style={{
              fontSize: 'var(--fs-3xs)',
              color: 'var(--text-muted)',
              fontStyle: 'italic',
              lineHeight: 1.5,
            }}
          >
            {citation}
          </div>
        </>
      )}
    </div>
  );

  if (href) {
    return (
      <a
        id={id}
        href={href}
        style={{
          display: 'block',
          textDecoration: 'none',
          color: 'inherit',
        }}
        className="signal-block-link"
      >
        {inner}
      </a>
    );
  }

  if (onClick) {
    return (
      <button
        id={id}
        type="button"
        onClick={onClick}
        style={{
          display: 'block',
          textAlign: 'left',
          background: 'none',
          border: 'none',
          padding: 0,
          width: '100%',
          cursor: 'pointer',
          color: 'inherit',
        }}
        className="signal-block-link"
      >
        {inner}
      </button>
    );
  }

  return <div id={id}>{inner}</div>;
}

/**
 * SignalBlockGrid — responsive 2-3 column grid for SignalBlocks.
 * Defaults to `auto-fit, minmax(280px, 1fr)` per DESIGN.md card-min-width rule.
 * Mobile collapse to single column happens automatically below ~700px due to
 * minmax(280px, 1fr).
 */
export function SignalBlockGrid({
  children,
  minWidth = 280,
}: {
  children: ReactNode;
  minWidth?: number;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}px, 1fr))`,
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}
