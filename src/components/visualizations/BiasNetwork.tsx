'use client';

import { useMemo } from 'react';

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

export function BiasNetwork({ biases }: BiasNetworkProps) {
  const { nodes, connections } = useMemo(() => {
    if (!biases || biases.length === 0) {
      return { nodes: [], connections: [] };
    }

    // Create nodes
    const nodeList: BiasNode[] = biases.map((bias, index) => {
      // Calculate position in a circular layout
      const angle = (index / biases.length) * 2 * Math.PI - Math.PI / 2;
      const radius = 150;
      
      return {
        id: bias.biasType,
        name: bias.biasType,
        severity: (bias.severity as any) || 'medium',
        category: (bias.category as any) || 'cognitive',
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
            strength: 0.7 - (idx * 0.1),
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

  return (
    <div className="relative">
      <svg width="400" height="400" className="mx-auto">
        {/* Draw connections */}
        {connections.map((conn, idx) => {
          const fromNode = nodes.find(n => n.id === conn.from);
          const toNode = nodes.find(n => n.id === conn.to);
          if (!fromNode || !toNode) return null;

          return (
            <line
              key={idx}
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={conn.strength * 3}
              strokeDasharray="4,4"
            />
          );
        })}

        {/* Draw nodes */}
        {nodes.map((node, idx) => (
          <g key={node.id}>
            {/* Node circle */}
            <circle
              cx={node.x}
              cy={node.y}
              r={25}
              fill={severityColors[node.severity]}
              fillOpacity={0.2}
              stroke={severityColors[node.severity]}
              strokeWidth={2}
              className="cursor-pointer transition-all hover:fill-opacity-40"
            />
            
            {/* Category indicator */}
            <circle
              cx={node.x + 15}
              cy={node.y - 15}
              r={6}
              fill={categoryColors[node.category]}
            />

            {/* Label */}
            <text
              x={node.x}
              y={node.y + 40}
              textAnchor="middle"
              fill="rgba(255,255,255,0.8)"
              fontSize="10"
              fontWeight="500"
            >
              {node.name.length > 15 ? node.name.substring(0, 15) + '...' : node.name}
            </text>
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 justify-center text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500" />
          <span className="text-muted">Low</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500" />
          <span className="text-muted">Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500" />
          <span className="text-muted">High</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-600/20 border border-red-600" />
          <span className="text-muted">Critical</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mt-2 justify-center text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          <span className="text-muted">Cognitive</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-pink-500" />
          <span className="text-muted">Emotional</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-500" />
          <span className="text-muted">Social</span>
        </div>
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
