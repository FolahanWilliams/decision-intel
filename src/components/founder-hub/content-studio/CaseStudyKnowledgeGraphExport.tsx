'use client';

import { useMemo, forwardRef } from 'react';
import type { CaseStudy } from '@/lib/data/case-studies/types';
import { formatBiasName } from '@/lib/utils/labels';

// ─── Colors ──────────────────────────────────────────────────────────────────

const BG = '#0F172A';

const TYPE_COLORS: Record<string, string> = {
  decision: '#3B82F6',
  bias: '#F97316',
  bias_critical: '#DC2626',
  outcome: '#8B5CF6',
};

const SEVERITY_MAP: Record<string, string> = {
  critical: '#DC2626',
  high: '#F97316',
  medium: '#EAB308',
};

const TOXIC_PAIRS: Record<string, string[][]> = {
  'Echo Chamber': [
    ['confirmation_bias', 'groupthink'],
    ['confirmation_bias', 'authority_bias'],
  ],
  'Sunk Ship': [
    ['sunk_cost_fallacy', 'confirmation_bias'],
    ['sunk_cost_fallacy', 'overconfidence_bias'],
  ],
  'Blind Sprint': [
    ['overconfidence_bias', 'planning_fallacy'],
    ['overconfidence_bias', 'anchoring_bias'],
  ],
  'Yes Committee': [
    ['groupthink', 'authority_bias'],
    ['groupthink', 'bandwagon_effect'],
  ],
  'Optimism Trap': [
    ['anchoring_bias', 'overconfidence_bias'],
    ['overconfidence_bias', 'planning_fallacy'],
  ],
  'Status Quo Lock': [
    ['status_quo_bias', 'loss_aversion'],
    ['status_quo_bias', 'anchoring_bias'],
  ],
  'Doubling Down': [
    ['sunk_cost_fallacy', 'overconfidence_bias'],
    ['sunk_cost_fallacy', 'loss_aversion'],
  ],
};

