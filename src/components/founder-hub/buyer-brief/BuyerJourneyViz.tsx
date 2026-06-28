'use client';

/**
 * BuyerJourneyViz — the searcher's journey as an emotional-intensity curve.
 *
 * The curve rises to a peak at LOI → deciding (maximum fear, the personal
 * guarantee is live, the clock is running) — which is exactly the "sell here"
 * window. Token-driven, light-theme, reduced-motion-safe: the pulse only
 * travels the line behind prefers-reduced-motion: no-preference; otherwise it
 * rests on the peak (deciding), which is the point anyway.
 */

const STAGES = [
  { label: 'Sourcing', i: 0.25 },
  { label: 'Screening', i: 0.48 },
  { label: 'LOI', i: 0.85 },
  { label: 'Diligence', i: 0.8 },
  { label: 'Deciding', i: 1.0 },
  { label: 'Operating', i: 0.5 },
];

const X0 = 40;
const STEP = 64;
const TOP = 50;
const BASE = 170;
const H = 120;

const xAt = (idx: number) => X0 + idx * STEP;
const yAt = (i: number) => TOP + (1 - i) * H;

// indices of the "sell here" peak window (LOI → Deciding)
const PEAK_START = 2;
const PEAK_END = 4;

export function BuyerJourneyViz() {
  const pts = STAGES.map((s, idx) => [xAt(idx), yAt(s.i)] as const);
  const line = pts.map(([x, y], idx) => `${idx === 0 ? 'M' : 'L'} ${x} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L ${xAt(STAGES.length - 1)} ${BASE} L ${X0} ${BASE} Z`;
  const [pkx, pky] = pts[PEAK_END]; // pulse rest = deciding (the peak)

  return (
    <div>
      <style>{`
        @media (prefers-reduced-motion: no-preference){
          .bj-pulse{ animation: bj-move 7s ease-in-out infinite; }
          @keyframes bj-move{
            0%{ transform: translate(${(xAt(0) - pkx).toFixed(0)}px, ${(yAt(STAGES[0].i) - pky).toFixed(0)}px); }
            16%{ transform: translate(${(xAt(1) - pkx).toFixed(0)}px, ${(yAt(STAGES[1].i) - pky).toFixed(0)}px); }
            36%{ transform: translate(${(xAt(2) - pkx).toFixed(0)}px, ${(yAt(STAGES[2].i) - pky).toFixed(0)}px); }
            56%{ transform: translate(${(xAt(3) - pkx).toFixed(0)}px, ${(yAt(STAGES[3].i) - pky).toFixed(0)}px); }
            76%,84%{ transform: translate(0px, 0px); }
            100%{ transform: translate(${(xAt(5) - pkx).toFixed(0)}px, ${(yAt(STAGES[5].i) - pky).toFixed(0)}px); }
          }
        }
      `}</style>
      <svg
        viewBox="0 0 424 210"
        role="img"
        aria-label="The searcher's emotional intensity rises from a low at sourcing to a peak at LOI and deciding — the sell-here window where the personal guarantee is live — then settles at operating."
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {/* sell-here peak band */}
        <rect
          x={xAt(PEAK_START)}
          y={TOP - 8}
          width={xAt(PEAK_END) - xAt(PEAK_START)}
          height={BASE - TOP + 8}
          fill="color-mix(in srgb, var(--accent-primary) 7%, transparent)"
          stroke="none"
        />
        <text
          x={(xAt(PEAK_START) + xAt(PEAK_END)) / 2}
          y={TOP - 14}
          textAnchor="middle"
          fontSize={9.5}
          fontWeight={800}
          letterSpacing="0.06em"
          fill="var(--accent-primary)"
        >
          SELL HERE
        </text>

        {/* baseline */}
        <line
          x1={X0}
          y1={BASE}
          x2={xAt(STAGES.length - 1)}
          y2={BASE}
          stroke="var(--border-color)"
          strokeWidth={1}
        />

        {/* intensity area + line */}
        <path d={area} fill="color-mix(in srgb, var(--error) 9%, transparent)" />
        <path
          d={line}
          fill="none"
          stroke="var(--error)"
          strokeWidth={2}
          strokeLinejoin="round"
          opacity={0.8}
        />

        {/* nodes + labels */}
        {STAGES.map((s, idx) => {
          const [x, y] = pts[idx];
          const peak = idx >= PEAK_START && idx <= PEAK_END;
          return (
            <g key={s.label}>
              <circle
                cx={x}
                cy={y}
                r={peak ? 5 : 3.5}
                fill={peak ? 'var(--accent-primary)' : 'var(--bg-card)'}
                stroke={peak ? 'var(--accent-primary)' : 'var(--error)'}
                strokeWidth={1.5}
              />
              <text
                x={x}
                y={BASE + 16}
                textAnchor="middle"
                fontSize={9.5}
                fontWeight={peak ? 700 : 500}
                fill={peak ? 'var(--accent-primary)' : 'var(--text-muted)'}
              >
                {s.label}
              </text>
            </g>
          );
        })}

        {/* travelling pulse — rests on the peak (deciding) under reduced motion */}
        <g className="bj-pulse">
          <circle cx={pkx} cy={pky} r={4} fill="var(--accent-primary)" opacity={0.9} />
        </g>

        {/* y-axis hint */}
        <text x={X0 - 6} y={TOP + 2} textAnchor="end" fontSize={8} fill="var(--text-muted)">
          fear
        </text>
        <text x={X0 - 6} y={BASE} textAnchor="end" fontSize={8} fill="var(--text-muted)">
          calm
        </text>
      </svg>
    </div>
  );
}
