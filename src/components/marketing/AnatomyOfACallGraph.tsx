'use client';

/**
 * AnatomyOfACallGraph — the "anatomy of a call" constellation, extracted
 * from ScrollRevealGraph so the same SVG can render on multiple surfaces:
 *
 *   1. Landing page  — ScrollRevealGraph overlays it in the bottom-right
 *                      panel, driving `stage` from scroll progress.
 *   2. /how-it-works — static pre-composed pentagon at the top of the
 *                      pipeline section, drives `stage={5}` (fully composed).
 *   3. Mobile mini   — 80x80 thumbnail that opens a full-screen modal
 *                      showing the fully-composed version.
 *
 * Single source of truth for the CAPABILITIES array + palette so a copy
 * change in one place doesn't drift to the others. CLAUDE.md locks the
 * pentagon as "the landing-beat IP visualisation" — keep it consistent.
 *
 * Pure presentational — no scroll hooks, no IntersectionObserver. Parents
 * decide when to show it and at what stage.
 */

import { motion } from 'framer-motion';
import type { ReactElement } from 'react';

const C = {
  white: '#FFFFFF',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate900: '#0F172A',
  green: '#16A34A',
  greenDark: '#15803D',
};

/* ─── Capability definitions — mirror ScrollRevealGraph source of truth.
   Order matters (stage N activates CAPABILITIES[N-1]). */

type Capability = {
  id: string;
  short: string;
  full: string;
  angle: number;
  icon: (color: string) => ReactElement;
};

const GRAPH_ICON = (color: string) => (
  <g>
    <circle cx="0" cy="-5" r="1.6" fill={color} />
    <circle cx="-5" cy="0" r="1.6" fill={color} />
    <circle cx="5" cy="0" r="1.6" fill={color} />
    <circle cx="-3" cy="5" r="1.4" fill={color} />
    <circle cx="3" cy="5" r="1.4" fill={color} />
    <g stroke={color} strokeWidth="0.9" strokeLinecap="round">
      <line x1="0" y1="-5" x2="-5" y2="0" />
      <line x1="0" y1="-5" x2="5" y2="0" />
      <line x1="-5" y1="0" x2="-3" y2="5" />
      <line x1="5" y1="0" x2="3" y2="5" />
      <line x1="-3" y1="5" x2="3" y2="5" />
    </g>
  </g>
);

const BOARDROOM_ICON = (color: string) => (
  <g fill={color}>
    <circle cx="-6" cy="-1" r="1.9" />
    <circle cx="0" cy="-4" r="2.1" />
    <circle cx="6" cy="-1" r="1.9" />
    <path d="M -8.8 5.5 Q -6 1.8 -3.2 5.5 Z" />
    <path d="M -2.6 3 Q 0 -0.8 2.6 3 Z" />
    <path d="M 3.2 5.5 Q 6 1.8 8.8 5.5 Z" />
  </g>
);

const AUDIT_ICON = (color: string) => (
  <g>
    <rect
      x="-5"
      y="-6"
      width="10"
      height="12"
      rx="1.2"
      fill="none"
      stroke={color}
      strokeWidth="1"
    />
    <line x1="-3" y1="-3" x2="3" y2="-3" stroke={color} strokeWidth="0.9" strokeLinecap="round" />
    <line
      x1="-3"
      y1="-0.5"
      x2="2"
      y2="-0.5"
      stroke={color}
      strokeWidth="0.9"
      strokeLinecap="round"
    />
    <path
      d="M -2.5 3 l 1.6 1.6 l 3.4 -3.2"
      stroke={color}
      strokeWidth="1.4"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </g>
);

const WHATIF_ICON = (color: string) => (
  <g>
    <rect x="-6" y="1.5" width="2.4" height="5" rx="0.5" fill={color} opacity="0.55" />
    <rect x="-1.2" y="-2" width="2.4" height="8.5" rx="0.5" fill={color} opacity="0.75" />
    <rect x="3.6" y="-5.5" width="2.4" height="12" rx="0.5" fill={color} />
    <path
      d="M -7 -3 L 6 -6"
      stroke={color}
      strokeWidth="1.1"
      strokeLinecap="round"
      fill="none"
      opacity="0.9"
    />
  </g>
);

