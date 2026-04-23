'use client';

/**
 * CalibrationTrackerChip — richer sibling of the sidebar Brier chip,
 * sized for an analytics page header. Shows the rolling 90-day Brier
 * score with an inline calibration band (superforecaster / analyst /
 * amateur / coin-flip), sample size, and a tiny gradient bar that makes
 * the band legible without a hover.
 *
 * Data source: /api/team/intelligence.brierChip. Renders nothing when
 * the sample is too thin — we don't fabricate a calibration claim.
 */

import { useEffect, useState } from 'react';
import { Target } from 'lucide-react';

type BrierCategory = 'excellent' | 'good' | 'fair' | 'poor';

interface BrierChipData {
  avgBrier: number;
  category: BrierCategory;
  sampleSize: number;
  windowDays: number;
}

const BAND_STYLE: Record<
  BrierCategory,
  { fg: string; bg: string; border: string; label: string; range: string }
> = {
  excellent: {
    fg: 'var(--accent-primary)',
    bg: 'rgba(22,163,74,0.08)',
    border: 'rgba(22,163,74,0.3)',
    label: 'Superforecaster',
    range: '≤ 0.10',
  },
  good: {
    fg: '#2563EB',
    bg: 'rgba(37,99,235,0.08)',
    border: 'rgba(37,99,235,0.3)',
    label: 'Analyst',
    range: '≤ 0.20',
  },
  fair: {
    fg: '#D97706',
    bg: 'rgba(217,119,6,0.08)',
    border: 'rgba(217,119,6,0.3)',
    label: 'Amateur',
    range: '≤ 0.35',
  },
  poor: {
    fg: '#DC2626',
    bg: 'rgba(220,38,38,0.08)',
    border: 'rgba(220,38,38,0.3)',
    label: 'Coin-flip',
    range: '> 0.35',
  },
};

// Band boundaries aligned with src/lib/learning/brier-scoring.ts
// Used to position the indicator on the 0–0.5 gradient bar.
function brierToPct(score: number): number {
  const clamped = Math.max(0, Math.min(0.5, score));
  return (clamped / 0.5) * 100;
}

export function CalibrationTrackerChip() {
  const [data, setData] = useState<BrierChipData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/team/intelligence')
      .then(r => (r.ok ? r.json() : null))
      .then(json => {
        if (!cancelled && json?.brierChip) setData(json.brierChip as BrierChipData);
      })
      .catch(err => console.warn('[CalibrationTrackerChip] intelligence fetch failed:', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !data) return null;

  const band = BAND_STYLE[data.category];
  const indicator = brierToPct(data.avgBrier);

  return (
    <div
      title={`Rolling ${data.windowDays}-day Brier across ${data.sampleSize} outcomes. Lower = better-calibrated predictions.`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        background: band.bg,
        border: `1px solid ${band.border}`,
        borderRadius: 'var(--radius-lg, 12px)',
        minWidth: 240,
      }}
    >
      <Target size={18} strokeWidth={2.25} style={{ color: band.fg }} aria-hidden />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            Calibration · {data.windowDays}d
          </span>
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: band.fg,
              fontFamily: 'var(--font-mono, monospace)',
              letterSpacing: '-0.02em',
            }}
          >
            {data.avgBrier.toFixed(2)}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: band.fg,
            }}
          >
            {band.label}
          </span>
          <span
            style={{
              fontSize: 10.5,
              color: 'var(--text-muted)',
            }}
          >
            n={data.sampleSize}
          </span>
        </div>
        <div
          aria-hidden
          style={{
            position: 'relative',
            width: 220,
            height: 6,
            borderRadius: 'var(--radius-full, 9999px)',
            background:
              'linear-gradient(90deg, rgba(22,163,74,0.7) 0%, rgba(22,163,74,0.55) 20%, rgba(37,99,235,0.55) 20%, rgba(37,99,235,0.45) 40%, rgba(217,119,6,0.55) 40%, rgba(217,119,6,0.45) 70%, rgba(220,38,38,0.55) 70%, rgba(220,38,38,0.45) 100%)',
          }}
        >
          <span
            style={{
              position: 'absolute',
              left: `calc(${indicator}% - 5px)`,
              top: -2,
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#fff',
              border: `2px solid ${band.fg}`,
              boxShadow: '0 1px 2px rgba(15,23,42,0.2)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
