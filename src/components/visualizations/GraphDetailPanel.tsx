'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  X,
  ChevronDown,
  ChevronUp,
  Brain,
  AlertTriangle,
  CheckCircle,
  Clock,
  GitBranch,
  Users,
  ArrowRight,
  Check,
  Trash2,
} from 'lucide-react';

interface GraphNode {
  id: string;
  type: string;
  label: string;
  score: number;
  outcome?: string;
  biasCount: number;
  toxicComboCount: number;
  participants: string[];
  monetaryValue: number | null;
  createdAt: string;
}

interface GraphEdge {
  id: string;
  source: string | { id: string };
  target: string | { id: string };
  edgeType: string;
  strength: number;
  confidence: number;
  description?: string;
  isManual: boolean;
}

interface GraphDetailPanelProps {
  node: GraphNode;
  edges: GraphEdge[];
  allNodes: GraphNode[];
  onClose: () => void;
  onNavigateToNode: (nodeId: string) => void;
  onConfirmEdge?: (edgeId: string) => void;
  onDismissEdge?: (edgeId: string) => void;
}

const EDGE_TYPE_LABELS: Record<string, string> = {
  influenced_by: 'Influenced by',
  escalated_from: 'Escalated from',
  reversed: 'Reversed',
  depends_on: 'Depends on',
  similar_to: 'Similar to',
  shared_bias: 'Shared bias',
  same_participants: 'Same participants',
};

const NODE_TYPE_COLORS: Record<string, string> = {
  analysis: '#3b82f6',
  human_decision: '#a855f7',
  person: '#14b8a6',
  bias_pattern: '#f59e0b',
  outcome: '#16A34A',
};

function getScoreColor(score: number): string {
  if (score >= 75) return '#22c55e';
  if (score >= 50) return '#eab308';
  if (score >= 25) return '#f97316';
  return '#ef4444';
}

