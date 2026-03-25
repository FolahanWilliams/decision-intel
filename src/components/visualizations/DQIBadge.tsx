'use client';

import { useMemo } from 'react';

interface DQIBadgeProps {
  score: number;
  grade: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showBreakdown?: boolean;
  components?: {
    biasLoad: { score: number; grade: string };
    noiseLevel: { score: number; grade: string };
    evidenceQuality: { score: number; grade: string };
    processMaturity: { score: number; grade: string };
    complianceRisk: { score: number; grade: string };
  };
}

const GRADE_COLORS: Record<string, { bg: string; text: string; ring: string; arc: string }> = {
  A: { bg: 'bg-green-500/10', text: 'text-green-400', ring: 'stroke-green-500', arc: 'stroke-green-400' },
  B: { bg: 'bg-lime-500/10', text: 'text-lime-400', ring: 'stroke-lime-500', arc: 'stroke-lime-400' },
  C: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', ring: 'stroke-yellow-500', arc: 'stroke-yellow-400' },
  D: { bg: 'bg-orange-500/10', text: 'text-orange-400', ring: 'stroke-orange-500', arc: 'stroke-orange-400' },
  F: { bg: 'bg-red-500/10', text: 'text-red-400', ring: 'stroke-red-500', arc: 'stroke-red-400' },
};

const GRADE_LABELS: Record<string, string> = {
  A: 'Excellent',
  B: 'Good',
  C: 'Fair',
  D: 'Poor',
  F: 'Critical',
};

const SIZES = {
  sm: { outer: 80, stroke: 4, fontSize: 20, labelSize: 8, gradeSize: 10 },
  md: { outer: 120, stroke: 6, fontSize: 32, labelSize: 11, gradeSize: 14 },
  lg: { outer: 160, stroke: 8, fontSize: 44, labelSize: 13, gradeSize: 16 },
};

export function DQIBadge({
  score,
  grade,
  size = 'md',
  showLabel = true,
  showBreakdown = false,
  components,
}: DQIBadgeProps) {
  const colors = GRADE_COLORS[grade] ?? GRADE_COLORS.C;
  const dims = SIZES[size];
  const radius = (dims.outer - dims.stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const arcLength = useMemo(() => {
    const pct = Math.max(0, Math.min(100, score)) / 100;
    return circumference * pct;
  }, [score, circumference]);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Circular gauge */}
      <div className="relative" style={{ width: dims.outer, height: dims.outer }}>
        <svg
          width={dims.outer}
          height={dims.outer}
          viewBox={`0 0 ${dims.outer} ${dims.outer}`}
          className="transform -rotate-90"
        >
          {/* Background ring */}
          <circle
            cx={dims.outer / 2}
            cy={dims.outer / 2}
            r={radius}
            fill="none"
            className="stroke-zinc-800"
            strokeWidth={dims.stroke}
          />
          {/* Score arc */}
          <circle
            cx={dims.outer / 2}
            cy={dims.outer / 2}
            r={radius}
            fill="none"
            className={colors.arc}
            strokeWidth={dims.stroke}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dasharray 1s ease-out',
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-bold tabular-nums ${colors.text}`}
            style={{ fontSize: dims.fontSize }}
          >
            {score}
          </span>
          <span
            className={`font-semibold ${colors.text} opacity-80`}
            style={{ fontSize: dims.gradeSize }}
          >
            {grade}
          </span>
        </div>
      </div>

      {/* Label */}
      {showLabel && (
        <div className="text-center">
          <div className={`text-xs font-medium ${colors.text}`}>
            {GRADE_LABELS[grade] ?? 'Unknown'} Decision Quality
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            DQI v1.0
          </div>
        </div>
      )}

      {/* Component breakdown */}
      {showBreakdown && components && (
        <div className="w-full max-w-[200px] space-y-1.5 mt-2">
          {Object.entries(components).map(([key, comp]) => {
            const compColors = GRADE_COLORS[comp.grade] ?? GRADE_COLORS.C;
            const labels: Record<string, string> = {
              biasLoad: 'Bias Load',
              noiseLevel: 'Noise Level',
              evidenceQuality: 'Evidence',
              processMaturity: 'Process',
              complianceRisk: 'Compliance',
            };
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400 w-16 text-right truncate">
                  {labels[key] ?? key}
                </span>
                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${compColors.arc.replace('stroke-', 'bg-')}`}
                    style={{ width: `${comp.score}%` }}
                  />
                </div>
                <span className={`text-[10px] font-mono ${compColors.text} w-6`}>
                  {comp.score}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
