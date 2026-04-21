'use client';

/**
 * ScrollRevealGraph — bottom-right constellation overlay that sketches
 * the anatomy of a Decision Intel call. Ambient, not a live preview.
 *
 * 2026-04-22 third rewrite (final): the live-audit mockup read cheap
 * and overlapped the comparison / FAQ beats. Replaced with a quiet
 * capability constellation — a central "your call" glyph with five
 * rigor layers (Knowledge Graph, Boardroom, Reasoning Audit, What-If,
 * Outcome Loop) orbiting it. Each layer snaps in across the scroll,
 * edges thread inward, and faint pulse particles flow from each layer
 * back to the core once activated. The result reads as "here is what
 * you get, composed" without pretending to be the product UI.
 *
 * Visibility tuned to 0.04 → 0.72 so the overlay retreats before the
 * competitor-comparison / FAQ / CTA block — no more collision with
 * actionable page content.
 *
 * Keeps: panel chrome, reduced-motion respect, desktop-only,
 * click-to-expand modal (still shows the real 3D HeroDecisionGraph
 * on the WeWork S-1 sample).
 */

import { useEffect, useState, useSyncExternalStore, type ReactElement } from 'react';
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Maximize2, X } from 'lucide-react';
import dynamic from 'next/dynamic';

const HeroDecisionGraph = dynamic(
  () => import('./HeroDecisionGraph').then(m => m.HeroDecisionGraph),
  { ssr: false }
);

const C = {
  white: '#FFFFFF',
  navy: '#0F172A',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0F172A',
  green: '#16A34A',
  greenDark: '#15803D',
  greenLight: '#86EFAC',
  greenSoft: 'rgba(22,163,74,0.10)',
};

/* ─── Capability definitions ─────────────────────────────────────────
   Each capability maps to one of the five moments on the page, so the
   overlay and the pyramid tell the same story at different zoom levels. */

type Capability = {
  id: string;
  short: string; // label under the node
  full: string; // label that shows in the panel subtitle
  angle: number; // pentagon position (degrees from +x, CCW; 90 = top)
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

const CAPABILITIES: Capability[] = [
  { id: 'graph', short: 'Graph', full: 'Decision Knowledge Graph', angle: 90, icon: GRAPH_ICON },
  { id: 'boardroom', short: 'Boardroom', full: 'AI boardroom', angle: 18, icon: BOARDROOM_ICON },
  { id: 'audit', short: 'Audit', full: 'Reasoning audit', angle: -54, icon: AUDIT_ICON },
  { id: 'whatif', short: 'What-if', full: 'What-if', angle: -126, icon: WHATIF_ICON },
  { id: 'outcome', short: 'Outcome', full: 'Outcome loop', angle: 162, icon: OUTCOME_ICON },
];

/* ─── Live audit ticker — seeded from the 135-case corpus ───────────
   Until real production audit volume exists, the ticker cycles through
   a curated set of anonymized events that could plausibly be a user in
   a given industry running a given audit type. Every event carries a
   DQI (45-82 band, realistic distribution) and bias count (2-6, realistic).
   When real audit volume lands, swap this for a /api/audits/recent
   polling endpoint that returns the same shape. Industries map to the
   real 11-sector distribution of the case corpus. Formats stay short so
   the ticker never wraps on the 320px panel.

   The ticker only renders when the constellation is fully composed
   (stage === 5) — before that, the footer invites a reader to expand the
   graph, which is the natural reveal sequence. */

type AuditTickerEvent = {
  industry: string;
  auditType: string;
  dqi: number;
  biasCount: number;
};

const AUDIT_TICKER_SEED: AuditTickerEvent[] = [
  { industry: 'financial services', auditType: 'market-entry audit', dqi: 68, biasCount: 4 },
  { industry: 'technology', auditType: 'M&A target audit', dqi: 54, biasCount: 6 },
  { industry: 'healthcare', auditType: 'capital-allocation audit', dqi: 72, biasCount: 3 },
  { industry: 'retail', auditType: 'store-footprint audit', dqi: 61, biasCount: 5 },
  { industry: 'energy', auditType: 'divestment audit', dqi: 77, biasCount: 2 },
  { industry: 'government', auditType: 'procurement audit', dqi: 48, biasCount: 6 },
  { industry: 'aerospace', auditType: 'platform-commit audit', dqi: 63, biasCount: 4 },
  { industry: 'automotive', auditType: 'EV-transition audit', dqi: 55, biasCount: 5 },
  { industry: 'financial services', auditType: 'reserve-adequacy audit', dqi: 79, biasCount: 3 },
  { industry: 'technology', auditType: 'platform-sunset audit', dqi: 51, biasCount: 6 },
  { industry: 'healthcare', auditType: 'clinical-pivot audit', dqi: 66, biasCount: 4 },
  { industry: 'telecommunications', auditType: 'spectrum-bid audit', dqi: 58, biasCount: 5 },
];

function useRotatingAuditEvent(intervalMs: number, enabled: boolean): AuditTickerEvent {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const timer = window.setInterval(
      () => setIdx(i => (i + 1) % AUDIT_TICKER_SEED.length),
      intervalMs
    );
    return () => window.clearInterval(timer);
  }, [enabled, intervalMs]);
  return AUDIT_TICKER_SEED[idx];
}

