'use client';

/**
 * Founder OS dynamic visualizations (RATIFIED 2026-05-05 follow-up).
 *
 * Five components that turn the OS tab from a checklist into a motivational
 * dashboard:
 *   - StreakHeatmap — 91-day GitHub-style calendar grid
 *   - CognitiveTrendChart — line chart of deep work + reading minutes
 *   - PillarAdherenceRadar — 6-axis radar of pillar adherence
 *   - CompoundMathCallout — visceral asymmetric-arbitrage stat
 *   - SkillTimeline — quarterly visual track of skill acquisition
 *
 * All pure SVG (no charting library) — keeps the bundle lean and gives
 * precise visual control. Each respects prefers-reduced-motion.
 */

import { useMemo } from 'react';
import {
  TrendingUp,
  Flame,
  BookOpen,
  Activity,
  Brain,
  Shield,
  Target,
  Cpu,
} from 'lucide-react';

export interface CheckinRecord {
  date: string; // YYYY-MM-DD
  sfcZero: boolean;
  deepWorkHours: number;
  deepReadingMinutes: number;
  exercise: boolean;
  meditation: boolean;
}

// =============================================================================
// 1. STREAK HEATMAP — 91-day GitHub-style calendar grid (7 rows × 13 weeks)
// =============================================================================

interface StreakHeatmapProps {
  checkins: CheckinRecord[];
}

/** Local YYYY-MM-DD that respects the user's timezone, not UTC. */
function todayLocalISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function shiftDateISO(dateISO: string, days: number): string {
  const d = new Date(dateISO + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dayOfWeek(dateISO: string): number {
  // 0=Sunday, 6=Saturday — anchored to local time.
  return new Date(dateISO + 'T00:00:00').getDay();
}

export function StreakHeatmap({ checkins }: StreakHeatmapProps) {
  const map = useMemo(() => {
    const m = new Map<string, CheckinRecord>();
    for (const c of checkins) m.set(c.date, c);
    return m;
  }, [checkins]);

  // 13 weeks = 91 days, ending today.
  const cells = useMemo(() => {
    const today = todayLocalISO();
    const out: Array<{ date: string; checkin: CheckinRecord | null; isToday: boolean }> = [];
    for (let i = 90; i >= 0; i--) {
      const date = shiftDateISO(today, -i);
      out.push({ date, checkin: map.get(date) ?? null, isToday: i === 0 });
    }
    return out;
  }, [map]);

  // Group into 13 columns of 7 days each, aligned so today is at the bottom-right.
  // We start with a partial week if today isn't Saturday.
  const todayDOW = dayOfWeek(todayLocalISO());
  const columns: Array<Array<{ date: string; checkin: CheckinRecord | null; isToday: boolean } | null>> = [];
  // Pad-out the trailing column so today aligns with its real day-of-week.
  const queue = [...cells];
  // Build columns from oldest to newest.
  const firstCol: Array<typeof cells[number] | null> = [];
  // First column: pad with nulls until the first cell's day-of-week aligns
  const firstDOW = dayOfWeek(queue[0].date);
  for (let i = 0; i < firstDOW; i++) firstCol.push(null);
  while (queue.length > 0 && firstCol.length < 7) firstCol.push(queue.shift()!);
  columns.push(firstCol);
  while (queue.length > 0) {
    const col: Array<typeof cells[number] | null> = [];
    while (queue.length > 0 && col.length < 7) col.push(queue.shift()!);
    while (col.length < 7) col.push(null);
    columns.push(col);
  }
  // Right-pad the last column so today shows at its DOW row.
  const lastCol = columns[columns.length - 1];
  while (lastCol.length < 7) lastCol.push(null);
  // Mark trailing nulls (after today's DOW) so they render empty.
  for (let r = todayDOW + 1; r < 7; r++) lastCol[r] = null;

  const cellSize = 14;
  const cellGap = 3;
  const labelHeight = 16;
  const width = columns.length * (cellSize + cellGap);
  const height = 7 * (cellSize + cellGap) + labelHeight;

  // Day labels — show Mon, Wed, Fri only.
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div
      className="card"
      style={{ borderLeft: '3px solid var(--accent-primary)' }}
    >
      <div className="card-body">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Flame size={15} style={{ color: 'var(--accent-primary)' }} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
            }}
          >
            91-day discipline heatmap
          </span>
        </div>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 700,
            margin: 0,
            color: 'var(--text-primary)',
            marginBottom: 14,
          }}
        >
          One green square per day you stayed disciplined.
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <svg
            width={width + 30}
            height={height}
            style={{ display: 'block', minWidth: width + 30 }}
            role="img"
            aria-label="91-day discipline heatmap"
          >
            {/* Day-of-week labels */}
            {[1, 3, 5].map(r => (
              <text
                key={r}
                x={0}
                y={labelHeight + r * (cellSize + cellGap) + cellSize - 3}
                fontSize={9}
                fill="var(--text-muted)"
              >
                {dayLabels[r]}
              </text>
            ))}

            {columns.map((col, ci) =>
              col.map((cell, ri) => {
                if (!cell) return null;
                const x = 24 + ci * (cellSize + cellGap);
                const y = labelHeight + ri * (cellSize + cellGap);
                const c = cell.checkin;
                const fill = !c
                  ? 'var(--bg-tertiary)'
                  : c.sfcZero && c.deepWorkHours >= 2
                    ? 'var(--accent-primary)'
                    : c.sfcZero
                      ? 'color-mix(in srgb, var(--accent-primary) 60%, transparent)'
                      : 'color-mix(in srgb, var(--error) 50%, transparent)';
                const opacity = c
                  ? c.sfcZero
                    ? 0.4 + Math.min(c.deepWorkHours / 6, 1) * 0.6
                    : 0.6
                  : 1;
                const tooltip = c
                  ? `${cell.date} · ${c.sfcZero ? 'SFC=0 ✓' : 'SFC break ✗'} · ${c.deepWorkHours}h deep work · ${c.deepReadingMinutes}m reading`
                  : `${cell.date} · no checkin`;
                return (
                  <rect
                    key={`${ci}-${ri}`}
                    x={x}
                    y={y}
                    width={cellSize}
                    height={cellSize}
                    rx={3}
                    ry={3}
                    fill={fill}
                    fillOpacity={opacity}
                    stroke={cell.isToday ? 'var(--text-primary)' : 'transparent'}
                    strokeWidth={cell.isToday ? 1.5 : 0}
                  >
                    <title>{tooltip}</title>
                  </rect>
                );
              })
            )}
          </svg>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginTop: 12,
            fontSize: 11,
            color: 'var(--text-muted)',
          }}
        >
          <span style={{ fontWeight: 600 }}>Less</span>
          <div style={{ display: 'flex', gap: 3 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--bg-tertiary)' }} />
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                background: 'color-mix(in srgb, var(--accent-primary) 30%, transparent)',
              }}
            />
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                background: 'color-mix(in srgb, var(--accent-primary) 60%, transparent)',
              }}
            />
            <div style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--accent-primary)' }} />
          </div>
          <span style={{ fontWeight: 600 }}>More</span>
          <span style={{ marginLeft: 'auto' }}>
            Green = SFC=0 + deep work · Faded red = SFC break · Today is outlined
          </span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// 2. COGNITIVE TREND CHART — line chart of deep work + reading minutes (last 30 days)
