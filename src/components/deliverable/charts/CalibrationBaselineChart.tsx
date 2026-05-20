/**
 * CalibrationBaselineChart — horizontal Tetlock-band chart positioning
 * our Brier 0.258 against published forecasting benchmarks.
 * Locked 2026-05-20 (visual-deliverable rebuild).
 *
 * Renders a horizontal axis from 0 (perfect calibration) to 0.35+
 * (poor) with four Tetlock-anchored bands:
 *   - Superforecaster ≤ 0.13 (green)
 *   - CIA analyst ~ 0.23 (amber)
 *   - Coin flip 0.25 (gray)
 *   - Poor > 0.35 (red)
 *
 * A circle marker positions the platform Brier (typically 0.258) on
 * the axis. Procurement-grade signal: gives the reader a place on a
 * recognized benchmark, not a number floating in space.
 */

'use client';

interface CalibrationBaselineChartProps {
  meanBrier: number;
  sampleSize: number;
  classificationAccuracy: number;
}

const BANDS = [
  { min: 0, max: 0.13, color: '#16a34a', label: 'Superforecaster' },
  { min: 0.13, max: 0.23, color: '#65a30d', label: 'Expert analyst' },
  { min: 0.23, max: 0.27, color: '#d97706', label: 'CIA analyst / coin flip' },
  { min: 0.27, max: 0.4, color: '#ef4444', label: 'Below baseline' },
];

const AXIS_MAX = 0.4;

export function CalibrationBaselineChart({
  meanBrier,
  sampleSize,
  classificationAccuracy,
}: CalibrationBaselineChartProps) {
  const width = 720;
  const height = 130;
  const PAD = { top: 30, right: 32, bottom: 38, left: 32 };
  const innerW = width - PAD.left - PAD.right;
  const trackY = PAD.top + 18;
  const trackH = 22;

  const xFor = (brier: number) => PAD.left + Math.min(1, brier / AXIS_MAX) * innerW;
  const markerX = xFor(meanBrier);

  return (
    <div
      style={{
        background: 'var(--bg-card, #FFFFFF)',
        border: '1px solid var(--border-color, #E2E8F0)',
        borderRadius: 12,
        padding: '14px 18px 10px',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: 'var(--text-muted, #64748B)',
          marginBottom: 2,
        }}
      >
        Calibration baseline · Tetlock anchored
      </div>
      <div
        style={{
          fontSize: 13,
          color: 'var(--text-secondary, #475569)',
          marginBottom: 6,
        }}
      >
        Our Brier{' '}
        <strong style={{ color: 'var(--text-primary, #0F172A)' }}>{meanBrier.toFixed(3)}</strong>{' '}
        across {sampleSize} historical decisions · {Math.round(classificationAccuracy * 100)}%
        classification accuracy at the C/D grade boundary.
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label={`Calibration baseline chart positioning Brier ${meanBrier} against Tetlock bands`}
      >
        {/* Band segments */}
        {BANDS.map(band => {
          const x = xFor(band.min);
          const w = xFor(band.max) - x;
          return (
            <g key={band.label}>
              <rect x={x} y={trackY} width={w} height={trackH} fill={band.color} opacity={0.18} />
              <text
                x={x + w / 2}
                y={trackY + trackH + 16}
                textAnchor="middle"
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  fill: band.color,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {band.label}
              </text>
              <text
                x={x + w / 2}
                y={trackY - 6}
                textAnchor="middle"
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  fill: 'var(--text-muted, #64748B)',
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '0.04em',
                }}
              >
                ≤ {band.max.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* Track border */}
        <rect
          x={PAD.left}
          y={trackY}
          width={innerW}
          height={trackH}
          fill="none"
          stroke="var(--border-color, #E2E8F0)"
          strokeWidth={1}
        />

        {/* Marker — our score */}
        <line
          x1={markerX}
          y1={trackY - 8}
          x2={markerX}
          y2={trackY + trackH + 8}
          stroke="var(--text-primary, #0F172A)"
          strokeWidth={2}
        />
        <circle cx={markerX} cy={trackY + trackH / 2} r={9} fill="var(--text-primary, #0F172A)" />
        <circle cx={markerX} cy={trackY + trackH / 2} r={4} fill="#FFFFFF" />

        {/* Marker label */}
        <text
          x={markerX}
          y={height - 6}
          textAnchor="middle"
          style={{
            fontSize: 11,
            fontWeight: 800,
            fill: 'var(--text-primary, #0F172A)',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.04em',
          }}
        >
          Decision Intel · {meanBrier.toFixed(3)}
        </text>
      </svg>
    </div>
  );
}
