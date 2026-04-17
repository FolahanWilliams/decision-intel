'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type {
  InternalGraphNode,
  GraphNode as ReagraphNode,
  GraphEdge as ReagraphEdge,
} from 'reagraph';
import {
  Network,
  Filter,
  X,
  Clock,
  Eye,
  EyeOff,
  Play,
  Pause,
  Search,
  Route,
  Boxes,
  Download,
  AlertTriangle,
  ChevronDown,
  Maximize2,
} from 'lucide-react';
import { useGraphPlayback } from '@/hooks/useGraphPlayback';
import { bfsShortestPath } from '@/lib/graph/pathfinding';
import { exportToDot, downloadFile } from '@/lib/graph/graph-export';
import { GraphDetailPanel } from './GraphDetailPanel';
import { ClusterSummaryPanel } from './ClusterSummaryPanel';
import type { DKGCanvasHandle } from './DecisionKnowledgeGraph3DCanvas';

// ─── Dynamic canvas import (WebGL — no SSR) ──────────────────────────────────

const DKGCanvas3D = dynamic(() => import('./DecisionKnowledgeGraph3DCanvas'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: '100%',
        minHeight: 500,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        background: '#FFFFFF',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: '2px solid #E2E8F0',
          borderTopColor: '#16A34A',
          animation: 'spin 0.85s linear infinite',
        }}
      />
      <span style={{ fontSize: 12, color: '#64748B', letterSpacing: '0.5px' }}>
        Initialising 3D graph…
      </span>
    </div>
  ),
});

// ─── Types ──────────────────────────────────────────────────────────────────

type NodeType = 'analysis' | 'human_decision' | 'person' | 'bias_pattern' | 'outcome';

interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  score: number;
  outcome?: string;
  biasCount: number;
  toxicComboCount: number;
  participants: string[];
  monetaryValue: number | null;
  createdAt: string;
  pageRank?: number;
}

interface GraphEdge {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  edgeType: string;
  strength: number;
  confidence: number;
  description?: string;
  isManual: boolean;
}

interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  clusters: number;
  inferredEdges?: number;
  manualEdges?: number;
  mostConnectedNode: string | null;
  avgDegree: number;
}

interface DecisionKnowledgeGraphProps {
  /** Org-scope when set; null = personal scope (solo Free/Individual users) */
  orgId: string | null;
  timeRange?: number;
  highlightNodeId?: string;
  onNodeSelect?: (nodeId: string, nodeType: string) => void;
}

// ─── Node Type Config ────────────────────────────────────────────────────────

const NODE_TYPE_CONFIG: Record<
  NodeType,
  { label: string; color: string; shape: string; size: number }
> = {
  analysis: { label: 'Analysis', color: '#3b82f6', shape: 'icosahedron', size: 1.0 },
  human_decision: { label: 'Human Decision', color: '#8b5cf6', shape: 'cube', size: 1.0 },
  person: { label: 'Person', color: '#14b8a6', shape: 'sphere', size: 0.6 },
  bias_pattern: { label: 'Bias Pattern', color: '#f59e0b', shape: 'tetrahedron', size: 0.65 },
  outcome: { label: 'Outcome', color: '#16A34A', shape: 'cylinder', size: 0.55 },
};

// ─── Edge Style Config ───────────────────────────────────────────────────────

const EDGE_STYLES: Record<string, { color: string; dashArray: string; label: string }> = {
  influenced_by: { color: '#475569', dashArray: '', label: 'Influenced by' },
  escalated_from: { color: '#f97316', dashArray: '', label: 'Escalated from' },
  reversed: { color: '#ef4444', dashArray: '6,3', label: 'Reversed' },
  depends_on: { color: '#64748b', dashArray: '', label: 'Depends on' },
  similar_to: { color: '#3b82f6', dashArray: '4,4', label: 'Similar to' },
  shared_bias: { color: '#a855f7', dashArray: '4,4', label: 'Shared bias' },
  same_participants: { color: '#14b8a6', dashArray: '', label: 'Same team' },
};

