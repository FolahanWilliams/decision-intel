'use client';

import { useMemo, useState } from 'react';
import { useNudges, type NudgeSummary } from '@/hooks/useHumanDecisions';
import Link from 'next/link';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  MessageSquare,
  Users,
  Mail,
  Ticket,
  PenLine,
  Filter,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClientLogger } from '@/lib/utils/logger';

const log = createClientLogger('Nudges');

const SOURCE_LABELS: Record<string, string> = {
  slack: 'Slack',
  meeting_transcript: 'Meeting',
  email: 'Email',
  jira: 'Jira',
  manual: 'Manual',
};

const SOURCE_ICONS: Record<string, typeof MessageSquare> = {
  slack: MessageSquare,
  meeting_transcript: Users,
  email: Mail,
  jira: Ticket,
  manual: PenLine,
};

const NUDGE_TYPE_LABELS: Record<string, string> = {
  anchor_alert: 'Anchor Alert',
  dissent_prompt: 'Dissent Prompt',
  base_rate_reminder: 'Base Rate Reminder',
  pre_mortem_trigger: 'Pre-Mortem Trigger',
  noise_check: 'Noise Check',
};

const SEVERITY_STYLES: Record<string, { color: string; bg: string }> = {
  critical: { color: 'var(--error)', bg: 'rgba(239, 68, 68, 0.1)' },
  warning: { color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.1)' },
  info: { color: 'var(--accent-primary)', bg: 'rgba(99, 102, 241, 0.1)' },
};