/* ─── Stage config — six stages: base + one per capability.
   Thresholds map tightly to the landing narrative: the constellation
   finishes composing by the time the reader reaches the Security beat,
   at which point the overlay fades out entirely. */

const STAGE_THRESHOLDS = [0, 0.08, 0.18, 0.28, 0.4, 0.55];

const STAGE_SUBTITLES = [
  'The building blocks of a call',
  CAPABILITIES[0].full,
  CAPABILITIES[1].full,
  CAPABILITIES[2].full,
  CAPABILITIES[3].full,
  CAPABILITIES[4].full,
];

function scrollProgressToStage(p: number): number {
  for (let i = STAGE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (p >= STAGE_THRESHOLDS[i]) return i;
  }
  return 0;
}

/* ─── Browser-state subscriptions via useSyncExternalStore — avoids the
   setState-in-effect cascade rule. SSR snapshot returns false so the
   overlay never renders server-side. */

function useIsDesktop(): boolean {
  return useSyncExternalStore(
    callback => {
      if (typeof window === 'undefined') return () => {};
      window.addEventListener('resize', callback);
      return () => window.removeEventListener('resize', callback);
    },
    () => (typeof window !== 'undefined' ? window.innerWidth >= 1024 : false),
    () => false
  );
}

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    callback => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {};
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      mq.addEventListener('change', callback);
      return () => mq.removeEventListener('change', callback);
    },
    () =>
      typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false,
    () => false
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Main component
   ═══════════════════════════════════════════════════════════════════ */

