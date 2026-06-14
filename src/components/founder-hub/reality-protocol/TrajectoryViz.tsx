'use client';

/**
 * TrajectoryViz — the Prince & the King as two trajectories that compound apart.
 *
 * From the conversation: "I'd turn that into a visual. Two timelines. Every day
 * your actions slightly move one of them. Not dramatically. Tiny shifts." The
 * King rises from build inputs (read / train / build / reflect / connect / pray);
 * the Prince falls from escape inputs (scroll / avoid / escape / consume). The
 * gap is invisible day to day and enormous over years — that is the whole point.
 *
 * This is a MOTIVATION visualisation, not a tracked second timeline (the daily
 * ritual stays the tree + one morning question + one night mark). Token-driven,
 * reduced-motion-safe: the lines draw in only when motion is allowed; otherwise
 * they render fully and statically.
 */

import { TRAJECTORY } from './content';

// Geometry: both lines start at the same point today (origin) and run to x=330.
// The King COMPOUNDS — exponential growth (flat early, then accelerating up),
// the truer shape for skills/relationships/equity that grow slowly then
// suddenly. The Prince DECAYS LINEARLY — steady erosion, a straight line down
// (a thousand ordinary nights, each costing about the same small amount).
const X0 = 30;
const X1 = 330;
const Y_BASE = 105; // "today"
const RISE = 77; // King reaches y = 28
const FALL = 77; // Prince reaches y = 182
const COMPOUND_K = 3; // curvature of the exponential (higher = more sudden)

/** Exponential-growth polyline for the King — value (e^{k·t}−1)/(e^k−1) ∈ [0,1]
 *  rising off the baseline; flat early, steep late. */
function buildKingPath(segments = 28): string {
  const denom = Math.exp(COMPOUND_K) - 1;
  let d = '';
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const v = (Math.exp(COMPOUND_K * t) - 1) / denom;
    const x = X0 + (X1 - X0) * t;
    const y = Y_BASE - v * RISE;
    d += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return d.trim();
}

const KING_PATH = buildKingPath();
/** Linear decay for the Prince — a straight line down from today. */
const PRINCE_PATH = `M ${X0} ${Y_BASE} L ${X1} ${Y_BASE + FALL}`;

export function TrajectoryViz() {
  return (
    <div>
      <style>{`
        @media (prefers-reduced-motion: no-preference){
          .traj-line { stroke-dasharray: 640; animation: traj-draw 1.8s ease forwards; }
          @keyframes traj-draw { from { stroke-dashoffset: 640; } to { stroke-dashoffset: 0; } }
        }
      `}</style>

      <svg
        viewBox="0 0 360 210"
        role="img"
        aria-label="Two trajectories from the same point today: the King compounds upward (slow then sudden) as you read, train, build, reflect, connect and pray; the Prince declines in a steady straight line as you scroll, avoid, escape and consume. The gap widens over time."
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {/* baseline at 'today' */}
        <line
          x1={30}
          y1={105}
          x2={330}
          y2={105}
          stroke="var(--border-color)"
          strokeWidth={1}
          strokeDasharray="3 4"
          opacity={0.6}
        />

        {/* prince — falls (muted, not alarmist: "not because you are bad") */}
        <path
          className="traj-line"
          d={PRINCE_PATH}
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth={2.5}
          strokeLinecap="round"
          style={{ animationDelay: '0.15s' }}
        />
        {/* king — rises */}
        <path
          className="traj-line"
          d={KING_PATH}
          fill="none"
          stroke="var(--accent-primary)"
          strokeWidth={2.75}
          strokeLinecap="round"
        />

        {/* shared origin */}
        <circle cx={30} cy={105} r={4} fill="var(--text-secondary)" />
        <text x={30} y={124} textAnchor="start" fontSize={9.5} fill="var(--text-muted)">
          today
        </text>

        {/* end markers + labels */}
        <circle cx={330} cy={28} r={4} fill="var(--accent-primary)" />
        <text
          x={324}
          y={20}
          textAnchor="end"
          fontSize={11}
          fontWeight={700}
          fill="var(--accent-primary)"
        >
          {TRAJECTORY.kingLabel} ↑
        </text>
        <circle cx={330} cy={182} r={4} fill="var(--text-muted)" />
        <text
          x={324}
          y={198}
          textAnchor="end"
          fontSize={11}
          fontWeight={700}
          fill="var(--text-muted)"
        >
          {TRAJECTORY.princeLabel} ↓
        </text>
      </svg>

      {/* what moves each line */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--accent-primary)',
              marginRight: 2,
            }}
          >
            {TRAJECTORY.kingLabel} gains when you
          </span>
          {TRAJECTORY.kingInputs.map(w => (
            <span
              key={w}
              style={{
                fontSize: 11.5,
                color: 'var(--accent-primary)',
                background: 'color-mix(in srgb, var(--accent-primary) 9%, var(--bg-card))',
                border:
                  '1px solid color-mix(in srgb, var(--accent-primary) 25%, var(--border-color))',
                borderRadius: 999,
                padding: '3px 9px',
              }}
            >
              {w}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
          <span
            style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginRight: 2 }}
          >
            {TRAJECTORY.princeLabel} gains when you
          </span>
          {TRAJECTORY.princeInputs.map(w => (
            <span
              key={w}
              style={{
                fontSize: 11.5,
                color: 'var(--text-muted)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: 999,
                padding: '3px 9px',
              }}
            >
              {w}
            </span>
          ))}
        </div>
      </div>

      <div
        style={{ marginTop: 12, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}
      >
        {TRAJECTORY.caption}
      </div>
    </div>
  );
}
