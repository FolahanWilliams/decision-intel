'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const C = {
  white: '#FFFFFF',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate900: '#0F172A',
  green: '#16A34A',
  amber: '#F59E0B',
  red: '#DC2626',
};

/**
 * Three overlapping bell curves that visualize "three judges, how much
 * do they agree?" Low variance = narrow overlapping peaks; high variance
 * = spread out. We draw two panels side-by-side so the contrast is
 * immediate.
 */
function bellCurve(
  mu: number,
  sigma: number,
  width: number,
  height: number,
  sampleCount = 80
): string {
  const pts: string[] = [];
  for (let i = 0; i <= sampleCount; i++) {
    const x = i / sampleCount;
    const norm = Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
    const px = x * width;
    const py = height - norm * height * 0.9;
    pts.push(`${px.toFixed(2)},${py.toFixed(2)}`);
  }
  return `M 0 ${height} L ${pts.join(' L ')} L ${width} ${height} Z`;
}

function JudgePanel({
  title,
  stdDev,
  mean,
  curves,
  color,
  summary,
  narrow,
}: {
  title: string;
  stdDev: number;
  mean: number;
  curves: Array<{ mu: number; sigma: number; color: string }>;
  color: string;
  summary: string;
  narrow: boolean;
}) {
  const W = 360;
  const H = 140;
  // Single IntersectionObserver on the outer SVG — `whileInView` on SVG
  // child elements is unreliable on iOS Safari; one observer + driving
  // each child's `animate` off this boolean fixes mobile rendering.
  const svgRef = useRef<SVGSVGElement>(null);
  const inView = useInView(svgRef, { once: true });
  return (
    <div
      style={{
        flex: 1,
        background: C.white,
        border: `1px solid ${C.slate200}`,
        borderRadius: 12,
        padding: '16px 18px 14px',
        minWidth: 240,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: C.slate500,
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: 999,
            background: `${color}18`,
            color,
          }}
        >
          {narrow ? 'Reliable' : 'Unstable'}
        </span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label={`Noise distribution — ${title}`}
      >
        <defs>
          {curves.map((c, i) => (
            <linearGradient
              key={i}
              id={`nc-${title.replace(/\s+/g, '-')}-${i}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={c.color} stopOpacity={0.5} />
              <stop offset="100%" stopColor={c.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>

        {/* Baseline */}
        <line x1={0} y1={H - 1} x2={W} y2={H - 1} stroke={C.slate200} strokeWidth={1} />

        {/* Three curves */}
        {curves.map((c, i) => (
          <motion.path
            key={i}
            d={bellCurve(c.mu, c.sigma, W, H)}
            fill={`url(#nc-${title.replace(/\s+/g, '-')}-${i})`}
            stroke={c.color}
            strokeWidth={1.5}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.55, delay: 0.1 + i * 0.1, ease: 'easeOut' }}
            style={{ transformOrigin: 'center bottom' }}
          />
        ))}
      </svg>

      <div
        style={{
          display: 'flex',
          gap: 16,
          marginTop: 10,
          paddingTop: 10,
          borderTop: `1px dashed ${C.slate200}`,
          flexWrap: 'wrap',
        }}
      >
        <Stat label="Mean" value={`${mean}/100`} />
        <Stat label="Std Dev" value={`${stdDev}`} color={color} />
      </div>
      <p style={{ fontSize: 12.5, color: C.slate500, margin: '10px 0 0', lineHeight: 1.5 }}>
        {summary}
      </p>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: C.slate400,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: color ?? C.slate900,
          fontFamily: 'var(--font-mono, monospace)',
          marginTop: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export function NoiseDistributionViz() {
  return (
    <div
      style={{
        background: C.slate100,
        border: `1px solid ${C.slate200}`,
        borderRadius: 16,
        padding: '24px 24px 22px',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: C.slate400,
          marginBottom: 4,
        }}
      >
        Noise decomposition · three decorrelated samples
      </div>
      <div
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: C.slate900,
          marginBottom: 16,
          letterSpacing: '-0.01em',
        }}
      >
        Is the reasoning stable under rewording?
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <JudgePanel
          title="Low noise"
          color={C.green}
          mean={78}
          stdDev={4}
          narrow
          curves={[
            { mu: 0.5, sigma: 0.06, color: C.green },
            { mu: 0.52, sigma: 0.07, color: '#22C55E' },
            { mu: 0.48, sigma: 0.06, color: '#15803D' },
          ]}
          summary="Three judges converge on the same score. The reasoning holds up — the memo says what it means."
        />
        <JudgePanel
          title="High noise"
          color={C.red}
          mean={62}
          stdDev={22}
          narrow={false}
          curves={[
            { mu: 0.32, sigma: 0.13, color: C.red },
            { mu: 0.54, sigma: 0.15, color: C.amber },
            { mu: 0.78, sigma: 0.13, color: '#F97316' },
          ]}
          summary="Same memo, same prompt, three different reads. Something is ambiguous — rewrite before the board sees it."
        />
      </div>
    </div>
  );
}
