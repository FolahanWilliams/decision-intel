'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface BiasFrequencyData {
  displayName: string;
  total: number;
  timeline: Array<{ date: string; count: number }>;
}

interface BiasSparklineProps {
  biasType: string;
  frequency: BiasFrequencyData | null;
  /** Width of the sparkline SVG in px */
  width?: number;
  /** Height of the sparkline SVG in px */
  height?: number;
}

/**
 * Renders an inline sparkline showing how often a bias type appears
 * across the user's document history.
 */
export function BiasSparkline({
  biasType,
  frequency,
  width = 80,
  height = 24,
}: BiasSparklineProps) {
  const { path, trend, total, points } = useMemo(() => {
    if (!frequency || frequency.timeline.length === 0) {
      return { path: '', trend: 0, total: 0, points: 0 };
    }

    const timeline = frequency.timeline;
    const counts = timeline.map(t => t.count);
    const maxCount = Math.max(...counts, 1);
    const n = counts.length;

    // Build SVG path
    const padding = 2;
    const usableWidth = width - padding * 2;
    const usableHeight = height - padding * 2;

    const coords = counts.map((c, i) => ({
      x: padding + (n > 1 ? (i / (n - 1)) * usableWidth : usableWidth / 2),
      y: padding + usableHeight - (c / maxCount) * usableHeight,
    }));

    let pathD = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      pathD += ` L ${coords[i].x} ${coords[i].y}`;
    }

    // Trend: compare last 3rd vs first 3rd
    let trendVal = 0;
    if (n >= 3) {
      const third = Math.ceil(n / 3);
      const firstAvg = counts.slice(0, third).reduce((a, b) => a + b, 0) / third;
      const lastAvg =
        counts.slice(n - third).reduce((a, b) => a + b, 0) / third;
      trendVal = lastAvg - firstAvg;
    }

    return {
      path: pathD,
      trend: trendVal,
      total: frequency.total,
      points: n,
    };
  }, [frequency, width, height]);

  if (!frequency || points === 0) {
    return (
      <span className="text-[10px] text-muted italic">No history</span>
    );
  }

  const TrendIcon =
    trend > 0.5 ? TrendingUp : trend < -0.5 ? TrendingDown : Minus;
  const trendColor =
    trend > 0.5 ? 'text-red-400' : trend < -0.5 ? 'text-green-400' : 'text-muted';

  return (
    <span
      className="inline-flex items-center gap-1.5"
      title={`${total} occurrence${total !== 1 ? 's' : ''} across ${points} analysis date${points !== 1 ? 's' : ''}`}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="inline-block"
        aria-label={`Sparkline for ${biasType}: ${total} total occurrences`}
        role="img"
      >
        {/* Area fill */}
        <path
          d={`${path} L ${width - 2} ${height - 2} L 2 ${height - 2} Z`}
          fill="currentColor"
          className="text-accent-primary/10"
        />
        {/* Line */}
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-accent-primary"
        />
      </svg>
      <span className="text-[10px] text-muted tabular-nums">{total}x</span>
      <TrendIcon size={10} className={trendColor} />
    </span>
  );
}

/**
 * Hook-like component that fetches and displays sparklines for a list of biases.
 * Frequencies is the full map from the API; this extracts the relevant one.
 */
interface BiasSparklineWithDataProps {
  biasType: string;
  severity: string;
  frequencies: Record<string, BiasFrequencyData> | null;
  width?: number;
  height?: number;
}

export function BiasSparklineWithData({
  biasType,
  frequencies,
  width,
  height,
}: BiasSparklineWithDataProps) {
  // Normalize bias type to match API keys
  const normalizedKey = biasType
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');

  const frequency = frequencies?.[normalizedKey] ?? null;

  return (
    <BiasSparkline
      biasType={biasType}
      frequency={frequency}
      width={width}
      height={height}
    />
  );
}
