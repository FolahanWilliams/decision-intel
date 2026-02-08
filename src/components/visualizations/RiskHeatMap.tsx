'use client';

import { useMemo } from 'react';

interface RiskHeatMapProps {
  risks: Array<{
    category: string;
    impact: number;
    probability: number;
    description?: string;
  }>;
}

export function RiskHeatMap({ risks }: RiskHeatMapProps) {
  const gridSize = 5;
  const cellSize = 60;

  const heatMapData = useMemo(() => {
    const grid: (typeof risks[0] & { count: number })[][] = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill(null));

    risks.forEach(risk => {
      const impactIndex = Math.min(gridSize - 1, Math.floor((risk.impact / 100) * gridSize));
      const probIndex = Math.min(gridSize - 1, Math.floor((risk.probability / 100) * gridSize));
      
      if (!grid[impactIndex][probIndex]) {
        grid[impactIndex][probIndex] = { ...risk, count: 1 };
      } else {
        grid[impactIndex][probIndex].count++;
      }
    });

    return grid;
  }, [risks]);

  const getCellColor = (impact: number, probability: number) => {
    const riskScore = (impact * probability) / 100;
    if (riskScore >= 70) return 'bg-red-600';
    if (riskScore >= 50) return 'bg-orange-500';
    if (riskScore >= 30) return 'bg-yellow-500';
    if (riskScore >= 15) return 'bg-emerald-500';
    return 'bg-emerald-700';
  };

  const getOpacity = (count: number) => {
    return Math.min(1, 0.3 + count * 0.2);
  };

  return (
    <div className="p-4">
      <div className="flex items-end gap-8">
        {/* Y-axis label */}
        <div className="flex flex-col items-center">
          <span className="text-xs text-muted mb-2" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
            Impact
          </span>
        </div>

        <div>
          {/* Grid */}
          <div 
            className="grid gap-1"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${gridSize}, ${cellSize}px)`,
            }}
          >
            {Array.from({ length: gridSize * gridSize }).map((_, idx) => {
              const row = Math.floor(idx / gridSize);
              const col = idx % gridSize;
              const cell = heatMapData[row][col];
              const impact = ((gridSize - row) / gridSize) * 100;
              const probability = ((col + 1) / gridSize) * 100;

              return (
                <div
                  key={idx}
                  className={`
                    relative rounded-md flex items-center justify-center
                    transition-all duration-300 hover:scale-105
                    ${cell ? getCellColor(impact, probability) : 'bg-secondary'}
                  `}
                  style={{
                    opacity: cell ? getOpacity(cell.count) : 0.3,
                  }}
                  title={cell ? `${cell.category}: Impact ${Math.round(impact)}%, Probability ${Math.round(probability)}%` : 'No risks'}
                >
                  {cell && (
                    <span className="text-white font-bold text-sm">
                      {cell.count > 1 ? cell.count : ''}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* X-axis label */}
          <div className="text-center mt-2">
            <span className="text-xs text-muted">Probability</span>
          </div>

          {/* Axis values */}
          <div className="flex justify-between mt-1 px-0">
            {[0, 25, 50, 75, 100].map((val, idx) => (
              <span key={idx} className="text-[10px] text-muted">
                {val}%
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-700" />
          <span className="text-xs text-muted">Low</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-500" />
          <span className="text-xs text-muted">Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-500" />
          <span className="text-xs text-muted">High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-600" />
          <span className="text-xs text-muted">Critical</span>
        </div>
      </div>

      {/* Risk list */}
      {risks.length > 0 && (
        <div className="mt-6 space-y-2">
          <h5 className="text-sm font-medium mb-2">Identified Risks</h5>
          {risks.slice(0, 5).map((risk, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 rounded bg-secondary/50 text-sm">
              <span className="truncate flex-1">{risk.category}</span>
              <span className="text-xs text-muted ml-2">
                I:{Math.round(risk.impact)}% P:{Math.round(risk.probability)}%
              </span>
            </div>
          ))}
          {risks.length > 5 && (
            <p className="text-xs text-muted text-center">
              +{risks.length - 5} more risks
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface RiskTimelineProps {
  risks: Array<{
    id: string;
    title: string;
    probability: number;
    timeline: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
}

export function RiskTimeline({ risks }: RiskTimelineProps) {
  const timelineOrder = ['immediate', 'short-term', 'medium-term', 'long-term'];
  const timelineLabels = {
    immediate: '0-30 days',
    'short-term': '1-3 months',
    'medium-term': '3-12 months',
    'long-term': '1+ years',
  };

  const groupedRisks = useMemo(() => {
    const groups: Record<string, typeof risks> = {
      immediate: [],
      'short-term': [],
      'medium-term': [],
      'long-term': [],
    };

    risks.forEach(risk => {
      if (groups[risk.timeline]) {
        groups[risk.timeline].push(risk);
      }
    });

    return groups;
  }, [risks]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-emerald-500';
    }
  };

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-6">
        {timelineOrder.map((period) => {
          const periodRisks = groupedRisks[period];
          if (periodRisks.length === 0) return null;

          return (
            <div key={period} className="relative pl-10">
              {/* Timeline dot */}
              <div className="absolute left-2 top-2 w-4 h-4 rounded-full bg-accent-primary border-4 border-bg-primary" />

              {/* Period label */}
              <div className="mb-2">
                <span className="text-sm font-medium capitalize">{period.replace('-', ' ')}</span>
                <span className="text-xs text-muted ml-2">{timelineLabels[period as keyof typeof timelineLabels]}</span>
              </div>

              {/* Risks in this period */}
              <div className="space-y-2">
                {periodRisks.map((risk, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-secondary/50 border border-border flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-8 rounded-full ${getSeverityColor(risk.severity)}`} />
                      <div>
                        <p className="text-sm font-medium">{risk.title}</p>
                        <p className="text-xs text-muted">{Math.round(risk.probability)}% probability</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(risk.severity)} text-white`}>
                      {risk.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface RiskSummaryProps {
  totalRisks: number;
  criticalRisks: number;
  highRisks: number;
  mitigatedRisks: number;
}

export function RiskSummary({ totalRisks, criticalRisks, highRisks, mitigatedRisks }: RiskSummaryProps) {
  const stats = [
    { label: 'Total Risks', value: totalRisks, color: 'text-blue-400' },
    { label: 'Critical', value: criticalRisks, color: 'text-red-400' },
    { label: 'High', value: highRisks, color: 'text-orange-400' },
    { label: 'Mitigated', value: mitigatedRisks, color: 'text-emerald-400' },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <div key={idx} className="text-center p-3 rounded-lg bg-secondary/30">
          <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          <p className="text-xs text-muted">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