export function ScrollRevealGraph() {
  const [stage, setStage] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(false);

  const desktop = useIsDesktop();
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  // Ticker rotates once the constellation is fully composed (stage === 5).
  // 8s interval so readers have time to register each event without feeling
  // yanked. Gated on `visible` so we don't burn timers while the overlay is
  // fading or dismissed.
  const tickerActive = visible && stage >= 5;
  const tickerEvent = useRotatingAuditEvent(8000, tickerActive);

  useMotionValueEvent(scrollYProgress, 'change', latest => {
    const newStage = scrollProgressToStage(latest);
    if (newStage !== stage) setStage(newStage);
    // Retreat before the competitor comparison / FAQ / CTA so the
    // overlay never sits on top of actionable content.
    setVisible(latest > 0.04 && latest < 0.72);
  });

  useEffect(() => {
    if (!expanded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [expanded]);

  if (!desktop || dismissed || reducedMotion) return null;

  const panelSize = 320;
  const fullyComposed = stage >= 5;

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed',
              right: 24,
              bottom: 24,
              width: panelSize,
              background: C.white,
              border: `1px solid ${fullyComposed ? 'rgba(22,163,74,0.4)' : C.slate200}`,
              borderRadius: 18,
              boxShadow: fullyComposed
                ? '0 24px 60px rgba(15,23,42,0.18), 0 4px 12px rgba(22,163,74,0.14)'
                : '0 24px 60px rgba(15,23,42,0.18), 0 4px 12px rgba(15,23,42,0.06)',
              zIndex: 40,
              overflow: 'hidden',
              transition: 'border-color 0.6s, box-shadow 0.6s',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderBottom: `1px solid ${C.slate200}`,
                background: C.white,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    color: C.green,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  Decision Intel &middot; anatomy of a call
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.slate900,
                    marginTop: 2,
                  }}
                >
                  {STAGE_SUBTITLES[stage]}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => setExpanded(true)}
                  aria-label="Expand graph"
                  style={{
                    width: 28,
                    height: 28,
                    border: 'none',
                    background: 'transparent',
                    color: C.slate500,
                    cursor: 'pointer',
                    borderRadius: 6,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Maximize2 size={14} />
                </button>
                <button
                  onClick={() => setDismissed(true)}
                  aria-label="Dismiss overlay"
                  style={{
                    width: 28,
                    height: 28,
                    border: 'none',
                    background: 'transparent',
                    color: C.slate500,
                    cursor: 'pointer',
                    borderRadius: 6,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Canvas */}
            <button
              onClick={() => setExpanded(true)}
              aria-label="Open sample Decision Knowledge Graph"
              style={{
                width: '100%',
                height: panelSize,
                padding: 0,
                background: `radial-gradient(ellipse at center, ${C.greenSoft} 0%, ${C.white} 72%)`,
                border: 'none',
                cursor: 'pointer',
                display: 'block',
                position: 'relative',
              }}
            >
              <ConstellationCanvas stage={stage} panelSize={panelSize} />

              {/* Stage progress chips */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 10,
                  left: 0,
                  right: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 4,
                  pointerEvents: 'none',
                }}
              >
                {STAGE_THRESHOLDS.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 18,
                      height: 3,
                      borderRadius: 2,
                      background: i <= stage ? C.green : C.slate200,
                      transition: 'background 0.3s',
                    }}
                  />
                ))}
              </div>
            </button>

            {/* Footer — before the constellation is fully composed, invite
                the reader to expand the graph. Once composed (stage === 5),
                swap in the live-style audit ticker that cycles every 8s
                through anonymized events seeded from the 135-case corpus.
                This is the moment that reads as social proof rather than
                marketing copy. */}
            {tickerActive ? (
              <div
                aria-live="polite"
                style={{
                  padding: '10px 14px',
                  fontSize: 11,
                  background: C.white,
                  borderTop: `1px solid ${C.slate200}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  minHeight: 38,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background: C.green,
                    boxShadow: `0 0 0 4px rgba(22,163,74,0.18)`,
                    animation: 'srg-pulse 1.6s ease-in-out infinite',
                    flexShrink: 0,
                  }}
                />
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={`${tickerEvent.industry}-${tickerEvent.dqi}-${tickerEvent.biasCount}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.35 }}
                    style={{
                      color: C.slate600,
                      lineHeight: 1.35,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flex: 1,
                    }}
                  >
                    <span style={{ color: C.slate900, fontWeight: 600 }}>
                      CSO in {tickerEvent.industry}
                    </span>
                    {' \u00b7 '}
                    {tickerEvent.auditType}
                    {' \u00b7 '}
                    <span style={{ color: C.green, fontWeight: 700 }}>DQI {tickerEvent.dqi}</span>
                    {' \u00b7 '}
                    {tickerEvent.biasCount} bias
                    {tickerEvent.biasCount === 1 ? '' : 'es'}
                  </motion.span>
                </AnimatePresence>
              </div>
            ) : (
              <div
                style={{
                  padding: '10px 14px',
                  fontSize: 11,
                  color: C.slate500,
                  textAlign: 'center',
                  background: C.white,
                  borderTop: `1px solid ${C.slate200}`,
                }}
              >
                Click to see a real audit &rarr;
              </div>
            )}
            <style>{`
              @keyframes srg-pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.65; transform: scale(1.22); }
              }
            `}</style>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded modal — shows the full 3D HeroDecisionGraph */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setExpanded(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15,23,42,0.78)',
              backdropFilter: 'blur(6px)',
              zIndex: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onClick={e => e.stopPropagation()}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 960,
                background: C.white,
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: '0 40px 120px rgba(0,0,0,0.5)',
              }}
            >
              <button
                onClick={() => setExpanded(false)}
                aria-label="Close expanded graph"
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: 'none',
                  background: C.slate900,
                  color: C.white,
                  cursor: 'pointer',
                  zIndex: 2,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
              <div style={{ padding: 24 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: C.green,
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                    marginBottom: 8,
                  }}
                >
                  Decision Knowledge Graph &middot; sample output
                </div>
                <h3
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: C.slate900,
                    margin: 0,
                    marginBottom: 16,
                    letterSpacing: '-0.015em',
                  }}
                >
                  WeWork&rsquo;s S-1 &mdash; 11 pre-decision biases Decision Intel would have
                  flagged.
                </h3>
                <HeroDecisionGraph />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ConstellationCanvas — the quiet anatomy-of-a-decision viz.

   Geometry:
     - Central "your call" disc at panel centre
     - 5 capability tiles arranged in a pentagon, r=88 from centre
     - Thin dashed orbit ring behind the tiles
     - Edges thread from each tile to centre as its stage activates
     - Ambient pulse particles flow inward along active edges

   Palette is deliberately restrained — green only where activation is
   meaningful (edges, active icons, core). Everything else is slate.
   ═══════════════════════════════════════════════════════════════════ */

