'use client';

import { useMemo, useState } from 'react';

interface BiasNode {
  id: string;
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'cognitive' | 'emotional' | 'social';
  x: number;
  y: number;
}

interface BiasConnection {
  from: string;
  to: string;
  strength: number;
}

interface BiasNetworkProps {
  biases: Array<{
    biasType: string;
    severity: string;
    category?: string;
  }>;
}

// Bias relationships - which biases tend to occur together
const biasRelationships: Record<string, string[]> = {
  'Confirmation Bias': ['Selective Perception', 'Anchoring Bias', 'Availability Heuristic'],
  'Anchoring Bias': ['Confirmation Bias', 'Framing Effect', 'Status Quo Bias'],
  'Sunk Cost Fallacy': ['Loss Aversion', 'Status Quo Bias', 'Overconfidence Bias'],
  'Overconfidence Bias': ['Confirmation Bias', 'Hindsight Bias', 'Planning Fallacy'],
  'Groupthink': ['Authority Bias', 'Bandwagon Effect', 'Confirmation Bias'],
  'Authority Bias': ['Groupthink', 'Confirmation Bias'],
  'Bandwagon Effect': ['Groupthink', 'Authority Bias'],
  'Loss Aversion': ['Sunk Cost Fallacy', 'Status Quo Bias', 'Framing Effect'],
  'Availability Heuristic': ['Recency Bias', 'Confirmation Bias'],
  'Hindsight Bias': ['Overconfidence Bias', 'Confirmation Bias'],
  'Planning Fallacy': ['Overconfidence Bias', 'Optimism Bias'],
  'Status Quo Bias': ['Loss Aversion', 'Anchoring Bias', 'Sunk Cost Fallacy'],
  'Framing Effect': ['Anchoring Bias', 'Loss Aversion'],
  'Selective Perception': ['Confirmation Bias', 'Availability Heuristic'],
  'Recency Bias': ['Availability Heuristic'],
};

const severityColors: Record<string, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#dc2626',
};

const categoryColors: Record<string, string> = {
  cognitive: '#6366f1',
  emotional: '#ec4899',
  social: '#8b5cf6',
};

