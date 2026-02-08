'use client';

import { useMemo } from 'react';
import { BarChart2 } from 'lucide-react';

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
    { key: 'quality', label: 'Decision Quality', color: 'bg-emerald-500' },
    { key: 'risk', label: 'Risk Level', color: 'bg-red-500' },
    { key: 'bias', label: 'Bias Count', color: 'bg-orange-500' },
    { key: 'clarity', label: 'Clarity Score', color: 'bg-blue-500' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left p-4 min-w-[200px] text-muted">Metric</th>
            {documents.map(doc => (
              <th key={doc.id} className="text-left p-4 min-w-[150px]">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-foreground">{doc.title}</span>
                  <span className="text-xs text-muted">{doc.date}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {metrics.map(metric => (
            <tr key={metric.key} className="group hover:bg-secondary/20 transition-colors">
              <td className="p-4 font-medium text-muted-foreground group-hover:text-foreground">
                {metric.label}
              </td>
              {documents.map(doc => {
                const value = doc.scores[metric.key as keyof typeof doc.scores];
                const maxVal = Math.max(...documents.map(d => d.scores[metric.key as keyof typeof d.scores]));
                const isHighest = value === maxVal;

                return (
                  <td key={doc.id} className="p-4 align-middle">
                    <div className="flex items-center gap-3">
                      <span className={`font-bold ${isHighest ? 'text-accent-primary' : 'text-muted-foreground'}`}>
                        {value}
                      </span>
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden w-24">
                        <div 
                          className={`h-full rounded-full ${metric.color} opacity-80`}
                          style={{ width: `${(value / 100) * 100}%` }}
                        />
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
  // Simple SVG line chart implementation
  const width = 600;
  const height = 200;
  const padding = 20;

  const points = useMemo(() => {
    if (data.length < 2) return '';
    
    const minDate = Math.min(...data.map(d => new Date(d.date).getTime()));
    const maxDate = Math.max(...data.map(d => new Date(d.date).getTime()));
    const timeRange = maxDate - minDate || 1;

    return data.map((d, i) => {
      const x = padding + ((new Date(d.date).getTime() - minDate) / timeRange) * (width - 2 * padding);
      const y = height - padding - (d.score / 100) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');
  }, [data]);

  return (
    <div className="w-full overflow-hidden bg-secondary/10 rounded-lg border border-border p-4">
      <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
        <BarChart2 size={16} />
        Decision Quality Trend
      </h4>
      <div className="relative aspect-[3/1]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(val => (
            <line
              key={val}
              x1={padding}
              y1={height - padding - (val / 100) * (height - 2 * padding)}
              x2={width - padding}
              y2={height - padding - (val / 100) * (height - 2 * padding)}
              stroke="currentColor"
              strokeOpacity="0.1"
              strokeDasharray="4,4"
            />
          ))}

          {/* Trend line */}
          <polyline
            points={points}
            fill="none"
            stroke="var(--accent-primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.split(' ').map((point, i) => {
            const [x, y] = point.split(',');
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="4"
                fill="var(--bg-primary)"
                stroke="var(--accent-primary)"
                strokeWidth="2"
                className="hover:r-6 transition-all cursor-pointer"
              >
                <title>{data[i].score}% - {data[i].date}</title>
              </circle>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
