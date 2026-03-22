'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Settings,
  Download,
  Maximize2,
} from 'lucide-react';
import type { CausalWeight, CausalInsight } from '@/lib/learning/causal-learning';

interface CausalGraphProps {
  weights: CausalWeight[];
  insights: CausalInsight[];
  totalOutcomes: number;
  orgId: string;
  timeRange?: { from: Date; to: Date };
  onBiasSelect?: (biasType: string) => void;
}

interface Node {
  id: string;
  group: 'bias' | 'outcome' | 'center';
  label: string;
  value: number;
  danger?: number;
  correlation?: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface Link {
  source: string | Node;
  target: string | Node;
  strength: number;
  type: 'positive' | 'negative' | 'neutral';
}

export function CausalGraph({
  weights,
  insights,
  totalOutcomes,
  orgId: _orgId,
  timeRange,
  onBiasSelect,
}: CausalGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'force' | 'radial' | 'timeline'>('force');
  const [filterThreshold, setFilterThreshold] = useState(0.3);
  const [showOnlyDangerous, setShowOnlyDangerous] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Prepare graph data
  const graphData = useMemo(() => {
    const nodes: Node[] = [];
    const links: Link[] = [];

    // Add center node
    nodes.push({
      id: 'outcomes',
      group: 'center',
      label: 'Decision Outcomes',
      value: totalOutcomes,
    });

    // Add outcome nodes
    nodes.push({
      id: 'success',
      group: 'outcome',
      label: 'Successful',
      value: weights.reduce((sum, w) => sum + w.successCount, 0),
    });

    nodes.push({
      id: 'failure',
      group: 'outcome',
      label: 'Failed',
      value: weights.reduce((sum, w) => sum + w.failureCount, 0),
    });

    // Connect outcomes to center
    links.push({
      source: 'outcomes',
      target: 'success',
      strength: 0.5,
      type: 'positive',
    });

    links.push({
      source: 'outcomes',
      target: 'failure',
      strength: 0.5,
      type: 'negative',
    });

    // Add bias nodes and links
    weights.forEach(weight => {
      if (
        Math.abs(weight.outcomeCorrelation) >= filterThreshold &&
        (!showOnlyDangerous || weight.dangerMultiplier > 1.3)
      ) {
        nodes.push({
          id: weight.biasType,
          group: 'bias',
          label: formatBiasName(weight.biasType),
          value: weight.sampleSize,
          danger: weight.dangerMultiplier,
          correlation: weight.outcomeCorrelation,
        });

        // Link to appropriate outcome
        if (weight.outcomeCorrelation < 0) {
          // Negative correlation = leads to failure
          links.push({
            source: weight.biasType,
            target: 'failure',
            strength: Math.abs(weight.outcomeCorrelation),
            type: 'negative',
          });
        } else {
          // Positive correlation = leads to success
          links.push({
            source: weight.biasType,
            target: 'success',
            strength: Math.abs(weight.outcomeCorrelation),
            type: 'positive',
          });
        }
      }
    });

    return { nodes, links };
  }, [weights, filterThreshold, showOnlyDangerous, totalOutcomes]);

  // D3 Force Graph
  useEffect(() => {
    if (!svgRef.current || viewMode !== 'force') return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const { nodes, links } = graphData;

    // Create scales
    const sizeScale = d3
      .scaleLinear()
      .domain([0, d3.max(nodes, d => d.value) || 1])
      .range([10, 40]);

    const colorScale = d3.scaleSequential(d3.interpolateRdYlGn).domain([2, 0.5]); // Inverted for danger

    // Create simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink(links)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .id((d: any) => d.id)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .strength((d: any) => d.strength * 0.5)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'collision',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        d3.forceCollide().radius((d: any) => sizeScale(d.value) + 5)
      );

    // Create SVG groups
    const g = svg.append('g');

    // Add zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', event => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create links
    const link = g
      .append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', d =>
        d.type === 'positive' ? '#22c55e' : d.type === 'negative' ? '#ef4444' : '#94a3b8'
      )
      .attr('stroke-opacity', d => 0.3 + d.strength * 0.4)
      .attr('stroke-width', d => 1 + d.strength * 3);

    // Create nodes
    const node = g
      .append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(
        d3
          .drag<SVGGElement, Node>()
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
      );

    // Add circles
    node
      .append('circle')
      .attr('r', d => sizeScale(d.value))
      .attr('fill', d => {
        if (d.group === 'center') return '#1e293b';
        if (d.group === 'outcome') return d.id === 'success' ? '#22c55e' : '#ef4444';
        return colorScale(d.danger || 1);
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .on('click', (event, d) => {
        setSelectedNode(d.id);
        if (d.group === 'bias' && onBiasSelect) {
          onBiasSelect(d.id);
        }
      });

    // Add labels
    node
      .append('text')
      .text(d => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', d => sizeScale(d.value) + 15)
      .style('font-size', '12px')
      .style('font-weight', '500')
      .style('fill', '#475569');

    // Add danger indicators
    node
      .filter(d => d.group === 'bias' && (d.danger || 0) > 1.5)
      .append('text')
      .text('⚠')
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .style('font-size', '16px');

    // Update positions on tick
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [graphData, dimensions, viewMode, onBiasSelect]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width: width - 40, height: Math.max(400, height - 200) });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <Tabs
            value={viewMode}
            onValueChange={(v: string) => setViewMode(v as 'force' | 'radial' | 'timeline')}
          >
            <TabsList>
              <TabsTrigger value="force">Force Graph</TabsTrigger>
              <TabsTrigger value="radial">Radial View</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Label htmlFor="threshold">Correlation Threshold</Label>
            <Slider
              id="threshold"
              min={0}
              max={1}
              step={0.1}
              value={[filterThreshold]}
              onValueChange={v => setFilterThreshold(v[0])}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">{filterThreshold.toFixed(1)}</span>
          </div>

          <Button
            variant={showOnlyDangerous ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => setShowOnlyDangerous(!showOnlyDangerous)}
          >
            <AlertCircle className="h-4 w-4 mr-1" />
            Dangerous Only
          </Button>

          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </Card>

      {/* Graph Visualization */}
      <Card className="relative" ref={containerRef}>
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button variant="ghost" size="icon">
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {viewMode === 'force' && (
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="w-full"
          />
        )}

        {viewMode === 'radial' && <RadialView data={graphData} dimensions={dimensions} />}

        {viewMode === 'timeline' && (
          <TimelineView weights={weights} timeRange={timeRange} dimensions={dimensions} />
        )}
      </Card>

      {/* Insights Panel */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Causal Insights
        </h3>
        <div className="space-y-3">
          {insights.map((insight, idx) => (
            <InsightCard key={idx} insight={insight} />
          ))}
        </div>
      </Card>

      {/* Selected Node Details */}
      {selectedNode && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">{formatBiasName(selectedNode)} Details</h3>
          <BiasDetails biasType={selectedNode} weights={weights} />
        </Card>
      )}
    </div>
  );
}

// Radial View Component
function RadialView({
  data,
  dimensions,
}: {
  data: { nodes: Node[]; links: Link[] };
  dimensions: { width: number; height: number };
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const radius = Math.min(width, height) / 2 - 50;

    const g = svg.append('g').attr('transform', `translate(${width / 2},${height / 2})`);

    // Create radial layout
    const biasNodes = data.nodes.filter(n => n.group === 'bias');
    const angleStep = (2 * Math.PI) / biasNodes.length;

    biasNodes.forEach((node, i) => {
      const angle = i * angleStep;
      const distance = radius * (0.5 + (node.danger || 1) * 0.3);
      node.x = Math.cos(angle) * distance;
      node.y = Math.sin(angle) * distance;
    });

    // Draw circles for danger zones
    const zones = [
      { radius: radius * 0.5, label: 'Safe', color: '#22c55e20' },
      { radius: radius * 0.8, label: 'Caution', color: '#f9731620' },
      { radius: radius * 1.1, label: 'Danger', color: '#ef444420' },
    ];

    zones.forEach(zone => {
      g.append('circle')
        .attr('r', zone.radius)
        .attr('fill', zone.color)
        .attr('stroke', zone.color.replace('20', '40'))
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '5,5');

      g.append('text')
        .text(zone.label)
        .attr('x', 0)
        .attr('y', -zone.radius - 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', '#64748b');
    });

    // Draw nodes
    const nodeGroups = g
      .selectAll('g.node')
      .data(biasNodes)
      .join('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`);

    nodeGroups
      .append('circle')
      .attr('r', d => 10 + d.value * 0.5)
      .attr('fill', d => {
        const danger = d.danger || 1;
        if (danger < 0.8) return '#22c55e';
        if (danger < 1.3) return '#f97316';
        return '#ef4444';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    nodeGroups
      .append('text')
      .text(d => d.label)
      .attr('dy', 25)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', '#1e293b');

    // Center node
    g.append('circle')
      .attr('r', 30)
      .attr('fill', '#1e293b')
      .attr('stroke', '#fff')
      .attr('stroke-width', 3);

    g.append('text')
      .text('Outcomes')
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .style('font-size', '14px')
      .style('fill', '#fff')
      .style('font-weight', '600');
  }, [data, dimensions]);

  return <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />;
}

// Timeline View Component
function TimelineView({
  weights: _weights,
  timeRange: _timeRange,
  dimensions,
}: {
  weights: CausalWeight[];
  timeRange?: { from: Date; to: Date };
  dimensions: { width: number; height: number };
}) {
  // Placeholder for timeline implementation
  return (
    <div
      className="flex items-center justify-center text-muted-foreground"
      style={{ height: dimensions.height }}
    >
      <div className="text-center">
        <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Timeline view coming soon</p>
        <p className="text-sm">Will show bias evolution over time</p>
      </div>
    </div>
  );
}

// Insight Card Component
function InsightCard({ insight }: { insight: CausalInsight }) {
  const getIcon = () => {
    switch (insight.type) {
      case 'danger':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'safe':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'noise':
        return <Activity className="h-5 w-5 text-muted-foreground" />;
      case 'twin':
        return <TrendingDown className="h-5 w-5 text-orange-600" />;
    }
  };

  return (
    <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
      {getIcon()}
      <div className="flex-1">
        <p className="text-sm">{insight.message}</p>
        <div className="flex items-center gap-4 mt-1">
          <span className="text-xs text-muted-foreground">
            Confidence: {(insight.confidence * 100).toFixed(0)}%
          </span>
          {insight.dataPoints && (
            <span className="text-xs text-muted-foreground">
              Based on {insight.dataPoints} outcomes
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Bias Details Component
function BiasDetails({ biasType, weights }: { biasType: string; weights: CausalWeight[] }) {
  const weight = weights.find(w => w.biasType === biasType);
  if (!weight) return null;

  const dangerLevel =
    weight.dangerMultiplier > 1.5 ? 'High' : weight.dangerMultiplier > 1.2 ? 'Medium' : 'Low';

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-sm text-muted-foreground">Outcome Correlation</p>
        <p className="text-lg font-semibold">{(weight.outcomeCorrelation * 100).toFixed(1)}%</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Danger Level</p>
        <p className="text-lg font-semibold">{dangerLevel}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Failed Decisions</p>
        <p className="text-lg font-semibold">{weight.failureCount}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Successful Decisions</p>
        <p className="text-lg font-semibold">{weight.successCount}</p>
      </div>
      <div className="col-span-2">
        <p className="text-sm text-muted-foreground">Sample Size</p>
        <p className="text-lg font-semibold">{weight.sampleSize} decisions analyzed</p>
      </div>
    </div>
  );
}

// Helper function to format bias names
function formatBiasName(biasType: string): string {
  return biasType
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}
