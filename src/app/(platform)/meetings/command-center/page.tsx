'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import {
  BarChart3,
  Users,
  Clock,
  AlertTriangle,
  Shield,
  Brain,
  MessageSquare,
  Landmark,
  ListChecks,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Upload,
  Activity,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useMeetings, type MeetingSummary } from '@/hooks/useMeetings';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  });

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  uploading: { label: 'Uploading', color: 'var(--text-muted)', bg: 'rgba(148,163,184,0.12)' },
  transcribing: {
    label: 'Transcribing',
    color: 'var(--accent-primary)',
    bg: 'rgba(249,115,22,0.12)',
  },
  analyzing: { label: 'Analyzing', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  complete: { label: 'Complete', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  error: { label: 'Error', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

function getScoreColor(score: number): string {
  if (score >= 0.7) return '#22c55e';
  if (score >= 0.4) return '#f59e0b';
  return '#ef4444';
}

// ─── Sub-Components ────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  subtitle,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--spacing-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-sm)',
      }}
    >
      <div className="flex items-center gap-sm">
        <span style={{ color: color || 'var(--accent-primary)' }}>{icon}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{label}</span>
      </div>
      <span
        style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          color: color || 'var(--text-primary)',
          lineHeight: 1.2,
        }}
      >
        {value}
      </span>
      {subtitle && (
        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{subtitle}</span>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.uploading;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 10px',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
      }}
    >
      {status === 'analyzing' || status === 'transcribing' || status === 'uploading' ? (
        <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
      ) : null}
      {cfg.label}
    </span>
  );
}

function MiniGauge({ value, label, max = 1 }: { value: number; label: string; max?: number }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const color = getScoreColor(value / max);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 80 }}>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{label}</span>
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: 'rgba(148,163,184,0.15)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
            borderRadius: 3,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color }}>
        {(value * (max === 1 ? 100 : 1)).toFixed(0)}
        {max === 1 ? '%' : ''}
      </span>
    </div>
  );
}

function SpeakerBar({ speakers }: { speakers: { name: string; speakTimeMs: number }[] }) {
  const total = speakers.reduce((s, sp) => s + sp.speakTimeMs, 0);
  if (total === 0) return null;
  const colors = ['#6366f1', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Speaker Balance</span>
      <div
        style={{
          display: 'flex',
          height: 8,
          borderRadius: 4,
          overflow: 'hidden',
          background: 'rgba(148,163,184,0.1)',
        }}
      >
        {speakers.map((sp, i) => {
          const pct = (sp.speakTimeMs / total) * 100;
          return (
            <div
              key={sp.name}
              title={`${sp.name}: ${pct.toFixed(0)}%`}
              style={{
                width: `${pct}%`,
                background: colors[i % colors.length],
                minWidth: pct > 0 ? 2 : 0,
              }}
            />
          );
        })}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {speakers.slice(0, 4).map((sp, i) => (
          <span
            key={sp.name}
            style={{
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                background: colors[i % colors.length],
                display: 'inline-block',
              }}
            />
            {sp.name}
          </span>
        ))}
        {speakers.length > 4 && (
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            +{speakers.length - 4} more
          </span>
        )}
      </div>
    </div>
  );
}

