'use client';

import { SwotAnalysisResult } from '@/types';
import { TrendingUp, TrendingDown, AlertCircle, Target } from 'lucide-react';

export function SwotMatrix({ data }: { data: SwotAnalysisResult }) {
  if (!data) return null;

  const sections = [
    {
      title: 'Strengths',
      items: data.strengths,
      icon: TrendingUp,
      color: 'var(--success)',
      bg: 'rgba(34, 197, 94, 0.10)',
    },
    {
      title: 'Weaknesses',
      items: data.weaknesses,
      icon: TrendingDown,
      color: 'var(--error)',
      bg: 'rgba(244, 63, 94, 0.10)',
    },
    {
      title: 'Opportunities',
      items: data.opportunities,
      icon: Target,
      color: 'var(--info)',
      bg: 'rgba(59, 130, 246, 0.10)',
    },
    {
      title: 'Threats',
      items: data.threats,
      icon: AlertCircle,
      color: 'var(--warning)',
      bg: 'rgba(245, 158, 11, 0.10)',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sections.map(s => (
        <div
          key={s.title}
          className="p-4"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className="p-2"
              style={{ background: s.bg, borderRadius: 'var(--radius-sm)' }}
            >
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <h4
              className="font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              {s.title}
            </h4>
          </div>
          <ul className="space-y-2">
            {s.items.map((item, i) => (
              <li
                key={i}
                className="text-sm flex gap-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span
                  className="mt-1.5 w-1.5 h-1.5 shrink-0"
                  style={{ background: s.color, opacity: 0.55, borderRadius: '50%' }}
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div
        className="md:col-span-2 mt-4 p-4"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderLeft: '3px solid var(--warning)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <h4
          className="font-semibold mb-2 flex items-center gap-2"
          style={{ color: 'var(--warning)' }}
        >
          <Target className="w-4 h-4" /> Strategic Advice
        </h4>
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--text-primary)' }}
        >
          {data.strategicAdvice}
        </p>
      </div>
    </div>
  );
}
