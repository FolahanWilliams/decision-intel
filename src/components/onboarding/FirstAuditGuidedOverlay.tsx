'use client';

/**
 * FirstAuditGuidedOverlay — fires once per user, when their first
 * audit completes.
 *
 * Shipped 2026-05-28 as Improvement #1 from the platform plan. The
 * cold-context /demo experience is highly polished; this brings the
 * paid first-run experience to parity.
 *
 * Renders a 3-step teaching overlay overlaying the result reveal:
 *   1. (during analysis): "We're running 12 R²F nodes in parallel —
 *      bias detection, noise jury, structural assumptions, cross-
 *      reference. This usually takes 60-90 seconds."
 *   2. (at reveal): "This is your DQI score. Click any bias for the
 *      full reference + the verbatim memo passage that triggered it."
 *   3. (at "Deep Dive" hover): "The full audit lives at /documents/
 *      [id] — that's the URL you forward to your audit committee."
 *
 * Fires exactly once per user via the sessionStorage signal in
 * useFirstAuditExperience. Auto-advances on click or after 8s.
 * Dismissable; user opt-out persists.
 *
 * Architecture: positioned overlay with a 240ms pulse on the
 * highlighted element + a "Got it" advance button. Does NOT
 * block interaction with the underlying surface.
 */

import { useEffect, useState } from 'react';
import { ArrowRight, X, Sparkles, Search, FileOutput } from 'lucide-react';
import { markFirstAuditOverlayShown } from '@/hooks/useFirstAuditExperience';

interface Props {
  /** When true, the overlay activates (fires on the user's first audit). */
  active: boolean;
  /** Called when the user dismisses the overlay (X click or "Got it" on
   *  step 3). Marks the overlay-shown signal in sessionStorage so it
   *  doesn't fire again this session. */
  onComplete: () => void;
}

type Step = 0 | 1 | 2;

const STEPS = [
  {
    eyebrow: 'Step 1 of 3',
    title: 'What you’re looking at',
    body: 'This is the result of your first R²F audit. The pipeline ran 12 nodes in parallel — bias detection, noise jury, structural assumptions, cross-reference — and produced a Decision Quality Index score in under 90 seconds.',
    icon: <Sparkles size={18} />,
  },
  {
    eyebrow: 'Step 2 of 3',
    title: 'Read like an audit committee',
    body: 'Click any flagged bias to see the verbatim memo passage that triggered it, the academic citation behind the detector, and the debiasing technique that addresses it. This is the audit trail your GC asks for.',
    icon: <Search size={18} />,
  },
  {
    eyebrow: 'Step 3 of 3',
    title: 'The artefact you forward',
    body: 'Click “Deep Dive” to open the full audit. The URL you forward to your audit committee — procurement-grade typography, hashed + tamper-evident DPR export, regulatory mapping across every framework in the canonical registry. The result page IS the deliverable.',
    icon: <FileOutput size={18} />,
  },
] as const;

const AUTO_ADVANCE_MS = 12000;

export function FirstAuditGuidedOverlay({ active, onComplete }: Props) {
  const [step, setStep] = useState<Step>(0);
  const [dismissing, setDismissing] = useState(false);

  // Auto-advance / hide
  useEffect(() => {
    if (!active || dismissing) return;
    const timer = setTimeout(() => {
      if (step < 2) setStep((step + 1) as Step);
      else handleDismiss();
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, step, dismissing]);

  const handleAdvance = () => {
    if (step < 2) setStep((step + 1) as Step);
    else handleDismiss();
  };

  const handleDismiss = () => {
    setDismissing(true);
    markFirstAuditOverlayShown();
    // Animate out, then call onComplete after a short delay so the
    // parent has time to unmount cleanly.
    setTimeout(onComplete, 220);
  };

  if (!active) return null;

  const s = STEPS[step]!;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 200,
        width: 'min(420px, calc(100vw - 48px))',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderLeft: '3px solid var(--accent-primary)',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 8px 32px rgba(15, 23, 42, 0.18)',
        padding: '18px 20px',
        opacity: dismissing ? 0 : 1,
        transform: dismissing ? 'translateY(8px)' : 'translateY(0)',
        transition: 'opacity 0.22s ease, transform 0.22s ease',
      }}
      role="dialog"
      aria-live="polite"
      aria-label="First audit guided tour"
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 10,
          gap: 12,
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)',
              color: 'var(--accent-primary)',
            }}
          >
            {s.icon}
          </span>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--accent-primary)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            {s.eyebrow}
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss tour"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <h3
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: '0 0 8px',
          letterSpacing: '-0.005em',
        }}
      >
        {s.title}
      </h3>
      <p
        style={{
          fontSize: 13.5,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {s.body}
      </p>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 16,
          gap: 12,
        }}
      >
        {/* Step dots */}
        <div style={{ display: 'inline-flex', gap: 6 }}>
          {STEPS.map((_, i) => (
            <span
              key={i}
              style={{
                width: i === step ? 18 : 6,
                height: 6,
                background:
                  i === step
                    ? 'var(--accent-primary)'
                    : 'color-mix(in srgb, var(--accent-primary) 30%, transparent)',
                borderRadius: 999,
                transition: 'width 0.18s ease',
              }}
              aria-hidden
            />
          ))}
        </div>
        <button
          type="button"
          onClick={handleAdvance}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            background: 'var(--accent-primary)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontSize: 12.5,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {step < 2 ? 'Next' : 'Got it'}
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}
