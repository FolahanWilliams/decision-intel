'use client';

/**
 * RejectedDecisionsTab — Anti-Portfolio surface (Bessemer model).
 *
 * Locked 2026-05-10 per Deep Research paper Ch 4. Tracks decisions
 * passed on with explicit rationale + eventual outcome attribution.
 * Surfaces false-negative patterns (decisions we should have made)
 * the same way the audit pipeline surfaces false-positive patterns.
 *
 * Mounted as the third view on /dashboard/decisions (?view=passed).
 */

import { useState } from 'react';
import useSWR from 'swr';
import {
  Loader2,
  Plus,
  XCircle,
  AlertTriangle,
  Building2,
  Briefcase,
  TrendingUp,
} from 'lucide-react';
import { CONTAINER_KINDS, CONTAINER_MODES } from '@/lib/data/decision-container-modes';

interface RejectedDecisionRow {
  id: string;
  name: string;
  decisionFrame: string | null;
  kind: 'investment' | 'acquisition' | 'strategic';
  sector: string | null;
  rejectedAt: string;
  rejectionReason: string;
  passedToCompetitor: boolean;
  competitorName: string | null;
  eventualOutcome: {
    outcomeBand:
      | 'outlier_success'
      | 'modest_success'
      | 'wash'
      | 'modest_failure'
      | 'outlier_failure';
    evidence: string;
    evidenceUrl?: string;
    learnedLesson: string;
    wouldRedecideToday: 'yes' | 'no' | 'still_unclear';
    loggedAt: string;
  } | null;
  eventualOutcomeAttributedAt: string | null;
}

const fetcher = (url: string) =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error('Failed to fetch');
    return r.json();
  });

export function RejectedDecisionsTab() {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [outcomeForId, setOutcomeForId] = useState<string | null>(null);
  const { data, mutate, isLoading } = useSWR<{ rejectedDecisions: RejectedDecisionRow[] }>(
    '/api/rejected-decisions',
    fetcher,
    { revalidateOnFocus: false }
  );

  const rows = data?.rejectedDecisions ?? [];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          gap: 12,
        }}
      >
        <p
          style={{
            fontSize: 'var(--fs-xs)',
            color: 'var(--text-muted)',
            margin: 0,
            maxWidth: 640,
            lineHeight: 1.5,
          }}
        >
          Per Bessemer&rsquo;s Anti-Portfolio model — log every decision you passed on, with the
          rationale at the time + the eventual outcome when it lands. Quarterly review surfaces the
          false negatives (passes that became outliers) so screening heuristics improve instead of
          ossifying.
        </p>
        <button
          type="button"
          onClick={() => setShowRejectModal(true)}
          style={{
            padding: '8px 14px',
            background: 'var(--accent-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--fs-sm)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            flexShrink: 0,
          }}
        >
          <Plus size={14} />
          Log a pass
        </button>
      </div>

      {isLoading && (
        <div
          style={{
            padding: 32,
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 'var(--fs-sm)',
          }}
        >
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      )}

      {!isLoading && rows.length === 0 && (
        <div
          style={{
            padding: '40px 24px',
            textAlign: 'center',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <XCircle
            size={32}
            style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }}
          />
          <p
            style={{
              fontSize: 'var(--fs-sm)',
              color: 'var(--text-secondary)',
              margin: '0 0 8px',
              fontWeight: 600,
            }}
          >
            No passes logged yet.
          </p>
          <p
            style={{
              fontSize: 'var(--fs-xs)',
              color: 'var(--text-muted)',
              margin: 0,
              maxWidth: 480,
              marginInline: 'auto',
              lineHeight: 1.5,
            }}
          >
            Bessemer publishes their famous misses (early passes on Google, Apple, Tesla) as a
            standing organizational discipline. Start your own — log the next pass with the
            rationale at the time.
          </p>
        </div>
      )}

      {rows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map(r => (
            <RejectedDecisionCard key={r.id} row={r} onAttribute={() => setOutcomeForId(r.id)} />
          ))}
        </div>
      )}

      {showRejectModal && (
        <RejectDecisionModal
          onClose={() => setShowRejectModal(false)}
          onSaved={() => {
            setShowRejectModal(false);
            mutate();
          }}
        />
      )}

      {outcomeForId && (
        <AttributeOutcomeModal
          rejectedId={outcomeForId}
          onClose={() => setOutcomeForId(null)}
          onSaved={() => {
            setOutcomeForId(null);
            mutate();
          }}
        />
      )}
    </div>
  );
}

