'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { NOISE_MOMENT } from '@/lib/data/research-foundations';

// Kahneman/Sibony "holy shit" moment: insurance underwriters produced 55%
// variance where executives expected 10%. Visualized as two bell curves
// side-by-side with the implication pulled out below.

const VIEW_W = 720;
const VIEW_H = 280;
const PAD_X = 40;
const PAD_Y = 30;
const CURVE_W = (VIEW_W - PAD_X * 3) / 2;
const CURVE_H = VIEW_H - PAD_Y * 2;

function bellPath(
  cx: number,
  baseY: number,
  width: number,
  height: number,
  spread: number
): string {
  // spread is a dimensionless "sigma" — wider = noisier
  // We sample points and use a Gaussian-shaped bell.
  const samples = 80;
  const points: Array<[number, number]> = [];
  for (let i = 0; i <= samples; i++) {
    const tx = i / samples; // 0..1
    const x = cx - width / 2 + tx * width;
    // Gaussian centered at cx, scaled by spread
    const normalizedX = ((tx - 0.5) * width) / (spread * width);
    const gauss = Math.exp(-0.5 * normalizedX * normalizedX);
    const y = baseY - gauss * height;
    points.push([x, y]);
  }
  return (
    `M ${points[0][0]},${baseY} ` +
    points.map(([x, y]) => `L ${x},${y}`).join(' ') +
    ` L ${points[points.length - 1][0]},${baseY} Z`
  );
}

export function NoiseMomentViz() {
  const [showActual, setShowActual] = useState(true);

  const expected = NOISE_MOMENT.expectedVariance;
  const actual = NOISE_MOMENT.actualVariance;
  // Map variance percentages to bell-curve spread (larger spread = wider bell)
  const expectedSpread = 0.18;
  const actualSpread = 0.55;

  const leftCx = PAD_X + CURVE_W / 2;
  const rightCx = PAD_X * 2 + CURVE_W + CURVE_W / 2;
  const baseY = VIEW_H - PAD_Y;

  return (
    <section
      style={{
        padding: 18,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 14,
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#EF4444',
            marginBottom: 4,
          }}
        >
          The Noise moment
        </div>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: 'var(--text-primary)',
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          Executives expected {expected}% variance. The study found {actual}%.
        </h3>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            margin: '6px 0 0',
            lineHeight: 1.55,
          }}
        >
          {NOISE_MOMENT.example.framing} — pricing variance on identical files between professional
          underwriters. This is the stat that turns &ldquo;we trust our process&rdquo; into
          &ldquo;how would we even measure it?&rdquo; in sixty seconds.
        </p>
      </div>

      {/* SVG — dual bell curves */}
      <div style={{ width: '100%', overflowX: 'auto', marginBottom: 14 }}>
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          style={{ width: '100%', minWidth: 520, height: 'auto', display: 'block' }}
          role="img"
          aria-label="Expected vs actual variance in underwriter pricing"
        >
          {/* Baseline */}
          <line
            x1={PAD_X}
            y1={baseY}
            x2={VIEW_W - PAD_X}
            y2={baseY}
            stroke="var(--border-color)"
            strokeWidth={1}
          />

          {/* Expected curve */}
          <motion.path
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            d={bellPath(leftCx, baseY, CURVE_W, CURVE_H, expectedSpread)}
            fill="rgba(14, 165, 233, 0.18)"
            stroke="#0EA5E9"
            strokeWidth={2}
          />
          <text
            x={leftCx}
            y={PAD_Y - 8}
            textAnchor="middle"
            fontSize={12}
            fontWeight={700}
            fill="#0EA5E9"
          >
            What execs expected
          </text>
          <text
            x={leftCx}
            y={baseY - CURVE_H - 16}
            textAnchor="middle"
            fontSize={20}
            fontWeight={800}
            fill="#0EA5E9"
          >
            ±{expected}%
          </text>
          <text
            x={leftCx}
            y={baseY + 20}
            textAnchor="middle"
            fontSize={11}
            fill="var(--text-muted)"
          >
            narrow, &ldquo;reasonable&rdquo; spread
          </text>

          {/* Actual curve — animate in, toggleable */}
          {showActual && (
            <motion.g
              initial={{ opacity: 0, scaleY: 0.4 }}
              animate={{ opacity: 1, scaleY: 1 }}
              style={{ transformOrigin: `${rightCx}px ${baseY}px` }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <path
                d={bellPath(rightCx, baseY, CURVE_W, CURVE_H, actualSpread)}
                fill="rgba(239, 68, 68, 0.18)"
                stroke="#EF4444"
                strokeWidth={2}
              />
            </motion.g>
          )}
          <text
            x={rightCx}
            y={PAD_Y - 8}
            textAnchor="middle"
            fontSize={12}
            fontWeight={700}
            fill="#EF4444"
          >
            What the study found
          </text>
          <text
            x={rightCx}
            y={baseY - CURVE_H - 16}
            textAnchor="middle"
            fontSize={20}
            fontWeight={800}
            fill="#EF4444"
          >
            ±{actual}%
          </text>
          <text
            x={rightCx}
            y={baseY + 20}
            textAnchor="middle"
            fontSize={11}
            fill="var(--text-muted)"
          >
            5.5× the expected spread
          </text>

          {/* Example markers — $9,500 vs $16,700 */}
          <g>
            <line
              x1={rightCx - CURVE_W * 0.33}
              y1={baseY}
              x2={rightCx - CURVE_W * 0.33}
              y2={baseY - 10}
              stroke="#EF4444"
              strokeWidth={2}
            />
            <text
              x={rightCx - CURVE_W * 0.33}
              y={baseY + 20}
              textAnchor="middle"
              fontSize={10}
              fontWeight={700}
              fill="#EF4444"
            >
              ${NOISE_MOMENT.example.low.toLocaleString()}
            </text>
            <line
              x1={rightCx + CURVE_W * 0.33}
              y1={baseY}
              x2={rightCx + CURVE_W * 0.33}
              y2={baseY - 10}
              stroke="#EF4444"
              strokeWidth={2}
            />
            <text
              x={rightCx + CURVE_W * 0.33}
              y={baseY + 20}
              textAnchor="middle"
              fontSize={10}
              fontWeight={700}
              fill="#EF4444"
            >
              ${NOISE_MOMENT.example.high.toLocaleString()}
            </text>
          </g>
        </svg>
      </div>

      {/* Toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, justifyContent: 'center' }}>
        <button
          onClick={() => setShowActual(s => !s)}
          style={{
            padding: '7px 14px',
            fontSize: 12,
            fontWeight: 600,
            color: '#fff',
            background: showActual ? '#EF4444' : '#0EA5E9',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
          }}
        >
          {showActual ? 'Hide actual — just the expectation' : 'Reveal the actual variance'}
        </button>
      </div>

      {/* Implication */}
      <div
        style={{
          padding: 12,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderLeft: '3px solid #EF4444',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#EF4444',
            marginBottom: 4,
          }}
        >
          The implication
        </div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--text-primary)',
            lineHeight: 1.55,
            marginBottom: 6,
          }}
        >
          {NOISE_MOMENT.implication}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Source: {NOISE_MOMENT.source}
        </div>
      </div>
    </section>
  );
}
