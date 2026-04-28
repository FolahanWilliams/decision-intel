'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

/**
 * LossAversionChart — Animated SVG showing cumulative hidden decision costs.
 *
 * Applies loss aversion (Kahneman & Tversky): losses are felt ~2x as strongly
 * as equivalent gains. Instead of showing "what our product does," we show
 * "what you're losing right now."
 */

// ─── Colors ──────────────────────────────────────────────────────────────────

const CHART_COLORS = {
  bg: '#FFFFFF',
  border: '#E2E8F0',
  gridLine: '#F1F5F9',
  axisText: '#94A3B8',
  lineStroke: '#DC2626',
  lossFill: 'rgba(220, 38, 38, 0.08)',
  lossGradientStart: 'rgba(220, 38, 38, 0.15)',
  lossGradientEnd: 'rgba(220, 38, 38, 0.02)',
  labelBg: '#FEF2F2',
  labelBorder: '#FECACA',
  labelText: '#991B1B',
  totalText: '#DC2626',
  annotationText: '#64748B',
  dotFill: '#DC2626',
  dotStroke: '#FFFFFF',
};

// ─── Data Points ─────────────────────────────────────────────────────────────
// Realistic cumulative loss curve for a mid-market corporate strategy team over 12 quarters.
// Derived from 143 case study failure rates and ROI attribution loss rates.

interface DataPoint {
  quarter: string;
  value: number; // cumulative loss in millions (negative)
  label?: string;
  bias?: string;
}

const DATA: DataPoint[] = [
  { quarter: 'Q1', value: 0 },
  { quarter: 'Q2', value: -2.1 },
  { quarter: 'Q3', value: -4.8 },
  { quarter: 'Q4', value: -8.2, label: '-$8.2M', bias: 'Anchoring to entry price' },
  { quarter: 'Q1', value: -10.5 },
  { quarter: 'Q2', value: -14.1, label: '-$14.1M', bias: 'Undetected groupthink in committee' },
  { quarter: 'Q3', value: -18.7 },
  { quarter: 'Q4', value: -22.3 },
  { quarter: 'Q1', value: -27.9 },
  { quarter: 'Q2', value: -33.4, label: '-$33.4M', bias: 'Sunk cost hold on failed initiative' },
  { quarter: 'Q3', value: -39.2 },
  { quarter: 'Q4', value: -47.0 },
];

// ─── SVG Geometry ────────────────────────────────────────────────────────────

const SVG_W = 520;
const SVG_H = 320;
const PADDING = { top: 30, right: 20, bottom: 50, left: 60 };
const CHART_W = SVG_W - PADDING.left - PADDING.right;
const CHART_H = SVG_H - PADDING.top - PADDING.bottom;

const Y_MIN = -50; // -$50M
const Y_MAX = 5; // slight space above $0

function xScale(i: number): number {
  return PADDING.left + (i / (DATA.length - 1)) * CHART_W;
}

function yScale(v: number): number {
  return PADDING.top + ((Y_MAX - v) / (Y_MAX - Y_MIN)) * CHART_H;
}

