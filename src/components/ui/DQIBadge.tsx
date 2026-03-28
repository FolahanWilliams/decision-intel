'use client';

import { useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DQIBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showGrade?: boolean;
  animate?: boolean;
}

// ---------------------------------------------------------------------------
// Grade helpers
// ---------------------------------------------------------------------------

type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

const GRADE_THRESHOLDS: Array<{ min: number; grade: Grade }> = [
  { min: 85, grade: 'A' },
  { min: 70, grade: 'B' },
  { min: 55, grade: 'C' },
  { min: 40, grade: 'D' },
  { min: 0, grade: 'F' },
];

const GRADE_COLORS: Record<Grade, string> = {
  A: '#22c55e',
  B: '#3b82f6',
  C: '#eab308',
  D: '#f97316',
  F: '#ef4444',
};

function getGrade(score: number): Grade {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  for (const { min, grade } of GRADE_THRESHOLDS) {
    if (clamped >= min) return grade;
  }
  return 'F';
}

// ---------------------------------------------------------------------------
// Size configuration
// ---------------------------------------------------------------------------

const SIZE_CONFIG = {
  sm: { diameter: 40, scoreFontSize: 14, gradeFontSize: 9, borderWidth: 2 },
  md: { diameter: 64, scoreFontSize: 22, gradeFontSize: 12, borderWidth: 3 },
  lg: { diameter: 96, scoreFontSize: 34, gradeFontSize: 16, borderWidth: 4 },
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DQIBadge({
  score,
  size = 'md',
  showGrade = false,
  animate = false,
}: DQIBadgeProps) {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const grade = getGrade(clampedScore);
  const color = GRADE_COLORS[grade];
  const config = SIZE_CONFIG[size];

  // Animation state
  const [displayedScore, setDisplayedScore] = useState(animate ? 0 : clampedScore);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!animate) {
      setDisplayedScore(clampedScore);
      return;
    }

    const startTime = performance.now();
    const duration = 900; // ms

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayedScore(Math.round(eased * clampedScore));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [clampedScore, animate]);

  // Build inline styles for the outer badge (gradient border via background trick)
  const outerStyle: React.CSSProperties = {
    width: config.diameter,
    height: config.diameter,
    borderRadius: '50%',
    padding: config.borderWidth,
    background: `linear-gradient(135deg, ${color}, ${color}88)`,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  const innerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    background: 'linear-gradient(145deg, #18181b, #27272a)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: showGrade ? 0 : undefined,
  };

  const scoreStyle: React.CSSProperties = {
    fontSize: config.scoreFontSize,
    fontWeight: 700,
    lineHeight: 1.1,
    color,
    fontVariantNumeric: 'tabular-nums',
  };

  const gradeStyle: React.CSSProperties = {
    fontSize: config.gradeFontSize,
    fontWeight: 600,
    lineHeight: 1,
    color: `${color}cc`,
    marginTop: size === 'sm' ? -1 : 1,
  };

  return (
    <div style={outerStyle} role="img" aria-label={`DQI score ${clampedScore}, grade ${grade}`}>
      <div style={innerStyle}>
        <span style={scoreStyle}>{displayedScore}</span>
        {showGrade && <span style={gradeStyle}>{grade}</span>}
      </div>
    </div>
  );
}
