/**
 * DPR Stat Card — single statistic with label + big value + footnote.
 *
 * Used on Page 2 (Methodological Defensibility) for the noise stats grid:
 * mean-score, std-dev, inter-judge variance, calibration-band. Mono variant
 * is the default (numbers); text variant is for non-numeric values like
 * "CIA-analyst band" or "RobUST CONVERGENCE".
 */

import type { ReactNode } from 'react';

export interface DprStatCardProps {
  /** Uppercase label rendered at the top. */
  label: string;
  /** The statistic itself. Rendered in JetBrains Mono for numbers, Source Serif for text. */
  value: ReactNode;
  /** Optional one-line footnote at the bottom of the card. */
  foot?: ReactNode;
  /** Render value in serif text instead of mono numerals (defaults false = mono). */
  text?: boolean;
}

export function DprStatCard({ label, value, foot, text = false }: DprStatCardProps) {
  return (
    <div className="dpr-stat-card">
      <div className="dpr-stat-card-label">{label}</div>
      <div
        className={
          text
            ? 'dpr-stat-card-value dpr-stat-card-value--text dpr-display'
            : 'dpr-stat-card-value'
        }
      >
        {value}
      </div>
      {foot ? <div className="dpr-stat-card-foot">{foot}</div> : null}
    </div>
  );
}

export interface DprStatGridProps {
  /** 'two' = 2-column; 'four' = 4-column row. */
  layout?: 'two' | 'four';
  children: ReactNode;
}

export function DprStatGrid({ layout = 'two', children }: DprStatGridProps) {
  return (
    <div className={layout === 'four' ? 'dpr-stat-grid dpr-stat-grid--four' : 'dpr-stat-grid'}>
      {children}
    </div>
  );
}
