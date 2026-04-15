'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
const DecisionKnowledgeGraph = dynamic(
  () =>
    import('@/components/visualizations/DecisionKnowledgeGraph').then(m => ({
      default: m.DecisionKnowledgeGraph,
    })),
  { ssr: false }
);
const CausalDAG = dynamic(
  () => import('@/components/visualizations/CausalDAG').then(m => ({ default: m.CausalDAG })),
  { ssr: false }
);
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CrossSiloAlertCards } from '@/components/ui/CrossSiloAlertCards';
import { usePlanLabels } from '@/hooks/usePlanLabels';
import {
  Network,
  FileText,
  Loader2,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
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

// Brand-aligned risk palette — matches the hero graph's severity colours.
const RISK_COLORS: Record<string, string> = {
  low: '#84CC16',
  moderate: '#EAB308',
  high: '#F97316',
  critical: '#EF4444',
};

export default function DecisionGraphPage() {
  const { knowledgeGraphLabel, knowledgeGraphDescription } = usePlanLabels();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(90);
  const [activeTab, setActiveTab] = useState<'graph' | 'report'>('graph');
  const [report, setReport] = useState<{ report: GraphReport; narrative: string | null } | null>(
    null
  );
  const [reportLoading, setReportLoading] = useState(false);
  const [orgError, setOrgError] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  // Fetch user's org
  useEffect(() => {
    setOrgError(null);
    fetch('/api/team')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        const id = data?.orgId || data?.organization?.id;
        if (id) setOrgId(id);
      })
      .catch(() => {
        setOrgError('Failed to load organization data.');
      });
  }, []);

  // Lazy-load report on tab switch
  useEffect(() => {
    if (activeTab !== 'report' || !orgId || report) return;
    let cancelled = false;

    async function loadReport() {
      setReportLoading(true);
      setReportError(null);
      try {
        const res = await fetch(
          `/api/decision-graph/report?orgId=${encodeURIComponent(orgId!)}&timeRange=${timeRange}&narrative=true`
        );
        if (res.ok && !cancelled) {
          const data = await res.json();
          setReport(data);
        } else if (!cancelled) {
          setReportError('Failed to load the network analysis report.');
        }
      } catch {
        if (!cancelled) setReportError('Failed to load the network analysis report.');
      } finally {
        if (!cancelled) setReportLoading(false);
      }
    }

    loadReport();
    return () => {
      cancelled = true;
    };
  }, [activeTab, orgId, timeRange, report]);

  const exportSvg = () => {
    const svg = document.querySelector('.card svg') as SVGSVGElement | null;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'decision-graph.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPng = () => {
    const svg = document.querySelector('.card svg') as SVGSVGElement | null;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx?.scale(2, 2);
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob(blob => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = 'decision-graph.png';
        a.click();
        URL.revokeObjectURL(pngUrl);
      }, 'image/png');
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div
      className="container"
      style={{ paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)' }}
    >
      <Breadcrumbs
        items={[{ label: 'Dashboard', href: '/dashboard' }, { label: knowledgeGraphLabel }]}
      />

      {/* Hero-style header — brand-green accent chip + clean title/subtitle */}
      <header className="page-header" style={{ alignItems: 'flex-start' }}>
        <div>
          <div
            className="flex items-center gap-sm"
            style={{ flexWrap: 'wrap', marginBottom: 4 }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                color: 'var(--accent-primary)',
                background: 'rgba(22, 163, 74, 0.10)',
                border: '1px solid rgba(22, 163, 74, 0.25)',
                padding: '2px 8px',
                borderRadius: 4,
              }}
            >
              Live graph
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {orgId ? 'Organization scope' : 'Personal scope'}
            </span>
          </div>
          <h1 className="flex items-center gap-md" style={{ margin: 0 }}>
            <Network size={26} style={{ color: 'var(--accent-primary)' }} />
            <span className="text-gradient">{knowledgeGraphLabel}</span>
          </h1>
          <p className="page-subtitle">{knowledgeGraphDescription}</p>
        </div>

        <div className="flex items-center gap-sm" style={{ flexWrap: 'wrap' }}>
          {/* Export buttons */}
          <button
            onClick={exportSvg}
            className="btn btn-secondary btn-sm flex items-center gap-xs"
            style={{ fontSize: '11px' }}
            title="Export as SVG"
          >
            <Download size={12} /> SVG
          </button>
          <button
            onClick={exportPng}
            className="btn btn-secondary btn-sm flex items-center gap-xs"
            style={{ fontSize: '11px' }}
            title="Export as PNG"
          >
            <Download size={12} /> PNG
          </button>

          {/* Tab switcher — reuses the same chip styles as Settings */}
          <div className="tab-chips">
            <button
              onClick={() => setActiveTab('graph')}
              type="button"
              className="tab-chip"
              data-state={activeTab === 'graph' ? 'active' : undefined}
            >
              <Network size={12} /> Graph
            </button>
            <button
              onClick={() => setActiveTab('report')}
              type="button"
              className="tab-chip"
              data-state={activeTab === 'report' ? 'active' : undefined}
            >
              <FileText size={12} /> Report
            </button>
          </div>

          <select
            value={timeRange}
            onChange={e => {
              setTimeRange(parseInt(e.target.value, 10));
              setReport(null);
            }}
            style={{
              fontSize: '12px',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="180">Last 6 months</option>
            <option value="365">Last year</option>
            <option value="730">Last 2 years</option>
          </select>
        </div>
      </header>

      {/* Continuous temporal slider — complements the dropdown with day-level granularity (7–730 days). Debounced so dragging doesn't flood the graph API. */}
      <TimeRangeSlider
        value={timeRange}
        onChange={days => {
          setTimeRange(days);
          setReport(null);
        }}
      />

      <ErrorBoundary>
        {orgError ? (
          <div
            className="card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 20px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
            }}
          >
            <AlertTriangle size={18} style={{ color: 'var(--error)', flexShrink: 0 }} />
            <span style={{ flex: 1, color: 'var(--text-secondary)', fontSize: 13 }}>
              {orgError}
            </span>
            <button
              onClick={() => window.location.reload()}
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--error)',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        ) : activeTab === 'graph' ? (
          <DecisionKnowledgeGraph orgId={orgId} timeRange={timeRange} />
        ) : !orgId ? (
          <div className="card">
            <div
              className="card-body flex flex-col items-center justify-center gap-sm"
              style={{ minHeight: 240, padding: '0 24px', textAlign: 'center' }}
            >
              <Network
                size={28}
                style={{ color: 'var(--text-muted)', opacity: 0.5 }}
              />
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Network analysis aggregates patterns across a team&rsquo;s decisions. Switch to the
                Graph tab to see your personal decision history, or upgrade to Strategy to unlock
                team reports.
              </p>
            </div>
          </div>
        ) : reportLoading ? (
          <div className="card">
            <div
              className="card-body flex items-center justify-center"
              style={{ height: 240, color: 'var(--text-muted)' }}
            >
              <Loader2 size={20} className="animate-spin" style={{ marginRight: 8 }} />
              Generating network analysis report…
            </div>
          </div>
        ) : reportError || !report ? (
          <div
            className="card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 20px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
            }}
          >
            <AlertTriangle size={18} style={{ color: 'var(--error)', flexShrink: 0 }} />
            <span style={{ flex: 1, color: 'var(--text-secondary)', fontSize: 13 }}>
              {reportError || 'Failed to load report.'}
            </span>
            <button
              onClick={() => {
                setReport(null);
                setReportError(null);
              }}
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--error)',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="stack-lg">
            {/* AI Narrative */}
            {report.narrative && (
              <div className="card">
                <div className="card-header">
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    AI Executive Summary
                  </span>
                </div>
                <div className="card-body">
                  <p
                    style={{
                      fontSize: 13.5,
                      color: 'var(--text-primary)',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                      margin: 0,
                    }}
                  >
                    {report.narrative}
                  </p>
                </div>
              </div>
            )}

            {/* Risk State */}
            <div className="card">
              <div
                className="card-body flex items-center justify-between"
                style={{ padding: '14px 18px' }}
              >
                <div className="flex items-center gap-md">
                  <Shield
                    size={20}
                    style={{
                      color: RISK_COLORS[report.report.riskState.overallRisk] || 'var(--text-muted)',
                    }}
                  />
                  <div>
                    <span
                      style={{
                        fontSize: 17,
                        fontWeight: 700,
                        textTransform: 'capitalize',
                        color:
                          RISK_COLORS[report.report.riskState.overallRisk] || 'var(--text-muted)',
                      }}
                    >
                      {report.report.riskState.overallRisk} Risk
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                      Score: {report.report.riskState.riskScore}/100
                    </span>
                  </div>
                </div>
                <div
                  className="flex items-center gap-xs"
                  style={{ fontSize: 12, color: 'var(--text-secondary)' }}
                >
                  {report.report.riskState.trend === 'improving' && (
                    <TrendingDown size={14} style={{ color: 'var(--success)' }} />
                  )}
                  {report.report.riskState.trend === 'worsening' && (
                    <TrendingUp size={14} style={{ color: 'var(--error)' }} />
                  )}
                  {report.report.riskState.trend === 'stable' && (
                    <Minus size={14} style={{ color: 'var(--text-muted)' }} />
                  )}
                  <span style={{ textTransform: 'capitalize' }}>
                    {report.report.riskState.trend}
                  </span>
                </div>
              </div>
              {report.report.riskState.factors.length > 0 && (
                <div style={{ padding: '0 18px 14px' }} className="stack-xs">
                  {report.report.riskState.factors.map((f, i) => (
                    <p
                      key={i}
                      style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0' }}
                    >
                      {f.description}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Key Metrics */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: 12,
              }}
            >
              {[
                { label: 'Nodes', value: report.report.metrics.nodeCount },
                { label: 'Edges', value: report.report.metrics.edgeCount },
                { label: 'Density', value: report.report.metrics.density.toFixed(3) },
                { label: 'Avg Degree', value: report.report.metrics.avgDegree },
                { label: 'Clusters', value: report.report.metrics.clusterCount },
                { label: 'Avg Cluster', value: report.report.metrics.avgClusterSize },
                { label: 'Isolated', value: report.report.metrics.isolatedNodes },
              ].map((m, i) => (
                <div
                  key={i}
                  className="card"
                  style={{ padding: '14px 10px', textAlign: 'center' }}
                >
                  <div
                    style={{
                      fontSize: 19,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      fontFamily: "'JetBrains Mono'",
                    }}
                  >
                    {m.value}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      marginTop: 2,
                    }}
                  >
                    {m.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Top Nodes */}
            {report.report.topNodes.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    Most Influential Decisions (PageRank)
                  </span>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <th style={{ textAlign: 'left', padding: '8px 16px' }}>Decision</th>
                        <th style={{ textAlign: 'left', padding: '8px' }}>Type</th>
                        <th style={{ textAlign: 'right', padding: '8px' }}>PageRank</th>
                        <th style={{ textAlign: 'right', padding: '8px' }}>Connections</th>
                        <th style={{ textAlign: 'right', padding: '8px 16px' }}>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.report.topNodes.map((n, i) => (
                        <tr
                          key={i}
                          style={{ borderBottom: '1px solid var(--border-color)' }}
                        >
                          <td
                            style={{
                              padding: '8px 16px',
                              color: 'var(--text-primary)',
                              maxWidth: 200,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {n.label}
                          </td>
                          <td
                            style={{
                              padding: '8px',
                              color: 'var(--text-muted)',
                              textTransform: 'capitalize',
                            }}
                          >
                            {n.type.replace('_', ' ')}
                          </td>
                          <td
                            style={{
                              padding: '8px',
                              textAlign: 'right',
                              color: 'var(--text-primary)',
                              fontFamily: "'JetBrains Mono'",
                            }}
                          >
                            {n.pageRank.toFixed(2)}
                          </td>
                          <td
                            style={{
                              padding: '8px',
                              textAlign: 'right',
                              color: 'var(--text-primary)',
                              fontFamily: "'JetBrains Mono'",
                            }}
                          >
                            {n.degree}
                          </td>
                          <td
                            style={{
                              padding: '8px 16px',
                              textAlign: 'right',
                              fontFamily: "'JetBrains Mono'",
                              color:
                                n.score >= 75
                                  ? 'var(--success)'
                                  : n.score >= 50
                                    ? 'var(--warning)'
                                    : 'var(--error)',
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

            {/* Anti-Patterns — Cross-Silo Alert Cards */}
            {report.report.antiPatterns.length > 0 && (
              <CrossSiloAlertCards antiPatterns={report.report.antiPatterns} />
            )}
          </div>
        )}
      </ErrorBoundary>

      {/* Causal DAG — Learned causal structure */}
      {orgId && (
        <div style={{ marginTop: 'var(--spacing-xl)' }}>
          <ErrorBoundary>
            <CausalDAG orgId={orgId} />
          </ErrorBoundary>
        </div>
      )}
    </div>
  );
}

// ─── Temporal Range Slider ────────────────────────────────────────────────

function TimeRangeSlider({ value, onChange }: { value: number; onChange: (days: number) => void }) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    if (local === value) return;
    const handle = setTimeout(() => {
      onChange(local);
    }, 300);
    return () => clearTimeout(handle);
  }, [local, value, onChange]);

  const label = (() => {
    if (local >= 365) {
      const years = (local / 365).toFixed(local % 365 === 0 ? 0 : 1);
      return `Last ${years} year${local >= 730 ? 's' : ''}`;
    }
    if (local >= 30) {
      const months = Math.round(local / 30);
      return `Last ${months} month${months === 1 ? '' : 's'}`;
    }
    return `Last ${local} day${local === 1 ? '' : 's'}`;
  })();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        marginBottom: 16,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: 'var(--text-muted)',
          minWidth: 85,
        }}
      >
        Time Window
      </span>
      <input
        type="range"
        min={7}
        max={730}
        step={1}
        value={local}
        onChange={e => setLocal(parseInt(e.target.value, 10))}
        aria-label="Time range in days"
        style={{
          flex: 1,
          accentColor: 'var(--accent-primary)',
        }}
      />
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-primary)',
          minWidth: 100,
          textAlign: 'right',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {label}
      </span>
    </div>
  );
}