// =============================================================================

interface CognitiveTrendChartProps {
  checkins: CheckinRecord[];
}

export function CognitiveTrendChart({ checkins }: CognitiveTrendChartProps) {
  const series = useMemo(() => {
    const today = todayLocalISO();
    const map = new Map<string, CheckinRecord>();
    for (const c of checkins) map.set(c.date, c);
    const points: Array<{ date: string; deepWorkH: number; readingMin: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const d = shiftDateISO(today, -i);
      const c = map.get(d);
      points.push({
        date: d,
        deepWorkH: c?.deepWorkHours ?? 0,
        readingMin: c?.deepReadingMinutes ?? 0,
      });
    }
    return points;
  }, [checkins]);

  const padding = { top: 16, right: 14, bottom: 26, left: 32 };
  const chartW = 520;
  const chartH = 140;
  const innerW = chartW - padding.left - padding.right;
  const innerH = chartH - padding.top - padding.bottom;

  const maxDeepWork = Math.max(8, ...series.map(s => s.deepWorkH));
  const maxReading = Math.max(60, ...series.map(s => s.readingMin));
  const totalDeepWork = series.reduce((s, p) => s + p.deepWorkH, 0);
  const totalReading = series.reduce((s, p) => s + p.readingMin, 0);
  const stepX = innerW / Math.max(series.length - 1, 1);

  const deepWorkPath = series
    .map((p, i) => {
      const x = padding.left + i * stepX;
      const y = padding.top + innerH - (p.deepWorkH / maxDeepWork) * innerH;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  const readingPath = series
    .map((p, i) => {
      const x = padding.left + i * stepX;
      const y = padding.top + innerH - (p.readingMin / maxReading) * innerH;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="card">
      <div className="card-body">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <TrendingUp size={15} style={{ color: 'var(--accent-primary)' }} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
            }}
          >
            Cognitive trend · 30 days
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 14,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            What you actually invested
          </h3>
          <div
            style={{
              display: 'flex',
              gap: 14,
              fontSize: 12,
              color: 'var(--text-secondary)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <span>
              <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>●</span>{' '}
              {totalDeepWork.toFixed(0)}h deep work
            </span>
            <span>
              <span style={{ color: 'var(--info)', fontWeight: 700 }}>●</span>{' '}
              {Math.round(totalReading / 60)}h reading
            </span>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <svg
            width={chartW}
            height={chartH}
            style={{ display: 'block', minWidth: chartW }}
            role="img"
            aria-label="Cognitive trend chart"
          >
            {/* Y axis grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map(t => {
              const y = padding.top + innerH * (1 - t);
              return (
                <line
                  key={t}
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + innerW}
                  y2={y}
                  stroke="var(--border-color)"
                  strokeDasharray="2 3"
                  strokeOpacity={0.6}
                />
              );
            })}

            {/* Deep work line */}
            <path d={deepWorkPath} fill="none" stroke="var(--accent-primary)" strokeWidth={2} />
            {/* Reading line */}
            <path d={readingPath} fill="none" stroke="var(--info)" strokeWidth={2} strokeOpacity={0.8} />

            {/* Today marker */}
            {(() => {
              const i = series.length - 1;
              const x = padding.left + i * stepX;
              const yDw = padding.top + innerH - (series[i].deepWorkH / maxDeepWork) * innerH;
              const yR = padding.top + innerH - (series[i].readingMin / maxReading) * innerH;
              return (
                <>
                  <circle cx={x} cy={yDw} r={3.5} fill="var(--accent-primary)" />
                  <circle cx={x} cy={yR} r={3.5} fill="var(--info)" />
                </>
              );
            })()}

            {/* X axis labels */}
            <text
              x={padding.left}
              y={chartH - 6}
              fontSize={10}
              fill="var(--text-muted)"
            >
              30 days ago
            </text>
            <text
              x={padding.left + innerW}
              y={chartH - 6}
              fontSize={10}
              fill="var(--text-muted)"
              textAnchor="end"
            >
              today
            </text>

            {/* Y axis label */}
            <text
              x={4}
              y={padding.top + 4}
              fontSize={10}
              fill="var(--text-muted)"
            >
              {Math.ceil(maxDeepWork)}h
            </text>
            <text
              x={4}
              y={padding.top + innerH}
              fontSize={10}
              fill="var(--text-muted)"
            >
              0
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// 3. PILLAR ADHERENCE RADAR — 6-axis polygon (last 30 days)
// =============================================================================

interface PillarAdherenceRadarProps {
  checkins: CheckinRecord[];
  /** Counts of "qualifying" days for the four non-binary pillars. */
  longFormPiecesLast30Days: number;
  skillsInProgressOrComplete: number;
  weeklyReviewsLast4Weeks: number;
}

export function PillarAdherenceRadar({
  checkins,
  longFormPiecesLast30Days,
  skillsInProgressOrComplete,
  weeklyReviewsLast4Weeks,
}: PillarAdherenceRadarProps) {
  const last30 = useMemo(() => {
    const today = todayLocalISO();
    const cutoff = shiftDateISO(today, -29);
    return checkins.filter(c => c.date >= cutoff && c.date <= today);
  }, [checkins]);

  const sfcZeroPct = last30.length === 0 ? 0 : last30.filter(c => c.sfcZero).length / 30;
  const longFormPct = Math.min(longFormPiecesLast30Days / 8, 1); // 2 pieces/week target
  // Active recall is captured implicitly when the user logs a long-form piece WITH a summary
  // (the API requires it). So we treat long-form pieces logged as "active recall happened."
  const activeRecallPct = longFormPct;
  // AI orchestration — proxy is "user has at least 1 in_progress or complete skill"
  const orchestrationPct = Math.min(skillsInProgressOrComplete / 2, 1);
  const distressPct =
    last30.length === 0
      ? 0
      : last30.filter(c => c.exercise || c.meditation).length / 30;
  // Internal locus — proxy is weekly reviews completed (forces the reflection)
  const locusPct = Math.min(weeklyReviewsLast4Weeks / 4, 1);

  const axes = [
    { id: 'neuro', label: 'Neuro', value: sfcZeroPct, icon: Shield },
    { id: 'longform', label: 'Long-form', value: longFormPct, icon: BookOpen },
    { id: 'recall', label: 'Recall', value: activeRecallPct, icon: Brain },
    { id: 'orchestrate', label: 'AI', value: orchestrationPct, icon: Cpu },
    { id: 'distress', label: 'Distress', value: distressPct, icon: Activity },
    { id: 'locus', label: 'Locus', value: locusPct, icon: Target },
  ];

  const cx = 130;
  const cy = 130;
  const radius = 90;
  const numAxes = axes.length;

  function pointAt(value: number, axisIndex: number): { x: number; y: number } {
    // Start at the top (12 o'clock), go clockwise.
    const angle = (Math.PI * 2 * axisIndex) / numAxes - Math.PI / 2;
    const r = radius * Math.max(0, Math.min(1, value));
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    };
  }

  const polyPoints = axes
    .map((a, i) => {
      const p = pointAt(a.value, i);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(' ');

  // Concentric reference rings at 0.25, 0.5, 0.75, 1.0
  const rings = [0.25, 0.5, 0.75, 1.0];

  const overallAdherence = axes.reduce((s, a) => s + a.value, 0) / numAxes;

  return (
    <div className="card">
      <div className="card-body">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Activity size={15} style={{ color: 'var(--accent-primary)' }} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
            }}
          >
            Pillar adherence · 30 days
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 14,
            flexWrap: 'wrap',
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Six pillars · how the OS is holding
          </h3>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: overallAdherence >= 0.7 ? 'var(--accent-primary)' : overallAdherence >= 0.5 ? 'var(--warning)' : 'var(--error)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {Math.round(overallAdherence * 100)}% overall
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <svg width={280} height={260} role="img" aria-label="Pillar adherence radar chart">
            {/* Concentric rings */}
            {rings.map(r => (
              <circle
                key={r}
                cx={cx}
                cy={cy}
                r={radius * r}
                fill="none"
                stroke="var(--border-color)"
                strokeOpacity={0.5}
                strokeDasharray="2 3"
              />
            ))}
            {/* Spokes */}
            {axes.map((_, i) => {
              const p = pointAt(1, i);
              return (
                <line
                  key={i}
                  x1={cx}
                  y1={cy}
                  x2={p.x}
                  y2={p.y}
                  stroke="var(--border-color)"
                  strokeOpacity={0.5}
                />
              );
            })}
            {/* Filled polygon */}
            <polygon
              points={polyPoints}
              fill="var(--accent-primary)"
              fillOpacity={0.18}
              stroke="var(--accent-primary)"
              strokeWidth={2}
            />
            {/* Axis dots */}
            {axes.map((a, i) => {
              const p = pointAt(a.value, i);
              return (
                <circle
                  key={a.id}
                  cx={p.x}
                  cy={p.y}
                  r={4}
                  fill="var(--accent-primary)"
                />
              );
            })}
            {/* Axis labels */}
            {axes.map((a, i) => {
              const p = pointAt(1.18, i);
              return (
                <text
                  key={a.id}
                  x={p.x}
                  y={p.y}
                  fontSize={10}
                  fontWeight={700}
                  fill="var(--text-primary)"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {a.label}
                </text>
              );
            })}
          </svg>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 6,
            marginTop: 10,
            fontSize: 11,
            color: 'var(--text-secondary)',
          }}
        >
          {axes.map(a => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{a.label}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                {Math.round(a.value * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// 4. COMPOUND MATH CALLOUT — visceral asymmetric-arbitrage stat
// =============================================================================

interface CompoundMathCalloutProps {
  /** Number of SFC-zero days logged so far. */
  sfcZeroDays: number;
  /** Total deep work hours logged. */
  totalDeepWorkHours: number;
  /** Total deep reading minutes logged. */
  totalReadingMinutes: number;
}

export function CompoundMathCallout({
  sfcZeroDays,
  totalDeepWorkHours,
  totalReadingMinutes,
}: CompoundMathCalloutProps) {
  // Conservative estimate: average teen consumes ~3 hours/day on SFC platforms.
  // The "saved" hours are an opportunity cost — they're hours you could have
  // either deep-worked OR done other high-leverage things instead.
  const SFC_HOURS_PER_DAY_AVG = 3;
  const hoursSaved = sfcZeroDays * SFC_HOURS_PER_DAY_AVG;
  const yearsCompounded = sfcZeroDays / 365;
  const totalReadingHours = Math.round(totalReadingMinutes / 60);

  return (
    <div
      className="card"
      style={{
        background:
          'linear-gradient(135deg, color-mix(in srgb, var(--accent-primary) 8%, transparent) 0%, color-mix(in srgb, var(--accent-primary) 1%, transparent) 100%)',
        borderLeft: '3px solid var(--accent-primary)',
      }}
    >
      <div className="card-body">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <TrendingUp size={15} style={{ color: 'var(--accent-primary)' }} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--accent-primary)',
            }}
          >
            Asymmetric arbitrage · compounded
          </span>
        </div>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            margin: 0,
            color: 'var(--text-primary)',
            lineHeight: 1.3,
            marginBottom: 14,
          }}
        >
          The gap you&apos;re building over peers who didn&apos;t refuse to crash.
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 14,
            marginBottom: 14,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: 'var(--accent-primary)',
                fontFamily: "'JetBrains Mono', monospace",
                lineHeight: 1.05,
              }}
            >
              {hoursSaved.toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: 4 }}>
              Hours reclaimed from SFC <br />
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                ({sfcZeroDays} SFC-zero days × 3 hrs/day avg peer-time-on-platform)
              </span>
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: 'var(--text-primary)',
                fontFamily: "'JetBrains Mono', monospace",
                lineHeight: 1.05,
              }}
            >
              {totalDeepWorkHours.toFixed(0)}h
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: 4 }}>
              Deep work invested <br />
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                Building the cognitive moat that closes Phase 1
              </span>
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: 'var(--text-primary)',
                fontFamily: "'JetBrains Mono', monospace",
                lineHeight: 1.05,
              }}
            >
              {totalReadingHours}h
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: 4 }}>
              Long-form reading <br />
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                Primary-source neural architecture
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '12px 14px',
            background: 'var(--bg-card)',
            border: '1px solid color-mix(in srgb, var(--accent-primary) 30%, transparent)',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            color: 'var(--text-primary)',
            lineHeight: 1.55,
          }}
        >
          {sfcZeroDays === 0 ? (
            <>
              <strong>The arbitrage hasn&apos;t started yet.</strong> Log day 1 below. The math
              compounds DAILY — the only thing you have to do is refuse to scroll.
            </>
          ) : sfcZeroDays < 30 ? (
            <>
              <strong>You&apos;re {30 - sfcZeroDays} days from dopaminergic baseline reset.</strong>{' '}
              At 30 SFC-zero days, the variable-reward conditioning starts to break and your
              prefrontal cortex regains its normal executive function. The first 30 days are
              the hardest.
            </>
          ) : sfcZeroDays < 90 ? (
            <>
              <strong>Baseline reset zone.</strong> Your dopaminergic baseline has reset; the
              cravings are mostly residual. Past 90 days the discipline stops feeling like
              effort and starts feeling like identity.
            </>
          ) : (
            <>
              <strong>{yearsCompounded.toFixed(1)} years of compound advantage.</strong> The
              gap you&apos;ve built over peers who didn&apos;t refuse to crash is now structural.
              By 2032, this is the difference between &quot;built £10M ARR&quot; and &quot;tried
              and got distracted.&quot;
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// 5. SKILL TIMELINE — quarterly visual track
// =============================================================================

interface SkillItem {
  id: string;
  quarter: string;
  skill: string;
  status: 'planned' | 'in_progress' | 'complete';
}

interface SkillTimelineProps {
  skills: SkillItem[];
}

export function SkillTimeline({ skills }: SkillTimelineProps) {
  const grouped = useMemo(() => {
    const m = new Map<string, SkillItem[]>();
    for (const s of skills) {
      const arr = m.get(s.quarter) ?? [];
      arr.push(s);
      m.set(s.quarter, arr);
    }
    // Sort quarters by string (works for "Q1 2026", "Q2 2026", etc.).
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [skills]);

  if (grouped.length === 0) return null;

  return (
    <div className="card">
      <div className="card-body">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Target size={15} style={{ color: 'var(--accent-primary)' }} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
            }}
          >
            Skill acquisition timeline
          </span>
        </div>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 700,
            margin: 0,
            color: 'var(--text-primary)',
            marginBottom: 14,
          }}
        >
          One irreplaceable skill per quarter
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {grouped.map(([quarter, items]) => (
            <div
              key={quarter}
              style={{
                display: 'flex',
                gap: 12,
                padding: '10px 12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: 'var(--text-muted)',
                  minWidth: 56,
                  paddingTop: 2,
                }}
              >
                {quarter}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {items.map(s => (
                  <div
                    key={s.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background:
                          s.status === 'complete'
                            ? 'var(--accent-primary)'
                            : s.status === 'in_progress'
                              ? 'var(--warning)'
                              : 'var(--text-muted)',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                      {s.skill}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color:
                          s.status === 'complete'
                            ? 'var(--accent-primary)'
                            : s.status === 'in_progress'
                              ? 'var(--warning)'
                              : 'var(--text-muted)',
                        marginLeft: 'auto',
                      }}
                    >
                      {s.status === 'in_progress' ? 'in progress' : s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
