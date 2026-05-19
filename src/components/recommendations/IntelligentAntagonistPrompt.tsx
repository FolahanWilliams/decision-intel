'use client';

/**
 * IntelligentAntagonistPrompt — captures the user's named priority
 * BEFORE the system reveals its algorithmic recommendations.
 *
 * Locked 2026-05-10. Per Deep Research paper Ch 8 / Finding #4
 * (automation-bias defense). The named gap between user-priority and
 * algo-priority is the recommendation's actual value — not the
 * recommendation alone.
 *
 * Mounts at the top of the constellation page as the empty-state of
 * the Next Move strip. Once the user submits a priority OR clicks
 * Skip, the strip renders the algo's ranked recommendations + a
 * divergence callout naming the gap.
 *
 * UX rules:
 *   - Single textarea, autofocused on mount.
 *   - 1-1000 char range, soft-limit at 200 with subtle hint.
 *   - "Skip" link routes through without capture (still records a
 *     null capture so we can quarterly-review the skip rate).
 *   - Disabled when submitting; shows Loader2 spinner.
 *   - Surface the framework in the eyebrow ("INTELLIGENT ANTAGONIST")
 *     so users learn the discipline without needing it explained.
 */

import { useState, useEffect, useRef } from 'react';
import { Loader2, ShieldQuestion, ArrowRight, ChevronDown } from 'lucide-react';

interface IntelligentAntagonistPromptProps {
  /// Called with the user-typed text. Component handles its own
  /// loading + error state; parent receives the freshly-recorded
  /// capture so it can render the divergence callout.
  onCapture: (userPriorityText: string, skipped: boolean) => Promise<void>;
  /// True when the user has already captured within the recent
  /// window (and the parent decided to skip the prompt).
  initiallyHidden?: boolean;
}

export function IntelligentAntagonistPrompt({
  onCapture,
  initiallyHidden = false,
}: IntelligentAntagonistPromptProps) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState(initiallyHidden);
  // Collapsed by default so the prompt is a single slim bar instead of
  // a ~10-row block that dominates the Decisions page. The discipline
  // (name your priority before the ranking) is preserved — it's one
  // click to expand and the strip below still doesn't pre-empt it.
  const [collapsed, setCollapsed] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!hidden && !collapsed && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [hidden, collapsed]);

  if (hidden) return null;

  // ── Collapsed: a single-line prompt bar (default) ──────────────────
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        style={{
          width: '100%',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderLeft: '3px solid var(--accent-primary)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          marginBottom: 16,
          cursor: 'pointer',
        }}
      >
        <ShieldQuestion size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
        <span
          style={{
            fontSize: 'var(--fs-xs)',
            color: 'var(--text-secondary)',
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          <strong style={{ color: 'var(--text-primary)' }}>Name your priority first</strong> — the
          antagonist that costs no political capital
        </span>
        <span
          style={{
            fontSize: 'var(--fs-2xs)',
            fontWeight: 600,
            color: 'var(--accent-primary)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            flexShrink: 0,
          }}
        >
          Expand
          <ChevronDown size={13} />
        </span>
      </button>
    );
  }

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (trimmed.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await onCapture(trimmed, false);
      setHidden(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record priority');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onCapture('', true);
      setHidden(true);
    } catch {
      // Skip-failure is non-blocking; just hide the prompt.
      setHidden(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderTop: '3px solid var(--accent-primary)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 18px',
        marginBottom: 16,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
        }}
      >
        <ShieldQuestion size={16} style={{ color: 'var(--accent-primary)' }} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--accent-primary)',
          }}
        >
          The antagonist that costs no political capital
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
        Before we reveal the system&rsquo;s ranking — what&rsquo;s your highest-priority decision in
        this pipeline right now?
      </h2>
      <p
        style={{
          fontSize: 'var(--fs-xs)',
          color: 'var(--text-muted)',
          margin: '0 0 10px',
          lineHeight: 1.5,
        }}
      >
        Naming it before the algorithm&rsquo;s output is the discipline that protects you from
        automation bias; the gap between your read and the system&rsquo;s is the
        recommendation&rsquo;s real value.
      </p>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={e => setText(e.target.value.slice(0, 1000))}
        placeholder="e.g. Project Heliograph — IC committee Friday and the synergy thesis still feels weak."
        rows={3}
        disabled={submitting}
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
      {error && (
        <p
          role="alert"
          style={{
            margin: '8px 0 0',
            fontSize: 'var(--fs-xs)',
            color: 'var(--error)',
          }}
        >
          {error}
        </p>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginTop: 12,
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
          }}
        >
          {text.length}/1000
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={handleSkip}
            disabled={submitting}
            style={{
              padding: '8px 12px',
              background: 'transparent',
              border: 'none',
              fontSize: 'var(--fs-sm)',
              color: 'var(--text-muted)',
              cursor: submitting ? 'not-allowed' : 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: 2,
            }}
          >
            Skip
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || text.trim().length === 0}
            style={{
              padding: '8px 16px',
              background: text.trim().length === 0 ? 'var(--bg-elevated)' : 'var(--accent-primary)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--fs-sm)',
              fontWeight: 600,
              color: text.trim().length === 0 ? 'var(--text-muted)' : '#fff',
              cursor: submitting || text.trim().length === 0 ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
            Reveal ranking
          </button>
        </div>
      </div>
    </div>
  );
}
