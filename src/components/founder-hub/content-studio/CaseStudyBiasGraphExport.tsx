'use client';

import { useMemo, forwardRef } from 'react';
import type { CaseStudy } from '@/lib/data/case-studies/types';
import { formatBiasName } from '@/lib/utils/labels';

// ─── Colors ──────────────────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#DC2626',
  high: '#F97316',
  medium: '#EAB308',
  low: '#84CC16',
  default: '#94A3B8',
};

const BG = '#0F172A';
const EDGE_COLOR = '#DC262660';
const NODE_STROKE = '#1E293B';

// ─── Toxic combo → bias pairs ────────────────────────────────────────────────

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

function guessSeverity(bias: string, isPrimary: boolean): string {
  if (isPrimary) return 'critical';
  if (['overconfidence_bias', 'groupthink', 'confirmation_bias'].includes(bias)) return 'high';
  if (['sunk_cost_fallacy', 'anchoring_bias', 'authority_bias'].includes(bias)) return 'high';
  if (['framing_effect', 'loss_aversion', 'bandwagon_effect'].includes(bias)) return 'medium';
  return 'medium';
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface BiasNode {
  id: string;
  label: string;
  x: number;
  y: number;
  severity: string;
  isPrimary: boolean;
}

interface BiasEdge {
  from: string;
  to: string;
  pattern: string;
}

interface Props {
  caseStudy: CaseStudy;
  width: number;
  height: number;
}

export const CaseStudyBiasGraphExport = forwardRef<SVGSVGElement, Props>(
  function CaseStudyBiasGraphExport({ caseStudy, width, height }, ref) {
    const { biasesPresent: biases, primaryBias, toxicCombinations } = caseStudy;
    const cx = width / 2;
    const cy = height / 2;
    const headerH = 60;
    const footerH = 36;
    const graphCy = headerH + (height - headerH - footerH) / 2;
    const graphR = Math.min(width, height - headerH - footerH) * 0.34;

    const nodes = useMemo((): BiasNode[] => {
      return biases.map((bias, i) => {
        const angle = (2 * Math.PI * i) / biases.length - Math.PI / 2;
        return {
          id: bias,
          label: formatBiasName(bias),
          x: cx + graphR * Math.cos(angle),
          y: graphCy + graphR * Math.sin(angle),
          severity: guessSeverity(bias, bias === primaryBias),
          isPrimary: bias === primaryBias,
        };
      });
    }, [biases, primaryBias, cx, graphCy, graphR]);

    const edges = useMemo((): BiasEdge[] => {
      const result: BiasEdge[] = [];
      const biasSet = new Set(biases);
      for (const combo of toxicCombinations) {
        const pairs = TOXIC_PAIRS[combo];
        if (!pairs) {
          if (biases.length >= 2) {
            result.push({ from: biases[0], to: biases[1], pattern: combo });
          }
          continue;
        }
        for (const [a, b] of pairs) {
          if (biasSet.has(a) && biasSet.has(b)) {
            result.push({ from: a, to: b, pattern: combo });
          }
        }
      }
      if (result.length === 0 && biases.length >= 2) {
        for (let i = 0; i < biases.length; i++) {
          const next = (i + 1) % biases.length;
          result.push({ from: biases[i], to: biases[next], pattern: '' });
        }
      }
      return result;
    }, [biases, toxicCombinations]);

    const nodeMap = useMemo(() => Object.fromEntries(nodes.map(n => [n.id, n])), [nodes]);

    const nodeR = width >= 800 ? 14 : 10;
    const fontSize = width >= 800 ? 13 : 11;

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
          COGNITIVE BIAS WEB
        </text>
        <text
          x={24}
          y={48}
          fill="#F1F5F9"
          fontSize={16}
          fontWeight={700}
          fontFamily="system-ui, sans-serif"
        >
          {caseStudy.company} ({caseStudy.year})
        </text>

        {/* Edges */}
        {edges.map((e, i) => {
          const from = nodeMap[e.from];
          const to = nodeMap[e.to];
          if (!from || !to) return null;
          const isToxic = e.pattern !== '';
          return (
            <line
              key={`${e.from}-${e.to}-${i}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={isToxic ? EDGE_COLOR : '#334155'}
              strokeWidth={isToxic ? 2 : 1}
              strokeDasharray={isToxic ? undefined : '4 4'}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map(node => {
          const color = SEVERITY_COLORS[node.severity] ?? SEVERITY_COLORS.default;
          return (
            <g key={node.id}>
              {node.isPrimary && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={nodeR + 6}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.5}
                  opacity={0.4}
                />
              )}
              <circle
                cx={node.x}
                cy={node.y}
                r={nodeR}
                fill={color}
                stroke={NODE_STROKE}
                strokeWidth={2}
              />
              <text
                x={node.x}
                y={node.y + nodeR + fontSize + 4}
                fill="#CBD5E1"
                fontSize={fontSize}
                fontWeight={node.isPrimary ? 700 : 500}
                fontFamily="system-ui, sans-serif"
                textAnchor="middle"
              >
                {node.label}
              </text>
            </g>
          );
        })}

        {/* Toxic combo labels */}
        {toxicCombinations.length > 0 && (
          <g>
            {toxicCombinations.map((combo, i) => (
              <text
                key={combo}
                x={width - 24}
                y={headerH + 20 + i * 20}
                fill="#F97316"
                fontSize={11}
                fontWeight={600}
                fontFamily="system-ui, sans-serif"
                textAnchor="end"
              >
                ⚠ {combo}
              </text>
            ))}
          </g>
        )}

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
