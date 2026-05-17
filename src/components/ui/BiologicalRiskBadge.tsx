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
  /** Single CSS-var seed colour; tints derived via color-mix (light-theme safe). */
  color: string;
}

const BADGE_CONFIG: Record<string, BadgeConfig> = {
  winner_effect: {
    label: 'Winner Effect',
    icon: Trophy,
    color: 'var(--warning)',
  },
  stress_cortisol: {
    label: 'Stress Response',
    icon: HeartPulse,
    color: 'var(--error)',
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
        return <SingleBadge key={signal.source} config={config} signal={signal} size={size} />;
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

  const sizeClasses =
    size === 'sm' ? 'text-[10px] px-1.5 py-0.5 gap-1' : 'text-xs px-2 py-1 gap-1.5';

  const iconSize = size === 'sm' ? 10 : 13;
  const pulseSize = size === 'sm' ? 5 : 6;

  return (
    <div className="relative">
      <button
        type="button"
        className={`inline-flex items-center rounded-full border font-medium ${sizeClasses} cursor-default transition-opacity hover:opacity-90`}
        style={{
          background: `color-mix(in srgb, ${config.color} 15%, transparent)`,
          color: config.color,
          borderColor: `color-mix(in srgb, ${config.color} 30%, transparent)`,
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
      >
        {/* Pulsing dot */}
        <span className="relative flex" style={{ width: pulseSize, height: pulseSize }}>
          <span
            className="animate-ping absolute inset-0 rounded-full opacity-50"
            style={{ background: config.color }}
          />
          <span
            className="relative inline-flex rounded-full"
            style={{ width: pulseSize, height: pulseSize, background: config.color }}
          />
        </span>
        <Icon size={iconSize} />
        <span>{config.label}</span>
        {size === 'md' && <span className="opacity-70">+{amplification}%</span>}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 rounded-lg shadow-md text-xs leading-relaxed"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
          }}
        >
          <div className="font-semibold mb-1" style={{ color: config.color }}>
            {config.label} Detected (+{amplification}% amplification)
          </div>
          <p>{signal.description}</p>
          {/* Arrow */}
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px]"
            style={{ borderTopColor: 'var(--border-color)' }}
          />
        </div>
      )}
    </div>
  );
}
