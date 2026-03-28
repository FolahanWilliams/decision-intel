'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { use, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Video,
  ArrowLeft,
  Loader2,
  Clock,
  Users,
  MessageSquare,
  BarChart3,
  CheckCircle,
  ExternalLink,
  ListChecks,
  Landmark,
  BrainCircuit,
  Search,
  Download,
  Copy,
  X,
  History,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  useMeeting,
  type TranscriptSegment,
  type MeetingSpeaker,
  type ActionItem,
  type KeyDecision,
  type SpeakerBiasProfile,
  type SimilarMeeting,
} from '@/hooks/useMeetings';
import { getQualityLevel, getBiasArray, SEVERITY_COLORS } from '@/lib/constants/human-audit';

type TabKey = 'transcript' | 'speakers' | 'actions' | 'decisions' | 'biases' | 'analysis';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  uploading: { label: 'Uploading recording...', color: 'var(--text-muted)' },
  transcribing: { label: 'Transcribing audio...', color: 'var(--text-secondary)' },
  analyzing: { label: 'Running cognitive audit...', color: 'var(--warning)' },
  complete: { label: 'Analysis complete', color: 'var(--success)' },
  error: { label: 'Processing failed', color: 'var(--error)' },
};

const SPEAKER_COLORS = [
  '#94a3b8',
  '#ec4899',
  '#22c55e',
  '#f59e0b',
  '#06b6d4',
  '#8b5cf6',
  '#ef4444',
  '#14b8a6',
  '#64748b',
  '#a855f7',
];

