'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface RiskTrendChartProps {
  data: { date: string; score: number }[];
}

export function RiskTrendChart({ data }: RiskTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[200px] w-full flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
        No trend data available
      </div>
    );
  }

  return (
    <div className="h-[220px] w-full" style={{ paddingTop: '16px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.25} />
              <stop offset="50%" stopColor="#fbbf24" stopOpacity={0.08} />
              <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#71717a' }}
            dy={10}
          />
          <YAxis
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#71717a' }}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(0, 0, 0, 0.75)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: '12px',
              backdropFilter: 'blur(24px) saturate(180%)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.08) inset',
              padding: '8px 12px',
            }}
            itemStyle={{ color: '#FFFFFF', fontWeight: 600, fontSize: '13px' }}
            labelStyle={{ color: '#a1a1aa', fontSize: '11px', marginBottom: '4px' }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#fbbf24"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#scoreGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
