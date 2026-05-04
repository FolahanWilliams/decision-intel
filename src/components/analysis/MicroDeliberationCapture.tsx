'use client';

/**
 * GTM v3.5 — Micro-deliberation capture panel.
 *
 * Mounts on /documents/[id]/OverviewTab post-audit. Lets the user log
 * fast-feedback deliberation events as they occur in / immediately after
 * an IC discussion or board review meeting:
 *   "Did the GC flag the NDPR risk we predicted?" → tap "yes/no"
 *   "Did the audit committee push back on the valuation multiple?" → tap "yes/no"
 *
 * Each captured event compounds the per-org Brier-scored calibration moat
 * with feedback latency of DAYS (vs. years for macro DecisionOutcome). This
 * is the load-bearing fix from NotebookLM Q1 + Q3.1 (2026-05-04): without
 * it, v3.5's "Sankore engineers Brier loops in 12 weeks" assumption is
 * mathematically impossible.
 *
 * For the first ship, the UI is deliberately minimal — a single capture
 * form + a list of logged events. Auto-populating predicted reactions
 * from the boardroom simulation / simulated CEO output is a follow-up.
 */

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Clock, Plus } from 'lucide-react';

const EVENT_TYPES: Array<{ value: string; label: string; hint: string }> = [
  {
    value: 'committee_pushback',
    label: 'Committee pushback',
    hint: 'IC / board / steering pushed back on a specific assumption',
  },
  {
    value: 'gc_flag',
    label: 'GC flagged',
    hint: 'General Counsel raised the regulatory / compliance concern',
  },
  {
    value: 'chairman_concern',
    label: 'Chair raised concern',
    hint: 'Audit committee chair / chairman / lead partner challenged',
  },
  {
    value: 'reviewer_dismissal',
    label: 'Reviewer dismissed',
    hint: 'Senior reviewer dismissed the recommendation outright',
  },
  {
    value: 'predicted_bias_surfaced',
    label: 'Predicted bias surfaced',
    hint: 'A reviewer named the exact bias the audit predicted',
  },
  { value: 'cfo_objection', label: 'CFO objected', hint: 'CFO raised a financial / unit-economics concern' },
  {
    value: 'compliance_block',
    label: 'Compliance blocked',
    hint: 'Compliance / risk function blocked the deal pending changes',
  },
  { value: 'lp_question', label: 'LP asked', hint: 'A limited partner raised the question' },
  {
    value: 'audit_committee_query',
    label: 'Audit committee queried',
    hint: 'Audit committee formally queried the recommendation',
  },
  { value: 'other', label: 'Other', hint: 'Anything that doesn\'t fit the categories above' },
];

interface CapturedEvent {
  id: string;
  eventType: string;
  eventTypeLabel: string;
  predictedReaction: string;
  actualReaction: string | null;
  confirmed: boolean | null;
  capturedAt: string;
  happenedAt: string | null;
  notes: string | null;
}

interface MicroDeliberationCaptureProps {
  analysisId: string;
}

function StatusBadge({ confirmed }: { confirmed: boolean | null }) {
  if (confirmed === true) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 10px',
          fontSize: 11,
          fontWeight: 700,
          background: 'color-mix(in srgb, var(--success) 12%, transparent)',
          color: 'var(--success)',
          borderRadius: 'var(--radius-full)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        <CheckCircle2 size={11} /> Confirmed
      </span>
    );
  }
  if (confirmed === false) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 10px',
          fontSize: 11,
          fontWeight: 700,
          background: 'color-mix(in srgb, var(--error) 12%, transparent)',
          color: 'var(--error)',
          borderRadius: 'var(--radius-full)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        <XCircle size={11} /> Not surfaced
      </span>
    );
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 10px',
        fontSize: 11,
        fontWeight: 600,
        background: 'var(--bg-tertiary)',
        color: 'var(--text-muted)',
        borderRadius: 'var(--radius-full)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}
    >
      <Clock size={11} /> Pending
    </span>
  );
}

