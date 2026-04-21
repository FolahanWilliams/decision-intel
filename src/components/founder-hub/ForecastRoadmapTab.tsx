'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Route,
  CheckCircle2,
  AlertTriangle,
  Target,
  Sparkles,
  TrendingUp,
  Circle,
} from 'lucide-react';
import {
  BOOTSTRAP_MILESTONES,
  VC_MILESTONES,
  DECISION_OBJECTIVES,
  SEQUENCING,
  HONEST_TAKE,
  QUARTER_LABELS,
  LANE_META,
  type Milestone,
  type MilestoneLane,
  type Confidence,
  type DecisionObjective,
} from '@/lib/data/forecast-roadmap';

// ─── SVG layout constants ────────────────────────────────────────────────
// viewBox is 1000×440. Lanes sit at y=110 (bootstrap) and y=300 (vc).
// 4 quarter sections of 230px, centered at x = 155, 385, 615, 845.
const VIEW_W = 1000;
const VIEW_H = 440;
const LANE_X_CENTERS = [155, 385, 615, 845] as const;
const BOOTSTRAP_Y = 110;
const VC_Y = 300;
const QUARTER_BAND_Y = 400;
const MILESTONE_R = 16;

// Short two-line labels for SVG — full detail lives in the drawer.
const SHORT_LABELS: Record<string, [string, string]> = {
  'bs-q1': ['3 discovery', 'calls logged'],
  'bs-q2': ['2–3 design', 'partners signed'],
  'bs-q3': ['First paying', 'customer'],
  'bs-q4': ['5–8 customers', '£25–50k MRR'],
  'vc-q1': ['3 discovery', 'calls logged'],
  'vc-q2': ['YC app +', 'angel intros'],
  'vc-q3': ['YC interview', 'OR close'],
  'vc-q4': ['Post-raise', 'scale'],
};

const CONFIDENCE_META: Record<Confidence, { label: string; color: string; bg: string }> = {
  high: { label: 'High confidence', color: '#16A34A', bg: 'rgba(22, 163, 74, 0.14)' },
  medium: { label: 'Medium confidence', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.14)' },
  low: { label: 'Lower confidence', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.14)' },
};

export function ForecastRoadmapTab() {
  const [selectedId, setSelectedId] = useState<string>('bs-q1');
  const [activeObjectiveId, setActiveObjectiveId] = useState<string | null>(null);

  const selected = useMemo<Milestone>(() => {
    const all = [...BOOTSTRAP_MILESTONES, ...VC_MILESTONES];
    return all.find(m => m.id === selectedId) ?? all[0];
  }, [selectedId]);

  const activeObjective = useMemo(
    () => DECISION_OBJECTIVES.find(o => o.id === activeObjectiveId) ?? null,
    [activeObjectiveId]
  );

  // When an objective is active, the winning lane stays at full opacity and
  // the losing lane dims. When nothing is selected, both lanes show equally.
  function laneOpacity(lane: MilestoneLane): number {
    if (!activeObjective) return 1;
    if (activeObjective.winner === 'tie') return 1;
    return activeObjective.winner === lane ? 1 : 0.32;
  }

  return (
    <div>
      {renderHero()}
      {renderObjectiveChips(activeObjectiveId, setActiveObjectiveId, activeObjective)}
      {renderTimeline(selected.id, setSelectedId, laneOpacity)}
      {renderMilestoneDetail(selected)}
      {renderHonestTake()}
    </div>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────

function renderHero() {
  return (
    <div
      style={{
        padding: 18,
        background: 'linear-gradient(135deg, rgba(22,163,74,0.09), rgba(139,92,246,0.08))',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 14,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#16A34A',
          marginBottom: 6,
        }}
      >
        The 12-Month Forecast
      </div>
      <h2
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: 'var(--text-primary)',
          margin: 0,
          lineHeight: 1.2,
        }}
      >
        Bootstrap vs. VC — the same four quarters, two different bets.
      </h2>
      <p
        style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          marginTop: 8,
          marginBottom: 0,
          lineHeight: 1.55,
          maxWidth: 760,
        }}
      >
        Both lanes start with the same Q1 gate: three logged discovery calls. What diverges is what
        you optimize for in Q2 onward. Click any milestone to see its requirements, risks, and
        decision criteria. Toggle an objective above to see which lane wins for that goal — and why.
      </p>
    </div>
  );
}

