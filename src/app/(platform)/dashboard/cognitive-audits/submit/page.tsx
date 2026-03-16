'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BrainCircuit, ArrowLeft, Loader2, Send, AlertCircle } from 'lucide-react';
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
  { value: 'email', label: SOURCE_LABELS['email'] || 'Email' },
  { value: 'jira', label: SOURCE_LABELS['jira'] || 'Jira' },
];

export default function SubmitDecisionPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [source, setSource] = useState('manual');
  const [channel, setChannel] = useState('');
  const [decisionType, setDecisionType] = useState('');
  const [participants, setParticipants] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError('Decision content is required.');
      return;
    }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        source,
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

      // Redirect to the new decision's detail page
      router.push(`/dashboard/cognitive-audits/${data.id}`);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
          { label: 'Cognitive Audits', href: '/dashboard/cognitive-audits' },
          { label: 'Submit Decision' },
        ]}
      />

      <header className="mb-xl animate-fade-in">
        <div className="flex items-center gap-md mb-sm">
          <BrainCircuit size={28} style={{ color: 'var(--accent-primary)' }} />
          <h1>Submit Decision for Audit</h1>
        </div>
        <p className="text-muted">
          Paste a decision, meeting transcript, or email thread for cognitive bias analysis.
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
              <label
                style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}
              >
                Source
              </label>
              <select
                value={source}
                onChange={e => setSource(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                {SOURCES.map(s => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Channel */}
            <div>
              <label
                style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}
              >
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
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* Decision Type */}
            <div>
              <label
                style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}
              >
                Decision Type{' '}
                <span className="text-muted" style={{ fontWeight: 400 }}>
                  (optional)
                </span>
              </label>
              <select
                value={decisionType}
                onChange={e => setDecisionType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                {DECISION_TYPES.map(t => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Participants */}
            <div>
              <label
                style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}
              >
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
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* Content */}
            <div>
              <label
                style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}
              >
                Decision Content <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Paste the decision text, meeting transcript, or email thread here..."
                rows={12}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
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
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-lg">
          <Link href="/dashboard/cognitive-audits" className="btn btn-secondary">
            <ArrowLeft size={16} /> Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || !content.trim()}
            style={{ minWidth: 180 }}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <Send size={16} /> Submit for Audit
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
