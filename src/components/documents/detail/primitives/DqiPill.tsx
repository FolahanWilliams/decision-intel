/**
 * DqiPill — the grade + score badge used in the sticky header.
 *
 * Visual: rounded pill with grade letter (A-F) on the left, numeric score
 * on the right, severity-tinted by grade band. Mirrors the DPR cover
 * grade strap.
 */

import { gradeFromScore } from '@/lib/utils/grade';

const GRADE_TOKEN: Record<string, string> = {
  A: 'var(--severity-low)',
  B: 'var(--info)',
  C: 'var(--severity-medium)',
  D: 'var(--severity-high)',
  F: 'var(--severity-critical)',
};

export interface DqiPillProps {
  score: number | null;
  size?: 'sm' | 'md' | 'lg';
}

export function DqiPill({ score, size = 'md' }: DqiPillProps) {
  if (score == null) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 10px',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
          borderRadius: 999,
        }}
      >
        DQI · pending
      </span>
    );
  }

  const grade = gradeFromScore(score);
  const color = GRADE_TOKEN[grade] ?? 'var(--text-muted)';

  const dims = {
    sm: { padX: 8, padY: 3, gradeFs: 11, scoreFs: 10, gap: 6 },
    md: { padX: 10, padY: 4, gradeFs: 13, scoreFs: 11, gap: 8 },
    lg: { padX: 14, padY: 6, gradeFs: 16, scoreFs: 13, gap: 10 },
  }[size];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: dims.gap,
        padding: `${dims.padY}px ${dims.padX}px`,
        background: `color-mix(in srgb, ${color} 8%, var(--bg-card))`,
        border: `1px solid ${color}`,
        borderRadius: 999,
        fontFamily: 'inherit',
      }}
    >
      <span
        style={{
          fontSize: dims.gradeFs,
          fontWeight: 800,
          letterSpacing: '0.04em',
          color,
          fontFamily: '"Source Serif 4", "Source Serif Pro", Georgia, serif',
        }}
      >
        {grade}
      </span>
      <span
        style={{
          fontSize: dims.scoreFs,
          fontWeight: 600,
          color: 'var(--text-secondary)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {Math.round(score)}/100
      </span>
    </span>
  );
}
