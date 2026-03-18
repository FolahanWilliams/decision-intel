'use client';

import { useEffect, useRef, useState } from 'react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

interface SentimentGaugeProps {
  score: number; // -100 to 100, or 0 to 100
  label: string; // e.g. "Positive", "Neutral", "Negative"
  compact?: boolean;
}

export function SentimentGauge({ score, label, compact }: SentimentGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState(200);

  // Normalize: sentiment might be 0-100 or already -100 to 100
  // Treat 0-100 where 50 = neutral
  const normalizedAngle = Math.max(0, Math.min(100, score));

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width ?? 0;
      setCanvasSize(
        compact
          ? Math.min(160, Math.max(100, width - 40))
          : Math.min(240, Math.max(140, width - 40))
      );
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [compact]);

  const prevDrawRef = useRef<string>('');

  useEffect(() => {
    const drawKey = `${score}-${canvasSize}`;
    if (prevDrawRef.current === drawKey) return;
    prevDrawRef.current = drawKey;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = canvasSize;
    canvas.width = size * dpr;
    canvas.height = size * 0.65 * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size * 0.65}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size * 0.55;
    const radius = size * 0.38;
    const startAngle = Math.PI;
    const endAngle = 2 * Math.PI;

    // Clear
    ctx.clearRect(0, 0, size, size);

    // Background arc
    const computedStyle = getComputedStyle(canvas);
    const errorColor = computedStyle.getPropertyValue('--error').trim() || '#ef4444';
    const warningColor = computedStyle.getPropertyValue('--warning').trim() || '#f59e0b';
    const mutedColor = computedStyle.getPropertyValue('--text-muted').trim() || '#6b7280';
    const successColor = computedStyle.getPropertyValue('--success').trim() || '#22c55e';

    const gradient = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy);
    gradient.addColorStop(0, errorColor);
    gradient.addColorStop(0.35, warningColor);
    gradient.addColorStop(0.5, mutedColor);
    gradient.addColorStop(0.65, successColor);
    gradient.addColorStop(1, successColor);

    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.lineWidth = 14;
    ctx.strokeStyle = gradient;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Dim overlay for unlit portion
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.lineWidth = 14;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.stroke();

    // Lit portion (up to needle angle)
    const needleAngle = startAngle + (normalizedAngle / 100) * Math.PI;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, needleAngle);
    ctx.lineWidth = 14;
    ctx.strokeStyle = gradient;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Needle
    const needleLength = radius - 10;
    const nx = cx + Math.cos(needleAngle) * needleLength;
    const ny = cy + Math.sin(needleAngle) * needleLength;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(nx, ny);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fill();

    // Score text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = "bold 20px 'Inter', system-ui, sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${Math.round(score)}`, cx, cy + 12);
  }, [score, normalizedAngle, canvasSize]);

  const getColor = () => {
    if (score >= 65) return 'var(--success)';
    if (score >= 40) return 'var(--text-muted)';
    return 'var(--error)';
  };

  return (
    <div className="card card-glow h-full">
      <div className="card-header">
        <h3 className="flex items-center gap-1.5">
          Sentiment Pulse
          <InfoTooltip text="Measures the overall emotional tone of the document on a scale from negative (red) to positive (green). A neutral score suggests balanced language." />
        </h3>
      </div>
      <div
        ref={containerRef}
        className="card-body flex flex-col items-center justify-center"
        style={{ minHeight: compact ? 100 : 200 }}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Sentiment gauge showing score of ${Math.round(score)} out of 100, labeled ${label}`}
        />
        <div
          style={{
            marginTop: '-4px',
            fontSize: '13px',
            fontWeight: 600,
            color: getColor(),
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}
