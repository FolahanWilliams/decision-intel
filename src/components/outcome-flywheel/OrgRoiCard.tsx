'use client';

/**
 * OrgRoiCard — the persistent per-org ROI value narrative (core-flow
 * friction audit #2, locked 2026-05-17).
 *
 * The 2026-05-17 audit found the product had NO live ROI surface — the
 * only $-at-risk component was dead code and every analytics surface
 * (this one included) rendered metrics, never a value narrative. This
 * card is the fix: it leads the Outcome Flywheel (the purpose-built
 * retention page) with the MEASURABLE-ROI story the Phase-1
 * graduation gate is scored on.
 *
 * Honesty is procurement-grade and lives in the decision-roi SSOT:
 *   • value-at-stake is real on day 1 (no longitudinal data needed) —
 *     it is a flag of EXPOSURE the audit surfaced, anchored to the
 *     ticket size the user entered, NOT a prediction of loss. The
 *     footer says exactly that.
 *   • the calibration delta is staged with honest bands (unlocks /
 *     emerging / live) so a sparse pilot is never shown a fabricated
 *     "your calibration sharpened" claim.
 *
 * Reads /api/analytics/roi (which composes the canonical
 * getQuarterlyImpact + getOrgBrierStats + platform baseline — this
 * card never recomputes value).
 */

import { useEffect, useState } from 'react';
import { ShieldAlert, TrendingUp, Loader2 } from 'lucide-react';
import { AccentCard } from '@/components/ui/AccentCard';
import { formatRoiMoney, type OrgRoiSummary } from '@/lib/learning/decision-roi';

export function OrgRoiCard() {
  const [summary, setSummary] = useState<OrgRoiSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/analytics/roi');
        if (!res.ok) {
          if (alive) setError(true);
          return;
        }
        const json = (await res.json().catch(() => null)) as OrgRoiSummary | null;
        if (alive) {
          if (json && json.valueAtStake) setSummary(json);
          else setError(true);
        }
      } catch {
        // Network/parse — show the card's error state, not a crash.
        if (alive) setError(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // The card never blocks the page — on load/error it simply doesn't
  // render (the rest of the flywheel still shows).
  if (loading) {
    return (
      <AccentCard
        accent="primary"
        style={{ marginBottom: 'var(--spacing-lg)' }}
        title={
          <>
            <TrendingUp size={16} style={{ color: 'var(--accent-primary)' }} />
            <span>Your decision ROI</span>
          </>
        }
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--text-muted)',
            fontSize: 'var(--fs-sm)',
            padding: '8px 0',
          }}
        >
          <Loader2 size={14} className="animate-spin" />
          Computing exposure flagged + calibration…
        </div>
      </AccentCard>
    );
  }

  if (error || !summary) return null;

  const { valueAtStake: vas, calibration: cal, savings } = summary;

  const calColor =
    cal.state === 'live'
      ? cal.delta != null && cal.delta > 0
        ? 'var(--success)'
        : 'var(--warning)'
      : cal.state === 'emerging'
        ? 'var(--warning)'
        : 'var(--text-muted)';

  return (
    <AccentCard
      accent="primary"
      style={{ marginBottom: 'var(--spacing-lg)' }}
      title={
        <>
          <TrendingUp size={16} style={{ color: 'var(--accent-primary)' }} />
          <span>Your decision ROI</span>
        </>
      }
    >
      {/* Day-1 value-at-stake — the headline, real with zero outcomes. */}
      {vas.empty ? (
        <div
          style={{
            fontSize: 'var(--fs-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            padding: '10px 12px',
            background: 'var(--bg-secondary)',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          Add a ticket / deal size to your decisions and audit them — the moment a flagged pattern
          has a historical cohort, this shows the capital your audits surfaced as exposed, before
          any outcome could prove it.
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              {formatRoiMoney(vas.totalValueAtStake, vas.currency)}
            </span>
            <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
              of capital flagged as exposed across {vas.decisionsFlagged} audited{' '}
              {vas.decisionsFlagged === 1 ? 'decision' : 'decisions'}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 6,
              marginTop: 8,
              fontSize: 'var(--fs-xs)',
              color: 'var(--text-muted)',
              lineHeight: 1.5,
            }}
          >
            <ShieldAlert
              size={13}
              style={{ flexShrink: 0, marginTop: 1, color: 'var(--warning)' }}
            />
            <span>
              Anchored to the ticket size you entered × the historical failure rate of the flagged
              pattern&rsquo;s comparable cohort. A flag of{' '}
              <strong>exposure the audit surfaced</strong>, not a prediction of loss.
              {vas.decisionsWithTicket > vas.decisionsFlagged && (
                <>
                  {' '}
                  {vas.decisionsWithTicket - vas.decisionsFlagged} more{' '}
                  {vas.decisionsWithTicket - vas.decisionsFlagged === 1
                    ? 'decision has'
                    : 'decisions have'}{' '}
                  a ticket but no flagged-pattern cohort yet — excluded, never invented.
                </>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Calibration delta — staged honestly (unlocks → emerging → live). */}
      <div
        style={{
          marginTop: 14,
          padding: '10px 12px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderLeft: `3px solid ${calColor}`,
        }}
      >
        <div
          style={{
            fontSize: 'var(--fs-2xs)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: calColor,
            marginBottom: 4,
          }}
        >
          Calibration ·{' '}
          {cal.state === 'live'
            ? 'live'
            : cal.state === 'emerging'
              ? 'emerging'
              : 'unlocks with outcomes'}
        </div>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          {cal.message}
          {cal.state === 'live' && cal.orgBrier != null && (
            <>
              {' '}
              <span style={{ color: 'var(--text-muted)' }}>
                (your Brier {cal.orgBrier.toFixed(3)} vs platform-seed{' '}
                {cal.baselineBrier.toFixed(3)})
              </span>
            </>
          )}
        </div>
      </div>

      {/* Realised savings — the canonical getQuarterlyImpact value. */}
      {savings.estimatedSavings != null && (
        <div
          style={{
            marginTop: 10,
            fontSize: 'var(--fs-xs)',
            color: 'var(--text-secondary)',
          }}
        >
          <strong style={{ color: 'var(--success)' }}>
            {formatRoiMoney(savings.estimatedSavings, savings.currency)}
          </strong>{' '}
          estimated bias cost avoided this quarter ({savings.improvedDecisions} of{' '}
          {savings.totalDecisions} decisions improved after the audit changed the call).
        </div>
      )}
    </AccentCard>
  );
}
