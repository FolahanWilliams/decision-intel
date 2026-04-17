'use client';

/**
 * RiskLandscape
 *
 * The category-defining viz for /bias-genome. A 2D scatter plot:
 *   X — prevalence (how often this bias appears in our dataset)
 *   Y — failure lift (how much more often decisions with this bias fail)
 *   radius — sample size (trust the signal as the dot gets bigger)
 *   color — quadrant assignment
 *
 * Four labeled quadrants tell the category story:
 *   top-right    → Common & Dangerous (prioritize these)
 *   top-left     → Rare but Deadly (watch signal)
 *   bottom-right → Common, Containable (usually detected early)
 *   bottom-left  → Low Concern
 */

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { BiasGenomeEntry } from '@/lib/data/bias-genome-seed';

const C = {
  white: '#FFFFFF',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate900: '#0F172A',
  green: '#16A34A',
  amber: '#F59E0B',
  red: '#DC2626',
  violet: '#7C3AED',
};

function quadrantColor(
  entry: BiasGenomeEntry,
  xThreshold: number,
  yThreshold: number
): { fill: string; stroke: string; quadrant: string } {
  const lift = entry.failureLift ?? 0;
  const prev = entry.prevalence;
  if (prev >= xThreshold && lift >= yThreshold) {
    return { fill: 'rgba(220, 38, 38, 0.18)', stroke: C.red, quadrant: 'common-dangerous' };
  }
  if (prev < xThreshold && lift >= yThreshold) {
    return { fill: 'rgba(245, 158, 11, 0.18)', stroke: C.amber, quadrant: 'rare-deadly' };
  }
  if (prev >= xThreshold && lift < yThreshold) {
    return { fill: 'rgba(124, 58, 237, 0.15)', stroke: C.violet, quadrant: 'common-containable' };
  }
  return { fill: 'rgba(22, 163, 74, 0.15)', stroke: C.green, quadrant: 'low-concern' };
}

interface RiskLandscapeProps {
  entries: BiasGenomeEntry[];
  baselineFailureRate: number;
}