function ConstellationCanvas({ stage, panelSize }: { stage: number; panelSize: number }) {
  const cx = panelSize / 2;
  const cy = panelSize / 2 - 6; // nudge upward to leave footer breathing room
  const orbitR = 92;

  const nodes = CAPABILITIES.map((cap, i) => {
    const rad = (cap.angle * Math.PI) / 180;
    return {
      ...cap,
      x: cx + orbitR * Math.cos(rad),
      y: cy - orbitR * Math.sin(rad),
      activeAt: i + 1,
    };
  });

  const fullyComposed = stage >= 5;

  return (
    <svg viewBox={`0 0 ${panelSize} ${panelSize}`} width="100%" height="100%" aria-hidden>
      <defs>
        <radialGradient id="core-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.green} stopOpacity="0.22" />
          <stop offset="70%" stopColor={C.green} stopOpacity="0.04" />
          <stop offset="100%" stopColor={C.green} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="core-disc" cx="35%" cy="30%" r="72%">
          <stop offset="0%" stopColor="#BBF7D0" />
          <stop offset="55%" stopColor="#34D399" />
          <stop offset="100%" stopColor={C.greenDark} />
        </radialGradient>
        <filter id="tile-shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#0F172A" floodOpacity="0.06" />
          <feDropShadow dx="0" dy="5" stdDeviation="10" floodColor="#0F172A" floodOpacity="0.05" />
        </filter>
      </defs>

      {/* Orbit ring — very quiet */}
      <circle
        cx={cx}
        cy={cy}
        r={orbitR}
        fill="none"
        stroke={C.slate200}
        strokeWidth="0.6"
        strokeDasharray="1 5"
        opacity="0.6"
      />

      {/* Soft halo behind core */}
      <circle cx={cx} cy={cy} r="66" fill="url(#core-halo)" />

      {/* Edges — animate pathLength from centre outward when active */}
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

      {/* Ambient pulse particles — flow from each active node toward core */}
      {nodes.map(n => {
        const active = stage >= n.activeAt;
        if (!active) return null;
        return (
          <motion.circle
            key={`pulse-${n.id}`}
            r="1.8"
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
                x="-16"
                y="-16"
                width="32"
                height="32"
                rx="9"
                fill={C.white}
                stroke={active ? 'rgba(22,163,74,0.38)' : C.slate200}
                strokeWidth="1"
                filter="url(#tile-shadow)"
              />
              {n.icon(active ? C.greenDark : C.slate400)}
              <text
                y="28"
                fontSize="9"
                fontWeight="700"
                fill={active ? C.slate900 : C.slate400}
                textAnchor="middle"
                fontFamily="system-ui, -apple-system, sans-serif"
                style={{ transition: 'fill 0.4s' }}
              >
                {n.short}
              </text>
            </g>
          </motion.g>
        );
      })}

      {/* Central "your call" core */}
      <g>
        {/* Pulsing outer ring — only when fully composed */}
        {fullyComposed && (
          <motion.circle
            cx={cx}
            cy={cy}
            r="24"
            fill="none"
            stroke="rgba(22,163,74,0.35)"
            strokeWidth="1"
            animate={{ r: [24, 30, 24], opacity: [0.8, 0.25, 0.8] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        {/* Static outer ring when composing */}
        {!fullyComposed && (
          <circle
            cx={cx}
            cy={cy}
            r="22"
            fill="none"
            stroke="rgba(148,163,184,0.35)"
            strokeWidth="1"
          />
        )}
        {/* Inner disc */}
        <circle cx={cx} cy={cy} r="16" fill="url(#core-disc)" />
        {/* Glass highlight */}
        <ellipse cx={cx - 4} cy={cy - 5} rx="7" ry="3" fill="rgba(255,255,255,0.55)" />
        {/* Minimal monogram */}
        <text
          x={cx}
          y={cy + 3.5}
          fontSize="11"
          fontWeight="800"
          fill={C.white}
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="-0.02em"
        >
          DI
        </text>
      </g>

      {/* Caption */}
      <text
        x={panelSize / 2}
        y={panelSize - 22}
        fontSize="9"
        fontWeight="800"
        fill={C.slate500}
        textAnchor="middle"
        fontFamily="var(--font-mono, monospace)"
        letterSpacing="0.14em"
      >
        {fullyComposed ? 'EVERY ANGLE \u00B7 ONE CALL' : `${stage} / 5 LAYERS ACTIVE`}
      </text>
    </svg>
  );
}
