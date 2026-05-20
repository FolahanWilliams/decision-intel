/**
 * CounterfactualLiftChart — interactive bar chart of per-scenario DQI
 * lift, synced with the ScenarioSlider toggles below.
 * Locked 2026-05-20 (visual-deliverable rebuild).
 *
 * Per the Deep Research §4 chart-finding mapping:
 *   "Interactive sliders and scenario toggles are vastly superior to
 *    static tables for communicating alternate realities."
 *
 * This chart is the VISUAL component the DR mandated; the
 * ScenarioSlider below it is the INTERACTION component. When the user
 * toggles a scenario on, its bar fills with the accent-primary green;
 * when off, it shows as a hollow track. The cumulative projected DQI
 * floats above the bars as a horizontal goal-line.
 */

'use client';

import { useId } from 'react';
import type { CounterfactualScenario } from '@/lib/deliverable/types';
import { dqiColorFor, gradeFromScore } from '@/lib/utils/grade';

interface CounterfactualLiftChartProps {
  currentDqi: number;
  scenarios: CounterfactualScenario[];
  enabledIds: Set<string>;
}

export function CounterfactualLiftChart({
  currentDqi,
  scenarios,
  enabledIds,
}: CounterfactualLiftChartProps) {
  const id = useId();
  const width = 720;
  const height = 230;
  const PAD = { top: 28, right: 28, bottom: 56, left: 60 };
  const innerW = width - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;

  // Y-axis: 0-100 DQI scale
  const yFor = (v: number) => PAD.top + ((100 - v) / 100) * innerH;

  // Projected DQI = current + sum of enabled deltas
  const liftSum = scenarios.reduce(
    (acc, s) => (enabledIds.has(s.targetFindingId) ? acc + s.delta : acc),
    0
  );
  const projectedDqi = Math.min(100, currentDqi + liftSum);

  if (scenarios.length === 0) {
    return null;
  }

  // Bar layout
  const barCount = scenarios.length;
  const barSlot = innerW / barCount;
  const barWidth = Math.min(60, barSlot * 0.55);

  const projectedColor = dqiColorFor(projectedDqi);
  const grade = gradeFromScore(projectedDqi);

  return (
    <div
      style={{
        background: 'var(--bg-card, #FFFFFF)',
        border: '1px solid var(--border-color, #E2E8F0)',
        borderRadius: 12,
        padding: '14px 18px 6px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 4,
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
          Projected DQI lift per mitigation
        </div>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: 'var(--text-secondary, #475569)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          Current{' '}
          <strong style={{ color: 'var(--text-primary, #0F172A)' }}>
            {Math.round(currentDqi)}
          </strong>
          {' → '}
          With fixes{' '}
          <strong style={{ color: projectedColor }}>
            {Math.round(projectedDqi)} · {grade}
          </strong>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label="Counterfactual DQI lift per mitigation scenario"
      >
        {/* Y-axis gridlines + labels */}
        {[0, 25, 50, 75, 100].map(tick => (
          <g key={`grid-${tick}`}>
            <line
              x1={PAD.left}
              y1={yFor(tick)}
              x2={width - PAD.right}
              y2={yFor(tick)}
              stroke="var(--border-color, #E2E8F0)"
              strokeDasharray={tick === 0 ? undefined : '3 4'}
              strokeWidth={tick === 0 ? 1.2 : 1}
            />
            <text
              x={PAD.left - 8}
              y={yFor(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              style={{
                fontSize: 10.5,
                fill: 'var(--text-muted, #64748B)',
                fontVariantNumeric: 'tabular-nums',
                fontWeight: 600,
              }}
            >
              {tick}
            </text>
          </g>
        ))}

        {/* Current DQI dashed reference line */}
        <line
          x1={PAD.left}
          y1={yFor(currentDqi)}
          x2={width - PAD.right}
          y2={yFor(currentDqi)}
          stroke="var(--text-secondary, #475569)"
          strokeDasharray="5 4"
          strokeWidth={1.4}
        />
        <text
          x={width - PAD.right - 4}
          y={yFor(currentDqi) - 4}
          textAnchor="end"
          style={{
            fontSize: 10,
            fill: 'var(--text-secondary, #475569)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Now · {Math.round(currentDqi)}
        </text>

        {/* Projected DQI solid line (only when at least one scenario active) */}
        {liftSum > 0 ? (
          <>
            <line
              x1={PAD.left}
              y1={yFor(projectedDqi)}
              x2={width - PAD.right}
              y2={yFor(projectedDqi)}
              stroke={projectedColor}
              strokeWidth={2}
            />
            <text
              x={width - PAD.right - 4}
              y={yFor(projectedDqi) - 4}
              textAnchor="end"
              style={{
                fontSize: 10,
                fill: projectedColor,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Best · {Math.round(projectedDqi)}
            </text>
          </>
        ) : null}

        {/* Bars — one per scenario */}
        {scenarios.map((s, idx) => {
          const cx = PAD.left + barSlot * idx + barSlot / 2;
          const isOn = enabledIds.has(s.targetFindingId);
          // Bar extends from currentDqi up by s.delta points
          const yTop = yFor(Math.min(100, currentDqi + s.delta));
          const yBase = yFor(currentDqi);
          const barH = Math.max(2, yBase - yTop);
          // Truncate label
          const label =
            s.targetLabel.length > 16 ? s.targetLabel.slice(0, 14) + '…' : s.targetLabel;
          return (
            <g key={`bar-${id}-${idx}`}>
              {/* Background track */}
              <rect
                x={cx - barWidth / 2}
                y={yTop}
                width={barWidth}
                height={barH}
                rx={4}
                fill="var(--accent-primary, #16A34A)"
                opacity={0.14}
              />
              {/* Filled bar when enabled */}
              {isOn ? (
                <rect
                  x={cx - barWidth / 2}
                  y={yTop}
                  width={barWidth}
                  height={barH}
                  rx={4}
                  fill="var(--accent-primary, #16A34A)"
                  opacity={0.95}
                />
              ) : null}
              {/* Delta label above bar */}
              <text
                x={cx}
                y={yTop - 6}
                textAnchor="middle"
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  fill: isOn ? 'var(--accent-primary, #16A34A)' : 'var(--text-muted, #64748B)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                +{Math.round(s.delta)}
              </text>
              {/* X-axis bias label */}
              <text
                x={cx}
                y={height - PAD.bottom + 16}
                textAnchor="middle"
                style={{
                  fontSize: 10.5,
                  fill: 'var(--text-secondary, #475569)',
                  fontWeight: 600,
                }}
              >
                {label}
              </text>
            </g>
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
          Mitigation scenarios — toggle below to apply
        </text>
      </svg>
    </div>
  );
}
