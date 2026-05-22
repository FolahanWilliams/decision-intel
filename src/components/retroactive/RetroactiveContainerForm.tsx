'use client';

/**
 * RetroactiveContainerForm — modal-style finalization form for a single
 * BulkPair. Collects (a) container identity (kind, name, decisionFrame,
 * sector), (b) historical decidedAt + outcomeKnownAt, (c) optional
 * outcomeOnCreate metrics keyed off the mode's outcomeShape, then POSTs
 * to /api/containers with isRetroactive: true. Locked 2026-05-21.
 *
 * If the pair carries an outcomeDraft, the narrative + direction are
 * pre-filled. The founder edits before submit; nothing is fabricated.
 */

import { useEffect, useMemo, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { AccentCard } from '@/components/ui/AccentCard';
import {
  CONTAINER_KINDS,
  CONTAINER_MODES,
  getContainerMode,
  type DecisionContainerKind,
  type OutcomeMetricField,
} from '@/lib/data/decision-container-modes';
import type { BulkPair } from '@/lib/retroactive/types';

export interface RetroactiveContainerFormProps {
  pair: BulkPair;
  batchId: string;
  onClose: () => void;
  onCreated: (containerId: string) => void;
}

interface FormState {
  kind: DecisionContainerKind;
  name: string;
  decisionFrame: string;
  targetCompany: string;
  sector: string;
  decidedAt: string;
  outcomeKnownAt: string;
  sourceProvenance: string;
  summary: string;
  metrics: Record<string, string>;
}

function initialKindFromDraft(_pair: BulkPair): DecisionContainerKind {
  // Without an explicit signal we default to 'investment' — the most
  // common Sankore shape. The founder can switch in the UI before
  // submit; the kind picker is the first field.
  return 'investment';
}

function bandLabel(band: BulkPair['band']): string {
  return band === 'auto_high'
    ? 'auto_high'
    : band === 'auto_medium'
      ? 'auto_medium'
      : band === 'auto_low'
        ? 'auto_low'
        : 'manual';
}

function isoTodayMinus(monthsBack: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsBack);
  return d.toISOString().slice(0, 10);
}

