/**
 * ValueSuppressingPalette — severity color + discrete confidence chip +
 * percentage score on every finding. Locked 2026-05-20 from DR §4.
 *
 * The Deep Research counter-evidence flagged that traditional finance
 * professionals reject "fuzzy" uncertainty viz (e.g. blurred edges,
 * pure opacity confidence). The compromise the paper recommended and
 * we ship:
 *
 *   - Severity rendered as a high-contrast color band (red/amber/green)
 *   - Confidence rendered as a discrete chip (High/Medium/Low/Unknown)
 *   - Percentage shown alongside the chip in tabular figures
 *   - NO opacity-as-confidence trick (decided 2026-05-20 in scope lock)
 *
 * The 3-element pair (color + chip + percent) gives the reader three
 * orthogonal signals at a glance without forcing them to decode any
 * single visual metaphor. The procurement-grade signal lands without
 * the "lack of conviction" perception fuzzy palettes risk.
 */

'use client';

import type { CSSProperties } from 'react';
import type { ConfidenceBand, Severity, ValueSuppressingChip } from '@/lib/deliverable/types';

interface ValueSuppressingPaletteProps {
  chip: ValueSuppressingChip;
  /** When 'inline' the chip renders as a row; 'stacked' renders the
   *  confidence chip below the severity bar for cards with vertical
   *  space. Defaults to 'inline'. */
  layout?: 'inline' | 'stacked';
  /** Hide the percentage value (used in compact cards). */
  hidePct?: boolean;
}

const SEVERITY_COLORS: Record<Severity, string> = {
  critical: 'var(--severity-critical, #b91c1c)',
  high: 'var(--severity-high, #ef4444)',
  medium: 'var(--warning, #d97706)',
  low: 'var(--success, #16a34a)',
};

const SEVERITY_LABELS: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const CONFIDENCE_BG: Record<ConfidenceBand, string> = {
  High: 'rgba(15,23,42,0.10)',
  Medium: 'rgba(15,23,42,0.07)',
  Low: 'rgba(15,23,42,0.05)',
  Unknown: 'rgba(15,23,42,0.04)',
};

const CONFIDENCE_BORDER: Record<ConfidenceBand, string> = {
  High: 'rgba(15,23,42,0.18)',
  Medium: 'rgba(15,23,42,0.13)',
  Low: 'rgba(15,23,42,0.10)',
  Unknown: 'rgba(15,23,42,0.08)',
};

export function ValueSuppressingPalette({
  chip,
  layout = 'inline',
  hidePct = false,
}: ValueSuppressingPaletteProps) {
  const severityColor = SEVERITY_COLORS[chip.severity];
  const containerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexDirection: layout === 'stacked' ? 'column' : 'row',
    alignContent: 'flex-start',
  };

  return (
    <div style={containerStyle}>
      {/* Severity color band */}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '3px 9px',
          borderRadius: 999,
          background: `${severityColor}1A`, // 10% alpha tint
          color: severityColor,
          border: `1px solid ${severityColor}55`,
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          whiteSpace: 'nowrap',
        }}
        title={`Severity: ${SEVERITY_LABELS[chip.severity]}`}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: severityColor,
          }}
        />
        {SEVERITY_LABELS[chip.severity]}
      </span>

      {/* Confidence chip + percentage */}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '3px 9px',
          borderRadius: 999,
          background: CONFIDENCE_BG[chip.band],
          border: `1px solid ${CONFIDENCE_BORDER[chip.band]}`,
          color: 'var(--text-secondary, #475569)',
          fontSize: 11,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          whiteSpace: 'nowrap',
        }}
        title={
          chip.pct !== null ? `Confidence: ${chip.band} (${chip.pct}%)` : `Confidence: ${chip.band}`
        }
      >
        {chip.band}
        {!hidePct && chip.pct !== null ? (
          <span style={{ color: 'var(--text-muted, #64748B)', fontWeight: 600 }}>{chip.pct}%</span>
        ) : null}
      </span>
    </div>
  );
}

export { SEVERITY_COLORS as DELIVERABLE_SEVERITY_COLORS };