const OUTCOME_ICON = (color: string) => (
  <g fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M -5.5 -2 A 6 6 0 1 1 4.5 4.5" />
    <path d="M 4.5 4.5 l 2.3 -2.6" />
    <path d="M 4.5 4.5 l -2.4 -1.3" />
  </g>
);

export const ANATOMY_CAPABILITIES: Capability[] = [
  { id: 'graph', short: 'Graph', full: 'Decision Knowledge Graph', angle: 90, icon: GRAPH_ICON },
  { id: 'boardroom', short: 'Boardroom', full: 'AI boardroom', angle: 18, icon: BOARDROOM_ICON },
  { id: 'audit', short: 'Audit', full: 'Reasoning audit', angle: -54, icon: AUDIT_ICON },
  { id: 'whatif', short: 'What-if', full: 'What-if', angle: -126, icon: WHATIF_ICON },
  { id: 'outcome', short: 'Outcome', full: 'Outcome loop', angle: 162, icon: OUTCOME_ICON },
];

interface AnatomyOfACallGraphProps {
  /** 0 = core only; 1..5 = activate capabilities one by one;
   *  5 = fully composed (pulsing core, ticker caption). */
  stage?: number;
  /** Square panel size in px. Defaults to 320 (landing overlay size). */
  size?: number;
  /** When true, skip ambient pulse + ring animations for
   *  prefers-reduced-motion users and tiny thumbnails. */
  reducedMotion?: boolean;
  /** Caption override — useful for the mobile thumbnail which doesn't
   *  need the "stage N / 5 layers active" scroll-tracking caption. */
  captionOverride?: string | null;
  className?: string;
}

