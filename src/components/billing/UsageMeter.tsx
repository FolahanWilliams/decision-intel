'use client';

/**
 * UsageMeter — compact pill showing analyses used / monthly limit.
 *
 * Hidden for enterprise / unlimited plans. Shows an "Upgrade" CTA once
 * usage ≥ 80%. Fetches from /api/billing on mount; re-fetches when the
 * window regains focus so the meter stays fresh after a new analysis.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics/track';

interface BillingResponse {
  plan: string;
  planName: string;
  usage: {
    analysesUsed: number;
    analysesLimit: number; // -1 for unlimited
    percentUsed: number;
  };
}

export function UsageMeter() {
  const [data, setData] = useState<BillingResponse | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchUsage = async () => {
      try {
        const res = await fetch('/api/billing', { cache: 'no-store' });
        if (cancelled) return;
        if (!res.ok) {
          setLoaded(true);
          return;
        }
        const json = (await res.json()) as BillingResponse;
        if (cancelled) return;
        setData(json);
        setLoaded(true);
      } catch {
        if (!cancelled) setLoaded(true);
      }
    };
    void fetchUsage();
    const onFocus = () => void fetchUsage();
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  if (!loaded || !data) return null;
  // Hide for unlimited plans
  if (data.usage.analysesLimit < 0) return null;

  const { analysesUsed, analysesLimit, percentUsed } = data.usage;
  const isNearLimit = percentUsed >= 80;
  const isAtLimit = percentUsed >= 100;

  const color = isAtLimit ? '#ef4444' : isNearLimit ? '#eab308' : '#16A34A';
  const trackColor = isAtLimit ? '#7f1d1d' : isNearLimit ? '#713f12' : '#14532d';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 12px',
        background: 'rgba(15, 15, 35, 0.6)',
        border: `1px solid ${trackColor}`,
        borderRadius: 999,
        fontSize: 12,
        color: 'var(--text-primary, #e2e8f0)',
      }}
      role="status"
      aria-label={`${analysesUsed} of ${analysesLimit} analyses used this month`}
    >
      <div
        style={{
          width: 48,
          height: 4,
          background: trackColor,
          borderRadius: 2,
          overflow: 'hidden',
        }}
        aria-hidden
      >
        <div
          style={{
            width: `${Math.min(100, percentUsed)}%`,
            height: '100%',
            background: color,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
      <span style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
        {analysesUsed}/{analysesLimit} analyses
      </span>
      {isNearLimit && (
        <Link
          href="/pricing"
          onClick={() =>
            trackEvent('usage_meter_upgrade_click', {
              plan: data.plan,
              percentUsed,
            })
          }
          style={{
            color: color,
            fontWeight: 600,
            textDecoration: 'none',
            borderLeft: `1px solid ${trackColor}`,
            paddingLeft: 10,
          }}
        >
          Upgrade →
        </Link>
      )}
    </div>
  );
}
