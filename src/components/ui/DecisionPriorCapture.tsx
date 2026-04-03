'use client';

import { useState, useCallback } from 'react';
import {
  Brain,
  Target,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';
import { motion } from 'framer-motion';

// ─── Types ──────────────────────────────────────────────────────────────────

interface DecisionPriorData {
  id?: string;
  analysisId: string;
  defaultAction: string;
  confidence: number;
  evidenceToChange?: string;
  postAnalysisAction?: string;
  beliefDelta?: number;
}

// ─── Pre-Analysis Prior Capture ─────────────────────────────────────────────

interface DecisionPriorCaptureProps {
  analysisId: string;
  /** Called after prior is successfully saved */
  onPriorSaved?: (prior: { defaultAction: string; confidence: number }) => void;
  /** Compact mode — for embedding in the analysis flow */
  compact?: boolean;
}

/**
 * Captures the decision-maker's prior beliefs before analysis.
 * Records: what they'd do without analysis, their confidence level,
 * and what evidence would change their mind.
 *
 * This data feeds the calibration curve (Confidence vs Reality) and
 * belief delta calculations that power the moat.
 */
export function DecisionPriorCapture({
  analysisId,
  onPriorSaved,
  compact = false,
}: DecisionPriorCaptureProps) {
  const [defaultAction, setDefaultAction] = useState('');
  const [confidence, setConfidence] = useState(50);
  const [evidenceToChange, setEvidenceToChange] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confidenceLabel = getConfidenceLabel(confidence);

  const handleSubmit = useCallback(async () => {
    if (!defaultAction.trim()) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/decision-priors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId,
          defaultAction: defaultAction.trim(),
          confidence,
          evidenceToChange: evidenceToChange.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save prior');
      }

      setSaved(true);
      onPriorSaved?.({ defaultAction, confidence });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [analysisId, defaultAction, confidence, evidenceToChange, onPriorSaved]);

  if (saved) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          padding: compact ? '12px 16px' : '16px 20px',
          background: 'rgba(34, 197, 94, 0.06)',
          border: '1px solid rgba(34, 197, 94, 0.15)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <CheckCircle size={16} style={{ color: '#22c55e', flexShrink: 0 }} />
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Prior recorded.</span>{' '}
          Your pre-analysis position ({confidence}% confidence) will be compared to the
          post-analysis outcome to build your calibration curve.
        </div>
      </motion.div>
    );
  }

  return (
    <div
      style={{
        border: '1px solid var(--bg-elevated)',
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'var(--bg-card)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: compact ? '12px 16px' : '14px 18px',
          borderBottom: '1px solid var(--bg-card-hover)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <Brain size={16} style={{ color: 'var(--text-secondary)' }} />
        <div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Record Your Prior
          </span>
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              display: 'block',
              marginTop: '2px',
            }}
          >
            Capture your position before the AI audit — this powers your calibration curve
          </span>
        </div>
      </div>

      {/* Form */}
      <div
        style={{
          padding: compact ? '12px 16px' : '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {/* Default action */}
        <div>
          <label
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              marginBottom: '6px',
            }}
          >
            What would you decide right now?
          </label>
          <textarea
            value={defaultAction}
            onChange={e => setDefaultAction(e.target.value)}
            placeholder="e.g. Proceed with the proposal as presented..."
            rows={2}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '13px',
              background: 'var(--bg-card)',
              border: '1px solid var(--bg-elevated)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              resize: 'vertical',
              lineHeight: 1.5,
            }}
          />
        </div>

        {/* Confidence slider */}
        <div>
          <label
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <span>How confident are you?</span>
            <span
              style={{
                color: confidenceLabel.color,
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                textTransform: 'none',
                letterSpacing: 'normal',
              }}
            >
              {confidence}% — {confidenceLabel.label}
            </span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="range"
              min={0}
              max={100}
              value={confidence}
              onChange={e => setConfidence(Number(e.target.value))}
              style={{
                width: '100%',
                accentColor: confidenceLabel.color,
                height: '4px',
              }}
            />
            {/* Tick marks at 25, 50, 75 */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '4px 0 0',
                fontSize: '9px',
                color: 'var(--text-muted)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Evidence to change */}
        <div>
          <label
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginBottom: '6px',
            }}
          >
            <Lightbulb size={10} />
            What would change your mind?
            <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 'normal' }}>
              (optional)
            </span>
          </label>
          <textarea
            value={evidenceToChange}
            onChange={e => setEvidenceToChange(e.target.value)}
            placeholder="e.g. Evidence of customer churn above 15%, regulatory risk in the target market..."
            rows={2}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '13px',
              background: 'var(--bg-card)',
              border: '1px solid var(--bg-elevated)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              resize: 'vertical',
              lineHeight: 1.5,
            }}
          />
        </div>

        {error && <p style={{ fontSize: '12px', color: '#ef4444', margin: 0 }}>{error}</p>}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={handleSubmit}
            disabled={saving || !defaultAction.trim()}
            style={{
              padding: '9px 20px',
              background: defaultAction.trim() ? 'var(--accent-primary)' : 'var(--bg-card-hover)',
              border: 'none',
              borderRadius: '8px',
              color: defaultAction.trim() ? '#fff' : 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: saving || !defaultAction.trim() ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Target size={14} />}
            Lock In Prior
          </button>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Recorded before the AI audit begins
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Post-Analysis Belief Delta ─────────────────────────────────────────────

interface PostAnalysisPriorProps {
  analysisId: string;
  prior: DecisionPriorData;
  onUpdated?: (beliefDelta: number) => void;
}

/**
 * Shown after analysis is complete — asks what the user will actually do now.
 * Compares pre-analysis position to post-analysis decision to calculate belief delta.
 */
export function PostAnalysisPrior({ analysisId, prior, onUpdated }: PostAnalysisPriorProps) {
  const [postAction, setPostAction] = useState(prior.postAnalysisAction || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(!!prior.postAnalysisAction);
  const [expanded, setExpanded] = useState(!prior.postAnalysisAction);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!postAction.trim()) return;
    setSaving(true);
    setSaveError(null);

    try {
      const res = await fetch('/api/decision-priors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId,
          postAnalysisAction: postAction.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSaved(true);
        setExpanded(false);
        onUpdated?.(data.beliefDelta);
      } else {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error || 'Failed to save');
      }
    } catch {
      setSaveError('Network error — please try again');
    } finally {
      setSaving(false);
    }
  }, [analysisId, postAction, onUpdated]);

  return (
    <div
      style={{
        border: `1px solid ${saved ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.08)'}`,
        borderRadius: '12px',
        overflow: 'hidden',
        background: saved ? 'rgba(34, 197, 94, 0.03)' : 'rgba(255, 255, 255, 0.02)',
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '14px 18px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-primary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Target size={16} style={{ color: 'var(--text-secondary)' }} />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Decision Prior</span>
          {saved && prior.beliefDelta != null && (
            <span
              style={{
                fontSize: '11px',
                padding: '2px 10px',
                borderRadius: '10px',
                background:
                  prior.beliefDelta > 0 ? 'rgba(251, 191, 36, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                color: prior.beliefDelta > 0 ? '#fbbf24' : '#22c55e',
                fontWeight: 600,
              }}
            >
              {prior.beliefDelta > 0 ? `Mind changed (${prior.beliefDelta}%)` : 'Position held'}
            </span>
          )}
          {!saved && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Compare your prior to what you decided after the audit
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div
          style={{
            padding: '0 18px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {/* Show the prior */}
          <div
            style={{
              padding: '12px 14px',
              background: 'var(--bg-card)',
              borderRadius: '8px',
              border: '1px solid var(--bg-card-hover)',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '6px',
              }}
            >
              Your pre-analysis position ({prior.confidence}% confidence)
            </div>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {prior.defaultAction}
            </p>
            {prior.evidenceToChange && (
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '8px 0 0' }}>
                Would change mind if: {prior.evidenceToChange}
              </p>
            )}
          </div>

          {/* Post-analysis action */}
          <div>
            <label
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'block',
                marginBottom: '6px',
              }}
            >
              After seeing the audit, what will you actually do?
            </label>
            <textarea
              value={postAction}
              onChange={e => setPostAction(e.target.value)}
              placeholder="Describe your updated decision..."
              rows={2}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '13px',
                background: 'var(--bg-card)',
                border: '1px solid var(--bg-elevated)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                resize: 'vertical',
                lineHeight: 1.5,
              }}
            />
          </div>

          {saveError && (
            <p style={{ fontSize: '12px', color: '#ef4444', margin: 0 }}>{saveError}</p>
          )}

          {!saved && (
            <button
              onClick={handleSubmit}
              disabled={saving || !postAction.trim()}
              style={{
                padding: '9px 20px',
                background: postAction.trim() ? 'var(--accent-primary)' : 'var(--bg-card-hover)',
                border: 'none',
                borderRadius: '8px',
                color: postAction.trim() ? '#fff' : 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: saving || !postAction.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                width: 'fit-content',
              }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
              Record Post-Analysis Decision
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getConfidenceLabel(confidence: number): { label: string; color: string } {
  if (confidence >= 90) return { label: 'Very High', color: '#22c55e' };
  if (confidence >= 70) return { label: 'High', color: '#a3e635' };
  if (confidence >= 50) return { label: 'Moderate', color: '#fbbf24' };
  if (confidence >= 30) return { label: 'Low', color: '#f97316' };
  return { label: 'Very Low', color: '#ef4444' };
}
