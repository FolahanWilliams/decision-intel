'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GitBranch, ChevronDown, ChevronUp, Brain, ArrowRight, Link2, Loader2 } from 'lucide-react';

interface RelatedEdge {
  id: string;
  source: string;
  target: string;
  edgeType: string;
  strength: number;
  confidence: number;
  description?: string;
  isManual: boolean;
}

interface RelatedNode {
  id: string;
  type: string;
  label: string;
  score: number;
  outcome?: string;
  biasCount: number;
  createdAt: string;
}

const EDGE_LABELS: Record<string, { label: string; color: string }> = {
  similar_to: { label: 'Similar', color: 'text-blue-400' },
  shared_bias: { label: 'Shared bias', color: 'text-purple-400' },
  same_participants: { label: 'Same team', color: 'text-teal-400' },
  influenced_by: { label: 'Influenced by', color: 'text-zinc-400' },
  escalated_from: { label: 'Escalated from', color: 'text-orange-400' },
  reversed: { label: 'Reversed', color: 'text-red-400' },
  depends_on: { label: 'Depends on', color: 'text-zinc-400' },
};

interface RelatedDecisionsProps {
  analysisId: string;
}

export function RelatedDecisions({ analysisId }: RelatedDecisionsProps) {
  const [expanded, setExpanded] = useState(false);
  const [data, setData] = useState<{
    nodes: RelatedNode[];
    edges: RelatedEdge[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchRelated() {
      try {
        const teamRes = await fetch('/api/team');
        if (cancelled) return;
        if (!teamRes.ok) {
          setLoading(false);
          return;
        }
        const teamData = await teamRes.json();
        const orgId = teamData?.orgId || teamData?.organization?.id;
        if (!orgId || cancelled) {
          setLoading(false);
          return;
        }

        const graphRes = await fetch(
          `/api/decision-graph?orgId=${orgId}&highlightNode=${analysisId}&depth=1`
        );
        if (cancelled) return;
        if (!graphRes.ok) {
          setLoading(false);
          return;
        }
        const d = await graphRes.json();
        if (!cancelled) {
          setData({ nodes: d.nodes, edges: d.edges });
        }
      } catch {
        if (!cancelled) setError('Failed to load related decisions');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRelated();
    return () => {
      cancelled = true;
    };
  }, [analysisId]);

  if (error) {
    return (
      <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>{error}</div>
    );
  }
  if (loading) {
    return (
      <div
        className="flex items-center gap-sm"
        style={{ padding: 'var(--spacing-md)', color: 'var(--text-muted)', fontSize: '13px' }}
      >
        <Loader2 size={14} className="animate-spin" />
        Finding related decisions...
      </div>
    );
  }
  if (!data || data.edges.length === 0) return null;

  // Get connected nodes (exclude self)
  const connectedEdges = data.edges.filter(e => e.source === analysisId || e.target === analysisId);
  const connectedNodeIds = new Set(
    connectedEdges.flatMap(e => [e.source, e.target]).filter(id => id !== analysisId)
  );
  const connectedNodes = data.nodes.filter(n => connectedNodeIds.has(n.id));

  if (connectedNodes.length === 0) return null;

  return (
    <div className="card">
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-label={expanded ? 'Collapse related decisions' : 'Expand related decisions'}
        className="card-header w-full flex items-center justify-between transition-colors related-decisions-toggle"
      >
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <GitBranch size={16} className="text-blue-400" />
          Related Decisions
          <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
            {connectedNodes.length}
          </span>
        </h3>
        {expanded ? (
          <ChevronUp size={14} className="text-zinc-500" />
        ) : (
          <ChevronDown size={14} className="text-zinc-500" />
        )}
      </button>

      {expanded && (
        <div className="related-decisions-list">
          {connectedNodes.slice(0, 10).map(node => {
            // Find the edge connecting this node
            const edge = connectedEdges.find(
              e =>
                (e.source === node.id && e.target === analysisId) ||
                (e.target === node.id && e.source === analysisId)
            );
            const edgeStyle = edge ? EDGE_LABELS[edge.edgeType] : null;

            return (
              <Link
                key={node.id}
                href={node.type === 'analysis' ? `/documents/${node.id}` : '#'}
                className="flex items-center gap-3 px-4 py-3 transition-colors related-decisions-row"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-zinc-200 truncate">{node.label}</div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500">
                    {edgeStyle && (
                      <span className={`${edgeStyle.color} flex items-center gap-1`}>
                        <Link2 size={10} />
                        {edgeStyle.label}
                      </span>
                    )}
                    {edge && <span>({(edge.strength * 100).toFixed(0)}% strength)</span>}
                    <span className="flex items-center gap-1">
                      <Brain size={10} /> {node.biasCount} biases
                    </span>
                  </div>
                </div>
                <ArrowRight size={14} className="text-zinc-600 flex-shrink-0" />
              </Link>
            );
          })}

          {connectedNodes.length > 10 && (
            <div className="px-4 py-2 text-xs text-zinc-500 text-center">
              +{connectedNodes.length - 10} more related decisions
            </div>
          )}
        </div>
      )}
    </div>
  );
}
