'use client';

import { useState, useEffect } from 'react';
import { DecisionKnowledgeGraph } from '@/components/visualizations/DecisionKnowledgeGraph';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Network,
  FileText,
  Loader2,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
} from 'lucide-react';

interface GraphReport {
  metrics: {
    nodeCount: number;
    edgeCount: number;
    density: number;
    avgDegree: number;
    clusterCount: number;
    avgClusterSize: number;
    isolatedNodes: number;
  };
  topNodes: Array<{
    id: string;
    label: string;
    type: string;
    pageRank: number;
    degree: number;
    score: number;
  }>;
  antiPatterns: Array<{
    patternType: string;
    severity: number;
    description: string;
    recommendation: string;
    affectedNodes: number;
  }>;
  riskState: {
    overallRisk: string;
    riskScore: number;
    factors: Array<{ factor: string; description: string }>;
    trend: string;
  };
}

const RISK_COLORS: Record<string, string> = {
  low: '#22c55e',
  moderate: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

export default function DecisionGraphPage() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(90);
  const [activeTab, setActiveTab] = useState<'graph' | 'report'>('graph');
  const [report, setReport] = useState<{ report: GraphReport; narrative: string | null } | null>(
    null
  );
  const [reportLoading, setReportLoading] = useState(false);

  // Fetch user's org
  useEffect(() => {
    fetch('/api/team')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        const id = data?.orgId || data?.organization?.id;
        if (id) setOrgId(id);
      })
      .catch(() => {});
  }, []);

  // Lazy-load report on tab switch
  useEffect(() => {
    if (activeTab !== 'report' || !orgId || report) return;
    let cancelled = false;

    async function loadReport() {
      setReportLoading(true);
      try {
        const res = await fetch(
          `/api/decision-graph/report?orgId=${encodeURIComponent(orgId)}&timeRange=${timeRange}&narrative=true`
        );
        if (res.ok && !cancelled) {
          const data = await res.json();
          setReport(data);
        }
      } catch {
        // non-critical
      } finally {
        if (!cancelled) setReportLoading(false);
      }
    }

    loadReport();
    return () => {
      cancelled = true;
    };
  }, [activeTab, orgId, timeRange, report]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Breadcrumbs
        items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Decision Graph' }]}
      />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Network className="h-6 w-6 text-blue-400" />
            Decision Knowledge Graph
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Explore how decisions connect, cascade, and influence each other across your
            organization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab switcher */}
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            <button
              onClick={() => setActiveTab('graph')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === 'graph'
                  ? 'bg-white/10 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Network size={12} /> Graph
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === 'report'
                  ? 'bg-white/10 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <FileText size={12} /> Report
            </button>
          </div>

          <select
            value={timeRange}
            onChange={e => {
              setTimeRange(parseInt(e.target.value, 10));
              setReport(null); // Reset report on time change
            }}
            className="text-sm px-3 py-1.5 rounded bg-white/5 border border-white/10 text-zinc-300"
          >
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="180">Last 6 months</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      <ErrorBoundary>
        {!orgId ? (
          <div className="card">
            <div className="card-body flex items-center justify-center h-64 text-zinc-500">
              <p>Join an organization to view the decision graph.</p>
            </div>
          </div>
        ) : activeTab === 'graph' ? (
          <DecisionKnowledgeGraph orgId={orgId} timeRange={timeRange} />
        ) : reportLoading ? (
          <div className="card">
            <div className="card-body flex items-center justify-center h-64 text-zinc-500">
              <Loader2 size={20} className="animate-spin mr-2" />
              Generating network analysis report...
            </div>
          </div>
        ) : !report ? (
          <div className="card">
            <div className="card-body flex items-center justify-center h-64 text-zinc-500">
              <p>Failed to load report. Try again.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* AI Narrative */}
            {report.narrative && (
              <div className="card">
                <div className="card-header">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    AI Executive Summary
                  </span>
                </div>
                <div className="card-body">
                  <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {report.narrative}
                  </p>
                </div>
              </div>
            )}

            {/* Risk State */}
            <div className="card">
              <div className="card-body flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield
                    size={20}
                    style={{ color: RISK_COLORS[report.report.riskState.overallRisk] || '#71717a' }}
                  />
                  <div>
                    <span
                      className="text-lg font-bold capitalize"
                      style={{
                        color: RISK_COLORS[report.report.riskState.overallRisk] || '#71717a',
                      }}
                    >
                      {report.report.riskState.overallRisk} Risk
                    </span>
                    <span className="text-xs text-zinc-500 ml-2">
                      Score: {report.report.riskState.riskScore}/100
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-zinc-400">
                  {report.report.riskState.trend === 'improving' && (
                    <TrendingDown size={14} className="text-green-400" />
                  )}
                  {report.report.riskState.trend === 'worsening' && (
                    <TrendingUp size={14} className="text-red-400" />
                  )}
                  {report.report.riskState.trend === 'stable' && (
                    <Minus size={14} className="text-zinc-500" />
                  )}
                  <span className="capitalize">{report.report.riskState.trend}</span>
                </div>
              </div>
              {report.report.riskState.factors.length > 0 && (
                <div className="px-4 pb-3 space-y-1">
                  {report.report.riskState.factors.map((f, i) => (
                    <p key={i} className="text-xs text-zinc-500">
                      {f.description}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { label: 'Nodes', value: report.report.metrics.nodeCount },
                { label: 'Edges', value: report.report.metrics.edgeCount },
                {
                  label: 'Density',
                  value: report.report.metrics.density.toFixed(3),
                },
                {
                  label: 'Avg Degree',
                  value: report.report.metrics.avgDegree,
                },
                { label: 'Clusters', value: report.report.metrics.clusterCount },
                {
                  label: 'Avg Cluster',
                  value: report.report.metrics.avgClusterSize,
                },
                { label: 'Isolated', value: report.report.metrics.isolatedNodes },
              ].map((m, i) => (
                <div key={i} className="card text-center" style={{ padding: '12px 8px' }}>
                  <div
                    className="text-lg font-bold text-white"
                    style={{ fontFamily: "'JetBrains Mono'" }}
                  >
                    {m.value}
                  </div>
                  <div className="text-[10px] text-zinc-500">{m.label}</div>
                </div>
              ))}
            </div>

            {/* Top Nodes */}
            {report.report.topNodes.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Most Influential Decisions (PageRank)
                  </span>
                </div>
                <div className="card-body p-0">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-zinc-500">
                        <th className="text-left p-2 pl-4">Decision</th>
                        <th className="text-left p-2">Type</th>
                        <th className="text-right p-2">PageRank</th>
                        <th className="text-right p-2">Connections</th>
                        <th className="text-right p-2 pr-4">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.report.topNodes.map((n, i) => (
                        <tr key={i} className="border-b border-white/5">
                          <td className="p-2 pl-4 text-zinc-300 truncate max-w-[200px]">
                            {n.label}
                          </td>
                          <td className="p-2 text-zinc-500 capitalize">
                            {n.type.replace('_', ' ')}
                          </td>
                          <td
                            className="p-2 text-right text-zinc-300"
                            style={{ fontFamily: "'JetBrains Mono'" }}
                          >
                            {n.pageRank.toFixed(2)}
                          </td>
                          <td
                            className="p-2 text-right text-zinc-300"
                            style={{ fontFamily: "'JetBrains Mono'" }}
                          >
                            {n.degree}
                          </td>
                          <td
                            className="p-2 pr-4 text-right"
                            style={{
                              fontFamily: "'JetBrains Mono'",
                              color:
                                n.score >= 75 ? '#22c55e' : n.score >= 50 ? '#eab308' : '#ef4444',
                            }}
                          >
                            {Math.round(n.score)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Anti-Patterns */}
            {report.report.antiPatterns.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Structural Risks
                  </span>
                </div>
                <div className="card-body space-y-2">
                  {report.report.antiPatterns.map((p, i) => (
                    <div key={i} className="p-3 rounded bg-amber-500/5 border border-amber-500/10">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle size={12} className="text-amber-400" />
                        <span className="text-xs font-semibold text-amber-400 capitalize">
                          {p.patternType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          severity {p.severity} | {p.affectedNodes} nodes
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">{p.description}</p>
                      <p className="text-xs text-zinc-500 italic mt-1">{p.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </ErrorBoundary>
    </div>
  );
}