const KIND_ICON = {
  investment: TrendingUp,
  acquisition: Briefcase,
  strategic: Building2,
} as const;

const OUTCOME_BAND_META: Record<
  NonNullable<RejectedDecisionRow['eventualOutcome']>['outcomeBand'],
  { label: string; color: string }
> = {
  outlier_success: { label: 'Outlier success — false negative', color: 'var(--error)' },
  modest_success: { label: 'Modest success', color: 'var(--warning)' },
  wash: { label: 'Wash', color: 'var(--text-muted)' },
  modest_failure: { label: 'Modest failure — pass validated', color: 'var(--info)' },
  outlier_failure: { label: 'Outlier failure — pass validated strongly', color: 'var(--success)' },
};

function RejectedDecisionCard({
  row,
  onAttribute,
}: {
  row: RejectedDecisionRow;
  onAttribute: () => void;
}) {
  const Icon = KIND_ICON[row.kind];
  const outcomeMeta = row.eventualOutcome
    ? OUTCOME_BAND_META[row.eventualOutcome.outcomeBand]
    : null;

  return (
    <div
      style={{
        padding: '14px 16px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderLeft: outcomeMeta ? `3px solid ${outcomeMeta.color}` : '3px solid var(--text-muted)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
          marginBottom: 8,
        }}
      >
        <Icon size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 4,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 'var(--fs-sm)',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              {row.name}
            </h3>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {CONTAINER_MODES[row.kind].label}
            </span>
            {row.sector && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                }}
              >
                · {row.sector}
              </span>
            )}
            <span
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                marginLeft: 'auto',
              }}
            >
              passed {new Date(row.rejectedAt).toLocaleDateString()}
            </span>
          </div>
          {row.decisionFrame && (
            <p
              style={{
                margin: '0 0 6px',
                fontSize: 'var(--fs-xs)',
                color: 'var(--text-secondary)',
                fontStyle: 'italic',
              }}
            >
              &ldquo;{row.decisionFrame}&rdquo;
            </p>
          )}
          <p
            style={{
              margin: '0 0 6px',
              fontSize: 'var(--fs-xs)',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: 'var(--text-primary)' }}>Rationale at the time:</strong>{' '}
            {row.rejectionReason}
          </p>
          {row.passedToCompetitor && row.competitorName && (
            <p
              style={{
                margin: '0 0 6px',
                fontSize: 11,
                color: 'var(--text-muted)',
              }}
            >
              Picked up by {row.competitorName}.
            </p>
          )}
        </div>
      </div>

      {outcomeMeta && row.eventualOutcome ? (
        <div
          style={{
            marginTop: 8,
            padding: '8px 10px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: outcomeMeta.color,
              }}
            >
              {outcomeMeta.label}
            </span>
          </div>
          <p
            style={{
              margin: '0 0 4px',
              fontSize: 'var(--fs-xs)',
              color: 'var(--text-primary)',
            }}
          >
            {row.eventualOutcome.evidence}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              color: 'var(--text-muted)',
              lineHeight: 1.5,
            }}
          >
            <strong>Lesson:</strong> {row.eventualOutcome.learnedLesson}{' '}
            {row.eventualOutcome.wouldRedecideToday === 'no' && (
              <span style={{ color: 'var(--error)', marginLeft: 4 }}>
                — would have redecided today.
              </span>
            )}
            {row.eventualOutcome.wouldRedecideToday === 'yes' && (
              <span style={{ color: 'var(--success)', marginLeft: 4 }}>— pass still right.</span>
            )}
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={onAttribute}
          style={{
            marginTop: 4,
            padding: '6px 10px',
            background: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            fontSize: 11,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <AlertTriangle size={11} />
          Attribute eventual outcome
        </button>
      )}
    </div>
  );
}

function RejectDecisionModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [decisionFrame, setDecisionFrame] = useState('');
  const [kind, setKind] = useState<'investment' | 'acquisition' | 'strategic'>('investment');
  const [sector, setSector] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [passedToCompetitor, setPassedToCompetitor] = useState(false);
  const [competitorName, setCompetitorName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (name.trim().length === 0) {
      setError('Name is required.');
      return;
    }
    if (rejectionReason.trim().length === 0) {
      setError("Rationale is required — that's the load-bearing field.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/rejected-decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          decisionFrame: decisionFrame.trim() || undefined,
          kind,
          sector: sector.trim() || undefined,
          rejectionReason: rejectionReason.trim(),
          passedToCompetitor,
          competitorName: passedToCompetitor ? competitorName.trim() || undefined : undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'Failed to save');
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell onClose={onClose} title="Log a pass">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Name (target / company / fund opportunity)">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value.slice(0, 200))}
            placeholder="e.g. Project Heliograph"
            style={inputStyle}
          />
        </Field>
        <Field label="Decision frame (optional)">
          <input
            type="text"
            value={decisionFrame}
            onChange={e => setDecisionFrame(e.target.value.slice(0, 500))}
            placeholder="One-line framing of what the decision was"
            style={inputStyle}
          />
        </Field>
        <Field label="Decision class">
          <div style={{ display: 'flex', gap: 8 }}>
            {CONTAINER_KINDS.map(k => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${kind === k ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                  background:
                    kind === k
                      ? 'color-mix(in srgb, var(--accent-primary) 10%, var(--bg-card))'
                      : 'var(--bg-card)',
                  fontSize: 'var(--fs-xs)',
                  fontWeight: 600,
                  color: kind === k ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {CONTAINER_MODES[k].label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Sector (optional)">
          <input
            type="text"
            value={sector}
            onChange={e => setSector(e.target.value.slice(0, 100))}
            placeholder="e.g. consumer fintech, industrial automation"
            style={inputStyle}
          />
        </Field>
        <Field label="Rationale at the time" required>
          <textarea
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value.slice(0, 5000))}
            rows={4}
            placeholder="Why did you pass? Be specific — this is the field future-you will compare against the eventual outcome."
            style={{ ...inputStyle, resize: 'vertical', minHeight: 90 }}
          />
        </Field>
        <Field label="Did a competitor pick this up?">
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 'var(--fs-sm)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={passedToCompetitor}
              onChange={e => setPassedToCompetitor(e.target.checked)}
            />
            Yes, picked up by another firm
          </label>
          {passedToCompetitor && (
            <input
              type="text"
              value={competitorName}
              onChange={e => setCompetitorName(e.target.value.slice(0, 200))}
              placeholder="Competitor / acquirer name"
              style={{ ...inputStyle, marginTop: 8 }}
            />
          )}
        </Field>
      </div>

      {error && (
        <p
          role="alert"
          style={{ margin: '12px 0 0', fontSize: 'var(--fs-xs)', color: 'var(--error)' }}
        >
          {error}
        </p>
      )}

      <ModalFooter
        submitLabel="Log pass"
        submitting={submitting}
        onCancel={onClose}
        onSubmit={handleSave}
      />
    </ModalShell>
  );
}

function AttributeOutcomeModal({
  rejectedId,
  onClose,
  onSaved,
}: {
  rejectedId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [outcomeBand, setOutcomeBand] =
    useState<NonNullable<RejectedDecisionRow['eventualOutcome']>['outcomeBand']>('wash');
  const [evidence, setEvidence] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [learnedLesson, setLearnedLesson] = useState('');
  const [wouldRedecideToday, setWouldRedecideToday] = useState<'yes' | 'no' | 'still_unclear'>(
    'still_unclear'
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (evidence.trim().length === 0 || learnedLesson.trim().length === 0) {
      setError('Evidence + lesson are both required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/rejected-decisions/${rejectedId}/outcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outcomeBand,
          evidence: evidence.trim(),
          evidenceUrl: evidenceUrl.trim() || undefined,
          learnedLesson: learnedLesson.trim(),
          wouldRedecideToday,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'Failed to attribute outcome');
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell onClose={onClose} title="Attribute eventual outcome">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Outcome band">
          <select
            value={outcomeBand}
            onChange={e =>
              setOutcomeBand(
                e.target.value as NonNullable<RejectedDecisionRow['eventualOutcome']>['outcomeBand']
              )
            }
            style={inputStyle}
          >
            {Object.entries(OUTCOME_BAND_META).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Evidence" required>
          <textarea
            value={evidence}
            onChange={e => setEvidence(e.target.value.slice(0, 2000))}
            rows={3}
            placeholder="Headline, news, financial disclosure, deal-database entry"
            style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }}
          />
        </Field>
        <Field label="Evidence URL (optional)">
          <input
            type="url"
            value={evidenceUrl}
            onChange={e => setEvidenceUrl(e.target.value.slice(0, 1000))}
            placeholder="https://..."
            style={inputStyle}
          />
        </Field>
        <Field label="Lesson learned" required>
          <textarea
            value={learnedLesson}
            onChange={e => setLearnedLesson(e.target.value.slice(0, 5000))}
            rows={3}
            placeholder="What does this outcome change about how you screen similar decisions?"
            style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }}
          />
        </Field>
        <Field label="Would you make the same pass today?">
          <div style={{ display: 'flex', gap: 8 }}>
            {(['yes', 'still_unclear', 'no'] as const).map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setWouldRedecideToday(opt)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${wouldRedecideToday === opt ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                  background:
                    wouldRedecideToday === opt
                      ? 'color-mix(in srgb, var(--accent-primary) 10%, var(--bg-card))'
                      : 'var(--bg-card)',
                  fontSize: 'var(--fs-xs)',
                  fontWeight: 600,
                  color:
                    wouldRedecideToday === opt ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {opt.replace('_', ' ')}
              </button>
            ))}
          </div>
        </Field>
      </div>

      {error && (
        <p
          role="alert"
          style={{ margin: '12px 0 0', fontSize: 'var(--fs-xs)', color: 'var(--error)' }}
        >
          {error}
        </p>
      )}

      <ModalFooter
        submitLabel="Save attribution"
        submitting={submitting}
        onCancel={onClose}
        onSubmit={handleSave}
      />
    </ModalShell>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  fontSize: 'var(--fs-sm)',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
};

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)',
          marginBottom: 6,
        }}
      >
        {label}
        {required && <span style={{ color: 'var(--error)', marginLeft: 4 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function ModalShell({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(2px)',
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 560,
          maxHeight: '90vh',
          overflow: 'auto',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          padding: 24,
        }}
      >
        <h3
          style={{
            margin: '0 0 16px',
            fontSize: 'var(--fs-md)',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}

function ModalFooter({
  submitLabel,
  submitting,
  onCancel,
  onSubmit,
}: {
  submitLabel: string;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
      <button
        type="button"
        onClick={onCancel}
        disabled={submitting}
        style={{
          padding: '8px 14px',
          background: 'transparent',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--fs-sm)',
          color: 'var(--text-secondary)',
          cursor: submitting ? 'not-allowed' : 'pointer',
        }}
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        style={{
          padding: '8px 14px',
          background: submitting ? 'var(--bg-elevated)' : 'var(--accent-primary)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--fs-sm)',
          fontWeight: 600,
          color: submitting ? 'var(--text-muted)' : '#fff',
          cursor: submitting ? 'not-allowed' : 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {submitting && <Loader2 size={14} className="animate-spin" />}
        {submitLabel}
      </button>
    </div>
  );
}
