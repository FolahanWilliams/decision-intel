'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface AnimatedNoiseGaugeProps {
  /** Noise score 0-100 (higher = more noise) */
  noiseScore: number;
  /** Consistency score (100 - noiseScore) */
  consistencyScore: number;
  size?: number;
}

/**
 * Animated semi-circle gauge that sweeps to the score on mount.
 * Uses a spring-like easing curve for a "settling" effect.
 */
export function AnimatedNoiseGauge({
  noiseScore,
  consistencyScore,
  size = 200,
}: AnimatedNoiseGaugeProps) {
  const [animatedNoise, setAnimatedNoise] = useState(0);
  const [animatedConsistency, setAnimatedConsistency] = useState(0);
  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const easeOutBack = useCallback((t: number): number => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }, []);

  useEffect(() => {
    const duration = 1400; // ms

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      // Use rAF to avoid synchronous setState within effect body
      const id = requestAnimationFrame(() => {
        setAnimatedNoise(noiseScore);
        setAnimatedConsistency(consistencyScore);
      });
      return () => cancelAnimationFrame(id);
    }

    startTimeRef.current = 0;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutBack(progress);

      setAnimatedNoise(Math.max(0, Math.min(100, noiseScore * eased)));
      setAnimatedConsistency(Math.max(0, Math.min(100, consistencyScore * eased)));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [noiseScore, consistencyScore, easeOutBack]);

  const halfSize = size / 2;
  const strokeWidth = 14;
  const radius = halfSize - strokeWidth - 4;
  // Semi-circle: 180 degrees (PI radians)
  const circumference = Math.PI * radius;

  const noiseOffset = circumference - (animatedNoise / 100) * circumference;
  const consistencyOffset = circumference - (animatedConsistency / 100) * circumference;

  const noiseColor =
    noiseScore > 70 ? 'var(--error)' : noiseScore > 40 ? 'var(--warning)' : 'var(--success)';
  const consistencyColor =
    consistencyScore > 70
      ? 'var(--success)'
      : consistencyScore > 40
        ? 'var(--warning)'
        : 'var(--error)';

  // Needle angle for the noise gauge (0° = left, 180° = right)
  const needleAngle = (animatedNoise / 100) * 180;
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleLength = radius - 10;
  const needleX = halfSize - Math.cos(needleRad) * needleLength;
  const needleY = halfSize - Math.sin(needleRad) * needleLength;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
      {/* Noise Gauge */}
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: size, height: halfSize + 20 }}>
          <svg
            width={size}
            height={halfSize + 20}
            viewBox={`0 0 ${size} ${halfSize + 20}`}
            role="img"
            aria-label={`Noise level gauge: ${Math.round(noiseScore)} out of 100`}
          >
            {/* Background arc */}
            <path
              d={`M ${strokeWidth + 4} ${halfSize} A ${radius} ${radius} 0 0 1 ${size - strokeWidth - 4} ${halfSize}`}
              fill="none"
              stroke="var(--liquid-border)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            {/* Noise arc */}
            <circle
              cx={halfSize}
              cy={halfSize}
              r={radius}
              fill="none"
              stroke={noiseColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={noiseOffset}
              strokeLinecap="round"
              transform={`rotate(180 ${halfSize} ${halfSize})`}
              style={{ filter: `drop-shadow(0 0 6px ${noiseColor}40)` }}
            />
            {/* Needle */}
            <line
              x1={halfSize}
              y1={halfSize}
              x2={needleX}
              y2={needleY}
              stroke="var(--text-primary)"
              strokeWidth={2}
              strokeLinecap="round"
            />
            {/* Center dot */}
            <circle cx={halfSize} cy={halfSize} r={4} fill="var(--text-primary)" />
            {/* Scale labels */}
            <text
              x={strokeWidth + 4}
              y={halfSize + 16}
              fontSize="9"
              fill="var(--text-muted)"
              textAnchor="start"
            >
              0
            </text>
            <text x={halfSize} y={10} fontSize="9" fill="var(--text-muted)" textAnchor="middle">
              50
            </text>
            <text
              x={size - strokeWidth - 4}
              y={halfSize + 16}
              fontSize="9"
              fill="var(--text-muted)"
              textAnchor="end"
            >
              100
            </text>
          </svg>
          {/* Center value overlay */}
          <div
            className="absolute flex flex-col items-center"
            style={{ bottom: 0, left: '50%', transform: 'translateX(-50%)' }}
          >
            <span className="text-2xl font-bold tabular-nums" style={{ color: noiseColor }}>
              {Math.round(animatedNoise)}
            </span>
          </div>
        </div>
        <p className="text-sm font-medium mt-1">Noise Level</p>
        <p className="text-[10px] text-muted">
          {noiseScore > 70
            ? 'High deviation from consensus'
            : noiseScore > 40
              ? 'Moderate noise detected'
              : 'Low noise — claims align well'}
        </p>
      </div>

      {/* Consistency Gauge */}
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: size, height: halfSize + 20 }}>
          <svg
            width={size}
            height={halfSize + 20}
            viewBox={`0 0 ${size} ${halfSize + 20}`}
            role="img"
            aria-label={`Consistency gauge: ${Math.round(consistencyScore)} out of 100`}
          >
            <path
              d={`M ${strokeWidth + 4} ${halfSize} A ${radius} ${radius} 0 0 1 ${size - strokeWidth - 4} ${halfSize}`}
              fill="none"
              stroke="var(--liquid-border)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            <circle
              cx={halfSize}
              cy={halfSize}
              r={radius}
              fill="none"
              stroke={consistencyColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={consistencyOffset}
              strokeLinecap="round"
              transform={`rotate(180 ${halfSize} ${halfSize})`}
              style={{ filter: `drop-shadow(0 0 6px ${consistencyColor}40)` }}
            />
            {/* Center dot */}
            <circle cx={halfSize} cy={halfSize} r={4} fill="var(--text-primary)" />
            <text
              x={strokeWidth + 4}
              y={halfSize + 16}
              fontSize="9"
              fill="var(--text-muted)"
              textAnchor="start"
            >
              0
            </text>
            <text x={halfSize} y={10} fontSize="9" fill="var(--text-muted)" textAnchor="middle">
              50
            </text>
            <text
              x={size - strokeWidth - 4}
              y={halfSize + 16}
              fontSize="9"
              fill="var(--text-muted)"
              textAnchor="end"
            >
              100
            </text>
          </svg>
          <div
            className="absolute flex flex-col items-center"
            style={{ bottom: 0, left: '50%', transform: 'translateX(-50%)' }}
          >
            <span className="text-2xl font-bold tabular-nums" style={{ color: consistencyColor }}>
              {Math.round(animatedConsistency)}
            </span>
          </div>
        </div>
        <p className="text-sm font-medium mt-1">Consistency</p>
        <p className="text-[10px] text-muted">
          {consistencyScore > 70
            ? 'High internal agreement'
            : consistencyScore > 40
              ? 'Some variability between audits'
              : 'Significant audit disagreement'}
        </p>
      </div>
    </div>
  );
}
