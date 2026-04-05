'use client';

import { Sparkles } from 'lucide-react';

/**
 * Small inline chip that marks a row / card as synthetic sample data
 * (M4 — Cold-Start Fix). Rendered conditionally on anything that has
 * `isSample: true` so users can distinguish seeded content from their
 * own work at a glance.
 *
 * Usage:
 *   {doc.isSample && <SampleBadge />}
 *   {doc.isSample && <SampleBadge tooltip="This is a seeded demo analysis" />}
 */
export function SampleBadge({
  tooltip = 'Synthetic sample data — remove any time from the dashboard banner.',
  size = 'sm',
}: {
  tooltip?: string;
  size?: 'xs' | 'sm';
}) {
  const fontSize = size === 'xs' ? 9 : 10;
  const iconSize = size === 'xs' ? 9 : 10;
  const padding = size === 'xs' ? '1px 5px' : '2px 7px';

  return (
    <span
      title={tooltip}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        padding,
        fontSize,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: '#60a5fa',
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        borderRadius: 4,
        lineHeight: 1,
        verticalAlign: 'middle',
      }}
    >
      <Sparkles size={iconSize} />
      SAMPLE
    </span>
  );
}
