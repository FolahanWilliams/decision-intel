'use client';

/**
 * Moment 04 illustration — What-if.
 *
 * DQI half-gauge with A–F bands, a baseline marker where the memo
 * lands unchanged, and a what-if marker showing the grade lift from
 * removing one bias. The green arc segment between the two markers
 * is the "lift" — animated on scroll.
 *
 * 2026-04-21 fix: the prior version placed "BASELINE · 62" and
 * "WHAT-IF · 81" text labels directly around the markers, which
 * collided with the grade letters on the arc. The footer callout
 * already names the intervention and the lift, so the per-marker
 * labels are now just small value numbers (62, 81) in a tighter
 * mono — no prefix, no collision. Grade letters pushed from r+26
 * to r+40 for extra breathing room.
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
  red: '#EF4444',
};

// Grade band boundaries (matches src/lib/scoring/dqi.ts)
const BANDS = [
  { grade: 'F', from: 0, to: 40, color: '#FCA5A5' },
  { grade: 'D', from: 40, to: 55, color: '#FBBF24' },
  { grade: 'C', from: 55, to: 70, color: '#FDE68A' },
  { grade: 'B', from: 70, to: 85, color: '#86EFAC' },
  { grade: 'A', from: 85, to: 100, color: '#16A34A' },
];

const BASELINE = 62; // C grade
const WHATIF = 81;   // B grade

function scoreToAngle(score: number): number {
  return 180 - (score / 100) * 180;
}

function polar(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startScore: number, endScore: number): string {
  const startAngle = scoreToAngle(startScore);
  const endAngle = scoreToAngle(endScore);
  const start = polar(cx, cy, r, startAngle);
  const end = polar(cx, cy, r, endAngle);
  const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export function DqiGaugeViz() {
  const cx = 240;
  const cy = 210;
  const r = 130;

  const baselineAngle = scoreToAngle(BASELINE);
  const whatifAngle = scoreToAngle(WHATIF);
  const baselinePt = polar(cx, cy, r, baselineAngle);
  const whatifPt = polar(cx, cy, r, whatifAngle);

  return (
    <svg
      viewBox="0 0 480 340"
      width="100%"
      height="100%"
      role="img"
      aria-label="Decision Quality Index gauge — the memo lands at C grade (62); removing one bias lifts it to B grade (81)"
    >
      {/* Gauge backdrop bands */}
      {BANDS.map((band) => (
        <path
          key={band.grade}
          d={arcPath(cx, cy, r, band.from, band.to)}
          stroke={band.color}
          strokeWidth="20"
          strokeLinecap="butt"
          fill="none"
          strokeOpacity="0.6"
        />
      ))}

      {/* Grade labels — pushed to r+40 for breathing room from any
          score marker that lands near a band boundary. */}
      {BANDS.map((band) => {
        const midAngle = scoreToAngle((band.from + band.to) / 2);
        const labelPt = polar(cx, cy, r + 40, midAngle);
        return (
          <text
            key={`lbl-${band.grade}`}
            x={labelPt.x}
            y={labelPt.y + 4}
            fontSize="14"
            fontWeight="800"
            fill={C.slate700}
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {band.grade}
          </text>
        );
      })}

      {/* Baseline marker — where the memo lands unchanged */}
      <motion.g
        initial={{ opacity: 0, scale: 0.5 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <line
          x1={cx}
          y1={cy}
          x2={baselinePt.x}
          y2={baselinePt.y}
          stroke={C.slate500}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="4 4"
        />
        <circle cx={baselinePt.x} cy={baselinePt.y} r="7" fill={C.white} stroke={C.slate500} strokeWidth="2" />
      </motion.g>

      {/* What-if arc segment (baseline → what-if) — the animated "lift" */}
      <motion.path
        d={arcPath(cx, cy, r, BASELINE, WHATIF)}
        stroke={C.green}
        strokeWidth="20"
        strokeLinecap="butt"
        fill="none"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 1.0, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
        strokeOpacity="0.95"
      />

      {/* What-if marker */}
      <motion.g
        initial={{ opacity: 0, scale: 0.5 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.5, delay: 1.2 }}
      >
        <line
          x1={cx}
          y1={cy}
          x2={whatifPt.x}
          y2={whatifPt.y}
          stroke={C.green}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx={whatifPt.x} cy={whatifPt.y} r="9" fill={C.green} stroke={C.white} strokeWidth="2" />
      </motion.g>

      {/* Center hub */}
      <circle cx={cx} cy={cy} r="6" fill={C.slate900} />

      {/* Lift annotation — the beat's headline claim, promoted from a
          subtle pill to the hero callout of the illustration. The
          footer does all the labeling work now, so the markers stay
          clean. */}
      <motion.g
        initial={{ opacity: 0, y: 6 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.4, delay: 1.6 }}
      >
        <rect
          x="108"
          y="250"
          width="264"
          height="58"
          rx="12"
          fill={C.greenSoft}
          stroke="rgba(22,163,74,0.28)"
          strokeWidth="1"
        />
        <text
          x="240"
          y="270"
          fontSize="11"
          fontWeight="800"
          fill={C.green}
          textAnchor="middle"
          fontFamily="var(--font-mono, monospace)"
          letterSpacing="0.12em"
        >
          REMOVE OVERCONFIDENCE
        </text>
        <text
          x="240"
          y="292"
          fontSize="16"
          fontWeight="800"
          fill={C.slate900}
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="-0.01em"
        >
          +{WHATIF - BASELINE} points &middot; C&nbsp;&rarr;&nbsp;B grade
        </text>
      </motion.g>

      {/* Quiet legend pairing marker shapes to the two scores —
          sits above the callout, inside the arc. Lower-case to feel
          like a legend, not a shout. */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.4, delay: 1.4 }}
      >
        <g transform="translate(166, 222)">
          <circle cx="0" cy="0" r="5" fill={C.white} stroke={C.slate500} strokeWidth="1.5" />
          <text
            x="10"
            y="3.5"
            fontSize="11"
            fontWeight="600"
            fill={C.slate600}
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            today: 62
          </text>
        </g>
        <g transform="translate(258, 222)">
          <circle cx="0" cy="0" r="5" fill={C.green} />
          <text
            x="10"
            y="3.5"
            fontSize="11"
            fontWeight="700"
            fill={C.greenDark}
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            after what-if: 81
          </text>
        </g>
      </motion.g>
    </svg>
  );
}
