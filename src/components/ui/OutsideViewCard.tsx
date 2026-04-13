'use client';

/**
 * Outside View Card (Reference Class Forecasting)
 *
 * Renders the historical base rate for a reference class comparable to
 * the current document/deal. Flyvbjerg/Kahneman showed that the inside
 * view (project-specific forecasting) is systematically over-optimistic
 * and that consulting the base rate is the single most effective
 * debiasing intervention for large capital decisions.
 */

import { useMemo } from 'react';
import { Telescope, TrendingDown, TrendingUp } from 'lucide-react';
import {
  computeReferenceClass,
  type ReferenceClassInput,
} from '@/lib/data/reference-class-forecasting';

interface OutsideViewCardProps {
  sector?: string | null;
  ticketSize?: number | null;
}

export function OutsideViewCard({ sector, ticketSize }: OutsideViewCardProps) {
  const rc = useMemo(() => {
    const input: ReferenceClassInput = { sector: sector ?? null, ticketSize: ticketSize ?? null };
    return computeReferenceClass(input);
  }, [sector, ticketSize]);

  const failurePct = Math.round(rc.failureRate * 100);
  const successPct = Math.round(rc.successRate * 100);
  const neutralPct = Math.max(0, 100 - failurePct - successPct);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-blue-500/10 p-2">
            <Telescope className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Outside View</h3>
            <p className="text-xs text-muted-foreground">
              Reference class base rate (Flyvbjerg &amp; Kahneman)
            </p>
          </div>
        </div>
        <MatchBadge matchedBy={rc.matchedBy} />
      </div>

      <div className="mb-3">
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
          Reference class
        </div>
        <div className="text-sm text-foreground">{rc.label}</div>
        <div className="text-xs text-muted-foreground mt-1">n = {rc.n} historical cases</div>
      </div>

      {/* Base rate bar */}
      <div className="mb-4">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="bg-red-500/70"
            style={{ width: `${failurePct}%` }}
            title={`${failurePct}% failures`}
          />
          {neutralPct > 0 && (
            <div
              className="bg-yellow-500/40"
              style={{ width: `${neutralPct}%` }}
              title={`${neutralPct}% mixed outcomes`}
            />
          )}
          <div
            className="bg-green-500/70"
            style={{ width: `${successPct}%` }}
            title={`${successPct}% successes`}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs">
          <span className="flex items-center gap-1 text-red-500">
            <TrendingDown className="h-3 w-3" /> {failurePct}% failures
          </span>
          <span className="flex items-center gap-1 text-green-600">
            <TrendingUp className="h-3 w-3" /> {successPct}% successes
          </span>
        </div>
      </div>

      {/* Callout copy */}
      <div className="mb-4 rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">Anchor to the base rate.</span> Your
        inside-view estimate of this decision&apos;s chance of success is almost certainly too
        optimistic. Comparable historical cases failed {failurePct}% of the time. Adjust the
        memo-specific case only with strong, concrete reasons.
      </div>

      {/* Representative comparables */}
      {(rc.topFailures.length > 0 || rc.topSuccesses.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {rc.topFailures.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                Cautionary comparables
              </div>
              <ul className="space-y-1">
                {rc.topFailures.map(c => (
                  <li key={c.id} className="text-xs text-foreground">
                    <span className="font-medium">{c.company}</span>
                    <span className="text-muted-foreground"> · {c.year}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {rc.topSuccesses.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                Success comparables
              </div>
              <ul className="space-y-1">
                {rc.topSuccesses.map(c => (
                  <li key={c.id} className="text-xs text-foreground">
                    <span className="font-medium">{c.company}</span>
                    <span className="text-muted-foreground"> · {c.year}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MatchBadge({ matchedBy }: { matchedBy: 'industry+stakes' | 'industry' | 'global' }) {
  const config = {
    'industry+stakes': {
      label: 'Industry + stakes',
      color: 'bg-green-500/10 text-green-600 border-green-500/30',
    },
    industry: { label: 'Industry match', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
    global: { label: 'Global base rate', color: 'bg-muted text-muted-foreground border-border' },
  }[matchedBy];
  return (
    <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}
