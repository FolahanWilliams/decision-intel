'use client';

import { useState, useCallback, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';
import { EXIT_TYPES, type DealOutcome } from '@/types/deals';

interface DealOutcomeFormProps {
  dealId: string;
  currency?: string;
  existingOutcome?: DealOutcome | null;
  onSuccess?: () => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  background: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: 8,
  color: 'var(--text-primary)',
  fontSize: 13,
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: 4,
  display: 'block',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
  paddingRight: 28,
};

export function DealOutcomeForm({
  dealId,
  currency = 'USD',
  existingOutcome,
  onSuccess,
}: DealOutcomeFormProps) {
  const [irr, setIrr] = useState('');
  const [moic, setMoic] = useState('');
  const [exitType, setExitType] = useState('');
  const [exitValue, setExitValue] = useState('');
  const [holdPeriod, setHoldPeriod] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (existingOutcome) {
      setIrr(existingOutcome.irr != null ? String(existingOutcome.irr) : '');
      setMoic(existingOutcome.moic != null ? String(existingOutcome.moic) : '');
      setExitType(existingOutcome.exitType || '');
      setExitValue(existingOutcome.exitValue != null ? String(existingOutcome.exitValue) : '');
      setHoldPeriod(existingOutcome.holdPeriod != null ? String(existingOutcome.holdPeriod) : '');
      setNotes(existingOutcome.notes || '');
    }
  }, [existingOutcome]);

  const handleSubmit = useCallback(async () => {
    const body: Record<string, unknown> = {};
    if (irr) body.irr = parseFloat(irr);
    if (moic) body.moic = parseFloat(moic);
    if (exitType) body.exitType = exitType;
    if (exitValue) body.exitValue = parseFloat(exitValue);
    if (holdPeriod) body.holdPeriod = parseInt(holdPeriod, 10);
    if (notes.trim()) body.notes = notes.trim();

    if (Object.keys(body).length === 0) {
      setError('Please fill in at least one outcome field');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/deals/${dealId}/outcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save outcome');
      }

      setSuccess(true);
      onSuccess?.();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }, [dealId, irr, moic, exitType, exitValue, holdPeriod, notes, onSuccess]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
        {existingOutcome ? 'Update Outcome' : 'Record Outcome'}
      </div>

      {/* IRR + MOIC */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>IRR (%)</label>
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              value={irr}
              onChange={e => setIrr(e.target.value)}
              placeholder="e.g. 25"
              step="0.1"
              min="-100"
              max="100"
              style={{ ...inputStyle, paddingRight: 28 }}
            />
            <span
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                fontSize: 12,
              }}
            >
              %
            </span>
          </div>
        </div>
        <div>
          <label style={labelStyle}>MOIC</label>
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              value={moic}
              onChange={e => setMoic(e.target.value)}
              placeholder="e.g. 3.2"
              step="0.1"
              min="0"
              style={{ ...inputStyle, paddingRight: 20 }}
            />
            <span
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                fontSize: 12,
              }}
            >
              x
            </span>
          </div>
        </div>
      </div>

      {/* Exit Type + Exit Value */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Exit Type</label>
          <select value={exitType} onChange={e => setExitType(e.target.value)} style={selectStyle}>
            <option value="">Select exit type...</option>
            {EXIT_TYPES.map(t => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Exit Value ({currency})</label>
          <input
            type="number"
            value={exitValue}
            onChange={e => setExitValue(e.target.value)}
            placeholder="e.g. 150000000"
            min="0"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Hold Period */}
      <div style={{ maxWidth: 200 }}>
        <label style={labelStyle}>Hold Period (months)</label>
        <input
          type="number"
          value={holdPeriod}
          onChange={e => setHoldPeriod(e.target.value)}
          placeholder="e.g. 48"
          min="0"
          max="180"
          style={inputStyle}
        />
      </div>

      {/* Notes */}
      <div>
        <label style={labelStyle}>Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Additional notes on deal outcome..."
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      {/* Error / Success */}
      {error && (
        <div
          style={{
            fontSize: 12,
            color: '#ef4444',
            padding: '6px 10px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: 6,
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          style={{
            fontSize: 12,
            color: '#10b981',
            padding: '6px 10px',
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: 6,
          }}
        >
          Outcome saved successfully
        </div>
      )}

      {/* Submit */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="btn btn-primary"
          style={{
            padding: '8px 20px',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving...' : 'Save Outcome'}
        </button>
      </div>
    </div>
  );
}
