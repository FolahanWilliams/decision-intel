'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Video,
  Upload,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Landmark,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useMeetings } from '@/hooks/useMeetings';
import { getBiasArray, getQualityLevel, formatDateShort } from '@/lib/constants/human-audit';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  uploading: { label: 'Uploading', color: 'var(--text-muted)', bg: 'rgba(148,163,184,0.1)' },
  transcribing: {
    label: 'Transcribing',
    color: 'var(--accent-primary)',
    bg: 'rgba(249,115,22,0.1)',
  },
  analyzing: { label: 'Analyzing', color: 'var(--warning)', bg: 'rgba(245,158,11,0.1)' },
  complete: { label: 'Complete', color: 'var(--success)', bg: 'rgba(34,197,94,0.1)' },
  error: { label: 'Error', color: 'var(--error)', bg: 'rgba(239,68,68,0.1)' },
};

const MEETING_TYPE_LABELS: Record<string, string> = {
  board: 'Board',
  incident_response: 'Incident',
  vendor_review: 'Vendor',
  strategic_planning: 'Strategic',
  general: 'General',
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function MeetingsPage() {
  const [page, setPage] = useState(1);
  const { meetings, total, totalPages, isLoading } = useMeetings(page);

  const completeCount = meetings.filter(m => m.status === 'complete').length;
  const processingCount = meetings.filter(m =>
    ['uploading', 'transcribing', 'analyzing'].includes(m.status)
  ).length;

  return (
    <div
      className="container"
      style={{ paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)' }}
    >
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Meetings' }]} />

      <header className="flex items-center justify-between mb-xl animate-fade-in">
        <div>
          <div className="flex items-center gap-md mb-sm">
            <Video size={28} style={{ color: 'var(--accent-primary)' }} />
            <h1>Meeting Intelligence</h1>
          </div>
          <p className="text-muted">
            Upload meeting recordings for automatic transcription, speaker analysis, and cognitive
            auditing.
          </p>
        </div>
        <Link href="/dashboard/cognitive-audits/submit" className="btn btn-primary">
          <Upload size={16} /> Upload Meeting
        </Link>
      </header>

      {/* Summary Cards */}
      <div
        className="animate-fade-in"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-xl)',
          animationDelay: '0.1s',
        }}
      >
        <div className="card" style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{total}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Meetings</div>
        </div>
        <div className="card" style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)' }}>
            {completeCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Analyzed</div>
        </div>
        <div className="card" style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
            {processingCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Processing</div>
        </div>
      </div>

      {/* Meeting List */}
      <div className="card animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="card-header">
          <h3>Meetings</h3>
        </div>

        {isLoading ? (
          <div className="card-body" style={{ textAlign: 'center', padding: '60px' }}>
            <Loader2
              size={24}
              className="animate-spin"
              style={{ color: 'var(--accent-primary)' }}
            />
          </div>
        ) : meetings.length === 0 ? (
          <div className="card-body" style={{ textAlign: 'center', padding: '60px' }}>
            <Video size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
            <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>
              No meetings yet
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Upload a meeting recording to get started with AI-powered transcription and cognitive
              auditing.
            </div>
            <Link href="/dashboard/cognitive-audits/submit" className="btn btn-primary">
              <Upload size={14} /> Upload First Meeting
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    MEETING
                  </th>
                  <th
                    style={{
                      textAlign: 'center',
                      padding: '12px 8px',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    TYPE
                  </th>
                  <th
                    style={{
                      textAlign: 'center',
                      padding: '12px 8px',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    DURATION
                  </th>
                  <th
                    style={{
                      textAlign: 'center',
                      padding: '12px 8px',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    SPEAKERS
                  </th>
                  <th
                    style={{
                      textAlign: 'center',
                      padding: '12px 8px',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    QUALITY
                  </th>
                  <th
                    style={{
                      textAlign: 'center',
                      padding: '12px 8px',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    BIASES
                  </th>
                  <th
                    style={{
                      textAlign: 'center',
                      padding: '12px 8px',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    ACTIONS
                  </th>
                  <th
                    style={{
                      textAlign: 'center',
                      padding: '12px 8px',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    STATUS
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: '12px 16px',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    DATE
                  </th>
                </tr>
              </thead>
              <tbody>
                {meetings.map(meeting => {
                  const audit = meeting.humanDecision?.cognitiveAudit;
                  const biases = audit ? getBiasArray(audit.biasFindings) : [];
                  const quality = audit ? getQualityLevel(audit.decisionQualityScore) : null;
                  const status = STATUS_CONFIG[meeting.status] || STATUS_CONFIG.error;
                  const speakers = meeting.transcript?.speakers;
                  const speakerCount = Array.isArray(speakers)
                    ? speakers.length
                    : meeting.participants.length;
                  const isProcessing = ['uploading', 'transcribing', 'analyzing'].includes(
                    meeting.status
                  );

                  return (
                    <tr
                      key={meeting.id}
                      style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                      onClick={() => {
                        if (meeting.status === 'complete' && meeting.humanDecision?.id) {
                          window.location.href = `/dashboard/cognitive-audits/${meeting.humanDecision.id}`;
                        } else {
                          window.location.href = `/dashboard/meetings/${meeting.id}`;
                        }
                      }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>{meeting.title}</div>
                        {meeting.fileName && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {meeting.fileName}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', padding: '14px 8px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '2px 8px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '4px',
                          }}
                        >
                          {MEETING_TYPE_LABELS[meeting.meetingType] || meeting.meetingType}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', padding: '14px 8px', fontSize: '13px' }}>
                        <div className="flex items-center justify-center gap-xs">
                          <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                          {formatDuration(meeting.durationSeconds)}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', padding: '14px 8px', fontSize: '13px' }}>
                        <div className="flex items-center justify-center gap-xs">
                          <Users size={12} style={{ color: 'var(--text-muted)' }} />
                          {speakerCount}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', padding: '14px 8px' }}>
                        {quality ? (
                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: 700,
                              color: quality.color,
                            }}
                          >
                            {Math.round(audit!.decisionQualityScore)}
                          </span>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>--</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', padding: '14px 8px' }}>
                        {biases.length > 0 ? (
                          <div className="flex items-center justify-center gap-xs">
                            <AlertTriangle size={12} style={{ color: 'var(--warning)' }} />
                            <span style={{ fontSize: '13px' }}>{biases.length}</span>
                          </div>
                        ) : audit ? (
                          <CheckCircle size={14} style={{ color: 'var(--success)' }} />
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>--</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', padding: '14px 8px' }}>
                        {(() => {
                          const actions = Array.isArray(meeting.actionItems)
                            ? meeting.actionItems
                            : [];
                          const decisions = Array.isArray(meeting.keyDecisions)
                            ? meeting.keyDecisions
                            : [];
                          const total = actions.length + decisions.length;
                          if (total > 0) {
                            return (
                              <div
                                className="flex items-center justify-center gap-xs"
                                style={{ fontSize: '12px' }}
                              >
                                {actions.length > 0 && (
                                  <span className="flex items-center gap-xs" title="Action items">
                                    <ListChecks
                                      size={11}
                                      style={{ color: 'var(--accent-primary)' }}
                                    />
                                    {actions.length}
                                  </span>
                                )}
                                {decisions.length > 0 && (
                                  <span className="flex items-center gap-xs" title="Key decisions">
                                    <Landmark size={11} style={{ color: 'var(--warning)' }} />
                                    {decisions.length}
                                  </span>
                                )}
                              </div>
                            );
                          }
                          return (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>--</span>
                          );
                        })()}
                      </td>
                      <td style={{ textAlign: 'center', padding: '14px 8px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '3px 10px',
                            background: status.bg,
                            color: status.color,
                            borderRadius: '4px',
                            fontWeight: 600,
                          }}
                        >
                          {isProcessing && (
                            <Loader2
                              size={10}
                              className="animate-spin"
                              style={{
                                display: 'inline',
                                verticalAlign: 'middle',
                                marginRight: '4px',
                              }}
                            />
                          )}
                          {status.label}
                          {meeting.status === 'transcribing' &&
                            meeting.transcriptionProgress > 0 && (
                              <> ({Math.round(meeting.transcriptionProgress)}%)</>
                            )}
                        </span>
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          padding: '14px 16px',
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {formatDateShort(meeting.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-between"
            style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)' }}
          >
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Page {page} of {totalPages} ({total} meetings)
            </span>
            <div className="flex items-center gap-sm">
              <button
                className="btn btn-ghost"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                style={{ padding: '4px 8px' }}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                className="btn btn-ghost"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                style={{ padding: '4px 8px' }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
