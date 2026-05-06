'use client';

/**
 * GTM v3.5 — Vohra PMF Survey Modal.
 *
 * Mounted on the platform layout. Polls /api/vohra-pmf/pending on mount
 * + every 60s; opens when a pending survey exists. Submits to
 * /api/vohra-pmf/respond, which records the canonical "very disappointed"
 * answer feeding the Phase 1 graduation gate.
 *
 * Dismissal: user can defer up to 3 times (each dismissal increments
 * dismissedCount on the server). On the 4th open, the dismiss CTA is
 * hidden — the user must complete the survey to close the modal.
 */

import { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PendingResponse {
  success?: boolean;
  data?: {
    pending: {
      id: string;
      triggeredAt: string;
      dismissedCount: number;
      forceShow: boolean;
    } | null;
  };
}

type VeryDisappointedValue = 'very_disappointed' | 'somewhat_disappointed' | 'not_disappointed';

const POLL_INTERVAL_MS = 60_000;

export function VohraPMFSurveyModal() {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [forceShow, setForceShow] = useState(false);
  const [open, setOpen] = useState(false);

  // Form state
  const [veryDisappointed, setVeryDisappointed] = useState<VeryDisappointedValue | null>(null);
  const [hxcType, setHxcType] = useState('');
  const [mainBenefit, setMainBenefit] = useState('');
  const [improvement, setImprovement] = useState('');
  const [referralWillingness, setReferralWillingness] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkPending = useCallback(async () => {
    try {
      const res = await fetch('/api/vohra-pmf/pending', { cache: 'no-store' });
      if (!res.ok) return;
      const parsed = (await res.json()) as PendingResponse;
      const pending = parsed.data?.pending ?? null;
      if (pending) {
        setPendingId(pending.id);
        setForceShow(pending.forceShow);
        setOpen(true);
      } else {
        setPendingId(null);
        setOpen(false);
      }
    } catch (_err1) {
      // Silent — pending check failures are not user-facing
      void _err1;
    }
  }, []);

  useEffect(() => {
    checkPending();
    const interval = setInterval(checkPending, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkPending]);

  const handleSubmit = async () => {
    if (!pendingId || !veryDisappointed) {
      setError('Please answer the first question before submitting.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/vohra-pmf/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyId: pendingId,
          veryDisappointed,
          hxcType: hxcType.trim() || undefined,
          mainBenefit: mainBenefit.trim() || undefined,
          improvement: improvement.trim() || undefined,
          referralWillingness: referralWillingness ?? undefined,
        }),
      });
      if (!res.ok) {
        const errorData = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorData?.error ?? 'Submission failed');
      }
      setOpen(false);
      setPendingId(null);
      // Reset form for next time
      setVeryDisappointed(null);
      setHxcType('');
      setMainBenefit('');
      setImprovement('');
      setReferralWillingness(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = async () => {
    if (!pendingId || forceShow) return;
    try {
      await fetch('/api/vohra-pmf/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyId: pendingId }),
      });
    } catch (_err2) {
      // Silent on dismiss failures — best effort
      void _err2;
    }
    setOpen(false);
  };

  if (!pendingId) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={value => {
        // If dismissals are forced, ignore close attempts other than submit
        if (!value && forceShow) return;
        if (!value) handleDismiss();
        else setOpen(value);
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Quick check-in: how is Decision Intel for you?</DialogTitle>
          <DialogDescription>
            Three minutes; one question that matters most. Your answer directly shapes what we build
            next.
          </DialogDescription>
        </DialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 8 }}>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 12,
              }}
            >
              How would you feel if you could no longer use Decision Intel?
            </legend>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(
                [
                  { value: 'very_disappointed', label: 'Very disappointed' },
                  { value: 'somewhat_disappointed', label: 'Somewhat disappointed' },
                  { value: 'not_disappointed', label: 'Not disappointed' },
                ] as Array<{ value: VeryDisappointedValue; label: string }>
              ).map(opt => (
                <label
                  key={opt.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    border: `1px solid ${
                      veryDisappointed === opt.value
                        ? 'var(--accent-primary)'
                        : 'var(--border-color)'
                    }`,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    background:
                      veryDisappointed === opt.value
                        ? 'color-mix(in srgb, var(--accent-primary) 8%, transparent)'
                        : 'transparent',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                >
                  <input
                    type="radio"
                    name="very-disappointed"
                    value={opt.value}
                    checked={veryDisappointed === opt.value}
                    onChange={() => setVeryDisappointed(opt.value)}
                    style={{ accentColor: 'var(--accent-primary)' }}
                  />
                  <span style={{ color: 'var(--text-primary)', fontSize: 14 }}>{opt.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              What type of person do you think would benefit most from Decision Intel?
            </span>
            <input
              type="text"
              value={hxcType}
              onChange={e => setHxcType(e.target.value.slice(0, 500))}
              placeholder="e.g. Heads of Corp Dev at mid-market scale-ups doing 2-4 deals/year"
              style={{
                padding: '10px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: 14,
              }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              What is the main benefit you receive from Decision Intel?
            </span>
            <textarea
              value={mainBenefit}
              onChange={e => setMainBenefit(e.target.value.slice(0, 1000))}
              placeholder="One concrete answer is more useful than a long abstract one."
              rows={3}
              style={{
                padding: '10px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: 14,
                resize: 'vertical',
              }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              How can we improve Decision Intel for you?
            </span>
            <textarea
              value={improvement}
              onChange={e => setImprovement(e.target.value.slice(0, 1000))}
              placeholder="The one change that would most increase your value."
              rows={3}
              style={{
                padding: '10px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: 14,
                resize: 'vertical',
              }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              On a scale of 0-10, how likely are you to refer Decision Intel to a peer right now?
            </span>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {Array.from({ length: 11 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setReferralWillingness(i)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${
                      referralWillingness === i ? 'var(--accent-primary)' : 'var(--border-color)'
                    }`,
                    background:
                      referralWillingness === i
                        ? 'color-mix(in srgb, var(--accent-primary) 12%, transparent)'
                        : 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {i}
                </button>
              ))}
            </div>
          </label>

          {error && (
            <div
              style={{
                padding: '10px 12px',
                background: 'color-mix(in srgb, var(--error) 10%, transparent)',
                border: '1px solid var(--error)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--error)',
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          {!forceShow && (
            <Button variant="ghost" onClick={handleDismiss} disabled={submitting}>
              Remind me later
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={submitting || !veryDisappointed}
            style={{
              background: 'var(--accent-primary)',
              color: 'var(--text-on-accent, #ffffff)',
            }}
          >
            {submitting ? 'Saving…' : 'Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
