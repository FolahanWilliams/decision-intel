'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import {
  Network,
  Filter,
  ZoomIn,
  ZoomOut,
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
} from 'lucide-react';
import { useGraphPlayback } from '@/hooks/useGraphPlayback';
import { bfsShortestPath } from '@/lib/graph/pathfinding';
import { exportToPng, exportToSvg, exportToDot, downloadFile } from '@/lib/graph/graph-export';
import { GraphDetailPanel } from './GraphDetailPanel';
import { ClusterSummaryPanel } from './ClusterSummaryPanel';
import { GraphMinimap } from './GraphMinimap';

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
  // D3 simulation fields
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
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
  orgId: string;
  timeRange?: number;
  highlightNodeId?: string;
  onNodeSelect?: (nodeId: string, nodeType: string) => void;
}

// ─── Node Type Config ───────────────────────────────────────────────────────

const NODE_TYPE_CONFIG: Record<
  NodeType,
  {
    label: string;
    color: string;
    shape: 'circle' | 'rect' | 'diamond' | 'triangle' | 'star';
    size: number;
  }
> = {
  analysis: { label: 'Analysis', color: '#3b82f6', shape: 'circle', size: 1.0 },
  human_decision: { label: 'Human Decision', color: '#8b5cf6', shape: 'rect', size: 1.0 },
  person: { label: 'Person', color: '#14b8a6', shape: 'diamond', size: 0.6 },
  bias_pattern: { label: 'Bias Pattern', color: '#f59e0b', shape: 'triangle', size: 0.65 },
  outcome: { label: 'Outcome', color: '#16A34A', shape: 'star', size: 0.55 },
};

// ─── Edge Style Config ──────────────────────────────────────────────────────

const EDGE_STYLES: Record<
  string,
  { color: string; dashArray: string; directed: boolean; label: string }
> = {
  influenced_by: { color: '#94a3b8', dashArray: '', directed: true, label: 'Influenced by' },
  escalated_from: { color: '#f97316', dashArray: '', directed: true, label: 'Escalated from' },
  reversed: { color: '#ef4444', dashArray: '6,3', directed: true, label: 'Reversed' },
  depends_on: { color: '#94a3b8', dashArray: '', directed: true, label: 'Depends on' },
  similar_to: { color: '#3b82f6', dashArray: '4,4', directed: false, label: 'Similar to' },
  shared_bias: { color: '#a855f7', dashArray: '4,4', directed: false, label: 'Shared bias' },
  same_participants: { color: '#14b8a6', dashArray: '', directed: false, label: 'Same team' },
};

// ─── Node Color / Size Helpers ──────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 75) return '#22c55e';
  if (score >= 50) return '#eab308';
  if (score >= 25) return '#f97316';
  return '#ef4444';
}

