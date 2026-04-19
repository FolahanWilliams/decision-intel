'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, FileText, Sparkles, Zap } from 'lucide-react';
import {
  DI_GAPS,
  type DiCapability,
  type DiGap,
  type GapId,
} from '@/lib/data/competitive-positioning';

/**
 * Landing-page "category-creator" showcase.
 *
 * Names the three problems the decision-intelligence category has left
 * unsolved (causal reasoning, closed-loop execution, regulator-grade
 * governance) without naming any vendor, and lets the visitor play with
 * a product-grade interactive visualisation for each one. Three tabs,
 * three bespoke viz:
 *
 *   - CausalGraphViz: a Decision Knowledge Graph that toggles between a
 *     "correlation view" (dashed, directionless, grey) and a "causation
 *     view" (directed arrows, bias-ringed roots, outcome-coloured leaves).
 *     Click any node to see its causal parents + downstream consequences.
 *
 *   - ClosedLoopFlywheelViz: a four-stage flywheel (audit → commit →
 *     detect outcome → recalibrate) that rotates continuously. A travelling
 *     dot represents a decision moving through the loop. Click any stage
 *     to pause the rotation and expand the per-stage detail inline.
 *
 *   - GovernanceMemoViz: a mock strategic memo with four flagged
 *     sentences. Click a flag to reveal which of the seven regulatory
 *     frameworks it triggers, with provision-level citations.
 *
 * All three respect prefers-reduced-motion, are keyboard-accessible, and
 * mirror the C-palette used by the rest of the landing page.
 */

const C = {
  navy: '#0F172A',
  navyLight: '#1E293B',
  white: '#FFFFFF',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0F172A',
  green: '#16A34A',
  greenLight: '#DCFCE7',
  greenBorder: '#86EFAC',
  greenSoft: '#F0FDF4',
  amber: '#D97706',
  amberLight: '#FEF3C7',
  red: '#DC2626',
  redLight: '#FEE2E2',
  blue: '#0EA5E9',
  blueLight: '#E0F2FE',
  violet: '#8B5CF6',
  violetLight: '#EDE9FE',
} as const;

// ─── Shared: capability pill ─────────────────────────────────────────────

function CapabilityPill({ capability }: { capability: DiCapability }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(v => !v)}
      aria-expanded={open}
      style={{
        textAlign: 'left',
        background: open ? C.greenSoft : C.white,
        border: `1px solid ${open ? C.greenBorder : C.slate200}`,
        borderLeft: `3px solid ${C.green}`,
        borderRadius: 10,
        padding: '10px 14px',
        cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: C.slate900,
            lineHeight: 1.3,
          }}
        >
          {capability.label}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: C.green,
            background: C.greenLight,
            border: `1px solid ${C.greenBorder}`,
            padding: '1px 6px',
            borderRadius: 999,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            flexShrink: 0,
          }}
        >
          Shipped
        </span>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                fontSize: 12,
                color: C.slate600,
                lineHeight: 1.55,
                marginBottom: capability.proofFile ? 6 : 0,
              }}
            >
              {capability.detail}
            </div>
            {capability.proofFile && (
              <div
                style={{
                  fontSize: 11,
                  color: C.slate500,
                  fontFamily:
                    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                  background: C.slate50,
                  border: `1px solid ${C.slate200}`,
                  borderRadius: 6,
                  padding: '3px 7px',
                  display: 'inline-block',
                }}
              >
                {capability.proofFile}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

// ─── Viz 1: Causal Graph (implemented below this scaffold) ──────────────

function CausalGraphViz({ reducedMotion }: { reducedMotion: boolean }) {
  return <CausalGraphVizImpl reducedMotion={reducedMotion} />;
}

// ─── Viz 2: Flywheel ───

function ClosedLoopFlywheelViz({ reducedMotion }: { reducedMotion: boolean }) {
  return <ClosedLoopFlywheelVizImpl reducedMotion={reducedMotion} />;
}

// ─── Viz 3: Governance memo ───

function GovernanceMemoViz({ reducedMotion }: { reducedMotion: boolean }) {
  return <GovernanceMemoVizImpl reducedMotion={reducedMotion} />;
}

// ─── Per-tab panel: big viz on the left, narrative + capabilities + outcome on the right

function GapPanel({ gap, reducedMotion }: { gap: DiGap; reducedMotion: boolean }) {
  const Viz =
    gap.id === 'causal'
      ? CausalGraphViz
      : gap.id === 'execution'
        ? ClosedLoopFlywheelViz
        : GovernanceMemoViz;

  return (
    <motion.div
      key={gap.id}
      initial={reducedMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="category-gap-panel-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1fr)',
        gap: 28,
        padding: '28px 32px',
      }}
    >
      {/* Left — rich interactive viz */}
      <div style={{ minWidth: 0 }}>
        <Viz reducedMotion={reducedMotion} />
      </div>

      {/* Right — narrative + capabilities */}
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: C.red,
              background: C.redLight,
              border: `1px solid #FCA5A5`,
              padding: '3px 8px',
              borderRadius: 999,
              marginBottom: 10,
            }}
          >
            Category problem
          </div>
          <p
            style={{
              fontSize: 14,
              color: C.slate700,
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {gap.categoryProblem}
          </p>
          <p
            style={{
              fontSize: 13,
              color: C.slate500,
              lineHeight: 1.6,
              margin: '10px 0 0',
              fontStyle: 'italic',
            }}
          >
            {gap.whatFailureLooksLike}
          </p>
        </div>

        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: C.green,
              background: C.greenLight,
              border: `1px solid ${C.greenBorder}`,
              padding: '3px 8px',
              borderRadius: 999,
              marginBottom: 10,
            }}
          >
            How Decision Intel closes it
          </div>
          <p
            style={{
              fontSize: 14,
              color: C.slate700,
              lineHeight: 1.6,
              margin: '0 0 12px',
              fontWeight: 500,
            }}
          >
            {gap.diApproach}
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 8,
            }}
            className="category-gap-caps"
          >
            {gap.diCapabilities.map(cap => (
              <CapabilityPill key={cap.label} capability={cap} />
            ))}
          </div>
        </div>

        <div
          style={{
            background: C.navy,
            color: C.white,
            borderRadius: 14,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(22, 163, 74, 0.18)',
              border: '1px solid rgba(134, 239, 172, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Zap size={16} color={C.greenBorder} strokeWidth={2.4} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: C.greenBorder,
                marginBottom: 2,
              }}
            >
              Outcome lift · {gap.outcomeLift.label}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: 20, fontWeight: 800, color: C.white }}>
                {gap.outcomeLift.value}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.72)',
                  lineHeight: 1.45,
                }}
              >
                {gap.outcomeLift.caption}
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: 11,
            color: C.slate500,
            lineHeight: 1.55,
            fontStyle: 'italic',
            paddingLeft: 10,
            borderLeft: `2px solid ${C.slate200}`,
          }}
        >
          {gap.evidence}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main showcase ───────────────────────────────────────────────────────

