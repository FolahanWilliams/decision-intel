'use client';

/**
 * PipelineFlowDiagram
 *
 * The centerpiece visualization of /how-it-works — a full-width
 * animated flow diagram of the 12-node LangGraph pipeline.
 *
 * - Three zones (preprocessing / analysis / synthesis)
 * - A "pulse" packet travels along the flow paths on an infinite loop:
 *   preprocessing → fan-out (7 analysis lines light up) → fan-in → synthesis → DQI
 * - Each node chip is clickable; selecting drives the external detail drawer.
 * - Respects prefers-reduced-motion (static layout, no pulse).
 */

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from './useReducedMotion';
import {
  Shield,
  Layers,
  Radar,
  Brain,
  Scale,
  CheckCircle2,
  Microscope,
  Users,
  Eye,
  HelpCircle,
  Gavel,
  Calculator,
  type LucideIcon,
} from 'lucide-react';
import {
  PIPELINE_NODES,
  type PipelineNode,
  type PipelineZone,
} from '@/lib/data/pipeline-nodes';

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

const ICONS: Record<PipelineNode['iconName'], LucideIcon> = {
  Shield,
  Layers,
  Radar,
  Brain,
  Scale,
  CheckCircle2,
  Microscope,
  Users,
  Eye,
  HelpCircle,
  Gavel,
  Calculator,
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
  /** If provided, drives external state (e.g. a node-detail drawer). */
  activeNodeId?: string | null;
  onSelectNode?: (id: string) => void;
}

export function PipelineFlowDiagram({
  activeNodeId,
  onSelectNode,
}: PipelineFlowDiagramProps) {
  const [activeZone, setActiveZone] = useState<PipelineZone>('preprocessing');
  const reducedMotion = useReducedMotion();

  // Loop through the three zones to create a breathing "alive" feel
  useEffect(() => {
    if (reducedMotion) return;
    const order: PipelineZone[] = ['preprocessing', 'analysis', 'synthesis'];
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % order.length;
      setActiveZone(order[i]);
    }, 1800);
    return () => clearInterval(id);
  }, [reducedMotion]);

  const nodeById = useMemo(() => {
    const m = new Map<string, PipelineNode>();
    for (const n of PIPELINE_NODES) m.set(n.id, n);
    return m;
  }, []);

  return (
    <div
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
            <filter
              key={z}
              id={`glow-${z}`}
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
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
        <ZoneBand x={0} w={360} label="Preprocessing" accent={ZONE_COLOR.preprocessing.accent} active={activeZone === 'preprocessing'} reducedMotion={reducedMotion} />
        <ZoneBand x={380} w={540} label="Analysis · 7 parallel agents" accent={ZONE_COLOR.analysis.accent} active={activeZone === 'analysis'} reducedMotion={reducedMotion} />
        <ZoneBand x={920} w={260} label="Synthesis" accent={ZONE_COLOR.synthesis.accent} active={activeZone === 'synthesis'} reducedMotion={reducedMotion} />

        {/* Edges */}
        {EDGES.map(e => {
          const d = edgePath(e.from, e.to);
          const zoneActive = activeZone === e.zone;
          return (
            <motion.path
              key={`${e.from}->${e.to}`}
              d={d}
              fill="none"
              stroke={zoneActive ? ZONE_COLOR[e.zone].accent : C.slate300}
              strokeWidth={zoneActive ? 2 : 1.3}
              strokeOpacity={zoneActive ? 0.7 : 0.45}
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true, margin: '-80px' }}
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
          stroke={activeZone === 'synthesis' ? C.green : C.slate300}
          strokeWidth={activeZone === 'synthesis' ? 2 : 1.3}
          strokeOpacity={0.7}
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          style={{ transition: 'stroke 0.4s, stroke-width 0.4s' }}
        />

        {/* DQI output badge */}
        <motion.g
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <rect
            x={DQI_X}
            y={DQI_Y}
            width={CHIP_W}
            height={CHIP_H}
            rx={12}
            fill={C.slate900}
            stroke={C.green}
            strokeWidth={2}
          />
          <text
            x={DQI_X + CHIP_W / 2}
            y={DQI_Y + 26}
            textAnchor="middle"
            fontSize={10}
            fontWeight={700}
            fill={C.green}
            style={{ textTransform: 'uppercase', letterSpacing: '0.12em' }}
          >
            Output
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
          const Icon = ICONS[node.iconName];
          const zone = node.zone;
          const zoneActive = activeZone === zone;
          const isSelected = activeNodeId === node.id;
          const accent = ZONE_COLOR[zone].accent;

          return (
            <motion.g
              key={node.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.04 }}
              onClick={() => onSelectNode?.(node.id)}
              style={{ cursor: onSelectNode ? 'pointer' : 'default' }}
            >
              {/* Chip background */}
              <rect
                x={pos.x}
                y={pos.y}
                width={CHIP_W}
                height={CHIP_H}
                rx={12}
                fill={C.white}
                stroke={isSelected ? accent : zoneActive ? accent : C.slate200}
                strokeWidth={isSelected ? 2.5 : zoneActive ? 1.8 : 1}
                style={{
                  transition: 'stroke 0.35s, stroke-width 0.35s',
                  filter: zoneActive && !reducedMotion ? `url(#glow-${zone})` : 'none',
                }}
              />
              {/* Icon background */}
              <rect
                x={pos.x + 12}
                y={pos.y + 14}
                width={46}
                height={46}
                rx={10}
                fill={zoneActive ? accent : ZONE_COLOR[zone].soft}
                style={{ transition: 'fill 0.35s' }}
              />
              {/* Icon — rendered via foreignObject for Lucide React support */}
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
                  <Icon
                    size={22}
                    color={zoneActive ? C.white : accent}
                    strokeWidth={2}
                  />
                </div>
              </foreignObject>
              {/* Label */}
              <text
                x={pos.x + 68}
                y={pos.y + 30}
                fontSize={13}
                fontWeight={700}
                fill={C.slate900}
                style={{ letterSpacing: '-0.01em' }}
              >
                {node.label}
              </text>
              {/* Tagline */}
              <text
                x={pos.x + 68}
                y={pos.y + 50}
                fontSize={11}
                fontWeight={500}
                fill={C.slate500}
              >
                {truncate(node.tagline, 32)}
              </text>
              {/* Active pulse dot */}
              {!reducedMotion && zoneActive && (
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
        <ZoneLabel x={180} y={90} text="01 · Preprocessing" accent={ZONE_COLOR.preprocessing.accent} />
        <ZoneLabel x={650} y={90} text="02 · Analysis (parallel)" accent={ZONE_COLOR.analysis.accent} />
        <ZoneLabel x={1050} y={90} text="03 · Synthesis" accent={ZONE_COLOR.synthesis.accent} />

        {/* Footer caption — the loop */}
        <text
          x={VB_W / 2}
          y={VB_H - 12}
          textAnchor="middle"
          fontSize={11}
          fontWeight={600}
          fill={C.slate400}
          style={{ letterSpacing: '0.04em' }}
        >
          Each zone runs in order. Inside Analysis, all seven agents run simultaneously against the same shared context.
        </text>
      </svg>
    </div>
  );
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max - 1).trimEnd() + '…';
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

function ZoneLabel({
  x,
  y,
  text,
  accent,
}: {
  x: number;
  y: number;
  text: string;
  accent: string;
}) {
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
