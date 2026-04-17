'use client';

/**
 * CronControlsTab
 *
 * Founder-only UI surface for manually firing individual cron jobs and
 * the full dispatcher. Hits `/api/admin/trigger-cron?job=<name>` which
 * gates on ADMIN_EMAILS + injects the server-side CRON_SECRET.
 *
 * The job list mirrors the dispatcher's `dailyJobs` + `sundayJobs` +
 * `mondayJobs` arrays at `src/app/api/cron/dispatch/route.ts`. If you
 * add or remove a cron there, update the JOBS constant here too.
 */

import { useState } from 'react';
import { Clock, Play, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { card, sectionTitle, label } from './shared-styles';

type JobStatus = 'idle' | 'running' | 'success' | 'error';

interface JobSpec {
  id: string;
  label: string;
  description: string;
  schedule: string;
}

const JOBS: JobSpec[] = [
  {
    id: 'dispatch',
    label: 'Full dispatcher',
    description: 'Fans out to every enabled daily / day-of-week sub-cron.',
    schedule: 'Daily 00:00 UTC',
  },
  // Daily
  {
    id: 'daily-linkedin',
    label: 'Daily LinkedIn post',
    description:
      'Generates tomorrow\u2019s case-study LinkedIn post and emails it to FOUNDER_EMAIL. Short-circuits if RESEND_API_KEY or FOUNDER_EMAIL is missing.',
    schedule: 'Daily',
  },
  {
    id: 'sync-intelligence',
    label: 'Sync intelligence',
    description: 'Refreshes market intelligence signals cached for active audits.',
    schedule: 'Daily',
  },
  {
    id: 'detect-outcomes',
    label: 'Detect outcomes',
    description: 'Scans signals for auto-detected outcomes on pending analyses.',
    schedule: 'Daily',
  },
  {
    id: 'infer-graph-edges',
    label: 'Infer graph edges',
    description: 'Recomputes Decision Knowledge Graph edges from recent audits.',
    schedule: 'Daily',
  },
  {
    id: 'retry-nudges',
    label: 'Retry nudges',
    description: 'Re-sends nudges that previously failed delivery (fire-and-forget).',
    schedule: 'Daily',
  },
  {
    id: 'google-drive-sync',
    label: 'Google Drive sync',
    description:
      'Polls monitored Drive folders for new or updated files via the Changes API. Uses contentHash to skip unchanged files, 24h cooldown between re-analyses.',
    schedule: 'Daily',
  },
  // Monday
  {
    id: 'outcome-reminders',
    label: 'Outcome reminders',
    description: 'Emails users with analyses past their outcomeDueAt.',
    schedule: 'Mondays',
  },
  {
    id: 'team-profiles',
    label: 'Team profiles',
    description: 'Refreshes team-level bias profiles / calibration summaries.',
    schedule: 'Mondays',
  },
  {
    id: 'weekly-digest',
    label: 'Weekly digest',
    description: 'Sends weekly activity digest to users with that setting enabled.',
    schedule: 'Mondays',
  },
  // Sunday
  {
    id: 'learn-toxic-patterns',
    label: 'Learn toxic patterns',
    description: 'Re-runs pattern discovery across accumulated outcomes.',
    schedule: 'Sundays',
  },
  {
    id: 'recalibrate',
    label: 'Recalibrate org weights',
    description: 'Recomputes org-level 20\u00d720 interaction-matrix weights from outcomes.',
    schedule: 'Sundays',
  },
];

interface JobResult {
  status: JobStatus;
  httpStatus?: number;
  elapsedMs?: number;
  body?: unknown;
  error?: string;
  finishedAt?: string;
}

export function CronControlsTab() {
  const [results, setResults] = useState<Record<string, JobResult>>({});

  async function runJob(jobId: string) {
    setResults(prev => ({ ...prev, [jobId]: { status: 'running' } }));
    const startedAt = Date.now();
    try {
      const res = await fetch(`/api/admin/trigger-cron?job=${encodeURIComponent(jobId)}`);
      const body = await res.json().catch(() => ({ raw: 'non-JSON response' }));
      setResults(prev => ({
        ...prev,
        [jobId]: {
          status: res.ok ? 'success' : 'error',
          httpStatus: res.status,
          elapsedMs: Date.now() - startedAt,
          body,
          finishedAt: new Date().toISOString(),
        },
      }));
    } catch (err) {
      setResults(prev => ({
        ...prev,
        [jobId]: {
          status: 'error',
          elapsedMs: Date.now() - startedAt,
          error: err instanceof Error ? err.message : String(err),
          finishedAt: new Date().toISOString(),
        },
      }));
    }
  }

  return (
    <div>
      <div style={{ ...card, borderTop: '3px solid #16A34A' }}>
        <div style={label}>ADMIN CONSOLE</div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: 'var(--text-primary, #fff)',
            marginBottom: 8,
            lineHeight: 1.3,
          }}
        >
          Cron controls
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary, #b4b4bc)', lineHeight: 1.6 }}>
          Manually fire any scheduled job. Responses show the real status +{' '}
          JSON body returned by the cron handler, so you can smoke-test
          delivery paths (LinkedIn email, Drive sync, outcome reminders)
          without waiting for the scheduled run. Requires{' '}
          <code>ADMIN_EMAILS</code> + <code>CRON_SECRET</code> on Vercel.
        </p>
      </div>

      <div style={card}>
        <div style={sectionTitle}>
          <Clock size={18} /> Scheduled jobs
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {JOBS.map(job => {
            const result = results[job.id];
            const running = result?.status === 'running';
            return (
              <div
                key={job.id}
                style={{
                  border: '1px solid var(--border-primary, #222)',
                  borderRadius: 10,
                  padding: 14,
                  background: 'var(--bg-card, var(--bg-secondary, #0d0d0d))',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: 'var(--text-primary, #fff)',
                        }}
                      >
                        {job.label}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          padding: '2px 7px',
                          borderRadius: 999,
                          background: 'rgba(22, 163, 74, 0.12)',
                          color: '#16A34A',
                          border: '1px solid rgba(22, 163, 74, 0.3)',
                          fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                        }}
                      >
                        {job.schedule}
                      </span>
                      <code
                        style={{
                          fontSize: 10,
                          color: 'var(--text-muted, #71717a)',
                          background: 'transparent',
                        }}
                      >
                        /api/cron/{job.id}
                      </code>
                    </div>
                    <p
                      style={{
                        fontSize: 12.5,
                        color: 'var(--text-secondary, #b4b4bc)',
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      {job.description}
                    </p>
                  </div>
                  <button
                    onClick={() => runJob(job.id)}
                    disabled={running}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: '1px solid rgba(22, 163, 74, 0.3)',
                      background: running
                        ? 'rgba(22, 163, 74, 0.08)'
                        : 'rgba(22, 163, 74, 0.15)',
                      color: '#16A34A',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: running ? 'wait' : 'pointer',
                      transition: 'background 0.15s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {running ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : result ? (
                      <RefreshCw size={13} />
                    ) : (
                      <Play size={13} />
                    )}
                    {running ? 'Running…' : result ? 'Run again' : 'Run now'}
                  </button>
                </div>

                {result && result.status !== 'running' && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: 10,
                      borderRadius: 8,
                      background:
                        result.status === 'success'
                          ? 'rgba(22, 163, 74, 0.08)'
                          : 'rgba(220, 38, 38, 0.08)',
                      border: `1px solid ${
                        result.status === 'success'
                          ? 'rgba(22, 163, 74, 0.25)'
                          : 'rgba(220, 38, 38, 0.25)'
                      }`,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        color:
                          result.status === 'success'
                            ? '#16A34A'
                            : 'var(--severity-high, #DC2626)',
                        marginBottom: 6,
                      }}
                    >
                      {result.status === 'success' ? (
                        <CheckCircle2 size={13} />
                      ) : (
                        <XCircle size={13} />
                      )}
                      HTTP {result.httpStatus ?? '—'} · {result.elapsedMs}ms
                      {result.finishedAt && (
                        <span
                          style={{
                            marginLeft: 'auto',
                            color: 'var(--text-muted, #71717a)',
                            fontWeight: 400,
                          }}
                        >
                          {new Date(result.finishedAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    {result.error ? (
                      <pre
                        style={{
                          fontSize: 11,
                          color: 'var(--severity-high, #DC2626)',
                          margin: 0,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {result.error}
                      </pre>
                    ) : (
                      <pre
                        style={{
                          fontSize: 11,
                          color: 'var(--text-secondary, #b4b4bc)',
                          margin: 0,
                          maxHeight: 180,
                          overflow: 'auto',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                        }}
                      >
                        {JSON.stringify(result.body, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ ...card, background: 'transparent', border: 'none', padding: 0 }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted, #71717a)', lineHeight: 1.6 }}>
          Job specs mirror the dispatcher at{' '}
          <code>src/app/api/cron/dispatch/route.ts</code>. Adding or removing
          a cron there requires updating the <code>JOBS</code> array in this
          component.
        </p>
      </div>
    </div>
  );
}
