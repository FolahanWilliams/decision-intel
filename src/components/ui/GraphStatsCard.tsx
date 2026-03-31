'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Network, GitBranch, Boxes, Activity, Shield } from 'lucide-react';
import { createClientLogger } from '@/lib/utils/logger';

const log = createClientLogger('GraphStatsCard');

interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  clusters: number;
  avgDegree: number;
}

interface RiskState {
  overallRisk: 'low' | 'moderate' | 'high' | 'critical';
  riskScore: number;
  factors: Array<{ factor: string; description: string }>;
}

export function GraphStatsCard() {
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [riskState, setRiskState] = useState<RiskState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        // Discover orgId first
        const teamRes = await fetch('/api/team');
        if (!teamRes.ok) return;
        const teamData = await teamRes.json();
        const orgId = teamData?.orgId || teamData?.organization?.id;
        if (!orgId || cancelled) return;

        const res = await fetch(`/api/decision-graph?orgId=${encodeURIComponent(orgId)}&limit=1`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.stats) {
          setStats(data.stats);
        }

        // Fetch risk state
        try {
          const riskRes = await fetch(
            `/api/decision-graph/risk-state?orgId=${encodeURIComponent(orgId)}`
          );
          if (riskRes.ok && !cancelled) {
            const riskData = await riskRes.json();
            setRiskState(riskData);
          }
        } catch (err) {
          log.warn('Failed to fetch risk state:', err);
        }
      } catch (err) {
        log.warn('Failed to fetch graph stats:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStats();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="card-body" style={{ padding: '20px' }}>
          <div className="skeleton" style={{ width: '100%', height: 80 }} />
        </div>
      </div>
    );
  }

  if (!stats || stats.totalNodes === 0) return null;

  const miniStats = [
    { label: 'Nodes', value: stats.totalNodes, icon: <Network size={14} /> },
    { label: 'Edges', value: stats.totalEdges, icon: <GitBranch size={14} /> },
    { label: 'Clusters', value: stats.clusters, icon: <Boxes size={14} /> },
    { label: 'Avg Degree', value: stats.avgDegree.toFixed(1), icon: <Activity size={14} /> },
  ];

  return (
    <div className="card card-glow">
      <div className="card-body" style={{ padding: '20px' }}>
        <div className="flex items-center justify-between mb-md">
          <div className="flex items-center gap-sm">
            <Network size={16} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Decision Graph
            </span>
          </div>
          <div className="flex items-center gap-sm">
            {riskState && riskState.riskScore > 0 && (
              <span
                className="flex items-center gap-xs px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{
                  background:
                    riskState.overallRisk === 'critical'
                      ? 'rgba(239,68,68,0.15)'
                      : riskState.overallRisk === 'high'
                        ? 'rgba(249,115,22,0.15)'
                        : riskState.overallRisk === 'moderate'
                          ? 'rgba(234,179,8,0.15)'
                          : 'rgba(34,197,94,0.15)',
                  color:
                    riskState.overallRisk === 'critical'
                      ? '#ef4444'
                      : riskState.overallRisk === 'high'
                        ? '#f97316'
                        : riskState.overallRisk === 'moderate'
                          ? '#eab308'
                          : '#22c55e',
                }}
                title={riskState.factors.map(f => f.description).join('\n')}
              >
                <Shield size={10} />
                {riskState.overallRisk}
              </span>
            )}
            <Link
              href="/dashboard/decision-graph"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '10px' }}
            >
              View Graph
            </Link>
          </div>
        </div>

        <div className="grid grid-4 gap-sm">
          {miniStats.map(stat => (
            <div
              key={stat.label}
              style={{
                textAlign: 'center',
                padding: '8px 4px',
                borderRadius: '6px',
                background: 'var(--bg-secondary)',
              }}
            >
              <div
                className="flex items-center justify-center gap-xs"
                style={{ color: 'var(--text-muted)', marginBottom: '4px' }}
              >
                {stat.icon}
              </div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
