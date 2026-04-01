'use client';

import { useMemo } from 'react';
import {
  Shield,
  FileText,
  Brain,
  Scale,
  FileCheck,
  BarChart3,
  Swords,
  Target,
  Zap,
} from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LivePipelineGraphProps {
  /** Map of node label -> status. Labels match NODE_LABELS values */
  nodeStates: Record<string, 'pending' | 'running' | 'complete'>;
  /** Overall progress 0-100 */
  progress: number;
  /** Number of biases detected so far (badge on bias node) */
  biasCount?: number;
  /** Noise score if available (badge on noise node) */
  noiseScore?: number;
}

// ---------------------------------------------------------------------------
// Pipeline definition
// ---------------------------------------------------------------------------

interface PipelineNode {
  label: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  row: number;
  col: number; // column within the row
}

const NODES: PipelineNode[] = [
  // Row 0 – sequential
  { label: 'Privacy Shield', icon: Shield, row: 0, col: 0 },
  { label: 'Document Intelligence', icon: FileText, row: 0, col: 1 },
  // Row 1 – parallel
  { label: 'Bias Detection', icon: Brain, row: 1, col: 0 },
  { label: 'Noise Analysis', icon: Scale, row: 1, col: 1 },
  { label: 'Fact & Compliance Check', icon: FileCheck, row: 1, col: 2 },
  // Row 2 – parallel
  { label: 'Deep Analysis', icon: BarChart3, row: 2, col: 0 },
  { label: 'Boardroom Simulation', icon: Swords, row: 2, col: 1 },
  { label: 'Pattern Recognition', icon: Target, row: 2, col: 2 },
  // Row 3 – converge
  { label: 'Meta Judge', icon: Brain, row: 3, col: 0 },
  { label: 'Risk Scoring', icon: Zap, row: 3, col: 1 },
];

// Edges: [from label, to label]
const EDGES: [string, string][] = [
  ['Privacy Shield', 'Document Intelligence'],
  // Doc Intel fans out to row 1
  ['Document Intelligence', 'Bias Detection'],
  ['Document Intelligence', 'Noise Analysis'],
  ['Document Intelligence', 'Fact & Compliance Check'],
  // Row 1 fans out to row 2
  ['Bias Detection', 'Deep Analysis'],
  ['Noise Analysis', 'Boardroom Simulation'],
  ['Fact & Compliance Check', 'Pattern Recognition'],
  // Row 2 converges to Meta Judge
  ['Deep Analysis', 'Meta Judge'],
  ['Boardroom Simulation', 'Meta Judge'],
  ['Pattern Recognition', 'Meta Judge'],
  // Meta Judge -> Risk Scoring
  ['Meta Judge', 'Risk Scoring'],
];

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const GRAPH_WIDTH = 640;
const GRAPH_HEIGHT = 280;
const NODE_W = 120;
const NODE_H = 52;

// Columns per row
const ROW_COLS: Record<number, number[]> = {
  0: [0, 1],       // 2 nodes centered
  1: [0, 1, 2],    // 3 nodes
  2: [0, 1, 2],    // 3 nodes
  3: [0, 1],       // 2 nodes centered
};

function getNodeCenter(row: number, col: number): { x: number; y: number } {
  const cols = ROW_COLS[row];
  const totalCols = cols.length;
  const spacing = GRAPH_WIDTH / (totalCols + 1);
  const x = spacing * (col + 1);
  const rowSpacing = GRAPH_HEIGHT / 5;
  const y = rowSpacing * (row + 1);
  return { x, y };
}

// ---------------------------------------------------------------------------
// Keyframes (injected once)
// ---------------------------------------------------------------------------

const KEYFRAMES_ID = 'live-pipeline-graph-keyframes';

function ensureKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(KEYFRAMES_ID)) return;
  const style = document.createElement('style');
  style.id = KEYFRAMES_ID;
  style.textContent = `
    @keyframes lpg-pulse {
      0%, 100% { box-shadow: 0 0 4px rgba(0, 210, 255, 0.3); }
      50% { box-shadow: 0 0 12px rgba(0, 210, 255, 0.6); }
    }
    @keyframes lpg-dash {
      to { stroke-dashoffset: -20; }
    }
  `;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LivePipelineGraph({
  nodeStates,
  progress,
  biasCount,
  noiseScore,
}: LivePipelineGraphProps) {
  const reducedMotion = useReducedMotion();

  // Inject keyframes on mount
  useMemo(() => ensureKeyframes(), []);

  const nodePositions = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    for (const node of NODES) {
      map[node.label] = getNodeCenter(node.row, node.col);
    }
    return map;
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: GRAPH_WIDTH,
        height: GRAPH_HEIGHT,
        margin: '0 auto',
      }}
    >
      {/* SVG edges */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
        viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {EDGES.map(([from, to]) => {
          const p1 = nodePositions[from];
          const p2 = nodePositions[to];
          if (!p1 || !p2) return null;

          const fromStatus = nodeStates[from] || 'pending';
          const toStatus = nodeStates[to] || 'pending';

          const isComplete = fromStatus === 'complete' && toStatus === 'complete';
          const isActive = fromStatus === 'complete' && toStatus === 'running';

          let stroke = 'rgba(255,255,255,0.08)';
          let strokeDasharray = '4 4';
          let strokeWidth = 1;
          let animationStyle: React.CSSProperties = {};

          if (isComplete) {
            stroke = 'rgba(52, 211, 153, 0.35)';
            strokeDasharray = 'none';
            strokeWidth = 1.5;
          } else if (isActive) {
            stroke = 'rgba(0, 210, 255, 0.5)';
            strokeDasharray = '6 4';
            strokeWidth = 1.5;
            if (!reducedMotion) {
              animationStyle = { animation: 'lpg-dash 0.8s linear infinite' };
            }
          }

          return (
            <line
              key={`${from}-${to}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              style={animationStyle}
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {NODES.map((node) => {
        const pos = nodePositions[node.label];
        const status = nodeStates[node.label] || 'pending';
        const Icon = node.icon;

        const isPending = status === 'pending';
        const isRunning = status === 'running';
        const isComplete = status === 'complete';

        let borderColor = 'rgba(255,255,255,0.06)';
        let iconColor = 'var(--text-muted)';
        let labelOpacity = 0.4;
        let nodeAnimation: string | undefined;

        if (isRunning) {
          borderColor = 'rgba(0, 210, 255, 0.4)';
          iconColor = 'var(--accent-primary)';
          labelOpacity = 1;
          if (!reducedMotion) {
            nodeAnimation = 'lpg-pulse 2s ease-in-out infinite';
          }
        } else if (isComplete) {
          borderColor = 'rgba(52, 211, 153, 0.3)';
          iconColor = 'var(--success)';
          labelOpacity = 0.85;
        }

        // Badge data
        let badge: { value: string; color: string } | null = null;
        if (node.label === 'Bias Detection' && biasCount != null && biasCount > 0) {
          badge = { value: String(biasCount), color: 'rgba(251, 191, 36, 0.9)' };
        }
        if (node.label === 'Noise Analysis' && noiseScore != null) {
          badge = { value: `${noiseScore}%`, color: 'rgba(0, 210, 255, 0.9)' };
        }

        // Abbreviate long labels
        const shortLabel = node.label.length > 16
          ? node.label.slice(0, 14) + '...'
          : node.label;

        return (
          <div
            key={node.label}
            title={node.label}
            style={{
              position: 'absolute',
              left: pos.x - NODE_W / 2,
              top: pos.y - NODE_H / 2,
              width: NODE_W,
              height: NODE_H,
              background: isPending
                ? 'rgba(255,255,255,0.02)'
                : 'rgba(255,255,255,0.04)',
              border: `1px solid ${borderColor}`,
              borderRadius: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              transition: 'opacity 0.4s ease, border-color 0.4s ease, background 0.4s ease',
              opacity: isPending ? 0.5 : 1,
              animation: nodeAnimation,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <Icon size={14} style={{ color: iconColor, transition: 'color 0.4s ease', flexShrink: 0 }} />
            <span
              style={{
                fontSize: 9,
                fontWeight: 500,
                color: 'var(--text-primary)',
                opacity: labelOpacity,
                transition: 'opacity 0.4s ease',
                textAlign: 'center',
                lineHeight: 1.2,
                maxWidth: NODE_W - 12,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {shortLabel}
            </span>

            {/* Badge */}
            {badge && (
              <div
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  background: badge.color,
                  color: '#000',
                  fontSize: 9,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  lineHeight: 1,
                }}
              >
                {badge.value}
              </div>
            )}
          </div>
        );
      })}

      {/* Overall progress bar at the bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 4,
          left: '10%',
          width: '80%',
          height: 2,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: progress >= 100 ? 'var(--success)' : 'var(--accent-primary)',
            transition: 'width 0.4s ease',
            borderRadius: 1,
          }}
        />
      </div>
    </div>
  );
}

/** Ordered list of node labels in pipeline execution order */
export const PIPELINE_NODE_LABELS = NODES.map(n => n.label);