export function GraphDetailPanel({
  node,
  edges,
  allNodes,
  onClose,
  onNavigateToNode,
  onConfirmEdge,
  onDismissEdge,
}: GraphDetailPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['connections']));

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  // Find connected edges and nodes
  const connectedEdges = edges.filter(e => {
    const src = typeof e.source === 'string' ? e.source : e.source.id;
    const tgt = typeof e.target === 'string' ? e.target : e.target.id;
    return src === node.id || tgt === node.id;
  });

  const connectedNodeIds = new Set(
    connectedEdges.flatMap(e => {
      const src = typeof e.source === 'string' ? e.source : e.source.id;
      const tgt = typeof e.target === 'string' ? e.target : e.target.id;
      return [src, tgt];
    })
  );
  connectedNodeIds.delete(node.id);

  const connectedNodes = allNodes.filter(n => connectedNodeIds.has(n.id));

  const typeColor = NODE_TYPE_COLORS[node.type] || '#71717a';

  return (
    <div
      className="w-80 border-l border-white/10 bg-zinc-900/80 backdrop-blur-sm overflow-y-auto"
      style={{ maxHeight: '100%' }}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span
            className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase"
            style={{ background: `${typeColor}20`, color: typeColor }}
          >
            {node.type.replace('_', ' ')}
          </span>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X size={14} />
          </button>
        </div>
        <h4 className="text-sm font-semibold text-white leading-tight">{node.label}</h4>
        <div className="text-[10px] text-zinc-500 mt-1">
          {new Date(node.createdAt).toLocaleDateString()}
        </div>
      </div>

      {/* Metrics */}
      {(node.type === 'analysis' || node.type === 'human_decision') && (
        <div className="p-4 border-b border-white/10 grid grid-cols-3 gap-2">
          <div className="text-center">
            <div
              className="text-lg font-bold"
              style={{ color: getScoreColor(node.score), fontFamily: "'JetBrains Mono'" }}
            >
              {Math.round(node.score)}
            </div>
            <div className="text-[10px] text-zinc-500">Score</div>
          </div>
          <div className="text-center">
            <div
              className="text-lg font-bold text-zinc-300"
              style={{ fontFamily: "'JetBrains Mono'" }}
            >
              {node.biasCount}
            </div>
            <div className="text-[10px] text-zinc-500">Biases</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              {node.outcome === 'success' && <CheckCircle size={14} className="text-green-400" />}
              {node.outcome === 'failure' && <AlertTriangle size={14} className="text-red-400" />}
              {!node.outcome && <Clock size={14} className="text-zinc-500" />}
            </div>
            <div className="text-[10px] text-zinc-500">{node.outcome || 'Pending'}</div>
          </div>
        </div>
      )}

      {/* Participants */}
      {node.participants.length > 0 && (
        <SectionToggle
          title="Participants"
          icon={<Users size={12} />}
          expanded={expandedSections.has('participants')}
          onToggle={() => toggleSection('participants')}
          count={node.participants.length}
        >
          <div className="flex flex-wrap gap-1">
            {node.participants.slice(0, 8).map(p => (
              <span key={p} className="px-1.5 py-0.5 bg-white/5 rounded text-[10px] text-zinc-400">
                {p}
              </span>
            ))}
            {node.participants.length > 8 && (
              <span className="text-[10px] text-zinc-500">
                +{node.participants.length - 8} more
              </span>
            )}
          </div>
        </SectionToggle>
      )}

      {/* Connections */}
      <SectionToggle
        title="Connections"
        icon={<GitBranch size={12} />}
        expanded={expandedSections.has('connections')}
        onToggle={() => toggleSection('connections')}
        count={connectedEdges.length}
      >
        <div className="space-y-1.5">
          {connectedEdges.slice(0, 12).map(edge => {
            const src = typeof edge.source === 'string' ? edge.source : edge.source.id;
            const tgt = typeof edge.target === 'string' ? edge.target : edge.target.id;
            const otherId = src === node.id ? tgt : src;
            const otherNode = connectedNodes.find(n => n.id === otherId);
            const isInferred = !edge.isManual && edge.confidence < 0.8;

            return (
              <div key={edge.id} className="p-2 rounded bg-white/5 border border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-zinc-400">
                    {EDGE_TYPE_LABELS[edge.edgeType] || edge.edgeType}
                  </span>
                  <span
                    className="text-[10px] text-zinc-500"
                    style={{ fontFamily: "'JetBrains Mono'" }}
                  >
                    {Math.round(edge.strength * 100)}%
                  </span>
                </div>
                <button
                  onClick={() => onNavigateToNode(otherId)}
                  className="text-xs text-zinc-300 hover:text-white truncate w-full text-left flex items-center gap-1"
                >
                  <ArrowRight size={10} />
                  {otherNode?.label || otherId.slice(0, 20)}
                </button>
                {isInferred && (
                  <div className="flex gap-1 mt-1.5">
                    {onConfirmEdge && (
                      <button
                        onClick={() => onConfirmEdge(edge.id)}
                        className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 text-[10px] hover:bg-green-500/20"
                      >
                        <Check size={10} /> Confirm
                      </button>
                    )}
                    {onDismissEdge && (
                      <button
                        onClick={() => onDismissEdge(edge.id)}
                        className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] hover:bg-red-500/20"
                      >
                        <Trash2 size={10} /> Dismiss
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SectionToggle>

      {/* Actions */}
      <div className="p-4 border-t border-white/10">
        {(node.type === 'analysis' || node.type === 'human_decision') && (
          <Link
            href={
              node.type === 'analysis'
                ? `/dashboard/cognitive-audits/${node.id}`
                : `/dashboard/decision-graph?highlight=${node.id}`
            }
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300"
          >
            <Brain size={12} /> View full {node.type === 'analysis' ? 'analysis' : 'decision'}
          </Link>
        )}
      </div>
    </div>
  );
}

function SectionToggle({
  title,
  icon,
  expanded,
  onToggle,
  count,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-white/10">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-xs text-zinc-400 hover:text-zinc-300"
      >
        <span className="flex items-center gap-1.5">
          {icon} {title}
          <span className="text-zinc-600">({count})</span>
        </span>
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {expanded && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}
