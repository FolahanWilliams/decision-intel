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
              <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.15} />
              <stop offset="50%" stopColor="#A1A1AA" stopOpacity={0.08} />
              <stop offset="95%" stopColor="#71717A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#52525b' }}
            dy={10}
          />
          <YAxis
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#52525b' }}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(14, 14, 14, 0.95)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: '12px',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              padding: '8px 12px',
            }}
            itemStyle={{ color: '#FAFAFA', fontWeight: 600, fontSize: '13px' }}
            labelStyle={{ color: '#a1a1aa', fontSize: '11px', marginBottom: '4px' }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#A1A1AA"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#scoreGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