function subscribeReducedMotion(cb: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}
const getReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const getReducedMotionServer = () => false;

export function CategoryGapShowcase() {
  const [activeId, setActiveId] = useState<GapId>(DI_GAPS[0].id);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getReducedMotionServer,
  );

  const activeGap = useMemo(
    () => DI_GAPS.find(g => g.id === activeId) ?? DI_GAPS[0],
    [activeId],
  );

  return (
    <section
      style={{
        background: C.slate50,
        padding: '80px 24px',
      }}
    >
      <style>{`
        @media (max-width: 959px) {
          .category-gap-panel-grid {
            grid-template-columns: 1fr !important;
            padding: 22px 20px !important;
          }
          .category-gap-caps {
            grid-template-columns: 1fr !important;
          }
          .category-gap-tabs {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .category-gap-tabs::-webkit-scrollbar { display: none; }
          .category-gap-tab { flex: 0 0 auto !important; min-width: 220px; }
        }
      `}</style>

      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: C.green,
              background: C.greenLight,
              border: `1px solid ${C.greenBorder}`,
              padding: '4px 10px',
              borderRadius: 999,
              marginBottom: 16,
            }}
          >
            <Sparkles size={11} strokeWidth={2.4} />
            Category-defining
          </div>
          <h2
            style={{
              fontSize: 'clamp(28px, 3.6vw, 42px)',
              fontWeight: 800,
              color: C.slate900,
              letterSpacing: '-0.015em',
              lineHeight: 1.1,
              margin: '0 auto 14px',
              maxWidth: 860,
            }}
          >
            The decision-intelligence category has three unsolved problems.
            <br />
            <span style={{ color: C.green }}>We built the platform that solves all three.</span>
          </h2>
          <p
            style={{
              fontSize: 'clamp(14px, 1.4vw, 17px)',
              color: C.slate600,
              lineHeight: 1.6,
              maxWidth: 720,
              margin: '0 auto',
            }}
          >
            Correlation dressed up as insight. Loops that never close. Black-box AI that the
            audit committee can&rsquo;t defend. Each one blocks real value — and each one has
            a specific, shipped answer on the other side of this card.
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: C.white,
            border: `1px solid ${C.slate200}`,
            borderRadius: 22,
            boxShadow:
              '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 32px rgba(15, 23, 42, 0.06)',
            overflow: 'hidden',
          }}
        >
          {/* Tabs */}
          <div
            role="tablist"
            aria-label="Three unsolved problems in decision intelligence"
            className="category-gap-tabs"
            style={{
              display: 'flex',
              background: C.slate50,
              borderBottom: `1px solid ${C.slate100}`,
            }}
          >
            {DI_GAPS.map((gap, i) => {
              const isActive = gap.id === activeId;
              return (
                <button
                  key={gap.id}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`gap-panel-${gap.id}`}
                  id={`gap-tab-${gap.id}`}
                  onClick={() => setActiveId(gap.id)}
                  className="category-gap-tab"
                  style={{
                    flex: 1,
                    padding: '18px 22px',
                    border: 'none',
                    background: isActive ? C.white : 'transparent',
                    cursor: 'pointer',
                    borderBottom: isActive
                      ? `2px solid ${C.green}`
                      : '2px solid transparent',
                    transition: 'all 0.15s',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: isActive ? C.green : C.slate200,
                        color: isActive ? C.white : C.slate500,
                        fontSize: 11,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: isActive ? C.green : C.slate500,
                      }}
                    >
                      Problem {i + 1} · {gap.name}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: isActive ? 800 : 600,
                      color: isActive ? C.slate900 : C.slate600,
                      lineHeight: 1.35,
                    }}
                  >
                    {gap.fullName}
                  </div>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <div
              key={activeGap.id}
              role="tabpanel"
              id={`gap-panel-${activeGap.id}`}
              aria-labelledby={`gap-tab-${activeGap.id}`}
            >
              <GapPanel gap={activeGap} reducedMotion={reducedMotion} />
            </div>
          </AnimatePresence>
        </div>

        {/* CTAs */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 18,
            marginTop: 32,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '11px 20px',
              background: C.white,
              border: `1.5px solid ${C.greenBorder}`,
              borderRadius: 999,
              boxShadow: '0 2px 10px rgba(22, 163, 74, 0.12)',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: C.green,
                color: C.white,
                flexShrink: 0,
              }}
            >
              <Check size={14} strokeWidth={3} />
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.slate900 }}>
              One platform. All three problems closed in a single 60-second audit.
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 24,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <Link
              href="/how-it-works"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: C.green,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              See the 12-node pipeline <ArrowRight size={13} />
            </Link>
            <Link
              href="/bias-genome"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: C.green,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              See the Bias Genome <ArrowRight size={13} />
            </Link>
            <Link
              href="/proof"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: C.green,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              See a real pre-decision audit <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Viz implementations (each ~200-280 LOC below) ───────────────────────

