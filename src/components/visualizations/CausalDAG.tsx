'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Loader2, AlertTriangle, GitBranch, Sparkles, Network } from 'lucide-react';
import { getBiasDisplayName } from '@/lib/utils/bias-normalize';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CausalDAGProps {
  orgId: string;
}

interface DAGEdge {
  from: string;
  to: string;
  strength: number;
  confounders: string[];
}

interface DAGData {
  nodes: string[];
  edges: DAGEdge[];
  sampleSize: number;
  algorithm: string;
  confidence: 'low' | 'moderate' | 'high';
}

interface InterventionResult {
  baselineProbability: number;
  interventionProbability: number;
  improvementDelta: number;
}

interface LayoutNode {
  id: string;
  label: string;
  column: number;
  row: number;
  x: number;
  y: number;
  isOutcome: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CONFIDENCE_COLORS: Record<string, string> = {
  low: '#f97316',
  moderate: '#eab308',
  high: '#22c55e',
};

function edgeColor(strength: number): string {
  if (strength > 0.6) return '#22c55e';
  if (strength >= 0.3) return '#eab308';
  return '#71717a';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CausalDAG({ orgId }: CausalDAGProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [dag, setDag] = useState<DAGData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [interventionLoading, setInterventionLoading] = useState(false);
  const [interventionResult, setInterventionResult] = useState<InterventionResult | null>(null);

  // -----------------------------------------------------------------------
  // Fetch DAG data
  // -----------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function fetchDAG() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/learning/causal?type=dag');
        if (!res.ok) throw new Error(`Failed to load causal DAG (${res.status})`);
        const data = await res.json();
        if (!cancelled) {
          setDag(data.dag ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error loading causal DAG');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDAG();
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  // -----------------------------------------------------------------------
  // Toggle node selection
  // -----------------------------------------------------------------------
  const toggleNode = useCallback((nodeId: string) => {
    // Don't allow selecting the outcome node
    if (nodeId === 'outcome') return;
    setSelectedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
    // Clear previous intervention result when selection changes
    setInterventionResult(null);
  }, []);

  // -----------------------------------------------------------------------
  // Run intervention
  // -----------------------------------------------------------------------
  const runIntervention = useCallback(async () => {
    if (selectedNodes.size === 0) return;
    setInterventionLoading(true);
    setInterventionResult(null);
    try {
      const res = await fetch('/api/learning/causal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remove: Array.from(selectedNodes) }),
      });
      if (!res.ok) throw new Error(`Intervention failed (${res.status})`);
      const data = await res.json();
      setInterventionResult(data);
    } catch {
      // Silently handle — the button can be retried
    } finally {
      setInterventionLoading(false);
    }
  }, [selectedNodes]);

  // -----------------------------------------------------------------------
  // Layout computation
  // -----------------------------------------------------------------------
  const computeLayout = useCallback(
    (
      dagData: DAGData,
      width: number,
      height: number
    ): { nodes: LayoutNode[]; } => {
      const { nodes: nodeIds, edges } = dagData;

      // Determine which nodes connect directly to outcome
      const directCauseIds = new Set(
        edges.filter(e => e.to === 'outcome').map(e => e.from)
      );

      // Assign columns: indirect = 0, direct = 1, outcome = 2
      const columnMap: Record<string, number> = {};
      nodeIds.forEach(id => {
        if (id === 'outcome') {
          columnMap[id] = 2;
        } else if (directCauseIds.has(id)) {
          columnMap[id] = 1;
        } else {
          columnMap[id] = 0;
        }
      });

      // Group by column for vertical spacing
      const columns: Record<number, string[]> = {};
      nodeIds.forEach(id => {
        const col = columnMap[id];
        if (!columns[col]) columns[col] = [];
        columns[col].push(id);
      });

      const paddingX = 120;
      const paddingY = 60;
      const usableWidth = width - paddingX * 2;
      const usableHeight = height - paddingY * 2;

      const maxCol = Math.max(...Object.keys(columns).map(Number));
      const colWidth = maxCol > 0 ? usableWidth / maxCol : usableWidth;

      const layoutNodes: LayoutNode[] = nodeIds.map(id => {
        const col = columnMap[id];
        const colNodes = columns[col];
        const row = colNodes.indexOf(id);
        const rowCount = colNodes.length;
        const rowHeight = rowCount > 1 ? usableHeight / (rowCount - 1) : 0;

        return {
          id,
          label: id === 'outcome' ? 'Outcome' : getBiasDisplayName(id),
          column: col,
          row,
          x: paddingX + col * colWidth,
          y: rowCount === 1 ? height / 2 : paddingY + row * rowHeight,
          isOutcome: id === 'outcome',
        };
      });

      return { nodes: layoutNodes };
    },
    []
  );

  // -----------------------------------------------------------------------
  // D3 rendering
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!svgRef.current || !dag || dag.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const container = containerRef.current;
    const width = container ? container.clientWidth : 800;
    const height = 480;

    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('preserveAspectRatio', 'xMidYMid meet');

    const { nodes: layoutNodes } = computeLayout(dag, width, height);
    const nodeMap = new Map(layoutNodes.map(n => [n.id, n]));

    const g = svg.append('g');

    // --- Arrow marker definition ---
    const defs = svg.append('defs');

    // One marker per color
    const markerColors = [
      { id: 'arrow-green', color: '#22c55e' },
      { id: 'arrow-amber', color: '#eab308' },
      { id: 'arrow-gray', color: '#71717a' },
    ];

    markerColors.forEach(({ id, color }) => {
      defs
        .append('marker')
        .attr('id', id)
        .attr('viewBox', '0 0 10 10')
        .attr('refX', 28)
        .attr('refY', 5)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto-start-reverse')
        .append('path')
        .attr('d', 'M 0 0 L 10 5 L 0 10 z')
        .attr('fill', color);
    });

    // Glow filter for selected nodes
    const filter = defs
      .append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    filter
      .append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'coloredBlur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // --- Edges ---
    dag.edges.forEach(edge => {
      const source = nodeMap.get(edge.from);
      const target = nodeMap.get(edge.to);
      if (!source || !target) return;

      const color = edgeColor(edge.strength);
      const markerId =
        edge.strength > 0.6
          ? 'arrow-green'
          : edge.strength >= 0.3
            ? 'arrow-amber'
            : 'arrow-gray';

      g.append('line')
        .attr('x1', source.x)
        .attr('y1', source.y)
        .attr('x2', target.x)
        .attr('y2', target.y)
        .attr('stroke', color)
        .attr('stroke-width', 1 + edge.strength * 4)
        .attr('stroke-opacity', 0.5 + edge.strength * 0.3)
        .attr('marker-end', `url(#${markerId})`);

      // Strength label at midpoint
      if (edge.strength >= 0.3) {
        g.append('text')
          .attr('x', (source.x + target.x) / 2)
          .attr('y', (source.y + target.y) / 2 - 8)
          .attr('text-anchor', 'middle')
          .style('font-size', '10px')
          .style('fill', '#a1a1aa')
          .style('font-family', "'JetBrains Mono', monospace")
          .text(edge.strength.toFixed(2));
      }
    });

    // --- Nodes ---
    layoutNodes.forEach(node => {
      const nodeG = g
        .append('g')
        .attr('transform', `translate(${node.x}, ${node.y})`)
        .style('cursor', node.isOutcome ? 'default' : 'pointer');

      const isSelected = selectedNodes.has(node.id);

      if (node.isOutcome) {
        // Diamond shape for outcome
        const size = 22;
        const diamond = `M 0 ${-size} L ${size} 0 L 0 ${size} L ${-size} 0 Z`;

        if (isSelected) {
          nodeG
            .append('path')
            .attr('d', diamond)
            .attr('fill', 'none')
            .attr('stroke', '#3b82f6')
            .attr('stroke-width', 3)
            .attr('filter', 'url(#glow)');
        }

        nodeG
          .append('path')
          .attr('d', diamond)
          .attr('fill', '#1e293b')
          .attr('stroke', '#60a5fa')
          .attr('stroke-width', 2);

        nodeG
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', 4)
          .style('font-size', '10px')
          .style('font-weight', '600')
          .style('fill', '#60a5fa')
          .text('OUT');
      } else {
        // Circle for bias nodes
        if (isSelected) {
          nodeG
            .append('circle')
            .attr('r', 24)
            .attr('fill', 'none')
            .attr('stroke', '#3b82f6')
            .attr('stroke-width', 3)
            .attr('filter', 'url(#glow)');
        }

        nodeG
          .append('circle')
          .attr('r', 18)
          .attr('fill', '#18181b')
          .attr('stroke', isSelected ? '#3b82f6' : '#52525b')
          .attr('stroke-width', 2);
      }

      // Label
      nodeG
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', node.isOutcome ? 36 : 34)
        .style('font-size', '11px')
        .style('fill', '#d4d4d8')
        .text(node.label);

      // Click handler for selection
      if (!node.isOutcome) {
        nodeG.on('click', () => {
          toggleNode(node.id);
        });
      }
    });
  }, [dag, selectedNodes, computeLayout, toggleNode]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  // Loading state
  if (loading) {
    return (
      <div className="card">
        <div className="card-body flex items-center justify-center h-64 text-zinc-500">
          <Loader2 size={20} className="animate-spin mr-2" />
          Loading causal model...
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="card">
        <div className="card-body flex items-center justify-center h-64 text-red-400">
          <AlertTriangle size={20} className="mr-2" />
          {error}
        </div>
      </div>
    );
  }

  // Empty state
  if (!dag || dag.nodes.length === 0) {
    return (
      <div className="card">
        <div className="card-body flex flex-col items-center justify-center h-64 text-zinc-500">
          <Network size={32} className="mb-3 opacity-40" />
          <p className="text-sm">
            Track 20+ decision outcomes to build your organization&apos;s causal model
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch size={14} className="text-blue-400" />
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Causal DAG
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Confidence badge */}
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{
              color: CONFIDENCE_COLORS[dag.confidence] ?? '#71717a',
              backgroundColor: `${CONFIDENCE_COLORS[dag.confidence] ?? '#71717a'}20`,
            }}
          >
            {dag.confidence} confidence
          </span>
          {/* Sample size badge */}
          <span className="text-[10px] text-zinc-500 px-2 py-0.5 rounded-full bg-white/5">
            n={dag.sampleSize}
          </span>
          {/* Algorithm badge */}
          <span className="text-[10px] text-zinc-500 px-2 py-0.5 rounded-full bg-white/5">
            {dag.algorithm}
          </span>
        </div>
      </div>

      {/* SVG Container */}
      <div className="card-body p-0" ref={containerRef}>
        <svg
          ref={svgRef}
          className="w-full"
          style={{ minHeight: 480, background: 'rgba(24, 24, 27, 0.5)' }}
        />
      </div>

      {/* Intervention Result */}
      {interventionResult && (
        <div className="px-4 pb-3">
          <div className="rounded-lg border border-white/10 bg-white/5 p-3 flex items-center gap-6 text-xs">
            <Sparkles size={14} className="text-blue-400 shrink-0" />
            <div className="flex items-center gap-6">
              <div>
                <span className="text-zinc-500">Baseline</span>
                <span
                  className="ml-1 text-zinc-300 font-mono"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {(interventionResult.baselineProbability * 100).toFixed(1)}%
                </span>
              </div>
              <span className="text-zinc-600">&rarr;</span>
              <div>
                <span className="text-zinc-500">After intervention</span>
                <span
                  className="ml-1 text-zinc-300 font-mono"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {(interventionResult.interventionProbability * 100).toFixed(1)}%
                </span>
              </div>
              <div>
                <span
                  className="font-mono font-semibold"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color:
                      interventionResult.improvementDelta > 0
                        ? '#22c55e'
                        : interventionResult.improvementDelta < 0
                          ? '#ef4444'
                          : '#71717a',
                  }}
                >
                  {interventionResult.improvementDelta > 0 ? '+' : ''}
                  {(interventionResult.improvementDelta * 100).toFixed(1)}%
                </span>
                <span className="text-zinc-500 ml-1">improvement</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating action bar when nodes are selected */}
      {selectedNodes.size > 0 && (
        <div className="px-4 pb-4">
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 flex items-center justify-between">
            <div className="text-sm text-zinc-300">
              <span className="font-medium text-blue-400">
                Intervene on {selectedNodes.size} bias{selectedNodes.size > 1 ? 'es' : ''}
              </span>
              <span className="text-zinc-500 ml-2">
                &mdash; Remove selected biases to estimate impact
              </span>
            </div>
            <button
              onClick={runIntervention}
              disabled={interventionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {interventionLoading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Sparkles size={12} />
              )}
              Run Intervention
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
