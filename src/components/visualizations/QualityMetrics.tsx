'use client';

interface GaugeProps {
  value: number;
  maxValue?: number;
  size?: number;
  strokeWidth?: number;
  label: string;
  color: string;
  sublabel?: string;
}

export function QualityGauge({
  value,
  maxValue = 100,
  size = 120,
  strokeWidth = 10,
  label,
  color,
  sublabel,
}: GaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / maxValue) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--liquid-border)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>
            {Math.round(value)}
          </span>
          <span className="text-xs text-muted">/ {maxValue}</span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <p className="text-sm font-medium">{label}</p>
        {sublabel && <p className="text-xs text-muted">{sublabel}</p>}
      </div>
    </div>
  );
}

interface ScoreCardProps {
  title: string;
  score: number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  description: string;
  severity: 'success' | 'warning' | 'error' | 'info';
}

export function ScoreCard({
  title,
  score,
  trend,
  trendValue,
  description,
  severity,
}: ScoreCardProps) {
  const colors = {
    success: 'text-success border-success/30 bg-success/10',
    warning: 'text-warning border-warning/30 bg-warning/10',
    error: 'text-error border-error/30 bg-error/10',
    info: 'text-info border-info/30 bg-info/10',
  };

  const colorClass = colors[severity];

  return (
    <div className={`p-4  border ${colorClass}`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium opacity-80">{title}</h4>
        {trend && (
          <span
            className={`text-xs ${trend === 'up' ? 'text-success' : trend === 'down' ? 'text-error' : 'text-muted'}`}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-3xl font-bold">{Math.round(score)}</span>
        <span className="text-sm opacity-60">/ 100</span>
      </div>
      <p className="text-xs opacity-70 leading-relaxed">{description}</p>
    </div>
  );
}
