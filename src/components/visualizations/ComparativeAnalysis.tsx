'use client';

import { useMemo } from 'react';
import { BarChart2 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DocumentComparisonProps {
  documents: Array<{
    id: string;
    title: string;
    date: string;
    scores: {
      quality: number;
      risk: number;
      bias: number;
      clarity: number;
    };
  }>;
}

export function ComparativeAnalysis({ documents }: DocumentComparisonProps) {
  const metrics = [
    { key: 'quality', label: 'Decision Quality', color: 'bg-success' },
    { key: 'risk', label: 'Risk Level', color: 'bg-error' },
    { key: 'bias', label: 'Bias Count', color: 'bg-accent-primary' },
    { key: 'clarity', label: 'Clarity Score', color: 'bg-info' },
  ];

  return (
    <>
      {/* Desktop: table layout */}
      <div className="overflow-x-auto hidden sm:block">
        <table className="w-full text-sm card overflow-hidden p-0 border-none">
          <thead className="bg-black/40">
            <tr>
              <th className="text-left p-4 min-w-[200px] text-muted font-medium border-b border-white/5">
                Metric
              </th>
              {documents.map(doc => (
                <th key={doc.id} className="text-left p-4 min-w-[150px] border-b border-white/5">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-foreground tracking-tight">
                      {doc.title}
                    </span>
                    <span className="text-xs text-muted font-mono bg-white/5 self-start px-2 py-0.5 rounded-full">
                      {doc.date}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-black/20">
            {metrics.map(metric => (
              <tr
                key={metric.key}
                className="group hover:bg-white/5 transition-colors duration-300"
              >
                <td className="p-4 font-medium text-muted-foreground group-hover:text-foreground">
                  {metric.label}
                </td>
                {documents.map(doc => {
                  const value = doc.scores[metric.key as keyof typeof doc.scores];
                  const maxVal = Math.max(
                    ...documents.map(d => d.scores[metric.key as keyof typeof d.scores])
                  );
                  const isHighest = value === maxVal;

                  return (
                    <td key={doc.id} className="p-4 align-middle">
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-mono text-sm ${isHighest ? 'text-white font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'text-muted-foreground'}`}
                        >
                          {value}
                        </span>
                        <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden w-24 border border-white/5 shadow-inner">
                          <div
                            className={`h-full ${metric.color} opacity-90 rounded-full transition-all duration-1000 ease-out relative`}
                            style={{ width: `${(value / 100) * 100}%` }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30" />
                          </div>
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked card layout */}
      <div className="space-y-4 sm:hidden">
        {documents.map(doc => (
          <div
            key={doc.id}
            className="p-5 card group hover:shadow-glow transition-all duration-300 hover:-translate-y-1"
          >
            <div className="mb-4 flex justify-between items-start">
              <p className="font-semibold text-sm tracking-tight text-white">{doc.title}</p>
              <p className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded-full text-muted border border-white/5">
                {doc.date}
              </p>
            </div>
            <div className="space-y-2">
              {metrics.map(metric => {
                const value = doc.scores[metric.key as keyof typeof doc.scores];
                return (
                  <div key={metric.key} className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-muted-foreground flex-shrink-0">
                      {metric.label}
                    </span>
                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <div className="h-1.5 bg-black/40 rounded-full overflow-hidden w-20 border border-white/5 shadow-inner">
                        <div
                          className={`h-full ${metric.color} rounded-full transition-all duration-1000 ease-out relative`}
                          style={{ width: `${(value / 100) * 100}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30" />
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold w-6 text-right text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
                        {value}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

interface TrendOverlayProps {
  data: Array<{
    date: string;
    score: number;
    documentId: string;
  }>;
}

export function TrendOverlay({ data }: TrendOverlayProps) {
  // Format data for recharts
  const chartData = useMemo(() => {
    return [...data]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(d => ({
        ...d,
        formattedDate: new Date(d.date).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
      }));
  }, [data]);

  if (data.length < 2) {
    return (
      <div className="w-full card p-6 mt-6 flex flex-col items-center justify-center text-center">
        <BarChart2 size={24} className="text-muted/50 mb-2" />
        <p className="text-sm text-muted">Insufficient data for trend analysis.</p>
      </div>
    );
  }

  return (
    <div className="w-full card p-6 mt-6 relative overflow-visible group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-[inherit] transition-opacity duration-500 group-hover:opacity-100 opacity-50" />
      <h4 className="text-sm font-semibold tracking-tight mb-6 flex items-center gap-2 text-white relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
        <BarChart2 size={16} className="text-white drop-shadow-[0_0_4px_currentColor]" />
        Decision Quality Trend
      </h4>
      <div className="w-full h-[220px] relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="formattedDate"
              stroke="rgba(255,255,255,0.3)"
              fontSize={11}
              fontFamily="JetBrains Mono, monospace"
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              domain={[0, 100]}
              stroke="rgba(255,255,255,0.3)"
              fontSize={11}
              fontFamily="JetBrains Mono, monospace"
              tickLine={false}
              axisLine={false}
              dx={-10}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(5, 5, 5, 0.95)',
                borderColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
              itemStyle={{
                color: '#fff',
                fontWeight: 600,
                fontFamily: 'JetBrains Mono, monospace',
              }}
              labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontSize: '12px' }}
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Line
              type="monotone"
              dataKey="score"
              name="Quality Score"
              stroke="#FFFFFF"
              strokeWidth={3}
              dot={{ r: 4, fill: '#000', stroke: '#FFF', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#FFF', stroke: 'rgba(255,255,255,0.3)', strokeWidth: 4 }}
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
