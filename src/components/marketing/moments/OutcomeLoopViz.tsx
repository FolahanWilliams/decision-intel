'use client';

/**
 * Moment 05 illustration — Outcome Loop.
 *
 * Four-stage cyclic feedback loop: Predict → Decide → Observe →
 * Calibrate → (back to Predict). Central element is a sharpening-
 * calibration chart that ticks UP over four quarters — the loop
 * closure proof point.
 *
 * 2026-04-21 rewrite: buyer-facing language only. Brier score is a
 * technical scoring rule the reader doesn't need to know; "how close
 * your call came to reality" communicates the same outcome in words
 * a CSO or M&A head will recognise. Layout fixed so the summary
 * pill no longer collides with the Observe node's sub-label.
 *
 * Inverted bars (higher = more accurate) read more intuitively than
 * the original "lower is sharper" direction. Same narrative, cleaner
 * visual grammar.
 */

import { motion } from 'framer-motion';

const C = {
  green: '#16A34A',
  greenDark: '#15803D',
  greenSoft: 'rgba(22,163,74,0.12)',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0F172A',
  white: '#FFFFFF',
  amber: '#F59E0B',
  violet: '#7C3AED',
};

type StagePos = { x: number; y: number; label: string; sub: string; color: string };

const STAGES: StagePos[] = [
  { x: 240, y: 50, label: 'Predict', sub: 'Your call: 62%', color: C.green },
  { x: 420, y: 170, label: 'Decide', sub: 'Board approves', color: C.slate700 },
  { x: 240, y: 288, label: 'Observe', sub: 'Actual outcome', color: C.violet },
  { x: 60, y: 170, label: 'Calibrate', sub: 'Accuracy logged', color: C.amber },
];

/** SVG arc path between two points, curving outward from center. */
function arc(from: StagePos, to: StagePos, cx: number, cy: number): string {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = mx - cx;
  const dy = my - cy;
  const len = Math.sqrt(dx * dx + dy * dy);
  const pushOut = 26;
  const cpX = mx + (dx / len) * pushOut;
  const cpY = my + (dy / len) * pushOut;
  return `M ${from.x} ${from.y} Q ${cpX} ${cpY} ${to.x} ${to.y}`;
}

export function OutcomeLoopViz() {
  const cx = 240;
  const cy = 170;

  // Calibration accuracy — percent of predictions that landed close
  // to the real outcome. Inverted so bars rise (more intuitive than
  // a Brier score where lower is better). Same narrative arc, just
  // in a language buyers read without a glossary.
  const accuracyBars = [
    { q: 'Q1', pct: 50, h: 16 },
    { q: 'Q2', pct: 68, h: 24 },
    { q: 'Q3', pct: 80, h: 32 },
    { q: 'Q4', pct: 89, h: 40 },
  ];

  return (
    <svg
      viewBox="0 0 480 340"
      width="100%"
      height="100%"
      role="img"
      aria-label="Outcome loop — predict, decide, observe, calibrate — each cycle sharpens the team's prediction accuracy from 50% to 89%"
    >
      {/* Central backdrop */}
      <circle cx={cx} cy={cy} r="76" fill={C.slate100} opacity="0.6" />
      <circle
        cx={cx}
        cy={cy}
        r="76"
        fill="none"
        stroke={C.slate200}
        strokeWidth="1"
        strokeDasharray="2 4"
      />

      {/* Cyclic arrows */}
      {STAGES.map((from, i) => {
        const to = STAGES[(i + 1) % STAGES.length];
        return (
          <motion.path
            key={`arc-${i}`}
            d={arc(from, to, cx, cy)}
            fill="none"
            stroke={C.green}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeDasharray="4 5"
            strokeOpacity="0.6"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{
              duration: 0.7,
              delay: 0.25 + i * 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
            markerEnd="url(#outcome-arrow-05)"
          />
        );
      })}

      <defs>
        <marker id="outcome-arrow-05" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M 0 0 L 6 4 L 0 8 z" fill={C.green} opacity="0.7" />
        </marker>
      </defs>

      {/* Stage nodes */}
      {STAGES.map((s, i) => (
        <motion.g
          key={s.label}
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
        >
          <circle cx={s.x} cy={s.y} r="22" fill={C.white} stroke={s.color} strokeWidth="2" />
          <circle cx={s.x} cy={s.y} r="8" fill={s.color} />
          <text
            x={s.x}
            y={s.y - 32}
            fontSize="12"
            fontWeight="800"
            fill={C.slate900}
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="-0.01em"
          >
            {s.label}
          </text>
          <text
            x={s.x}
            y={s.y + 38}
            fontSize="9.5"
            fontWeight="600"
            fill={C.slate500}
            textAnchor="middle"
            fontFamily="var(--font-mono, monospace)"
            letterSpacing="0.04em"
          >
            {s.sub}
          </text>
        </motion.g>
      ))}

      {/* Central chart — accuracy rising Q1→Q4. The entire chart
          composition lives inside the ellipse so it never collides
          with the outer stage sub-labels. */}
      <motion.g
        initial={{ opacity: 0, y: 6 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.5, delay: 0.9 }}
      >
        {/* Top label */}
        <text
          x={cx}
          y={cy - 42}
          fontSize="9"
          fontWeight="800"
          fill={C.slate500}
          textAnchor="middle"
          fontFamily="var(--font-mono, monospace)"
          letterSpacing="0.14em"
        >
          CALIBRATION SHARPENS
        </text>

        {/* Baseline of chart */}
        <line
          x1={cx - 60}
          y1={cy + 10}
          x2={cx + 60}
          y2={cy + 10}
          stroke={C.slate300}
          strokeWidth="1"
          strokeDasharray="2 3"
        />

        {accuracyBars.map((bar, i) => {
          const barW = 16;
          const gap = 10;
          const totalW = accuracyBars.length * barW + (accuracyBars.length - 1) * gap;
          const startX = cx - totalW / 2;
          const x = startX + i * (barW + gap);
          const isLatest = i === accuracyBars.length - 1;
          return (
            <motion.g
              key={bar.q}
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{
                duration: 0.45,
                delay: 1.1 + i * 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{ transformOrigin: `${x + barW / 2}px ${cy + 10}px` }}
            >
              {/* bar */}
              <rect
                x={x}
                y={cy + 10 - bar.h}
                width={barW}
                height={bar.h}
                rx="3"
                fill={isLatest ? C.green : C.slate400}
                opacity={isLatest ? 1 : 0.55}
              />
              {/* quarter label */}
              <text
                x={x + barW / 2}
                y={cy + 24}
                fontSize="8"
                fontWeight="700"
                fill={C.slate500}
                textAnchor="middle"
                fontFamily="var(--font-mono, monospace)"
              >
                {bar.q}
              </text>
            </motion.g>
          );
        })}

        {/* Summary row — lives INSIDE the ellipse so it cannot collide
            with Observe's "Actual outcome" sub-label below. */}
        <text
          x={cx}
          y={cy + 42}
          fontSize="10"
          fontWeight="800"
          fill={C.greenDark}
          textAnchor="middle"
          fontFamily="var(--font-mono, monospace)"
          letterSpacing="0.08em"
        >
          50% → 89% · 3 QUARTERS
        </text>
      </motion.g>
    </svg>
  );
}
