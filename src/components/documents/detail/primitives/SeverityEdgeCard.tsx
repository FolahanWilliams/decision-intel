/**
 * SeverityEdgeCard — the foundational card shape for the new doc-detail UI.
 *
 * Mirrors the DPR's `.dpr-finding` and `.dpr-dalio-card` visual rhythm:
 * 3px severity-coloured top edge + soft border + clean padding. This is
 * the McKinsey-grade card primitive every tab leans on.
 *
 * Usage:
 *   <SeverityEdgeCard severity="critical">
 *     <CardHeader />
 *     <CardBody />
 *   </SeverityEdgeCard>
 */

import type { ReactNode, CSSProperties, MouseEventHandler } from 'react';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info' | 'neutral';

const SEVERITY_TOKEN: Record<Severity, string> = {
  critical: 'var(--severity-critical)',
  high: 'var(--severity-high)',
  medium: 'var(--severity-medium)',
  low: 'var(--severity-low)',
  info: 'var(--info)',
  neutral: 'var(--border-color)',
};

export interface SeverityEdgeCardProps {
  severity?: Severity;
  /** Render edge on left instead of top — used for inline list items. */
  edge?: 'top' | 'left';
  /** Compact variant — smaller padding for dense grids. */
  compact?: boolean;
  /** Click handler — when present, card becomes interactive (hover lift). */
  onClick?: MouseEventHandler<HTMLDivElement>;
  /** Selected state — adds an outer ring matching the severity. */
  selected?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export function SeverityEdgeCard({
  severity = 'neutral',
  edge = 'top',
  compact = false,
  onClick,
  selected = false,
  className,
  style,
  children,
}: SeverityEdgeCardProps) {
  const color = SEVERITY_TOKEN[severity];
  const edgeBorder =
    edge === 'top'
      ? { borderTop: `3px solid ${color}` }
      : { borderLeft: `3px solid ${color}` };

  const interactive = !!onClick;

  return (
    <div
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      className={className}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        ...edgeBorder,
        borderRadius: 'var(--radius-md, 8px)',
        padding: compact ? '12px 14px' : '16px 18px',
        boxShadow: selected
          ? `0 0 0 3px ${color}22, 0 1px 2px rgba(0, 0, 0, 0.04)`
          : 'var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.04))',
        transition: 'box-shadow 0.15s ease, transform 0.15s ease, border-color 0.15s ease',
        cursor: interactive ? 'pointer' : 'default',
        ...style,
      }}
      onMouseEnter={
        interactive
          ? e => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.transform = 'translateY(-1px)';
              el.style.boxShadow = `0 4px 12px rgba(0, 0, 0, 0.06), 0 0 0 1px ${color}33`;
            }
          : undefined
      }
      onMouseLeave={
        interactive
          ? e => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.transform = '';
              el.style.boxShadow = selected
                ? `0 0 0 3px ${color}22, 0 1px 2px rgba(0, 0, 0, 0.04)`
                : 'var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.04))';
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}

/** Convenience: severity → token getter (for bespoke use outside the card). */
export function severityToken(severity: Severity): string {
  return SEVERITY_TOKEN[severity];
}