export function BiasNetwork({ biases = [] }: BiasNetworkProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const { nodes, connections } = useMemo(() => {
    if (!biases || biases.length === 0) {
      return { nodes: [], connections: [] };
    }

    // Create nodes
    const nodeList: BiasNode[] = biases.map((bias, index) => {
      // Calculate position in a circular layout
      const angle = (index / biases.length) * 2 * Math.PI - Math.PI / 2;
      const radius = 120; // Slightly smaller radius to fit padding

      return {
        id: bias.biasType,
        name: bias.biasType,
        severity: (bias.severity as any) || 'medium',
        category: (bias.category as any)?.toLowerCase() || 'cognitive',
        x: 200 + Math.cos(angle) * radius,
        y: 200 + Math.sin(angle) * radius,
      };
    });

    // Create connections based on relationships
    const connectionList: BiasConnection[] = [];
    nodeList.forEach((node, i) => {
      const related = biasRelationships[node.id] || [];
      related.forEach((relatedBias, idx) => {
        const targetNode = nodeList.find(n => n.id === relatedBias || n.name === relatedBias);
        if (targetNode && !connectionList.find(c =>
          (c.from === node.id && c.to === targetNode.id) ||
          (c.from === targetNode.id && c.to === node.id)
        )) {
          connectionList.push({
            from: node.id,
            to: targetNode.id,
            strength: 0.8 - (idx * 0.15), // Stranger visual strength differentiation
          });
        }
      });
    });

    return { nodes: nodeList, connections: connectionList };
  }, [biases]);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted">
        No bias data available
      </div>
    );
  }

  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;

  return (
    <div className="flex flex-col h-full">
      <div className="relative flex-1 min-h-[400px] flex items-center justify-center bg-gradient-to-b from-transparent to-black/20 rounded-lg">
        <svg viewBox="0 0 400 400" className="w-full h-full max-w-[500px] max-h-[500px]">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#666" fillOpacity="0.5" />
            </marker>
          </defs>

          {/* Draw connections */}
          {connections.map((conn, idx) => {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return null;

            const isRelated = selectedNodeId
              ? (conn.from === selectedNodeId || conn.to === selectedNodeId)
              : true;

            const opacity = selectedNodeId ? (isRelated ? 0.8 : 0.1) : 0.4;
            const width = isRelated ? conn.strength * 4 : 1;

            return (
              <line
                key={idx}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke="currentColor"
                className={isRelated ? "text-accent-primary" : "text-muted"}
                strokeOpacity={opacity}
                strokeWidth={width}
                strokeDasharray={isRelated ? "none" : "4,4"}
              />
            );
          })}

          {/* Draw nodes */}
          {nodes.map((node, idx) => {
            const isSelected = selectedNodeId === node.id;
            const isDimmed = selectedNodeId && !isSelected &&
              !connections.some(c => (c.from === selectedNodeId && c.to === node.id) || (c.from === node.id && c.to === selectedNodeId));

            return (
              <g
                key={node.id}
                onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
                className="cursor-pointer transition-all duration-300"
                style={{ opacity: isDimmed ? 0.2 : 1 }}
              >
                {/* Glow effect for selected */}
                {isSelected && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={35}
                    fill={severityColors[node.severity]}
                    fillOpacity={0.1}
                    className="animate-pulse"
                  />
                )}

                {/* Node circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isSelected ? 28 : 24}
                  fill={severityColors[node.severity]}
                  fillOpacity={0.2}
                  stroke={severityColors[node.severity]}
                  strokeWidth={isSelected ? 3 : 2}
                  className="transition-all duration-300 hover:fill-opacity-40"
                />

                {/* Category indicator dot */}
                <circle
                  cx={node.x + (isSelected ? 18 : 15)}
                  cy={node.y - (isSelected ? 18 : 15)}
                  r={6}
                  fill={categoryColors[node.category]}
                  stroke="#1a1a1a"
                  strokeWidth={2}
                />

                {/* Icon/Letter */}
                <text
                  x={node.x}
                  y={node.y}
                  dy="0.3em"
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.9)"
                  fontSize="14"
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {node.name.charAt(0)}
                </text>

                {/* Label */}
                <text
                  x={node.x}
                  y={node.y + 45}
                  textAnchor="middle"
                  fill={isSelected ? "#fff" : "rgba(255,255,255,0.7)"}
                  fontSize={isSelected ? "12" : "10"}
                  fontWeight={isSelected ? "700" : "500"}
                  className="select-none pointer-events-none"
                >
                  {node.name.length > 20 && !isSelected ? node.name.substring(0, 18) + '...' : node.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Instructions Overlay if nothing selected */}
        {!selectedNodeId && (
          <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
            <span className="text-[10px] text-muted bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm border border-white/5">
              Click a node to explore relationships
            </span>
          </div>
        )}
      </div>

      {/* Details Panel */}
      <div className={`mt-4 transition-all duration-300 ${selectedNodeId ? 'opacity-100 max-h-48' : 'opacity-50 max-h-12 overflow-hidden'}`}>
        {selectedNode ? (
          <div className="p-4 rounded-lg bg-secondary/40 border border-border">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: severityColors[selectedNode.severity] }} />
                {selectedNode.name}
              </h4>
              <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 uppercase" style={{ color: categoryColors[selectedNode.category] }}>
                {selectedNode.category}
              </span>
            </div>
            <p className="text-sm text-muted">
              This bias is often linked to
              {connections.filter(c => c.from === selectedNode.id || c.to === selectedNode.id).length > 0 ? (
                <span className="text-foreground ml-1">
                  {connections
                    .filter(c => c.from === selectedNode.id || c.to === selectedNode.id)
                    .map(c => {
                      const otherId = c.from === selectedNode.id ? c.to : c.from;
                      return nodes.find(n => n.id === otherId)?.name;
                    })
                    .join(', ')}
                </span>
              ) : (
                <span className="italic ml-1">no other detected biases in this document</span>
              )}.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 justify-center text-xs mt-2 border-t border-white/5 pt-4">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500" /> <span className="text-muted">Low</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500" /> <span className="text-muted">Medium</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500" /> <span className="text-muted">High</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-600/20 border border-red-600" /> <span className="text-muted">Critical</span></div>
          </div>
        )}
      </div>
    </div>
  );
}

export function BiasClusterChart({ biases }: BiasNetworkProps) {
  const clusters = useMemo(() => {
    const groups: Record<string, typeof biases> = {
      cognitive: [],
      emotional: [],
      social: [],
    };

    biases.forEach(bias => {
      const category = (bias.category as string) || 'cognitive';
      if (groups[category]) {
        groups[category].push(bias);
      } else {
        groups.cognitive.push(bias);
      }
    });

    return groups;
  }, [biases]);

  return (
    <div className="space-y-4">
      {Object.entries(clusters).map(([category, categoryBiases]) => {
        if (categoryBiases.length === 0) return null;

        const colors: Record<string, { bg: string, border: string, text: string }> = {
          cognitive: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400' },
          emotional: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400' },
          social: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400' },
        };

        const color = colors[category as keyof typeof colors];

        return (
          <div key={category} className={`p-4 rounded-lg border ${color.bg} ${color.border}`}>
            <h4 className={`text-sm font-medium mb-3 capitalize ${color.text}`}>
              {category} Biases ({categoryBiases.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {categoryBiases.map((bias, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs rounded-full bg-black/30 border border-white/10"
                  style={{
                    borderColor: severityColors[bias.severity as keyof typeof severityColors] + '40',
                    color: severityColors[bias.severity as keyof typeof severityColors],
                  }}
                >
                  {bias.biasType}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