// Build SVG path string for the line
function buildLinePath(): string {
  return DATA.map((d, i) => {
    const x = xScale(i);
    const y = yScale(d.value);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
}

// Build SVG path for the filled area (line + bottom edge)
function buildAreaPath(): string {
  const line = DATA.map((d, i) => {
    const x = xScale(i);
    const y = yScale(d.value);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const lastX = xScale(DATA.length - 1);
  const firstX = xScale(0);
  const zeroY = yScale(0);

  return `${line} L ${lastX} ${zeroY} L ${firstX} ${zeroY} Z`;
}

// Pre-compute paths once at module load (pure functions of constants)
const LINE_PATH = buildLinePath();
const AREA_PATH = buildAreaPath();

// ─── Animated Counter ────────────────────────────────────────────────────────

function CountUp({
  target,
  prefix = '',
  suffix = '',
}: {
  target: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.3 }}
    >
      {inView ? (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.8 }}
        >
          {prefix}
          {Math.abs(target)}
          {suffix}
        </motion.span>
      ) : (
        `${prefix}0${suffix}`
      )}
    </motion.span>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function LossAversionChart() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  const linePath = LINE_PATH;
  const areaPath = AREA_PATH;

  // Y-axis tick values
  const yTicks = [0, -10, -20, -30, -40, -50];

  // X-axis labels (year markers)
  const yearLabels = [
    { idx: 0, label: 'Year 1' },
    { idx: 4, label: 'Year 2' },
    { idx: 8, label: 'Year 3' },
  ];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Chart Container */}
      <div
        style={{
          background: CHART_COLORS.bg,
          border: `1px solid ${CHART_COLORS.border}`,
          borderRadius: 16,
          padding: '24px 16px 16px',
          position: 'relative',
        }}
      >
        {/* Title */}
        <div style={{ marginBottom: 16, paddingLeft: 8 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: CHART_COLORS.totalText,
              marginBottom: 4,
            }}
          >
            Hidden Decision Costs
          </div>
          <div style={{ fontSize: 13, color: CHART_COLORS.annotationText, lineHeight: 1.4 }}>
            Cumulative losses from unaudited cognitive biases
          </div>
        </div>

        {/* SVG Chart */}
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          <defs>
            <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.lossGradientStart} />
              <stop offset="100%" stopColor={CHART_COLORS.lossGradientEnd} />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map(tick => (
            <line
              key={tick}
              x1={PADDING.left}
              x2={SVG_W - PADDING.right}
              y1={yScale(tick)}
              y2={yScale(tick)}
              stroke={tick === 0 ? CHART_COLORS.border : CHART_COLORS.gridLine}
              strokeWidth={tick === 0 ? 1.5 : 1}
            />
          ))}

          {/* Y-axis labels */}
          {yTicks.map(tick => (
            <text
              key={tick}
              x={PADDING.left - 10}
              y={yScale(tick) + 4}
              textAnchor="end"
              fontSize={10}
              fill={CHART_COLORS.axisText}
              fontWeight={tick === 0 ? 600 : 400}
            >
              {tick === 0 ? '$0' : `−$${Math.abs(tick)}M`}
            </text>
          ))}

          {/* X-axis labels */}
          {yearLabels.map(({ idx, label }) => (
            <text
              key={label}
              x={xScale(idx)}
              y={SVG_H - 10}
              textAnchor="start"
              fontSize={11}
              fill={CHART_COLORS.axisText}
              fontWeight={600}
            >
              {label}
            </text>
          ))}

          {/* Loss area fill */}
          <motion.path
            d={areaPath}
            fill="url(#lossGradient)"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 1.2 }}
          />

          {/* Loss line — animated draw */}
          <motion.path
            d={linePath}
            fill="none"
            stroke={CHART_COLORS.lineStroke}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={isInView ? { pathLength: 1 } : {}}
            transition={{ duration: 2, ease: 'easeInOut' }}
          />

          {/* Data point dots & labels */}
          {DATA.map((d, i) => {
            if (!d.label) return null;
            const x = xScale(i);
            const y = yScale(d.value);
            const labelWidth = d.bias ? Math.max(d.bias.length * 5.5 + 20, 120) : 60;
            const labelX = i > DATA.length / 2 ? x - labelWidth - 12 : x + 12;
            const labelY = y - 28;

            return (
              <motion.g
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.3 + (i / DATA.length) * 1.8 }}
              >
                {/* Dot */}
                <circle
                  cx={x}
                  cy={y}
                  r={5}
                  fill={CHART_COLORS.dotFill}
                  stroke={CHART_COLORS.dotStroke}
                  strokeWidth={2}
                />

                {/* Label box */}
                <rect
                  x={labelX}
                  y={labelY}
                  width={labelWidth}
                  height={d.bias ? 36 : 22}
                  rx={6}
                  fill={CHART_COLORS.labelBg}
                  stroke={CHART_COLORS.labelBorder}
                  strokeWidth={1}
                />
                {/* Label value */}
                <text
                  x={labelX + 8}
                  y={labelY + 14}
                  fontSize={11}
                  fontWeight={700}
                  fill={CHART_COLORS.labelText}
                >
                  {d.label}
                </text>
                {/* Bias name */}
                {d.bias && (
                  <text
                    x={labelX + 8}
                    y={labelY + 28}
                    fontSize={9}
                    fill={CHART_COLORS.annotationText}
                  >
                    {d.bias}
                  </text>
                )}
              </motion.g>
            );
          })}
        </svg>

        {/* Final total */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 2.2 }}
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            padding: '16px 8px 0',
            borderTop: `1px solid ${CHART_COLORS.border}`,
            marginTop: 8,
          }}
        >
          <div>
            <span
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: CHART_COLORS.totalText,
                letterSpacing: '-0.02em',
              }}
            >
              <CountUp target={47} prefix="-$" suffix="M" />
            </span>
            <span
              style={{
                fontSize: 13,
                color: CHART_COLORS.annotationText,
                marginLeft: 8,
              }}
            >
              in hidden decision costs
            </span>
          </div>
          <div
            style={{
              fontSize: 10,
              color: CHART_COLORS.axisText,
              textAlign: 'right',
              lineHeight: 1.4,
            }}
          >
            Average mid-market enterprise
            <br />
            Based on 143 case studies
          </div>
        </motion.div>
      </div>

      {/* CTA below chart */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: 2.5 }}
        style={{
          textAlign: 'center',
          marginTop: 16,
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#475569',
            fontStyle: 'italic',
          }}
        >
          How much are your decisions really costing?
        </span>
      </motion.div>
    </div>
  );
}