export function AnatomyOfACallGraph({
  stage = 5,
  size = 320,
  reducedMotion = false,
  captionOverride,
  className,
}: AnatomyOfACallGraphProps) {
  const cx = size / 2;
  const cy = size / 2 - 6;
  const orbitR = Math.round((92 / 320) * size);
  const iconScale = size >= 200 ? 1 : size / 200;

  const nodes = ANATOMY_CAPABILITIES.map((cap, i) => {
    const rad = (cap.angle * Math.PI) / 180;
    return {
      ...cap,
      x: cx + orbitR * Math.cos(rad),
      y: cy - orbitR * Math.sin(rad),
      activeAt: i + 1,
    };
  });

  const fullyComposed = stage >= 5;
  const caption =
    captionOverride !== undefined
      ? captionOverride
      : fullyComposed
        ? 'EVERY ANGLE · ONE CALL'
        : `${stage} / 5 LAYERS ACTIVE`;

  // Scale layout values with panel size so thumbnails remain legible.
  const tileHalf = Math.max(10, Math.round((16 / 320) * size));
  const tileFontSize = Math.max(7, Math.round((9 / 320) * size));
  const captionFontSize = Math.max(7, Math.round((9 / 320) * size));
  const coreInner = Math.round((16 / 320) * size);
  const coreOuter = Math.round((22 / 320) * size);
  const coreMonogram = Math.round((11 / 320) * size);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      height="100%"
      aria-hidden
      className={className}
    >
      <defs>
        <radialGradient id={`aoc-core-halo-${size}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.green} stopOpacity="0.22" />
          <stop offset="70%" stopColor={C.green} stopOpacity="0.04" />
          <stop offset="100%" stopColor={C.green} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`aoc-core-disc-${size}`} cx="35%" cy="30%" r="72%">
          <stop offset="0%" stopColor="#BBF7D0" />
          <stop offset="55%" stopColor="#34D399" />
          <stop offset="100%" stopColor={C.greenDark} />
        </radialGradient>
        <filter id={`aoc-tile-shadow-${size}`} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#0F172A" floodOpacity="0.06" />
          <feDropShadow dx="0" dy="5" stdDeviation="10" floodColor="#0F172A" floodOpacity="0.05" />
        </filter>
      </defs>

      {/* Orbit ring */}
      <circle
        cx={cx}
        cy={cy}
        r={orbitR}
        fill="none"
        stroke={C.slate200}
        strokeWidth={Math.max(0.4, 0.6 * (size / 320))}
        strokeDasharray="1 5"
        opacity="0.6"
      />

      {/* Core halo */}
      <circle cx={cx} cy={cy} r={Math.round(orbitR * 0.72)} fill={`url(#aoc-core-halo-${size})`} />

      {/* Edges */}
      {nodes.map(n => {
        const active = stage >= n.activeAt;
        return (
          <motion.line
            key={`edge-${n.id}`}
            x1={cx}
            y1={cy}
            x2={n.x}
            y2={n.y}
            stroke={active ? C.green : C.slate200}
            strokeWidth={active ? 1.2 : 0.8}
            strokeOpacity={active ? 0.55 : 0.35}
            strokeLinecap="round"
            initial={false}
            animate={{ pathLength: active ? 1 : 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          />
        );
      })}

      {/* Pulse particles — suppressed in reduced-motion */}
      {!reducedMotion &&
        nodes.map(n => {
          const active = stage >= n.activeAt;
          if (!active) return null;
          return (
            <motion.circle
              key={`pulse-${n.id}`}
              r={Math.max(1.2, 1.8 * (size / 320))}
              fill={C.green}
              initial={{ cx: n.x, cy: n.y, opacity: 0 }}
              animate={{
                cx: [n.x, cx],
                cy: [n.y, cy],
                opacity: [0, 0.85, 0],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: n.activeAt * 0.35,
              }}
            />
          );
        })}

      {/* Capability tiles */}
      {nodes.map(n => {
        const active = stage >= n.activeAt;
        return (
          <motion.g
            key={n.id}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{
              opacity: active ? 1 : 0.28,
              scale: active ? 1 : 0.88,
            }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <g transform={`translate(${n.x}, ${n.y})`}>
              <rect
                x={-tileHalf}
                y={-tileHalf}
                width={tileHalf * 2}
                height={tileHalf * 2}
                rx={Math.round(9 * (size / 320))}
                fill={C.white}
                stroke={active ? 'rgba(22,163,74,0.38)' : C.slate200}
                strokeWidth="1"
                filter={`url(#aoc-tile-shadow-${size})`}
              />
              <g transform={`scale(${iconScale})`}>{n.icon(active ? C.greenDark : C.slate400)}</g>
              {tileFontSize >= 8 && (
                <text
                  y={tileHalf + 12}
                  fontSize={tileFontSize}
                  fontWeight="700"
                  fill={active ? C.slate900 : C.slate400}
                  textAnchor="middle"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  style={{ transition: 'fill 0.4s' }}
                >
                  {n.short}
                </text>
              )}
            </g>
          </motion.g>
        );
      })}

      {/* Core */}
      <g>
        {fullyComposed && !reducedMotion && (
          <motion.circle
            cx={cx}
            cy={cy}
            r={coreOuter + 2}
            fill="none"
            stroke="rgba(22,163,74,0.35)"
            strokeWidth="1"
            animate={{
              r: [coreOuter + 2, coreOuter + 8, coreOuter + 2],
              opacity: [0.8, 0.25, 0.8],
            }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        {(!fullyComposed || reducedMotion) && (
          <circle
            cx={cx}
            cy={cy}
            r={coreOuter}
            fill="none"
            stroke="rgba(148,163,184,0.35)"
            strokeWidth="1"
          />
        )}
        <circle cx={cx} cy={cy} r={coreInner} fill={`url(#aoc-core-disc-${size})`} />
        <ellipse
          cx={cx - Math.round(4 * (size / 320))}
          cy={cy - Math.round(5 * (size / 320))}
          rx={Math.round(7 * (size / 320))}
          ry={Math.round(3 * (size / 320))}
          fill="rgba(255,255,255,0.55)"
        />
        {coreMonogram >= 7 && (
          <text
            x={cx}
            y={cy + Math.round(3.5 * (size / 320))}
            fontSize={coreMonogram}
            fontWeight="800"
            fill={C.white}
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="-0.02em"
          >
            DI
          </text>
        )}
      </g>

      {/* Caption */}
      {caption !== null && captionFontSize >= 8 && (
        <text
          x={size / 2}
          y={size - Math.round(22 * (size / 320))}
          fontSize={captionFontSize}
          fontWeight="800"
          fill={C.slate500}
          textAnchor="middle"
          fontFamily="var(--font-mono, monospace)"
          letterSpacing="0.14em"
        >
          {caption}
        </text>
      )}
    </svg>
  );
}
