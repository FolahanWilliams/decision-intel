'use client';

import { useEffect, useRef } from 'react';

interface SentimentGaugeProps {
    score: number;     // -100 to 100, or 0 to 100
    label: string;     // e.g. "Positive", "Neutral", "Negative"
}

export function SentimentGauge({ score, label }: SentimentGaugeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Normalize: sentiment might be 0-100 or already -100 to 100
    // Treat 0-100 where 50 = neutral
    const normalizedAngle = Math.max(0, Math.min(100, score));

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const size = 200;
        canvas.width = size * dpr;
        canvas.height = (size * 0.65) * dpr;
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
        const gradient = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy);
        gradient.addColorStop(0, '#ef4444');      // Negative (left)
        gradient.addColorStop(0.35, '#eab308');     // Warning
        gradient.addColorStop(0.5, '#6b7280');      // Neutral (center)
        gradient.addColorStop(0.65, '#22c55e');     // Positive
        gradient.addColorStop(1, '#10b981');        // Strong positive (right)

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
        ctx.strokeStyle = '#fff';
        ctx.lineCap = 'round';
        ctx.stroke();

        // Center dot
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();

        // Score text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`${Math.round(score)}`, cx, cy + 12);

    }, [score, normalizedAngle]);

    const getColor = () => {
        if (score >= 65) return '#22c55e';
        if (score >= 40) return '#6b7280';
        return '#ef4444';
    };

    return (
        <div className="card card-glow h-full">
            <div className="card-header">
                <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Sentiment Pulse
                </h3>
            </div>
            <div className="card-body flex flex-col items-center justify-center" style={{ minHeight: 200 }}>
                <canvas ref={canvasRef} />
                <div style={{
                    marginTop: '-4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: getColor(),
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                }}>
                    {label}
                </div>
            </div>
        </div>
    );
}
