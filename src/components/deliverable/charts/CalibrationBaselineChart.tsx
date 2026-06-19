/**
 * CalibrationBaselineChart — positions our Brier against published Tetlock
 * forecasting benchmarks.
 *
 * Rebuilt 2026-06-19 (responsive). The prior version drew band labels as
 * absolutely-positioned SVG <text> centered on each band with no collision
 * handling — the ~26px-wide "CIA analyst / coin flip" band tried to hold a
 * ~120px label, so labels overlapped and painted off the right edge of the
 * pane. This version uses a pure HTML/flex track (proportional band segments
 * + an absolutely-positioned marker) and a wrap legend BELOW it, so labels
 * can never overlap and the whole thing fits any container width.
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
  const markerPct = Math.min(100, Math.max(0, (meanBrier / AXIS_MAX) * 100));

  return (
    <div
      style={{
        background: 'var(--bg-card, #FFFFFF)',
        border: '1px solid var(--border-color, #E2E8F0)',
        borderRadius: 12,
        padding: '14px 18px 12px',
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: 'var(--text-muted, #64748B)',
          marginBottom: 4,
        }}
      >
        Calibration baseline · Tetlock anchored
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary, #475569)', marginBottom: 14, lineHeight: 1.5 }}>
        Our Brier{' '}
        <strong style={{ color: 'var(--text-primary, #0F172A)' }}>{meanBrier.toFixed(3)}</strong>{' '}
        across {sampleSize} historical decisions · {Math.round(classificationAccuracy * 100)}%
        classification accuracy at the C/D grade boundary.
      </div>

      {/* Track — proportional band segments + a marker for our score. Pure
          flex, so it scales to any width with zero overlap. */}
      <div style={{ position: 'relative', paddingTop: 18, paddingBottom: 6 }}>
        <div
          style={{
            display: 'flex',
            height: 16,
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid var(--border-color, #E2E8F0)',
          }}
        >
          {BANDS.map(band => (
            <div
              key={band.label}
              title={`${band.label} · ≤ ${band.max.toFixed(2)}`}
              style={{
                flexGrow: band.max - band.min,
                flexBasis: 0,
                background: band.color,
                opacity: 0.28,
              }}
            />
          ))}
        </div>

        {/* Marker — vertical line + dot + tabular label, clamped on-screen */}
        <div
          style={{
            position: 'absolute',
            top: 6,
            left: `${markerPct}%`,
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              color: 'var(--text-primary, #0F172A)',
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
              marginBottom: 2,
            }}
          >
            {meanBrier.toFixed(3)}
          </span>
          <span
            style={{
              width: 13,
              height: 13,
              borderRadius: '50%',
              background: 'var(--text-primary, #0F172A)',
              border: '3px solid var(--bg-card, #FFFFFF)',
              boxShadow: '0 1px 3px rgba(15,23,42,0.3)',
            }}
          />
        </div>
      </div>

      {/* Legend — wraps, so band names never collide */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: 8 }}>
        {BANDS.map(band => (
          <div key={band.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: 2,
                background: band.color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 11, color: 'var(--text-secondary, #475569)', fontWeight: 600 }}>
              {band.label}
            </span>
            <span
              style={{
                fontSize: 10.5,
                color: 'var(--text-muted, #64748B)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              ≤ {band.max.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
