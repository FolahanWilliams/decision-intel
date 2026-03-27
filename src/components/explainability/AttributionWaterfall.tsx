'use client';

interface WaterfallItem {
  label: string;
  value: number;
  cumulative: number;
}

export function AttributionWaterfall({ waterfall }: { waterfall: WaterfallItem[] }) {
  if (waterfall.length < 2) return null;

  // Compute visualization bounds
  const maxCumulative = Math.max(...waterfall.map(w => w.cumulative));
  const minCumulative = Math.min(...waterfall.map(w => w.cumulative), 0);
  const range = maxCumulative - minCumulative || 100;

  const barHeight = 32;
  const gap = 6;
  const labelWidth = 180;
  const valueWidth = 70;
  const chartWidth = 500;

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: `${labelWidth + chartWidth + valueWidth + 40}px` }}>
        {waterfall.map((item, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === waterfall.length - 1;
          const isPositive = item.value >= 0;
          const isEndpoint = isFirst || isLast;

          // For first/last items, show full bar from 0 to value
          // For middle items, show delta bar
          let barLeft: number;
          let barWidth: number;

          if (isEndpoint) {
            barLeft = ((0 - minCumulative) / range) * chartWidth;
            barWidth = Math.max(2, (item.cumulative / range) * chartWidth);
            if (barWidth < 0) {
              barLeft += barWidth;
              barWidth = Math.abs(barWidth);
            }
          } else {
            const prevCumulative = waterfall[idx - 1].cumulative;
            if (isPositive) {
              barLeft = ((prevCumulative - minCumulative) / range) * chartWidth;
              barWidth = Math.max(2, (item.value / range) * chartWidth);
            } else {
              barLeft = ((item.cumulative - minCumulative) / range) * chartWidth;
              barWidth = Math.max(2, (Math.abs(item.value) / range) * chartWidth);
            }
          }

          const barColor = isEndpoint
            ? 'rgba(255, 255, 255, 0.2)'
            : isPositive
              ? 'rgba(34, 197, 94, 0.6)'
              : 'rgba(239, 68, 68, 0.6)';

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: `${gap}px`,
              }}
            >
              <div
                style={{
                  width: `${labelWidth}px`,
                  fontSize: '12px',
                  color: isEndpoint ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: isEndpoint ? 600 : 400,
                  textAlign: 'right',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={item.label}
              >
                {formatLabel(item.label)}
              </div>
              <div
                style={{
                  width: `${chartWidth}px`,
                  height: `${barHeight}px`,
                  position: 'relative',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '4px',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: `${barLeft}px`,
                    width: `${barWidth}px`,
                    height: '100%',
                    background: barColor,
                    borderRadius: '4px',
                    transition: 'all 0.4s ease',
                  }}
                />
              </div>
              <div
                style={{
                  width: `${valueWidth}px`,
                  fontSize: '12px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600,
                  color: isEndpoint
                    ? 'var(--text-primary)'
                    : isPositive
                      ? '#22c55e'
                      : '#ef4444',
                }}
              >
                {isEndpoint
                  ? Math.round(item.value)
                  : `${isPositive ? '+' : ''}${item.value.toFixed(1)}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatLabel(label: string): string {
  return label
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
