'use client';

import { useState, useCallback } from 'react';
import { Calendar, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

// ─── Types ──────────────────────────────────────────────────────────────────

interface OutcomeTimeframePickerProps {
  analysisId: string;
  /** Current outcomeDueAt if already set */
  currentDueAt?: string | null;
  /** Called after timeframe is saved */
  onSaved?: (dueAt: string) => void;
  /** Compact inline mode */
  compact?: boolean;
}

const TIMEFRAME_OPTIONS = [
  { days: 30, label: '30 days', description: 'Short-term tactical' },
  { days: 60, label: '60 days', description: 'Standard review cycle' },
  { days: 90, label: '90 days', description: 'Quarterly review' },
  { days: 180, label: '6 months', description: 'Strategic decision' },
  { days: 365, label: '1 year', description: 'Long-term strategic' },
] as const;

/**
 * Shown after analysis completes. Captures when the decision outcome
 * should be reviewed. This creates the mandatory outcome tracking loop:
 *   Analysis → Timeframe set → Reminder at due date → Outcome logged
 */
export function OutcomeTimeframePicker({
  analysisId,
  currentDueAt,
  onSaved,
  compact = false,
}: OutcomeTimeframePickerProps) {
  const [selectedDays, setSelectedDays] = useState<number | null>(null);
  const [customDate, setCustomDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(!!currentDueAt);
  const [error, setError] = useState<string | null>(null);

  const currentDueDate = currentDueAt ? new Date(currentDueAt) : null;
  const daysUntilDue = currentDueDate
    ? Math.ceil((currentDueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const handleSave = useCallback(async () => {
    let dueAt: Date;

    if (selectedDays) {
      dueAt = new Date();
      dueAt.setDate(dueAt.getDate() + selectedDays);
    } else if (customDate) {
      dueAt = new Date(customDate);
      if (dueAt <= new Date()) {
        setError('Due date must be in the future');
        return;
      }
    } else {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/outcomes/timeframe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId,
          outcomeDueAt: dueAt.toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to set timeframe');
      }

      setSaved(true);
      onSaved?.(dueAt.toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [analysisId, selectedDays, customDate, onSaved]);

  if (saved && currentDueDate) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          padding: compact ? '10px 14px' : '12px 16px',
          background: 'rgba(34, 197, 94, 0.06)',
          border: '1px solid rgba(34, 197, 94, 0.15)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <Calendar size={16} style={{ color: '#22c55e', flexShrink: 0 }} />
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            Outcome review scheduled.
          </span>{' '}
          {daysUntilDue != null && daysUntilDue > 0
            ? `You'll be reminded in ${daysUntilDue} days to report the outcome.`
            : `Review is due — report your outcome now.`}
        </span>
      </motion.div>
    );
  }

  if (saved) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          padding: compact ? '10px 14px' : '12px 16px',
          background: 'rgba(34, 197, 94, 0.06)',
          border: '1px solid rgba(34, 197, 94, 0.15)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <CheckCircle size={16} style={{ color: '#22c55e', flexShrink: 0 }} />
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Review date set.</span>{' '}
          You&apos;ll receive a reminder when it&apos;s time to report the outcome.
        </span>
      </motion.div>
    );
  }

  return (
    <div
      style={{
        border: '1px solid rgba(251, 191, 36, 0.2)',
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'rgba(251, 191, 36, 0.04)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: compact ? '10px 14px' : '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          borderBottom: '1px solid rgba(251, 191, 36, 0.1)',
        }}
      >
        <Clock size={16} style={{ color: '#fbbf24' }} />
        <div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            When will you know the outcome?
          </span>
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              display: 'block',
              marginTop: '2px',
            }}
          >
            Set a review date — we&apos;ll remind you to report the real-world result
          </span>
        </div>
      </div>

      {/* Options */}
      <div
        style={{
          padding: compact ? '10px 14px' : '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {TIMEFRAME_OPTIONS.map(opt => {
            const isSelected = selectedDays === opt.days;
            return (
              <button
                key={opt.days}
                onClick={() => {
                  setSelectedDays(opt.days);
                  setCustomDate('');
                }}
                style={{
                  padding: '8px 14px',
                  background: isSelected ? 'rgba(251, 191, 36, 0.12)' : 'var(--bg-card)',
                  border: `1px solid ${isSelected ? 'rgba(251, 191, 36, 0.3)' : 'var(--bg-elevated)'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: isSelected ? '#fbbf24' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: isSelected ? 600 : 400,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                }}
                title={opt.description}
              >
                <span>{opt.label}</span>
                <span
                  style={{
                    fontSize: '9px',
                    color: isSelected ? 'rgba(251, 191, 36, 0.7)' : 'var(--text-muted)',
                  }}
                >
                  {opt.description}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>or pick a date:</span>
          <input
            type="date"
            value={customDate}
            min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setCustomDate(e.target.value);
              setSelectedDays(null);
            }}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              background: 'var(--bg-card)',
              border: '1px solid var(--bg-elevated)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {error && <p style={{ fontSize: '12px', color: '#ef4444', margin: 0 }}>{error}</p>}

        {/* Save */}
        {(selectedDays || customDate) && (
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '9px 20px',
              background: 'var(--accent-primary)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: saving ? 'wait' : 'pointer',
              opacity: saving ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              width: 'fit-content',
            }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
            Set Review Date
          </button>
        )}
      </div>
    </div>
  );
}
