/**
 * DecisionNetworkPanel — the 7th deliverable tab ("Decision network").
 *
 * A document-scoped 3D graph built from THIS audit's own findings: the
 * decision at the centre, every reasoning risk radiating out (critical biases
 * pulse), and each compound/toxic pattern drawn as a strand between the biases
 * it links. Always populated, even on a user's first audit.
 *
 * Click any node to open the reasoning behind it — the audit's explanation, the
 * verbatim memo excerpt, the fix, the compound patterns it feeds, AND a
 * historical reference class: where this same reasoning risk has shown up
 * before, drawn from the 143-case library (getCasesByBias). The reference
 * class is correlational grounding, never a causal claim about this memo
 * (per the epistemic-honesty lock).
 *
 * Renders via the production 3D WebGL canvas (DecisionKnowledgeGraph3DCanvas,
 * reagraph) — lazy-loaded, so the heavy bundle (+ the case library) only ships
 * when the user opens this tab.
 */

'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, Network, ExternalLink } from 'lucide-react';
import type { GraphEdge, GraphNode } from 'reagraph';
import type { ReasoningRiskFinding, SCQAExecutiveSummary } from '@/lib/deliverable/types';
import { formatBiasName } from '@/lib/utils/labels';
import { getCasesByBias } from '@/lib/data/case-studies';
import { isFailureOutcome } from '@/lib/data/case-studies/types';
import { getSlugForCase } from '@/lib/data/case-studies/slugs';
import type { CaseStudy } from '@/lib/data/case-studies/types';

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

  for (const f of findings) {
    if (f.kind === 'bias') ensureBiasNode(f.id, f.label, f.chip.severity);
  }
  for (const f of findings) {
    if (f.kind !== 'compound_pattern' || !f.participatingBiases?.length) continue;
    const members = f.participatingBiases;
    for (const key of members) ensureBiasNode(key, formatBiasName(key), f.chip.severity);
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

/** Top historical cases (failures first, by impact) that carried this bias. */
function referenceClass(biasKey: string): CaseStudy[] {
  return [...getCasesByBias(biasKey)]
    .sort((a, b) => {
      const af = isFailureOutcome(a.outcome) ? 1 : 0;
      const bf = isFailureOutcome(b.outcome) ? 1 : 0;
      if (af !== bf) return bf - af;
      return b.impactScore - a.impactScore;
    })
    .slice(0, 3);
}

interface NodeDetail {
  kind: 'decision' | 'bias';
  title: string;
  severity?: string;
  confidence?: number | null;
  explanation?: string;
  excerpt?: string;
  mitigation?: string;
  compounds?: { label: string; others: string[] }[];
  cases?: CaseStudy[];
  summary?: string;
}

function detailForNode(
  nodeId: string,
  findings: ReasoningRiskFinding[],
  dqi: SCQAExecutiveSummary['dqi']
): NodeDetail | null {
  if (nodeId === 'decision') {
    const risks = findings.filter(f => f.kind === 'bias').length;
    return {
      kind: 'decision',
      title: 'This decision',
      summary: `Decision Quality Index ${dqi.score} (grade ${dqi.grade}) · ${risks} reasoning risk${risks === 1 ? '' : 's'} flagged. Click a surrounding node to see the risk behind it.`,
    };
  }
  if (!nodeId.startsWith('b:')) return null;
  const key = nodeId.slice(2);
  const finding = findings.find(f => f.kind === 'bias' && f.id === key);
  const compounds = findings
    .filter(f => f.kind === 'compound_pattern' && f.participatingBiases?.includes(key))
    .map(f => ({
      label: f.label,
      others: (f.participatingBiases ?? []).filter(k => k !== key).map(formatBiasName),
    }));
  return {
    kind: 'bias',
    title: finding?.label ?? formatBiasName(key),
    severity: finding?.chip.severity,
    confidence: finding?.chip.pct ?? null,
    explanation: finding?.explanation,
    excerpt: finding?.excerpt,
    mitigation: finding?.mitigation,
    compounds: compounds.length ? compounds : undefined,
    cases: referenceClass(key),
  };
}

export function DecisionNetworkPanel({
  findings,
  dqi,
}: {
  findings: ReasoningRiskFinding[];
  dqi: SCQAExecutiveSummary['dqi'];
}) {
  const { nodes, edges } = useMemo(() => buildDocumentGraph(findings, dqi), [findings, dqi]);
  const [selected, setSelected] = useState<string | null>(null);
  const detail = useMemo(
    () => (selected ? detailForNode(selected, findings, dqi) : null),
    [selected, findings, dqi]
  );
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
            ? 'This decision sits at the centre. Each spoke is a reasoning risk the audit found; the bigger, pulsing nodes are the critical ones, and the strands between them are the compound patterns that amplify each other. Click any node to read the reasoning behind it.'
            : 'The audit surfaced no flagged reasoning risks on this memo, so the network is just the decision itself.'}
        </p>
      </div>

      <div
        style={{
          position: 'relative',
          minHeight: 460,
          width: '100%',
          minWidth: 0,
          border: '1px solid var(--border-color)',
          borderRadius: 12,
          overflow: 'hidden',
          background: 'var(--bg-secondary)',
        }}
      >
        <Canvas nodes={nodes} edges={edges} onNodeSelect={node => setSelected(node?.id ?? null)} />
      </div>

      {/* Detail panel — opens on node click */}
      {detail ? (
        <NodeDetailCard detail={detail} />
      ) : (
        <div
          style={{
            fontSize: 12.5,
            color: 'var(--text-muted)',
            fontStyle: 'italic',
            textAlign: 'center',
            padding: '4px 0',
          }}
        >
          Click any node to read the reasoning behind it.
        </div>
      )}

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

function NodeDetailCard({ detail }: { detail: NodeDetail }) {
  const sevColor = detail.severity
    ? (SEVERITY_COLOR[detail.severity] ?? 'var(--text-muted)')
    : undefined;
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderTop: `3px solid ${sevColor ?? 'var(--accent-primary)'}`,
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <h4
          style={{
            fontSize: 15.5,
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
            letterSpacing: '-0.012em',
          }}
        >
          {detail.title}
        </h4>
        {detail.kind === 'bias' && detail.severity ? (
          <span
            style={{
              flexShrink: 0,
              fontSize: 11,
              fontWeight: 700,
              color: sevColor,
              background: `${sevColor}14`,
              border: `1px solid ${sevColor}33`,
              borderRadius: 999,
              padding: '2px 9px',
              whiteSpace: 'nowrap',
              textTransform: 'capitalize',
            }}
          >
            {detail.severity}
            {detail.confidence != null ? ` · ${detail.confidence}%` : ''}
          </span>
        ) : null}
      </div>

      {detail.summary ? (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          {detail.summary}
        </p>
      ) : null}

      {detail.explanation ? (
        <DetailBlock label="What the audit saw">{detail.explanation}</DetailBlock>
      ) : null}

      {detail.excerpt ? (
        <blockquote
          style={{
            margin: 0,
            paddingLeft: 11,
            borderLeft: `3px solid ${sevColor ?? 'var(--border-color)'}55`,
            fontSize: 12.5,
            fontStyle: 'italic',
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
          }}
        >
          &ldquo;{detail.excerpt}&rdquo;
        </blockquote>
      ) : null}

      {detail.mitigation ? <DetailBlock label="The fix">{detail.mitigation}</DetailBlock> : null}

      {detail.compounds?.length ? (
        <DetailBlock label="Compounds with">
          {detail.compounds.map((c, i) => (
            <span key={i}>
              {i > 0 ? '; ' : ''}
              <strong style={{ color: 'var(--text-primary)' }}>{c.label}</strong>
              {c.others.length ? ` (with ${c.others.join(', ')})` : ''}
            </span>
          ))}
        </DetailBlock>
      ) : null}

      {detail.cases?.length ? (
        <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: 10 }}>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 7,
            }}
          >
            Seen before · reference class
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {detail.cases.map(c => (
              <a
                key={c.id}
                href={`/case-studies/${getSlugForCase(c)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 8,
                  fontSize: 12.5,
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  lineHeight: 1.45,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    flexShrink: 0,
                    marginTop: 5,
                    background: c.impactDirection === 'negative' ? '#ef4444' : '#16a34a',
                  }}
                />
                <span>
                  <strong style={{ color: 'var(--text-primary)' }}>{c.company}</strong> ({c.year}) ·{' '}
                  {c.estimatedImpact}
                  <ExternalLink
                    size={11}
                    style={{ marginLeft: 4, verticalAlign: 'middle', color: 'var(--text-muted)' }}
                  />
                </span>
              </a>
            ))}
          </div>
          <p
            style={{
              margin: '7px 0 0',
              fontSize: 10.5,
              color: 'var(--text-muted)',
              lineHeight: 1.4,
            }}
          >
            Where this reasoning risk has appeared before — a reference class, not a claim that it
            caused this memo&rsquo;s outcome.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function DetailBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 800,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
        {children}
      </div>
    </div>
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
