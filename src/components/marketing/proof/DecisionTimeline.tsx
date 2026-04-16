'use client';

/**
 * DecisionTimeline
 *
 * Hero visualization for /proof. Plots every deep case as a bubble:
 *   X — year the decision was made
 *   Y — log-impact (visual weight, not literal)
 *   radius — proportional to impactScore
 *   color — outcome severity
 *
 * Clicking a bubble selects that case (drives ?case= param).
 * Pure SVG, responsive via viewBox. No chart library — every pixel is
 * intentional and matches the marketing color system.
 */

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const C = {
  white: '#FFFFFF',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate900: '#0F172A',
  green: '#16A34A',
  greenLight: '#DCFCE7',
  red: '#DC2626',
  redLight: 'rgba(220, 38, 38, 0.12)',
  amber: '#F59E0B',
  amberLight: 'rgba(245, 158, 11, 0.12)',
};

const OUTCOME_COLOR: Record<string, { fill: string; stroke: string; label: string }> = {
  catastrophic_failure: {
    fill: 'rgba(220, 38, 38, 0.18)',
    stroke: C.red,
    label: 'Catastrophic Failure',
  },
  failure: { fill: 'rgba(220, 38, 38, 0.12)', stroke: C.red, label: 'Failure' },
  partial_failure: { fill: C.amberLight, stroke: C.amber, label: 'Partial Failure' },
  partial_success: { fill: C.greenLight, stroke: C.green, label: 'Partial Success' },
  success: { fill: C.greenLight, stroke: C.green, label: 'Success' },
  exceptional_success: {
    fill: 'rgba(22, 163, 74, 0.18)',
    stroke: C.green,
    label: 'Exceptional Success',
  },
};

export interface TimelineCase {
  slug: string;
  company: string;
  year: number;
  yearRealized: number;
  outcome: string;
  impactScore: number;
  industry: string;
}

interface DecisionTimelineProps {
  cases: TimelineCase[];
  activeSlug: string;
}