export function RiskLandscape({ entries }: RiskLandscapeProps) {
  const [hoverKey, setHoverKey] = useState<string | null>(null);

  // Only plot entries with enough signal to be on the chart
  const plottable = useMemo(
    () => entries.filter(e => e.failureLift != null && e.sampleSize >= 2),
    [entries]
  );

  // Geometry
  const vbW = 1000;
  const vbH = 560;
  const padL = 80;
  const padR = 32;
  const padT = 40;
  const padB = 68;
  const plotW = vbW - padL - padR;
  const plotH = vbH - padT - padB;

  const { xScale, yScale, rScale, xThreshold, yThreshold, xTicks, yTicks, liftMax, prevMax } =
    useMemo(() => {
      const prevalences = plottable.map(e => e.prevalence);
      const lifts = plottable.map(e => e.failureLift ?? 0);
      const sampleSizes = plottable.map(e => e.sampleSize);

      const prevMax = Math.max(0.5, ...prevalences, 0.5);
      const liftMax = Math.max(2.2, ...lifts);
      const sizeMax = Math.max(5, ...sampleSizes);

      const xScale = (p: number) => padL + (p / prevMax) * plotW;
      // Higher failureLift = smaller SVG y
      const yScale = (l: number) => padT + plotH - (l / liftMax) * plotH;
      const rScale = (n: number) => 7 + (n / sizeMax) * 18;

      // Thresholds: median prevalence / baseline (1.0x)
      const xThreshold = prevMax / 2;
      const yThreshold = 1;

      // Ticks
      const xTicks: number[] = [];
      for (let i = 0; i <= 4; i++) xTicks.push((prevMax * i) / 4);
      const yTicks: number[] = [];
      const yTickStep = liftMax > 3 ? 1 : 0.5;
      for (let v = 0; v <= liftMax + 0.01; v += yTickStep) yTicks.push(v);

      return { xScale, yScale, rScale, xThreshold, yThreshold, xTicks, yTicks, liftMax, prevMax };
    }, [plottable, padL, padT, plotW, plotH]);

  const quadLines = {
    v: xScale(xThreshold),
    h: yScale(yThreshold),
  };

  return (
    <div
      style={{
        background: C.white,
        border: `1px solid ${C.slate200}`,
        borderRadius: 16,
        padding: '24px 28px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 16,
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: C.slate400,
              marginBottom: 2,
            }}
          >
            The risk landscape
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.slate900 }}>
            Prevalence × Failure lift · {plottable.length} biases
          </div>
          <div
            style={{
              fontSize: 12,
              color: C.slate500,
              marginTop: 4,
              maxWidth: 520,
              lineHeight: 1.5,
            }}
          >
            Bubble size reflects sample size (trust the dot as it gets bigger). Quadrants are
            directional — treat small-n points as signal, not statistic.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <QuadSwatch color={C.red} label="Common & dangerous" />
          <QuadSwatch color={C.amber} label="Rare but deadly" />
          <QuadSwatch color={C.violet} label="Common, containable" />
          <QuadSwatch color={C.green} label="Low concern" />
        </div>
      </div>

      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Scatter plot of bias prevalence versus failure lift"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {/* Quadrant shading */}
        <rect
          x={quadLines.v}
          y={padT}
          width={vbW - padR - quadLines.v}
          height={quadLines.h - padT}
          fill="rgba(220, 38, 38, 0.035)"
        />
        <rect
          x={padL}
          y={padT}
          width={quadLines.v - padL}
          height={quadLines.h - padT}
          fill="rgba(245, 158, 11, 0.03)"
        />
        <rect
          x={quadLines.v}
          y={quadLines.h}
          width={vbW - padR - quadLines.v}
          height={padT + plotH - quadLines.h}
          fill="rgba(124, 58, 237, 0.025)"
        />
        <rect
          x={padL}
          y={quadLines.h}
          width={quadLines.v - padL}
          height={padT + plotH - quadLines.h}
          fill="rgba(22, 163, 74, 0.025)"
        />

        {/* Gridlines */}
        {xTicks.map((t, i) => (
          <line
            key={`xg-${i}`}
            x1={xScale(t)}
            x2={xScale(t)}
            y1={padT}
            y2={padT + plotH}
            stroke={C.slate100}
            strokeWidth={1}
          />
        ))}
        {yTicks.map((t, i) => (
          <line
            key={`yg-${i}`}
            y1={yScale(t)}
            y2={yScale(t)}
            x1={padL}
            x2={vbW - padR}
            stroke={C.slate100}
            strokeWidth={1}
          />
        ))}

        {/* Quadrant dividing lines (emphasized) */}
        <line
          x1={quadLines.v}
          x2={quadLines.v}
          y1={padT}
          y2={padT + plotH}
          stroke={C.slate300}
          strokeWidth={1.2}
          strokeDasharray="4 4"
        />
        <line
          y1={quadLines.h}
          y2={quadLines.h}
          x1={padL}
          x2={vbW - padR}
          stroke={C.slate300}
          strokeWidth={1.2}
          strokeDasharray="4 4"
        />

        {/* Axis frames */}
        <line
          x1={padL}
          x2={vbW - padR}
          y1={padT + plotH}
          y2={padT + plotH}
          stroke={C.slate200}
          strokeWidth={1}
        />
        <line x1={padL} x2={padL} y1={padT} y2={padT + plotH} stroke={C.slate200} strokeWidth={1} />

        {/* X tick labels */}
        {xTicks.map((t, i) => (
          <text
            key={`xt-${i}`}
            x={xScale(t)}
            y={padT + plotH + 20}
            textAnchor="middle"
            fontSize={10}
            fontWeight={600}
            fill={C.slate400}
            style={{ fontFamily: 'var(--font-mono, monospace)' }}
          >
            {Math.round(t * 100)}%
          </text>
        ))}
        {/* X-axis label */}
        <text
          x={padL + plotW / 2}
          y={padT + plotH + 48}
          textAnchor="middle"
          fontSize={11}
          fontWeight={700}
          fill={C.slate500}
          style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          Prevalence — share of cases containing the bias
        </text>

        {/* Y tick labels */}
        {yTicks.map((t, i) => (
          <text
            key={`yt-${i}`}
            x={padL - 10}
            y={yScale(t) + 3}
            textAnchor="end"
            fontSize={10}
            fontWeight={600}
            fill={C.slate400}
            style={{ fontFamily: 'var(--font-mono, monospace)' }}
          >
            {t.toFixed(1)}x
          </text>
        ))}
        {/* Y-axis label */}
        <text
          transform={`translate(${padL - 54}, ${padT + plotH / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize={11}
          fontWeight={700}
          fill={C.slate500}
          style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          Failure lift vs baseline
        </text>

        {/* Baseline annotation (failureLift = 1.0) */}
        <g>
          <text
            x={vbW - padR - 4}
            y={quadLines.h - 6}
            textAnchor="end"
            fontSize={9}
            fontWeight={700}
            fill={C.slate400}
            style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
          >
            baseline 1.0x
          </text>
        </g>

        {/* Bubbles */}
        {plottable.map((e, i) => {
          const q = quadrantColor(e, xThreshold, yThreshold);
          const cx = xScale(e.prevalence);
          const cy = yScale(e.failureLift ?? 0);
          const r = rScale(e.sampleSize);
          const isHover = hoverKey === e.biasType;

          return (
            <motion.g
              key={e.biasType}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.05 + i * 0.03, ease: 'easeOut' }}
              onMouseEnter={() => setHoverKey(e.biasType)}
              onMouseLeave={() => setHoverKey(null)}
              style={{ cursor: 'default' }}
            >
              {isHover && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={r + 6}
                  fill="none"
                  stroke={q.stroke}
                  strokeOpacity={0.5}
                  strokeWidth={2}
                  strokeDasharray="3 3"
                />
              )}
              <circle cx={cx} cy={cy} r={r} fill={q.fill} stroke={q.stroke} strokeWidth={1.8} />
              {/* Label ALWAYS visible for top-right quadrant entries (the key story) */}
              {(q.quadrant === 'common-dangerous' || isHover) && (
                <g pointerEvents="none">
                  <text
                    x={cx}
                    y={cy - r - 6}
                    textAnchor="middle"
                    fontSize={10.5}
                    fontWeight={700}
                    fill={C.slate900}
                  >
                    {e.label}
                  </text>
                  {isHover && (
                    <text
                      x={cx}
                      y={cy + r + 14}
                      textAnchor="middle"
                      fontSize={9.5}
                      fontWeight={600}
                      fill={C.slate500}
                      style={{ fontFamily: 'var(--font-mono, monospace)' }}
                    >
                      {(e.failureLift ?? 0).toFixed(1)}x · n={e.sampleSize}
                    </text>
                  )}
                </g>
              )}
            </motion.g>
          );
        })}

        {/* Quadrant captions in faded gray */}
        <QuadCaption
          x={quadLines.v + (vbW - padR - quadLines.v) / 2}
          y={padT + 20}
          label="Common & dangerous"
          color={C.red}
          note="prioritize these"
        />
        <QuadCaption
          x={padL + (quadLines.v - padL) / 2}
          y={padT + 20}
          label="Rare but deadly"
          color={C.amber}
          note="watch for n growth"
        />
        <QuadCaption
          x={quadLines.v + (vbW - padR - quadLines.v) / 2}
          y={padT + plotH - 10}
          label="Common, containable"
          color={C.violet}
          note="surfaced often, usually caught"
        />
        <QuadCaption
          x={padL + (quadLines.v - padL) / 2}
          y={padT + plotH - 10}
          label="Low concern"
          color={C.green}
          note="rare & non-dangerous"
        />
      </svg>

      <div
        style={{
          marginTop: 14,
          paddingTop: 14,
          borderTop: `1px dashed ${C.slate200}`,
          fontSize: 11,
          color: C.slate500,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <span>
          Max lift in view:{' '}
          <strong style={{ color: C.red, fontFamily: 'var(--font-mono, monospace)' }}>
            {liftMax.toFixed(1)}x
          </strong>
          {' · '}
          Max prevalence:{' '}
          <strong style={{ color: C.slate900, fontFamily: 'var(--font-mono, monospace)' }}>
            {Math.round(prevMax * 100)}%
          </strong>
        </span>
        <span>Hover any bubble to see n and exact lift.</span>
      </div>
    </div>
  );
}

function QuadSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: 3,
          background: `${color}22`,
          border: `1.5px solid ${color}`,
        }}
        aria-hidden
      />
      <span style={{ fontSize: 11, fontWeight: 600, color: C.slate500 }}>{label}</span>
    </div>
  );
}

function QuadCaption({
  x,
  y,
  label,
  color,
  note,
}: {
  x: number;
  y: number;
  label: string;
  color: string;
  note: string;
}) {
  return (
    <g pointerEvents="none">
      <text
        x={x}
        y={y}
        textAnchor="middle"
        fontSize={10}
        fontWeight={700}
        fill={color}
        opacity={0.6}
        style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
      >
        {label}
      </text>
      <text
        x={x}
        y={y + 12}
        textAnchor="middle"
        fontSize={9}
        fontWeight={500}
        fill={color}
        opacity={0.4}
      >
        {note}
      </text>
    </g>
  );
}
