'use client';

import { useMemo } from 'react';
import { X, Boxes, AlertTriangle, CheckCircle, Clock, Brain } from 'lucide-react';

interface GraphNode {
  id: string;
  type: string;
  label: string;
  score: number;
  outcome?: string;
  biasCount: number;
  participants: string[];
  createdAt: string;
}

interface GraphEdge {
  id: string;
  source: string | { id: string };
  target: string | { id: string };
  edgeType: string;
  strength: number;
}

interface ClusterSummaryPanelProps {
  clusterId: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  onClose: () => void;
}

export function ClusterSummaryPanel({ clusterId, nodes, edges, onClose }: ClusterSummaryPanelProps) {
  const stats = useMemo(() => {
    const decisions = nodes.filter(n => n.type === 'analysis' || n.type === 'human_decision');
    const avgScore = decisions.length > 0
      ? Math.round(decisions.reduce((s, n) => s + n.score, 0) / decisions.length)
      : 0;

    const outcomes = { success: 0, failure: 0, pending: 0 };
    for (const n of decisions) {
      if (n.outcome === 'success' || n.outcome === 'partial_success') outcomes.success++;
      else if (n.outcome === 'failure') outcomes.failure++;
      else outcomes.pending++;
    }

    // Shared biases across cluster
    const biasEdges = edges.filter(e => e.edgeType === 'shared_bias');

    // Shared participants
    const allParticipants = new Map<string, number>();
    for (const n of nodes) {
      for (const p of n.participants) {
        allParticipants.set(p.toLowerCase(), (allParticipants.get(p.toLowerCase()) || 0) + 1);
      }
    }
    const sharedParticipants = [...allParticipants.entries()]
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Date range
    const dates = nodes.map(n => new Date(n.createdAt).getTime()).filter(t => !isNaN(t)).sort();
    const dateRange = dates.length >= 2
      ? `${new Date(dates[0]).toLocaleDateString()} — ${new Date(dates[dates.length - 1]).toLocaleDateString()}`
      : dates.length === 1
        ? new Date(dates[0]).toLocaleDateString()
        : 'Unknown';

    return { decisions, avgScore, outcomes, biasEdges: biasEdges.length, sharedParticipants, dateRange };
  }, [nodes, edges]);

  const failureRate = (stats.outcomes.success + stats.outcomes.failure) > 0
    ? Math.round((stats.outcomes.failure / (stats.outcomes.success + stats.outcomes.failure)) * 100)
    : 0;

  return (
    <div className="card" style={{ marginBottom: 'var(--spacing-md)' }}>
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Boxes size={14} className="text-blue-400" />
          <span className="text-xs font-semibold text-zinc-300">
            Cluster Analysis
          </span>
          <span className="text-[10px] text-zinc-500">
            {nodes.length} nodes, {edges.length} edges
          </span>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
          <X size={14} />
        </button>
      </div>
      <div className="card-body">
        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <StatBox label="Avg Score" value={stats.avgScore}
            color={stats.avgScore >= 60 ? '#22c55e' : stats.avgScore >= 40 ? '#eab308' : '#ef4444'} />
          <StatBox label="Success" value={stats.outcomes.success}
            icon={<CheckCircle size={12} />} color="#22c55e" />
          <StatBox label="Failure" value={stats.outcomes.failure}
            icon={<AlertTriangle size={12} />} color="#ef4444" />
          <StatBox label="Pending" value={stats.outcomes.pending}
            icon={<Clock size={12} />} color="#71717a" />
        </div>

        {/* Failure rate warning */}
        {failureRate > 50 && (
          <div className="p-2 mb-3 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
            <AlertTriangle size={14} />
            {failureRate}% failure rate in this cluster
          </div>
        )}

        {/* Shared participants */}
        {stats.sharedParticipants.length > 0 && (
          <div className="mb-3">
            <div className="text-[10px] text-zinc-500 mb-1 uppercase font-semibold">Shared Participants</div>
            <div className="flex flex-wrap gap-1">
              {stats.sharedParticipants.map(([name, count]) => (
                <span key={name} className="px-1.5 py-0.5 bg-teal-500/10 text-teal-400 rounded text-[10px]">
                  {name} ({count})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-3 text-[10px] text-zinc-500">
          <span className="flex items-center gap-1">
            <Brain size={10} /> {stats.biasEdges} bias connections
          </span>
          <span>{stats.dateRange}</span>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color, icon }: {
  label: string; value: number; color: string; icon?: React.ReactNode;
}) {
  return (
    <div className="text-center p-2 rounded bg-white/5">
      <div className="flex items-center justify-center gap-1" style={{ color }}>
        {icon}
        <span className="text-lg font-bold" style={{ fontFamily: "'JetBrains Mono'" }}>
          {value}
        </span>
      </div>
      <div className="text-[10px] text-zinc-500">{label}</div>
    </div>
  );
}
