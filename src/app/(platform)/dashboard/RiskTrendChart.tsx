'use client';

import {
    Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';

interface RiskTrendChartProps {
    data: { date: string; score: number }[];
}

export function RiskTrendChart({ data }: RiskTrendChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="h-[200px] w-full flex items-center justify-center text-slate-400 text-sm">
                No trend data available
            </div>
        );
    }

    return (
        <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="scoreVars" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#a3a3a3' }}
                        dy={10}
                    />
                    <YAxis
                        domain={[0, 100]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#a3a3a3' }}
                    />
                    <Tooltip
                        contentStyle={{
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            backgroundColor: 'rgba(20,20,20,0.8)',
                            backdropFilter: 'blur(8px)',
                            color: '#e5e5e5'
                        }}
                        itemStyle={{ color: '#f59e0b', fontWeight: 600 }}
                        labelStyle={{ color: '#a3a3a3', marginBottom: '4px' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#scoreVars)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
