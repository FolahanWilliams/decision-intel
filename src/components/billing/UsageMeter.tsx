'use client';

/**
 * UsageMeter — compact pill showing analyses used / monthly limit.
 *
 * Hidden for enterprise / unlimited plans. At 80%+ usage shows a plan-aware
 * upgrade CTA: Free users see "Upgrade →"; Pro users see "Need more? Go Strategy →"
 * (mirrors the Teammate Wall language so the Pro → Strategy ladder reads as one
 * story). Fetches from /api/billing on mount; re-fetches when the window regains
 * focus so the meter stays fresh after a new analysis.
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
  if (data.usage.analysesLimit < 0) return null;

  const { analysesUsed, analysesLimit, percentUsed } = data.usage;
  const isNearLimit = percentUsed >= 80;
  const isAtLimit = percentUsed >= 100;

  const fillColor = isAtLimit
    ? 'var(--error, #DC2626)'
    : isNearLimit
      ? 'var(--warning, #D97706)'
      : 'var(--accent-primary, #16A34A)';
  const borderColor = isAtLimit
    ? 'var(--error, #DC2626)'
    : isNearLimit
      ? 'var(--warning, #D97706)'
      : 'var(--border-color, #E2E8F0)';

  const isPro = data.plan === 'pro';
  const upgradeLabel = isPro ? 'Need more? Go Strategy \u2192' : 'Upgrade \u2192';

  return (
    <div
      className="usage-meter"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 12px',
        background: 'var(--bg-card, #FFFFFF)',
        border: `1px solid ${borderColor}`,
        borderRadius: 999,
        fontSize: 12,
        color: 'var(--text-primary, #0F172A)',
        flexWrap: 'wrap',
        maxWidth: '100%',
      }}
      role="status"
      aria-label={`${analysesUsed} of ${analysesLimit} analyses used this month`}
    >
      <div
        className="usage-meter__track"
        style={{
          width: 48,
          height: 4,
          background: '#E2E8F0',
          borderRadius: 2,
          overflow: 'hidden',
          flexShrink: 0,
        }}
        aria-hidden
      >
        <div
          style={{
            width: `${Math.min(100, percentUsed)}%`,
            height: '100%',
            background: fillColor,
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
            color: fillColor,
            fontWeight: 600,
            textDecoration: 'none',
            borderLeft: `1px solid ${borderColor}`,
            paddingLeft: 10,
            whiteSpace: 'nowrap',
          }}
        >
          {upgradeLabel}
        </Link>
      )}
      <style jsx>{`
        @media (max-width: 480px) {
          .usage-meter__track {
            width: 32px !important;
          }
        }
      `}</style>
    </div>
  );
}
