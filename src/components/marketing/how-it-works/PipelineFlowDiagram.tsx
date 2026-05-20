'use client';

/**
 * PipelineFlowDiagram
 *
 * The centerpiece visualization of /how-it-works — a full-width
 * animated flow diagram of the 12-node LangGraph pipeline.
 *
 * Two modes:
 *
 * (1) MARKETING (default) — zones cycle every 1.8s to create a
 *     breathing "alive" feel. Each node chip is clickable; selecting
 *     drives the external detail drawer. Used on /how-it-works.
 *
 * (2) LIVE (liveMode={true}) — the viz tracks REAL audit progress.
 *     `activeNodeId` becomes the currently-running pipeline node;
 *     per-node state is derived from its position in the canonical
 *     PIPELINE_NODES order: nodes before activeNodeId render as DONE
 *     (green check + dim), the active node renders as RUNNING (full
 *     accent + pulse), nodes after render as PENDING (gray, opacity
 *     0.4). The analysis zone runs in parallel by construction — so
 *     when ANY analysis node is active, ALL 7 are shown running
 *     (matches the pipeline's real fan-out semantics). Used on /demo
 *     paste-audit + sample-flow above the SSE stream.
 *
 * Respects prefers-reduced-motion (static layout, no pulse / cycle).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useReducedMotion } from './useReducedMotion';
import { PIPELINE_NODES, type PipelineNode, type PipelineZone } from '@/lib/data/pipeline-nodes';
import { PipelineNodeGlyph } from './PipelineNodeGlyph';
import { truncate } from '@/lib/utils/string';

const C = {
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
  violet: '#7C3AED',
};

const ZONE_COLOR: Record<PipelineZone, { accent: string; soft: string; label: string }> = {
  preprocessing: { accent: C.violet, soft: 'rgba(124, 58, 237, 0.08)', label: 'Preprocessing' },
  analysis: { accent: C.green, soft: 'rgba(22, 163, 74, 0.08)', label: 'Analysis (parallel)' },
  synthesis: { accent: C.slate900, soft: C.slate100, label: 'Synthesis' },
};

// ─── Canvas geometry ─────────────────────────────────────────────────────
const VB_W = 1200;
const VB_H = 780;
const CHIP_W = 220;
const CHIP_H = 74;

// Preprocessing column (sequential, x centered around 170)
const PREP_X = 60;
const PREP_Y = [130, 280, 430];

// Analysis grid (2 cols × 4 rows, 7 slots)
const ANA_X = [440, 700];
const ANA_Y = [130, 250, 370, 490];

// Synthesis column
const SYN_X = 940;
const SYN_Y = [250, 430];

// DQI output badge
const DQI_X = SYN_X;
const DQI_Y = 620;

// Position lookup keyed by node id
type NodePos = { id: string; x: number; y: number };
const POSITIONS: NodePos[] = [
  { id: 'gdprAnonymizer', x: PREP_X, y: PREP_Y[0] },
  { id: 'structurer', x: PREP_X, y: PREP_Y[1] },
  { id: 'intelligenceGatherer', x: PREP_X, y: PREP_Y[2] },
  // Analysis — col1 gets 4, col2 gets 3
  { id: 'biasDetective', x: ANA_X[0], y: ANA_Y[0] },
  { id: 'verificationNode', x: ANA_X[0], y: ANA_Y[1] },
  { id: 'simulationNode', x: ANA_X[0], y: ANA_Y[2] },
  { id: 'forgottenQuestionsNode', x: ANA_X[0], y: ANA_Y[3] },
  { id: 'noiseJudge', x: ANA_X[1], y: ANA_Y[0] },
  { id: 'deepAnalysisNode', x: ANA_X[1], y: ANA_Y[1] },
  { id: 'rpdRecognitionNode', x: ANA_X[1], y: ANA_Y[2] },
  { id: 'metaJudgeNode', x: SYN_X, y: SYN_Y[0] },
  { id: 'riskScorer', x: SYN_X, y: SYN_Y[1] },
];

const POSITION_BY_ID = new Map(POSITIONS.map(p => [p.id, p]));

// Edge topology — all the connection pairs (from, to)
const EDGES: Array<{ from: string; to: string; zone: PipelineZone }> = [
  { from: 'gdprAnonymizer', to: 'structurer', zone: 'preprocessing' },
  { from: 'structurer', to: 'intelligenceGatherer', zone: 'preprocessing' },
  // Fan-out from intelligenceGatherer to all 7 analysis nodes
  { from: 'intelligenceGatherer', to: 'biasDetective', zone: 'analysis' },
  { from: 'intelligenceGatherer', to: 'verificationNode', zone: 'analysis' },
  { from: 'intelligenceGatherer', to: 'simulationNode', zone: 'analysis' },
  { from: 'intelligenceGatherer', to: 'forgottenQuestionsNode', zone: 'analysis' },
  { from: 'intelligenceGatherer', to: 'noiseJudge', zone: 'analysis' },
  { from: 'intelligenceGatherer', to: 'deepAnalysisNode', zone: 'analysis' },
  { from: 'intelligenceGatherer', to: 'rpdRecognitionNode', zone: 'analysis' },
  // Fan-in from all 7 to metaJudge
  { from: 'biasDetective', to: 'metaJudgeNode', zone: 'analysis' },
  { from: 'verificationNode', to: 'metaJudgeNode', zone: 'analysis' },
  { from: 'simulationNode', to: 'metaJudgeNode', zone: 'analysis' },
  { from: 'forgottenQuestionsNode', to: 'metaJudgeNode', zone: 'analysis' },
  { from: 'noiseJudge', to: 'metaJudgeNode', zone: 'analysis' },
  { from: 'deepAnalysisNode', to: 'metaJudgeNode', zone: 'analysis' },
  { from: 'rpdRecognitionNode', to: 'metaJudgeNode', zone: 'analysis' },
  // Synthesis chain
  { from: 'metaJudgeNode', to: 'riskScorer', zone: 'synthesis' },
];

function edgePath(from: string, to: string): string {
  const a = POSITION_BY_ID.get(from);
  const b = POSITION_BY_ID.get(to);
  if (!a || !b) return '';
  // Treat each chip as a rect — exit point = right edge midpoint, entry point = left edge midpoint
  const x1 = a.x + CHIP_W;
  const y1 = a.y + CHIP_H / 2;
  const x2 = b.x;
  const y2 = b.y + CHIP_H / 2;
  // Cubic Bezier for smooth horizontal fan flow
  const cpx1 = x1 + (x2 - x1) * 0.5;
  const cpx2 = x2 - (x2 - x1) * 0.5;
  return `M ${x1} ${y1} C ${cpx1} ${y1}, ${cpx2} ${y2}, ${x2} ${y2}`;
}

// ─── Component ───────────────────────────────────────────────────────────

interface PipelineFlowDiagramProps {
  /**
   * In MARKETING mode: drives external state (e.g. node-detail drawer
   * on /how-it-works).
   * In LIVE mode: the currently-running pipeline node; derives per-node
   * done / running / pending state and the active-zone highlight.
   */
  activeNodeId?: string | null;
  onSelectNode?: (id: string) => void;
  /**
   * When true: derives per-node + per-zone + per-edge state from
   * `activeNodeId` instead of auto-cycling. Hides marketing footer
   * caption + disables node-click selection (the audit is running,
   * not a sandbox). Used on /demo above the SSE stream.
   */
  liveMode?: boolean;
}

