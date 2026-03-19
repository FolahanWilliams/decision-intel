'use client';

import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

interface BiasTreemapProps {
  data: { name: string; count: number }[];
  severityMap?: Record<string, number>;
}

const SEVERITY_COLORS = {
  critical: 'var(--error)',
  high: 'var(--accent-primary)',
  medium: 'var(--warning)',
  low: 'var(--success)',
};

interface TreemapContentProps {
  x: number;
  y: number;
  width: number;
  height: number;
  name?: string;
  count?: number;
  index: number;
}

const PALETTE = [
  '#d4d4d8',
  '#FBBF24',
  '#A3E635',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#d4d4d8',
  '#FBBF24',
  '#A3E635',
  '#22c55e',
  '#d4d4d8',
];

function CustomContent({ x, y, width, height, name, count, index }: TreemapContentProps) {
  if (width < 30 || height < 20) return null;

  const color = PALETTE[index % PALETTE.length];

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={0}
        fill={color}
        fillOpacity={0.15}
        stroke={color}
        strokeWidth={1}
        strokeOpacity={0.4}
      />
      {width > 60 && height > 35 && (
        <>
          <text
            x={x + 10}
            y={y + 18}
            fill="var(--text-primary)"
            fontSize={11}
            fontWeight={500}
            fontFamily="Inter, sans-serif"
          >
            {(name || '').length > Math.floor(width / 7)
              ? (name || '').slice(0, Math.floor(width / 7)) + '…'
              : name}
          </text>
          <text
            x={x + 10}
            y={y + 34}
            fill={color}
            fontSize={15}
            fontWeight={700}
            fontFamily="'JetBrains Mono', monospace"
          >
            {count}
          </text>
        </>
      )}
    </g>
  );
}

export function BiasTreemap({ data, severityMap }: BiasTreemapProps) {
  if (!data || data.length === 0) {
    return (
      <div className="card card-glow liquid-glass-depth liquid-glass-shimmer h-full">
        <div className="card-header">
          <h3 style={{ fontSize: '13px' }}>Bias Landscape</h3>
        </div>
        <div className="card-body flex items-center justify-center" style={{ minHeight: 200 }}>
          <p className="text-muted" style={{ fontSize: '12px' }}>
            No data
          </p>
        </div>
      </div>
    );
  }

  const treemapData = data.map((d, i) => ({
    name: d.name,
    size: d.count,
    count: d.count,
    fill: PALETTE[i % PALETTE.length],
  }));

  return (
    <div className="card card-glow liquid-glass-depth liquid-glass-shimmer h-full">
      <div className="card-header flex items-center justify-between">
        <h3 style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6 }}>
          Bias Landscape
          <InfoTooltip text="Shows the distribution of cognitive biases found in the document. Larger tiles indicate more frequent bias types. Colors correspond to severity levels." />
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {severityMap && Object.keys(severityMap).length > 0 && (
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              {(['critical', 'high', 'medium', 'low'] as const)
                .filter(s => (severityMap[s] ?? 0) > 0)
                .map(s => (
                  <span
                    key={s}
                    style={{
                      fontSize: '10px',
                      padding: '2px 8px',
                      color: SEVERITY_COLORS[s],
                      background: `${SEVERITY_COLORS[s]}15`,
                    }}
                  >
                    {s[0].toUpperCase()}: {severityMap[s]}
                  </span>
                ))}
            </div>
          )}
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {data.reduce((s, d) => s + d.count, 0)} total
          </span>
        </div>
      </div>
      <div className="card-body" style={{ height: 'clamp(240px, 30vw, 360px)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={treemapData}
            dataKey="size"
            stroke="var(--bg-primary)"
            content={<CustomContent x={0} y={0} width={0} height={0} index={0} />}
          >
            <Tooltip
              contentStyle={{
                background: 'rgba(0, 0, 0, 0.75)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: '12px',
                fontSize: '12px',
              }}
              formatter={value => [`${value ?? 0} occurrences`, 'Count']}
            />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export { SEVERITY_COLORS };
