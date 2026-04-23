'use client';

/**
 * FlywheelChips — two compact sidebar pills that surface the calibration
 * loop without forcing a tab change. One shows the rolling 90-day org
 * Brier score; the other shows how many audits are awaiting an outcome.
 *
 * Data source: /api/team/intelligence.brierChip + .outcomesPending.
 * Renders nothing when both signals are empty — we don't show a "0" chip,
 * the absence is the information.
 *
 * Why in the sidebar: the single biggest flywheel-closure UX gap in the
 * app is that a CSO never sees calibration progress outside the audit
 * flow. Putting both chips beside the usage meter means every session
 * opens with a reminder that calibration compounds — and a CSO can quote
 * "our Brier moved from 0.24 to 0.14 this quarter" in a board meeting
 * without opening a document.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Target, AlarmClock } from 'lucide-react';

type BrierCategory = 'excellent' | 'good' | 'fair' | 'poor';

interface BrierChipData {
  avgBrier: number;
  category: BrierCategory;
  sampleSize: number;
  windowDays: number;
}

interface OutcomesPendingData {
  pending: number;
  overdue: number;
}

interface TeamIntelligenceResponse {
  brierChip?: BrierChipData | null;
  outcomesPending?: OutcomesPendingData | null;
}

const BRIER_PALETTE: Record<BrierCategory, { fg: string; bg: string; border: string; label: string }> = {
  excellent: {
    fg: 'var(--accent-primary)',
    bg: 'rgba(22,163,74,0.08)',
    border: 'rgba(22,163,74,0.25)',
    label: 'superforecaster',
  },
  good: {
    fg: '#2563EB',
    bg: 'rgba(37,99,235,0.08)',
    border: 'rgba(37,99,235,0.25)',
    label: 'analyst',
  },
  fair: {
    fg: '#D97706',
    bg: 'rgba(217,119,6,0.08)',
    border: 'rgba(217,119,6,0.25)',
    label: 'amateur',
  },
  poor: {
    fg: '#DC2626',
    bg: 'rgba(220,38,38,0.08)',
    border: 'rgba(220,38,38,0.25)',
    label: 'coin-flip',
  },
};

interface FlywheelChipsProps {
  /** "compact" hides labels on the Brier chip to fit the narrow rail; the
   *  "full" variant shows the superforecaster/analyst label inline. */
  variant?: 'compact' | 'full';
}

export function FlywheelChips({ variant = 'compact' }: FlywheelChipsProps) {
  const [data, setData] = useState<TeamIntelligenceResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/team/intelligence')
      .then(r => (r.ok ? r.json() : null))
      .then((json: TeamIntelligenceResponse | null) => {
        if (!cancelled) setData(json);
      })
      .catch(err => console.warn('[FlywheelChips] intelligence fetch failed:', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !data) return null;

  const brier = data.brierChip ?? null;
  const pending = data.outcomesPending ?? null;
  const nothingToShow =
    !brier && (!pending || (pending.pending === 0 && pending.overdue === 0));
  if (nothingToShow) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {brier && (
        <Link
          href="/dashboard/outcome-flywheel"
          title={`Rolling ${brier.windowDays}-day Brier · ${brier.sampleSize} outcomes · lower is better calibrated`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 8px',
            fontSize: 11,
            fontWeight: 600,
            color: BRIER_PALETTE[brier.category].fg,
            background: BRIER_PALETTE[brier.category].bg,
            border: `1px solid ${BRIER_PALETTE[brier.category].border}`,
            borderRadius: 'var(--radius-md, 8px)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <Target size={12} strokeWidth={2.25} aria-hidden />
          <span>Brier {brier.avgBrier.toFixed(2)}</span>
          {variant === 'full' && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                opacity: 0.8,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              · {BRIER_PALETTE[brier.category].label}
            </span>
          )}
        </Link>
      )}
      {pending && (pending.pending > 0 || pending.overdue > 0) && (
        <Link
          href="/dashboard/outcome-flywheel"
          title={
            pending.overdue > 0
              ? `${pending.overdue} audit${pending.overdue === 1 ? '' : 's'} overdue · ${pending.pending} pending`
              : `${pending.pending} audit${pending.pending === 1 ? '' : 's'} awaiting outcome`
          }
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 8px',
            fontSize: 11,
            fontWeight: 600,
            color: pending.overdue > 0 ? 'var(--warning, #D97706)' : 'var(--text-primary)',
            background:
              pending.overdue > 0 ? 'rgba(217,119,6,0.08)' : 'var(--bg-elevated, #fff)',
            border:
              pending.overdue > 0
                ? '1px solid rgba(217,119,6,0.3)'
                : '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md, 8px)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <AlarmClock size={12} strokeWidth={2.25} aria-hidden />
          <span>
            {pending.pending + pending.overdue} pending
            {pending.overdue > 0 ? ` · ${pending.overdue} overdue` : ''}
          </span>
        </Link>
      )}
    </div>
  );
}