type NodeState = 'done' | 'running' | 'pending' | 'idle';

// Canonical pipeline order — index of each node in the run sequence.
// Analysis zone is parallel by construction so all 7 share the same
// running window; preprocessing + synthesis are strictly sequential.
const NODE_INDEX: Record<string, number> = (() => {
  const m: Record<string, number> = {};
  PIPELINE_NODES.forEach((n, i) => {
    m[n.id] = i;
  });
  return m;
})();

const PREP_LAST_INDEX = 2; // intelligenceGatherer
const ANALYSIS_LAST_INDEX = 9; // rpdRecognitionNode

function deriveActiveZoneFromIndex(idx: number): PipelineZone | null {
  if (idx < 0) return null;
  if (idx <= PREP_LAST_INDEX) return 'preprocessing';
  if (idx <= ANALYSIS_LAST_INDEX) return 'analysis';
  return 'synthesis';
}

function deriveNodeState(
  node: PipelineNode,
  activeIdx: number,
  activeZone: PipelineZone | null
): NodeState {
  if (activeIdx < 0 || !activeZone) return 'idle';
  const nodeIdx = NODE_INDEX[node.id];
  // Analysis zone is PARALLEL: when any analysis node is the SSE-active
  // node, ALL 7 analysis nodes are running together by definition (the
  // pipeline fires them as one batch after intelligenceGatherer).
  if (node.zone === 'analysis' && activeZone === 'analysis') return 'running';
  if (nodeIdx < activeIdx) return 'done';
  if (nodeIdx === activeIdx) return 'running';
  return 'pending';
}

