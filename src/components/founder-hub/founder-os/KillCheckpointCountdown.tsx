'use client';

/**
 * KillCheckpointCountdown — month-4 Phase-1 kill criterion as a daily
 * discipline surface on FounderOSTab.
 *
 * Audit Section 9.2 lock 2026-05-22: "Make BAFTA's outcome the gate.
 * Surface this concretely on FounderOSTab (an 'X paid customers needed
 * by Y to clear month-4 kill checkpoint' countdown card)."
 *
 * GTM v3.5 lock (per CLAUDE.md): "<5 paid Individuals by month 4 =
 * halt-and-pivot, regardless of every other metric. NEVER push harder
 * on the same motion when the early-warning signal is red."
 *
 * The math is anchored on conversion-ledger.ts SSOT — PHASE_1_START_ISO
 * (2026-05-04) + PHASE_1_KILL_CHECKPOINT_ISO (2026-09-04) +
 * PHASE1_KILL_FLOOR (5). The converted count is read from the
 * WedgeProspect ledger (the founder's truth-of-record for wedge
 * conversions, NOT the all-paid Stripe count which would include
 * design-partner / non-wedge subs).
 *
 * Visual pattern mirrors EventPrepCard (sibling on the same tab):
 * inline borderTop accent, severity-coloured countdown, CSS-var
 * palette. Self-hides AFTER the kill-checkpoint date passes (the
 * gate is binary: by month-4 we either passed or pivoted; either
 * way the daily countdown is no longer the right discipline tool).
 *
 * Pure presentational. No new API — reuses the existing prospects
 * endpoint ConversionLedgerPanel already consumes (auth + caching
 * surface already proven). On fetch failure, surface a quiet error
 * line rather than hide — the founder needs to see when the data
 * isn't loading.
 */

import { useCallback, useEffect, useState } from 'react';
import { Target, AlertCircle } from 'lucide-react';
import {
  PHASE1_KILL_FLOOR,
  PHASE_1_KILL_CHECKPOINT_ISO,
  PHASE_1_START_ISO,
} from '@/lib/outreach/conversion-ledger';

interface Prospect {
  stage: string;
}

interface Props {
  founderPass: string;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function KillCheckpointCountdown({ founderPass }: Props) {
  const [nowMs] = useState(() => Date.now());
  const [converted, setConverted] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    // No synchronous setError(null) here — that triggers
    // react-hooks/set-state-in-effect. Error is cleared in the
    // success branch post-await, which is async (microtask) and
    // not flagged. Initial value is already null.
    try {
      const res = await fetch('/api/founder-hub/outreach/prospects', {
        headers: { 'x-founder-pass': founderPass },
      });
      const json = await res.json().catch(() => null); // canonical res-body-parse exception
      if (!res.ok) {
        setError(json?.error || 'Could not load ledger for the kill-checkpoint count');
        setConverted(null);
        return;
      }
      const list = (json?.data?.prospects ?? []) as Prospect[];
      setError(null);
      setConverted(list.filter(p => p.stage === 'converted').length);
    } catch {
      // canonical fetch-network exception
      setError('Network error loading the kill-checkpoint count');
      setConverted(null);
    }
  }, [founderPass]);

  useEffect(() => {
    // Fetch-on-mount canonical pattern — same shape as ConversionLedgerPanel
    // (which passes lint cleanly). The rule's analyzer trips on this
    // structurally-identical case for a heuristic reason; suppression is
    // honest because the load() async setState is post-await, not
    // synchronous to the effect tick.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const killDate = new Date(`${PHASE_1_KILL_CHECKPOINT_ISO}T00:00:00Z`);
  const daysToKill = Math.ceil((killDate.getTime() - nowMs) / MS_PER_DAY);

  // Self-hide once the kill checkpoint has passed. By that point the
  // gate has fired (passed or pivoted) and the daily countdown is no
  // longer the right discipline surface.
  if (daysToKill < 0) return null;

  // Pre-data state: keep visible but minimal so a slow API doesn't
  // hide the surface entirely on every refresh.
  const passed = converted !== null && converted >= PHASE1_KILL_FLOOR;
  const shortMargin = !passed && daysToKill <= 30;
  const mediumMargin = !passed && daysToKill > 30 && daysToKill <= 60;

  const accent = passed
    ? 'var(--success)'
    : shortMargin
      ? 'var(--error)'
      : mediumMargin
        ? 'var(--warning)'
        : 'var(--accent-primary)';

  const countdownColor = passed
    ? 'var(--success)'
    : shortMargin
      ? 'var(--error)'
      : mediumMargin
        ? 'var(--warning)'
        : 'var(--text-secondary)';

  const phaseStartLabel = new Date(`${PHASE_1_START_ISO}T00:00:00Z`).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const killDateLabel = killDate.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderTop: `3px solid ${accent}`,
        borderRadius: 'var(--radius-md)',
        padding: '18px 20px',
        marginBottom: 20,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: accent,
              marginBottom: 6,
            }}
          >
            <Target size={11} />
            GTM v3.5 · month-4 kill checkpoint
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
              marginBottom: 4,
              lineHeight: 1.3,
            }}
          >
            {converted === null ? '…' : converted} of {PHASE1_KILL_FLOOR} paid Individuals
            {passed && ' · gate cleared'}
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              maxWidth: 640,
            }}
          >
            Phase 1 ratified {phaseStartLabel}. By {killDateLabel} we need ≥{PHASE1_KILL_FLOOR} paid
            Individuals on the wedge or the v3.5 rule fires: halt-and-pivot, regardless of every
            other metric.{' '}
            {passed
              ? 'The gate has cleared — keep filling the ledger; month-6 is the next gate (8-12 retained 90+ days).'
              : shortMargin
                ? 'T-minus 30 days. This is the early-warning red signal. Filling the ledger is the work.'
                : mediumMargin
                  ? 'Inside the 60-day window. The founder-context.ts displacement-trap reminder applies: every product ship competes with this.'
                  : 'On track for the runway. The 5-10 personalised DMs/week cadence is what produces the conversions; the ledger is the dashboard.'}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 100 }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: countdownColor,
              letterSpacing: '-0.02em',
              lineHeight: 1,
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
            }}
          >
            T-{daysToKill}d
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-muted)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginTop: 4,
            }}
          >
            {passed ? 'gate cleared' : 'to checkpoint'}
          </div>
        </div>
      </div>
      {error && (
        <div
          style={{
            marginTop: 10,
            display: 'flex',
            gap: 6,
            alignItems: 'center',
            color: 'var(--error)',
            fontSize: 12,
          }}
        >
          <AlertCircle size={13} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
