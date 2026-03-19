'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
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

const AXIS_CONFIG: Record<string, { label: string; description: string }> = {
  quality: { label: 'Quality', description: 'Overall decision quality and reasoning depth' },
  consistency: { label: 'Consistency', description: 'Internal consistency across arguments' },
  factAccuracy: { label: 'Fact Accuracy', description: 'Accuracy of stated facts and claims' },
  logic: { label: 'Logic', description: 'Logical structure and absence of fallacies' },
  compliance: { label: 'Compliance', description: 'Regulatory and policy alignment' },
  objectivity: { label: 'Objectivity', description: 'Absence of subjective bias' },
};

export function DecisionRadar({ data }: DecisionRadarProps) {
  const chartData = Object.entries(data).map(([key, value]) => ({
    axis: AXIS_CONFIG[key]?.label || key,
    value,
    fullMark: 100,
  }));

  return (
    <div className="card card-glow h-full">
      <div className="card-header">
        <h3>Decision Health Radar</h3>
      </div>
      <div className="card-body" style={{ height: 'clamp(220px, 40vw, 320px)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="rgba(255,255,255,0.06)" />
            <PolarAngleAxis dataKey="axis" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
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
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(0, 0, 0, 0.75)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: '12px',
                fontSize: '12px',
              }}
              formatter={value => [`${value ?? 0}/100`, 'Score']}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      {/* Axis legend */}
      <div className="px-4 pb-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
        {Object.entries(data).map(([key, value]) => {
          const config = AXIS_CONFIG[key];
          if (!config) return null;
          return (
            <div key={key} className="flex items-baseline gap-1.5" title={config.description}>
              <span className="text-[10px] font-mono font-bold text-accent-primary">
                {Math.round(value)}
              </span>
              <span className="text-[10px] text-muted truncate">{config.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
