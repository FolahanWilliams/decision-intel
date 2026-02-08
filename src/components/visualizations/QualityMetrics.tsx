'use client';

import { useEffect, useRef } from 'react';

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
  sublabel
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
            stroke="rgba(255,255,255,0.1)"
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

export function ScoreCard({ title, score, trend, trendValue, description, severity }: ScoreCardProps) {
  const colors = {
    success: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    warning: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    error: 'text-red-400 border-red-500/30 bg-red-500/10',
    info: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  };

  const colorClass = colors[severity];

  return (
    <div className={`p-4 rounded-lg border ${colorClass}`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium opacity-80">{title}</h4>
        {trend && (
          <span className={`text-xs ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-muted'}`}>
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

interface MetricBarProps {
  label: string;
  value: number;
  maxValue?: number;
  color: string;
  showValue?: boolean;
}

export function MetricBar({ label, value, maxValue = 100, color, showValue = true }: MetricBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted">{label}</span>
        {showValue && <span className="font-medium">{value}</span>}
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

interface QualityRadarProps {
  data: {
    label: string;
    value: number;
    color: string;
  }[];
  size?: number;
}

export function QualityRadar({ data, size = 200 }: QualityRadarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size / 2) - 30;
    const numPoints = data.length;
    const angleStep = (Math.PI * 2) / numPoints;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw background grid
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      const r = (radius / 5) * i;
      for (let j = 0; j <= numPoints; j++) {
        const angle = j * angleStep - Math.PI / 2;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Draw axes
    for (let i = 0; i < numPoints; i++) {
      const angle = i * angleStep - Math.PI / 2;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius
      );
      ctx.stroke();

      // Draw labels
      const labelX = centerX + Math.cos(angle) * (radius + 20);
      const labelY = centerY + Math.sin(angle) * (radius + 20);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(data[i].label, labelX, labelY);
    }

    // Draw data
    ctx.beginPath();
    ctx.fillStyle = 'rgba(99, 102, 241, 0.3)';
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.8)';
    ctx.lineWidth = 2;

    data.forEach((point, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r = (point.value / 100) * radius;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw points
    data.forEach((point, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r = (point.value / 100) * radius;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;

      ctx.beginPath();
      ctx.fillStyle = point.color;
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [data, size]);

  return (
    <canvas 
      ref={canvasRef} 
      width={size} 
      height={size}
      className="mx-auto"
    />
  );
}
