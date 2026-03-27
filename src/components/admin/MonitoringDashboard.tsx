'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Activity, DollarSign, AlertTriangle, Server } from 'lucide-react';

interface MetricsData {
  window: { minutes: number; since: string };
  api: {
    totalRequestsRecorded: number;
    routeSummaries: Array<{
      route: string;
      method: string;
      count: number;
      avgMs: number;
      p95: number;
      errorRate: number;
    }>;
    overallPercentiles: { p50: number; p95: number; p99: number; count: number; avgMs: number } | null;
  };
  ai: {
    period: string;
    costs: Array<{ provider: string; operation: string; calls: number; totalCost: number }>;
    totalCost: number;
  };
  errors: { recentCount: number };
  timestamp: string;
}

interface HealthData {
  status: string;
  message: string;
  timestamp: string;
  responseTime: number;
  services: Record<string, { status: string; [key: string]: unknown }>;
}

export function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [metricsRes, healthRes] = await Promise.all([
        fetch('/api/admin/metrics?window=5'),
        fetch('/api/health'),
      ]);

      if (metricsRes.ok) {
        setMetrics(await metricsRes.json());
      }
      if (healthRes.ok) {
        setHealth(await healthRes.json());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
            System Monitoring
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Real-time performance and health metrics
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="btn btn-secondary btn-sm flex items-center gap-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--spacing-lg)',
            fontSize: '13px',
            color: '#ef4444',
          }}
        >
          {error}
        </div>
      )}

      {/* Status cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
        <StatusCard
          icon={<Server size={16} />}
          label="System Status"
          value={health?.status || 'unknown'}
          color={health?.status === 'healthy' ? '#22c55e' : health?.status === 'degraded' ? '#eab308' : '#ef4444'}
        />
        <StatusCard
          icon={<Activity size={16} />}
          label="API p95 Latency"
          value={metrics?.api.overallPercentiles ? `${metrics.api.overallPercentiles.p95}ms` : 'N/A'}
          color="var(--text-primary)"
        />
        <StatusCard
          icon={<DollarSign size={16} />}
          label="AI Cost (24h)"
          value={metrics ? `$${metrics.ai.totalCost.toFixed(4)}` : 'N/A'}
          color="var(--text-primary)"
        />
        <StatusCard
          icon={<AlertTriangle size={16} />}
          label="Recent Errors"
          value={metrics?.errors.recentCount?.toString() || '0'}
          color={metrics && metrics.errors.recentCount > 0 ? '#ef4444' : '#22c55e'}
        />
      </div>

      {/* Service Health */}
      {health && (
        <Section title="Service Health" description={`Response time: ${health.responseTime}ms`}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
            {Object.entries(health.services).map(([name, svc]) => (
              <div
                key={name}
                style={{
                  padding: '12px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${svc.status === 'healthy' || svc.status === 'in_sync' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: svc.status === 'healthy' || svc.status === 'in_sync' ? '#22c55e' : svc.status === 'degraded' ? '#eab308' : '#ef4444',
                    }}
                  />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                    {name.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{svc.status}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* API Route Performance */}
      {metrics && metrics.api.routeSummaries.length > 0 && (
        <Section title="API Route Performance" description={`${metrics.api.totalRequestsRecorded} total requests tracked`}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--liquid-border)' }}>
                  <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-muted)', fontWeight: 500 }}>Route</th>
                  <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-muted)', fontWeight: 500 }}>Method</th>
                  <th style={{ textAlign: 'right', padding: '8px', color: 'var(--text-muted)', fontWeight: 500 }}>Requests</th>
                  <th style={{ textAlign: 'right', padding: '8px', color: 'var(--text-muted)', fontWeight: 500 }}>Avg (ms)</th>
                  <th style={{ textAlign: 'right', padding: '8px', color: 'var(--text-muted)', fontWeight: 500 }}>p95 (ms)</th>
                  <th style={{ textAlign: 'right', padding: '8px', color: 'var(--text-muted)', fontWeight: 500 }}>Error Rate</th>
                </tr>
              </thead>
              <tbody>
                {metrics.api.routeSummaries.map((route, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)' }}>
                      {route.route}
                    </td>
                    <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>{route.method}</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: 'var(--text-secondary)' }}>{route.count}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", color: route.avgMs > 1000 ? '#ef4444' : 'var(--text-primary)' }}>
                      {route.avgMs}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", color: route.p95 > 2000 ? '#ef4444' : 'var(--text-primary)' }}>
                      {route.p95}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', color: route.errorRate > 0.1 ? '#ef4444' : '#22c55e' }}>
                      {(route.errorRate * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* AI Cost Breakdown */}
      {metrics && metrics.ai.costs.length > 0 && (
        <Section title="AI Cost Breakdown" description="Last 24 hours by operation">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {metrics.ai.costs.map((cost, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {cost.operation.replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                    {cost.provider}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {cost.calls} calls
                  </span>
                  <span style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: 'var(--text-primary)' }}>
                    ${cost.totalCost.toFixed(4)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function StatusCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{
        padding: '16px',
        background: 'var(--liquid-tint)',
        border: '1px solid var(--liquid-border)',
        borderRadius: 'var(--radius-lg)',
        backdropFilter: 'blur(var(--liquid-blur))',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: '20px', fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace", textTransform: 'capitalize' }}>
        {value}
      </div>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--liquid-tint)',
        border: '1px solid var(--liquid-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-lg)',
        marginBottom: 'var(--spacing-lg)',
        backdropFilter: 'blur(var(--liquid-blur)) saturate(140%)',
      }}
    >
      <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{title}</h2>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--spacing-md)' }}>{description}</p>
      {children}
    </div>
  );
}
