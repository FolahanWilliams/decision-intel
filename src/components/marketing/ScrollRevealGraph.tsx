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

import { useEffect, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Maximize2, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { AnatomyOfACallGraph, ANATOMY_CAPABILITIES } from './AnatomyOfACallGraph';

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
   Icon definitions + CAPABILITIES array extracted to
   ./AnatomyOfACallGraph.tsx on 2026-04-23 so /how-it-works can render
   the same pentagon. Local STAGE_SUBTITLES below reads
   ANATOMY_CAPABILITIES — single source of truth. */

/* ─── Live audit ticker — seeded from the 143-case corpus ───────────
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
  ANATOMY_CAPABILITIES[0].full,
  ANATOMY_CAPABILITIES[1].full,
  ANATOMY_CAPABILITIES[2].full,
  ANATOMY_CAPABILITIES[3].full,
  ANATOMY_CAPABILITIES[4].full,
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

  if (dismissed || reducedMotion) return null;

  const panelSize = 320;
  const fullyComposed = stage >= 5;
  const miniSize = 80;

  return (
    <>
      {/* Mobile / narrow-viewport surface — below 1024px we replace the
          full 320px panel with a compact 80x80 tappable bubble so the
          constellation stays visible without stealing vertical pixels
          from phone traffic. Tapping expands into the shared modal that
          desktop uses for the full 3D graph view. (2026-04-23: mobile
          discoverability fix — previously the overlay was desktop-only
          and half the landing visitors never saw the pentagon.) */}
      <AnimatePresence>
        {!desktop && visible && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.88 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed',
              right: 16,
              bottom: 16,
              zIndex: 50,
              pointerEvents: 'auto',
            }}
          >
            <button
              type="button"
              onClick={() => setExpanded(true)}
              aria-label="Open Decision Intel capability constellation"
              style={{
                width: miniSize,
                height: miniSize,
                borderRadius: '50%',
                border: '1px solid rgba(22,163,74,0.25)',
                background: C.white,
                boxShadow: '0 10px 28px rgba(15,23,42,0.18)',
                padding: 6,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AnatomyOfACallGraph
                stage={5}
                size={miniSize - 12}
                reducedMotion
                captionOverride={null}
              />
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss capability constellation"
              style={{
                position: 'absolute',
                top: -6,
                right: -6,
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: C.slate900,
                color: C.white,
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {desktop && visible && (
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
              <AnatomyOfACallGraph stage={stage} size={panelSize} />

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
                through anonymized events seeded from the 143-case corpus.
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