// ─── Colour/size helpers ─────────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 75) return '#22c55e';
  if (score >= 50) return '#eab308';
  if (score >= 25) return '#f97316';
  return '#ef4444';
}

function getNodeFill(d: GraphNode): string {
  if (d.type === 'analysis' || d.type === 'human_decision') return getScoreColor(d.score);
  if (d.type === 'outcome') {
    if (d.label === 'success') return '#22c55e';
    if (d.label === 'failure') return '#ef4444';
    if (d.label === 'mixed') return '#eab308';
    return '#16A34A';
  }
  return NODE_TYPE_CONFIG[d.type]?.color ?? '#64748b';
}

function getNodeMetricValue(d: GraphNode, metric: 'biasCount' | 'pageRank' | 'score'): number {
  if (metric === 'pageRank') return (d.pageRank ?? 0) * 10;
  if (metric === 'score') return d.score / 10;
  return d.biasCount;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DecisionKnowledgeGraph({
  orgId,
  timeRange = 90,
  highlightNodeId,
  onNodeSelect,
}: DecisionKnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<DKGCanvasHandle | null>(null);

  const [graphData, setGraphData] = useState<{
    nodes: GraphNode[];
    edges: GraphEdge[];
    stats: GraphStats;
    clusters?: Array<{ id: string; nodeIds: string[] }>;
    antiPatterns?: Array<{
      patternType: string;
      severity: number;
      nodeIds: string[];
      description: string;
      recommendation: string;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const [edgeFilter, setEdgeFilter] = useState<string>('all');
  const [minStrength, setMinStrength] = useState(0.3);
  const [visibleNodeTypes, setVisibleNodeTypes] = useState<Set<NodeType>>(
    new Set(['analysis', 'human_decision', 'person', 'bias_pattern', 'outcome'])
  );

  const [playbackEnabled, setPlaybackEnabled] = useState(false);

  const [pathMode, setPathMode] = useState(false);
  const [pathStart, setPathStart] = useState<string | null>(null);
  const [pathEnd, setPathEnd] = useState<string | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<Set<string>>(new Set());
  const [highlightedPathEdges, setHighlightedPathEdges] = useState<Set<string>>(new Set());

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Set<string>>(new Set());

  const [isolatedClusterId, setIsolatedClusterId] = useState<string | null>(null);
  const [sizeMetric, setSizeMetric] = useState<'biasCount' | 'pageRank' | 'score'>('biasCount');
  const [antiPatternsExpanded, setAntiPatternsExpanded] = useState(false);

  // ── Data fetch ──────────────────────────────────────────────────────────────

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const params = new URLSearchParams({ timeRange: String(timeRange) });
    // Omit orgId when null — the API will scope to the user's personal documents.
    if (orgId) params.set('orgId', orgId);
    if (highlightNodeId) {
      params.set('highlightNode', highlightNodeId);
      params.set('depth', '1');
    }
    fetch(`/api/decision-graph?${params}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data) setGraphData(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orgId, timeRange, highlightNodeId]);

  // ── Playback ─────────────────────────────────────────────────────────────────

  const playback = useGraphPlayback({ nodes: graphData?.nodes ?? [], intervalMs: 800 });

  // ── Search ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!searchQuery.trim() || !graphData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchResults(new Set());
      return;
    }
    const q = searchQuery.toLowerCase();
    setSearchResults(
      new Set(
        graphData.nodes
          .filter(n => n.label.toLowerCase().includes(q) || n.type.includes(q))
          .map(n => n.id)
      )
    );
  }, [searchQuery, graphData]);

  // ── Path finding ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!pathStart || !pathEnd || !graphData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHighlightedPath(new Set());
      setHighlightedPathEdges(new Set());
      return;
    }
    const result = bfsShortestPath(graphData.nodes, graphData.edges, pathStart, pathEnd);
    if (result) {
      setHighlightedPath(new Set(result.path));
      setHighlightedPathEdges(new Set(result.edges.map(e => e.id)));
    } else {
      setHighlightedPath(new Set());
      setHighlightedPathEdges(new Set());
    }
  }, [pathStart, pathEnd, graphData]);

  // ── Filtering ─────────────────────────────────────────────────────────────────

  const filteredData = useMemo(() => {
    if (!graphData) return null;

    let visibleNodes = graphData.nodes.filter(n => visibleNodeTypes.has(n.type as NodeType));

    if (playbackEnabled && playback.hasPlayback) {
      visibleNodes = visibleNodes.filter(n => playback.filterNode(n));
    }

    if (isolatedClusterId && graphData.clusters) {
      const cluster = graphData.clusters.find((c: { id: string }) => c.id === isolatedClusterId);
      if (cluster) {
        const clusterIds = new Set(cluster.nodeIds);
        visibleNodes = visibleNodes.filter(n => clusterIds.has(n.id));
      }
    }

    const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
    const edges = graphData.edges.filter(e => {
      const sId = typeof e.source === 'string' ? e.source : e.source.id;
      const tId = typeof e.target === 'string' ? e.target : e.target.id;
      if (!visibleNodeIds.has(sId) || !visibleNodeIds.has(tId)) return false;
      if (edgeFilter !== 'all' && e.edgeType !== edgeFilter) return false;
      return e.strength >= minStrength;
    });

    const connectedIds = new Set<string>();
    for (const e of edges) {
      connectedIds.add(typeof e.source === 'string' ? e.source : e.source.id);
      connectedIds.add(typeof e.target === 'string' ? e.target : e.target.id);
    }

    const nodes = visibleNodes.filter(
      n =>
        n.id === highlightNodeId ||
        connectedIds.has(n.id) ||
        ((n.type === 'analysis' || n.type === 'human_decision') &&
          edgeFilter === 'all' &&
          minStrength <= 0.3)
    );

    return { nodes, edges, stats: graphData.stats };
  }, [
    graphData,
    edgeFilter,
    minStrength,
    highlightNodeId,
    visibleNodeTypes,
    playbackEnabled,
    playback,
    isolatedClusterId,
  ]);

  // ── Reagraph data transform ───────────────────────────────────────────────────

  const { reagraphNodes, reagraphEdges } = useMemo<{
    reagraphNodes: ReagraphNode[];
    reagraphEdges: ReagraphEdge[];
  }>(() => {
    if (!filteredData) return { reagraphNodes: [], reagraphEdges: [] };

    const { nodes, edges } = filteredData;
    const decisionNodes = nodes.filter(n => n.type === 'analysis' || n.type === 'human_decision');
    const maxMetric = Math.max(...decisionNodes.map(d => getNodeMetricValue(d, sizeMetric)), 1);

    const reagraphNodes: ReagraphNode[] = nodes.map(node => {
      // Size: decision nodes scale with sizeMetric; others fixed
      let size: number;
      if (node.type === 'analysis' || node.type === 'human_decision') {
        size = 3 + (getNodeMetricValue(node, sizeMetric) / maxMetric) * 7;
      } else if (node.type === 'bias_pattern') {
        size = Math.max(2.5, Math.min(6, 2.5 + node.biasCount * 0.5));
      } else {
        size = 3.5;
      }

      // Fill colour: path > search > external highlight > score/type default
      let fill = getNodeFill(node);
      if (node.id === highlightNodeId) fill = '#22C55E';
      if (searchResults.has(node.id)) fill = '#60A5FA';
      if (highlightedPath.has(node.id)) fill = '#FBBF24';
      if (node.id === pathStart) fill = '#22C55E';
      if (node.id === pathEnd) fill = '#22C55E';

      return { id: node.id, label: node.label, size, fill, data: { ...node } };
    });

    const reagraphEdges: ReagraphEdge[] = edges.map(edge => {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
      const edgeStyle = EDGE_STYLES[edge.edgeType] ?? { color: '#334155', dashArray: '' };
      const isPathEdge = highlightedPathEdges.has(edge.id);

      return {
        id: edge.id,
        source: sourceId,
        target: targetId,
        fill: isPathEdge ? '#FBBF24' : edgeStyle.color,
        dashed: edgeStyle.dashArray !== '',
        size: isPathEdge ? 3.5 : Math.max(0.8, edge.strength * 2.5),
        arrowPlacement: 'end' as const,
        data: { ...edge, sourceId, targetId },
      };
    });

    return { reagraphNodes, reagraphEdges };
  }, [
    filteredData,
    sizeMetric,
    highlightedPath,
    highlightedPathEdges,
    searchResults,
    highlightNodeId,
    pathStart,
    pathEnd,
  ]);

  // ── Node click handling ───────────────────────────────────────────────────────

  const handleNodeSelectFromCanvas = useCallback(
    (internalNode: InternalGraphNode | null) => {
      if (!internalNode) {
        if (!pathMode) setSelectedNode(null);
        return;
      }

      const nodeId = internalNode.id;

      if (pathMode) {
        if (!pathStart) {
          setPathStart(nodeId);
        } else if (!pathEnd) {
          setPathEnd(nodeId);
        } else {
          setPathStart(nodeId);
          setPathEnd(null);
        }
        return;
      }

      const found = filteredData?.nodes.find(n => n.id === nodeId);
      if (found) {
        setSelectedNode(found);
        onNodeSelect?.(nodeId, found.type);
      }
    },
    [pathMode, pathStart, pathEnd, filteredData, onNodeSelect]
  );

  // ── Edge confirm/dismiss ──────────────────────────────────────────────────────

  const handleConfirmEdge = useCallback(async (edgeId: string) => {
    try {
      await fetch('/api/decision-graph/edges', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: edgeId, confidence: 1.0 }),
      });
    } catch {
      /* non-critical */
    }
  }, []);

  const handleDismissEdge = useCallback(async (edgeId: string) => {
    try {
      await fetch(`/api/decision-graph/edges?id=${edgeId}`, { method: 'DELETE' });
    } catch {
      /* non-critical */
    }
  }, []);

  // ── Export ────────────────────────────────────────────────────────────────────

  const handleExport = useCallback(
    async (format: 'png' | 'dot') => {
      try {
        if (format === 'png') {
          const dataUrl = canvasRef.current?.exportCanvas();
          if (!dataUrl) return;
          const blob = await (await fetch(dataUrl)).blob();
          downloadFile(blob, 'decision-graph.png');
        } else if (format === 'dot' && filteredData) {
          const dot = exportToDot(filteredData.nodes, filteredData.edges);
          downloadFile(dot, 'decision-graph.dot', 'text/vnd.graphviz');
        }
      } catch {
        /* non-critical */
      }
    },
    [filteredData]
  );

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.tabIndex = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedNode(null);
        if (pathMode) {
          setPathMode(false);
          setPathStart(null);
          setPathEnd(null);
        }
        return;
      }
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        container.querySelector<HTMLInputElement>('[data-graph-search]')?.focus();
        return;
      }
      if (e.key === 'f' && !e.metaKey && !e.ctrlKey) {
        canvasRef.current?.fitGraph();
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [pathMode]);

  // ── Early returns ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="card">
        <div className="card-body flex items-center justify-center h-96">
          <div className="animate-pulse" style={{ color: 'var(--text-muted)' }}>
            Loading decision graph…
          </div>
        </div>
      </div>
    );
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="card">
        <div
          className="card-body flex flex-col items-center justify-center h-64"
          style={{ color: 'var(--text-muted)' }}
        >
          <Network className="h-10 w-10 mb-3 opacity-40" />
          <p>No decisions to graph yet.</p>
          <p className="text-xs mt-1">Upload documents or submit decisions to build the graph.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div className="card overflow-hidden">
        {/* ── Header + Controls ── */}
        <div className="card-header flex flex-col gap-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Network size={16} style={{ color: 'var(--accent-primary)' }} />
              Decision Knowledge Graph
              <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                {graphData.stats.totalNodes} nodes · {graphData.stats.totalEdges} edges ·{' '}
                {graphData.stats.clusters} cluster(s)
              </span>
            </h3>

            <div className="flex items-center gap-2">
              {/* Edge type filter */}
              <select
                value={edgeFilter}
                onChange={e => setEdgeFilter(e.target.value)}
                style={{
                  background: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-secondary)',
                }}
                className="text-xs px-2 py-1 rounded border"
              >
                <option value="all">All edges</option>
                {Object.entries(EDGE_STYLES).map(([key, style]) => (
                  <option key={key} value={key}>
                    {style.label}
                  </option>
                ))}
              </select>

              {/* Size metric */}
              <select
                value={sizeMetric}
                onChange={e => setSizeMetric(e.target.value as typeof sizeMetric)}
                style={{
                  background: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-secondary)',
                }}
                className="text-xs px-2 py-1 rounded border"
              >
                <option value="biasCount">Size: Bias count</option>
                <option value="pageRank">Size: PageRank</option>
                <option value="score">Size: Score</option>
              </select>

              {/* Strength filter */}
              <div className="flex items-center gap-1">
                <Filter size={12} style={{ color: 'var(--text-muted)' }} />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={minStrength}
                  onChange={e => setMinStrength(parseFloat(e.target.value))}
                  style={{ accentColor: 'var(--accent-primary)' }}
                  className="w-16 h-1"
                />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {minStrength.toFixed(1)}
                </span>
              </div>

              {/* Fit view */}
              <button
                onClick={() => canvasRef.current?.fitGraph()}
                style={{ color: 'var(--text-secondary)' }}
                className="p-1 rounded"
                title="Fit graph (F)"
              >
                <Maximize2 size={14} />
              </button>

              {/* Path mode */}
              <button
                onClick={() => {
                  setPathMode(!pathMode);
                  setPathStart(null);
                  setPathEnd(null);
                }}
                style={{
                  color: pathMode ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  background: pathMode ? 'rgba(22, 163, 74, 0.12)' : 'transparent',
                }}
                className="p-1 rounded"
                title="Path finding mode"
              >
                <Route size={14} />
              </button>

              {/* Playback toggle */}
              {playback.hasPlayback && (
                <button
                  onClick={() => setPlaybackEnabled(!playbackEnabled)}
                  style={{
                    color: playbackEnabled ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    background: playbackEnabled ? 'rgba(22, 163, 74, 0.12)' : 'transparent',
                  }}
                  className="p-1 rounded"
                  title="Temporal playback"
                >
                  <Clock size={14} />
                </button>
              )}

              {/* Export dropdown */}
              <div className="relative group">
                <button
                  style={{ color: 'var(--text-secondary)' }}
                  className="p-1 rounded"
                  title="Export"
                >
                  <Download size={14} />
                </button>
                <div
                  style={{
                    background: 'var(--bg-card)',
                    borderColor: 'var(--border-color)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  }}
                  className="absolute right-0 top-full mt-1 hidden group-hover:block border rounded z-20"
                >
                  <button
                    onClick={() => handleExport('png')}
                    style={{ color: 'var(--text-secondary)' }}
                    className="block w-full px-3 py-1.5 text-xs text-left"
                  >
                    PNG
                  </button>
                  <button
                    onClick={() => handleExport('dot')}
                    style={{ color: 'var(--text-secondary)' }}
                    className="block w-full px-3 py-1.5 text-xs text-left"
                  >
                    DOT
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Node type toggles */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-[10px] uppercase tracking-wider mr-1"
              style={{ color: 'var(--text-muted)' }}
            >
              Show:
            </span>
            {(
              Object.entries(NODE_TYPE_CONFIG) as [NodeType, (typeof NODE_TYPE_CONFIG)[NodeType]][]
            ).map(([type, config]) => {
              const isVisible = visibleNodeTypes.has(type);
              const count = graphData.nodes.filter(n => n.type === type).length;
              if (count === 0) return null;
              return (
                <button
                  key={type}
                  onClick={() =>
                    setVisibleNodeTypes(prev => {
                      const next = new Set(prev);
                      if (next.has(type)) next.delete(type);
                      else next.add(type);
                      return next;
                    })
                  }
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] transition-all"
                  style={{
                    backgroundColor: isVisible ? `${config.color}20` : 'transparent',
                    border: `1px solid ${isVisible ? config.color + '60' : 'var(--bg-elevated)'}`,
                    color: isVisible ? config.color : 'var(--text-muted)',
                    opacity: isVisible ? 1 : 0.5,
                  }}
                >
                  {isVisible ? <Eye size={10} /> : <EyeOff size={10} />}
                  {config.label}
                  <span className="text-[10px] opacity-60">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Search + Path mode + Playback row */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 flex-1 min-w-[150px] max-w-[250px]">
              <Search size={12} style={{ color: 'var(--text-muted)' }} />
              <input
                data-graph-search
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search nodes… (press /)"
                style={{
                  background: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-secondary)',
                }}
                className="w-full text-xs px-2 py-1 rounded border outline-none"
              />
            </div>

            {pathMode && (
              <div
                className="flex items-center gap-2 text-[10px]"
                style={{ color: 'var(--accent-primary)' }}
              >
                <Route size={10} />
                {!pathStart
                  ? 'Click start node'
                  : !pathEnd
                    ? 'Click end node'
                    : `Path: ${highlightedPath.size} nodes`}
                {(pathStart || pathEnd) && (
                  <button
                    onClick={() => {
                      setPathStart(null);
                      setPathEnd(null);
                    }}
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            )}

            {isolatedClusterId && (
              <div
                className="flex items-center gap-1.5 text-[10px]"
                style={{ color: 'var(--accent-primary)' }}
              >
                <Boxes size={10} />
                Cluster isolated
                <button
                  onClick={() => setIsolatedClusterId(null)}
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                  className="px-1.5 py-0.5 rounded"
                >
                  Show all
                </button>
              </div>
            )}

            {playbackEnabled && playback.hasPlayback && (
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={playback.isPlaying ? playback.pause : playback.play}
                  style={{ color: 'var(--text-secondary)' }}
                  className="p-1 rounded"
                >
                  {playback.isPlaying ? <Pause size={12} /> : <Play size={12} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max={playback.totalWeeks - 1}
                  value={playback.currentWeek}
                  onChange={e => playback.seekTo(parseInt(e.target.value))}
                  style={{ accentColor: 'var(--accent-primary)' }}
                  className="w-24 h-1"
                />
                <span
                  className="text-[10px]"
                  style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono'" }}
                >
                  {playback.currentDate.toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Anti-pattern warnings */}
        {graphData.antiPatterns && graphData.antiPatterns.length > 0 && (
          <div style={{ borderColor: 'var(--border-color)' }} className="px-4 py-2 border-b">
            <button
              onClick={() => setAntiPatternsExpanded(!antiPatternsExpanded)}
              className="flex items-center gap-2 text-xs w-full"
            >
              <AlertTriangle size={14} style={{ color: 'var(--warning)' }} />
              <span style={{ color: 'var(--warning)' }} className="font-semibold">
                {graphData.antiPatterns.length} structural risk
                {graphData.antiPatterns.length !== 1 ? 's' : ''} detected
              </span>
              <ChevronDown
                size={12}
                style={{ color: 'var(--text-muted)' }}
                className={`transition-transform ${antiPatternsExpanded ? 'rotate-180' : ''}`}
              />
            </button>
            {antiPatternsExpanded && (
              <div className="mt-2 space-y-2">
                {graphData.antiPatterns.map(
                  (
                    pattern: {
                      patternType: string;
                      severity: number;
                      description: string;
                      recommendation: string;
                    },
                    i: number
                  ) => (
                    <div
                      key={i}
                      style={{
                        background: 'rgba(234, 179, 8, 0.08)',
                        borderColor: 'rgba(234, 179, 8, 0.22)',
                      }}
                      className="p-2 rounded border text-xs"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          style={{ color: 'var(--warning)' }}
                          className="font-semibold capitalize"
                        >
                          {pattern.patternType.replace(/_/g, ' ')}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          severity: {pattern.severity}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)' }} className="mb-1">
                        {pattern.description}
                      </p>
                      <p style={{ color: 'var(--text-muted)' }} className="italic">
                        {pattern.recommendation}
                      </p>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* Cluster summary */}
        {isolatedClusterId && filteredData && (
          <ClusterSummaryPanel
            clusterId={isolatedClusterId}
            nodes={filteredData.nodes}
            edges={filteredData.edges}
            onClose={() => setIsolatedClusterId(null)}
          />
        )}

        {/* Graph + Detail Panel */}
        <div className="flex">
          <div ref={containerRef} className="flex-1 relative" style={{ minHeight: 560 }}>
            <DKGCanvas3D
              ref={canvasRef}
              nodes={reagraphNodes}
              edges={reagraphEdges}
              onNodeSelect={handleNodeSelectFromCanvas}
            />
          </div>

          {selectedNode && filteredData && (
            <GraphDetailPanel
              node={selectedNode}
              edges={filteredData.edges}
              allNodes={filteredData.nodes}
              onClose={() => setSelectedNode(null)}
              onNavigateToNode={nodeId => {
                const found = filteredData.nodes.find(n => n.id === nodeId);
                if (found) {
                  setSelectedNode(found);
                  onNodeSelect?.(nodeId, found.type);
                }
              }}
              onConfirmEdge={handleConfirmEdge}
              onDismissEdge={handleDismissEdge}
            />
          )}
        </div>

        {/* Legend */}
        <div
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
          className="px-4 py-2 border-t flex flex-wrap gap-x-4 gap-y-1.5 text-xs"
        >
          <span
            className="text-[10px] uppercase tracking-wider w-full mb-0.5"
            style={{ color: 'var(--text-muted)' }}
          >
            3D Shapes
          </span>
          {(
            Object.entries(NODE_TYPE_CONFIG) as [NodeType, (typeof NODE_TYPE_CONFIG)[NodeType]][]
          ).map(([type, config]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span style={{ fontSize: 10, color: config.color }}>▶</span>
              <span>
                {config.label} ({config.shape})
              </span>
            </div>
          ))}
          <span
            className="text-[10px] uppercase tracking-wider w-full mt-1 mb-0.5"
            style={{ color: 'var(--text-muted)' }}
          >
            Edges
          </span>
          {Object.entries(EDGE_STYLES).map(([key, style]) => (
            <div key={key} className="flex items-center gap-1.5">
              <svg width="16" height="4" viewBox="0 0 16 4">
                <line
                  x1="0"
                  y1="2"
                  x2="16"
                  y2="2"
                  stroke={style.color}
                  strokeWidth="2"
                  strokeDasharray={style.dashArray || undefined}
                />
              </svg>
              <span>{style.label}</span>
            </div>
          ))}
          <span className="text-[10px] w-full mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Scroll to zoom · Drag to orbit · Click to inspect
          </span>
        </div>
      </div>
    </>
  );
}