function MetricInput({
  field,
  value,
  onChange,
}: {
  field: OutcomeMetricField;
  value: string;
  onChange: (next: string) => void;
}) {
  const common = {
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onChange(e.target.value),
    style: {
      width: '100%',
      padding: '8px 10px',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--bg-card)',
      color: 'var(--text-primary)',
      fontSize: 13,
    },
  };

  if (field.type === 'enum' && field.options) {
    return (
      <select {...common}>
        <option value="">—</option>
        {field.options.map(opt => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === 'text') {
    return (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={2}
        style={{
          ...common.style,
          fontFamily: 'inherit',
          resize: 'vertical',
        }}
      />
    );
  }

  const inputType =
    field.type === 'percent' || field.type === 'number' || field.type === 'months'
      ? 'number'
      : field.type === 'currency'
        ? 'number'
        : 'text';
  const step = field.type === 'percent' || field.type === 'number' ? 'any' : '1';
  return <input type={inputType} step={step} {...common} />;
}

export function RetroactiveContainerForm({
  pair,
  batchId,
  onClose,
  onCreated,
}: RetroactiveContainerFormProps) {
  const [state, setState] = useState<FormState>(() => ({
    kind: initialKindFromDraft(pair),
    name: pair.memoDoc.filename.replace(/\.[^.]+$/, ''),
    decisionFrame: '',
    targetCompany: '',
    sector: '',
    decidedAt: pair.memoDoc.inferredDate ?? isoTodayMinus(24),
    outcomeKnownAt: pair.outcomeDoc?.inferredDate ?? isoTodayMinus(0),
    sourceProvenance: pair.outcomeDoc
      ? `Paired with ${pair.outcomeDoc.filename}`
      : 'Outcome filled by hand',
    summary: pair.outcomeDraft?.draftNarrative ?? '',
    metrics: {},
  }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mode = useMemo(() => getContainerMode(state.kind), [state.kind]);

  // Pre-fill metrics from outcomeDraft.draftMetrics when key matches.
  useEffect(() => {
    if (!pair.outcomeDraft?.draftMetrics) return;
    const fromDraft: Record<string, string> = {};
    for (const m of pair.outcomeDraft.draftMetrics) {
      const matchedField = mode.outcomeShape.fields.find(f =>
        f.key.toLowerCase().includes(m.label.toLowerCase().slice(0, 6))
      );
      if (matchedField) fromDraft[matchedField.key] = m.value;
    }
    if (Object.keys(fromDraft).length > 0) {
      setState(prev => ({ ...prev, metrics: { ...prev.metrics, ...fromDraft } }));
    }
  }, [pair.outcomeDraft, mode.outcomeShape.fields]);

  const setMetric = (key: string, value: string) =>
    setState(prev => ({ ...prev, metrics: { ...prev.metrics, [key]: value } }));

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      // Convert metrics from string → typed values per field shape.
      const metricsBlob: Record<string, unknown> = {};
      for (const field of mode.outcomeShape.fields) {
        const raw = state.metrics[field.key];
        if (raw == null || raw === '') continue;
        if (
          field.type === 'percent' ||
          field.type === 'number' ||
          field.type === 'currency' ||
          field.type === 'months'
        ) {
          const parsed = parseFloat(raw);
          if (!Number.isFinite(parsed)) continue;
          metricsBlob[field.key] = parsed;
        } else {
          metricsBlob[field.key] = raw;
        }
      }

      const res = await fetch('/api/containers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: state.kind,
          name: state.name.trim(),
          decisionFrame: state.decisionFrame.trim() || undefined,
          targetCompany: state.targetCompany.trim() || undefined,
          sector: state.sector.trim() || undefined,
          isRetroactive: true,
          retroactiveMetadata: {
            decidedAt: new Date(state.decidedAt).toISOString(),
            outcomeKnownAt: new Date(state.outcomeKnownAt).toISOString(),
            sourceProvenance: state.sourceProvenance.trim() || undefined,
            bulkUploadBatchId: batchId,
            pairingConfidence: pair.confidence,
            pairingMethod: bandLabel(pair.band),
          },
          outcomeOnCreate: {
            summary: state.summary.trim(),
            metrics: metricsBlob,
          },
        }),
      });
      if (!res.ok) {
        // canonical res.json() body-parse exception class — surface
        // the API's diagnostic when present, otherwise the HTTP status.
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `Create failed (HTTP ${res.status})`);
      }
      const json = (await res.json()) as { id: string };
      onCreated(json.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'color-mix(in srgb, #000 35%, transparent)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: 32,
        zIndex: 50,
        overflowY: 'auto',
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          maxWidth: 640,
          width: '100%',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--accent-primary)',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontWeight: 600,
              }}
            >
              Retroactive container · pairing {Math.round(pair.confidence * 100)}%
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginTop: 2,
              }}
            >
              Finalize historical decision
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              color: 'var(--text-muted)',
              display: 'flex',
            }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <Field label="Decision kind">
            <select
              value={state.kind}
              onChange={e =>
                setState(prev => ({ ...prev, kind: e.target.value as DecisionContainerKind }))
              }
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: 13,
              }}
            >
              {CONTAINER_KINDS.map(k => (
                <option key={k} value={k}>
                  {CONTAINER_MODES[k].label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Container name">
            <input
              value={state.name}
              onChange={e => setState(prev => ({ ...prev, name: e.target.value }))}
              required
              style={inputStyle}
            />
          </Field>

          <Field label="Decision frame (optional)">
            <textarea
              value={state.decisionFrame}
              onChange={e => setState(prev => ({ ...prev, decisionFrame: e.target.value }))}
              rows={2}
              placeholder="What was the call? (1-2 sentences)"
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <Field label="Target / counterparty (optional)">
              <input
                value={state.targetCompany}
                onChange={e => setState(prev => ({ ...prev, targetCompany: e.target.value }))}
                style={inputStyle}
              />
            </Field>
            <Field label="Sector (optional)">
              <input
                value={state.sector}
                onChange={e => setState(prev => ({ ...prev, sector: e.target.value }))}
                style={inputStyle}
              />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <Field label="Decided at">
              <input
                type="date"
                value={state.decidedAt}
                onChange={e => setState(prev => ({ ...prev, decidedAt: e.target.value }))}
                required
                style={inputStyle}
              />
            </Field>
            <Field label="Outcome known at">
              <input
                type="date"
                value={state.outcomeKnownAt}
                onChange={e => setState(prev => ({ ...prev, outcomeKnownAt: e.target.value }))}
                required
                style={inputStyle}
              />
            </Field>
          </div>

          <Field label="Source provenance">
            <input
              value={state.sourceProvenance}
              onChange={e => setState(prev => ({ ...prev, sourceProvenance: e.target.value }))}
              placeholder="e.g. IC memo + post-mortem from Q4 2023"
              style={inputStyle}
            />
          </Field>

          <div
            style={{
              borderTop: '1px solid var(--border-color)',
              paddingTop: 14,
              marginTop: 4,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: 10,
              }}
            >
              Outcome ({mode.outcomeShape.primaryMetricLabel})
            </div>

            <Field label="Outcome summary (≥ 10 chars)">
              <textarea
                value={state.summary}
                onChange={e => setState(prev => ({ ...prev, summary: e.target.value }))}
                rows={3}
                required
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </Field>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 12,
                marginTop: 10,
              }}
            >
              {mode.outcomeShape.fields.map(field => (
                <Field key={field.key} label={field.label}>
                  <MetricInput
                    field={field}
                    value={state.metrics[field.key] ?? ''}
                    onChange={v => setMetric(field.key, v)}
                  />
                </Field>
              ))}
            </div>
          </div>

          {error && (
            <AccentCard accent="danger" tinted>
              <span style={{ fontSize: 13, color: 'var(--error)' }}>{error}</span>
            </AccentCard>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              paddingTop: 8,
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '8px 14px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: 13,
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={submitting || state.summary.trim().length < 10 || state.name.trim() === ''}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-primary)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 500,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity:
                  submitting || state.summary.trim().length < 10 || state.name.trim() === ''
                    ? 0.6
                    : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Creating…</span>
                </>
              ) : (
                <span>Create retroactive container</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
  fontSize: 13,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        fontSize: 12,
        color: 'var(--text-secondary)',
        fontWeight: 500,
      }}
    >
      <span>{label}</span>
      {children}
    </label>
  );
}