export function PipelineFlowDiagram({
  activeNodeId,
  onSelectNode,
  liveMode = false,
}: PipelineFlowDiagramProps) {
  const [marketingZone, setMarketingZone] = useState<PipelineZone>('preprocessing');
  const reducedMotion = useReducedMotion();
  // Single IntersectionObserver on the outer container — `whileInView` on
  // SVG child elements fires unreliably on iOS Safari, leaving every
  // animated node/edge stuck at opacity 0. One observer on a real DOM
  // node + driving each child's `animate` off this boolean fixes it.
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, margin: '-80px' });

  // Marketing mode only: loop zones every 1.8s for the "alive" feel.
  // Live mode skips this entirely — activeZone is derived from the real
  // SSE-driven activeNodeId so the viz tracks the actual audit.
  useEffect(() => {
    if (liveMode || reducedMotion) return;
    const order: PipelineZone[] = ['preprocessing', 'analysis', 'synthesis'];
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % order.length;
      setMarketingZone(order[i]);
    }, 1800);
    return () => clearInterval(id);
  }, [liveMode, reducedMotion]);

  const nodeById = useMemo(() => {
    const m = new Map<string, PipelineNode>();
    for (const n of PIPELINE_NODES) m.set(n.id, n);
    return m;
  }, []);

  // Live mode: derive activeIdx + activeZone from activeNodeId.
  // Marketing mode: activeZone cycles via setMarketingZone; activeIdx
  // stays -1 so deriveNodeState returns 'idle' for every node and the
  // legacy "zoneActive" highlighting governs visuals.
  const activeIdx = liveMode && activeNodeId != null ? (NODE_INDEX[activeNodeId] ?? -1) : -1;
  const liveActiveZone = liveMode ? deriveActiveZoneFromIndex(activeIdx) : null;
  const activeZone: PipelineZone = liveMode ? (liveActiveZone ?? 'preprocessing') : marketingZone;

  // Live-mode status caption — replaces the marketing footer prose.
  const liveStatus = useMemo(() => {
    if (!liveMode) return null;
    if (activeIdx < 0) return { label: 'Ready', sub: 'Pipeline initialising…', pct: 0 };
    const activeNode = activeNodeId ? nodeById.get(activeNodeId) : null;
    const pct = Math.round(((activeIdx + 1) / PIPELINE_NODES.length) * 100);
    return {
      label: activeNode?.label ?? 'Running',
      sub: `Stage ${activeIdx + 1} of ${PIPELINE_NODES.length}`,
      pct,
    };
  }, [liveMode, activeIdx, activeNodeId, nodeById]);

  // DQI output lights up only when synthesis is the active zone in
  // live mode (or when the marketing zone cycles to synthesis).
  const dqiLit = liveMode ? activeZone === 'synthesis' : activeZone === 'synthesis';
  // In live mode, DQI shows "complete" state once we're past riskScorer.
  const dqiComplete = liveMode && activeIdx >= PIPELINE_NODES.length - 1;

  return (
    <div
      ref={containerRef}
      style={{
        background: C.slate50,
        border: `1px solid ${C.slate200}`,
        borderRadius: 20,
        padding: '28px 24px 20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Decision Intel 12-node analysis pipeline diagram"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <defs>
          {/* Glow filters per zone */}
          {(['preprocessing', 'analysis', 'synthesis'] as PipelineZone[]).map(z => (
            <filter key={z} id={`glow-${z}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
          <linearGradient id="packet-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={C.green} stopOpacity={0} />
            <stop offset="50%" stopColor={C.green} stopOpacity={1} />
            <stop offset="100%" stopColor={C.green} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Zone bands */}
        <ZoneBand
          x={0}
          w={360}
          label="Preprocessing"
          accent={ZONE_COLOR.preprocessing.accent}
          active={activeZone === 'preprocessing'}
          reducedMotion={reducedMotion}
        />
        <ZoneBand
          x={380}
          w={540}
          label="Analysis · 7 parallel agents"
          accent={ZONE_COLOR.analysis.accent}
          active={activeZone === 'analysis'}
          reducedMotion={reducedMotion}
        />
        <ZoneBand
          x={920}
          w={260}
          label="Synthesis"
          accent={ZONE_COLOR.synthesis.accent}
          active={activeZone === 'synthesis'}
          reducedMotion={reducedMotion}
        />

        {/* Edges */}
        {EDGES.map(e => {
          const d = edgePath(e.from, e.to);
          const zoneActive = activeZone === e.zone;
          // Live mode: edge state mirrors its target-zone state — DONE
          // edges feed nodes the audit has already finished with; PENDING
          // edges feed downstream stages.
          const fromIdx = NODE_INDEX[e.from] ?? -1;
          const isDoneEdge = liveMode && activeIdx > fromIdx && !zoneActive;
          const stroke = zoneActive ? ZONE_COLOR[e.zone].accent : isDoneEdge ? C.green : C.slate300;
          const opacity = zoneActive ? 0.75 : isDoneEdge ? 0.45 : 0.35;
          return (
            <motion.path
              key={`${e.from}->${e.to}`}
              d={d}
              fill="none"
              stroke={stroke}
              strokeWidth={zoneActive ? 2 : 1.3}
              strokeOpacity={opacity}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={inView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
              style={{ transition: 'stroke 0.4s, stroke-width 0.4s, stroke-opacity 0.4s' }}
            />
          );
        })}

        {/* DQI output badge anchor line from riskScorer to DQI badge */}
        <motion.line
          x1={SYN_X + CHIP_W / 2}
          y1={SYN_Y[1] + CHIP_H}
          x2={DQI_X + CHIP_W / 2}
          y2={DQI_Y}
          stroke={dqiLit ? C.green : C.slate300}
          strokeWidth={dqiLit ? 2 : 1.3}
          strokeOpacity={0.7}
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          style={{ transition: 'stroke 0.4s, stroke-width 0.4s' }}
        />

        {/* DQI output badge */}
        <motion.g
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <rect
            x={DQI_X}
            y={DQI_Y}
            width={CHIP_W}
            height={CHIP_H}
            rx={12}
            fill={C.slate900}
            stroke={dqiComplete || dqiLit ? C.green : C.slate600}
            strokeWidth={dqiComplete ? 3 : 2}
            style={{ transition: 'stroke 0.4s, stroke-width 0.4s' }}
          />
          <text
            x={DQI_X + CHIP_W / 2}
            y={DQI_Y + 26}
            textAnchor="middle"
            fontSize={10}
            fontWeight={700}
            fill={dqiComplete || dqiLit ? C.green : C.slate400}
            style={{
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              transition: 'fill 0.4s',
            }}
          >
            {dqiComplete ? 'Output · ready' : 'Output'}
          </text>
          <text
            x={DQI_X + CHIP_W / 2}
            y={DQI_Y + 50}
            textAnchor="middle"
            fontSize={20}
            fontWeight={800}
            fill={C.white}
            style={{ letterSpacing: '-0.01em', fontFamily: 'var(--font-mono, monospace)' }}
          >
            DQI · 0–100 · A–F
          </text>
        </motion.g>

        {/* Nodes */}
        {POSITIONS.map((pos, i) => {
          const node = nodeById.get(pos.id);
          if (!node) return null;
          const zone = node.zone;
          const zoneActive = activeZone === zone;
          const isSelected = !liveMode && activeNodeId === node.id;
          const accent = ZONE_COLOR[zone].accent;

          // Live-mode per-node state. In marketing mode this stays 'idle'
          // and the original zoneActive highlighting governs visuals.
          const state: NodeState = liveMode
            ? deriveNodeState(node, activeIdx, liveActiveZone)
            : 'idle';
          const isRunning = state === 'running';
          const isDone = state === 'done';
          const isPending = state === 'pending';

          // Chip stroke + glow: running gets the strongest treatment.
          const chipStroke = isSelected
            ? accent
            : isRunning
              ? accent
              : isDone
                ? C.green
                : zoneActive && !liveMode
                  ? accent
                  : isPending
                    ? C.slate200
                    : C.slate200;
          const chipStrokeWidth = isSelected
            ? 2.5
            : isRunning
              ? 2.5
              : isDone
                ? 1.5
                : zoneActive && !liveMode
                  ? 1.8
                  : 1;
          const chipOpacity = isPending ? 0.42 : 1;
          const showGlow = !reducedMotion && (isRunning || (!liveMode && zoneActive));

          // Icon background: running = full accent fill, done = soft green,
          // pending = soft slate, marketing-zone-active = full accent.
          const iconBg = isRunning
            ? accent
            : isDone
              ? 'rgba(22, 163, 74, 0.12)'
              : isPending
                ? C.slate100
                : zoneActive && !liveMode
                  ? accent
                  : ZONE_COLOR[zone].soft;
          const iconColor = isRunning
            ? C.white
            : isDone
              ? C.green
              : isPending
                ? C.slate400
                : zoneActive && !liveMode
                  ? C.white
                  : accent;

          return (
            <motion.g
              key={node.id}
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: chipOpacity, y: 0 } : { opacity: 0, y: 12 }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.04 }}
              onClick={() => !liveMode && onSelectNode?.(node.id)}
              style={{
                cursor: !liveMode && onSelectNode ? 'pointer' : 'default',
                transition: 'opacity 0.4s',
              }}
            >
              {/* Chip background */}
              <rect
                x={pos.x}
                y={pos.y}
                width={CHIP_W}
                height={CHIP_H}
                rx={12}
                fill={C.white}
                stroke={chipStroke}
                strokeWidth={chipStrokeWidth}
                style={{
                  transition: 'stroke 0.35s, stroke-width 0.35s',
                  filter: showGlow ? `url(#glow-${zone})` : 'none',
                }}
              />
              {/* Icon background */}
              <rect
                x={pos.x + 12}
                y={pos.y + 14}
                width={46}
                height={46}
                rx={10}
                fill={iconBg}
                style={{ transition: 'fill 0.35s' }}
              />
              {/* Glyph — bespoke SVG set (see PipelineNodeGlyph). foreignObject
                  lets us keep the React SVG component inside an outer SVG. */}
              <foreignObject x={pos.x + 12} y={pos.y + 14} width={46} height={46}>
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-hidden
                >
                  <PipelineNodeGlyph nodeId={node.id} size={22} color={iconColor} />
                </div>
              </foreignObject>
              {/* Label */}
              <text
                x={pos.x + 68}
                y={pos.y + 30}
                fontSize={13}
                fontWeight={700}
                fill={isPending ? C.slate500 : C.slate900}
                style={{ letterSpacing: '-0.01em', transition: 'fill 0.35s' }}
              >
                {node.label}
              </text>
              {/* Tagline */}
              <text
                x={pos.x + 68}
                y={pos.y + 50}
                fontSize={11}
                fontWeight={500}
                fill={isPending ? C.slate400 : C.slate500}
                style={{ transition: 'fill 0.35s' }}
              >
                {truncate(node.tagline, 32)}
              </text>
              {/* Status indicator — running gets a pulsing accent dot, done
                  gets a green check, pending gets nothing. Marketing-mode
                  zoneActive nodes retain the legacy pulse dot. */}
              {!reducedMotion && isRunning && (
                <motion.circle
                  cx={pos.x + CHIP_W - 14}
                  cy={pos.y + 14}
                  r={5}
                  fill={accent}
                  initial={{ opacity: 0.4, scale: 1 }}
                  animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.6, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
              {isDone && (
                <g>
                  <circle cx={pos.x + CHIP_W - 14} cy={pos.y + 14} r={7} fill={C.green} />
                  <path
                    d={`M ${pos.x + CHIP_W - 17} ${pos.y + 14} L ${pos.x + CHIP_W - 15} ${pos.y + 16} L ${pos.x + CHIP_W - 11} ${pos.y + 12}`}
                    stroke={C.white}
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </g>
              )}
              {!reducedMotion && !liveMode && zoneActive && (
                <motion.circle
                  cx={pos.x + CHIP_W - 14}
                  cy={pos.y + 14}
                  r={4}
                  fill={accent}
                  initial={{ opacity: 0.4, scale: 1 }}
                  animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.4, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </motion.g>
          );
        })}

        {/* Zone header labels */}
        <ZoneLabel
          x={180}
          y={90}
          text="01 · Preprocessing"
          accent={ZONE_COLOR.preprocessing.accent}
        />
        <ZoneLabel
          x={650}
          y={90}
          text="02 · Analysis (parallel)"
          accent={ZONE_COLOR.analysis.accent}
        />
        <ZoneLabel x={1050} y={90} text="03 · Synthesis" accent={ZONE_COLOR.synthesis.accent} />

        {/* Footer caption — marketing only. Live mode renders the live
            status bar OUTSIDE the SVG (below) so it can use full HTML
            for the animated progress bar + dynamic text. */}
        {!liveMode && (
          <text
            x={VB_W / 2}
            y={VB_H - 12}
            textAnchor="middle"
            fontSize={11}
            fontWeight={600}
            fill={C.slate400}
            style={{ letterSpacing: '0.04em' }}
          >
            Each zone runs in order. Inside Analysis, all seven agents run simultaneously against
            the same shared context.
          </text>
        )}
      </svg>

      {/* Live-mode status bar — full-width HTML strip below the SVG with
          dynamic stage label + animated progress fill. Mirrors the
          per-node done/running/pending state in a single one-line
          summary so a reader scanning quickly can see where the audit is
          without parsing the diagram. */}
      {liveMode && liveStatus && (
        <div
          style={{
            marginTop: 8,
            padding: '14px 18px',
            background: C.white,
            border: `1px solid ${C.slate200}`,
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: dqiComplete ? C.green : ZONE_COLOR[activeZone].accent,
              flexShrink: 0,
              animation:
                !reducedMotion && !dqiComplete
                  ? 'di-pipeline-live-pulse 1.2s ease-in-out infinite'
                  : undefined,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: C.slate900,
                letterSpacing: '-0.005em',
              }}
            >
              {dqiComplete ? 'Audit complete' : liveStatus.label}
            </div>
            <div style={{ fontSize: 11, color: C.slate500, marginTop: 2 }}>
              {dqiComplete ? 'DQI ready · scroll for the result' : liveStatus.sub}
            </div>
          </div>
          <div
            style={{
              minWidth: 120,
              height: 6,
              borderRadius: 999,
              background: C.slate100,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: `${liveStatus.pct}%`,
                background: dqiComplete ? C.green : ZONE_COLOR[activeZone].accent,
                borderRadius: 999,
                transition: 'width 0.6s ease-out, background 0.4s',
              }}
            />
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: C.slate600,
              fontFamily: 'var(--font-mono, monospace)',
              fontVariantNumeric: 'tabular-nums',
              minWidth: 36,
              textAlign: 'right',
            }}
          >
            {liveStatus.pct}%
          </div>
          <style jsx>{`
            @keyframes di-pipeline-live-pulse {
              0%,
              100% {
                opacity: 0.55;
                transform: scale(1);
              }
              50% {
                opacity: 1;
                transform: scale(1.4);
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

function ZoneBand({
  x,
  w,
  label,
  accent,
  active,
  reducedMotion,
}: {
  x: number;
  w: number;
  label: string;
  accent: string;
  active: boolean;
  reducedMotion: boolean;
}) {
  return (
    <g pointerEvents="none">
      <rect
        x={x}
        y={40}
        width={w}
        height={VB_H - 80}
        rx={20}
        fill={active ? `${accent}0A` : 'transparent'}
        stroke={active ? `${accent}44` : C.slate200}
        strokeWidth={1}
        strokeDasharray={active && !reducedMotion ? '0' : '4 6'}
        style={{ transition: 'fill 0.4s, stroke 0.4s' }}
      />
      {/* Silent accessibility */}
      <title>{label}</title>
    </g>
  );
}

function ZoneLabel({ x, y, text, accent }: { x: number; y: number; text: string; accent: string }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontSize={11}
      fontWeight={800}
      fill={accent}
      style={{
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        fontFamily: 'var(--font-mono, monospace)',
      }}
    >
      {text}
    </text>
  );
}
