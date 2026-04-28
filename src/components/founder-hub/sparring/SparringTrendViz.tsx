'use client';

/**
 * SparringTrendViz — visualises Sparring Room session history.
 *
 * Three panels:
 *   1. DQI uptrend line chart — actual scores + 5-rep rolling average,
 *      color-coded by grade, with the key milestones (best/worst).
 *   2. Per-dimension trend bars — for each of the 11 grading dimensions,
 *      shows the 5-rep rolling average + delta vs first-5-reps baseline.
 *      Identifies the dimensions that are improving fastest AND the ones
 *      that are stuck or regressing.
 *   3. Per-persona × per-mode heatmap — average DQI per persona × mode
 *      cell, so the founder can see which buyer types they convert well
 *      and which need more practice.
 *
 * All pure SVG, no charting library. Respects prefers-reduced-motion.
 *
 * Locked: 2026-04-28.
 */

import { useMemo } from 'react';
import { TrendingUp, Trophy, Activity } from 'lucide-react';
import {
  GRADING_DIMENSIONS,
  BUYER_PERSONAS,
  SCENARIO_MODES,
  type BuyerPersonaId,
  type ScenarioMode,
  type GradingDimensionId,
} from './sparring-room-data';

interface HistoryEntry {
  sessionId: string;
  dateISO: string;
  personaId: BuyerPersonaId;
  mode: ScenarioMode;
  salesDqi: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  isWarmContext: boolean;
  dimensions?: Record<GradingDimensionId, number>;
  fillerCount?: number;
}

interface Props {
  history: HistoryEntry[];
}

// ─── Helpers ──────────────────────────────────────────────────────

function gradeColor(grade: 'A' | 'B' | 'C' | 'D' | 'F'): string {
  return grade === 'A'
    ? '#16A34A'
    : grade === 'B'
      ? '#22C55E'
      : grade === 'C'
        ? '#EAB308'
        : grade === 'D'
          ? '#F97316'
          : '#DC2626';
}

function dqiColor(dqi: number): string {
  if (dqi >= 85) return '#16A34A';
  if (dqi >= 70) return '#22C55E';
  if (dqi >= 55) return '#EAB308';
  if (dqi >= 40) return '#F97316';
  return '#DC2626';
}

function rollingAverage(values: number[], window: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    out.push(slice.reduce((s, v) => s + v, 0) / slice.length);
  }
  return out;
}

// ─── Main component ───────────────────────────────────────────────

