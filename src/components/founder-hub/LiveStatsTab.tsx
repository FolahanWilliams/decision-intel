'use client';

import { useState, useCallback, useEffect } from 'react';
import { TrendingUp, Target, Brain, Users } from 'lucide-react';
import { card, sectionTitle, stat } from '@/components/founder-hub/shared-styles';

// ─── Tab Content: Live Stats ────────────────────────────────────────────────

export function LiveStatsTab() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [dashboardData, setDashboardData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const fetchStats = useCallback(() => {
    setError(false);
    Promise.all([
      fetch('/api/stats')
        .then(r => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch('/api/outcomes/dashboard?timeRange=all')
        .then(r => (r.ok ? r.json() : null))
        .catch(() => null),
    ]).then(([s, d]) => {
      if (!s && !d) {
        setError(true);
      } else {
        setStats(s);
        setDashboardData(d);
      }
      setLastRefreshed(new Date().toLocaleTimeString());
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchStats fetches from external API and sets state on response
    fetchStats();
    const interval = setInterval(fetchStats, 60_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading) {
    return (
      <div style={card}>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
          Loading live stats from your database...
        </p>
      </div>
    );
  }

  if (error && !stats && !dashboardData) {
    return (
      <div style={card}>
        <p style={{ color: '#ef4444', textAlign: 'center', padding: 40 }}>
          Failed to load stats.{' '}
          <button
            onClick={fetchStats}
            style={{
              background: 'none',
              border: '1px solid #ef4444',
              color: '#ef4444',
              borderRadius: 6,
              padding: '4px 12px',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Retry
          </button>
        </p>
      </div>
    );
  }

  const s = stats as Record<string, number | string | unknown[]> | null;
  const d = dashboardData as Record<string, unknown> | null;
  const kpis = d?.kpis as Record<string, number> | undefined;

  return (
    <div>
      {/* Hero Stats */}
      <div style={{ ...card, borderTop: '3px solid #22c55e' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <div style={sectionTitle}>
            <TrendingUp size={18} style={{ color: '#22c55e' }} /> Live Product Metrics
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {lastRefreshed && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Updated {lastRefreshed}
              </span>
            )}
            <button
              onClick={fetchStats}
              style={{
                background: 'var(--bg-tertiary, #0a0a0a)',
                border: '1px solid var(--border-primary, #222)',
                color: 'var(--text-secondary)',
                borderRadius: 6,
                padding: '4px 10px',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Refresh
            </button>
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
          Auto-refreshes every 60s. Pull this up during investor meetings or sales calls.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { value: s?.totalDocuments ?? '—', label: 'Documents Uploaded', color: '#3b82f6' },
            { value: s?.documentsAnalyzed ?? '—', label: 'Analyses Completed', color: '#22c55e' },
            {
              value: s?.avgScore != null ? `${Math.round(s.avgScore as number)}` : '—',
              label: 'Avg Decision Score',
              color: '#f59e0b',
            },
            { value: kpis?.decisionsTracked ?? '—', label: 'Outcomes Tracked', color: '#16A34A' },
          ].map((m, i) => (
            <div key={i} style={card}>
              <div style={{ ...stat, color: m.color }}>{String(m.value)}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Calibration & Accuracy */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={card}>
          <div style={sectionTitle}>
            <Target size={16} style={{ color: '#16A34A' }} /> Calibration Metrics
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {[
              { label: 'Decision Accuracy Rate', value: `${kpis?.accuracyRate ?? 0}%` },
              { label: 'Bias Detection Accuracy', value: `${kpis?.biasDetectionAccuracy ?? 0}%` },
              { label: 'Avg Impact Score', value: `${kpis?.avgImpactScore ?? 0}/100` },
              {
                label: 'Pending Outcomes',
                value: `${(d as Record<string, unknown>)?.pendingOutcomes ?? 0}`,
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  borderBottom: '1px solid var(--border-primary, #222)',
                  fontSize: 13,
                }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={card}>
          <div style={sectionTitle}>
            <Brain size={16} style={{ color: '#8b5cf6' }} /> Top Biases Detected
          </div>
          {Array.isArray(s?.topBiases) ? (
            <div style={{ display: 'grid', gap: 6 }}>
              {(s.topBiases as Array<{ biasType: string; count: number; displayName?: string }>)
                .slice(0, 7)
                .map((b, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '6px 0',
                      borderBottom: '1px solid var(--border-primary, #222)',
                      fontSize: 12,
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {b.displayName || b.biasType?.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.count}</span>
                  </div>
                ))}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              No bias data yet. Analyze some documents first.
            </p>
          )}
        </div>
      </div>

      {/* Twin Effectiveness */}
      {Array.isArray((d as Record<string, unknown>)?.twinEffectiveness) &&
        ((d as Record<string, unknown>).twinEffectiveness as unknown[]).length > 0 && (
          <div style={card}>
            <div style={sectionTitle}>
              <Users size={16} style={{ color: '#16A34A' }} /> Twin Effectiveness (Live)
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 8,
              }}
            >
              {(
                (d as Record<string, unknown>).twinEffectiveness as Array<Record<string, unknown>>
              ).map((t, i) => (
                <div
                  key={i}
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    background: 'var(--bg-tertiary, #0a0a0a)',
                    fontSize: 12,
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {String(t.twinName)}
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>
                    {Math.round((t.effectivenessRate as number) * 100)}% accuracy,{' '}
                    {String(t.dissentCount)} dissents
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Demo Funnel (from analytics) */}
      <div style={card}>
        <div style={sectionTitle}>
          <TrendingUp size={16} style={{ color: '#8b5cf6' }} /> Demo &amp; Conversion Funnel
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
          Track with <code>trackEvent()</code> from <code>src/lib/analytics/track.ts</code>. Query
          via <code>GET /api/analytics/events?name=demo_viewed</code>.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {[
            { event: 'hero_cta_clicked', label: 'Hero CTA Click' },
            { event: 'demo_sample_selected', label: 'Sample Selected' },
            { event: 'demo_simulation_started', label: 'Sim Started' },
            { event: 'demo_simulation_completed', label: 'Sim Completed' },
            { event: 'demo_paste_analyzed', label: 'Paste Analyzed' },
            { event: 'roi_calculator_used', label: 'ROI Calculated' },
            { event: 'signup_started', label: 'Signup Started' },
            { event: 'analysis_completed', label: 'Analysis Done' },
            { event: 'quick_scan_completed', label: 'Quick Scan' },
            { event: 'case_study_viewed', label: 'Case Study View' },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                padding: 8,
                borderRadius: 8,
                background: 'var(--bg-tertiary, #0a0a0a)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                {item.label}
              </div>
              <div
                style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-secondary)' }}
              >
                {item.event}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Usage note */}
      <div style={{ ...card, borderLeft: '3px solid #3b82f6' }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Investor meeting tip:</strong> Pull up
          this tab to show real traction. &quot;We&apos;ve analyzed X documents, tracked Y outcomes,
          and our bias detection accuracy is Z%. The platform is actively calibrating to our pilot
          customers&apos; decision patterns.&quot;
        </p>
      </div>
    </div>
  );
}
