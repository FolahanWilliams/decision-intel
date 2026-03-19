'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

interface RiskDistribution {
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
}

interface ScoreTrend {
  date: string;
  score: number;
}

interface BiasCategory {
  name: string;
  count: number;
}

interface DashboardChartsProps {
  riskDistribution: RiskDistribution;
  scoreTrend: ScoreTrend[];
  topBiases: BiasCategory[];
  totalAnalyzed: number;
  avgScore: number;
}

const DONUT_COLORS = ['#ef4444', '#FBBF24', '#22c55e'];

const tooltipStyle = {
  background: 'rgba(14, 14, 14, 0.95)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '12px',
  backdropFilter: 'blur(20px)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  padding: '8px 12px',
  fontSize: '12px',
};

export function DashboardCharts({
  riskDistribution,
  scoreTrend,
  topBiases,
  totalAnalyzed,
  avgScore,
}: DashboardChartsProps) {
  const donutData = [
    { name: 'High Risk', value: riskDistribution.highRisk, color: '#ef4444' },
    { name: 'Medium Risk', value: riskDistribution.mediumRisk, color: '#FBBF24' },
    { name: 'Low Risk', value: riskDistribution.lowRisk, color: '#22c55e' },
  ].filter(d => d.value > 0);

  const hasDonutData = donutData.length > 0;
  const hasTrendData = scoreTrend.length >= 2;
  const hasBiasData = topBiases.length > 0;

  if (!hasDonutData && !hasTrendData && !hasBiasData) return null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'var(--spacing-md)',
        marginBottom: 'var(--spacing-xl)',
      }}
    >
      {/* Risk Distribution Donut */}
      {hasDonutData && (
        <div className="card" style={{ padding: 0 }}>
          <div className="card-header">
            <h3 style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Risk Distribution</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {totalAnalyzed} analyzed
            </span>
          </div>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: 140, height: 140, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={62}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={index} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    itemStyle={{ color: '#FAFAFA', fontWeight: 600 }}
                  />
                  {/* Center label */}
                  <text
                    x="50%"
                    y="46%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fontSize: '22px',
                      fontWeight: 800,
                      fill:
                        avgScore >= 70
                          ? '#22c55e'
                          : avgScore >= 40
                            ? '#FBBF24'
                            : '#ef4444',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {avgScore}
                  </text>
                  <text
                    x="50%"
                    y="60%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fontSize: '9px',
                      fontWeight: 500,
                      fill: '#52525b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    AVG SCORE
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {donutData.map((item) => (
                <div
                  key={item.name}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: item.color,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {item.name}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: item.color,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Score Trend Area Chart */}
      {hasTrendData && (
        <div className="card" style={{ padding: 0 }}>
          <div className="card-header">
            <h3 style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Quality Trend</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Last {scoreTrend.length} analyses
            </span>
          </div>
          <div className="card-body" style={{ paddingTop: '8px' }}>
            <div style={{ height: 130 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scoreTrend} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#52525b' }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#52525b' }}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    itemStyle={{ color: '#FAFAFA', fontWeight: 600, fontSize: '13px' }}
                    labelStyle={{ color: '#a1a1aa', fontSize: '11px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#dashTrendGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Top Biases Bar Chart */}
      {hasBiasData && (
        <div className="card" style={{ padding: 0 }}>
          <div className="card-header">
            <h3 style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Top Biases Detected</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Across all documents
            </span>
          </div>
          <div className="card-body" style={{ paddingTop: '8px' }}>
            <div style={{ height: 130 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topBiases.slice(0, 5)}
                  layout="vertical"
                  margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="biasBarGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#d4d4d8" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#52525b' }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#a1a1aa' }}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    itemStyle={{ color: '#FAFAFA', fontWeight: 600, fontSize: '13px' }}
                    labelStyle={{ color: '#a1a1aa', fontSize: '11px' }}
                  />
                  <Bar
                    dataKey="count"
                    fill="url(#biasBarGrad)"
                    radius={[0, 4, 4, 0]}
                    barSize={14}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