const PRIORITY_STYLES: Record<string, { color: string; bg: string }> = {
  critical: { color: 'var(--error)', bg: 'rgba(239,68,68,0.1)' },
  high: { color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  medium: { color: 'var(--warning)', bg: 'rgba(245,158,11,0.1)' },
  low: { color: 'var(--success)', bg: 'rgba(34,197,94,0.1)' },
};

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
  const [activeTab, setActiveTab] = useState<TabKey>('transcript');
  const [activeSpeakerFilter, setActiveSpeakerFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const segments: TranscriptSegment[] = useMemo(() => {
    if (!meeting?.transcript?.segments) return [];
    return Array.isArray(meeting.transcript.segments) ? meeting.transcript.segments : [];
  }, [meeting]);

  const speakers: MeetingSpeaker[] = useMemo(() => {
    if (!meeting?.transcript?.speakers) return [];
    return Array.isArray(meeting.transcript.speakers) ? meeting.transcript.speakers : [];
  }, [meeting]);

  const speakerColorMap = useMemo(() => {
    const map = new Map<string, string>();
    speakers.forEach((s, i) => map.set(s.name, SPEAKER_COLORS[i % SPEAKER_COLORS.length]));
    return map;
  }, [speakers]);

  const filteredSegments = useMemo(() => {
    let result = segments;
    if (activeSpeakerFilter) {
      result = result.filter(s => s.speaker === activeSpeakerFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        s => s.text.toLowerCase().includes(q) || s.speaker.toLowerCase().includes(q)
      );
    }
    return result;
  }, [segments, activeSpeakerFilter, searchQuery]);

  const actionItems: ActionItem[] = useMemo(() => {
    if (!meeting?.actionItems) return [];
    return Array.isArray(meeting.actionItems) ? meeting.actionItems : [];
  }, [meeting]);

  const keyDecisions: KeyDecision[] = useMemo(() => {
    if (!meeting?.keyDecisions) return [];
    return Array.isArray(meeting.keyDecisions) ? meeting.keyDecisions : [];
  }, [meeting]);

  const speakerBiases: SpeakerBiasProfile[] = useMemo(() => {
    if (!meeting?.speakerBiases) return [];
    return Array.isArray(meeting.speakerBiases) ? meeting.speakerBiases : [];
  }, [meeting]);

  const similarMeetings: SimilarMeeting[] = useMemo(() => {
    if (!meeting?.similarMeetings) return [];
    return Array.isArray(meeting.similarMeetings) ? meeting.similarMeetings : [];
  }, [meeting]);

  const audit = meeting?.humanDecision?.cognitiveAudit;
  const biases = audit
    ? getBiasArray<{ biasType: string; severity: string; explanation: string }>(audit.biasFindings)
    : [];
  const quality = audit ? getQualityLevel(audit.decisionQualityScore) : null;

  const handleCopyTranscript = useCallback(() => {
    const text = meeting?.transcript?.fullText;
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  }, [meeting?.transcript?.fullText]);

  const handleExportTranscript = useCallback(() => {
    const text = meeting?.transcript?.fullText;
    if (!text || !meeting) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meeting.title.replace(/[^a-zA-Z0-9]/g, '_')}_transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [meeting]);

  if (isLoading) {
    return (
      <div className="container" style={{ paddingTop: 'var(--spacing-2xl)', textAlign: 'center' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--text-secondary)' }} />
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

  const tabs: Array<{ key: TabKey; label: string; icon: typeof MessageSquare; count?: number }> = [
    { key: 'transcript', label: 'Transcript', icon: MessageSquare },
    { key: 'speakers', label: 'Speakers', icon: Users },
    { key: 'actions', label: 'Action Items', icon: ListChecks, count: actionItems.length },
    { key: 'decisions', label: 'Decisions', icon: Landmark, count: keyDecisions.length },
    {
      key: 'biases',
      label: 'Speaker Biases',
      icon: BrainCircuit,
      count: speakerBiases.reduce((s, sb) => s + sb.biases.length, 0),
    },
    { key: 'analysis', label: 'Summary', icon: BarChart3 },
  ];

  return (
    <ErrorBoundary sectionName="Meeting Detail">
    <div
      className="container"
      style={{ paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)' }}
    >
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
          <Video size={28} style={{ color: 'var(--text-secondary)' }} />
          <h1>{meeting.title}</h1>
        </div>
        <div
          className="flex items-center gap-lg text-muted"
          style={{ fontSize: '13px', flexWrap: 'wrap' }}
        >
          <span className="flex items-center gap-xs">
            <Clock size={14} /> {formatDuration(meeting.durationSeconds)}
          </span>
          <span className="flex items-center gap-xs">
            <Users size={14} /> {speakers.length || meeting.participants.length} speakers
          </span>
          <span className="flex items-center gap-xs">
            <MessageSquare size={14} /> {segments.length} segments
          </span>
          {actionItems.length > 0 && (
            <span className="flex items-center gap-xs">
              <ListChecks size={14} /> {actionItems.length} action items
            </span>
          )}
          {keyDecisions.length > 0 && (
            <span className="flex items-center gap-xs">
              <Landmark size={14} /> {keyDecisions.length} decisions
            </span>
          )}
          {meeting.fileName && <span>{meeting.fileName}</span>}
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
                  <div
                    style={{
                      height: '4px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                      width: '300px',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${meeting.transcriptionProgress}%`,
                        background: status.color,
                        transition: 'width 0.5s ease',
                      }}
                    />
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
          style={{
            padding: 'var(--spacing-lg)',
            borderLeft: '3px solid var(--error)',
            background: 'rgba(239,68,68,0.05)',
          }}
        >
          <div style={{ fontWeight: 600, color: 'var(--error)', marginBottom: '4px' }}>
            Processing Failed
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {meeting.errorMessage || 'An unknown error occurred.'}
          </div>
        </div>
      )}

      {/* Executive Summary Banner */}
      {meeting.summary && (
        <div
          className="card animate-fade-in mb-lg"
          style={{ padding: 'var(--spacing-lg)', borderLeft: '3px solid var(--text-highlight)' }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Executive Summary
          </div>
          <p style={{ fontSize: '14px', lineHeight: 1.7, margin: 0 }}>{meeting.summary}</p>
        </div>
      )}

      {/* Quick Stats */}
      {audit && (
        <div
          className="animate-fade-in"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-xl)',
          }}
        >
          <div className="card" style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: quality?.color }}>
              {Math.round(audit.decisionQualityScore)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Quality</div>
          </div>
          <div className="card" style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{biases.length}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Biases</div>
          </div>
          <div className="card" style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{Math.round(audit.noiseScore)}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Noise</div>
          </div>
          <div className="card" style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
            <div
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                color:
                  actionItems.filter(a => a.priority === 'critical' || a.priority === 'high')
                    .length > 0
                    ? '#f97316'
                    : 'var(--text-primary)',
              }}
            >
              {actionItems.length}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Actions</div>
          </div>
          <div className="card" style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{keyDecisions.length}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Decisions</div>
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
              <ExternalLink size={20} style={{ color: 'var(--text-highlight)' }} />
              <div style={{ fontSize: '12px', color: 'var(--text-highlight)', fontWeight: 600 }}>
                Full Audit
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Tabs */}
      {meeting.transcript && (
        <div className="card animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="card-header" style={{ gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-xs"
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: activeTab === tab.key ? 700 : 500,
                  background: activeTab === tab.key ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  color: activeTab === tab.key ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <tab.icon size={13} /> {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '1px 5px',
                      background:
                        activeTab === tab.key ? 'rgba(255,255,255,0.2)' : 'var(--bg-tertiary)',
                      borderRadius: '8px',
                      marginLeft: '2px',
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="card-body" style={{ padding: 'var(--spacing-lg)' }}>
            {/* ─── Transcript Tab ──────────────────────────────────── */}
            {activeTab === 'transcript' && (
              <div>
                {/* Toolbar: Search + Export */}
                <div
                  className="flex items-center justify-between mb-md"
                  style={{ gap: '8px', flexWrap: 'wrap' }}
                >
                  <div className="flex items-center gap-sm" style={{ flexWrap: 'wrap' }}>
                    {/* Speaker Filter Chips */}
                    {speakers.length > 1 && (
                      <>
                        <button
                          onClick={() => setActiveSpeakerFilter(null)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: !activeSpeakerFilter ? 700 : 500,
                            background: !activeSpeakerFilter
                              ? 'rgba(255, 255, 255, 0.15)'
                              : 'var(--bg-tertiary)',
                            color: !activeSpeakerFilter ? '#fff' : 'var(--text-secondary)',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          All
                        </button>
                        {speakers.map(speaker => {
                          const color = speakerColorMap.get(speaker.name) || '#888';
                          const isActive = activeSpeakerFilter === speaker.name;
                          return (
                            <button
                              key={speaker.id}
                              onClick={() => setActiveSpeakerFilter(isActive ? null : speaker.name)}
                              style={{
                                padding: '4px 10px',
                                fontSize: '11px',
                                fontWeight: isActive ? 700 : 500,
                                background: isActive ? color : 'var(--bg-tertiary)',
                                color: isActive ? '#fff' : 'var(--text-secondary)',
                                border: `1px solid ${isActive ? color : 'transparent'}`,
                                borderRadius: '12px',
                                cursor: 'pointer',
                              }}
                            >
                              {speaker.name}
                            </button>
                          );
                        })}
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-sm">
                    {/* Search toggle */}
                    <button
                      onClick={() => {
                        setShowSearch(!showSearch);
                        if (showSearch) setSearchQuery('');
                      }}
                      className="btn btn-ghost"
                      style={{ padding: '4px 8px' }}
                    >
                      {showSearch ? <X size={14} /> : <Search size={14} />}
                    </button>
                    {/* Copy */}
                    <button
                      onClick={handleCopyTranscript}
                      className="btn btn-ghost"
                      style={{ padding: '4px 8px' }}
                      title="Copy transcript"
                    >
                      <Copy size={14} />
                      {copiedText && (
                        <span style={{ fontSize: '10px', marginLeft: '4px' }}>Copied</span>
                      )}
                    </button>
                    {/* Export */}
                    <button
                      onClick={handleExportTranscript}
                      className="btn btn-ghost"
                      style={{ padding: '4px 8px' }}
                      title="Export transcript"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                {showSearch && (
                  <div style={{ marginBottom: '12px' }}>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search transcript..."
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: '13px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        borderRadius: '6px',
                      }}
                    />
                    {searchQuery && (
                      <div
                        style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}
                      >
                        {filteredSegments.length} segment{filteredSegments.length !== 1 ? 's' : ''}{' '}
                        found
                      </div>
                    )}
                  </div>
                )}

                {/* Transcript Segments */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {filteredSegments.map((seg, i) => {
                    const color = speakerColorMap.get(seg.speaker) || '#888';
                    const highlightedText = searchQuery.trim()
                      ? highlightMatch(seg.text, searchQuery)
                      : seg.text;

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
                        <div
                          style={{
                            minWidth: '48px',
                            fontSize: '10px',
                            color: 'var(--text-muted)',
                            paddingTop: '3px',
                            fontFamily: 'monospace',
                          }}
                        >
                          {formatTime(seg.startMs)}
                        </div>
                        <div style={{ minWidth: '100px', maxWidth: '120px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color }}>
                            {seg.speaker}
                          </span>
                        </div>
                        <div
                          style={{
                            flex: 1,
                            fontSize: '14px',
                            lineHeight: 1.6,
                            color: 'var(--text-primary)',
                          }}
                          dangerouslySetInnerHTML={
                            searchQuery.trim() ? { __html: highlightedText } : undefined
                          }
                        >
                          {!searchQuery.trim() ? seg.text : undefined}
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
                  const sbProfile = speakerBiases.find(sb => sb.speaker === speaker.name);

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
                        <span style={{ fontWeight: 700, fontSize: '15px', color }}>
                          {speaker.name}
                        </span>
                        <div
                          className="flex items-center gap-md"
                          style={{ fontSize: '11px', color: 'var(--text-muted)' }}
                        >
                          <span>{speaker.wordCount} words</span>
                          {sbProfile && <span>Dominance: {sbProfile.dominanceScore}/100</span>}
                        </div>
                      </div>

                      <div style={{ marginBottom: '8px' }}>
                        <div
                          className="flex items-center justify-between"
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            marginBottom: '4px',
                          }}
                        >
                          <span>Speaking Time</span>
                          <span>
                            {pct}% ({formatTime(speaker.speakTimeMs)})
                          </span>
                        </div>
                        <div
                          style={{
                            height: '6px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '3px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${pct}%`,
                              background: color,
                              borderRadius: '3px',
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div
                          className="flex items-center justify-between"
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            marginBottom: '4px',
                          }}
                        >
                          <span>Word Share</span>
                          <span>{wordPct}%</span>
                        </div>
                        <div
                          style={{
                            height: '6px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '3px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${wordPct}%`,
                              background: color,
                              opacity: 0.6,
                              borderRadius: '3px',
                            }}
                          />
                        </div>
                      </div>

                      {/* Speaker biases inline */}
                      {sbProfile && sbProfile.biases.length > 0 && (
                        <div
                          style={{
                            marginTop: '10px',
                            paddingTop: '10px',
                            borderTop: '1px solid var(--border-color)',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '11px',
                              color: 'var(--text-muted)',
                              marginBottom: '6px',
                            }}
                          >
                            Detected Biases:
                          </div>
                          <div className="flex items-center gap-sm" style={{ flexWrap: 'wrap' }}>
                            {sbProfile.biases.map((b, bi) => (
                              <span
                                key={bi}
                                style={{
                                  fontSize: '10px',
                                  padding: '2px 8px',
                                  background:
                                    b.avgSeverity > 0.6
                                      ? 'rgba(239,68,68,0.1)'
                                      : 'rgba(245,158,11,0.1)',
                                  color: b.avgSeverity > 0.6 ? 'var(--error)' : 'var(--warning)',
                                  borderRadius: '4px',
                                }}
                              >
                                {b.biasType} ({b.count})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ─── Action Items Tab ────────────────────────────────── */}
            {activeTab === 'actions' && (
              <div>
                {actionItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    {meeting.status === 'complete'
                      ? 'No action items detected in this meeting.'
                      : 'Action items will appear once processing is complete.'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {actionItems.map((item, i) => {
                      const pStyle = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.medium;
                      return (
                        <div
                          key={item.id || i}
                          style={{
                            padding: '14px 16px',
                            background: 'var(--bg-secondary)',
                            borderLeft: `3px solid ${pStyle.color}`,
                            borderRadius: '4px',
                          }}
                        >
                          <div className="flex items-center justify-between mb-xs">
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>{item.text}</span>
                            <span
                              style={{
                                fontSize: '10px',
                                padding: '2px 8px',
                                background: pStyle.bg,
                                color: pStyle.color,
                                borderRadius: '4px',
                                fontWeight: 600,
                              }}
                            >
                              {item.priority.toUpperCase()}
                            </span>
                          </div>
                          <div
                            className="flex items-center gap-md"
                            style={{ fontSize: '12px', color: 'var(--text-muted)' }}
                          >
                            {item.assignee && (
                              <span>
                                Assigned to: <strong>{item.assignee}</strong>
                              </span>
                            )}
                            {item.dueDate && <span>Due: {item.dueDate}</span>}
                          </div>
                          {item.context && (
                            <div
                              style={{
                                fontSize: '12px',
                                color: 'var(--text-muted)',
                                marginTop: '6px',
                                fontStyle: 'italic',
                              }}
                            >
                              &quot;{item.context}&quot;
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ─── Key Decisions Tab ───────────────────────────────── */}
            {activeTab === 'decisions' && (
              <div>
                {keyDecisions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    {meeting.status === 'complete'
                      ? 'No key decisions detected in this meeting.'
                      : 'Key decisions will appear once processing is complete.'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {keyDecisions.map((d, i) => (
                      <div
                        key={d.id || i}
                        style={{
                          padding: '16px',
                          background: 'var(--bg-secondary)',
                          borderRadius: '6px',
                          borderLeft: `3px solid var(--text-highlight)`,
                        }}
                      >
                        <div className="flex items-center justify-between mb-xs">
                          <span style={{ fontSize: '14px', fontWeight: 700 }}>{d.text}</span>
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '2px 8px',
                              background: 'rgba(255, 255, 255, 0.06)',
                              color: 'var(--text-secondary)',
                              borderRadius: '4px',
                            }}
                          >
                            {d.decisionType}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', lineHeight: 1.6, marginBottom: '8px' }}>
                          {d.rationale}
                        </div>
                        <div
                          className="flex items-center gap-lg"
                          style={{ fontSize: '12px', color: 'var(--text-muted)' }}
                        >
                          {d.madeBy && (
                            <span>
                              By: <strong>{d.madeBy}</strong>
                            </span>
                          )}
                          <span>Confidence: {Math.round(d.confidence * 100)}%</span>
                        </div>
                        {d.dissent && (
                          <div
                            style={{
                              marginTop: '8px',
                              padding: '8px 12px',
                              background: 'rgba(245,158,11,0.05)',
                              borderLeft: '2px solid var(--warning)',
                              fontSize: '12px',
                            }}
                          >
                            <strong style={{ color: 'var(--warning)' }}>Dissent:</strong>{' '}
                            {d.dissent}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── Speaker Biases Tab ──────────────────────────────── */}
            {activeTab === 'biases' && (
              <div>
                {speakerBiases.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    {meeting.status === 'complete'
                      ? 'No per-speaker biases detected.'
                      : 'Speaker bias analysis will appear once processing is complete.'}
                  </div>
                ) : (
                  <div
                    style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}
                  >
                    {speakerBiases.map((sb, i) => {
                      const color =
                        speakerColorMap.get(sb.speaker) ||
                        SPEAKER_COLORS[i % SPEAKER_COLORS.length];
                      return (
                        <div
                          key={sb.speaker}
                          style={{
                            padding: 'var(--spacing-md)',
                            background: 'var(--bg-secondary)',
                            borderLeft: `4px solid ${color}`,
                            borderRadius: '4px',
                          }}
                        >
                          <div className="flex items-center justify-between mb-md">
                            <span style={{ fontWeight: 700, fontSize: '15px', color }}>
                              {sb.speaker}
                            </span>
                            <div className="flex items-center gap-md" style={{ fontSize: '11px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>
                                Dominance: <strong>{sb.dominanceScore}/100</strong>
                              </span>
                              <span
                                style={{
                                  color:
                                    sb.dissenterScore > 50 ? 'var(--success)' : 'var(--text-muted)',
                                }}
                              >
                                Dissenter: <strong>{sb.dissenterScore}/100</strong>
                              </span>
                            </div>
                          </div>

                          {sb.biases.length === 0 ? (
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                              <CheckCircle
                                size={14}
                                style={{
                                  display: 'inline',
                                  verticalAlign: 'middle',
                                  color: 'var(--success)',
                                }}
                              />{' '}
                              No significant biases detected
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {sb.biases.map((b, bi) => {
                                const sevColor =
                                  b.avgSeverity > 0.7
                                    ? 'var(--error)'
                                    : b.avgSeverity > 0.4
                                      ? 'var(--warning)'
                                      : 'var(--success)';
                                return (
                                  <div
                                    key={bi}
                                    style={{
                                      padding: '10px 12px',
                                      background: 'var(--bg-primary)',
                                      borderRadius: '4px',
                                    }}
                                  >
                                    <div className="flex items-center justify-between mb-xs">
                                      <span style={{ fontSize: '13px', fontWeight: 600 }}>
                                        {b.biasType}
                                      </span>
                                      <div className="flex items-center gap-sm">
                                        <span
                                          style={{ fontSize: '10px', color: 'var(--text-muted)' }}
                                        >
                                          {b.count}x
                                        </span>
                                        <span
                                          style={{
                                            fontSize: '10px',
                                            padding: '1px 6px',
                                            background: `${sevColor}15`,
                                            color: sevColor,
                                            borderRadius: '4px',
                                          }}
                                        >
                                          {b.avgSeverity > 0.7
                                            ? 'HIGH'
                                            : b.avgSeverity > 0.4
                                              ? 'MED'
                                              : 'LOW'}
                                        </span>
                                      </div>
                                    </div>
                                    {b.examples.length > 0 && (
                                      <div
                                        style={{
                                          fontSize: '12px',
                                          color: 'var(--text-muted)',
                                          fontStyle: 'italic',
                                        }}
                                      >
                                        &quot;{b.examples[0]}&quot;
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ─── Analysis Summary Tab ─────────────────────────────── */}
            {activeTab === 'analysis' && (
              <div>
                {audit ? (
                  <div
                    style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}
                  >
                    <p style={{ fontSize: '14px', lineHeight: 1.7 }}>{audit.summary}</p>

                    {biases.length > 0 && (
                      <div>
                        <h4
                          style={{
                            fontSize: '13px',
                            color: 'var(--text-muted)',
                            marginBottom: '8px',
                          }}
                        >
                          Detected Biases ({biases.length})
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {biases.map((b, i) => {
                            const sevColor = SEVERITY_COLORS[b.severity] || 'var(--warning)';
                            return (
                              <div
                                key={i}
                                style={{
                                  padding: '10px 12px',
                                  background: 'var(--bg-secondary)',
                                  borderLeft: `3px solid ${sevColor}`,
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <span style={{ fontSize: '13px', fontWeight: 600 }}>
                                    {b.biasType}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: '10px',
                                      padding: '2px 8px',
                                      background: `${sevColor}15`,
                                      color: sevColor,
                                      borderRadius: '4px',
                                    }}
                                  >
                                    {b.severity.toUpperCase()}
                                  </span>
                                </div>
                                {b.explanation && (
                                  <div
                                    style={{
                                      fontSize: '12px',
                                      color: 'var(--text-muted)',
                                      marginTop: '4px',
                                    }}
                                  >
                                    {b.explanation}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Similar Past Meetings (Institutional Memory) */}
                    {similarMeetings.length > 0 && (
                      <div>
                        <h4
                          className="flex items-center gap-xs"
                          style={{
                            fontSize: '13px',
                            color: 'var(--text-muted)',
                            marginBottom: '8px',
                          }}
                        >
                          <History size={14} /> Similar Past Meetings
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {similarMeetings.map((sm, i) => (
                            <div
                              key={i}
                              style={{
                                padding: '10px 12px',
                                background: 'var(--bg-secondary)',
                                borderRadius: '4px',
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span style={{ fontSize: '13px', fontWeight: 600 }}>
                                  {sm.title}
                                </span>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                  {Math.round(sm.similarity * 100)}% similar
                                </span>
                              </div>
                              {sm.outcome && (
                                <div
                                  style={{
                                    fontSize: '12px',
                                    color: 'var(--text-muted)',
                                    marginTop: '2px',
                                  }}
                                >
                                  Outcome: {sm.outcome}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {meeting.humanDecision?.id && (
                      <Link
                        href={`/dashboard/cognitive-audits/${meeting.humanDecision.id}`}
                        className="btn btn-primary"
                      >
                        <ExternalLink size={14} /> View Full Cognitive Audit
                      </Link>
                    )}
                  </div>
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
    </ErrorBoundary>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function highlightMatch(text: string, query: string): string {
  if (!query.trim()) return escapeHtml(text);
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return escapeHtml(text).replace(
    regex,
    '<mark style="background:rgba(255,255,255,0.15);padding:1px 2px;border-radius:2px">$1</mark>'
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
