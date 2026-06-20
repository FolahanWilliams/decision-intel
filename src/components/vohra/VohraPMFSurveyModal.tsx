'use client';

/**
 * GTM v3.5 — Vohra PMF Survey Modal.
 *
 * Mounted on the platform layout. Checks /api/vohra-pmf/pending ONCE on mount;
 * opens when a pending survey exists AND the user hasn't snoozed it. Submits to
 * /api/vohra-pmf/respond — the canonical "very disappointed" answer feeding the
 * Phase 1 graduation gate.
 *
 * Dismissal is RESPECTED (rewritten 2026-06-20 — the prior version re-polled
 * every 60s and re-opened a dismissed modal, then force-locked it after 3
 * dismissals so the user couldn't close it at all). Now: closing (X or "Remind
 * me later") snoozes the survey locally for SNOOZE_DAYS and it never re-opens
 * within that window, and there is ALWAYS a way out — it never traps the user.
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

const SNOOZE_DAYS = 3;
const SNOOZE_MS = SNOOZE_DAYS * 24 * 60 * 60 * 1000;
const SNOOZE_KEY = 'di-vohra-snooze-until';

function isSnoozed(): boolean {
  try {
    return Number(localStorage.getItem(SNOOZE_KEY) || '0') > Date.now();
  } catch {
    return false;
  }
}
function setSnooze(): void {
  try {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
  } catch {
    // private-mode Safari may throw — the in-session close still suppresses it
  }
}

export function VohraPMFSurveyModal() {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // Form state
  const [veryDisappointed, setVeryDisappointed] = useState<VeryDisappointedValue | null>(null);
  const [hxcType, setHxcType] = useState('');
  const [mainBenefit, setMainBenefit] = useState('');
  const [improvement, setImprovement] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkPending = useCallback(async () => {
    if (isSnoozed()) return;
    try {
      const res = await fetch('/api/vohra-pmf/pending', { cache: 'no-store' });
      if (!res.ok) return;
      const parsed = (await res.json()) as PendingResponse;
      const pending = parsed.data?.pending ?? null;
      if (pending && !isSnoozed()) {
        setPendingId(pending.id);
        setOpen(true);
      }
    } catch {
      // Silent — pending-check failures are not user-facing
    }
  }, []);

  useEffect(() => {
    // Check ONCE on mount. No 60s re-poll — re-opening an explicitly dismissed
    // modal every minute is hostile; a freshly-triggered survey surfaces on the
    // next full page load instead.
    void checkPending();
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
        }),
      });
      if (!res.ok) {
        const errorData = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorData?.error ?? 'Submission failed');
      }
      setOpen(false);
      setPendingId(null);
      setVeryDisappointed(null);
      setHxcType('');
      setMainBenefit('');
      setImprovement('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = () => {
    // Snooze locally FIRST so it can never re-open within the window, then
    // close. The server dismiss call is best-effort analytics — it never blocks
    // or reverses the close.
    setSnooze();
    setOpen(false);
    const id = pendingId;
    if (id) {
      void (async () => {
        try {
          await fetch('/api/vohra-pmf/dismiss', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ surveyId: id }),
          });
        } catch {
          // best-effort — the local snooze already closed + suppressed the modal
        }
      })();
    }
  };

  if (!pendingId) return null;

  const radioOptions: Array<{ value: VeryDisappointedValue; label: string }> = [
    { value: 'very_disappointed', label: 'Very disappointed' },
    { value: 'somewhat_disappointed', label: 'Somewhat disappointed' },
    { value: 'not_disappointed', label: 'Not disappointed' },
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={value => {
        // Closing is ALWAYS honoured — the modal never traps the user.
        if (!value) handleDismiss();
        else setOpen(value);
      }}
    >
      {/* Height-cap + internal scroll come from the base DialogContent
          (max-h-[90dvh] overflow-y-auto) so this is mobile-safe. */}
      <DialogContent className="sm:max-w-[560px]" showCloseButton>
        <DialogHeader>
          <DialogTitle>Quick check-in: how is Decision Intel for you?</DialogTitle>
          <DialogDescription>
            Two minutes; the first question is the one that matters most. Your answer directly
            shapes what we build next.
          </DialogDescription>
        </DialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 4 }}>
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
              {radioOptions.map(opt => (
                <label
                  key={opt.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 14px',
                    border: `1px solid ${
                      veryDisappointed === opt.value
                        ? 'var(--accent-primary)'
                        : 'var(--border-color)'
                    }`,
                    borderRadius: 'var(--radius-lg)',
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
                borderRadius: 'var(--radius-lg)',
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
                borderRadius: 'var(--radius-lg)',
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
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: 14,
                resize: 'vertical',
              }}
            />
          </label>

          {error && (
            <div
              style={{
                padding: '10px 12px',
                background: 'color-mix(in srgb, var(--error) 10%, transparent)',
                border: '1px solid var(--error)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--error)',
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleDismiss} disabled={submitting}>
            Remind me later
          </Button>
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