export function DecisionTimeline({ cases, activeSlug }: DecisionTimelineProps) {
  const router = useRouter();
  const [hoverSlug, setHoverSlug] = useState<string | null>(null);

  // ─── Geometry ─────────────────────────────────────────────────────────
  // Render into a 1000×260 viewBox; scale responsively via CSS.
  const vbW = 1000;
  const vbH = 260;
  const padL = 58;
  const padR = 24;
  const padT = 24;
  const padB = 44;
  const plotW = vbW - padL - padR;
  const plotH = vbH - padT - padB;

  const { xScale, yScale, rScale, minYear, maxYear, ticks } = useMemo(() => {
    const years = cases.map(c => c.year);
    const impacts = cases.map(c => c.impactScore || 0);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const yearSpan = Math.max(1, maxYear - minYear);

    const maxImpact = Math.max(1, ...impacts);
    const minImpact = Math.min(...impacts);
    const impactSpan = Math.max(1, maxImpact - minImpact);

    const xScale = (y: number) =>
      padL + ((y - minYear) / yearSpan) * plotW;
    // Higher impact → higher on chart (i.e., smaller SVG y)
    const yScale = (impact: number) =>
      padT + plotH - ((impact - minImpact) / impactSpan) * plotH;
    // Bubble radius 8 → 20 based on impact
    const rScale = (impact: number) =>
      8 + ((impact - minImpact) / impactSpan) * 12;

    // Decade-ish ticks
    const roundedMin = Math.floor(minYear / 5) * 5;
    const roundedMax = Math.ceil(maxYear / 5) * 5;
    const tickStep = yearSpan > 40 ? 10 : yearSpan > 15 ? 5 : 2;
    const ticks: number[] = [];
    for (let y = roundedMin; y <= roundedMax; y += tickStep) ticks.push(y);

    return { xScale, yScale, rScale, minYear, maxYear, ticks };
  }, [cases, padL, padT, plotW, plotH]);

  const handleSelect = (slug: string) => {
    router.push(`/proof?case=${slug}`, { scroll: false });
  };

  return (
    <div
      style={{
        background: C.white,
        border: `1px solid ${C.slate200}`,
        borderRadius: 16,
        padding: '24px 28px 8px',
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
          flexWrap: 'wrap',
          gap: 8,
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
            {cases.length} decisions · {minYear}–{maxYear} · Click any to audit
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.slate900 }}>
            The decision timeline
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <Legend swatch={C.red} label="Failure" />
          <Legend swatch={C.amber} label="Partial" />
          <Legend swatch={C.green} label="Success" />
        </div>
      </div>

      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Interactive timeline of decisions and their outcomes"
        style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'manipulation' }}
      >
        {/* Gridlines + ticks */}
        {ticks.map(t => {
          const x = xScale(t);
          if (x < padL - 1 || x > vbW - padR + 1) return null;
          return (
            <g key={t}>
              <line
                x1={x}
                x2={x}
                y1={padT}
                y2={padT + plotH}
                stroke={C.slate100}
                strokeWidth={1}
              />
              <text
                x={x}
                y={vbH - padB + 18}
                textAnchor="middle"
                fontSize={10}
                fontWeight={600}
                fill={C.slate400}
                style={{ fontFamily: 'var(--font-mono, monospace)' }}
              >
                {t}
              </text>
            </g>
          );
        })}

        {/* Axis frame — subtle bottom line */}
        <line
          x1={padL}
          x2={vbW - padR}
          y1={padT + plotH}
          y2={padT + plotH}
          stroke={C.slate200}
          strokeWidth={1}
        />

        {/* Y-axis label */}
        <text
          x={padL - 6}
          y={padT + 2}
          textAnchor="end"
          fontSize={9}
          fontWeight={700}
          fill={C.slate400}
          style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          ↑ impact
        </text>
        <text
          x={padL - 6}
          y={padT + plotH - 4}
          textAnchor="end"
          fontSize={9}
          fontWeight={700}
          fill={C.slate400}
          style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          ↓ impact
        </text>
        <text
          x={vbW - padR}
          y={vbH - 8}
          textAnchor="end"
          fontSize={9}
          fontWeight={700}
          fill={C.slate400}
          style={{
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontFamily: 'var(--font-mono, monospace)',
          }}
        >
          year of decision →
        </text>

        {/* Bubbles */}
        {cases.map((c, i) => {
          const colors = OUTCOME_COLOR[c.outcome] ?? {
            fill: C.slate100,
            stroke: C.slate400,
            label: 'Unknown',
          };
          const isActive = c.slug === activeSlug;
          const isHover = c.slug === hoverSlug;
          const cx = xScale(c.year);
          const cy = yScale(c.impactScore || 0);
          const r = rScale(c.impactScore || 0);

          return (
            <motion.g
              key={c.slug}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03, duration: 0.35, ease: 'easeOut' }}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoverSlug(c.slug)}
              onMouseLeave={() => setHoverSlug(null)}
              onClick={() => handleSelect(c.slug)}
            >
              {/* Active ring */}
              {isActive && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={r + 6}
                  fill="none"
                  stroke={colors.stroke}
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  opacity={0.55}
                />
              )}
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={colors.fill}
                stroke={colors.stroke}
                strokeWidth={isActive || isHover ? 2.5 : 1.5}
                style={{ transition: 'stroke-width 0.15s' }}
              />
              {/* Company label — always on active, on hover otherwise */}
              {(isActive || isHover) && (
                <g pointerEvents="none">
                  <rect
                    x={cx - 58}
                    y={cy - r - 26}
                    width={116}
                    height={20}
                    rx={6}
                    fill={C.slate900}
                  />
                  <text
                    x={cx}
                    y={cy - r - 13}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={700}
                    fill={C.white}
                  >
                    {c.company} · {c.year}
                  </text>
                </g>
              )}
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          background: `${swatch}22`,
          border: `1.5px solid ${swatch}`,
        }}
        aria-hidden
      />
      <span style={{ fontSize: 11, fontWeight: 600, color: C.slate500 }}>{label}</span>
    </div>
  );
}
