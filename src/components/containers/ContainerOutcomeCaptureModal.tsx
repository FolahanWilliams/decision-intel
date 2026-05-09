'use client';

/**
 * ContainerOutcomeCaptureModal — mode-aware outcome capture form.
 *
 * Reads the metric field schema from CONTAINER_MODES[kind].outcomeShape.fields
 * and renders one input per field with type-appropriate widget (number /
 * percent / currency / enum / months / text). Server validates the
 * metrics blob against the same schema in /api/containers/[id]/outcome.
 *
 * Outcome capture is the wedge-motion completion: without this,
 * Outcome Gate enforcement + per-org Brier accumulation + Vohra PMF
 * graduation all stall. Phase 3 P3.1 ships the missing UI piece.
 */

import { useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import {
  getContainerMode,
  type DecisionContainerKind,
  type OutcomeMetricField,
} from '@/lib/data/decision-container-modes';

interface ContainerOutcomeCaptureModalProps {
  containerId: string;
  containerKind: DecisionContainerKind;
  containerName: string;
  /** Pre-fill values when editing an existing outcome. */
  initialSummary?: string;
  initialMetrics?: Record<string, unknown>;
  onClose: () => void;
  onSaved: () => void;
}

export function ContainerOutcomeCaptureModal({
  containerId,
  containerKind,
  containerName,
  initialSummary,
  initialMetrics,
  onClose,
  onSaved,
}: ContainerOutcomeCaptureModalProps) {
  const mode = getContainerMode(containerKind);
  const [summary, setSummary] = useState(initialSummary ?? '');
  const [metrics, setMetrics] = useState<Record<string, unknown>>(initialMetrics ?? {});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFieldChange = (key: string, value: unknown) => {
    setMetrics(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (summary.trim().length < 10) {
      setError('Outcome summary must be at least 10 characters.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/containers/${containerId}/outcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: summary.trim(), metrics }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to save outcome');
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save outcome');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.40)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          maxWidth: 560,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          <div
            style={{
              fontSize: 'var(--fs-3xs)',
              textTransform: 'uppercase',
              letterSpacing: '0.10em',
              color: 'var(--text-muted)',
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            {mode.label} outcome
          </div>
          <h2 style={{ fontSize: 'var(--fs-lg)', fontWeight: 600, marginBottom: 4 }}>
            {containerName}
          </h2>
          <p
            style={{
              fontSize: 'var(--fs-sm)',
              color: 'var(--text-secondary)',
              marginBottom: 20,
            }}
          >
            Capture how this {mode.label.toLowerCase()} actually played out. Every closed outcome
            sharpens your DQI calibration AND contributes to the Bias Genome cross-org learning
            surface.
          </p>

          {/* Summary — required */}
          <div style={{ marginBottom: 16 }}>
            <Label required>Plain-English summary</Label>
            <textarea
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder={
                containerKind === 'investment'
                  ? 'How did this investment play out vs. our IC thesis? What did we miss?'
                  : containerKind === 'acquisition'
                    ? 'How did the synergies actually realize vs. the model? Integration milestones?'
                    : 'Did the forecast hold? What changed between commit and outcome?'
              }
              rows={3}
              required
              minLength={10}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* Mode-specific metric fields */}
          {mode.outcomeShape.fields.map(field => (
            <FieldRenderer
              key={field.key}
              field={field}
              value={metrics[field.key]}
              onChange={v => handleFieldChange(field.key, v)}
            />
          ))}

          <div
            style={{
              padding: '8px 10px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(22, 163, 74, 0.06)',
              borderLeft: '3px solid var(--accent-primary)',
              fontSize: 'var(--fs-xs)',
              color: 'var(--text-secondary)',
              marginBottom: 16,
              display: 'flex',
              gap: 8,
              alignItems: 'flex-start',
            }}
          >
            <CheckCircle2
              size={14}
              style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }}
            />
            <span>
              All metric fields are optional — partial outcomes are useful (e.g. an early
              synergy-realisation stamp before the deal exits). The summary is the minimum;
              everything else can land progressively.
            </span>
          </div>

          {error && (
            <div
              style={{
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.06)',
                color: 'var(--error)',
                fontSize: 'var(--fs-sm)',
                marginBottom: 12,
                display: 'flex',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: 'var(--fs-sm)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                background: submitting ? 'var(--bg-secondary)' : 'var(--accent-primary)',
                border: 'none',
                color: '#fff',
                fontSize: 'var(--fs-sm)',
                fontWeight: 600,
                cursor: submitting ? 'wait' : 'pointer',
              }}
            >
              {submitting ? 'Saving…' : 'Save outcome'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: OutcomeMetricField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const stringValue =
    value == null
      ? ''
      : typeof value === 'string' || typeof value === 'number'
        ? String(value)
        : '';

  if (field.type === 'enum' && field.options) {
    return (
      <div style={{ marginBottom: 12 }}>
        <Label primary={field.primary}>{field.label}</Label>
        <select
          value={stringValue}
          onChange={e => onChange(e.target.value || undefined)}
          style={inputStyle}
        >
          <option value="">—</option>
          {field.options.map(opt => (
            <option key={opt} value={opt}>
              {opt.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === 'text') {
    return (
      <div style={{ marginBottom: 12 }}>
        <Label primary={field.primary}>{field.label}</Label>
        <textarea
          value={stringValue}
          onChange={e => onChange(e.target.value || undefined)}
          rows={2}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>
    );
  }

  // number / percent / currency / months
  const placeholder =
    field.type === 'percent'
      ? '0–100'
      : field.type === 'currency'
        ? '50000000'
        : field.type === 'months'
          ? 'e.g. 24'
          : 'numeric';
  const suffix = field.type === 'percent' ? '%' : field.type === 'months' ? 'months' : null;

  return (
    <div style={{ marginBottom: 12 }}>
      <Label primary={field.primary}>{field.label}</Label>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          type="number"
          step={field.type === 'percent' ? '0.1' : 'any'}
          value={stringValue}
          onChange={e => {
            const raw = e.target.value;
            onChange(raw === '' ? undefined : parseFloat(raw));
          }}
          placeholder={placeholder}
          style={inputStyle}
        />
        {suffix && (
          <span
            style={{
              fontSize: 'var(--fs-xs)',
              color: 'var(--text-muted)',
              flexShrink: 0,
            }}
          >
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontSize: 'var(--fs-sm)',
  fontFamily: 'inherit',
};

function Label({
  children,
  required,
  primary,
}: {
  children: React.ReactNode;
  required?: boolean;
  primary?: boolean;
}) {
  return (
    <div
      style={{
        fontSize: 'var(--fs-2xs)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: primary ? 'var(--accent-primary)' : 'var(--text-muted)',
        marginBottom: 6,
        fontWeight: 600,
      }}
    >
      {children}
      {required && <span style={{ color: 'var(--error)', marginLeft: 4 }}>*</span>}
      {primary && !required && (
        <span
          style={{
            marginLeft: 6,
            fontSize: 'var(--fs-3xs)',
            background: 'rgba(22, 163, 74, 0.10)',
            color: 'var(--accent-primary)',
            padding: '1px 6px',
            borderRadius: 'var(--radius-sm)',
            letterSpacing: '0.04em',
          }}
        >
          Primary metric
        </span>
      )}
    </div>
  );
}
