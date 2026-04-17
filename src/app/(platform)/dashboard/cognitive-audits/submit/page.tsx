'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BrainCircuit,
  ArrowLeft,
  Loader2,
  Send,
  AlertCircle,
  Upload,
  Mic,
  X,
  FileAudio,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SOURCE_LABELS } from '@/lib/constants/human-audit';

const DECISION_TYPES = [
  { value: '', label: 'Select type (optional)' },
  { value: 'strategic', label: 'Strategic' },
  { value: 'triage', label: 'Triage' },
  { value: 'escalation', label: 'Escalation' },
  { value: 'approval', label: 'Approval' },
  { value: 'override', label: 'Override' },
  { value: 'vendor_eval', label: 'Vendor Evaluation' },
];

const SOURCES = [
  { value: 'manual', label: SOURCE_LABELS['manual'] || 'Manual' },
  { value: 'meeting_transcript', label: SOURCE_LABELS['meeting_transcript'] || 'Meeting' },
  { value: 'meeting_recording', label: 'Meeting Recording (Audio/Video)' },
  { value: 'email', label: SOURCE_LABELS['email'] || 'Email' },
  { value: 'jira', label: SOURCE_LABELS['jira'] || 'Jira' },
];

const MEETING_TYPES = [
  { value: 'general', label: 'General Meeting' },
  { value: 'board', label: 'Board Meeting' },
  { value: 'strategic_planning', label: 'Strategic Planning' },
  { value: 'incident_response', label: 'Incident Response' },
  { value: 'vendor_review', label: 'Vendor Review' },
];