function MeetingCard({ meeting }: { meeting: MeetingSummary }) {
  const hasAudit = meeting.humanDecision?.cognitiveAudit;
  const hasSpeakers = meeting.transcript?.speakers && meeting.transcript.speakers.length > 0;
  const keyDecisionCount = meeting.keyDecisions?.length ?? 0;

  return (
    <Link
      href={`/dashboard/meetings/${meeting.id}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--spacing-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-sm)',
          cursor: 'pointer',
          transition: 'border-color 0.2s ease, transform 0.15s ease',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent-primary)';
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--glass-border)';
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        }}
      >
        {/* Top row: title + status */}
        <div className="flex items-center justify-between">
          <h3
            style={{
              margin: 0,
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '70%',
            }}
          >
            {meeting.title}
          </h3>
          <StatusBadge status={meeting.status} />
        </div>

        {/* Meta row */}
        <div
          className="flex items-center gap-md"
          style={{ fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}
        >
          <span className="flex items-center gap-sm">
            <Users size={13} /> {meeting.participants.length} participant
            {meeting.participants.length !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-sm">
            <Clock size={13} /> {formatDuration(meeting.durationSeconds)}
          </span>
          <span>{new Date(meeting.createdAt).toLocaleDateString()}</span>
          {keyDecisionCount > 0 && (
            <span
              className="flex items-center gap-sm"
              style={{
                background: 'rgba(99,102,241,0.12)',
                color: '#6366f1',
                padding: '1px 8px',
                borderRadius: '9999px',
                fontWeight: 600,
                fontSize: '0.72rem',
              }}
            >
              <Landmark size={11} /> {keyDecisionCount} decision{keyDecisionCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Intelligence row */}
        {(hasAudit || hasSpeakers) && (
          <div
            style={{
              display: 'flex',
              gap: 'var(--spacing-md)',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              marginTop: '4px',
              paddingTop: 'var(--spacing-sm)',
              borderTop: '1px solid var(--glass-border)',
            }}
          >
            {hasAudit && (
              <>
                <MiniGauge
                  value={meeting.humanDecision!.cognitiveAudit!.decisionQualityScore / 100}
                  label="Decision Quality"
                />
                <MiniGauge
                  value={meeting.humanDecision!.cognitiveAudit!.noiseScore / 100}
                  label="Noise"
                />
              </>
            )}
            {hasSpeakers && <SpeakerBar speakers={meeting.transcript!.speakers} />}
          </div>
        )}
      </div>
    </Link>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function MeetingCommandCenterPage() {
  const [page, setPage] = useState(1);
  const { meetings, total, totalPages, isLoading, error, mutate } = useMeetings(page);

  // Fetch orgId from /api/team
  const [orgId, setOrgId] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/team')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!cancelled && data) {
          setOrgId(data?.orgId || data?.organization?.id || null);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Team dynamics
  const { data: teamData, isLoading: teamLoading } = useSWR<{
    snapshot: {
      totalMeetingsAnalyzed: number;
      speakers: {
        name: string;
        meetingsAnalyzed: number;
        avgDominance: number;
        avgDissent: number;
      }[];
      dominantSpeakers: string[];
      dissenters: string[];
      cognitiveDiversityScore: number;
      redFlags: string[];
    };
  }>(orgId ? `/api/meetings/speakers?orgId=${orgId}` : null, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  const snapshot = teamData?.snapshot;

  return (
    <ErrorBoundary sectionName="Meeting Command Center">
      <div
        style={{
          padding: 'var(--spacing-xl)',
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <header
          className="flex items-center justify-between"
          style={{ marginBottom: 'var(--spacing-xl)' }}
        >
          <div>
            <div className="flex items-center gap-md" style={{ marginBottom: 'var(--spacing-sm)' }}>
              <BarChart3 size={28} style={{ color: 'var(--accent-primary)' }} />
              <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>Meeting Command Center</h1>
            </div>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {total > 0
                ? `${total} meeting${total !== 1 ? 's' : ''} tracked`
                : 'Real-time meeting intelligence and team dynamics'}
            </p>
          </div>
          <Link
            href="/dashboard/cognitive-audits/submit"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-primary)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.85rem',
              textDecoration: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Upload size={15} /> Upload Recording
          </Link>
        </header>

        {/* ── Team Health Overview ────────────────────────────────────────────── */}
        <section style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h2
            className="flex items-center gap-sm"
            style={{
              margin: 0,
              marginBottom: 'var(--spacing-md)',
              fontSize: '1.1rem',
              color: 'var(--text-secondary)',
              fontWeight: 600,
            }}
          >
            <Activity size={18} /> Team Health Overview
          </h2>

          {teamLoading && !snapshot && (
            <div
              className="flex items-center gap-sm"
              style={{ color: 'var(--text-muted)', padding: 'var(--spacing-md)' }}
            >
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading team
              dynamics...
            </div>
          )}

          {snapshot && (
            <>
              <div className="grid grid-4" style={{ gap: 'var(--spacing-md)' }}>
                <StatCard
                  icon={<MessageSquare size={18} />}
                  label="Meetings Analyzed"
                  value={snapshot.totalMeetingsAnalyzed}
                />
                <StatCard
                  icon={<Brain size={18} />}
                  label="Cognitive Diversity"
                  value={`${(snapshot.cognitiveDiversityScore * 100).toFixed(0)}%`}
                  color={getScoreColor(snapshot.cognitiveDiversityScore)}
                  subtitle="Higher is better"
                />
                <StatCard
                  icon={<Shield size={18} />}
                  label="Dominant Speakers"
                  value={snapshot.dominantSpeakers.length}
                  subtitle={
                    snapshot.dominantSpeakers.length > 0
                      ? snapshot.dominantSpeakers.slice(0, 3).join(', ')
                      : 'Well balanced'
                  }
                  color={snapshot.dominantSpeakers.length > 2 ? '#f59e0b' : undefined}
                />
                <StatCard
                  icon={<Users size={18} />}
                  label="Active Dissenters"
                  value={snapshot.dissenters.length}
                  subtitle={
                    snapshot.dissenters.length > 0
                      ? snapshot.dissenters.slice(0, 3).join(', ')
                      : 'No frequent dissenters'
                  }
                />
              </div>

              {/* Red flags */}
              {snapshot.redFlags.length > 0 && (
                <div
                  style={{
                    marginTop: 'var(--spacing-md)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--spacing-sm)',
                  }}
                >
                  {snapshot.redFlags.map((flag, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-sm"
                      style={{
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: '#ef4444',
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.2)',
                      }}
                    >
                      <AlertTriangle size={12} /> {flag}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}

          {!teamLoading && !snapshot && orgId && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No team dynamics data available yet. Analyze meetings to build team insights.
            </p>
          )}
        </section>

        {/* ── Recent Meetings ────────────────────────────────────────────────── */}
        <section>
          <div
            className="flex items-center justify-between"
            style={{ marginBottom: 'var(--spacing-md)' }}
          >
            <h2
              className="flex items-center gap-sm"
              style={{
                margin: 0,
                fontSize: '1.1rem',
                color: 'var(--text-secondary)',
                fontWeight: 600,
              }}
            >
              <ListChecks size={18} /> Recent Meetings
            </h2>
            <button
              onClick={() => mutate()}
              style={{
                background: 'transparent',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 10px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Refresh
            </button>
          </div>

          {/* Loading state */}
          {isLoading && meetings.length === 0 && (
            <div
              className="flex items-center gap-sm"
              style={{
                justifyContent: 'center',
                padding: 'var(--spacing-xl)',
                color: 'var(--text-muted)',
              }}
            >
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Loading
              meetings...
            </div>
          )}

          {/* Error state */}
          {error && (
            <div
              className="flex items-center gap-sm"
              style={{
                padding: 'var(--spacing-md)',
                color: '#ef4444',
                background: 'rgba(239,68,68,0.08)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
              }}
            >
              <AlertTriangle size={16} /> Failed to load meetings. Please try again.
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && meetings.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: 'var(--spacing-xl) var(--spacing-md)',
                background: 'var(--bg-secondary)',
                border: '1px dashed var(--glass-border)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <MessageSquare
                size={40}
                style={{ color: 'var(--text-muted)', marginBottom: 'var(--spacing-sm)' }}
              />
              <p style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 4 }}>
                No meetings yet
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                Upload a meeting recording to get started with transcription, speaker analysis, and
                cognitive auditing.
              </p>
            </div>
          )}

          {/* Meeting cards */}
          {meetings.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              {meetings.map(meeting => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              className="flex items-center justify-between"
              style={{
                marginTop: 'var(--spacing-md)',
                padding: 'var(--spacing-sm) 0',
              }}
            >
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-sm">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 10px',
                    cursor: page <= 1 ? 'not-allowed' : 'pointer',
                    opacity: page <= 1 ? 0.4 : 1,
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 10px',
                    cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                    opacity: page >= totalPages ? 0.4 : 1,
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </ErrorBoundary>
  );
}
