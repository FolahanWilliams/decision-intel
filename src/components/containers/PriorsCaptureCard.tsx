'use client';

/**
 * PriorsCaptureCard — captures the user's pre-artefact reasoning
 * (conviction + kill criteria + intermediate-proxy micro-predictions)
 * BEFORE the IC memo is filed and the audit pipeline runs.
 *
 * Locked 2026-05-10. Per Deep Research paper Ch 1 / Finding #1
 * (formalization-reality discontinuity). The actual cognitive
 * commitment is forged before the artefact lands; the artefact is
 * post-hoc rationalization. Capturing pre-artefact priors gives the
 * audit something honest to compare against.
 *
 * Two modes:
 *   - `persist` (default) — mounted on the container detail page when
 *     container.priors is null AND analyzedDocCount === 0. POSTs to
 *     /api/decisions/[id]/priors directly.
 *   - `draft` (T2.3, locked 2026-05-10) — mounted on /dashboard/
 *     decisions/new BEFORE the container exists. Persists to
 *     localStorage; the new-container creation flow calls
 *     flushDraftPriorsToContainer(id) on success.
 *
 * Each micro-prediction captures a verifiable proxy outcome the user
 * is willing to be Brier-scored on (paper Ch 9 — collapses the
 * calibration feedback loop from terminal-IRR to per-prediction horizon).
 */

import { useEffect, useState } from 'react';
import { Lightbulb, Loader2, Plus, Target, Trash2, XCircle, CheckCircle } from 'lucide-react';
import { saveDraftPriors, loadDraftPriors, clearDraftPriors } from '@/lib/priors/draft-handoff';

const CONVICTION_LEVELS = [
  { value: 'low', label: 'Low — exploring' },
  { value: 'medium', label: 'Medium — leaning yes' },
  { value: 'high', label: 'High — committed' },
  { value: 'very_high', label: 'Very high — IC-ready' },
] as const;

const HORIZON_OPTIONS = [
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
  { value: 180, label: '180 days' },
] as const;

interface MicroPrediction {
  prediction: string;
  horizonDays: number;
  confidence: number;
}

interface PriorsCaptureCardProps {
  /** Required when mode='persist'. Optional in draft mode. */
  containerId?: string;
  /** User-facing label. In draft mode this can be a placeholder like
   *  "this decision" until the user has named the container. */
  containerName: string;
  /** Capture mode (locked 2026-05-10 per T2.3):
   *    - 'persist' (default) — POST directly to /api/decisions/[id]/priors
   *    - 'draft' — persist to localStorage; container creation flow
   *      flushes via flushDraftPriorsToContainer(id) on success */
  mode?: 'persist' | 'draft';
  onSaved?: () => void;
  /// When provided, hides the card entirely after save.
  dismissible?: boolean;
}

