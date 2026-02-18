'use client';

import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';

interface BiasTreemapProps {
    data: { name: string; count: number }[];
    severityMap?: Record<string, number>;
}

const SEVERITY_COLORS = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
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
    '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
    '#f43f5e', '#f97316', '#eab308', '#22c55e',
    '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1',
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
                rx={4}
                fill={color}
                fillOpacity={0.2}
                stroke={color}
                strokeWidth={1.5}
                strokeOpacity={0.6}
            />
            {width > 60 && height > 35 && (
                <>
                    <text
                        x={x + 8}
                        y={y + 16}
                        fill="var(--text-primary)"
                        fontSize={10}
                        fontWeight={600}
                    >
                        {(name || '').length > Math.floor(width / 7)
                            ? (name || '').slice(0, Math.floor(width / 7)) + '…'
                            : name}
                    </text>
                    <text
                        x={x + 8}
                        y={y + 30}
                        fill={color}
                        fontSize={14}
                        fontWeight={700}
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
            <div className="card card-glow h-full">
                <div className="card-header">
                    <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Bias Landscape
                    </h3>
                </div>
                <div className="card-body flex items-center justify-center" style={{ height: 320 }}>
                    <p className="text-muted" style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}>NO DATA</p>
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
        <div className="card card-glow h-full">
            <div className="card-header flex items-center justify-between">
                <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Bias Landscape
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {severityMap && Object.keys(severityMap).length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            {(['critical', 'high', 'medium', 'low'] as const)
                                .filter(s => (severityMap[s] ?? 0) > 0)
                                .map(s => (
                                    <span key={s} style={{
                                        fontSize: '9px',
                                        fontFamily: 'JetBrains Mono, monospace',
                                        padding: '1px 5px',
                                        border: `1px solid ${SEVERITY_COLORS[s]}40`,
                                        color: SEVERITY_COLORS[s],
                                        background: `${SEVERITY_COLORS[s]}10`,
                                    }}>
                                        {s[0].toUpperCase()}: {severityMap[s]}
                                    </span>
                                ))
                            }
                        </div>
                    )}
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {data.reduce((s, d) => s + d.count, 0)} total
                    </span>
                </div>
            </div>
            <div className="card-body" style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <Treemap
                        data={treemapData}
                        dataKey="size"
                        stroke="var(--bg-primary)"
                        content={<CustomContent x={0} y={0} width={0} height={0} index={0} />}
                    >
                        <Tooltip
                            contentStyle={{
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '0',
                                fontSize: '11px',
                                fontFamily: 'JetBrains Mono, monospace',
                            }}
                            formatter={(value: number | undefined) => [`${value ?? 0} occurrences`, 'Count']}
                        />
                    </Treemap>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export { SEVERITY_COLORS };