const ACCEPTED_MEDIA_TYPES = '.mp3,.m4a,.wav,.webm,.ogg,.flac,.mp4,.mov,.avi';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function SubmitDecisionPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Common fields
  const [source, setSource] = useState('manual');
  const [channel, setChannel] = useState('');
  const [decisionType, setDecisionType] = useState('');
  const [participants, setParticipants] = useState('');
  const [content, setContent] = useState('');

  // Meeting recording fields
  const [meetingFile, setMeetingFile] = useState<File | null>(null);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingType, setMeetingType] = useState('general');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const isRecordingMode = source === 'meeting_recording';

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) setMeetingFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRecordingMode) {
      // Meeting recording upload
      if (!meetingFile) {
        setError('Please select an audio or video file.');
        return;
      }
      if (!meetingTitle.trim()) {
        setError('Meeting title is required.');
        return;
      }

      setSubmitting(true);
      setUploadProgress(0);

      try {
        const formData = new FormData();
        formData.append('file', meetingFile);
        formData.append('title', meetingTitle.trim());
        formData.append('meetingType', meetingType);
        if (participants.trim()) {
          formData.append('participants', participants.trim());
        }

        const xhr = new XMLHttpRequest();
        const uploadPromise = new Promise<{ id: string }>((resolve, reject) => {
          xhr.upload.addEventListener('progress', e => {
            if (e.lengthComputable) {
              setUploadProgress(Math.round((e.loaded / e.total) * 100));
            }
          });
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              const err = JSON.parse(xhr.responseText || '{}');
              reject(new Error(err.error || 'Upload failed'));
            }
          });
          xhr.addEventListener('error', () => reject(new Error('Network error')));
          xhr.open('POST', '/api/meetings/upload');
          xhr.send(formData);
        });

        const data = await uploadPromise;
        router.push(`/dashboard/meetings/${data.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setSubmitting(false);
        setUploadProgress(0);
      }
    } else {
      // Text-based decision submission
      if (!content.trim()) {
        setError('Decision content is required.');
        return;
      }

      setSubmitting(true);
      try {
        const body: Record<string, unknown> = {
          source: source === 'meeting_recording' ? 'meeting_transcript' : source,
          content: content.trim(),
        };
        if (channel.trim()) body.channel = channel.trim();
        if (decisionType) body.decisionType = decisionType;
        if (participants.trim()) {
          body.participants = participants
            .split(',')
            .map(p => p.trim())
            .filter(Boolean);
        }

        const res = await fetch('/api/human-decisions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Submission failed');
          return;
        }

        router.push(`/dashboard/cognitive-audits/${data.id}`);
      } catch {
        setError('Network error. Please try again.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontWeight: 600,
    fontSize: '13px',
    marginBottom: '6px',
  };

  return (
    <ErrorBoundary sectionName="Submit Decision">
      <div
        className="container"
        style={{
          paddingTop: 'var(--spacing-2xl)',
          paddingBottom: 'var(--spacing-2xl)',
          maxWidth: 720,
        }}
      >
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Cognitive Audits', href: '/dashboard/decision-quality?tab=audits' },
            { label: 'Submit Decision' },
          ]}
        />

        <header className="mb-xl animate-fade-in">
          <div className="flex items-center gap-md mb-sm">
            <BrainCircuit size={28} style={{ color: 'var(--text-secondary)' }} />
            <h1>Submit a strategic memo for audit</h1>
          </div>
          <p className="text-muted">
            Paste a strategic memo, upload a board deck, or submit a meeting transcript. We score
            the reasoning, predict the objections your steering committee will raise, and add it to
            your Knowledge Graph.
          </p>
        </header>

        {error && (
          <div
            className="flex items-center gap-sm mb-lg"
            style={{
              padding: 'var(--spacing-md)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--error)',
              fontSize: '14px',
              color: 'var(--error)',
            }}
          >
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="card animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div
              className="card-body"
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}
            >
              {/* Source */}
              <div>
                <label style={labelStyle}>Source</label>
                <select value={source} onChange={e => setSource(e.target.value)} style={inputStyle}>
                  {SOURCES.map(s => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* ─── Meeting Recording Mode ───────────────────────────── */}
              {isRecordingMode && (
                <>
                  {/* Meeting Title */}
                  <div>
                    <label style={labelStyle}>
                      Meeting Title <span style={{ color: 'var(--error)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={meetingTitle}
                      onChange={e => setMeetingTitle(e.target.value)}
                      placeholder="e.g. Q1 2026 Business Outlook Review"
                      style={inputStyle}
                      required
                    />
                  </div>

                  {/* Meeting Type */}
                  <div>
                    <label style={labelStyle}>Meeting Type</label>
                    <select
                      value={meetingType}
                      onChange={e => setMeetingType(e.target.value)}
                      style={inputStyle}
                    >
                      {MEETING_TYPES.map(t => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* File Drop Zone */}
                  <div>
                    <label style={labelStyle}>
                      Recording File <span style={{ color: 'var(--error)' }}>*</span>
                    </label>

                    {!meetingFile ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={e => {
                          e.preventDefault();
                          setDragActive(true);
                        }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={handleDrop}
                        style={{
                          border: `2px dashed ${dragActive ? 'var(--text-highlight)' : 'var(--border-color)'}`,
                          borderRadius: '12px',
                          padding: '40px 20px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          background: dragActive
                            ? 'rgba(255, 255, 255, 0.06)'
                            : 'var(--bg-secondary)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Upload
                          size={36}
                          style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}
                        />
                        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>
                          Drop recording here or click to browse
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Supports MP3, M4A, WAV, MP4, WebM, MOV (max 500MB)
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept={ACCEPTED_MEDIA_TYPES}
                          onChange={e => {
                            const f = e.target.files?.[0];
                            if (f) setMeetingFile(f);
                          }}
                          style={{ display: 'none' }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '16px',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                        }}
                      >
                        <FileAudio
                          size={28}
                          style={{ color: 'var(--text-secondary)', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '14px',
                              fontWeight: 600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {meetingFile.name}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {formatFileSize(meetingFile.size)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setMeetingFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="btn btn-ghost"
                          style={{ padding: '4px' }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}

                    {/* Upload progress */}
                    {submitting && uploadProgress > 0 && (
                      <div style={{ marginTop: '12px' }}>
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
                              width: `${uploadProgress}%`,
                              background: 'var(--text-highlight)',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            marginTop: '4px',
                            textAlign: 'right',
                          }}
                        >
                          Uploading... {uploadProgress}%
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ─── Text Mode Fields ────────────────────────────────── */}
              {!isRecordingMode && (
                <>
                  {/* Channel */}
                  <div>
                    <label style={labelStyle}>
                      Channel / Context{' '}
                      <span className="text-muted" style={{ fontWeight: 400 }}>
                        (optional)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={channel}
                      onChange={e => setChannel(e.target.value)}
                      placeholder="e.g. #incident-response, Board Meeting Q1"
                      style={inputStyle}
                    />
                  </div>

                  {/* Decision Type */}
                  <div>
                    <label style={labelStyle}>
                      Decision Type{' '}
                      <span className="text-muted" style={{ fontWeight: 400 }}>
                        (optional)
                      </span>
                    </label>
                    <select
                      value={decisionType}
                      onChange={e => setDecisionType(e.target.value)}
                      style={inputStyle}
                    >
                      {DECISION_TYPES.map(t => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Participants (shared) */}
              <div>
                <label style={labelStyle}>
                  Participants{' '}
                  <span className="text-muted" style={{ fontWeight: 400 }}>
                    (comma-separated, optional)
                  </span>
                </label>
                <input
                  type="text"
                  value={participants}
                  onChange={e => setParticipants(e.target.value)}
                  placeholder="e.g. Alice, Bob, Charlie"
                  style={inputStyle}
                />
                {isRecordingMode && (
                  <div className="text-xs text-muted mt-xs">
                    <Mic size={10} style={{ display: 'inline', verticalAlign: 'middle' }} />{' '}
                    Speakers will also be auto-detected from the audio
                  </div>
                )}
              </div>

              {/* Content (text mode only) */}
              {!isRecordingMode && (
                <div>
                  <label style={labelStyle}>
                    Decision Content <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Paste the decision text, meeting transcript, or email thread here..."
                    rows={12}
                    style={{
                      ...inputStyle,
                      padding: '12px',
                      lineHeight: 1.6,
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                    required
                  />
                  <div className="text-xs text-muted mt-xs">
                    {content.length > 0
                      ? `${content.length} characters`
                      : 'Minimum 20 characters recommended for meaningful analysis'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-lg">
            <Link href="/dashboard/decision-quality?tab=audits" className="btn btn-secondary">
              <ArrowLeft size={16} /> Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                submitting ||
                (isRecordingMode ? !meetingFile || !meetingTitle.trim() : !content.trim())
              }
              style={{ minWidth: 180 }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {isRecordingMode ? 'Uploading...' : 'Submitting...'}
                </>
              ) : (
                <>
                  {isRecordingMode ? <Upload size={16} /> : <Send size={16} />}
                  {isRecordingMode ? 'Upload & Analyze' : 'Submit for Audit'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </ErrorBoundary>
  );
}
