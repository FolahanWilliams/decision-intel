/**
 * BiasSeverityScatter — interactive scatter visualization of all
 * reasoning-risk findings, plotted by severity × confidence.
 * Locked 2026-05-20 (visual-deliverable rebuild).
 *
 * Per the Deep Research synthesis §4 chart-finding mapping:
 *   - severity = vertical position (high risk floats up)
 *   - confidence = horizontal position (right = high-confidence)
 *   - bubble size = number of memo passages involved (when known)
 *   - bubble color = severity band (red/amber/green discipline)
 *
 * Click a bubble → opens the same ProgressiveDrawer the FindingCard
 * uses. Hover → tooltip with the finding label + severity + confidence.
 *
 * Lives ABOVE the modular grid of FindingCards on the Reasoning Risks
 * page — gives the procurement-grade visual overview before the
 * card-by-card detail.
 */

'use client';

import { useId } from 'react';
import type { ReasoningRiskFinding, Severity } from '@/lib/deliverable/types';

interface BiasSeverityScatterProps {
  findings: ReasoningRiskFinding[];
  onSelect?: (finding: ReasoningRiskFinding) => void;
  height?: number;
}

const SEVERITY_Y: Record<Severity, number> = {
  low: 25,
  medium: 50,
  high: 75,
  critical: 92,
};

const SEVERITY_COLOR: Record<Severity, string> = {
  critical: '#b91c1c',
  high: '#ef4444',
  medium: '#d97706',
  low: '#16a34a',
};

const PAD = { top: 28, right: 32, bottom: 38, left: 60 };

export function BiasSeverityScatter({
  findings,
  onSelect,
  height = 280,
}: BiasSeverityScatterProps) {
  const id = useId();
  const width = 720; // viewBox width; SVG scales to container
  const innerW = width - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;

  if (findings.length === 0) {
    return (
      <div
        style={{
          padding: '32px',
          border: '1px dashed var(--border-color, #E2E8F0)',
          borderRadius: 12,
          textAlign: 'center',
          fontSize: 13,
          color: 'var(--text-muted, #64748B)',
        }}
      >
        No findings to plot.
      </div>
    );
  }

  // Convert each finding to a plotted point
  const points = findings.map((f, idx) => {
    const conf = f.chip.pct ?? (f.kind === 'compound_pattern' ? 85 : 50);
    const sev = SEVERITY_Y[f.chip.severity];
    const x = PAD.left + (conf / 100) * innerW;
    const y = PAD.top + ((100 - sev) / 100) * innerH;
    // Bubble radius — compound patterns slightly larger to emphasize moat signal
    const r = f.kind === 'compound_pattern' ? 13 : 9;
    return { finding: f, idx, x, y, r, color: SEVERITY_COLOR[f.chip.severity] };
  });

  // Severity band horizontal stripes (subtle background tint)
  const bandStripes = [
    { min: 0, max: 35, color: SEVERITY_COLOR.low },
    { min: 35, max: 60, color: SEVERITY_COLOR.medium },
    { min: 60, max: 85, color: SEVERITY_COLOR.high },
    { min: 85, max: 100, color: SEVERITY_COLOR.critical },
  ];

  return (
    <div
      style={{
        background: 'var(--bg-card, #FFFFFF)',
        border: '1px solid var(--border-color, #E2E8F0)',
        borderRadius: 12,
        padding: '14px 18px 8px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 6,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: 'var(--text-muted, #64748B)',
          }}
        >
          Risk map · severity × confidence
        </div>
        <div
          style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--text-muted, #64748B)' }}
        >
          {(['critical', 'high', 'medium', 'low'] as Severity[]).map(s => (
            <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: SEVERITY_COLOR[s],
                  display: 'inline-block',
                }}
              />
              {s}
            </span>
          ))}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label="Bias severity vs confidence scatter chart"
      >
        {/* Severity band horizontal stripes */}
        {bandStripes.map(band => {
          const yTop = PAD.top + ((100 - band.max) / 100) * innerH;
          const yBot = PAD.top + ((100 - band.min) / 100) * innerH;
          return (
            <rect
              key={`band-${band.min}`}
              x={PAD.left}
              y={yTop}
              width={innerW}
              height={yBot - yTop}
              fill={band.color}
              opacity={0.05}
            />
          );
        })}

        {/* Grid lines — vertical at 25/50/75% confidence */}
        {[25, 50, 75].map(pct => {
          const x = PAD.left + (pct / 100) * innerW;
          return (
            <line
              key={`grid-x-${pct}`}
              x1={x}
              y1={PAD.top}
              x2={x}
              y2={PAD.top + innerH}
              stroke="var(--border-color, #E2E8F0)"
              strokeDasharray="3 4"
              strokeWidth={1}
            />
          );
        })}

        {/* Y-axis severity labels */}
        {(['critical', 'high', 'medium', 'low'] as Severity[]).map(sev => {
          const y = PAD.top + ((100 - SEVERITY_Y[sev]) / 100) * innerH;
          return (
            <text
              key={`y-label-${sev}`}
              x={PAD.left - 10}
              y={y}
              textAnchor="end"
              dominantBaseline="middle"
              style={{
                fontSize: 10.5,
                fill: SEVERITY_COLOR[sev],
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {sev}
            </text>
          );
        })}

        {/* X-axis confidence labels */}
        {[0, 25, 50, 75, 100].map(pct => {
          const x = PAD.left + (pct / 100) * innerW;
          return (
            <text
              key={`x-label-${pct}`}
              x={x}
              y={height - PAD.bottom + 16}
              textAnchor="middle"
              style={{
                fontSize: 10.5,
                fill: 'var(--text-muted, #64748B)',
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {pct}%
            </text>
          );
        })}

        {/* X-axis title */}
        <text
          x={PAD.left + innerW / 2}
          y={height - 6}
          textAnchor="middle"
          style={{
            fontSize: 10.5,
            fill: 'var(--text-muted, #64748B)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
          }}
        >
          Confidence →
        </text>

        {/* Bubbles */}
        {points.map(pt => (
          <g
            key={`pt-${pt.idx}-${id}`}
            style={{ cursor: onSelect ? 'pointer' : 'default' }}
            onClick={() => onSelect?.(pt.finding)}
          >
            <title>
              {pt.finding.label} · {pt.finding.chip.severity} ·{' '}
              {pt.finding.chip.pct !== null
                ? `${pt.finding.chip.pct}% confidence`
                : 'confidence n/a'}
            </title>
            <circle cx={pt.x} cy={pt.y} r={pt.r + 4} fill={pt.color} opacity={0.12} />
            <circle
              cx={pt.x}
              cy={pt.y}
              r={pt.r}
              fill={pt.color}
              opacity={0.92}
              stroke="#FFFFFF"
              strokeWidth={2}
            />
            {pt.finding.kind === 'compound_pattern' ? (
              <text
                x={pt.x}
                y={pt.y + 4}
                textAnchor="middle"
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  fill: '#FFFFFF',
                  pointerEvents: 'none',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                ◆
              </text>
            ) : null}
          </g>
        ))}
      </svg>

      <div
        style={{
          fontSize: 11,
          color: 'var(--text-muted, #64748B)',
          textAlign: 'center',
          marginTop: 2,
          lineHeight: 1.5,
        }}
      >
        Click a finding to open its audit trail · ◆ compound failure patterns · ○ individual biases
      </div>
    </div>
  );
}