export function SparringTrendViz({ history }: Props) {
  if (history.length === 0) {
    return (
      <div
        style={{
          padding: 16,
          background: 'var(--bg-card)',
          border: '1px dashed var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: 13,
        }}
      >
        <Activity size={20} style={{ marginBottom: 6, opacity: 0.5 }} />
        <div>Run your first rep to start tracking your Sales DQI uptrend.</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <DqiUptrendCard history={history} />
      {history.length >= 2 && <DimensionTrendsCard history={history} />}
      {history.length >= 3 && <PersonaModeHeatmap history={history} />}
    </div>
  );
}

// ─── Panel 1: DQI uptrend line chart ──────────────────────────────

function DqiUptrendCard({ history }: { history: HistoryEntry[] }) {
  const stats = useMemo(() => {
    const dqis = history.map(h => h.salesDqi);
    const rolling = rollingAverage(dqis, 5);
    const best = Math.max(...dqis);
    const bestIdx = dqis.indexOf(best);
    const recent = history.slice(-5);
    const recentAvg = recent.reduce((s, h) => s + h.salesDqi, 0) / recent.length;
    const earliest = history.slice(0, Math.min(5, history.length));
    const earliestAvg = earliest.reduce((s, h) => s + h.salesDqi, 0) / earliest.length;
    const lift = recentAvg - earliestAvg;
    return { dqis, rolling, best, bestIdx, recentAvg, earliestAvg, lift };
  }, [history]);

  // SVG layout
  const W = 720;
  const H = 220;
  const padL = 36;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const xStep = history.length > 1 ? chartW / (history.length - 1) : chartW / 2;

  const dqiPoints = stats.dqis.map((v, i) => ({
    x: padL + (history.length === 1 ? chartW / 2 : i * xStep),
    y: padT + chartH * (1 - v / 100),
  }));

  const rollingPoints = stats.rolling.map((v, i) => ({
    x: padL + (history.length === 1 ? chartW / 2 : i * xStep),
    y: padT + chartH * (1 - v / 100),
  }));

  const dqiPath =
    dqiPoints.length > 1 ? `M ${dqiPoints.map(p => `${p.x},${p.y}`).join(' L ')}` : '';

  const rollingPath =
    rollingPoints.length > 1 ? `M ${rollingPoints.map(p => `${p.x},${p.y}`).join(' L ')}` : '';

  // Grade-band horizontal markers (85, 70, 55, 40)
  const bands = [
    { dqi: 85, label: 'A', color: '#16A34A' },
    { dqi: 70, label: 'B', color: '#22C55E' },
    { dqi: 55, label: 'C', color: '#EAB308' },
    { dqi: 40, label: 'D', color: '#F97316' },
  ];

  return (
    <div
      style={{
        padding: 16,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div
          className="section-heading"
          style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <TrendingUp size={12} /> Sales DQI · uptrend across {history.length} reps
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-muted)' }}>
          <Stat label="Best" value={`${stats.best}`} color={dqiColor(stats.best)} />
          <Stat
            label="Last 5 avg"
            value={`${Math.round(stats.recentAvg)}`}
            color={dqiColor(stats.recentAvg)}
          />
          {history.length >= 6 && (
            <Stat
              label="Lift vs first 5"
              value={`${stats.lift > 0 ? '+' : ''}${Math.round(stats.lift)}`}
              color={stats.lift >= 0 ? '#16A34A' : '#DC2626'}
            />
          )}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', maxHeight: 260 }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Y-axis grade bands */}
        {bands.map(b => {
          const y = padT + chartH * (1 - b.dqi / 100);
          return (
            <g key={b.label}>
              <line
                x1={padL}
                x2={W - padR}
                y1={y}
                y2={y}
                stroke={b.color}
                strokeOpacity={0.18}
                strokeDasharray="3 3"
              />
              <text
                x={padL - 6}
                y={y + 3}
                fontSize="9"
                fill={b.color}
                opacity={0.7}
                textAnchor="end"
                fontWeight="700"
              >
                {b.label}·{b.dqi}
              </text>
            </g>
          );
        })}

        {/* Y-axis labels at 0 and 100 */}
        <text x={padL - 6} y={padT + 3} fontSize="9" fill="var(--text-muted)" textAnchor="end">
          100
        </text>
        <text
          x={padL - 6}
          y={padT + chartH + 3}
          fontSize="9"
          fill="var(--text-muted)"
          textAnchor="end"
        >
          0
        </text>

        {/* X-axis baseline */}
        <line
          x1={padL}
          x2={W - padR}
          y1={padT + chartH}
          y2={padT + chartH}
          stroke="var(--border-color)"
        />

        {/* Rolling average line (dashed) */}
        {rollingPath && (
          <path
            d={rollingPath}
            fill="none"
            stroke="#6366F1"
            strokeOpacity={0.5}
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
        )}

        {/* Actual DQI line */}
        {dqiPath && (
          <path d={dqiPath} fill="none" stroke="#16A34A" strokeOpacity={0.4} strokeWidth={1.5} />
        )}

        {/* Data points */}
        {dqiPoints.map((p, i) => {
          const entry = history[i];
          const isBest = i === stats.bestIdx;
          return (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={isBest ? 5 : 3.5}
                fill={gradeColor(entry.grade)}
                stroke={isBest ? '#fff' : 'transparent'}
                strokeWidth={isBest ? 1.5 : 0}
              >
                <title>
                  {`Rep ${i + 1} · ${entry.salesDqi} (${entry.grade}) · ${entry.personaId.replace(/_/g, ' ')} · ${entry.mode.replace(/_/g, ' ')} · ${new Date(entry.dateISO).toLocaleDateString()}`}
                </title>
              </circle>
              {isBest && (
                <text
                  x={p.x}
                  y={p.y - 9}
                  fontSize="9"
                  fill="#16A34A"
                  textAnchor="middle"
                  fontWeight="700"
                >
                  best
                </text>
              )}
            </g>
          );
        })}

        {/* X-axis count labels (start, mid, end) */}
        <text x={padL} y={H - padB / 3} fontSize="9" fill="var(--text-muted)" textAnchor="start">
          Rep 1
        </text>
        <text x={W - padR} y={H - padB / 3} fontSize="9" fill="var(--text-muted)" textAnchor="end">
          Rep {history.length}
        </text>
      </svg>

      <div
        style={{
          display: 'flex',
          gap: 14,
          marginTop: 8,
          fontSize: 11,
          color: 'var(--text-muted)',
          flexWrap: 'wrap',
        }}
      >
        <LegendDot color="#16A34A" label="DQI per rep (color = grade)" />
        <LegendDot color="#6366F1" label="5-rep rolling average" dashed />
      </div>
    </div>
  );
}

// ─── Panel 2: Per-dimension trends ────────────────────────────────

function DimensionTrendsCard({ history }: { history: HistoryEntry[] }) {
  const dims = useMemo(() => {
    const entriesWithDims = history.filter(h => h.dimensions);
    if (entriesWithDims.length < 2) return [];

    return GRADING_DIMENSIONS.map(dim => {
      const scores = entriesWithDims.map(h => h.dimensions![dim.id] ?? 0);
      const recent = scores.slice(-5);
      const earliest = scores.slice(0, Math.min(5, scores.length));
      const recentAvg = recent.reduce((s, v) => s + v, 0) / recent.length;
      const earliestAvg = earliest.reduce((s, v) => s + v, 0) / earliest.length;
      const lift = recentAvg - earliestAvg;
      return {
        ...dim,
        recentAvg,
        earliestAvg,
        lift,
        all: scores,
      };
    }).sort((a, b) => b.lift - a.lift);
  }, [history]);

  if (dims.length === 0) {
    return (
      <div
        style={{
          padding: 14,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          fontSize: 12,
          color: 'var(--text-muted)',
        }}
      >
        Run another rep to unlock per-dimension trend tracking.
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 14,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div className="section-heading" style={{ marginBottom: 10 }}>
        Per-dimension trend · sorted by lift (last 5 vs first 5)
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 8,
        }}
      >
        {dims.map(d => {
          const sourceColor =
            d.source === 'maalouf'
              ? '#DC2626'
              : d.source === 'satyam'
                ? '#0EA5E9'
                : d.source === 'di_discipline'
                  ? '#16A34A'
                  : d.source === 'kahneman'
                    ? '#F59E0B'
                    : '#A78BFA';
          const recentPct = (d.recentAvg / 5) * 100;
          const earliestPct = (d.earliestAvg / 5) * 100;
          const liftSign = d.lift > 0.2 ? '+' : '';
          const liftColor =
            d.lift > 0.2 ? '#16A34A' : d.lift < -0.2 ? '#DC2626' : 'var(--text-muted)';
          return (
            <div
              key={d.id}
              style={{
                padding: 10,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {d.label}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: liftColor,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {liftSign}
                  {d.lift.toFixed(1)}
                </span>
              </div>
              {/* Two stacked bars: earliest avg and recent avg */}
              <div
                style={{
                  position: 'relative',
                  height: 8,
                  background: 'var(--bg-tertiary)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: `${earliestPct}%`,
                    background: sourceColor,
                    opacity: 0.25,
                  }}
                  title={`First 5 avg: ${d.earliestAvg.toFixed(1)}/5`}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: `${recentPct}%`,
                    background: sourceColor,
                    opacity: 0.85,
                    transition: 'width 0.3s',
                  }}
                  title={`Last 5 avg: ${d.recentAvg.toFixed(1)}/5`}
                />
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  marginTop: 3,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {d.earliestAvg.toFixed(1)} → {d.recentAvg.toFixed(1)}{' '}
                <span style={{ marginLeft: 6, opacity: 0.7 }}>· {d.source.replace('_', ' ')}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Panel 3: Persona × Mode heatmap ──────────────────────────────

function PersonaModeHeatmap({ history }: { history: HistoryEntry[] }) {
  const cells = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    for (const h of history) {
      const key = `${h.personaId}::${h.mode}`;
      const cur = map.get(key) || { sum: 0, count: 0 };
      cur.sum += h.salesDqi;
      cur.count += 1;
      map.set(key, cur);
    }
    return map;
  }, [history]);

  // Only show personas + modes the user has actually practiced (not the full grid).
  const practicedPersonas = useMemo(() => {
    const set = new Set<BuyerPersonaId>(history.map(h => h.personaId));
    return BUYER_PERSONAS.filter(p => set.has(p.id));
  }, [history]);

  const practicedModes = useMemo(() => {
    const set = new Set<ScenarioMode>(history.map(h => h.mode));
    return SCENARIO_MODES.filter(m => set.has(m.id));
  }, [history]);

  if (practicedPersonas.length === 0 || practicedModes.length === 0) return null;

  return (
    <div
      style={{
        padding: 14,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        overflowX: 'auto',
      }}
    >
      <div
        className="section-heading"
        style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <Trophy size={12} /> Persona × Mode performance
      </div>
      <table style={{ borderCollapse: 'separate', borderSpacing: 4, fontSize: 11 }}>
        <thead>
          <tr>
            <th
              style={{
                textAlign: 'left',
                padding: '4px 8px',
                fontWeight: 600,
                color: 'var(--text-muted)',
              }}
            >
              Persona
            </th>
            {practicedModes.map(m => (
              <th
                key={m.id}
                style={{
                  padding: '4px 8px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                {m.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {practicedPersonas.map(p => (
            <tr key={p.id}>
              <td
                style={{
                  padding: '6px 8px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: p.color,
                    marginRight: 6,
                  }}
                />
                {p.label}
              </td>
              {practicedModes.map(m => {
                const cell = cells.get(`${p.id}::${m.id}`);
                if (!cell) {
                  return (
                    <td
                      key={m.id}
                      style={{
                        padding: 6,
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        opacity: 0.4,
                      }}
                    >
                      —
                    </td>
                  );
                }
                const avg = Math.round(cell.sum / cell.count);
                const color = dqiColor(avg);
                return (
                  <td key={m.id} style={{ padding: 0 }}>
                    <div
                      style={{
                        padding: '8px 12px',
                        background: `${color}20`,
                        border: `1px solid ${color}55`,
                        borderRadius: 4,
                        textAlign: 'center',
                        minWidth: 56,
                      }}
                      title={`${cell.count} rep${cell.count === 1 ? '' : 's'} · avg ${avg}`}
                    >
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {avg}
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{cell.count}×</div>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Tiny helpers ─────────────────────────────────────────────────

function Stat(props: { label: string; value: string; color: string }) {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <span
        style={{
          fontSize: 10,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {props.label}
      </span>
      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: props.color,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {props.value}
      </span>
    </span>
  );
}

function LegendDot(props: { color: string; label: string; dashed?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span
        style={{
          display: 'inline-block',
          width: 18,
          height: 0,
          borderTop: `2px ${props.dashed ? 'dashed' : 'solid'} ${props.color}`,
        }}
      />
      <span>{props.label}</span>
    </span>
  );
}