// ─── Viz 1: Causal Graph — correlation ↔ causation toggle ────────────────
//
// 8 nodes arranged in a rough left-to-right causal flow for a sample
// acquisition thesis. Toggle between "correlation" view (dashed grey edges,
// no direction, scattered) and "causation" view (directed green arrows,
// bias-ringed roots, red outcome). Click any node to pin it; the panel
// below shows upstream causes + downstream effects.

type CausalNodeKind = 'bias' | 'assumption' | 'claim' | 'outcome' | 'signal';

interface CausalNode {
  id: string;
  label: string;
  kind: CausalNodeKind;
  x: number; // base position in 0-100 space
  y: number;
  /** Corr-view position (perturbed) */
  cx: number;
  cy: number;
}

interface CausalEdge {
  from: string;
  to: string;
  /** Optional label shown in causation view */
  label?: string;
}

const CAUSAL_NODES: CausalNode[] = [
  { id: 'ceo',        label: 'CEO vision',           kind: 'bias',        x: 10, y: 20, cx: 14, cy: 18 },
  { id: 'market',     label: 'Market slowdown',      kind: 'signal',      x: 10, y: 72, cx: 18, cy: 70 },
  { id: 'legacy',     label: 'Legacy asset',         kind: 'bias',        x: 10, y: 46, cx: 28, cy: 42 },
  { id: 'memo',       label: 'Acquisition memo',     kind: 'assumption',  x: 42, y: 36, cx: 48, cy: 28 },
  { id: 'competitor', label: 'Competitor move',      kind: 'signal',      x: 42, y: 72, cx: 52, cy: 78 },
  { id: 'synergy',    label: 'Claimed £80M synergy', kind: 'claim',       x: 68, y: 44, cx: 70, cy: 50 },
  { id: 'dissent',    label: 'Dissent absent',       kind: 'bias',        x: 68, y: 20, cx: 78, cy: 18 },
  { id: 'outcome',    label: 'Revenue miss',         kind: 'outcome',     x: 92, y: 50, cx: 86, cy: 60 },
];

const CAUSAL_EDGES: CausalEdge[] = [
  { from: 'ceo',        to: 'memo',    label: 'confirmation' },
  { from: 'market',     to: 'memo',    label: 'anchoring' },
  { from: 'competitor', to: 'memo',    label: 'availability' },
  { from: 'legacy',     to: 'synergy', label: 'sunk cost' },
  { from: 'dissent',    to: 'synergy', label: 'groupthink' },
  { from: 'memo',       to: 'synergy' },
  { from: 'synergy',    to: 'outcome' },
];

const KIND_STYLE: Record<CausalNodeKind, { fill: string; ring: string; text: string }> = {
  bias:       { fill: '#FEE2E2', ring: '#DC2626', text: '#7F1D1D' },
  assumption: { fill: '#E0F2FE', ring: '#0284C7', text: '#075985' },
  claim:      { fill: '#F1F5F9', ring: '#64748B', text: '#1E293B' },
  outcome:    { fill: '#DCFCE7', ring: '#16A34A', text: '#14532D' },
  signal:     { fill: '#EDE9FE', ring: '#8B5CF6', text: '#4C1D95' },
};

const KIND_LABEL: Record<CausalNodeKind, string> = {
  bias: 'Bias',
  assumption: 'Assumption',
  claim: 'Claim',
  outcome: 'Outcome',
  signal: 'Signal',
};

