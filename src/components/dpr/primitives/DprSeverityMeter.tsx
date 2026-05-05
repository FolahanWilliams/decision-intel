/**
 * DPR Severity Meter — 5-segment horizontal bar.
 *
 * Locked 2026-05-05 (Phase 3). Used in finding cards to render the
 * severity-classification at-a-glance. Each finding has one of four
 * severity levels (critical / high / medium / low); the meter fills
 * 5 / 4 / 3 / 2 segments respectively in the matching severity colour,
 * with empty segments rendered in light grey.
 *
 * Apple Health / Linear-style — institutional, not playful. Reader
 * doesn't have to read the severity word; the meter is calibrated to
 * the colour-coded label next to it.
 */

import type { DprFindingSeverity } from '@/lib/reports/dpr-findings';

const SEGMENT_COUNT = 5;

const FILLED_BY_SEVERITY: Record<DprFindingSeverity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
};

const COLOR_VAR_BY_SEVERITY: Record<DprFindingSeverity, string> = {
  critical: 'var(--dpr-severity-critical)',
  high: 'var(--dpr-severity-high)',
  medium: 'var(--dpr-severity-medium)',
  low: 'var(--dpr-severity-low)',
};

export interface DprSeverityMeterProps {
  severity: DprFindingSeverity;
  /** Optional confidence (0-1) shown next to the meter. */
  confidence?: number;
  /** Render the meter compact (no label) for inline use. */
  compact?: boolean;
}

export function DprSeverityMeter({ severity, confidence, compact = false }: DprSeverityMeterProps) {
  const filled = FILLED_BY_SEVERITY[severity];
  const color = COLOR_VAR_BY_SEVERITY[severity];

  return (
    <div className="dpr-severity-meter">
      <div className="dpr-severity-meter-bar">
        {Array.from({ length: SEGMENT_COUNT }).map((_, i) => (
          <span
            key={i}
            className="dpr-severity-meter-seg"
            style={{
              background: i < filled ? color : 'var(--dpr-grey-200)',
            }}
          />
        ))}
      </div>
      {!compact && (
        <span
          className="dpr-severity-meter-label"
          style={{ color }}
        >
          {severity.toUpperCase()}
          {confidence != null && (
            <span className="dpr-severity-meter-conf">
              · {Math.round(confidence * 100)}% conf.
            </span>
          )}
        </span>
      )}
    </div>
  );
}
