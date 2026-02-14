'use client';

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';

interface FactVerificationBarProps {
    data: {
        verified: number;
        contradicted: number;
        unverifiable: number;
    };
}

const COLORS = {
    verified: '#22c55e',
    contradicted: '#ef4444',
    unverifiable: '#6b7280',
};

export function FactVerificationBar({ data }: FactVerificationBarProps) {
    const total = data.verified + data.contradicted + data.unverifiable;

    if (total === 0) {
        return (
            <div className="card h-full">
                <div className="card-header">
                    <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Fact Verification
                    </h3>
                </div>
                <div className="card-body flex items-center justify-center" style={{ height: 200 }}>
                    <p className="text-muted text-sm">No fact-check data available</p>
                </div>
            </div>
        );
    }

    const chartData = [
        { name: 'Verified', value: data.verified, color: COLORS.verified },
        { name: 'Contradicted', value: data.contradicted, color: COLORS.contradicted },
        { name: 'Unverifiable', value: data.unverifiable, color: COLORS.unverifiable },
    ];

    return (
        <div className="card h-full">
            <div className="card-header flex items-center justify-between">
                <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Fact Verification
                </h3>
                <span className="text-xs text-muted">{total} claims</span>
            </div>
            <div className="card-body">
                {/* Visual bar */}
                <div style={{ height: 120, marginBottom: '16px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" barSize={28}>
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={90}
                                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                }}
                                formatter={(value: number | undefined) => [`${value ?? 0} (${Math.round(((value ?? 0) / total) * 100)}%)`, 'Claims']}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                {chartData.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} fillOpacity={0.8} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Legend percentages */}
                <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                    {chartData.map(d => (
                        <div key={d.name} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: d.color }}>
                                {Math.round((d.value / total) * 100)}%
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                {d.name}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
