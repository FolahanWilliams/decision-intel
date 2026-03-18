'use client';

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';

interface FactVerificationBarProps {
  data: {
    verified: number;
    contradicted: number;
    unverifiable: number;
  };
  compact?: boolean;
}

const COLORS = {
  verified: 'var(--success)',
  contradicted: 'var(--error)',
  unverifiable: 'var(--text-muted)',
};

export function FactVerificationBar({ data, compact }: FactVerificationBarProps) {
  const total = data.verified + data.contradicted + data.unverifiable;

  if (total === 0) {
    return (
      <div className="card card-glow h-full">
        <div className="card-header">
          <h3>Fact Verification</h3>
        </div>
        <div
          className="card-body flex items-center justify-center"
          style={{ height: compact ? 80 : 200 }}
        >
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
        <h3>Fact Verification</h3>
        <span className="text-xs text-muted">{total} claims</span>
      </div>
      <div className="card-body">
        <div style={{ height: compact ? 60 : 120, marginBottom: compact ? '8px' : '16px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" barSize={compact ? 14 : 28}>
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                width={90}
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--glass-border)',
                  fontSize: '12px',
                }}
                formatter={value => [
                  `${value ?? 0} (${Math.round(((Number(value) || 0) / total) * 100)}%)`,
                  'Claims',
                ]}
              />
              <Bar dataKey="value" radius={[0, 0, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex justify-around">
          {chartData.map(d => (
            <div key={d.name} className="text-center">
              <div
                className={`font-bold font-mono ${compact ? 'text-sm' : 'text-xl'}`}
                style={{ color: d.color }}
              >
                {Math.round((d.value / total) * 100)}%
              </div>
              <div className={`text-muted ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
                {d.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