function getNodeFill(d: GraphNode): string {
  // Decision nodes use score-based coloring; others use type color
  if (d.type === 'analysis' || d.type === 'human_decision') {
    return getScoreColor(d.score);
  }
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

function getNodeRadius(
  d: GraphNode,
  sizeScale: d3.ScaleLinear<number, number>,
  metric: 'biasCount' | 'pageRank' | 'score' = 'biasCount'
): number {
  const typeConfig = NODE_TYPE_CONFIG[d.type];
  const baseSize = typeConfig ? typeConfig.size : 1.0;
  if (d.type === 'analysis' || d.type === 'human_decision') {
    return sizeScale(getNodeMetricValue(d, metric)) * baseSize;
  }
  // Person/bias_pattern size by connection count (biasCount repurposed as occurrence count)
  if (d.type === 'bias_pattern') {
    return Math.max(8, Math.min(20, 8 + d.biasCount * 2)) * baseSize;
  }
  // Person and outcome get fixed small sizes
  return 10 * baseSize;
}

function getOutcomeRing(outcome?: string): string | null {
  if (outcome === 'failure') return '#ef4444';
  if (outcome === 'success') return '#22c55e';
  return null;
}

// ─── D3 Shape Renderers ─────────────────────────────────────────────────────

function renderNodeShape(
  selection: d3.Selection<SVGGElement, GraphNode, SVGGElement, unknown>,
  d: GraphNode,
  r: number,
  isHighlighted: boolean
) {
  const el = d3.select(selection.node()!);
  const fill = getNodeFill(d);
  const strokeColor = isHighlighted ? '#fff' : 'rgba(255,255,255,0.3)';
  const strokeWidth = isHighlighted ? 3 : 1.5;
  const config = NODE_TYPE_CONFIG[d.type];

  switch (config?.shape) {
    case 'rect':
      el.append('rect')
        .attr('x', -r)
        .attr('y', -r)
        .attr('width', r * 2)
        .attr('height', r * 2)
        .attr('rx', 6)
        .attr('fill', fill)
        .attr('stroke', strokeColor)
        .attr('stroke-width', strokeWidth);
      break;
    case 'diamond': {
      const pts = `0,${-r} ${r},0 0,${r} ${-r},0`;
      el.append('polygon')
        .attr('points', pts)
        .attr('fill', fill)
        .attr('stroke', strokeColor)
        .attr('stroke-width', strokeWidth);
      break;
    }
    case 'triangle': {
      const h = r * 1.15;
      const pts = `0,${-h} ${r},${h * 0.6} ${-r},${h * 0.6}`;
      el.append('polygon')
        .attr('points', pts)
        .attr('fill', fill)
        .attr('stroke', strokeColor)
        .attr('stroke-width', strokeWidth);
      break;
    }
    case 'star': {
      const outerR = r;
      const innerR = r * 0.45;
      const points: string[] = [];
      for (let i = 0; i < 5; i++) {
        const outerAngle = Math.PI / 2 + (i * 2 * Math.PI) / 5;
        const innerAngle = outerAngle + Math.PI / 5;
        points.push(`${Math.cos(outerAngle) * outerR},${-Math.sin(outerAngle) * outerR}`);
        points.push(`${Math.cos(innerAngle) * innerR},${-Math.sin(innerAngle) * innerR}`);
      }
      el.append('polygon')
        .attr('points', points.join(' '))
        .attr('fill', fill)
        .attr('stroke', strokeColor)
        .attr('stroke-width', strokeWidth);
      break;
    }
    default: // circle
      el.append('circle')
        .attr('r', r)
        .attr('fill', fill)
        .attr('stroke', strokeColor)
        .attr('stroke-width', strokeWidth);
      break;
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export function DecisionKnowledgeGraph({
  orgId,
  timeRange = 90,
  highlightNodeId,
  onNodeSelect,
}: DecisionKnowledgeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });
  const [edgeFilter, setEdgeFilter] = useState<string>('all');
  const [minStrength, setMinStrength] = useState(0.3);
  const [visibleNodeTypes, setVisibleNodeTypes] = useState<Set<NodeType>>(
    new Set(['analysis', 'human_decision', 'person', 'bias_pattern', 'outcome'])
  );

  // Playback state
  const [playbackEnabled, setPlaybackEnabled] = useState(false);

  // Path finding state
  const [pathMode, setPathMode] = useState(false);
  const [pathStart, setPathStart] = useState<string | null>(null);
  const [pathEnd, setPathEnd] = useState<string | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<Set<string>>(new Set());
  const [highlightedPathEdges, setHighlightedPathEdges] = useState<Set<string>>(new Set());

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Set<string>>(new Set());

  // Cluster drill-down
  const [isolatedClusterId, setIsolatedClusterId] = useState<string | null>(null);

  // Size metric
  const [sizeMetric, setSizeMetric] = useState<'biasCount' | 'pageRank' | 'score'>('biasCount');

  // Anti-pattern warnings
  const [antiPatternsExpanded, setAntiPatternsExpanded] = useState(false);

  // Edge interaction
  const [, setSelectedEdge] = useState<GraphEdge | null>(null);

  // Minimap state
  const [zoomTransform, setZoomTransform] = useState({ x: 0, y: 0, k: 1 });

  // Fetch graph data
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ orgId, timeRange: String(timeRange) });
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

  // Responsive sizing
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width: Math.max(600, width), height: Math.max(400, height) });
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Playback hook
  const playback = useGraphPlayback({
    nodes: graphData?.nodes ?? [],
    intervalMs: 800,
  });

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim() || !graphData) {
      setSearchResults(new Set());
      return;
    }
    const q = searchQuery.toLowerCase();
    const matches = new Set(
      graphData.nodes
        .filter(n => n.label.toLowerCase().includes(q) || n.type.includes(q))
        .map(n => n.id)
    );
    setSearchResults(matches);
  }, [searchQuery, graphData]);

  // Path finding computation
  useEffect(() => {
    if (!pathStart || !pathEnd || !graphData) {
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

  // Filter edges and nodes
  const filteredData = useMemo(() => {
    if (!graphData) return null;

    // First, filter nodes by visible types + playback + cluster isolation
    let visibleNodes = graphData.nodes.filter(n => visibleNodeTypes.has(n.type as NodeType));

    // Playback filter: only show nodes created before current playback date
    if (playbackEnabled && playback.hasPlayback) {
      visibleNodes = visibleNodes.filter(n => playback.filterNode(n));
    }

    // Cluster isolation
    if (isolatedClusterId && graphData.clusters) {
      const cluster = graphData.clusters.find((c: { id: string }) => c.id === isolatedClusterId);
      if (cluster) {
        const clusterIds = new Set(cluster.nodeIds);
        visibleNodes = visibleNodes.filter(n => clusterIds.has(n.id));
      }
    }
    const visibleNodeIds = new Set(visibleNodes.map(n => n.id));

    // Filter edges: both ends must be in visible node set + match edge filter + strength
    const edges = graphData.edges.filter(e => {
      const sourceId = typeof e.source === 'string' ? e.source : e.source.id;
      const targetId = typeof e.target === 'string' ? e.target : e.target.id;
      if (!visibleNodeIds.has(sourceId) || !visibleNodeIds.has(targetId)) return false;
      if (edgeFilter !== 'all' && e.edgeType !== edgeFilter) return false;
      if (e.strength < minStrength) return false;
      return true;
    });

    // Only include nodes that have at least one visible edge (or are highlighted)
    const connectedIds = new Set<string>();
    for (const e of edges) {
      const sourceId = typeof e.source === 'string' ? e.source : e.source.id;
      const targetId = typeof e.target === 'string' ? e.target : e.target.id;
      connectedIds.add(sourceId);
      connectedIds.add(targetId);
    }

    // Always include highlighted node; show isolated decision nodes if no filter active
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

  // D3 Force Simulation
  useEffect(() => {
    if (!svgRef.current || !filteredData || filteredData.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const { nodes, edges } = filteredData;

    // Deep clone to avoid mutating state
    const simNodes = nodes.map(n => ({ ...n }));
    const simEdges = edges.map(e => ({
      ...e,
      source: typeof e.source === 'string' ? e.source : e.source.id,
      target: typeof e.target === 'string' ? e.target : e.target.id,
    }));

    // Size scale (for decision nodes sized by selected metric)
    const decisionNodes = simNodes.filter(
      d => d.type === 'analysis' || d.type === 'human_decision'
    );
    const maxMetric = d3.max(decisionNodes, d => getNodeMetricValue(d, sizeMetric)) || 1;
    const sizeScale = d3.scaleLinear().domain([0, maxMetric]).range([12, 28]);

    // Simulation — lighter charge for larger multi-type graphs
    const nodeCount = simNodes.length;
    const chargeStrength = nodeCount > 200 ? -150 : nodeCount > 100 ? -200 : -250;

    const simulation = d3
      .forceSimulation(simNodes)
      .force(
        'link',
        d3
          .forceLink(simEdges)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .id((d: any) => d.id)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .strength((d: any) => d.strength * 0.3)
          .distance(100)
      )
      .force('charge', d3.forceManyBody().strength(chargeStrength))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'collision',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        d3.forceCollide().radius((d: any) => getNodeRadius(d, sizeScale, sizeMetric) + 6)
      )
      .force('x', d3.forceX(width / 2).strength(0.04))
      .force('y', d3.forceY(height / 2).strength(0.04));

    // Faster stabilization for large graphs
    if (nodeCount > 200) {
      simulation.alphaDecay(0.03).velocityDecay(0.4);
    }

    // SVG root group (for zoom/pan)
    const g = svg.append('g');

    // Zoom
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on('zoom', event => {
        g.attr('transform', event.transform);
        setZoomTransform({ x: event.transform.x, y: event.transform.y, k: event.transform.k });
      });
    svg.call(zoom);

    // Arrow markers for directed edges
    const defs = svg.append('defs');
    Object.entries(EDGE_STYLES).forEach(([type, style]) => {
      if (style.directed) {
        defs
          .append('marker')
          .attr('id', `arrow-${type}`)
          .attr('viewBox', '0 -5 10 10')
          .attr('refX', 20)
          .attr('refY', 0)
          .attr('markerWidth', 6)
          .attr('markerHeight', 6)
          .attr('orient', 'auto')
          .append('path')
          .attr('d', 'M0,-5L10,0L0,5')
          .attr('fill', style.color);
      }
    });

    // Render edges
    const link = g
      .append('g')
      .selectAll('line')
      .data(simEdges)
      .join('line')
      .attr('stroke', d => EDGE_STYLES[d.edgeType]?.color ?? '#94a3b8')
      .attr('stroke-dasharray', d => EDGE_STYLES[d.edgeType]?.dashArray ?? '')
      .attr('stroke-opacity', d => (d.confidence < 0.7 ? 0.25 : 0.4 + d.strength * 0.4))
      .attr('stroke-width', d => 1 + d.strength * 2)
      .attr('marker-end', d =>
        EDGE_STYLES[d.edgeType]?.directed ? `url(#arrow-${d.edgeType})` : ''
      );

    // Render nodes
    const node = g
      .append('g')
      .selectAll('g')
      .data(simNodes)
      .join('g')
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          }) as any
      )
      .style('cursor', 'pointer');

    // Outcome ring (outer) — only for decision nodes
    node.each(function (d) {
      if (d.type !== 'analysis' && d.type !== 'human_decision') return;
      const ringColor = getOutcomeRing(d.outcome);
      if (ringColor) {
        const r = getNodeRadius(d, sizeScale, sizeMetric);
        d3.select(this)
          .append('circle')
          .attr('r', r + 4)
          .attr('fill', 'none')
          .attr('stroke', ringColor)
          .attr('stroke-width', 2.5)
          .attr('stroke-opacity', 0.7);
      }
    });

    // Node shapes — dispatched by type (circle, rect, diamond, triangle, star)
    node.each(function (d) {
      const r = getNodeRadius(d, sizeScale, sizeMetric);
      const isHighlighted = d.id === highlightNodeId;
      renderNodeShape(
        d3.select(this) as unknown as d3.Selection<SVGGElement, GraphNode, SVGGElement, unknown>,
        d,
        r,
        isHighlighted
      );
    });

    // Toxic combo indicator — only for decision nodes
    node
      .filter(d => d.toxicComboCount > 0)
      .append('circle')
      .attr('cx', d => getNodeRadius(d, sizeScale, sizeMetric) - 4)
      .attr('cy', d => -(getNodeRadius(d, sizeScale, sizeMetric) - 4))
      .attr('r', 5)
      .attr('fill', '#ef4444')
      .attr('stroke', '#1e1e2e')
      .attr('stroke-width', 1.5);

    // Labels
    node
      .append('text')
      .text(d => {
        const maxLen = d.type === 'person' || d.type === 'bias_pattern' ? 16 : 20;
        return d.label.length > maxLen ? d.label.slice(0, maxLen - 2) + '...' : d.label;
      })
      .attr('text-anchor', 'middle')
      .attr('dy', d => getNodeRadius(d, sizeScale, sizeMetric) + 14)
      .attr('fill', d => {
        const config = NODE_TYPE_CONFIG[d.type];
        return config ? config.color : '#a1a1aa';
      })
      .attr('font-size', d =>
        d.type === 'person' || d.type === 'bias_pattern' || d.type === 'outcome' ? '9px' : '10px'
      )
      .attr('font-weight', d => (d.type === 'bias_pattern' ? '500' : '400'))
      .attr('pointer-events', 'none');

    // Apply search/path highlights
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, react-hooks/unsupported-syntax
    node.selectAll('circle, rect, polygon').each(function (this: any, d: any) {
      const n = d as GraphNode;
      const el = d3.select(this);
      if (searchResults.size > 0 && searchResults.has(n.id)) {
        el.attr('stroke', '#ffffff').attr('stroke-width', 3);
      } else if (highlightedPath.size > 0 && highlightedPath.has(n.id)) {
        el.attr('stroke', '#22c55e').attr('stroke-width', 3);
      } else if (highlightedPath.size > 0 || searchResults.size > 0) {
        el.attr('opacity', 0.3);
      }
    });

    // Apply path highlighting to edges
    if (highlightedPathEdges.size > 0) {
      link
        .attr('stroke-width', (d: GraphEdge) => (highlightedPathEdges.has(d.id) ? 4 : 0.5))
        .attr('stroke-opacity', (d: GraphEdge) => (highlightedPathEdges.has(d.id) ? 0.9 : 0.1));
    }

    // Click handler
    node.on('click', (_event, d) => {
      if (pathMode) {
        if (!pathStart) {
          setPathStart(d.id);
        } else if (!pathEnd) {
          setPathEnd(d.id);
        } else {
          setPathStart(d.id);
          setPathEnd(null);
        }
        return;
      }
      const found = nodes.find(n => n.id === d.id);
      if (found) {
        setSelectedNode(found);
        onNodeSelect?.(d.id, d.type);
      }
    });

    // Edge click handler
    link
      .on('click', (_event: MouseEvent, d: GraphEdge) => {
        setSelectedEdge(d);
      })
      .style('cursor', 'pointer');

    // Simulation tick
    simulation.on('tick', () => {
      link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr('x1', (d: any) => d.source.x)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr('y1', (d: any) => d.source.y)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr('x2', (d: any) => d.target.x)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [
    filteredData,
    dimensions,
    highlightNodeId,
    onNodeSelect,
    pathMode,
    pathStart,
    pathEnd,
    searchResults,
    highlightedPath,
    highlightedPathEdges,
    sizeMetric,
  ]);

  // Zoom controls
  const handleZoom = useCallback((factor: number) => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const currentTransform = d3.zoomTransform(svgRef.current);
    svg
      .transition()
      .duration(300)
      .call(
        d3.zoom<SVGSVGElement, unknown>().transform as never,
        currentTransform.scale(factor) as never
      );
  }, []);

  // Edge confirm/dismiss handlers
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

  // Export handlers
  const handleExport = useCallback(
    async (format: 'png' | 'svg' | 'dot') => {
      if (!svgRef.current || !filteredData) return;
      try {
        if (format === 'png') {
          const blob = await exportToPng(svgRef.current);
          downloadFile(blob, 'decision-graph.png');
        } else if (format === 'svg') {
          const svgStr = exportToSvg(svgRef.current);
          downloadFile(svgStr, 'decision-graph.svg', 'image/svg+xml');
        } else if (format === 'dot') {
          const dot = exportToDot(filteredData.nodes, filteredData.edges);
          downloadFile(dot, 'decision-graph.dot', 'text/vnd.graphviz');
        }
      } catch {
        /* non-critical */
      }
    },
    [filteredData]
  );

  // Keyboard navigation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.tabIndex = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedNode(null);
        setSelectedEdge(null);
        if (pathMode) {
          setPathMode(false);
          setPathStart(null);
          setPathEnd(null);
        }
        return;
      }
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const searchInput = container.querySelector<HTMLInputElement>('[data-graph-search]');
        searchInput?.focus();
        return;
      }
      if (e.key === 'f' && !e.metaKey && !e.ctrlKey) {
        // Fit to viewport
        if (svgRef.current) {
          const svg = d3.select(svgRef.current);
          svg
            .transition()
            .duration(300)
            .call(d3.zoom<SVGSVGElement, unknown>().transform as never, d3.zoomIdentity as never);
        }
        return;
      }
      if (e.key === '+' || e.key === '=') handleZoom(1.3);
      if (e.key === '-') handleZoom(0.7);
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [pathMode, handleZoom]);

  if (loading) {
    return (
      <div className="card">
        <div className="card-body flex items-center justify-center h-96">
          <div className="animate-pulse text-zinc-500">Loading decision graph...</div>
        </div>
      </div>
    );
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="card">
        <div className="card-body flex flex-col items-center justify-center h-64 text-zinc-500">
          <Network className="h-10 w-10 mb-3 opacity-40" />
          <p>No decisions to graph yet.</p>
          <p className="text-xs mt-1">Upload documents or submit decisions to build the graph.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Header + Controls */}
      <div className="card-header flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Network size={16} className="text-blue-400" />
            Decision Knowledge Graph
            <span className="text-xs font-normal text-zinc-500">
              {graphData.stats.totalNodes} nodes, {graphData.stats.totalEdges} edges,{' '}
              {graphData.stats.clusters} cluster(s)
            </span>
          </h3>

          <div className="flex items-center gap-2">
            {/* Edge type filter */}
            <select
              value={edgeFilter}
              onChange={e => setEdgeFilter(e.target.value)}
              className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 text-zinc-300"
            >
              <option value="all">All edges</option>
              {Object.entries(EDGE_STYLES).map(([key, style]) => (
                <option key={key} value={key}>
                  {style.label}
                </option>
              ))}
            </select>

            {/* Size metric selector */}
            <select
              value={sizeMetric}
              onChange={e => setSizeMetric(e.target.value as 'biasCount' | 'pageRank' | 'score')}
              className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 text-zinc-300"
            >
              <option value="biasCount">Size: Bias Count</option>
              <option value="pageRank">Size: PageRank</option>
              <option value="score">Size: Score</option>
            </select>

            {/* Strength filter */}
            <div className="flex items-center gap-1">
              <Filter size={12} className="text-zinc-500" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={minStrength}
                onChange={e => setMinStrength(parseFloat(e.target.value))}
                className="w-16 h-1 accent-blue-500"
              />
              <span className="text-xs text-zinc-500">{minStrength.toFixed(1)}</span>
            </div>

            {/* Zoom */}
            <button
              onClick={() => handleZoom(1.3)}
              className="p-1 rounded hover:bg-white/10 text-zinc-400"
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={() => handleZoom(0.7)}
              className="p-1 rounded hover:bg-white/10 text-zinc-400"
            >
              <ZoomOut size={14} />
            </button>

            {/* Path mode toggle */}
            <button
              onClick={() => {
                setPathMode(!pathMode);
                setPathStart(null);
                setPathEnd(null);
              }}
              className={`p-1 rounded text-zinc-400 ${pathMode ? 'bg-green-500/20 text-green-400' : 'hover:bg-white/10'}`}
              title="Path finding mode"
            >
              <Route size={14} />
            </button>

            {/* Playback toggle */}
            {playback.hasPlayback && (
              <button
                onClick={() => setPlaybackEnabled(!playbackEnabled)}
                className={`p-1 rounded text-zinc-400 ${playbackEnabled ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/10'}`}
                title="Temporal playback"
              >
                <Clock size={14} />
              </button>
            )}

            {/* Export dropdown */}
            <div className="relative group">
              <button className="p-1 rounded hover:bg-white/10 text-zinc-400" title="Export">
                <Download size={14} />
              </button>
              <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-zinc-900 border border-white/10 rounded shadow-lg z-20">
                <button
                  onClick={() => handleExport('png')}
                  className="block w-full px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5 text-left"
                >
                  PNG
                </button>
                <button
                  onClick={() => handleExport('svg')}
                  className="block w-full px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5 text-left"
                >
                  SVG
                </button>
                <button
                  onClick={() => handleExport('dot')}
                  className="block w-full px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5 text-left"
                >
                  DOT
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Node type toggles */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider mr-1">Show:</span>
          {(
            Object.entries(NODE_TYPE_CONFIG) as [NodeType, (typeof NODE_TYPE_CONFIG)[NodeType]][]
          ).map(([type, config]) => {
            const isVisible = visibleNodeTypes.has(type);
            const count = graphData.nodes.filter(n => n.type === type).length;
            if (count === 0) return null;
            return (
              <button
                key={type}
                onClick={() => {
                  setVisibleNodeTypes(prev => {
                    const next = new Set(prev);
                    if (next.has(type)) next.delete(type);
                    else next.add(type);
                    return next;
                  });
                }}
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

        {/* Search + Path mode + Playback controls row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="flex items-center gap-1 flex-1 min-w-[150px] max-w-[250px]">
            <Search size={12} className="text-zinc-500" />
            <input
              data-graph-search
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search nodes... (press /)"
              className="w-full text-xs px-2 py-1 rounded bg-white/5 border border-white/10 text-zinc-300 outline-none focus:border-white/30"
            />
          </div>

          {/* Path mode info */}
          {pathMode && (
            <div className="flex items-center gap-2 text-[10px] text-green-400">
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
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          )}

          {/* Cluster isolation indicator */}
          {isolatedClusterId && (
            <div className="flex items-center gap-1.5 text-[10px] text-blue-400">
              <Boxes size={10} />
              Cluster isolated
              <button
                onClick={() => setIsolatedClusterId(null)}
                className="px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 hover:text-zinc-200"
              >
                Show all
              </button>
            </div>
          )}

          {/* Playback controls */}
          {playbackEnabled && playback.hasPlayback && (
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={playback.isPlaying ? playback.pause : playback.play}
                className="p-1 rounded hover:bg-white/10 text-zinc-400"
              >
                {playback.isPlaying ? <Pause size={12} /> : <Play size={12} />}
              </button>
              <input
                type="range"
                min="0"
                max={playback.totalWeeks - 1}
                value={playback.currentWeek}
                onChange={e => playback.seekTo(parseInt(e.target.value))}
                className="w-24 h-1 accent-blue-500"
              />
              <span
                className="text-[10px] text-zinc-500"
                style={{ fontFamily: "'JetBrains Mono'" }}
              >
                {playback.currentDate.toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Anti-pattern warnings */}
      {graphData.antiPatterns && graphData.antiPatterns.length > 0 && (
        <div className="px-4 py-2 border-b border-white/5">
          <button
            onClick={() => setAntiPatternsExpanded(!antiPatternsExpanded)}
            className="flex items-center gap-2 text-xs w-full"
          >
            <AlertTriangle size={14} className="text-amber-400" />
            <span className="text-amber-400 font-semibold">
              {graphData.antiPatterns.length} structural risk
              {graphData.antiPatterns.length !== 1 ? 's' : ''} detected
            </span>
            <ChevronDown
              size={12}
              className={`text-zinc-500 transition-transform ${antiPatternsExpanded ? 'rotate-180' : ''}`}
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
                    className="p-2 rounded bg-amber-500/5 border border-amber-500/10 text-xs"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-amber-400 capitalize">
                        {pattern.patternType.replace(/_/g, ' ')}
                      </span>
                      <span className="text-zinc-500">severity: {pattern.severity}</span>
                    </div>
                    <p className="text-zinc-400 mb-1">{pattern.description}</p>
                    <p className="text-zinc-500 italic">{pattern.recommendation}</p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* Cluster summary when isolated */}
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
        {/* Graph Canvas */}
        <div ref={containerRef} className="flex-1 relative" style={{ minHeight: 500 }}>
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="bg-zinc-950/50"
          />
          {/* Minimap */}
          {filteredData && filteredData.nodes.length > 5 && (
            <GraphMinimap
              nodes={filteredData.nodes.map(n => ({
                x: (n as GraphNode & { x?: number }).x ?? 0,
                y: (n as GraphNode & { y?: number }).y ?? 0,
                type: n.type,
              }))}
              viewportX={zoomTransform.x}
              viewportY={zoomTransform.y}
              viewportScale={zoomTransform.k}
              graphWidth={dimensions.width}
              graphHeight={dimensions.height}
              onViewportClick={() => {
                // Fit viewport on click
                if (svgRef.current) {
                  const svg = d3.select(svgRef.current);
                  svg
                    .transition()
                    .duration(300)
                    .call(
                      d3.zoom<SVGSVGElement, unknown>().transform as never,
                      d3.zoomIdentity as never
                    );
                }
              }}
            />
          )}
        </div>

        {/* Node Detail Panel — replaced with GraphDetailPanel */}
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
      <div className="px-4 py-2 border-t border-white/5 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-500">
        {/* Node shapes */}
        <span className="text-[10px] uppercase tracking-wider text-zinc-600 w-full mb-0.5">
          Nodes
        </span>
        {(
          Object.entries(NODE_TYPE_CONFIG) as [NodeType, (typeof NODE_TYPE_CONFIG)[NodeType]][]
        ).map(([type, config]) => (
          <div key={type} className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="-6 -6 12 12">
              {config.shape === 'circle' && <circle r="5" fill={config.color} />}
              {config.shape === 'rect' && (
                <rect x="-5" y="-5" width="10" height="10" rx="2" fill={config.color} />
              )}
              {config.shape === 'diamond' && (
                <polygon points="0,-5 5,0 0,5 -5,0" fill={config.color} />
              )}
              {config.shape === 'triangle' && (
                <polygon points="0,-5 5,4 -5,4" fill={config.color} />
              )}
              {config.shape === 'star' && (
                <polygon
                  points="0,-5 1.5,-1.5 5,-1.5 2.5,1 3.5,5 0,2.5 -3.5,5 -2.5,1 -5,-1.5 -1.5,-1.5"
                  fill={config.color}
                />
              )}
            </svg>
            <span>{config.label}</span>
          </div>
        ))}
        {/* Edge types */}
        <span className="text-[10px] uppercase tracking-wider text-zinc-600 w-full mt-1 mb-0.5">
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
              {style.directed && <polygon points="12,0 16,2 12,4" fill={style.color} />}
            </svg>
            <span>{style.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
