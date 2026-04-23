'use client';

/**
 * ReportOutcomeFab — sticky bottom-right button that surfaces the
 * OutcomeReporter from deep down the document-detail page. The reporter
 * lives ~1,500 lines below the header; a CSO reviewing the analyst view
 * rarely scrolls that far, so the flywheel doesn't close.
 *
 * Visibility rules:
 *   - Render only when outcomeStatus is `pending_outcome` or
 *     `outcome_overdue`. Logged outcomes never need the FAB.
 *   - In phase=after the reporter IS the canvas — suppress the FAB.
 *   - Otherwise, show after a 30-second dwell on the page OR immediately
 *     if the outcome is overdue (that signal is too load-bearing to delay).
 *
 * Clicking scrolls to `[data-outcome-reporter]` which the parent page
 * stamps on the OutcomeReporter wrapper. If the anchor isn't on the page
 * (phase=during), the FAB is suppressed.
 */

import { useEffect, useState } from 'react';
import { PenLine, AlarmClock } from 'lucide-react';

interface ReportOutcomeFabProps {
  outcomeStatus: string | undefined;
  phase: 'before' | 'during' | 'after';
  /** Seconds to wait before showing the FAB when the outcome is merely
   *  pending (not overdue). Overdue outcomes bypass this delay. */
  dwellMs?: number;
}

export function ReportOutcomeFab({
  outcomeStatus,
  phase,
  dwellMs = 30_000,
}: ReportOutcomeFabProps) {
  const overdue = outcomeStatus === 'outcome_overdue';
  const pending = outcomeStatus === 'pending_outcome' || overdue;
  const anchorAvailable = phase !== 'during';
  const shouldEverRender = pending && phase !== 'after' && anchorAvailable;

  const [visible, setVisible] = useState(overdue && shouldEverRender);

  useEffect(() => {
    if (!shouldEverRender || overdue) return;
    const t = setTimeout(() => setVisible(true), dwellMs);
    return () => clearTimeout(t);
  }, [shouldEverRender, overdue, dwellMs]);

  if (!shouldEverRender || !visible) return null;

  const scrollToReporter = () => {
    if (typeof document === 'undefined') return;
    const el = document.querySelector<HTMLElement>('[data-outcome-reporter]');
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Subtle flash to pull the eye — no sustained animation, no chrome.
    el.animate(
      [
        { boxShadow: '0 0 0 0 rgba(22,163,74,0)' },
        { boxShadow: '0 0 0 6px rgba(22,163,74,0.25)' },
        { boxShadow: '0 0 0 0 rgba(22,163,74,0)' },
      ],
      { duration: 1200, easing: 'ease-out' }
    );
  };

  const Icon = overdue ? AlarmClock : PenLine;
  const label = overdue ? 'Outcome overdue — report it' : 'Report the outcome';

  return (
    <button
      type="button"
      onClick={scrollToReporter}
      aria-label={label}
      title={label}
      style={{
        position: 'fixed',
        right: 20,
        bottom: 20,
        zIndex: 40,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 18px',
        fontSize: 13,
        fontWeight: 600,
        color: '#fff',
        background: overdue ? 'var(--warning, #D97706)' : 'var(--accent-primary, #16A34A)',
        border: 'none',
        borderRadius: 'var(--radius-full, 9999px)',
        boxShadow: '0 8px 28px rgba(15,23,42,0.18)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      <Icon size={16} strokeWidth={2.25} aria-hidden />
      {label}
    </button>
  );
}
