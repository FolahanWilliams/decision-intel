'use client';

/**
 * LoopViz — the diagnosed escape loop as a dynamic ring.
 *
 * Seven stages on a clockwise cycle, with a pulse that orbits the ring (so it
 * reads as a self-feeding loop, not a line). The whole point of the picture:
 * porn is the MIDDLE of the loop, not the start — the chain begins at the
 * phone, so the on-ramp node is the highlighted leverage point ("cut here").
 *
 * Token-driven (light-theme; no illustration palette) + reduced-motion-safe:
 * the orbit only animates behind prefers-reduced-motion: no-preference;
 * otherwise the pulse rests on the leverage point (fittingly, the place to act).
 */

import { LOOP_STAGES, LOOP_LEVERAGE_NOTE } from './content';

const N = LOOP_STAGES.length;
const CX = 190;
const CY = 140;
const R = 96; // node ring radius
const RL = 126; // label radius
const PAD = (9 * Math.PI) / 180; // gap so arrowheads don't sit under node dots

const angleAt = (i: number) => ((-90 + (360 / N) * i) * Math.PI) / 180;
const at = (a: number, r: number): [number, number] => [CX + r * Math.cos(a), CY + r * Math.sin(a)];

export function LoopViz() {
  const leverageIndex = LOOP_STAGES.findIndex(s => s.leverage);
  const [px, py] = at(angleAt(leverageIndex >= 0 ? leverageIndex : 0), R); // pulse rest point

  return (
    <div>
      <style>{`
        @media (prefers-reduced-motion: no-preference){
          .reality-loop-pulse{
            transform-box: view-box;
            transform-origin: 50% 50%;
            animation: reality-loop-orbit 9s linear infinite;
          }
          @keyframes reality-loop-orbit { to { transform: rotate(360deg); } }
        }
      `}</style>

      <svg
        viewBox="0 0 380 290"
        role="img"
        aria-label="The escape loop: idle and bored, phone to the feed (the leverage point), attention fragments, the urge, escape, guilt, standards drop — and back to idle."
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <defs>
          <marker
            id="reality-loop-arrow"
            viewBox="0 0 10 10"
            refX={8}
            refY={5}
            markerWidth={6}
            markerHeight={6}
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="var(--text-muted)" />
          </marker>
        </defs>

        {/* faint guide ring */}
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth={1}
          opacity={0.5}
        />

        {/* directional arcs between consecutive stages (clockwise) */}
        {LOOP_STAGES.map((_, i) => {
          const a0 = angleAt(i) + PAD;
          const a1 = angleAt((i + 1) % N) - PAD;
          const [ax, ay] = at(a0, R);
          const [bx, by] = at(a1, R);
          return (
            <path
              key={`arc-${i}`}
              d={`M ${ax.toFixed(2)} ${ay.toFixed(2)} A ${R} ${R} 0 0 1 ${bx.toFixed(2)} ${by.toFixed(2)}`}
              fill="none"
              stroke="var(--text-muted)"
              strokeWidth={1.5}
              opacity={0.55}
              markerEnd="url(#reality-loop-arrow)"
            />
          );
        })}

        {/* orbiting pulse — rests on the leverage point when reduced-motion */}
        <g className="reality-loop-pulse">
          <circle cx={px} cy={py} r={5} fill="var(--accent-primary)" opacity={0.9} />
        </g>

        {/* nodes + labels */}
        {LOOP_STAGES.map((s, i) => {
          const [nx, ny] = at(angleAt(i), R);
          const [lx, ly] = at(angleAt(i), RL);
          const c = Math.cos(angleAt(i));
          const anchor = c > 0.3 ? 'start' : c < -0.3 ? 'end' : 'middle';
          const dotFill = s.leverage
            ? 'color-mix(in srgb, var(--accent-primary) 22%, var(--bg-card))'
            : s.band === 'damage'
              ? 'color-mix(in srgb, var(--error) 22%, var(--bg-card))'
              : 'var(--bg-elevated)';
          const dotStroke = s.leverage
            ? 'var(--accent-primary)'
            : s.band === 'damage'
              ? 'var(--error)'
              : 'var(--border-color)';
          return (
            <g key={`node-${i}`}>
              <circle
                cx={nx}
                cy={ny}
                r={s.leverage ? 9 : 6}
                fill={dotFill}
                stroke={dotStroke}
                strokeWidth={s.leverage ? 2 : 1.5}
              />
              <text
                x={nx}
                y={ny}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={s.leverage ? 9 : 8}
                fontWeight={700}
                fill={s.leverage ? 'var(--accent-primary)' : 'var(--text-muted)'}
              >
                {i + 1}
              </text>
              <text
                x={lx}
                y={ly}
                textAnchor={anchor}
                dominantBaseline="central"
                fontSize={10.5}
                fontWeight={s.leverage ? 700 : 500}
                fill={s.leverage ? 'var(--accent-primary)' : 'var(--text-secondary)'}
              >
                {s.short}
              </text>
            </g>
          );
        })}

        {/* center caption */}
        <text
          x={CX}
          y={CY - 8}
          textAnchor="middle"
          fontSize={13}
          fontWeight={700}
          fill="var(--text-primary)"
        >
          The loop
        </text>
        <text x={CX} y={CY + 10} textAnchor="middle" fontSize={9.5} fill="var(--text-muted)">
          begins at the phone
        </text>
      </svg>

      {/* leverage-point note */}
      <div
        style={{
          marginTop: 10,
          padding: '10px 12px',
          borderRadius: 'var(--radius-md)',
          background: 'color-mix(in srgb, var(--accent-primary) 7%, var(--bg-card))',
          border: '1px solid color-mix(in srgb, var(--accent-primary) 28%, var(--border-color))',
          fontSize: 12.5,
          lineHeight: 1.55,
          color: 'var(--text-secondary)',
        }}
      >
        <strong style={{ color: 'var(--accent-primary)' }}>Leverage point (2):</strong>{' '}
        {LOOP_LEVERAGE_NOTE}
      </div>

      {/* full-text legend */}
      <ol
        style={{
          marginTop: 12,
          paddingLeft: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {LOOP_STAGES.map((s, i) => (
          <li
            key={`leg-${i}`}
            style={{
              display: 'flex',
              gap: 8,
              fontSize: 12.5,
              lineHeight: 1.5,
              color: s.leverage ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            <span
              style={{
                flexShrink: 0,
                fontWeight: 700,
                color: s.leverage
                  ? 'var(--accent-primary)'
                  : s.band === 'damage'
                    ? 'var(--error)'
                    : 'var(--text-muted)',
              }}
            >
              {i + 1}.
            </span>
            <span>
              {s.full}
              {s.leverage ? (
                <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                  {'  '}← cut here
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
