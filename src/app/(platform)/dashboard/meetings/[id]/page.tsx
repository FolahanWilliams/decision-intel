'use client';

import { use, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Video,
  ArrowLeft,
  Loader2,
  Clock,
  Users,
  MessageSquare,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useMeeting, type TranscriptSegment, type MeetingSpeaker } from '@/hooks/useMeetings';
import { getQualityLevel, getBiasArray } from '@/lib/constants/human-audit';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Loader2 }> = {
  uploading: { label: 'Uploading recording...', color: 'var(--text-muted)', icon: Loader2 },
  transcribing: { label: 'Transcribing audio...', color: 'var(--accent-primary)', icon: Loader2 },
  analyzing: { label: 'Running cognitive audit...', color: 'var(--warning)', icon: Loader2 },
  complete: { label: 'Analysis complete', color: 'var(--success)', icon: CheckCircle },
  error: { label: 'Processing failed', color: 'var(--error)', icon: AlertTriangle },
};

const SPEAKER_COLORS = [
  '#6366f1', '#ec4899', '#22c55e', '#f59e0b', '#06b6d4',
  '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#a855f7',
];

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const sec = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  return `${m}m ${sec}s`;
}

export default function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { meeting, isLoading } = useMeeting(id);
  const [activeTab, setActiveTab] = useState<'transcript' | 'speakers' | 'analysis'>('transcript');
  const [activeSpeakerFilter, setActiveSpeakerFilter] = useState<string | null>(null);

  const segments: TranscriptSegment[] = useMemo(() => {
    if (!meeting?.transcript?.segments) return [];
    return Array.isArray(meeting.transcript.segments) ? meeting.transcript.segments : [];
  }, [meeting?.transcript?.segments]);

  const speakers: MeetingSpeaker[] = useMemo(() => {
    if (!meeting?.transcript?.speakers) return [];
    return Array.isArray(meeting.transcript.speakers) ? meeting.transcript.speakers : [];
  }, [meeting?.transcript?.speakers]);

  const speakerColorMap = useMemo(() => {
    const map = new Map<string, string>();
    speakers.forEach((s, i) => map.set(s.name, SPEAKER_COLORS[i % SPEAKER_COLORS.length]));
    return map;
  }, [speakers]);

  const filteredSegments = useMemo(() => {
    if (!activeSpeakerFilter) return segments;
    return segments.filter(s => s.speaker === activeSpeakerFilter);
  }, [segments, activeSpeakerFilter]);

  const audit = meeting?.humanDecision?.cognitiveAudit;
  const biases = audit ? getBiasArray<{ biasType: string; severity: string }>(audit.biasFindings) : [];
  const quality = audit ? getQualityLevel(audit.decisionQualityScore) : null;

  if (isLoading) {
    return (
      <div className="container" style={{ paddingTop: 'var(--spacing-2xl)', textAlign: 'center' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="container" style={{ paddingTop: 'var(--spacing-2xl)' }}>
        <p>Meeting not found.</p>
        <Link href="/dashboard/meetings" className="btn btn-secondary mt-md">
          <ArrowLeft size={14} /> Back to Meetings
        </Link>
      </div>
    );
  }

  const status = STATUS_CONFIG[meeting.status] || STATUS_CONFIG.error;
  const isProcessing = ['uploading', 'transcribing', 'analyzing'].includes(meeting.status);

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)' }}>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Meetings', href: '/dashboard/meetings' },
          { label: meeting.title },
        ]}
      />

      {/* Header */}
      <header className="mb-xl animate-fade-in">
        <div className="flex items-center gap-md mb-sm">
          <Video size={28} style={{ color: 'var(--accent-primary)' }} />
          <h1>{meeting.title}</h1>
        </div>
        <div className="flex items-center gap-lg text-muted" style={{ fontSize: '13px' }}>
          <span className="flex items-center gap-xs">
            <Clock size={14} /> {formatDuration(meeting.durationSeconds)}
          </span>
          <span className="flex items-center gap-xs">
            <Users size={14} /> {speakers.length || meeting.participants.length} speakers
          </span>
          <span className="flex items-center gap-xs">
            <MessageSquare size={14} /> {segments.length} segments
          </span>
          {meeting.fileName && (
            <span>{meeting.fileName}</span>
          )}
        </div>
      </header>

      {/* Processing Status Banner */}
      {isProcessing && (
        <div
          className="card animate-fade-in mb-lg"
          style={{
            padding: 'var(--spacing-lg)',
            borderLeft: `3px solid ${status.color}`,
            background: `${status.color}10`,
          }}
        >
          <div className="flex items-center gap-md">
            <Loader2 size={20} className="animate-spin" style={{ color: status.color }} />
            <div>
              <div style={{ fontWeight: 600, color: status.color }}>{status.label}</div>
              {meeting.status === 'transcribing' && meeting.transcriptionProgress > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{
                    height: '4px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    width: '300px',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${meeting.transcriptionProgress}%`,
                      background: status.color,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {Math.round(meeting.transcriptionProgress)}% complete
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {meeting.status === 'error' && (
        <div
          className="card animate-fade-in mb-lg"
          style={{ padding: 'var(--spacing-lg)', borderLeft: '3px solid var(--error)', background: 'rgba(239,68,68,0.05)' }}
        >
          <div style={{ fontWeight: 600, color: 'var(--error)', marginBottom: '4px' }}>Processing Failed</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {meeting.errorMessage || 'An unknown error occurred during processing.'}
          </div>
        </div>
      )}

      {/* Quick Stats (when analysis is complete) */}
      {audit && (
        <div
          className="animate-fade-in"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-xl)',
          }}
        >
          <div className="card" style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: quality?.color }}>
              {Math.round(audit.decisionQualityScore)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Decision Quality</div>
          </div>
          <div className="card" style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{biases.length}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Biases Detected</div>
          </div>
          <div className="card" style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{Math.round(audit.noiseScore)}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Noise Score</div>
          </div>
          {meeting.humanDecision?.id && (
            <Link
              href={`/dashboard/cognitive-audits/${meeting.humanDecision.id}`}
              className="card"
              style={{
                padding: 'var(--spacing-lg)',
                textAlign: 'center',
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              <ExternalLink size={20} style={{ color: 'var(--accent-primary)' }} />
              <div style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                Full Audit
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Tabs */}
      {meeting.transcript && (
        <div className="card animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="card-header" style={{ gap: 'var(--spacing-md)' }}>
            {[
              { key: 'transcript' as const, label: 'Transcript', icon: MessageSquare },
              { key: 'speakers' as const, label: 'Speakers', icon: Users },
              { key: 'analysis' as const, label: 'Summary', icon: BarChart3 },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-xs"
                style={{
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: activeTab === tab.key ? 700 : 500,
                  background: activeTab === tab.key ? 'var(--accent-primary)' : 'transparent',
                  color: activeTab === tab.key ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                <tab.icon size={13} /> {tab.label}
              </button>
            ))}
          </div>

          <div className="card-body" style={{ padding: 'var(--spacing-lg)' }}>
            {/* ─── Transcript Tab ──────────────────────────────────── */}
            {activeTab === 'transcript' && (
              <div>
                {/* Speaker Filter Chips */}
                {speakers.length > 1 && (
                  <div className="flex items-center gap-sm mb-lg" style={{ flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setActiveSpeakerFilter(null)}
                      style={{
                        padding: '4px 12px',
                        fontSize: '11px',
                        fontWeight: !activeSpeakerFilter ? 700 : 500,
                        background: !activeSpeakerFilter ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                        color: !activeSpeakerFilter ? '#fff' : 'var(--text-secondary)',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      All ({segments.length})
                    </button>
                    {speakers.map(speaker => {
                      const color = speakerColorMap.get(speaker.name) || '#888';
                      const count = segments.filter(s => s.speaker === speaker.name).length;
                      const isActive = activeSpeakerFilter === speaker.name;
                      return (
                        <button
                          key={speaker.id}
                          onClick={() => setActiveSpeakerFilter(isActive ? null : speaker.name)}
                          style={{
                            padding: '4px 12px',
                            fontSize: '11px',
                            fontWeight: isActive ? 700 : 500,
                            background: isActive ? color : 'var(--bg-tertiary)',
                            color: isActive ? '#fff' : 'var(--text-secondary)',
                            border: `1px solid ${isActive ? color : 'transparent'}`,
                            borderRadius: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          {speaker.name} ({count})
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Transcript Segments */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {filteredSegments.map((seg, i) => {
                    const color = speakerColorMap.get(seg.speaker) || '#888';
                    return (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          gap: '12px',
                          padding: '10px 12px',
                          borderLeft: `3px solid ${color}`,
                          background: i % 2 === 0 ? 'transparent' : 'var(--bg-secondary)',
                        }}
                      >
                        <div style={{
                          minWidth: '48px',
                          fontSize: '10px',
                          color: 'var(--text-muted)',
                          paddingTop: '3px',
                          fontFamily: 'monospace',
                        }}>
                          {formatTime(seg.startMs)}
                        </div>
                        <div style={{ minWidth: '100px', maxWidth: '120px' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color,
                          }}>
                            {seg.speaker}
                          </span>
                        </div>
                        <div style={{ flex: 1, fontSize: '14px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                          {seg.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── Speakers Tab ────────────────────────────────────── */}
            {activeTab === 'speakers' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                {speakers.map((speaker, i) => {
                  const color = SPEAKER_COLORS[i % SPEAKER_COLORS.length];
                  const totalMs = speakers.reduce((s, sp) => s + sp.speakTimeMs, 0) || 1;
                  const pct = Math.round((speaker.speakTimeMs / totalMs) * 100);
                  const totalWords = speakers.reduce((s, sp) => s + sp.wordCount, 0) || 1;
                  const wordPct = Math.round((speaker.wordCount / totalWords) * 100);

                  return (
                    <div
                      key={speaker.id}
                      style={{
                        padding: 'var(--spacing-md)',
                        background: 'var(--bg-secondary)',
                        borderLeft: `4px solid ${color}`,
                        borderRadius: '4px',
                      }}
                    >
                      <div className="flex items-center justify-between mb-sm">
                        <span style={{ fontWeight: 700, fontSize: '15px', color }}>{speaker.name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {speaker.wordCount} words
                        </span>
                      </div>

                      {/* Speaking Time Bar */}
                      <div style={{ marginBottom: '8px' }}>
                        <div className="flex items-center justify-between" style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <span>Speaking Time</span>
                          <span>{pct}% ({formatTime(speaker.speakTimeMs)})</span>
                        </div>
                        <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px' }} />
                        </div>
                      </div>

                      {/* Word Count Bar */}
                      <div>
                        <div className="flex items-center justify-between" style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <span>Word Share</span>
                          <span>{wordPct}%</span>
                        </div>
                        <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${wordPct}%`, background: color, opacity: 0.6, borderRadius: '3px' }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ─── Analysis Summary Tab ─────────────────────────────── */}
            {activeTab === 'analysis' && (
              <div>
                {audit ? (
                  <>
                    <p style={{ fontSize: '14px', lineHeight: 1.7, marginBottom: 'var(--spacing-lg)' }}>
                      {audit.summary}
                    </p>

                    {biases.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                          Detected Biases ({biases.length})
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {biases.map((b, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between"
                              style={{
                                padding: '8px 12px',
                                background: 'var(--bg-secondary)',
                                borderLeft: `3px solid ${b.severity === 'high' || b.severity === 'critical' ? 'var(--error)' : b.severity === 'medium' ? 'var(--warning)' : 'var(--success)'}`,
                              }}
                            >
                              <span style={{ fontSize: '13px' }}>{b.biasType}</span>
                              <span style={{
                                fontSize: '10px',
                                padding: '2px 8px',
                                background: b.severity === 'high' || b.severity === 'critical' ? 'rgba(239,68,68,0.1)' : b.severity === 'medium' ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)',
                                color: b.severity === 'high' || b.severity === 'critical' ? 'var(--error)' : b.severity === 'medium' ? 'var(--warning)' : 'var(--success)',
                                borderRadius: '4px',
                              }}>
                                {b.severity.toUpperCase()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {meeting.humanDecision?.id && (
                      <Link
                        href={`/dashboard/cognitive-audits/${meeting.humanDecision.id}`}
                        className="btn btn-primary mt-lg"
                      >
                        <ExternalLink size={14} /> View Full Cognitive Audit
                      </Link>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Analysis will appear here once processing is complete.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