function guessSeverity(bias: string, isPrimary: boolean): 'critical' | 'high' | 'medium' {
  if (isPrimary) return 'critical';
  if (
    [
      'overconfidence_bias',
      'groupthink',
      'confirmation_bias',
      'sunk_cost_fallacy',
      'anchoring_bias',
      'authority_bias',
    ].includes(bias)
  )
    return 'high';
  return 'medium';
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface GNode {
  id: string;
  label: string;
  type: 'decision' | 'bias' | 'outcome';
  x: number;
  y: number;
  r: number;
  color: string;
}

interface GEdge {
  source: string;
  target: string;
  type: 'detected' | 'toxic' | 'influence';
}

interface Props {
  caseStudy: CaseStudy;
  width: number;
  height: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const CaseStudyKnowledgeGraphExport = forwardRef<SVGSVGElement, Props>(
  function CaseStudyKnowledgeGraphExport({ caseStudy, width, height }, ref) {
    const headerH = 60;
    const footerH = 36;
    const graphH = height - headerH - footerH;
    const cx = width / 2;
    const cy = headerH + graphH / 2;

    const { nodes, edges } = useMemo(() => {
      const nodes: GNode[] = [];
      const edges: GEdge[] = [];

      // Decision node at center
      const decId = 'decision';
      nodes.push({
        id: decId,
        label: caseStudy.title.length > 30 ? caseStudy.company : caseStudy.title,
        type: 'decision',
        x: cx,
        y: cy,
        r: width >= 800 ? 28 : 22,
        color: TYPE_COLORS.decision,
      });

      // Bias nodes in a ring
      const biasR = Math.min(width, graphH) * 0.32;
      caseStudy.biasesPresent.forEach((bias, i) => {
        const angle = (2 * Math.PI * i) / caseStudy.biasesPresent.length - Math.PI / 2;
        const severity = guessSeverity(bias, bias === caseStudy.primaryBias);
        const nodeR = severity === 'critical' ? 20 : severity === 'high' ? 16 : 13;
        nodes.push({
          id: bias,
          label: formatBiasName(bias),
          type: 'bias',
          x: cx + biasR * Math.cos(angle),
          y: cy + biasR * Math.sin(angle),
          r: width >= 800 ? nodeR : nodeR * 0.8,
          color: SEVERITY_MAP[severity],
        });
        edges.push({ source: decId, target: bias, type: 'detected' });
      });

      // Outcome node
      const outcomeR = Math.min(width, graphH) * 0.42;
      const outcomeLabel =
        caseStudy.estimatedImpact.length > 40
          ? caseStudy.outcome.replace(/_/g, ' ')
          : caseStudy.estimatedImpact;
      nodes.push({
        id: 'outcome',
        label: outcomeLabel.length > 35 ? outcomeLabel.slice(0, 32) + '...' : outcomeLabel,
        type: 'outcome',
        x: cx + outcomeR * Math.cos(Math.PI / 4),
        y: cy + outcomeR * Math.sin(Math.PI / 4),
        r: width >= 800 ? 18 : 14,
        color: TYPE_COLORS.outcome,
      });

      // Connect primary bias to outcome
      if (caseStudy.primaryBias) {
        edges.push({ source: caseStudy.primaryBias, target: 'outcome', type: 'influence' });
      }

      // Toxic combination edges
      const biasSet = new Set(caseStudy.biasesPresent);
      for (const combo of caseStudy.toxicCombinations) {
        const pairs = TOXIC_PAIRS[combo];
        if (!pairs) continue;
        for (const [a, b] of pairs) {
          if (biasSet.has(a) && biasSet.has(b)) {
            edges.push({ source: a, target: b, type: 'toxic' });
          }
        }
      }

      // Run a simple force simulation to convergence
      const SIM_STEPS = 60;
      const repulsion = 1200;
      const centerPull = 0.003;
      for (let step = 0; step < SIM_STEPS; step++) {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (node.type === 'decision') continue; // keep center pinned
          let fx = 0;
          let fy = 0;
          for (let j = 0; j < nodes.length; j++) {
            if (i === j) continue;
            const dx = node.x - nodes[j].x;
            const dy = node.y - nodes[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const minDist = node.r + nodes[j].r + 20;
            if (dist < minDist * 3) {
              const force = repulsion / (dist * dist);
              fx += (dx / dist) * force;
              fy += (dy / dist) * force;
            }
          }
          fx += (cx - node.x) * centerPull;
          fy += (cy - node.y) * centerPull;
          const margin = node.r + 8;
          node.x = Math.max(margin, Math.min(width - margin, node.x + fx * 0.5));
          node.y = Math.max(
            headerH + margin,
            Math.min(height - footerH - margin, node.y + fy * 0.5)
          );
        }
      }

      return { nodes, edges };
    }, [caseStudy, width, height, cx, cy, graphH]);

    const nodeMap = useMemo(() => Object.fromEntries(nodes.map(n => [n.id, n])), [nodes]);

    const fontSize = width >= 800 ? 12 : 10;

    return (
      <svg
        ref={ref}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: 'block', background: BG, borderRadius: 12 }}
      >
        {/* Header */}
        <text
          x={24}
          y={28}
          fill="#94A3B8"
          fontSize={11}
          fontWeight={600}
          fontFamily="system-ui, sans-serif"
          letterSpacing="0.5"
        >
          DECISION KNOWLEDGE GRAPH
        </text>
        <text
          x={24}
          y={48}
          fill="#F1F5F9"
          fontSize={16}
          fontWeight={700}
          fontFamily="system-ui, sans-serif"
        >
          {caseStudy.company} ({caseStudy.year}) —{' '}
          {caseStudy.estimatedImpact.length > 50
            ? caseStudy.outcome.replace(/_/g, ' ')
            : caseStudy.estimatedImpact}
        </text>

        {/* Edges */}
        {edges.map((e, i) => {
          const from = nodeMap[e.source];
          const to = nodeMap[e.target];
          if (!from || !to) return null;
          const isToxic = e.type === 'toxic';
          const isInfluence = e.type === 'influence';
          return (
            <line
              key={`${e.source}-${e.target}-${i}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={isToxic ? '#DC262680' : isInfluence ? '#8B5CF680' : '#33415580'}
              strokeWidth={isToxic ? 2.5 : isInfluence ? 2 : 1}
              strokeDasharray={isToxic ? '6 4' : undefined}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map(node => (
          <g key={node.id}>
            <circle cx={node.x} cy={node.y} r={node.r + 3} fill={`${node.color}20`} />
            <circle
              cx={node.x}
              cy={node.y}
              r={node.r}
              fill={node.color}
              stroke="#1E293B"
              strokeWidth={2}
            />
            <text
              x={node.x}
              y={node.y + 1}
              fill="#FFF"
              fontSize={node.r > 20 ? 10 : 8}
              fontWeight={700}
              fontFamily="system-ui, sans-serif"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {node.type === 'decision'
                ? node.label.slice(0, 4).toUpperCase()
                : node.type === 'outcome'
                  ? '→'
                  : node.label.slice(0, 3).toUpperCase()}
            </text>
            <text
              x={node.x}
              y={node.y + node.r + fontSize + 4}
              fill="#CBD5E1"
              fontSize={fontSize}
              fontWeight={node.type === 'decision' ? 700 : 500}
              fontFamily="system-ui, sans-serif"
              textAnchor="middle"
            >
              {node.label.length > 20 ? node.label.slice(0, 18) + '...' : node.label}
            </text>
          </g>
        ))}

        {/* Legend */}
        <circle cx={24} cy={height - footerH - 50} r={5} fill={TYPE_COLORS.decision} />
        <text
          x={36}
          y={height - footerH - 46}
          fill="#94A3B8"
          fontSize={10}
          fontFamily="system-ui, sans-serif"
        >
          Decision
        </text>
        <circle cx={100} cy={height - footerH - 50} r={5} fill="#F97316" />
        <text
          x={112}
          y={height - footerH - 46}
          fill="#94A3B8"
          fontSize={10}
          fontFamily="system-ui, sans-serif"
        >
          Bias
        </text>
        <circle cx={152} cy={height - footerH - 50} r={5} fill={TYPE_COLORS.outcome} />
        <text
          x={164}
          y={height - footerH - 46}
          fill="#94A3B8"
          fontSize={10}
          fontFamily="system-ui, sans-serif"
        >
          Outcome
        </text>

        {/* Footer branding */}
        <text
          x={width - 16}
          y={height - 12}
          fill="#475569"
          fontSize={10}
          fontWeight={600}
          fontFamily="system-ui, sans-serif"
          textAnchor="end"
        >
          decision-intel.com
        </text>
      </svg>
    );
  }
);
