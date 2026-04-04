'use client';

/**
 * UpgradeFromAudit — shown on the deal detail page for users who have
 * purchased a one-off DealAudit and are on a metered plan. Pitches the
 * monthly subscription as the cheaper long-run option and links to
 * /pricing with the plan preselected.
 *
 * Quiet-renders to null when there's no active audit, the user is already
 * on an unlimited plan, or the status endpoint fails.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { trackEvent } from '@/lib/analytics/track';

interface AuditStatus {
  hasActiveAudit: boolean;
  tier: string | null;
  userPlan: string;
  planName: string;
  isMetered: boolean;
}

interface Props {
  dealId: string;
}

const UPGRADE_TARGET: Record<string, { plan: string; label: string }> = {
  free: { plan: 'pro', label: 'Professional' },
  pro: { plan: 'team', label: 'Team' },
  team: { plan: 'enterprise', label: 'Enterprise' },
};

export function UpgradeFromAudit({ dealId }: Props) {
  const [status, setStatus] = useState<AuditStatus | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/deals/${dealId}/audit-status`, { cache: 'no-store' });
        if (cancelled) return;
        if (!res.ok) {
          setLoaded(true);
          return;
        }
        const json = (await res.json()) as AuditStatus;
        if (cancelled) return;
        setStatus(json);
        setLoaded(true);
      } catch {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dealId]);

  if (!loaded || !status) return null;
  if (!status.hasActiveAudit || !status.isMetered) return null;

  const target = UPGRADE_TARGET[status.userPlan];
  if (!target) return null;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.12), rgba(34, 197, 94, 0.06))',
        border: '1px solid rgba(22, 163, 74, 0.35)',
        borderRadius: 12,
        padding: '18px 22px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div
        style={{
          background: 'rgba(22, 163, 74, 0.2)',
          padding: 10,
          borderRadius: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Sparkles size={22} style={{ color: '#22c55e' }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
          Get this analysis monthly &mdash; for less
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          You purchased a one-off audit for this deal. The {target.label} plan runs the same
          pipeline across every deal in your pipeline for a flat monthly rate. Most teams
          break even after two deals.
        </div>
      </div>
      <Link
        href={`/pricing?plan=${target.plan}&from=deal_audit`}
        onClick={() =>
          trackEvent('deal_audit_upgrade_click', {
            dealId,
            currentPlan: status.userPlan,
            targetPlan: target.plan,
          })
        }
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: '#16A34A',
          color: '#fff',
          padding: '10px 18px',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        Upgrade to {target.label}
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
