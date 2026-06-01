'use client';

/**
 * Dynamic visualisations for the Accountability Sprint tab. Pure SVG + CSS-var
 * colours, light-theme, animated via keyframes that respect
 * prefers-reduced-motion. Three vizs, each tied to a section of the brief:
 *
 *   ConvergenceViz     — the InsurX <-> DI parallel (two markets, one shape).
 *   SprintArcViz       — the 4-week arc with the BAFTA marker in week 1.
 *   ExtractionLadderViz — the 5 extraction targets ranked (lead vs secondary).
 *
 * Data-driven where it matters (reads FOUR_WEEK_PLAN + EXTRACTION_TARGETS) so
 * the vizs can't drift from the brief content.
 */

import { EXTRACTION_TARGETS, FOUR_WEEK_PLAN } from './sprint-brief-data';

const GREEN = 'var(--accent-primary)';
const INFO = 'var(--accent-secondary, #6366f1)';
const MUTED = 'var(--text-muted)';

/* ─── 1. Convergence: InsurX <-> DI ─────────────────────────────────── */

export function ConvergenceViz() {
  return (
    <figure style={{ margin: '0 0 4px' }}>
      <svg
        viewBox="0 0 720 200"
        width="100%"
        height="auto"
        role="img"
        aria-label="InsurX and Decision Intel converge on the same shape: structural discipline brought into an analog, gut-feel market."
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id="sprint-conv-left" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={INFO} stopOpacity="0.25" />
            <stop offset="1" stopColor={INFO} stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="sprint-conv-right" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0" stopColor={GREEN} stopOpacity="0.25" />
            <stop offset="1" stopColor={GREEN} stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* converging paths */}
        <path
          className="sprint-conv-path"
          d="M70 50 C 250 50, 280 100, 360 100"
          fill="none"
          stroke="url(#sprint-conv-left)"
          strokeWidth="3"
        />
        <path
          className="sprint-conv-path sprint-conv-path-2"
          d="M650 50 C 470 50, 440 100, 360 100"
          fill="none"
          stroke="url(#sprint-conv-right)"
          strokeWidth="3"
        />

        {/* left node — InsurX */}
        <g className="sprint-conv-node sprint-conv-node-l">
          <circle cx="70" cy="50" r="7" fill={INFO} />
          <text
            x="70"
            y="28"
            textAnchor="middle"
            fontSize="13"
            fontWeight="700"
            fill="var(--text-primary)"
          >
            InsurX
          </text>
          <text x="70" y="74" textAnchor="middle" fontSize="10.5" fill="var(--text-secondary)">
            Lloyd’s risk market
          </text>
        </g>

        {/* right node — DI */}
        <g className="sprint-conv-node sprint-conv-node-r">
          <circle cx="650" cy="50" r="7" fill={GREEN} />
          <text
            x="650"
            y="28"
            textAnchor="middle"
            fontSize="13"
            fontWeight="700"
            fill="var(--text-primary)"
          >
            Decision Intel
          </text>
          <text x="650" y="74" textAnchor="middle" fontSize="10.5" fill="var(--text-secondary)">
            M&amp;A / strategy decisions
          </text>
        </g>

        {/* center — the shared shape */}
        <g className="sprint-conv-center">
          <circle cx="360" cy="100" r="13" fill="none" stroke={GREEN} strokeWidth="2" />
          <circle
            className="sprint-conv-pulse"
            cx="360"
            cy="100"
            r="13"
            fill="none"
            stroke={GREEN}
            strokeWidth="2"
          />
          <circle cx="360" cy="100" r="5" fill={GREEN} />
          <text
            x="360"
            y="150"
            textAnchor="middle"
            fontSize="12"
            fontWeight="700"
            fill="var(--text-primary)"
          >
            Same shape
          </text>
          <text x="360" y="170" textAnchor="middle" fontSize="11" fill="var(--text-secondary)">
            structural discipline into a gut-feel market
          </text>
          <text x="360" y="186" textAnchor="middle" fontSize="10.5" fill={MUTED}>
            he already solved the institutional-trust problem
          </text>
        </g>
      </svg>
      <style>{`
        .sprint-conv-path { stroke-dasharray: 400; stroke-dashoffset: 400; animation: sprintDraw 1.1s ease-out forwards; }
        .sprint-conv-path-2 { animation-delay: 0.15s; }
        .sprint-conv-node, .sprint-conv-center { opacity: 0; animation: sprintFade 0.5s ease-out forwards; }
        .sprint-conv-node-l { animation-delay: 0.1s; }
        .sprint-conv-node-r { animation-delay: 0.25s; }
        .sprint-conv-center { animation-delay: 1s; }
        .sprint-conv-pulse { transform-origin: 360px 100px; animation: sprintPulse 2.4s ease-out 1.3s infinite; }
        @keyframes sprintDraw { to { stroke-dashoffset: 0; } }
        @keyframes sprintFade { to { opacity: 1; } }
        @keyframes sprintPulse { 0% { transform: scale(1); opacity: 0.7; } 70%,100% { transform: scale(2.4); opacity: 0; } }
        @media (prefers-reduced-motion: reduce) {
          .sprint-conv-path { stroke-dashoffset: 0; animation: none; }
          .sprint-conv-node, .sprint-conv-center { opacity: 1; animation: none; }
          .sprint-conv-pulse { animation: none; opacity: 0; }
        }
      `}</style>
    </figure>
  );
}

