/**
 * SeverityMeter — 5-segment severity bar (mirrors DPR's `dpr-severity-meter`).
 *
 * Visual: 5 horizontal segments. Filled count = severity rank (low=2,
 * medium=3, high=4, critical=5). Active segments use the severity colour;
 * inactive use a light grey. Renders compactly inline with bias cards or
 * as a standalone severity indicator.
 */

import type { Severity } from './SeverityEdgeCard';
import { severityToken } from './SeverityEdgeCard';

const FILL_COUNT: Record<Severity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 2,
  neutral: 1,
};

export interface SeverityMeterProps {
  severity: Severity;
  /** Show the severity word next to the meter. */
  showLabel?: boolean;
  /** Size variant — sm (compact rows) / md (default) / lg (hero callouts). */
  size?: 'sm' | 'md' | 'lg';
}

const SEGMENT_DIMS = {
  sm: { w: 12, h: 4, gap: 3 },
  md: { w: 18, h: 5, gap: 4 },
  lg: { w: 24, h: 6, gap: 5 },
} as const;

const LABEL_SIZE = { sm: 9, md: 10, lg: 11 } as const;

export function SeverityMeter({ severity, showLabel = false, size = 'md' }: SeverityMeterProps) {
  const filled = FILL_COUNT[severity];
  const color = severityToken(severity);
  const dims = SEGMENT_DIMS[size];

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'inline-flex', gap: dims.gap }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: dims.w,
              height: dims.h,
              borderRadius: 1,
              background: i < filled ? color : 'var(--bg-tertiary)',
              transition: 'background 0.15s ease',
            }}
          />
        ))}
      </div>
      {showLabel && (
        <span
          style={{
            fontSize: LABEL_SIZE[size],
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color,
          }}
        >
          {severity}
        </span>
      )}
    </div>
  );
}
