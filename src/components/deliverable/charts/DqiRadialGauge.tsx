/**
 * DqiRadialGauge — a real radial-arc gauge for the SCQA cover.
 * Locked 2026-05-20 (visual-deliverable rebuild).
 *
 * Replaces the prior circle-with-a-number with a 270° arc gauge that
 * plots the score along a severity-banded track. Background arc shows
 * the 4 grade bands (F/D/C/B/A); foreground arc fills from 0 to the
 * actual score with the band-color of the current grade.
 *
 * Anchors per the locked 85/70/55/40 DQI thresholds (canonical from
 * `src/lib/scoring/dqi.ts` via `gradeFromScore` + `dqiColorFor`).
 */

'use client';

import { useId } from 'react';
import { gradeFromScore, dqiColorFor } from '@/lib/utils/grade';

interface DqiRadialGaugeProps {
  /** 0-100 score. */
  score: number;
  /** Pixel diameter of the gauge. */
  size?: number;
  /** When true, renders the grade ribbon below the score numeral. */
  showGrade?: boolean;
}

const ARC_START = 135; // degrees — 7:30 position
const ARC_END = 405; // 4:30 position (270° sweep)
const ARC_LENGTH = ARC_END - ARC_START;

const BANDS: Array<{ min: number; max: number; color: string; label: string }> = [
  { min: 0, max: 40, color: 'var(--severity-critical, #b91c1c)', label: 'F' },
  { min: 40, max: 55, color: 'var(--severity-high, #ef4444)', label: 'D' },
  { min: 55, max: 70, color: 'var(--warning, #d97706)', label: 'C' },
  { min: 70, max: 85, color: 'var(--accent-primary, #16A34A)', label: 'B' },
  { min: 85, max: 100, color: 'var(--success, #10b981)', label: 'A' },
];

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export function DqiRadialGauge({ score, size = 180, showGrade = true }: DqiRadialGaugeProps) {
  // Coerce non-finite scores to 0 — Math.max/min propagate NaN, which renders a
  // malformed arc + a literal "NaN" in the gauge text on a bad analysis row.
  const clamped = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 14;
  const strokeWidth = 16;
  const grade = gradeFromScore(clamped);
  const gradeColor = dqiColorFor(clamped);

  // Score arc endpoint angle
  const scoreAngle = ARC_START + (clamped / 100) * ARC_LENGTH;

  const id = useId();
  const trackId = `gauge-track-${id}`;

  // Band tick positions (the 4 boundaries between grades)
  const tickPositions = [40, 55, 70, 85];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`DQI score ${Math.round(clamped)} out of 100, grade ${grade}`}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        <clipPath id={trackId}>
          <rect x={0} y={0} width={size} height={size} />
        </clipPath>
      </defs>

      {/* Background severity bands — render each band as its own arc segment */}
      {BANDS.map(band => {
        const startA = ARC_START + (band.min / 100) * ARC_LENGTH;
        const endA = ARC_START + (band.max / 100) * ARC_LENGTH;
        return (
          <path
            key={band.label}
            d={arcPath(cx, cy, r, startA, endA)}
            fill="none"
            stroke={band.color}
            strokeWidth={strokeWidth}
            strokeOpacity={0.18}
            strokeLinecap="butt"
          />
        );
      })}

      {/* Score arc — filled from 0 to the actual score */}
      {clamped > 0 ? (
        <path
          d={arcPath(cx, cy, r, ARC_START, scoreAngle)}
          fill="none"
          stroke={gradeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      ) : null}

      {/* Band tick marks at grade boundaries */}
      {tickPositions.map(pos => {
        const angle = ARC_START + (pos / 100) * ARC_LENGTH;
        const outer = polarToCartesian(cx, cy, r + strokeWidth / 2 + 2, angle);
        const inner = polarToCartesian(cx, cy, r - strokeWidth / 2 - 2, angle);
        return (
          <line
            key={pos}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke="var(--bg-card, #FFFFFF)"
            strokeWidth={2}
          />
        );
      })}

      {/* Score numeral at center */}
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontSize: size * 0.28,
          fontWeight: 800,
          fill: gradeColor,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.025em',
        }}
      >
        {Math.round(clamped)}
      </text>
      {showGrade ? (
        <text
          x={cx}
          y={cy + size * 0.18}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontSize: size * 0.07,
            fontWeight: 700,
            fill: 'var(--text-muted, #64748B)',
            letterSpacing: '0.12em',
          }}
        >
          DQI · {grade}
        </text>
      ) : null}
    </svg>
  );
}
