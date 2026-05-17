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
          <div
            className="rounded-lg p-2"
            style={{ background: 'color-mix(in srgb, var(--info) 10%, transparent)' }}
          >
            <Telescope className="h-5 w-5" style={{ color: 'var(--info)' }} />
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
            style={{
              width: `${failurePct}%`,
              background: 'color-mix(in srgb, var(--error) 70%, transparent)',
            }}
            title={`${failurePct}% failures`}
          />
          {neutralPct > 0 && (
            <div
              style={{
                width: `${neutralPct}%`,
                background: 'color-mix(in srgb, var(--warning) 40%, transparent)',
              }}
              title={`${neutralPct}% mixed outcomes`}
            />
          )}
          <div
            style={{
              width: `${successPct}%`,
              background: 'color-mix(in srgb, var(--success) 70%, transparent)',
            }}
            title={`${successPct}% successes`}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs">
          <span className="flex items-center gap-1" style={{ color: 'var(--error)' }}>
            <TrendingDown className="h-3 w-3" /> {failurePct}% failures
          </span>
          <span className="flex items-center gap-1" style={{ color: 'var(--success)' }}>
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
    'industry+stakes': { label: 'Industry + stakes', seed: 'var(--success)' as string | null },
    industry: { label: 'Industry match', seed: 'var(--info)' as string | null },
    global: { label: 'Global base rate', seed: null as string | null },
  }[matchedBy];
  const style: React.CSSProperties = config.seed
    ? {
        background: `color-mix(in srgb, ${config.seed} 10%, transparent)`,
        color: config.seed,
        borderColor: `color-mix(in srgb, ${config.seed} 30%, transparent)`,
      }
    : {
        background: 'var(--bg-tertiary)',
        color: 'var(--text-muted)',
        borderColor: 'var(--border-color)',
      };
  return (
    <span className="rounded-md border px-2 py-0.5 text-xs font-medium" style={style}>
      {config.label}
    </span>
  );
}
