'use client';

/**
 * FramingVizzes — one dynamic SVG per analogy in The Human Pitch tab.
 *
 * Humans get a picture faster than a paragraph. Each viz is token-driven
 * (light-theme; no illustration palette) and reduced-motion-safe: the
 * animation runs only behind prefers-reduced-motion: no-preference, and the
 * STATIC state already shows the resolved idea (the lens on the reasoning,
 * the second seat filled, the flaw highlighted, the one alarm red).
 */

import type { AnalogyVizId } from './framing-data';

/* ── 1. Audit asymmetry — the money is audited to death; the reasoning isn't ── */
function AuditAsymmetryViz() {
  // five check-stamps scattered on the small DATA box
  const checks = [
    [62, 92],
    [90, 84],
    [110, 104],
    [70, 116],
    [98, 124],
  ];
  return (
    <div>
      <style>{`
        @media (prefers-reduced-motion: no-preference){
          .fa-lens{ animation: fa-drop 3.2s ease-in-out infinite; }
          @keyframes fa-drop{
            0%,100%{ transform: translate(0,-26px); opacity:0; }
            45%,80%{ transform: translate(0,0); opacity:1; }
          }
          .fa-check{ animation: fa-pop 3.2s ease-in-out infinite; }
          @keyframes fa-pop{ 0%,55%{ opacity:0; } 70%,100%{ opacity:1; } }
        }
      `}</style>
      <svg
        viewBox="0 0 380 210"
        role="img"
        aria-label="A small box labelled Your data is covered in audit check-marks; a much larger box labelled Your reasoning sits bare until a single audit lens drops onto it."
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {/* small DATA box — covered in audit checks */}
        <rect
          x={34}
          y={74}
          width={96}
          height={72}
          rx={8}
          fill="var(--bg-elevated)"
          stroke="var(--border-color)"
          strokeWidth={1.5}
        />
        <text
          x={82}
          y={64}
          textAnchor="middle"
          fontSize={11}
          fontWeight={700}
          fill="var(--text-muted)"
        >
          YOUR DATA
        </text>
        {checks.map(([cx, cy], i) => (
          <g key={i}>
            <circle
              cx={cx}
              cy={cy}
              r={7}
              fill="color-mix(in srgb, var(--success) 18%, var(--bg-card))"
              stroke="var(--success)"
              strokeWidth={1}
            />
            <path
              d={`M ${cx - 3} ${cy} l 2 2.4 l 4 -5`}
              fill="none"
              stroke="var(--success)"
              strokeWidth={1.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        ))}
        <text x={82} y={166} textAnchor="middle" fontSize={9.5} fill="var(--success)">
          audited to the penny
        </text>

        {/* large REASONING box — bare */}
        <rect
          x={190}
          y={44}
          width={158}
          height={120}
          rx={10}
          fill="var(--bg-card)"
          stroke="var(--border-color)"
          strokeWidth={1.5}
        />
        <text
          x={269}
          y={34}
          textAnchor="middle"
          fontSize={11}
          fontWeight={700}
          fill="var(--text-secondary)"
        >
          YOUR REASONING
        </text>
        <text
          x={269}
          y={98}
          textAnchor="middle"
          fontSize={34}
          fontWeight={800}
          fill="var(--border-color)"
        >
          ?
        </text>

        {/* the single audit lens that drops in (DI) */}
        <g className="fa-lens">
          <circle
            cx={269}
            cy={98}
            r={22}
            fill="none"
            stroke="var(--accent-primary)"
            strokeWidth={2.5}
          />
          <line
            x1={285}
            y1={114}
            x2={300}
            y2={129}
            stroke="var(--accent-primary)"
            strokeWidth={3}
            strokeLinecap="round"
          />
          <g className="fa-check">
            <path
              d="M 260 98 l 5 6 l 10 -13"
              fill="none"
              stroke="var(--accent-primary)"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </g>
        <text x={269} y={156} textAnchor="middle" fontSize={9.5} fill="var(--accent-primary)">
          audited by no one — until now
        </text>
      </svg>
    </div>
  );
}

/* ── 2. Cockpit — you fly solo; we're the second seat ── */
function CockpitViz() {
  return (
    <div>
      <style>{`
        @media (prefers-reduced-motion: no-preference){
          .fc-fill{ animation: fc-fill 3.4s ease-in-out infinite; }
          @keyframes fc-fill{ 0%,30%{ opacity:0; } 55%,100%{ opacity:1; } }
          .fc-tick{ opacity:0; animation: fc-tick 3.4s ease-in-out infinite; }
          .fc-tick.t1{ animation-delay:.1s; } .fc-tick.t2{ animation-delay:.35s; } .fc-tick.t3{ animation-delay:.6s; }
          @keyframes fc-tick{ 0%,55%{ opacity:0; } 70%,100%{ opacity:1; } }
        }
      `}</style>
      <svg
        viewBox="0 0 380 200"
        role="img"
        aria-label="Two cockpit seats: the left seat labelled You is filled; the right seat fills in and a three-item checklist ticks on."
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {/* fuselage hint */}
        <rect
          x={20}
          y={30}
          width={340}
          height={150}
          rx={18}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth={1}
          opacity={0.5}
        />

        {/* left seat — YOU (filled) */}
        <rect
          x={62}
          y={70}
          width={92}
          height={86}
          rx={12}
          fill="color-mix(in srgb, var(--text-secondary) 16%, var(--bg-card))"
          stroke="var(--text-secondary)"
          strokeWidth={1.5}
        />
        <circle cx={108} cy={104} r={15} fill="var(--text-secondary)" />
        <text
          x={108}
          y={172}
          textAnchor="middle"
          fontSize={11}
          fontWeight={700}
          fill="var(--text-secondary)"
        >
          YOU
        </text>

        {/* right seat — DI (fills in) */}
        <rect
          x={226}
          y={70}
          width={92}
          height={86}
          rx={12}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth={1.5}
          strokeDasharray="5 5"
        />
        <g className="fc-fill">
          <rect
            x={226}
            y={70}
            width={92}
            height={86}
            rx={12}
            fill="color-mix(in srgb, var(--accent-primary) 12%, var(--bg-card))"
            stroke="var(--accent-primary)"
            strokeWidth={1.8}
          />
          {/* a small checklist instead of a head — it's a checklist, not a person */}
          {[0, 1, 2].map(i => (
            <g key={i} className={`fc-tick t${i + 1}`}>
              <path
                d={`M 244 ${92 + i * 16} l 3 3.6 l 6 -7.5`}
                fill="none"
                stroke="var(--accent-primary)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1={258}
                y1={94 + i * 16}
                x2={300}
                y2={94 + i * 16}
                stroke="var(--accent-primary)"
                strokeWidth={2}
                strokeLinecap="round"
                opacity={0.55}
              />
            </g>
          ))}
        </g>
        <text
          x={272}
          y={172}
          textAnchor="middle"
          fontSize={11}
          fontWeight={700}
          fill="var(--accent-primary)"
        >
          THE CHECKLIST
        </text>
      </svg>
    </div>
  );
}

/* ── 3. Blind spot — the flaw you can't see because you wrote it ── */
function BlindSpotViz() {
  const lines = [0, 1, 2, 3, 4, 5];
  const flaw = 3;
  return (
    <div>
      <style>{`
        @media (prefers-reduced-motion: no-preference){
          .fb-lens{ animation: fb-sweep 4s ease-in-out infinite; }
          @keyframes fb-sweep{ 0%{ transform: translateX(-120px);} 50%{ transform: translateX(0);} 100%{ transform: translateX(-120px);} }
          .fb-flaw{ animation: fb-glow 4s ease-in-out infinite; }
          @keyframes fb-glow{ 0%,40%{ fill: var(--bg-elevated); } 50%,70%{ fill: color-mix(in srgb, var(--error) 30%, var(--bg-card)); } 100%{ fill: var(--bg-elevated); } }
        }
      `}</style>
      <svg
        viewBox="0 0 380 200"
        role="img"
        aria-label="A document of grey text lines; one line is the hidden flaw, which lights up red as a magnifier sweeps across it."
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {/* page */}
        <rect
          x={56}
          y={28}
          width={268}
          height={150}
          rx={10}
          fill="var(--bg-card)"
          stroke="var(--border-color)"
          strokeWidth={1.5}
        />
        {/* text lines */}
        {lines.map(i => {
          const isFlaw = i === flaw;
          const w = i === lines.length - 1 ? 120 : 236;
          return (
            <rect
              key={i}
              className={isFlaw ? 'fb-flaw' : undefined}
              x={74}
              y={50 + i * 21}
              width={w}
              height={9}
              rx={4.5}
              fill={
                isFlaw
                  ? 'color-mix(in srgb, var(--error) 30%, var(--bg-card))'
                  : 'var(--bg-elevated)'
              }
              stroke={isFlaw ? 'var(--error)' : 'var(--border-color)'}
              strokeWidth={isFlaw ? 1.2 : 0.8}
            />
          );
        })}
        {/* magnifier resting on the flaw line */}
        <g className="fb-lens" style={{ transform: 'translateX(0px)' }}>
          <circle
            cx={196}
            cy={54 + flaw * 21}
            r={18}
            fill="color-mix(in srgb, var(--accent-primary) 7%, transparent)"
            stroke="var(--accent-primary)"
            strokeWidth={2.5}
          />
          <line
            x1={209}
            y1={67 + flaw * 21}
            x2={222}
            y2={80 + flaw * 21}
            stroke="var(--accent-primary)"
            strokeWidth={3}
            strokeLinecap="round"
          />
        </g>
        <text x={190} y={192} textAnchor="middle" fontSize={9.5} fill="var(--text-muted)">
          the flaw is invisible to the author — by definition
        </text>
      </svg>
    </div>
  );
}

/* ── 4. Smoke detector — most memos are fine; you can't tell which isn't ── */
function SmokeDetectorViz() {
  const memos = [0, 1, 2, 3, 4, 5];
  const onFire = 3;
  return (
    <div>
      <style>{`
        @media (prefers-reduced-motion: no-preference){
          .fs-smoke{ animation: fs-rise 2.6s ease-in-out infinite; }
          .fs-smoke.s2{ animation-delay:.5s; } .fs-smoke.s3{ animation-delay:1s; }
          @keyframes fs-rise{ 0%{ transform: translateY(8px); opacity:0; } 40%{ opacity:.7; } 100%{ transform: translateY(-22px); opacity:0; } }
          .fs-alarm{ animation: fs-blink 1.1s ease-in-out infinite; }
          @keyframes fs-blink{ 0%,100%{ opacity:1; } 50%{ opacity:.3; } }
        }
      `}</style>
      <svg
        viewBox="0 0 380 200"
        role="img"
        aria-label="A row of six memos, five calm, one with smoke rising; a smoke-detector dot sits over each and the one over the smoking memo flashes red."
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {memos.map(i => {
          const x = 24 + i * 58;
          const fire = i === onFire;
          return (
            <g key={i}>
              {/* detector dot above each memo */}
              <circle
                cx={x + 22}
                cy={36}
                r={6}
                className={fire ? 'fs-alarm' : undefined}
                fill={
                  fire ? 'var(--error)' : 'color-mix(in srgb, var(--success) 30%, var(--bg-card))'
                }
                stroke={fire ? 'var(--error)' : 'var(--success)'}
                strokeWidth={1.2}
              />
              {/* smoke wisps for the one on fire */}
              {fire &&
                [0, 1, 2].map(s => (
                  <circle
                    key={s}
                    className={`fs-smoke s${s + 1}`}
                    cx={x + 22 + (s - 1) * 8}
                    cy={92}
                    r={5}
                    fill="color-mix(in srgb, var(--error) 35%, var(--bg-card))"
                  />
                ))}
              {/* the memo */}
              <rect
                x={x}
                y={104}
                width={44}
                height={62}
                rx={6}
                fill={
                  fire
                    ? 'color-mix(in srgb, var(--error) 12%, var(--bg-card))'
                    : 'var(--bg-elevated)'
                }
                stroke={fire ? 'var(--error)' : 'var(--border-color)'}
                strokeWidth={1.4}
              />
              {[0, 1, 2].map(l => (
                <line
                  key={l}
                  x1={x + 8}
                  y1={116 + l * 12}
                  x2={x + 36}
                  y2={116 + l * 12}
                  stroke="var(--border-color)"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              ))}
            </g>
          );
        })}
        <text x={190} y={188} textAnchor="middle" fontSize={9.5} fill="var(--text-muted)">
          most are fine — you can’t tell which isn’t, so you check them all
        </text>
      </svg>
    </div>
  );
}

/** Module-scope switch so the consumer never looks up a component in render
 *  (satisfies react-hooks/static-components — same idiom as EducationRoomTab). */
export function AnalogyViz({ id }: { id: AnalogyVizId }) {
  switch (id) {
    case 'audit_asymmetry':
      return <AuditAsymmetryViz />;
    case 'cockpit':
      return <CockpitViz />;
    case 'blind_spot':
      return <BlindSpotViz />;
    case 'smoke_detector':
      return <SmokeDetectorViz />;
  }
}