// ─── Objective chips ─────────────────────────────────────────────────────

function renderObjectiveChips(
  activeId: string | null,
  setActiveId: (id: string | null) => void,
  activeObjective: DecisionObjective | null
) {
  return (
    <div
      style={{
        padding: 14,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 14,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          marginBottom: 10,
        }}
      >
        What am I optimizing for?
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          marginBottom: activeObjective ? 12 : 0,
        }}
      >
        {DECISION_OBJECTIVES.map(obj => {
          const isActive = obj.id === activeId;
          const winnerColor =
            obj.winner === 'bootstrap'
              ? LANE_META.bootstrap.color
              : obj.winner === 'vc'
                ? LANE_META.vc.color
                : 'var(--text-muted)';
          return (
            <button
              key={obj.id}
              onClick={() => setActiveId(isActive ? null : obj.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: isActive ? '#fff' : 'var(--text-primary)',
                background: isActive ? winnerColor : 'var(--bg-card)',
                border: isActive ? `1.5px solid ${winnerColor}` : '1px solid var(--border-color)',
                borderLeft: `3px solid ${winnerColor}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
              }}
            >
              {obj.label}
            </button>
          );
        })}
      </div>
      <AnimatePresence>
        {activeObjective && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{
              padding: 12,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderLeft: `3px solid ${
                activeObjective.winner === 'bootstrap'
                  ? LANE_META.bootstrap.color
                  : activeObjective.winner === 'vc'
                    ? LANE_META.vc.color
                    : 'var(--text-muted)'
              }`,
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color:
                    activeObjective.winner === 'bootstrap'
                      ? LANE_META.bootstrap.color
                      : activeObjective.winner === 'vc'
                        ? LANE_META.vc.color
                        : 'var(--text-muted)',
                }}
              >
                {activeObjective.winner === 'tie'
                  ? 'No clear winner'
                  : `${LANE_META[activeObjective.winner].label} wins`}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                {activeObjective.label}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {activeObjective.rationale}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Timeline SVG ────────────────────────────────────────────────────────

function renderTimeline(
  selectedId: string,
  setSelectedId: (id: string) => void,
  laneOpacity: (lane: MilestoneLane) => number
) {
  return (
    <div
      style={{
        padding: 18,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(22, 163, 74, 0.18)',
            color: '#16A34A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Route size={16} />
        </div>
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.2,
            }}
          >
            Interactive timeline
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            Four quarters, two lanes. Click any node for its full playbook.
          </div>
        </div>
      </div>

      <div
        style={{
          width: '100%',
          overflowX: 'auto',
        }}
      >
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          style={{
            width: '100%',
            minWidth: 720,
            height: 'auto',
            display: 'block',
          }}
          role="img"
          aria-label="12-month forecast with bootstrap and VC lanes"
        >
          <defs>
            <linearGradient id="lane-bs" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor={LANE_META.bootstrap.color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={LANE_META.bootstrap.color} stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="lane-vc" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor={LANE_META.vc.color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={LANE_META.vc.color} stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Quarter band background */}
          {LANE_X_CENTERS.map((cx, i) => {
            const sectionStart = 40 + i * 230;
            return (
              <rect
                key={`band-${i}`}
                x={sectionStart}
                y={30}
                width={230}
                height={VIEW_H - 60}
                fill={i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.018)'}
              />
            );
          })}

          {/* Lane labels (left side) */}
          <g opacity={laneOpacity('bootstrap')}>
            <rect
              x={8}
              y={BOOTSTRAP_Y - 14}
              width={108}
              height={28}
              rx={6}
              fill={LANE_META.bootstrap.bgColor}
              stroke={LANE_META.bootstrap.color}
              strokeOpacity={0.45}
              strokeWidth={1}
            />
            <text
              x={62}
              y={BOOTSTRAP_Y + 4}
              textAnchor="middle"
              fontSize={11}
              fontWeight={700}
              fill={LANE_META.bootstrap.color}
            >
              Bootstrap
            </text>
          </g>
          <g opacity={laneOpacity('vc')}>
            <rect
              x={8}
              y={VC_Y - 14}
              width={108}
              height={28}
              rx={6}
              fill={LANE_META.vc.bgColor}
              stroke={LANE_META.vc.color}
              strokeOpacity={0.45}
              strokeWidth={1}
            />
            <text
              x={62}
              y={VC_Y + 4}
              textAnchor="middle"
              fontSize={11}
              fontWeight={700}
              fill={LANE_META.vc.color}
            >
              VC / YC
            </text>
          </g>

          {/* Bootstrap path */}
          <g opacity={laneOpacity('bootstrap')}>
            <path
              d={`M ${LANE_X_CENTERS[0]} ${BOOTSTRAP_Y} L ${LANE_X_CENTERS[3]} ${BOOTSTRAP_Y}`}
              stroke="url(#lane-bs)"
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray="2 6"
              fill="none"
            />
          </g>
          {/* VC path */}
          <g opacity={laneOpacity('vc')}>
            <path
              d={`M ${LANE_X_CENTERS[0]} ${VC_Y} L ${LANE_X_CENTERS[3]} ${VC_Y}`}
              stroke="url(#lane-vc)"
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray="2 6"
              fill="none"
            />
          </g>

          {/* Divergence indicator between Q1 and Q2 */}
          <g opacity={0.45}>
            <line
              x1={(LANE_X_CENTERS[0] + LANE_X_CENTERS[1]) / 2}
              y1={BOOTSTRAP_Y + 18}
              x2={(LANE_X_CENTERS[0] + LANE_X_CENTERS[1]) / 2}
              y2={VC_Y - 18}
              stroke="var(--text-muted)"
              strokeWidth={1}
              strokeDasharray="3 4"
            />
            <text
              x={(LANE_X_CENTERS[0] + LANE_X_CENTERS[1]) / 2}
              y={(BOOTSTRAP_Y + VC_Y) / 2 + 4}
              textAnchor="middle"
              fontSize={9}
              fontWeight={700}
              fill="var(--text-muted)"
              style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              ← lanes diverge after Q1 →
            </text>
          </g>

          {/* Milestones */}
          {BOOTSTRAP_MILESTONES.map((m, i) => (
            <MilestoneNode
              key={m.id}
              milestone={m}
              cx={LANE_X_CENTERS[i]}
              cy={BOOTSTRAP_Y}
              labelY={BOOTSTRAP_Y - MILESTONE_R - 12}
              selected={m.id === selectedId}
              laneOpacity={laneOpacity('bootstrap')}
              onSelect={() => setSelectedId(m.id)}
            />
          ))}
          {VC_MILESTONES.map((m, i) => (
            <MilestoneNode
              key={m.id}
              milestone={m}
              cx={LANE_X_CENTERS[i]}
              cy={VC_Y}
              labelY={VC_Y + MILESTONE_R + 28}
              selected={m.id === selectedId}
              laneOpacity={laneOpacity('vc')}
              onSelect={() => setSelectedId(m.id)}
            />
          ))}

          {/* Quarter labels at bottom */}
          {LANE_X_CENTERS.map((cx, i) => {
            const qKey = (i + 1) as 1 | 2 | 3 | 4;
            return (
              <g key={`ql-${i}`}>
                <line
                  x1={cx}
                  y1={QUARTER_BAND_Y - 10}
                  x2={cx}
                  y2={QUARTER_BAND_Y - 18}
                  stroke="var(--text-muted)"
                  strokeWidth={1}
                  opacity={0.3}
                />
                <text
                  x={cx}
                  y={QUARTER_BAND_Y + 6}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={700}
                  fill="var(--text-secondary)"
                >
                  {QUARTER_LABELS[qKey]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div
        style={{
          marginTop: 10,
          fontSize: 11,
          color: 'var(--text-muted)',
          fontStyle: 'italic',
        }}
      >
        Tip: toggle an objective above to see which lane wins for that goal. The loser dims in real
        time.
      </div>
    </div>
  );
}

// ─── Milestone node ──────────────────────────────────────────────────────

interface MilestoneNodeProps {
  milestone: Milestone;
  cx: number;
  cy: number;
  labelY: number;
  selected: boolean;
  laneOpacity: number;
  onSelect: () => void;
}

function MilestoneNode({
  milestone,
  cx,
  cy,
  labelY,
  selected,
  laneOpacity,
  onSelect,
}: MilestoneNodeProps) {
  const meta = LANE_META[milestone.lane];
  const conf = CONFIDENCE_META[milestone.confidence];
  const lines = SHORT_LABELS[milestone.id] ?? [milestone.title, ''];

  return (
    <g
      opacity={laneOpacity}
      onClick={onSelect}
      style={{ cursor: 'pointer' }}
      role="button"
      tabIndex={0}
      aria-label={`${meta.label} — ${milestone.title}`}
    >
      {/* Selection halo */}
      {selected && (
        <circle
          cx={cx}
          cy={cy}
          r={MILESTONE_R + 8}
          fill="none"
          stroke={meta.color}
          strokeWidth={2}
          strokeOpacity={0.35}
        >
          <animate
            attributeName="r"
            values={`${MILESTONE_R + 8};${MILESTONE_R + 14};${MILESTONE_R + 8}`}
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-opacity"
            values="0.4;0.1;0.4"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      )}
      {/* Main circle */}
      <circle
        cx={cx}
        cy={cy}
        r={MILESTONE_R}
        fill={selected ? meta.color : meta.bgColor}
        stroke={meta.color}
        strokeWidth={selected ? 2.5 : 1.5}
      />
      {/* Confidence dot */}
      <circle
        cx={cx + MILESTONE_R - 4}
        cy={cy - MILESTONE_R + 4}
        r={4}
        fill={conf.color}
        stroke={'var(--bg-secondary)'}
        strokeWidth={1}
      />
      {/* Quarter number inside */}
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fontSize={12}
        fontWeight={800}
        fill={selected ? '#fff' : meta.color}
      >
        Q{milestone.quarter}
      </text>
      {/* Label above/below */}
      <text
        x={cx}
        y={labelY}
        textAnchor="middle"
        fontSize={11}
        fontWeight={600}
        fill="var(--text-primary)"
      >
        {lines[0]}
      </text>
      {lines[1] && (
        <text
          x={cx}
          y={labelY + 14}
          textAnchor="middle"
          fontSize={11}
          fontWeight={600}
          fill="var(--text-primary)"
        >
          {lines[1]}
        </text>
      )}
    </g>
  );
}

// ─── Milestone detail drawer ─────────────────────────────────────────────

function renderMilestoneDetail(m: Milestone) {
  const meta = LANE_META[m.lane];
  const conf = CONFIDENCE_META[m.confidence];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={m.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18 }}
        style={{
          padding: 18,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderLeft: `3px solid ${meta.color}`,
          borderRadius: 'var(--radius-lg)',
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 10,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: meta.color,
              padding: '3px 8px',
              background: meta.bgColor,
              borderRadius: 4,
            }}
          >
            {meta.label} · {QUARTER_LABELS[m.quarter]}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: conf.color,
              padding: '3px 8px',
              background: conf.bg,
              borderRadius: 4,
            }}
          >
            <Circle size={8} fill={conf.color} stroke="none" style={{ marginRight: 4 }} />
            {conf.label}
          </span>
        </div>

        <h3
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: 'var(--text-primary)',
            margin: '0 0 6px',
            lineHeight: 1.25,
          }}
        >
          {m.title}
        </h3>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            margin: '0 0 14px',
            lineHeight: 1.55,
          }}
        >
          {m.subtitle}
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            background: 'var(--bg-card)',
            border: `1px solid ${meta.color}33`,
            borderRadius: 'var(--radius-md)',
            marginBottom: 14,
          }}
        >
          <Target size={14} style={{ color: meta.color, flexShrink: 0 }} />
          <div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                marginRight: 8,
              }}
            >
              Metric target
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
              {m.metricTarget}
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 12,
          }}
        >
          <DetailColumn
            icon={<CheckCircle2 size={14} />}
            label="Requirements"
            accent={meta.color}
            items={m.requirements}
          />
          <DetailColumn
            icon={<AlertTriangle size={14} />}
            label="Risks"
            accent="#EF4444"
            items={m.risks}
          />
          <DetailColumn
            icon={<Sparkles size={14} />}
            label="Decision criteria"
            accent="#0EA5E9"
            items={m.criteria}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

interface DetailColumnProps {
  icon: React.ReactNode;
  label: string;
  accent: string;
  items: string[];
}

function DetailColumn({ icon, label, accent, items }: DetailColumnProps) {
  return (
    <div
      style={{
        padding: 12,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 8,
        }}
      >
        <span style={{ color: accent, display: 'flex' }}>{icon}</span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: accent,
          }}
        >
          {label}
        </span>
      </div>
      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {items.map((item, i) => (
          <li
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 6,
              fontSize: 12,
              color: 'var(--text-primary)',
              lineHeight: 1.5,
            }}
          >
            <span
              style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: accent,
                flexShrink: 0,
                marginTop: 7,
              }}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Honest take section ─────────────────────────────────────────────────

function renderHonestTake() {
  return (
    <div
      style={{
        padding: 18,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 4,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(22, 163, 74, 0.18)',
            color: '#16A34A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <TrendingUp size={16} />
        </div>
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.2,
            }}
          >
            The honest take
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            Strategic sequencing + what&rsquo;s missing + what has to be true before you raise.
          </div>
        </div>
      </div>

      {/* Headline */}
      <div
        style={{
          padding: 14,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderLeft: '3px solid #16A34A',
          borderRadius: 'var(--radius-md)',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#16A34A',
            marginBottom: 4,
          }}
        >
          Framing
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 6,
            lineHeight: 1.3,
          }}
        >
          {HONEST_TAKE.headline}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          {HONEST_TAKE.keyInsight}
        </div>
      </div>

      {/* Sequencing phases */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          marginBottom: 8,
        }}
      >
        Sequencing
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 8,
          marginBottom: 14,
        }}
      >
        {SEQUENCING.map((phase, i) => (
          <div
            key={phase.phase}
            style={{
              padding: 12,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'rgba(22, 163, 74, 0.18)',
                color: '#16A34A',
                fontSize: 11,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {i + 1}
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#16A34A',
                marginBottom: 2,
                paddingRight: 30,
              }}
            >
              {phase.phase}
            </div>
            <div
              style={{
                fontSize: 10,
                color: 'var(--text-muted)',
                marginBottom: 6,
                fontStyle: 'italic',
              }}
            >
              {phase.window}
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-primary)',
                lineHeight: 1.5,
                marginBottom: 8,
              }}
            >
              {phase.recommendation}
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                paddingTop: 8,
                borderTop: '1px dashed var(--border-color)',
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  marginRight: 6,
                }}
              >
                Gate
              </span>
              {phase.gate}
            </div>
          </div>
        ))}
      </div>

      {/* Two-up: Missing + Do not raise before */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 12,
        }}
      >
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
              marginBottom: 8,
            }}
          >
            What you&rsquo;re missing
          </div>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {HONEST_TAKE.whatsMissing.map(item => (
              <li
                key={item}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 6,
                  fontSize: 12,
                  color: 'var(--text-primary)',
                  lineHeight: 1.5,
                }}
              >
                <span
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: '#EF4444',
                    flexShrink: 0,
                    marginTop: 7,
                  }}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div
          style={{
            padding: 12,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: '3px solid #F59E0B',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#F59E0B',
              marginBottom: 8,
            }}
          >
            Do NOT raise until
          </div>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {HONEST_TAKE.doNotRaiseBefore.map(item => (
              <li
                key={item}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 6,
                  fontSize: 12,
                  color: 'var(--text-primary)',
                  lineHeight: 1.5,
                }}
              >
                <CheckCircle2 size={12} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 3 }} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
