/**
 * DecisionNetworkPanel — the 7th deliverable tab ("Decision network").
 *
 * A document-scoped 3D graph built from THIS audit's own findings: the
 * decision sits at the centre, every reasoning risk radiates out as a node
 * (critical biases pulse), and each compound/toxic pattern is drawn as a
 * strand between the biases it links. Always populated — it does not depend
 * on the org-level cross-decision graph (which needs 2+ decisions to fill
 * in), so it reads richly on a user's very first audit.
 *
 * Renders via the production 3D WebGL canvas (DecisionKnowledgeGraph3DCanvas,
 * reagraph) which is lazy-loaded — the heavy bundle only ships when the user
 * opens this tab.
 */

'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, Network } from 'lucide-react';
import type { GraphEdge, GraphNode } from 'reagraph';
import type { ReasoningRiskFinding, SCQAExecutiveSummary } from '@/lib/deliverable/types';
import { formatBiasName } from '@/lib/utils/labels';

const Canvas = dynamic(() => import('@/components/visualizations/DecisionKnowledgeGraph3DCanvas'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        color: 'var(--text-muted)',
        fontSize: 13,
      }}
    >
      <Loader2 size={16} className="animate-spin" />
      Loading the decision network…
    </div>
  ),
});

const SEVERITY_COLOR: Record<string, string> = {
  critical: '#b91c1c',
  high: '#ef4444',
  medium: '#d97706',
  low: '#16a34a',
};
const SEVERITY_SIZE: Record<string, number> = {
  critical: 11,
  high: 9.5,
  medium: 8,
  low: 6.5,
};
const GRADE_COLOR: Record<string, string> = {
  A: '#10b981',
  B: '#16a34a',
  C: '#d97706',
  D: '#ef4444',
  F: '#b91c1c',
};

/**
 * Build a reagraph node/edge set from the audit's findings. Pure function.
 * Centre = the decision; spokes = biases; strands = compound patterns.
 */
function buildDocumentGraph(
  findings: ReasoningRiskFinding[],
  dqi: SCQAExecutiveSummary['dqi']
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [
    {
      id: 'decision',
      label: 'This decision',
      fill: GRADE_COLOR[dqi.grade] ?? '#475569',
      size: 16,
      data: { type: 'analysis' },
    } as GraphNode,
  ];
  const edges: GraphEdge[] = [];
  const biasNodeIds = new Set<string>();

  const ensureBiasNode = (key: string, label: string, severity: string) => {
    if (biasNodeIds.has(key)) return;
    biasNodeIds.add(key);
    nodes.push({
      id: `b:${key}`,
      label,
      fill: SEVERITY_COLOR[severity] ?? '#64748b',
      size: SEVERITY_SIZE[severity] ?? 7,
      data: { type: 'bias_pattern', severity },
    } as GraphNode);
    edges.push({ id: `e:dec:${key}`, source: 'decision', target: `b:${key}` } as GraphEdge);
  };

  // 1) Individual biases become spokes off the decision.
  for (const f of findings) {
    if (f.kind === 'bias') ensureBiasNode(f.id, f.label, f.chip.severity);
  }

  // 2) Compound patterns become strands between the biases they link
  //    (creating any participating bias node that wasn't individually flagged).
  for (const f of findings) {
    if (f.kind !== 'compound_pattern' || !f.participatingBiases?.length) continue;
    const members = f.participatingBiases;
    for (const key of members) {
      ensureBiasNode(key, formatBiasName(key), f.chip.severity);
    }
    for (let i = 0; i < members.length - 1; i++) {
      edges.push({
        id: `c:${f.id}:${i}`,
        source: `b:${members[i]}`,
        target: `b:${members[i + 1]}`,
        label: f.label,
      } as GraphEdge);
    }
  }

  return { nodes, edges };
}

export function DecisionNetworkPanel({
  findings,
  dqi,
}: {
  findings: ReasoningRiskFinding[];
  dqi: SCQAExecutiveSummary['dqi'];
}) {
  const { nodes, edges } = useMemo(() => buildDocumentGraph(findings, dqi), [findings, dqi]);
  const biasCount = nodes.length - 1;

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
      <div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--accent-primary)',
            marginBottom: 6,
          }}
        >
          <Network size={13} />
          Decision network
        </div>
        <h3
          style={{
            fontSize: 'clamp(18px, 2.4vw, 22px)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 6px',
            letterSpacing: '-0.015em',
            lineHeight: 1.25,
            textWrap: 'balance',
          }}
        >
          {biasCount > 0
            ? 'The reasoning risks, mapped around the decision'
            : 'A clean decision — no reasoning risks to map'}
        </h3>
        <p
          style={{
            fontSize: 13.5,
            color: 'var(--text-secondary)',
            margin: 0,
            lineHeight: 1.55,
            maxWidth: '54ch',
          }}
        >
          {biasCount > 0
            ? 'This decision sits at the centre. Each spoke is a reasoning risk the audit found; the bigger, pulsing nodes are the critical ones, and the strands between them are the compound patterns that amplify each other. Drag to orbit; hover a node to read it.'
            : 'The audit surfaced no flagged reasoning risks on this memo, so the network is just the decision itself.'}
        </p>
      </div>

      <div
        style={{
          position: 'relative',
          minHeight: 540,
          width: '100%',
          minWidth: 0,
          border: '1px solid var(--border-color)',
          borderRadius: 12,
          overflow: 'hidden',
          background: 'var(--bg-secondary)',
        }}
      >
        <Canvas nodes={nodes} edges={edges} onNodeSelect={() => {}} />
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px 16px',
          fontSize: 11.5,
          color: 'var(--text-secondary)',
        }}
      >
        <LegendDot color="var(--text-secondary)" label="Decision" />
        <LegendDot color={SEVERITY_COLOR.critical} label="Critical bias" />
        <LegendDot color={SEVERITY_COLOR.high} label="High" />
        <LegendDot color={SEVERITY_COLOR.medium} label="Medium" />
        <LegendDot color={SEVERITY_COLOR.low} label="Low" />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 16,
              height: 2,
              background: 'var(--text-muted)',
              display: 'inline-block',
            }}
          />
          Compound pattern
        </span>
      </div>
    </section>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }}
      />
      {label}
    </span>
  );
}
