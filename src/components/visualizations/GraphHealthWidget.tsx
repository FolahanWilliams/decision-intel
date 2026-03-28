'use client';

import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, GitBranch, Loader2 } from 'lucide-react';

interface GraphStats {
  edgeCount: number;
  manualEdgeCount?: number;
  nodeCount?: number;
  density?: number;
  isolatedNodes?: number;
  antiPatterns?: number;
}

interface RiskState {
  riskLevel?: string;
  antiPatternCount?: number;
}

export function GraphHealthWidget() {
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [riskState, setRiskState] = useState<RiskState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const [statsRes, riskRes] = await Promise.all([
          fetch('/api/decision-graph/stats').catch(() => null),
          fetch('/api/decision-graph/risk-state').catch(() => null),
        ]);

        if (cancelled) return;

        // Handle stats response
        if (statsRes && statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        } else if (statsRes && (statsRes.status === 503 || statsRes.status === 400)) {
          // Table doesn't exist or no orgId — graph not initialized
          setError('Graph not initialized');
          setLoading(false);
          return;
        } else {
          setError('Graph not initialized');
          setLoading(false);
          return;
        }

        // Handle risk state response
        if (riskRes && riskRes.ok) {
          const riskData = await riskRes.json();
          setRiskState(riskData);
        }
      } catch {
        if (!cancelled) {
          setError('Graph not initialized');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-border/50 bg-card p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Loading graph health...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-border/50 bg-card p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <GitBranch size={16} />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  const density = stats?.density ?? 0;
  const isolatedNodes = stats?.isolatedNodes ?? 0;
  const antiPatternCount = riskState?.antiPatternCount ?? stats?.antiPatterns ?? 0;
  const edgeCount = stats?.edgeCount ?? 0;

  return (
    <div className="rounded-lg border border-border/50 bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity size={16} className="text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Graph Health</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Network Density */}
        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground mb-1">Network Density</p>
          <p className="text-lg font-semibold text-foreground">
            {typeof density === 'number' ? density.toFixed(2) : '—'}
          </p>
        </div>

        {/* Edge Count */}
        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground mb-1">Edges</p>
          <p className="text-lg font-semibold text-foreground">{edgeCount}</p>
        </div>

        {/* Isolated Nodes */}
        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground mb-1">Isolated Nodes</p>
          <p className={`text-lg font-semibold ${isolatedNodes > 0 ? 'text-warning' : 'text-foreground'}`}>
            {isolatedNodes}
          </p>
        </div>

        {/* Anti-patterns */}
        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground mb-1">Anti-patterns</p>
          <p className={`text-lg font-semibold flex items-center gap-1 ${antiPatternCount > 0 ? 'text-error' : 'text-foreground'}`}>
            {antiPatternCount > 0 && <AlertTriangle size={14} />}
            {antiPatternCount}
          </p>
        </div>
      </div>
    </div>
  );
}
