'use client';

/**
 * GTM v3.5 Discovery-Grade Dashboard upgrade (RATIFIED 2026-05-04).
 *
 * Single-line visceral synthesis of an audit, designed for the Phase 1
 * conversion mechanic — a 20-minute coffee-chat audit at a London event
 * (Strategy World, AI in Business Conference) where a fractional CSO or
 * mid-market Head of Corp Dev is watching their own memo get scored.
 *
 * The line that converts: "X flags caught · ~£Y of decision risk · 60-second audit."
 *
 * Why a separate component vs. inline in InlineAnalysisResultCard / PasteAuditResults:
 *   - The synthesis needs counterfactual data (monetary impact) which is async-fetched
 *   - The same synthesis fires on /dashboard (Individual user's own memo) AND
 *     /demo (paste-flow with anonymous prospect)
 *   - The fallback when monetary impact isn't computable yet is simpler
 *     (just bias count) — keeping that logic in one place avoids drift
 *
 * NotebookLM Q2 finding (2026-05-04): the 4-page DPR is procurement-grade for
 * Phase 4 F500 GCs, NOT for fractional CSOs in a 20-minute coffee chat. Dropping
 * the DPR PDF on a Phase 1 prospect triggers cognitive overload and breaks the
 * £249 conversion. This synthesis line is the visceral hook that fires BEFORE
 * the DPR PDF — score + bias count + monetary risk in one breath.
 */

import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, ShieldAlert } from 'lucide-react';
import { createClientLogger } from '@/lib/utils/logger';

const log = createClientLogger('DiscoverySynthesisLine');

interface CounterfactualScenario {
  expectedImprovement: number;
  estimatedMonetaryImpact: number | null;
  currency: string;
}

interface CounterfactualResult {
  scenarios: CounterfactualScenario[];
  aggregateImprovement: number;
}

interface DiscoverySynthesisLineProps {
  analysisId: string | null;
  biasCount: number;
  /**
   * Optional override — when InlineAnalysisResultCard / PasteAuditResults
   * already has a freshly streamed bias count from the SSE callback, pass
   * it directly rather than waiting for the counterfactual fetch.
   */
  variant?: 'inline' | 'demo';
}

function formatMoney(amount: number, currency: string): string {
  const symbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : currency;
  if (amount >= 1_000_000) {
    return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `${symbol}${Math.round(amount / 1_000)}K`;
  }
  return `${symbol}${Math.round(amount)}`;
}

export function DiscoverySynthesisLine({
  analysisId,
  biasCount,
  variant = 'inline',
}: DiscoverySynthesisLineProps) {
  const [topMonetary, setTopMonetary] = useState<{ amount: number; currency: string } | null>(null);

  useEffect(() => {
    if (!analysisId) return;
    let cancelled = false;
    async function fetchTopImpact() {
      try {
        const res = await fetch(`/api/counterfactual?analysisId=${analysisId}`);
        if (!res.ok) return;
        const data = (await res.json()) as CounterfactualResult;
        if (cancelled || !data.scenarios?.length) return;
        // Pick the single highest monetary-impact scenario (NOT the highest
        // expectedImprovement — the founder's pitch needs the biggest dollar
        // anchor visible in the synthesis line).
        const withMonetary = data.scenarios.filter(
          s => s.estimatedMonetaryImpact != null && s.estimatedMonetaryImpact > 0
        );
        if (withMonetary.length === 0) return;
        const top = withMonetary.reduce((max, s) =>
          (s.estimatedMonetaryImpact ?? 0) > (max.estimatedMonetaryImpact ?? 0) ? s : max
        );
        if (top.estimatedMonetaryImpact != null) {
          setTopMonetary({ amount: top.estimatedMonetaryImpact, currency: top.currency });
        }
      } catch (err) {
        log.warn('Failed to fetch counterfactual top-impact:', err);
      }
    }
    fetchTopImpact();
    return () => {
      cancelled = true;
    };
  }, [analysisId]);

  // Empty state: nothing useful to render. Caller decides whether to omit
  // the line entirely OR render their own fallback. We render the bias-count
  // fallback (no monetary anchor) because that's still visceral on its own.
  if (biasCount === 0 && !topMonetary) return null;

  const moneyChip = topMonetary ? formatMoney(topMonetary.amount, topMonetary.currency) : null;

  return (
    <div
      className="discovery-synthesis-line"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '12px 20px',
        background:
          'linear-gradient(90deg, color-mix(in srgb, var(--accent-primary) 7%, transparent) 0%, color-mix(in srgb, var(--accent-primary) 2%, transparent) 100%)',
        borderTop: '1px solid var(--border-color)',
        borderBottom: '1px solid var(--border-color)',
        flexWrap: 'wrap',
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--text-primary)',
        letterSpacing: '-0.005em',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
        <AlertTriangle size={15} style={{ color: 'var(--severity-high)' }} aria-hidden />
        {biasCount} flag{biasCount === 1 ? '' : 's'} caught
      </span>
      {moneyChip && (
        <>
          <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>·</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <ShieldAlert size={15} style={{ color: 'var(--accent-primary)' }} aria-hidden />~
            {moneyChip} of decision risk
          </span>
        </>
      )}
      <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>·</span>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          color: 'var(--text-secondary)',
          fontWeight: 500,
        }}
      >
        <Clock size={14} style={{ opacity: 0.7 }} aria-hidden />
        {variant === 'demo' ? '60-second audit' : '60-second audit complete'}
      </span>
    </div>
  );
}
