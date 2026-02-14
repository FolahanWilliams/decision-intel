'use client';

import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer, Tooltip
} from 'recharts';

interface DecisionRadarProps {
    data: {
        quality: number;
        consistency: number;
        factAccuracy: number;
        logic: number;
        compliance: number;
        objectivity: number;
    };
}

const AXIS_LABELS: Record<string, string> = {
    quality: 'Quality',
    consistency: 'Consistency',
    factAccuracy: 'Fact Accuracy',
    logic: 'Logic',
    compliance: 'Compliance',
    objectivity: 'Objectivity',
};

export function DecisionRadar({ data }: DecisionRadarProps) {
    const chartData = Object.entries(data).map(([key, value]) => ({
        axis: AXIS_LABELS[key] || key,
        value,
        fullMark: 100,
    }));

    return (
        <div className="card card-glow h-full">
            <div className="card-header">
                <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Decision Health Radar
                </h3>
            </div>
            <div className="card-body" style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
                        <PolarGrid stroke="rgba(255,255,255,0.08)" />
                        <PolarAngleAxis
                            dataKey="axis"
                            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                        />
                        <PolarRadiusAxis
                            angle={30}
                            domain={[0, 100]}
                            tick={{ fill: 'var(--text-muted)', fontSize: 9 }}
                            axisLine={false}
                        />
                        <Radar
                            name="Score"
                            dataKey="value"
                            stroke="var(--accent-primary)"
                            fill="var(--accent-primary)"
                            fillOpacity={0.25}
                            strokeWidth={2}
                        />
                        <Tooltip
                            contentStyle={{
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '0',
                                fontSize: '11px',
                                fontFamily: 'JetBrains Mono, monospace',
                            }}
                            formatter={(value: number | undefined) => [`${value ?? 0}/100`, 'Score']}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