function CausalGraphVizImpl({ reducedMotion }: { reducedMotion: boolean }) {
  const [view, setView] = useState<'correlation' | 'causation'>('causation');
  const [sel, setSel] = useState<string | null>('memo');

  const w = 460;
  const h = 260;
  const pos = (n: CausalNode) => {
    const useCorr = view === 'correlation';
    return {
      x: ((useCorr ? n.cx : n.x) / 100) * w,
      y: ((useCorr ? n.cy : n.y) / 100) * h,
    };
  };

  const selected = useMemo(() => CAUSAL_NODES.find(n => n.id === sel) ?? null, [sel]);
  const upstream = useMemo(
    () =>
      selected
        ? CAUSAL_EDGES.filter(e => e.to === selected.id).map(e => ({
            edge: e,
            node: CAUSAL_NODES.find(n => n.id === e.from)!,
          }))
        : [],
    [selected],
  );
  const downstream = useMemo(
    () =>
      selected
        ? CAUSAL_EDGES.filter(e => e.from === selected.id).map(e => ({
            edge: e,
            node: CAUSAL_NODES.find(n => n.id === e.to)!,
          }))
        : [],
    [selected],
  );

  const arrow = view === 'causation' ? 'url(#causal-arrow)' : undefined;

  return (
    <div
      style={{
        background: C.slate50,
        border: `1px solid ${C.slate200}`,
        borderRadius: 16,
        padding: 14,
      }}
    >
      {/* Toggle row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: C.slate500,
          }}
        >
          Live · Decision Knowledge Graph · sample acquisition thesis
        </div>
        <div
          role="tablist"
          aria-label="Graph view"
          style={{
            display: 'inline-flex',
            background: C.white,
            border: `1px solid ${C.slate200}`,
            borderRadius: 999,
            padding: 3,
          }}
        >
          {(['correlation', 'causation'] as const).map(v => {
            const isActive = view === v;
            return (
              <button
                key={v}
                role="tab"
                aria-selected={isActive}
                onClick={() => setView(v)}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '5px 12px',
                  borderRadius: 999,
                  border: 'none',
                  background: isActive ? (v === 'causation' ? C.green : C.slate400) : 'transparent',
                  color: isActive ? C.white : C.slate500,
                  cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {v === 'correlation' ? 'Correlation' : 'Causation'}
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG graph */}
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width="100%"
        style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
        role="img"
        aria-label={
          view === 'causation'
            ? 'Decision Knowledge Graph in causation view — directed arrows from causes to outcomes.'
            : 'Decision Knowledge Graph in correlation view — undirected dashed links only.'
        }
      >
        <defs>
          <marker
            id="causal-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.green} />
          </marker>
        </defs>

        {/* Edges */}
        {CAUSAL_EDGES.map((e, i) => {
          const from = CAUSAL_NODES.find(n => n.id === e.from)!;
          const to = CAUSAL_NODES.find(n => n.id === e.to)!;
          const p1 = pos(from);
          const p2 = pos(to);
          const isSelEdge =
            selected && (selected.id === e.from || selected.id === e.to);
          const stroke =
            view === 'causation'
              ? isSelEdge
                ? C.green
                : 'rgba(22, 163, 74, 0.5)'
              : C.slate300;
          return (
            <motion.line
              key={`edge-${i}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={stroke}
              strokeWidth={isSelEdge ? 2 : 1.25}
              strokeDasharray={view === 'correlation' ? '4 4' : '0'}
              markerEnd={view === 'causation' ? arrow : undefined}
              animate={reducedMotion ? undefined : { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          );
        })}

        {/* Edge labels (causation view only) */}
        {view === 'causation' &&
          CAUSAL_EDGES.filter(e => e.label).map((e, i) => {
            const from = CAUSAL_NODES.find(n => n.id === e.from)!;
            const to = CAUSAL_NODES.find(n => n.id === e.to)!;
            const p1 = pos(from);
            const p2 = pos(to);
            const mx = (p1.x + p2.x) / 2;
            const my = (p1.y + p2.y) / 2 - 3;
            return (
              <text
                key={`elabel-${i}`}
                x={mx}
                y={my}
                fontSize={8}
                fontWeight={700}
                fill={C.slate500}
                textAnchor="middle"
                style={{ pointerEvents: 'none' }}
              >
                {e.label}
              </text>
            );
          })}

        {/* Nodes */}
        {CAUSAL_NODES.map(n => {
          const style = KIND_STYLE[n.kind];
          const p = pos(n);
          const isSel = sel === n.id;
          const labelY = p.y + 26;
          return (
            <motion.g
              key={n.id}
              onClick={() => setSel(isSel ? null : n.id)}
              style={{ cursor: 'pointer' }}
              animate={reducedMotion ? undefined : { transform: `translate(${p.x}px, ${p.y}px)` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              {...(!reducedMotion
                ? {}
                : { transform: `translate(${p.x}, ${p.y})` })}
            >
              {isSel && (
                <circle
                  cx={reducedMotion ? 0 : 0}
                  cy={reducedMotion ? 0 : 0}
                  r={18}
                  fill="none"
                  stroke={style.ring}
                  strokeWidth={1}
                  opacity={0.45}
                />
              )}
              <circle
                cx={0}
                cy={0}
                r={12}
                fill={style.fill}
                stroke={style.ring}
                strokeWidth={n.kind === 'outcome' || isSel ? 2 : 1.25}
              />
              <text
                x={0}
                y={labelY - p.y}
                fontSize={9}
                fontWeight={isSel ? 800 : 600}
                fill={style.text}
                textAnchor="middle"
                style={{ pointerEvents: 'none' }}
              >
                {n.label}
              </text>
            </motion.g>
          );
        })}
      </svg>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          marginTop: 10,
          paddingTop: 10,
          borderTop: `1px dashed ${C.slate200}`,
        }}
      >
        {(['bias', 'signal', 'assumption', 'claim', 'outcome'] as CausalNodeKind[]).map(
          kind => {
            const s = KIND_STYLE[kind];
            return (
              <span
                key={kind}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  color: C.slate600,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: C.white,
                  border: `1px solid ${C.slate200}`,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: s.fill,
                    border: `1.5px solid ${s.ring}`,
                  }}
                />
                {KIND_LABEL[kind]}
              </span>
            );
          },
        )}
      </div>

      {/* Selection panel */}
      <AnimatePresence initial={false}>
        {selected && (
          <motion.div
            key={`sel-${selected.id}-${view}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{
              marginTop: 10,
              padding: '12px 14px',
              background: C.white,
              border: `1px solid ${C.slate200}`,
              borderLeft: `3px solid ${KIND_STYLE[selected.kind].ring}`,
              borderRadius: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                marginBottom: 8,
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: KIND_STYLE[selected.kind].ring,
                    background: KIND_STYLE[selected.kind].fill,
                    border: `1px solid ${KIND_STYLE[selected.kind].ring}33`,
                    padding: '2px 8px',
                    borderRadius: 999,
                  }}
                >
                  {KIND_LABEL[selected.kind]}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.slate900 }}>
                  {selected.label}
                </span>
              </div>
              <button
                onClick={() => setSel(null)}
                aria-label="Close node detail"
                style={{
                  background: 'none',
                  border: 'none',
                  color: C.slate400,
                  cursor: 'pointer',
                  fontSize: 14,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                fontSize: 11,
                color: C.slate600,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: C.slate500,
                    marginBottom: 4,
                  }}
                >
                  Upstream causes
                </div>
                {upstream.length === 0 ? (
                  <span style={{ color: C.slate400 }}>— root node</span>
                ) : (
                  upstream.map(({ edge, node }) => (
                    <div key={`u-${node.id}`} style={{ marginBottom: 2 }}>
                      <strong style={{ color: C.slate900 }}>{node.label}</strong>
                      {edge.label && (
                        <span style={{ color: C.slate500 }}> · {edge.label}</span>
                      )}
                    </div>
                  ))
                )}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: C.slate500,
                    marginBottom: 4,
                  }}
                >
                  Downstream effects
                </div>
                {downstream.length === 0 ? (
                  <span style={{ color: C.slate400 }}>— terminal node</span>
                ) : (
                  downstream.map(({ edge, node }) => (
                    <div key={`d-${node.id}`} style={{ marginBottom: 2 }}>
                      <strong style={{ color: C.slate900 }}>{node.label}</strong>
                      {edge.label && (
                        <span style={{ color: C.slate500 }}> · {edge.label}</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Viz 2: Closed-Loop Flywheel ─────────────────────────────────────────
//
// Four stages orbit a central Decision Knowledge Graph node. A travelling
// pulse moves around the loop to make "the decision moving through the
// cycle" visually explicit. Clicking a stage pauses the rotation and
// expands the stage's detail panel inline. Respects prefers-reduced-motion.

interface FlywheelStage {
  id: 'audit' | 'commit' | 'detect' | 'calibrate';
  icon: 'clipboard' | 'check' | 'radar' | 'refresh';
  label: string;
  sub: string;
  detail: string;
  cap: string;
}

const FLYWHEEL_STAGES: FlywheelStage[] = [
  {
    id: 'audit',
    icon: 'clipboard',
    label: 'Audit',
    sub: '12-node pipeline',
    detail:
      '60-second audit: bias detection across 30+ types, 3-judge noise measurement, logical coherence check, pre-mortem, red team, fact-check, compliance mapping, compound-risk scoring, verdict synthesis. Output: a DQI score and an evidence pack.',
    cap: 'DQI assigned',
  },
  {
    id: 'commit',
    icon: 'check',
    label: 'Commit',
    sub: 'Committee approves',
    detail:
      'The recommendation goes to the steering committee. The audited memo, the DQI trend, and the named counter-exemplars land in the pre-read. Dissent is already surfaced; debate becomes about evidence, not about whether to look for bias.',
    cap: 'Decision signed',
  },
  {
    id: 'detect',
    icon: 'radar',
    label: 'Detect',
    sub: 'Outcome surfaces passively',
    detail:
      'Outcome listeners on Slack, Drive, and email detect what actually happened — revenue hit or miss, milestone cleared, synergy delivered. No one has to update a field. Detection latency is measured in days, not quarters.',
    cap: 'Outcome captured',
  },
  {
    id: 'calibrate',
    icon: 'refresh',
    label: 'Calibrate',
    sub: 'Brier + Bayesian update',
    detail:
      'The gap between predicted DQI and actual outcome scores the original prediction with a Brier score. Per-org DQI weights shift along the gradient. After 12 months your score is tuned to your decisions, not an industry average.',
    cap: 'Weights shift',
  },
];

function StageIcon({
  kind,
  size = 14,
  color,
}: {
  kind: FlywheelStage['icon'];
  size?: number;
  color: string;
}) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (kind === 'clipboard')
    return (
      <svg {...common}>
        <rect x="6" y="4" width="12" height="17" rx="2" />
        <path d="M9 4h6v3H9z" />
        <path d="M9 11h6M9 15h4" />
      </svg>
    );
  if (kind === 'check')
    return (
      <svg {...common}>
        <path d="M5 12l5 5L20 7" />
      </svg>
    );
  if (kind === 'radar')
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.5" fill={color} stroke="none" />
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" />
      <path d="M18 3v4h-4M6 21v-4h4" />
    </svg>
  );
}

function ClosedLoopFlywheelVizImpl({ reducedMotion }: { reducedMotion: boolean }) {
  const [pausedStage, setPausedStage] = useState<FlywheelStage['id'] | null>(null);
  const paused = pausedStage !== null || reducedMotion;

  const size = 360;
  const cx = size / 2;
  const cy = size / 2;
  const orbit = 118;
  const stageAngle = (i: number) => (i / FLYWHEEL_STAGES.length) * 2 * Math.PI - Math.PI / 2;
  const stagePos = (i: number) => ({
    x: cx + Math.cos(stageAngle(i)) * orbit,
    y: cy + Math.sin(stageAngle(i)) * orbit,
  });

  const selectedStage = FLYWHEEL_STAGES.find(s => s.id === pausedStage) ?? null;

  // Build circle path for the travelling dot (counterclockwise visual = arrow direction).
  const dotPath = `M ${cx} ${cy - orbit} A ${orbit} ${orbit} 0 1 1 ${cx - 0.001} ${cy - orbit}`;

  return (
    <div
      style={{
        background: C.slate50,
        border: `1px solid ${C.slate200}`,
        borderRadius: 16,
        padding: 14,
      }}
    >
      {/* Top row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: C.slate500,
          }}
        >
          Live · Outcome flywheel · click any stage to pause + inspect
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 10,
            fontWeight: 700,
            color: paused ? C.slate500 : C.green,
            background: paused ? C.slate100 : C.greenLight,
            border: `1px solid ${paused ? C.slate200 : C.greenBorder}`,
            padding: '3px 8px',
            borderRadius: 999,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          <motion.span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: paused ? C.slate400 : C.green,
              display: 'inline-block',
            }}
            animate={paused ? undefined : { opacity: [1, 0.4, 1] }}
            transition={{ repeat: paused ? 0 : Infinity, duration: 1.5 }}
          />
          {paused ? (reducedMotion ? 'Static view' : 'Paused') : 'Rotating'}
        </div>
      </div>

      {/* Flywheel SVG */}
      <div style={{ position: 'relative' }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width="100%"
          style={{ display: 'block', maxWidth: 420, margin: '0 auto' }}
          role="img"
          aria-label="Outcome flywheel: audit, commit, detect outcome, calibrate — rotating."
        >
          <defs>
            <marker
              id="flywheel-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={C.green} />
            </marker>
          </defs>

          {/* Orbit ring */}
          <circle
            cx={cx}
            cy={cy}
            r={orbit}
            fill="none"
            stroke={C.slate200}
            strokeWidth={1.5}
            strokeDasharray="4 5"
          />

          {/* Directional arrows between stages */}
          {FLYWHEEL_STAGES.map((_, i) => {
            const a0 = stageAngle(i) + 0.15;
            const a1 = stageAngle((i + 1) % FLYWHEEL_STAGES.length) - 0.15;
            const p1 = {
              x: cx + Math.cos(a0) * orbit,
              y: cy + Math.sin(a0) * orbit,
            };
            const p2 = {
              x: cx + Math.cos(a1) * orbit,
              y: cy + Math.sin(a1) * orbit,
            };
            const aM = (a0 + a1) / 2;
            const cP = {
              x: cx + Math.cos(aM) * (orbit + 12),
              y: cy + Math.sin(aM) * (orbit + 12),
            };
            return (
              <path
                key={`arc-${i}`}
                d={`M ${p1.x} ${p1.y} Q ${cP.x} ${cP.y} ${p2.x} ${p2.y}`}
                fill="none"
                stroke={C.green}
                strokeWidth={1.5}
                opacity={0.55}
                markerEnd="url(#flywheel-arrow)"
              />
            );
          })}

          {/* Travelling pulse */}
          {!paused && (
            <motion.circle
              r={5}
              fill={C.green}
              animate={{ offsetDistance: ['0%', '100%'] }}
              transition={{ duration: 14, ease: 'linear', repeat: Infinity }}
              style={{
                offsetPath: `path("${dotPath}")`,
                offsetRotate: '0deg',
              }}
            />
          )}

          {/* Centre node */}
          <circle
            cx={cx}
            cy={cy}
            r={48}
            fill={C.white}
            stroke={C.green}
            strokeWidth={1.5}
          />
          <circle
            cx={cx}
            cy={cy}
            r={48}
            fill="none"
            stroke={C.greenBorder}
            strokeWidth={6}
            strokeOpacity={0.5}
          />
          <foreignObject x={cx - 46} y={cy - 32} width={92} height={64}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: C.green,
                textAlign: 'center',
                letterSpacing: '0.06em',
                lineHeight: 1.25,
              }}
            >
              <div style={{ textTransform: 'uppercase', fontSize: 9 }}>
                Decision
              </div>
              <div style={{ fontSize: 12, color: C.slate900, fontWeight: 800, marginTop: 2 }}>
                Knowledge
              </div>
              <div style={{ fontSize: 12, color: C.slate900, fontWeight: 800 }}>Graph</div>
            </div>
          </foreignObject>

          {/* Stage nodes */}
          {FLYWHEEL_STAGES.map((s, i) => {
            const { x, y } = stagePos(i);
            const isPaused = pausedStage === s.id;
            return (
              <g
                key={s.id}
                onClick={() =>
                  setPausedStage(prev => (prev === s.id ? null : s.id))
                }
                style={{ cursor: 'pointer' }}
              >
                {isPaused && (
                  <circle
                    cx={x}
                    cy={y}
                    r={32}
                    fill="none"
                    stroke={C.green}
                    strokeWidth={1}
                    opacity={0.45}
                  />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={25}
                  fill={C.white}
                  stroke={isPaused ? C.green : C.slate300}
                  strokeWidth={isPaused ? 2 : 1.25}
                />
                <foreignObject x={x - 15} y={y - 15} width={30} height={30}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                    }}
                  >
                    <StageIcon
                      kind={s.icon}
                      size={16}
                      color={isPaused ? C.green : C.slate500}
                    />
                  </div>
                </foreignObject>
                {/* Label placement — inside orbit when closer to center, outside otherwise */}
                {(() => {
                  const ang = stageAngle(i);
                  const outside = {
                    x: cx + Math.cos(ang) * (orbit + 40),
                    y: cy + Math.sin(ang) * (orbit + 40),
                  };
                  return (
                    <foreignObject
                      x={outside.x - 60}
                      y={outside.y - 18}
                      width={120}
                      height={40}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          textAlign: 'center',
                          lineHeight: 1.2,
                          color: isPaused ? C.slate900 : C.slate600,
                        }}
                      >
                        <div style={{ fontSize: 11, fontWeight: 800 }}>{s.label}</div>
                        <div
                          style={{
                            fontSize: 9,
                            color: isPaused ? C.green : C.slate400,
                            fontWeight: 600,
                            marginTop: 1,
                          }}
                        >
                          {s.sub}
                        </div>
                      </div>
                    </foreignObject>
                  );
                })()}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Latency chip row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 10,
          flexWrap: 'wrap',
          marginTop: 6,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: C.slate600,
            background: C.white,
            border: `1px solid ${C.slate200}`,
            borderRadius: 999,
            padding: '3px 10px',
          }}
        >
          Audit → commit &nbsp;·&nbsp; 60 seconds
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: C.slate600,
            background: C.white,
            border: `1px solid ${C.slate200}`,
            borderRadius: 999,
            padding: '3px 10px',
          }}
        >
          Outcome → recalibration &nbsp;·&nbsp; typically 4 weeks
        </span>
      </div>

      {/* Stage detail */}
      <AnimatePresence initial={false}>
        {selectedStage && (
          <motion.div
            key={selectedStage.id}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{
              marginTop: 14,
              padding: '14px 16px',
              background: C.white,
              border: `1px solid ${C.slate200}`,
              borderLeft: `3px solid ${C.green}`,
              borderRadius: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 6,
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: C.green,
                  background: C.greenLight,
                  border: `1px solid ${C.greenBorder}`,
                  padding: '2px 8px',
                  borderRadius: 999,
                }}
              >
                <StageIcon kind={selectedStage.icon} size={11} color={C.green} />
                {selectedStage.label}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.slate900 }}>
                {selectedStage.sub}
              </span>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 10,
                  fontWeight: 700,
                  color: C.slate500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                Output · {selectedStage.cap}
              </span>
            </div>
            <div style={{ fontSize: 12, color: C.slate600, lineHeight: 1.55 }}>
              {selectedStage.detail}
            </div>
            <div style={{ marginTop: 10 }}>
              <button
                onClick={() => setPausedStage(null)}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.green,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {reducedMotion ? 'Close detail' : 'Resume rotation →'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Viz 3: Governance Memo — mock strategic memo with framework flags ───
//
// Renders a paper-style strategic memo with four highlighted passages. Each
// highlight is numbered and coloured by bias severity. Clicking a flag opens
// a slide-out card that shows which of the seven regulatory frameworks the
// flag triggers, with provision-level citations. A CTA pill at the bottom
// mimes the "Export Audit Defense Packet" action from the product.

interface FrameworkHit {
  code: string; // e.g. "SOX §404"
  framework: string;
  detail: string;
  primary?: boolean; // lit brighter on the shield
}

interface MemoFlag {
  id: string;
  num: number;
  biasType: string;
  severity: 'high' | 'medium' | 'low';
  snippet: string;
  explanation: string;
  hits: FrameworkHit[];
}

const SEVERITY_STYLE: Record<MemoFlag['severity'], { bg: string; ring: string; text: string }> = {
  high:   { bg: '#FEE2E2', ring: '#DC2626', text: '#7F1D1D' },
  medium: { bg: '#FEF3C7', ring: '#D97706', text: '#92400E' },
  low:    { bg: '#E0F2FE', ring: '#0284C7', text: '#075985' },
};

const MEMO_FLAGS: MemoFlag[] = [
  {
    id: 'overconfidence',
    num: 1,
    biasType: 'Overconfidence',
    severity: 'high',
    snippet:
      'We project £80M in run-rate synergies within 18 months, well ahead of the comparable transactions.',
    explanation:
      'Synergy figure is 2.2× comparable-deal median with no sensitivity analysis attached. Classic overconfidence + availability compound.',
    hits: [
      {
        code: 'SOX §404',
        framework: 'Sarbanes-Oxley',
        detail:
          'Material financial projection disclosed without supporting internal-control assessment.',
        primary: true,
      },
      {
        code: 'SEC Reg D',
        framework: 'SEC Regulation D',
        detail:
          'Forward-looking statement on synergies requires Rule 175 safe-harbour language or risk disclosure.',
      },
      {
        code: 'FCA CD',
        framework: 'FCA Consumer Duty',
        detail:
          'Projection disclosed to investors without proportionate evidence fails fair-value test.',
      },
    ],
  },
  {
    id: 'sunkcost',
    num: 2,
    biasType: 'Sunk-cost anchoring',
    severity: 'high',
    snippet:
      'Given our prior £12M investment in the legacy platform, integration should build on that foundation.',
    explanation:
      'Decision is anchored to an unrecoverable cost. The prior £12M is irrelevant to go-forward ROI.',
    hits: [
      {
        code: 'SOX §404',
        framework: 'Sarbanes-Oxley',
        detail:
          'Material asset impairment risk not flagged in committee materials.',
      },
      {
        code: 'Basel III',
        framework: 'Basel III',
        detail:
          'Capital allocation driven by sunk cost violates risk-weighted capital assessment discipline.',
        primary: true,
      },
    ],
  },
  {
    id: 'dissent',
    num: 3,
    biasType: 'Dissent absent',
    severity: 'medium',
    snippet:
      'The diligence team unanimously supports the thesis; no material concerns surfaced during review.',
    explanation:
      'Unanimous agreement in committees with time pressure is a Kahneman-flagged groupthink marker. Red-team pass is missing.',
    hits: [
      {
        code: 'EU AI Act · Annex III',
        framework: 'EU AI Act',
        detail:
          'High-risk AI decision-support in financial services requires documented adversarial review.',
        primary: true,
      },
      {
        code: 'LPOA',
        framework: 'LPOA',
        detail:
          'Limited-partner fiduciary obligation requires documented dissent in material investment decisions.',
      },
    ],
  },
  {
    id: 'automated',
    num: 4,
    biasType: 'Automated-decision exposure',
    severity: 'low',
    snippet:
      "Customer pricing tiers will be algorithmically assigned post-integration using the acquirer's existing pricing engine.",
    explanation:
      "Automated pricing decisions that affect EU data subjects trigger Article 22 disclosure + opt-out obligations.",
    hits: [
      {
        code: 'GDPR Art. 22',
        framework: 'GDPR',
        detail:
          'Solely automated decisions with legal or similarly significant effect require explicit Art. 22 compliance.',
        primary: true,
      },
      {
        code: 'EU AI Act',
        framework: 'EU AI Act',
        detail:
          'Pricing algorithm classification must be documented under Annex III risk assessment.',
      },
    ],
  },
];

const FRAMEWORK_ORDER = ['SOX', 'GDPR', 'EU AI Act', 'Basel III', 'FCA', 'SEC', 'LPOA'];

function matchFrameworkCode(code: string): string {
  if (code.startsWith('SOX')) return 'SOX';
  if (code.startsWith('GDPR')) return 'GDPR';
  if (code.startsWith('EU AI')) return 'EU AI Act';
  if (code.startsWith('Basel')) return 'Basel III';
  if (code.startsWith('FCA')) return 'FCA';
  if (code.startsWith('SEC')) return 'SEC';
  if (code.startsWith('LPOA')) return 'LPOA';
  return code;
}

function GovernanceMemoVizImpl({ reducedMotion }: { reducedMotion: boolean }) {
  const [selId, setSelId] = useState<string | null>('overconfidence');
  const selected = MEMO_FLAGS.find(f => f.id === selId) ?? null;
  const litFrameworks = useMemo(
    () =>
      new Set(
        selected ? selected.hits.map(h => matchFrameworkCode(h.code)) : [],
      ),
    [selected],
  );

  return (
    <div
      style={{
        background: C.slate50,
        border: `1px solid ${C.slate200}`,
        borderRadius: 16,
        padding: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: C.slate500,
          }}
        >
          Live · Strategic memo · click any numbered flag
        </div>
        <button
          type="button"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            fontWeight: 800,
            color: C.white,
            background: C.green,
            border: 'none',
            borderRadius: 999,
            padding: '5px 12px',
            cursor: 'pointer',
            letterSpacing: '0.05em',
          }}
          onClick={() => {
            /* no-op demo — the real product wires to BoardReportGenerator */
          }}
        >
          <FileText size={12} />
          Export Audit Defense Packet
        </button>
      </div>

      {/* Memo paper */}
      <div
        style={{
          background: C.white,
          border: `1px solid ${C.slate200}`,
          borderRadius: 12,
          padding: '20px 22px',
          fontFamily:
            'Georgia, "Times New Roman", ui-serif, serif',
          color: C.slate700,
          lineHeight: 1.6,
          fontSize: 12.5,
          position: 'relative',
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: C.slate400,
            fontFamily:
              'system-ui, -apple-system, "Segoe UI", sans-serif',
            marginBottom: 6,
          }}
        >
          Confidential · Steering Committee Pre-read
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: C.slate900,
            fontFamily: 'Georgia, serif',
            marginBottom: 12,
            letterSpacing: '-0.01em',
          }}
        >
          Q3 Acquisition Thesis — Project Meridian
        </div>

        <p style={{ margin: '0 0 10px' }}>
          Management recommends proceeding with the £240M acquisition of Meridian Ltd. The
          strategic rationale centres on accelerating our entry into the mid-market segment
          and consolidating fragmented share.{' '}
          <FlagSpan
            flag={MEMO_FLAGS[0]}
            selected={selId === MEMO_FLAGS[0].id}
            onClick={() => setSelId(prev => (prev === MEMO_FLAGS[0].id ? null : MEMO_FLAGS[0].id))}
          />
        </p>
        <p style={{ margin: '0 0 10px' }}>
          <FlagSpan
            flag={MEMO_FLAGS[1]}
            selected={selId === MEMO_FLAGS[1].id}
            onClick={() => setSelId(prev => (prev === MEMO_FLAGS[1].id ? null : MEMO_FLAGS[1].id))}
          />{' '}
          Integration costs are therefore estimated at the lower end of the comparable range,
          with most programme risk already absorbed by the prior build.
        </p>
        <p style={{ margin: '0 0 10px' }}>
          <FlagSpan
            flag={MEMO_FLAGS[2]}
            selected={selId === MEMO_FLAGS[2].id}
            onClick={() => setSelId(prev => (prev === MEMO_FLAGS[2].id ? null : MEMO_FLAGS[2].id))}
          />{' '}
          Given the unanimity of the diligence team and the competitive deal timeline, we
          recommend proceeding to Heads of Terms this quarter.
        </p>
        <p style={{ margin: 0 }}>
          Post-close, operational continuity will be preserved.{' '}
          <FlagSpan
            flag={MEMO_FLAGS[3]}
            selected={selId === MEMO_FLAGS[3].id}
            onClick={() => setSelId(prev => (prev === MEMO_FLAGS[3].id ? null : MEMO_FLAGS[3].id))}
          />
        </p>
      </div>

      {/* Framework strip */}
      <div
        style={{
          marginTop: 14,
          padding: '12px 14px',
          background: C.white,
          border: `1px solid ${C.slate200}`,
          borderRadius: 12,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: C.slate500,
            marginBottom: 8,
          }}
        >
          {selected
            ? `Flag #${selected.num} · ${selected.biasType} · cross-linked to:`
            : '7 regulatory frameworks · click a flag to see which trigger'}
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            marginBottom: selected ? 12 : 0,
          }}
        >
          {FRAMEWORK_ORDER.map(fw => {
            const lit = litFrameworks.has(fw);
            const primary =
              lit && selected?.hits.find(h => matchFrameworkCode(h.code) === fw)?.primary;
            return (
              <motion.span
                key={fw}
                animate={
                  reducedMotion
                    ? undefined
                    : lit
                      ? { scale: [1, 1.08, 1] }
                      : { scale: 1 }
                }
                transition={{ duration: 0.35, ease: 'easeOut' }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 10,
                  fontWeight: 700,
                  color: lit ? (primary ? C.white : C.green) : C.slate400,
                  background: lit ? (primary ? C.green : C.greenLight) : C.slate50,
                  border: `1px solid ${lit ? (primary ? C.green : C.greenBorder) : C.slate200}`,
                  padding: '3px 10px',
                  borderRadius: 999,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s',
                }}
              >
                {lit && <Check size={10} strokeWidth={3} />}
                {fw}
              </motion.span>
            );
          })}
        </div>

        <AnimatePresence initial={false} mode="wait">
          {selected && (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: C.slate600,
                  lineHeight: 1.55,
                  marginBottom: 10,
                  fontStyle: 'italic',
                }}
              >
                {selected.explanation}
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                {selected.hits.map(hit => (
                  <div
                    key={hit.code}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '110px 1fr',
                      gap: 10,
                      padding: '8px 10px',
                      background: hit.primary ? C.greenSoft : C.slate50,
                      border: `1px solid ${hit.primary ? C.greenBorder : C.slate200}`,
                      borderRadius: 8,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: hit.primary ? C.green : C.slate900,
                        }}
                      >
                        {hit.code}
                      </div>
                      <div style={{ fontSize: 10, color: C.slate500 }}>
                        {hit.framework}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: C.slate600,
                        lineHeight: 1.45,
                      }}
                    >
                      {hit.detail}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function FlagSpan({
  flag,
  selected,
  onClick,
}: {
  flag: MemoFlag;
  selected: boolean;
  onClick: () => void;
}) {
  const s = SEVERITY_STYLE[flag.severity];
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      style={{
        display: 'inline',
        background: selected ? s.bg : `${s.bg}AA`,
        color: s.text,
        border: `1px solid ${selected ? s.ring : `${s.ring}66`}`,
        borderRadius: 6,
        padding: '2px 6px',
        margin: 0,
        fontFamily: 'inherit',
        fontSize: 12.5,
        lineHeight: 1.55,
        cursor: 'pointer',
        fontWeight: 500,
        boxShadow: selected ? `0 0 0 2px ${s.ring}33` : 'none',
        transition: 'all 0.15s',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: s.ring,
          color: C.white,
          fontSize: 9,
          fontWeight: 800,
          marginRight: 5,
          verticalAlign: 'text-top',
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        {flag.num}
      </span>
      {flag.snippet}
    </button>
  );
}

