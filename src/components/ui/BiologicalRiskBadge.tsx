'use client';

import { useState } from 'react';
import { Trophy, HeartPulse } from 'lucide-react';

interface ScoreAdjustment {
  source: string;
  delta: number;
  description: string;
}

interface BiologicalRiskBadgeProps {
  adjustments: ScoreAdjustment[];
  size?: 'sm' | 'md';
}

interface BadgeConfig {
  label: string;
  icon: typeof Trophy;
  bgClass: string;
  textClass: string;
  pulseClass: string;
  borderClass: string;
}

const BADGE_CONFIG: Record<string, BadgeConfig> = {
  winner_effect: {
    label: 'Winner Effect',
    icon: Trophy,
    bgClass: 'bg-amber-500/15',
    textClass: 'text-amber-400',
    pulseClass: 'bg-amber-400',
    borderClass: 'border-amber-500/30',
  },
  stress_cortisol: {
    label: 'Stress Response',
    icon: HeartPulse,
    bgClass: 'bg-red-500/15',
    textClass: 'text-red-400',
    pulseClass: 'bg-red-400',
    borderClass: 'border-red-500/30',
  },
};

export function BiologicalRiskBadge({ adjustments, size = 'md' }: BiologicalRiskBadgeProps) {
  const biologicalSignals = adjustments.filter(
    a => a.source === 'winner_effect' || a.source === 'stress_cortisol'
  );

  if (biologicalSignals.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {biologicalSignals.map(signal => {
        const config = BADGE_CONFIG[signal.source];
        if (!config) return null;
        return (
          <SingleBadge
            key={signal.source}
            config={config}
            signal={signal}
            size={size}
          />
        );
      })}
    </div>
  );
}

function SingleBadge({
  config,
  signal,
  size,
}: {
  config: BadgeConfig;
  signal: ScoreAdjustment;
  size: 'sm' | 'md';
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const Icon = config.icon;
  const amplification = Math.round(signal.delta * 100);

  const sizeClasses = size === 'sm'
    ? 'text-[10px] px-1.5 py-0.5 gap-1'
    : 'text-xs px-2 py-1 gap-1.5';

  const iconSize = size === 'sm' ? 10 : 13;
  const pulseSize = size === 'sm' ? 5 : 6;

  return (
    <div className="relative">
      <button
        type="button"
        className={`inline-flex items-center rounded-full border font-medium ${config.bgClass} ${config.textClass} ${config.borderClass} ${sizeClasses} cursor-default transition-opacity hover:opacity-90`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
      >
        {/* Pulsing dot */}
        <span className="relative flex" style={{ width: pulseSize, height: pulseSize }}>
          <span
            className={`animate-ping absolute inset-0 rounded-full ${config.pulseClass} opacity-50`}
          />
          <span
            className={`relative inline-flex rounded-full ${config.pulseClass}`}
            style={{ width: pulseSize, height: pulseSize }}
          />
        </span>
        <Icon size={iconSize} />
        <span>{config.label}</span>
        {size === 'md' && (
          <span className="opacity-70">+{amplification}%</span>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 rounded-lg bg-zinc-900 border border-zinc-700 shadow-xl text-xs text-zinc-300 leading-relaxed">
          <div className={`font-semibold mb-1 ${config.textClass}`}>
            {config.label} Detected (+{amplification}% amplification)
          </div>
          <p>{signal.description}</p>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-zinc-700" />
        </div>
      )}
    </div>
  );
}