/* ─── 2. Sprint arc — 4 weeks + BAFTA marker ────────────────────────── */

// Green deepens week 1 -> week 4 (discovery -> conversion).
const WEEK_TINT = ['12%', '24%', '38%', '55%'];

export function SprintArcViz() {
  return (
    <div style={{ margin: '0 0 6px' }}>
      <div style={{ position: 'relative', display: 'flex', gap: 8 }} className="sprint-arc-row">
        {FOUR_WEEK_PLAN.map((w, i) => (
          <div
            key={i}
            className="sprint-arc-seg"
            style={{
              flex: 1,
              minWidth: 0,
              borderRadius: 'var(--radius-md)',
              border: `1px solid color-mix(in srgb, ${GREEN} ${WEEK_TINT[i]}, var(--border-color))`,
              background: `color-mix(in srgb, ${GREEN} ${WEEK_TINT[i]}, var(--bg-card))`,
              padding: '12px 12px 14px',
              animationDelay: `${i * 0.12}s`,
            }}
          >
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', color: GREEN }}>
              {w.week.toUpperCase()}
            </div>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginTop: 2,
                lineHeight: 1.2,
              }}
            >
              {w.phase}
            </div>
            {/* BAFTA marker sits on week 1 */}
            {i === 0 && (
              <div
                className="sprint-arc-bafta"
                style={{
                  marginTop: 8,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 10,
                  fontWeight: 800,
                  color: 'var(--warning)',
                  background: 'color-mix(in srgb, var(--warning) 12%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--warning) 30%, transparent)',
                  borderRadius: 999,
                  padding: '2px 8px',
                }}
              >
                ★ BAFTA · T-8d
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: MUTED, marginTop: 8, textAlign: 'center' }}>
        Discovery → friction audit → positioning → pilot conversion. BAFTA is the week-1 engine, not
        cold outreach into a void.
      </div>
      <style>{`
        .sprint-arc-seg { opacity: 0; transform: translateY(8px); animation: sprintArcUp 0.5s ease-out forwards; }
        .sprint-arc-bafta { animation: sprintArcBob 2.6s ease-in-out 1s infinite; }
        @keyframes sprintArcUp { to { opacity: 1; transform: translateY(0); } }
        @keyframes sprintArcBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
        @media (max-width: 640px) { .sprint-arc-row { flex-direction: column; } }
        @media (prefers-reduced-motion: reduce) {
          .sprint-arc-seg { opacity: 1; transform: none; animation: none; }
          .sprint-arc-bafta { animation: none; }
        }
      `}</style>
    </div>
  );
}

/* ─── 3. Extraction priority ladder ─────────────────────────────────── */

export function ExtractionLadderViz() {
  // Lead targets get a full bar + green; secondary get a shorter, muted bar.
  const rows = EXTRACTION_TARGETS.map((t, i) => {
    const lead = t.priority === 'lead';
    // Letter prefix (A · ...) lives at the start of the title.
    const letter = t.title.split('·')[0].trim().split(' ')[0] || String(i + 1);
    const short = t.title.split('·')[1]?.split('(')[0]?.trim() ?? t.title;
    return { letter, short, lead, width: lead ? 100 : 62 - i * 3 };
  });
  return (
    <div style={{ margin: '0 0 6px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 22,
                height: 22,
                flexShrink: 0,
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: r.lead ? '#fff' : 'var(--text-secondary)',
                background: r.lead ? GREEN : 'var(--bg-secondary)',
                border: r.lead ? 'none' : '1px solid var(--border-color)',
              }}
            >
              {r.letter}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                className="sprint-ladder-bar"
                style={{
                  height: r.lead ? 26 : 22,
                  width: `${r.width}%`,
                  borderRadius: 'var(--radius-sm)',
                  background: r.lead
                    ? `color-mix(in srgb, ${GREEN} 22%, var(--bg-card))`
                    : 'var(--bg-secondary)',
                  border: `1px solid ${r.lead ? `color-mix(in srgb, ${GREEN} 40%, transparent)` : 'var(--border-color)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 10px',
                  fontSize: 12,
                  fontWeight: r.lead ? 700 : 500,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  transformOrigin: 'left',
                  animationDelay: `${i * 0.08}s`,
                }}
              >
                {r.short}
              </div>
            </div>
            {r.lead && (
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  color: GREEN,
                  flexShrink: 0,
                }}
              >
                LEAD
              </span>
            )}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: MUTED, marginTop: 8, textAlign: 'center' }}>
        Mine A + B first — the institutional-trust playbook is the one thing only he can give you.
      </div>
      <style>{`
        .sprint-ladder-bar { opacity: 0; transform: scaleX(0.4); animation: sprintLadder 0.55s cubic-bezier(0.22,1,0.36,1) forwards; }
        @keyframes sprintLadder { to { opacity: 1; transform: scaleX(1); } }
        @media (prefers-reduced-motion: reduce) {
          .sprint-ladder-bar { opacity: 1; transform: none; animation: none; }
        }
      `}</style>
    </div>
  );
}
