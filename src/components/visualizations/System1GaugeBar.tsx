'use client';

import { motion } from 'framer-motion';
import { Brain, Zap } from 'lucide-react';

interface System1GaugeBarProps {
  /** 0 = all System 2 (deliberative), 1 = all System 1 (heuristic). null = no data */
  ratio: number | null;
  showLabels?: boolean;
  height?: number;
}

const ZONE_COLORS = {
  deliberative: '#3b82f6', // blue
  balanced: '#6b7280', // gray
  heuristic: '#f97316', // orange
  extreme: '#ef4444', // red
};

function getZone(ratio: number) {
  if (ratio < 0.4) return 'deliberative';
  if (ratio <= 0.6) return 'balanced';
  if (ratio <= 0.8) return 'heuristic';
  return 'extreme';
}

function getZoneLabel(ratio: number) {
  if (ratio < 0.4) return { text: 'Deliberative process', color: 'text-blue-400', bg: 'bg-blue-500/15' };
  if (ratio <= 0.6) return { text: 'Balanced process', color: 'text-zinc-400', bg: 'bg-zinc-500/15' };
  if (ratio <= 0.8) return { text: 'Heuristic-leaning', color: 'text-orange-400', bg: 'bg-orange-500/15' };
  return { text: 'Heuristic-dominant', color: 'text-red-400', bg: 'bg-red-500/15' };
}

export function System1GaugeBar({
  ratio,
  showLabels = true,
  height = 20,
}: System1GaugeBarProps) {
  if (ratio === null || ratio === undefined) {
    return (
      <div className="flex items-center gap-2 py-2">
        <div
          className="flex-1 rounded-full bg-zinc-800/60"
          style={{ height }}
        />
        <span className="text-xs text-muted whitespace-nowrap">Insufficient data</span>
      </div>
    );
  }

  const clampedRatio = Math.max(0, Math.min(1, ratio));
  const pct = Math.round(clampedRatio * 100);
  const zone = getZone(clampedRatio);
  const zoneLabel = getZoneLabel(clampedRatio);

  const markerColor =
    zone === 'deliberative'
      ? ZONE_COLORS.deliberative
      : zone === 'balanced'
        ? ZONE_COLORS.balanced
        : zone === 'extreme'
          ? ZONE_COLORS.extreme
          : ZONE_COLORS.heuristic;

  return (
    <div className="space-y-1.5">
      {showLabels && (
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-blue-400">
            <Brain size={12} />
            System 2 (Deliberative)
          </span>
          <span className="flex items-center gap-1 text-orange-400">
            System 1 (Heuristic)
            <Zap size={12} />
          </span>
        </div>
      )}

      <div className="relative" style={{ height: height + 8 }}>
        {/* Background gradient bar */}
        <div
          className="absolute inset-x-0 rounded-full overflow-hidden"
          style={{
            height,
            top: 4,
            background: `linear-gradient(to right, ${ZONE_COLORS.deliberative}30, ${ZONE_COLORS.balanced}30, ${ZONE_COLORS.heuristic}30, ${ZONE_COLORS.extreme}30)`,
          }}
        >
          {/* Zone markers at 40% and 60% */}
          <div
            className="absolute top-0 bottom-0 w-px bg-zinc-600/40"
            style={{ left: '40%' }}
          />
          <div
            className="absolute top-0 bottom-0 w-px bg-zinc-600/40"
            style={{ left: '60%' }}
          />
        </div>

        {/* Animated marker */}
        <motion.div
          className="absolute"
          style={{ top: 0 }}
          initial={{ left: '50%' }}
          animate={{ left: `${clampedRatio * 100}%` }}
          transition={{ type: 'spring', stiffness: 80, damping: 15, delay: 0.2 }}
        >
          <div
            className="relative flex flex-col items-center"
            style={{ marginLeft: -10 }}
          >
            {/* Triangle pointer */}
            <div
              className="w-0 h-0"
              style={{
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: `6px solid ${markerColor}`,
              }}
            />
            {/* Circle marker */}
            <div
              className="rounded-full border-2 border-zinc-900"
              style={{
                width: height - 2,
                height: height - 2,
                backgroundColor: markerColor,
                marginTop: -1,
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* Zone badge */}
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${zoneLabel.bg} ${zoneLabel.color}`}
        >
          {zoneLabel.text}
        </span>
        <span className="text-xs text-muted">
          {pct}% heuristic
        </span>
      </div>
    </div>
  );
}
