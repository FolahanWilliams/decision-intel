'use client';

import { useEffect, useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  ArrowLeft,
  TrendingUp,
  Clock,
  Award,
  Fingerprint,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { formatBiasName } from '@/lib/utils/labels';

/**
 * Person-centric drill-down view (M9.2 — Decision Graph Bloomberg-level).
 *
 * Loaded when a user clicks a person node in the decision graph. Shows:
 *   - Canonical name + decision count + avg score
 *   - Outcome distribution (success / partial / failure / pending)
 *   - Success rate over resolved decisions
 *   - Bias fingerprint (top 5 by frequency)
 *   - Timeline of the person's 20 most recent decisions
 *
 * This is the first surface that turns the "Team Cognitive Profile"
 * marketing claim into a real artifact. Previously the data existed
 * in the graph but had no dedicated UI.
 */

interface PersonProfile {
  canonicalName: string;
  decisionCount: number;
  outcomeCounts: {
    success: number;
    partial_success: number;
    failure: number;
    too_early: number;
    pending: number;
  };
  successRate: number | null;
  biasFingerprint: Array<{ biasType: string; count: number }>;
  recentDecisions: Array<{
    analysisId: string;
    filename: string;
    overallScore: number;
    outcome: string | null;
    createdAt: string;
    topBiases: string[];
  }>;
  avgScore: number | null;
}

function outcomeColor(outcome: string | null): string {
  if (!outcome) return '#71717a';
  if (outcome === 'success') return '#22c55e';
  if (outcome === 'partial_success') return '#eab308';
  if (outcome === 'failure') return '#ef4444';
  if (outcome === 'too_early') return '#60a5fa';
  return '#71717a';
}

function titleCase(s: string): string {
  return s
    .split(/[\s_]+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function PersonProfilePage({
  params,
}: {
  params: Promise<{ encodedName: string }>;
}) {
  const { encodedName } = use(params);
  const searchParams = useSearchParams();
  const orgIdParam = searchParams.get('orgId');

  const [profile, setProfile] = useState<PersonProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(orgIdParam);

  // If no orgId in the URL, resolve the user's primary org first
  useEffect(() => {
    if (orgIdParam) return;
    (async () => {
      try {
        const res = await fetch('/api/team');
        if (!res.ok) return;
        // /api/team returns { organization: { id, ... }, role } — not { orgId }
        // (BUG-3 fix: was casting to { orgId?: string } which always produced undefined)
        const data = (await res.json()) as { organization?: { id: string } | null };
        if (data.organization?.id) setOrgId(data.organization.id);
      } catch {
        // fall through — profile fetch will surface the error
      }
    })();
  }, [orgIdParam]);

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/decision-graph/person/${encodedName}?orgId=${encodeURIComponent(orgId)}`
        );
        if (cancelled) return;
        if (res.status === 404) {
          setError('This person is not in your organization\u2019s decision graph yet.');
          setProfile(null);
          return;
        }
        if (!res.ok) {
          setError('Failed to load person profile.');
          setProfile(null);
          return;
        }
        const data = (await res.json()) as { profile: PersonProfile };
        setProfile(data.profile);
      } catch {
        if (!cancelled) setError('Network error loading person profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [encodedName, orgId]);

  const canonicalName = (() => {
    try {
      return decodeURIComponent(encodedName);
    } catch {
      return encodedName;
    }
  })();

  return (
    <ErrorBoundary sectionName="Person Profile">
      <div className="container" style={{ paddingTop: 'var(--spacing-2xl)' }}>
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Decision Graph', href: '/dashboard/decision-graph' },
            { label: titleCase(canonicalName) },
          ]}
        />

        <div className="mb-lg">
          <Link
            href="/dashboard/decision-graph"
            className="flex items-center gap-xs text-xs text-muted"
            style={{ textDecoration: 'none' }}
          >
            <ArrowLeft size={12} />
            Back to graph
          </Link>
        </div>

        <header className="mb-lg flex items-center gap-md">
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <User size={28} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{titleCase(canonicalName)}</h1>
            <p className="text-muted text-sm" style={{ margin: 0 }}>
              {profile
                ? `${profile.decisionCount} decision${profile.decisionCount === 1 ? '' : 's'} in this organization`
                : ' '}
            </p>
          </div>
        </header>

        {loading && (
          <div className="card" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
            <Loader2
              size={24}
              className="animate-spin"
              style={{ margin: '0 auto', color: 'var(--text-muted)' }}
            />
            <p className="text-sm text-muted" style={{ marginTop: 12 }}>
              Building cognitive profile\u2026
            </p>
          </div>
        )}

        {error && !loading && (
          <div
            className="card"
            style={{
              padding: 'var(--spacing-xl)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              background: 'rgba(239, 68, 68, 0.04)',
            }}
          >
            <div className="flex items-center gap-sm">
              <AlertTriangle size={16} style={{ color: 'var(--error)' }} />
              <span style={{ color: 'var(--text-primary)' }}>{error}</span>
            </div>
          </div>
        )}

        {profile && !loading && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
              marginBottom: 'var(--spacing-lg)',
            }}
          >
            <StatCard
              icon={<Award size={16} style={{ color: '#a78bfa' }} />}
              label="Decisions"
              value={profile.decisionCount.toString()}
            />
            <StatCard
              icon={<TrendingUp size={16} style={{ color: '#22c55e' }} />}
              label="Success Rate"
              value={
                profile.successRate !== null
                  ? `${Math.round(profile.successRate * 100)}%`
                  : '\u2014'
              }
              sub={
                profile.successRate !== null
                  ? `${profile.outcomeCounts.success + profile.outcomeCounts.partial_success}/${profile.outcomeCounts.success + profile.outcomeCounts.partial_success + profile.outcomeCounts.failure} resolved`
                  : 'No resolved outcomes yet'
              }
            />
            <StatCard
              icon={<Clock size={16} style={{ color: '#60a5fa' }} />}
              label="Avg Score"
              value={profile.avgScore !== null ? `${profile.avgScore}` : '\u2014'}
              sub="/ 100"
            />
            <StatCard
              icon={<Fingerprint size={16} style={{ color: '#f472b6' }} />}
              label="Dominant Bias"
              value={
                profile.biasFingerprint[0]
                  ? formatBiasName(profile.biasFingerprint[0].biasType)
                  : '\u2014'
              }
              sub={
                profile.biasFingerprint[0]
                  ? `Detected ${profile.biasFingerprint[0].count}\u00d7`
                  : 'No bias patterns'
              }
            />
          </div>
        )}

        {profile && !loading && profile.biasFingerprint.length > 0 && (
          <div className="card mb-lg">
            <div className="card-header">
              <h3 className="text-sm font-semibold">Bias Fingerprint</h3>
              <span className="text-xs text-muted">
                Top {profile.biasFingerprint.length} bias types across all of{' '}
                {titleCase(canonicalName)}\u2019s decisions
              </span>
            </div>
            <div
              className="card-body"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                padding: 'var(--spacing-md)',
              }}
            >
              {profile.biasFingerprint.map(b => {
                const maxCount = profile.biasFingerprint[0].count;
                const pct = Math.round((b.count / maxCount) * 100);
                return (
                  <div key={b.biasType} className="flex items-center gap-sm">
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        minWidth: 160,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {formatBiasName(b.biasType)}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 8,
                        background: 'rgba(255, 255, 255, 0.04)',
                        borderRadius: 4,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        minWidth: 30,
                        textAlign: 'right',
                      }}
                    >
                      {b.count}\u00d7
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {profile && !loading && profile.recentDecisions.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold">Recent Decisions</h3>
              <span className="text-xs text-muted">
                Most recent {profile.recentDecisions.length} decisions, newest first
              </span>
            </div>
            <div
              className="card-body"
              style={{ padding: 0, display: 'flex', flexDirection: 'column' }}
            >
              {profile.recentDecisions.map((d, i) => {
                const color = outcomeColor(d.outcome);
                return (
                  <Link
                    key={d.analysisId}
                    href={`/documents/${d.analysisId}`}
                    className="text-xs"
                    style={{
                      textDecoration: 'none',
                      color: 'inherit',
                      padding: '10px var(--spacing-lg)',
                      borderTop: i === 0 ? 'none' : '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      borderLeft: `3px solid ${color}`,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {d.filename}
                      </div>
                      <div
                        className="flex items-center gap-sm"
                        style={{ marginTop: 2, flexWrap: 'wrap' }}
                      >
                        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                          {new Date(d.createdAt).toLocaleDateString()}
                        </span>
                        {d.topBiases.slice(0, 2).map(b => (
                          <span
                            key={b}
                            style={{
                              fontSize: 9,
                              padding: '1px 5px',
                              borderRadius: 3,
                              background: 'rgba(255, 255, 255, 0.04)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {formatBiasName(b)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color:
                          d.overallScore >= 70
                            ? '#22c55e'
                            : d.overallScore >= 40
                              ? '#f59e0b'
                              : '#ef4444',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {Math.round(d.overallScore)}
                    </div>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: `${color}15`,
                        color,
                        border: `1px solid ${color}30`,
                        minWidth: 62,
                        textAlign: 'center',
                      }}
                    >
                      {d.outcome
                        ? d.outcome === 'partial_success'
                          ? 'Partial'
                          : titleCase(d.outcome)
                        : 'Pending'}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div
      className="card"
      style={{ padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: 6 }}
    >
      <div className="flex items-center gap-xs text-xs text-muted">
        {icon}
        <span
          style={{
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: 600,
            fontSize: 10,
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}