export default function NudgesPage() {
  const [filterUnacknowledged, setFilterUnacknowledged] = useState(false);
  // Always fetch all nudges for stats; filter display separately
  const { nudges: allNudges, isLoading: loading, mutate } = useNudges(false, 100);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);

  const nudges = useMemo(() => {
    if (!filterUnacknowledged) return allNudges;
    return allNudges.filter(n => !n.acknowledgedAt);
  }, [allNudges, filterUnacknowledged]);

  const stats = useMemo(() => {
    const total = allNudges.length;
    const unacked = allNudges.filter(n => !n.acknowledgedAt).length;
    const helpful = allNudges.filter(n => n.wasHelpful === true).length;
    const notHelpful = allNudges.filter(n => n.wasHelpful === false).length;
    return { total, unacked, helpful, notHelpful };
  }, [allNudges]);

  const handleAcknowledge = async (nudgeId: string, wasHelpful: boolean) => {
    setAcknowledging(nudgeId);
    try {
      const res = await fetch('/api/nudges', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nudgeId, wasHelpful }),
      });
      if (res.ok) await mutate();
    } catch (err) {
      log.error('Acknowledge failed:', err);
    } finally {
      setAcknowledging(null);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)' }}>
        <div className="grid grid-4 mb-xl gap-md">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="card-body text-center p-md">
                <div className="h-3 w-24 bg-white/10 mx-auto mb-sm" />
                <div className="h-10 w-16 bg-white/10 mx-auto mb-sm" />
                <div className="h-3 w-16 bg-white/10 mx-auto" />
              </div>
            </div>
          ))}
        </div>
        <div className="card animate-pulse">
          <div className="card-header"><div className="h-4 w-40 bg-white/10" /></div>
          <div className="card-body" style={{ padding: 0 }}>
            {[0, 1, 2].map(i => (
              <div key={i} className="flex items-center justify-between p-lg" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-lg">
                  <div className="w-10 h-10 bg-white/10" />
                  <div>
                    <div className="h-4 w-64 bg-white/10 mb-sm" />
                    <div className="h-3 w-32 bg-white/10" />
                  </div>
                </div>
                <div className="flex items-center gap-md">
                  <div className="h-8 w-20 bg-white/10" />
                  <div className="h-8 w-20 bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)' }}>
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Nudges' }]} />

      <header className="mb-xl">
        <div className="flex items-center gap-md mb-sm">
          <Bell size={28} style={{ color: 'var(--warning)' }} />
          <h1>Behavioral Nudges</h1>
        </div>
        <p className="text-muted">Thaler-inspired decision nudges generated from cognitive audits</p>
      </header>

      {/* Stats */}
      <ErrorBoundary sectionName="Nudge Stats">
        <div className="grid grid-4 mb-xl gap-md">
          <div className="card animate-fade-in">
            <div className="card-body text-center p-md">
              <div className="text-xs text-muted mb-sm font-medium">Total Nudges</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                {stats.total}
              </div>
              <div className="text-xs text-muted">Generated</div>
            </div>
          </div>
          <div className="card animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="card-body text-center p-md">
              <div className="text-xs text-muted mb-sm font-medium">Unacknowledged</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: stats.unacked > 0 ? 'var(--warning)' : 'var(--success)' }}>
                {stats.unacked}
              </div>
              <div className="text-xs text-muted">Pending Review</div>
            </div>
          </div>
          <div className="card animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="card-body text-center p-md">
              <div className="text-xs text-muted mb-sm font-medium">Helpful</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--success)' }}>
                {stats.helpful}
              </div>
              <div className="text-xs text-muted">Acknowledged as useful</div>
            </div>
          </div>
          <div className="card animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="card-body text-center p-md">
              <div className="text-xs text-muted mb-sm font-medium">Not Relevant</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                {stats.notHelpful}
              </div>
              <div className="text-xs text-muted">Dismissed</div>
            </div>
          </div>
        </div>
      </ErrorBoundary>

      {/* Filter Toggle */}
      <div className="flex items-center gap-md mb-lg">
        <button
          onClick={() => setFilterUnacknowledged(!filterUnacknowledged)}
          className={`btn ${filterUnacknowledged ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '13px' }}
        >
          <Filter size={14} />
          {filterUnacknowledged ? 'Showing Unacknowledged Only' : 'Show All Nudges'}
        </button>
      </div>

      {/* Nudge List */}
      <ErrorBoundary sectionName="Nudge List">
        <div className="card animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="card-header">
            <h3 className="flex items-center gap-sm"><Bell size={18} /> Decision Nudges</h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {nudges.length === 0 ? (
              <div className="flex flex-col items-center gap-md" style={{ padding: 'var(--spacing-2xl)' }}>
                <AlertCircle size={48} style={{ color: 'var(--text-muted)' }} />
                <p className="text-muted text-center">
                  {filterUnacknowledged
                    ? 'All nudges have been acknowledged!'
                    : 'No nudges generated yet. Submit human decisions to receive behavioral nudges.'}
                </p>
              </div>
            ) : (
              nudges.map((nudge: NudgeSummary, idx: number) => {
                const severity = SEVERITY_STYLES[nudge.severity] || SEVERITY_STYLES.info;
                const SourceIcon = SOURCE_ICONS[nudge.humanDecision.source] || PenLine;
                const isAcking = acknowledging === nudge.id;

                return (
                  <div
                    key={nudge.id}
                    style={{
                      padding: 'var(--spacing-lg)',
                      borderBottom: idx < nudges.length - 1 ? '1px solid var(--border-color)' : 'none',
                      background: nudge.acknowledgedAt ? 'transparent' : severity.bg,
                    }}
                  >
                    <div className="flex items-start justify-between gap-lg">
                      <div className="flex items-start gap-md" style={{ flex: 1 }}>
                        <div style={{
                          width: 40, height: 40, minWidth: 40,
                          background: 'var(--bg-primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <AlertTriangle size={20} style={{ color: severity.color }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="flex items-center gap-md mb-xs">
                            <span style={{ fontWeight: 600, color: severity.color }}>
                              {NUDGE_TYPE_LABELS[nudge.nudgeType] || nudge.nudgeType}
                            </span>
                            <span style={{
                              fontSize: '10px', padding: '2px 8px',
                              background: severity.color, color: '#fff', fontWeight: 600,
                            }}>
                              {nudge.severity.toUpperCase()}
                            </span>
                            {nudge.acknowledgedAt && (
                              <span className="flex items-center gap-xs text-xs" style={{ color: 'var(--success)' }}>
                                <CheckCircle size={12} /> Acknowledged
                              </span>
                            )}
                          </div>
                          <p style={{ margin: '4px 0 8px', lineHeight: 1.5, fontSize: '14px' }}>
                            {nudge.message}
                          </p>
                          <div className="flex items-center gap-md text-xs text-muted">
                            <span className="flex items-center gap-xs">
                              <SourceIcon size={12} />
                              {SOURCE_LABELS[nudge.humanDecision.source] || nudge.humanDecision.source}
                              {nudge.humanDecision.channel && ` — ${nudge.humanDecision.channel}`}
                            </span>
                            <span>{new Date(nudge.createdAt).toLocaleDateString()}</span>
                            {nudge.triggerReason && (
                              <span style={{ color: 'var(--text-muted)' }}>{nudge.triggerReason}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-sm" style={{ minWidth: 'fit-content' }}>
                        {!nudge.acknowledgedAt ? (
                          <>
                            <button
                              onClick={() => handleAcknowledge(nudge.id, true)}
                              className="btn btn-ghost"
                              style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--success)' }}
                              disabled={isAcking}
                              title="Helpful"
                            >
                              {isAcking ? <Loader2 size={14} className="animate-spin" /> : <><ThumbsUp size={14} /> Helpful</>}
                            </button>
                            <button
                              onClick={() => handleAcknowledge(nudge.id, false)}
                              className="btn btn-ghost"
                              style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--text-muted)' }}
                              disabled={isAcking}
                              title="Not relevant"
                            >
                              <ThumbsDown size={14} /> Dismiss
                            </button>
                          </>
                        ) : (
                          nudge.wasHelpful !== null && (
                            <span className="flex items-center gap-xs text-xs" style={{
                              color: nudge.wasHelpful ? 'var(--success)' : 'var(--text-muted)',
                            }}>
                              {nudge.wasHelpful ? <ThumbsUp size={12} /> : <ThumbsDown size={12} />}
                              {nudge.wasHelpful ? 'Helpful' : 'Dismissed'}
                            </span>
                          )
                        )}
                        <Link
                          href={`/dashboard/cognitive-audits/${nudge.humanDecision.id}`}
                          className="btn btn-secondary"
                          style={{ fontSize: '11px', padding: '4px 10px' }}
                        >
                          View Audit
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
}