export function MicroDeliberationCapture({ analysisId }: MicroDeliberationCaptureProps) {
  const [events, setEvents] = useState<CapturedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [eventType, setEventType] = useState<string>('committee_pushback');
  const [predictedReaction, setPredictedReaction] = useState('');
  const [actualReaction, setActualReaction] = useState('');
  const [confirmed, setConfirmed] = useState<'yes' | 'no' | 'pending'>('pending');
  const [notes, setNotes] = useState('');

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`/api/micro-deliberation?analysisId=${analysisId}`, {
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = (await res.json()) as { data?: { events?: CapturedEvent[] } };
      setEvents(data.data?.events ?? []);
    } catch {
      // Silent — empty state is acceptable
    } finally {
      setLoading(false);
    }
  }, [analysisId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSubmit = async () => {
    if (!predictedReaction.trim()) {
      setError('Predicted reaction is required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/micro-deliberation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId,
          eventType,
          predictedReaction: predictedReaction.trim(),
          actualReaction: actualReaction.trim() || null,
          confirmed: confirmed === 'pending' ? null : confirmed === 'yes',
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errBody?.error ?? 'Capture failed');
      }
      // Reset form + refresh
      setPredictedReaction('');
      setActualReaction('');
      setConfirmed('pending');
      setNotes('');
      setShowForm(false);
      await fetchEvents();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Capture failed');
    } finally {
      setSubmitting(false);
    }
  };

  const judged = events.filter(e => e.confirmed !== null);
  const confirmedCount = judged.filter(e => e.confirmed === true).length;
  const confirmationRate =
    judged.length === 0 ? null : Math.round((confirmedCount / judged.length) * 100);

  return (
    <div
      className="card"
      style={{
        borderLeft: '3px solid var(--accent-primary)',
      }}
    >
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div className="section-heading" style={{ marginBottom: 4 }}>
              Deliberation events
            </div>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                margin: 0,
                color: 'var(--text-primary)',
                lineHeight: 1.3,
              }}
            >
              Log what actually happened in the room
            </h3>
            <p
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                margin: '4px 0 0',
                lineHeight: 1.5,
                maxWidth: 640,
              }}
            >
              After the IC discussion or board review, log which predictions surfaced and which
              didn&apos;t. Each event compounds your per-org calibration — fast feedback the macro
              outcome flywheel can&apos;t deliver.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(s => !s)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              background: showForm ? 'var(--bg-card)' : 'var(--accent-primary)',
              color: showForm ? 'var(--text-primary)' : '#fff',
              border: showForm ? '1px solid var(--border-color)' : '1px solid var(--accent-primary)',
              borderRadius: 'var(--radius-full)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={14} /> {showForm ? 'Cancel' : 'Log event'}
          </button>
        </div>

        {confirmationRate !== null && events.length >= 2 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '10px 14px',
              background:
                'color-mix(in srgb, var(--accent-primary) 6%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent-primary) 22%, transparent)',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              Calibration so far:
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
              {confirmationRate}% confirmation rate
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              ({confirmedCount}/{judged.length} predictions surfaced as expected)
            </span>
          </div>
        )}

        {showForm && (
          <div
            style={{
              padding: 16,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Event type
              </span>
              <select
                value={eventType}
                onChange={e => setEventType(e.target.value)}
                style={{
                  padding: '8px 10px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                }}
              >
                {EVENT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>
                    {t.label} — {t.hint}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                What did the audit predict would happen?
              </span>
              <textarea
                value={predictedReaction}
                onChange={e => setPredictedReaction(e.target.value.slice(0, 4000))}
                placeholder="e.g. The audit flagged that the IC would push back on the 35% revenue growth assumption given the comparable-set base rate of 18%."
                rows={2}
                style={{
                  padding: '8px 10px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  resize: 'vertical',
                }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                What actually happened? (optional)
              </span>
              <textarea
                value={actualReaction}
                onChange={e => setActualReaction(e.target.value.slice(0, 4000))}
                placeholder="e.g. Sarah from the IC asked about it 12 minutes in; the discussion ran 15 minutes longer than planned."
                rows={2}
                style={{
                  padding: '8px 10px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  resize: 'vertical',
                }}
              />
            </label>

            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Did the audit&apos;s prediction match what surfaced?
              </legend>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(
                  [
                    { value: 'yes', label: 'Yes — confirmed', color: 'var(--success)' },
                    { value: 'no', label: 'No — did not surface', color: 'var(--error)' },
                    { value: 'pending', label: 'Not yet observed', color: 'var(--text-muted)' },
                  ] as const
                ).map(opt => (
                  <label
                    key={opt.value}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      border: `1px solid ${
                        confirmed === opt.value ? opt.color : 'var(--border-color)'
                      }`,
                      borderRadius: 'var(--radius-full)',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                      color: confirmed === opt.value ? opt.color : 'var(--text-primary)',
                      background:
                        confirmed === opt.value
                          ? `color-mix(in srgb, ${opt.color} 8%, transparent)`
                          : 'var(--bg-card)',
                    }}
                  >
                    <input
                      type="radio"
                      name="confirmed"
                      value={opt.value}
                      checked={confirmed === opt.value}
                      onChange={() => setConfirmed(opt.value)}
                      style={{ display: 'none' }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Notes (optional)
              </span>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value.slice(0, 4000))}
                placeholder="Anything else worth capturing — context, surprises, who raised it."
                rows={2}
                style={{
                  padding: '8px 10px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  resize: 'vertical',
                }}
              />
            </label>

            {error && (
              <div
                style={{
                  padding: '8px 12px',
                  background: 'color-mix(in srgb, var(--error) 10%, transparent)',
                  border: '1px solid var(--error)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--error)',
                  fontSize: 12,
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !predictedReaction.trim()}
                style={{
                  padding: '8px 18px',
                  background: 'var(--accent-primary)',
                  color: '#fff',
                  border: '1px solid var(--accent-primary)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: submitting ? 'wait' : 'pointer',
                  opacity: submitting || !predictedReaction.trim() ? 0.6 : 1,
                }}
              >
                {submitting ? 'Saving…' : 'Save event'}
              </button>
            </div>
          </div>
        )}

        {!loading && events.length === 0 && !showForm && (
          <div
            style={{
              padding: '20px 16px',
              textAlign: 'center',
              fontSize: 13,
              color: 'var(--text-muted)',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            No deliberation events logged yet. Use this after the IC / board review to capture
            which predictions surfaced — each event sharpens your per-org calibration.
          </div>
        )}

        {events.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {events.map(event => (
              <div
                key={event.id}
                style={{
                  padding: '12px 14px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {event.eventTypeLabel}
                  </span>
                  <StatusBadge confirmed={event.confirmed} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {new Date(event.capturedAt).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Predicted:</span>{' '}
                  {event.predictedReaction}
                </div>
                {event.actualReaction && (
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Actual:</span>{' '}
                    {event.actualReaction}
                  </div>
                )}
                {event.notes && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    {event.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