export function PriorsCaptureCard({
  containerId,
  containerName,
  mode = 'persist',
  onSaved,
  dismissible = true,
}: PriorsCaptureCardProps) {
  const [convictionLevel, setConvictionLevel] = useState<'low' | 'medium' | 'high' | 'very_high'>(
    'medium'
  );
  const [convictionRationale, setConvictionRationale] = useState('');
  const [killCriteria, setKillCriteria] = useState<string[]>(['']);
  const [microPredictions, setMicroPredictions] = useState<MicroPrediction[]>([
    { prediction: '', horizonDays: 90, confidence: 0.7 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Hydrate draft mode from localStorage on mount — lets a user navigate
  // away from the new-decision page and come back without losing input.
  useEffect(() => {
    if (mode !== 'draft') return;
    const draft = loadDraftPriors();
    if (draft) {
      setConvictionLevel(draft.convictionLevel);
      setConvictionRationale(draft.convictionRationale);
      setKillCriteria(draft.killCriteria.length > 0 ? draft.killCriteria : ['']);
      setMicroPredictions(
        draft.microPredictions.length > 0
          ? draft.microPredictions
          : [{ prediction: '', horizonDays: 90, confidence: 0.7 }]
      );
      setSaved(true);
    }
  }, [mode]);

  if (hidden) return null;

  const handleSave = async () => {
    setError(null);
    const filteredKillCriteria = killCriteria.filter(s => s.trim().length > 0);
    const filteredPredictions = microPredictions.filter(p => p.prediction.trim().length > 0);
    if (convictionRationale.trim().length === 0) {
      setError('Conviction rationale is required.');
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'draft') {
        // T2.3 — persist to localStorage; container creation flow flushes.
        saveDraftPriors({
          convictionLevel,
          convictionRationale: convictionRationale.trim(),
          killCriteria: filteredKillCriteria,
          microPredictions: filteredPredictions,
          draftedAt: new Date().toISOString(),
        });
        setSaved(true);
        onSaved?.();
        // Don't auto-hide in draft mode — the user might want to edit
        // before submitting the parent form.
      } else {
        if (!containerId) {
          throw new Error('containerId required in persist mode');
        }
        const res = await fetch(`/api/decisions/${containerId}/priors`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            convictionLevel,
            convictionRationale: convictionRationale.trim(),
            killCriteria: filteredKillCriteria,
            microPredictions: filteredPredictions,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? 'Failed to save priors');
        }
        setSaved(true);
        onSaved?.();
        if (dismissible) {
          setTimeout(() => setHidden(true), 1500);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save priors');
    } finally {
      setSubmitting(false);
    }
  };

  // In draft mode, support discard-draft action.
  const handleDiscard = () => {
    clearDraftPriors();
    setConvictionLevel('medium');
    setConvictionRationale('');
    setKillCriteria(['']);
    setMicroPredictions([{ prediction: '', horizonDays: 90, confidence: 0.7 }]);
    setSaved(false);
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderTop: '3px solid var(--info)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        marginBottom: 16,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Lightbulb size={16} style={{ color: 'var(--info)' }} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--info)',
          }}
        >
          Capture your priors
        </span>
      </div>
      <h2
        style={{
          fontSize: 'var(--fs-md)',
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: '0 0 6px',
        }}
      >
        {mode === 'draft'
          ? `Before you create ${containerName}, name your reasoning.`
          : `Before the audit runs on ${containerName}, name your reasoning.`}
      </h2>
      <p
        style={{
          fontSize: 'var(--fs-xs)',
          color: 'var(--text-muted)',
          margin: '0 0 16px',
          lineHeight: 1.5,
        }}
      >
        The cognitive commitment is forged before the IC memo lands. Capturing your conviction now —
        and the specific predictions you&rsquo;d stake your reasoning on — gives the audit something
        honest to compare against. Per Klein &amp; Mitchell 1995, prospective hindsight produces
        25-30% more failure-cause insights than conditional voice.
      </p>

      {/* Conviction level */}
      <fieldset
        style={{
          margin: '0 0 16px',
          padding: 0,
          border: 'none',
        }}
      >
        <legend
          style={{
            padding: 0,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            marginBottom: 8,
          }}
        >
          Conviction level
        </legend>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {CONVICTION_LEVELS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setConvictionLevel(opt.value)}
              disabled={submitting || saved}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${convictionLevel === opt.value ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                background:
                  convictionLevel === opt.value
                    ? 'color-mix(in srgb, var(--accent-primary) 10%, var(--bg-card))'
                    : 'var(--bg-card)',
                fontSize: 'var(--fs-xs)',
                fontWeight: 600,
                color:
                  convictionLevel === opt.value ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: submitting || saved ? 'not-allowed' : 'pointer',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <textarea
          value={convictionRationale}
          onChange={e => setConvictionRationale(e.target.value.slice(0, 2000))}
          placeholder="Why this conviction level? (1-2 sentences in your own voice — what makes you lean this way?)"
          rows={3}
          disabled={submitting || saved}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: 'var(--fs-sm)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontFamily: 'inherit',
            resize: 'vertical',
            minHeight: 64,
          }}
        />
      </fieldset>

      {/* Kill criteria */}
      <fieldset
        style={{
          margin: '0 0 16px',
          padding: 0,
          border: 'none',
        }}
      >
        <legend
          style={{
            padding: 0,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            marginBottom: 8,
          }}
        >
          Kill criteria — what would make you walk away?
        </legend>
        {killCriteria.map((kc, i) => (
          <div
            key={i}
            style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'flex-start' }}
          >
            <XCircle
              size={14}
              style={{ color: 'var(--text-muted)', marginTop: 10, flexShrink: 0 }}
            />
            <input
              type="text"
              value={kc}
              onChange={e => {
                const next = [...killCriteria];
                next[i] = e.target.value.slice(0, 500);
                setKillCriteria(next);
              }}
              placeholder="e.g. Customer concentration > 40% by Q2 close"
              disabled={submitting || saved}
              style={{
                flex: 1,
                padding: '8px 10px',
                fontSize: 'var(--fs-sm)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
              }}
            />
            {killCriteria.length > 1 && (
              <button
                type="button"
                onClick={() => setKillCriteria(killCriteria.filter((_, ii) => ii !== i))}
                aria-label="Remove kill criterion"
                disabled={submitting || saved}
                style={{
                  padding: 6,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: submitting || saved ? 'not-allowed' : 'pointer',
                  display: 'flex',
                }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setKillCriteria([...killCriteria, ''])}
          disabled={submitting || saved}
          style={{
            padding: '4px 8px',
            background: 'transparent',
            border: 'none',
            fontSize: 'var(--fs-xs)',
            color: 'var(--accent-primary)',
            cursor: submitting || saved ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Plus size={12} /> Add criterion
        </button>
      </fieldset>

      {/* Micro-predictions */}
      <fieldset
        style={{
          margin: '0 0 16px',
          padding: 0,
          border: 'none',
        }}
      >
        <legend
          style={{
            padding: 0,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            marginBottom: 8,
          }}
        >
          Intermediate proxy predictions (Brier-scored)
        </legend>
        <p
          style={{
            margin: '0 0 8px',
            fontSize: 'var(--fs-xs)',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}
        >
          Name 1-3 specific verifiable predictions that, if proven wrong by the horizon, would
          falsify your reasoning. Per paper Ch 9, these collapse the calibration loop from
          terminal-IRR (5-10 yr) to per-prediction horizon.
        </p>
        {microPredictions.map((mp, i) => (
          <div
            key={i}
            style={{
              padding: 10,
              marginBottom: 8,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 6 }}>
              <Target size={14} style={{ color: 'var(--info)', marginTop: 6, flexShrink: 0 }} />
              <input
                type="text"
                value={mp.prediction}
                onChange={e => {
                  const next = [...microPredictions];
                  next[i] = { ...mp, prediction: e.target.value.slice(0, 500) };
                  setMicroPredictions(next);
                }}
                placeholder="e.g. Integration cost will not exceed $5M in Q1"
                disabled={submitting || saved}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  fontSize: 'var(--fs-sm)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                }}
              />
              {microPredictions.length > 1 && (
                <button
                  type="button"
                  onClick={() => setMicroPredictions(microPredictions.filter((_, ii) => ii !== i))}
                  aria-label="Remove prediction"
                  disabled={submitting || saved}
                  style={{
                    padding: 4,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: submitting || saved ? 'not-allowed' : 'pointer',
                    display: 'flex',
                  }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                Horizon:
                <select
                  value={mp.horizonDays}
                  onChange={e => {
                    const next = [...microPredictions];
                    next[i] = { ...mp, horizonDays: Number(e.target.value) };
                    setMicroPredictions(next);
                  }}
                  disabled={submitting || saved}
                  style={{
                    marginLeft: 6,
                    padding: '2px 6px',
                    fontSize: 'var(--fs-xs)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {HORIZON_OPTIONS.map(h => (
                    <option key={h.value} value={h.value}>
                      {h.label}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                Confidence:
                <input
                  type="range"
                  min="0.1"
                  max="0.99"
                  step="0.05"
                  value={mp.confidence}
                  onChange={e => {
                    const next = [...microPredictions];
                    next[i] = { ...mp, confidence: Number(e.target.value) };
                    setMicroPredictions(next);
                  }}
                  disabled={submitting || saved}
                  style={{ marginLeft: 6, verticalAlign: 'middle' }}
                />
                <span style={{ marginLeft: 6, color: 'var(--text-secondary)' }}>
                  {(mp.confidence * 100).toFixed(0)}%
                </span>
              </label>
            </div>
          </div>
        ))}
        {microPredictions.length < 5 && (
          <button
            type="button"
            onClick={() =>
              setMicroPredictions([
                ...microPredictions,
                { prediction: '', horizonDays: 90, confidence: 0.7 },
              ])
            }
            disabled={submitting || saved}
            style={{
              padding: '4px 8px',
              background: 'transparent',
              border: 'none',
              fontSize: 'var(--fs-xs)',
              color: 'var(--accent-primary)',
              cursor: submitting || saved ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Plus size={12} /> Add prediction
          </button>
        )}
      </fieldset>

      {error && (
        <p
          role="alert"
          style={{
            margin: '0 0 12px',
            fontSize: 'var(--fs-xs)',
            color: 'var(--error)',
          }}
        >
          {error}
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        {saved && mode === 'draft' && (
          <button
            type="button"
            onClick={handleDiscard}
            disabled={submitting}
            style={{
              padding: '8px 14px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--fs-sm)',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            Discard draft
          </button>
        )}
        {saved ? (
          <span
            style={{
              padding: '8px 16px',
              background: 'color-mix(in srgb, var(--success) 12%, transparent)',
              color: 'var(--success)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--fs-sm)',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <CheckCircle size={14} />
            {mode === 'draft' ? 'Draft saved — will flush on create' : 'Priors saved'}
          </span>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            disabled={submitting || convictionRationale.trim().length === 0}
            style={{
              padding: '8px 16px',
              background:
                submitting || convictionRationale.trim().length === 0
                  ? 'var(--bg-elevated)'
                  : 'var(--accent-primary)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--fs-sm)',
              fontWeight: 600,
              color:
                submitting || convictionRationale.trim().length === 0
                  ? 'var(--text-muted)'
                  : '#fff',
              cursor:
                submitting || convictionRationale.trim().length === 0 ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {mode === 'draft' ? 'Save draft' : 'Save priors'}
          </button>
        )}
      </div>
    </div>
  );
}
