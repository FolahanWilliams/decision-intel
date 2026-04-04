'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  CreditCard,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  Zap,
  XCircle,
  RotateCcw,
  FileText,
  Shield,
} from 'lucide-react';
import { useToast } from '@/components/ui/EnhancedToast';

interface BillingData {
  plan: string;
  planName: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
  hasStripeCustomer: boolean;
  usage: {
    analysesUsed: number;
    analysesLimit: number;
    percentUsed: number;
  };
  limits: {
    analysesPerMonth: number;
    maxPages: number;
    biasTypes: number;
  };
  upgradeAvailable?: boolean;
}

const fetcher = (url: string) =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error('Failed to fetch billing');
    return r.json();
  });

const PLAN_COLORS: Record<string, string> = {
  free: '#A1A1AA',
  pro: '#16A34A',
  team: '#8b5cf6',
  enterprise: '#f59e0b',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active: { label: 'Active', color: '#34d399', icon: <CheckCircle size={12} /> },
  trialing: { label: 'Trial', color: '#38bdf8', icon: <Clock size={12} /> },
  past_due: { label: 'Past Due', color: '#f87171', icon: <AlertTriangle size={12} /> },
  canceled: { label: 'Canceled', color: '#fbbf24', icon: <XCircle size={12} /> },
  none: { label: 'No Plan', color: '#A1A1AA', icon: <Shield size={12} /> },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

export function BillingSection() {
  const { data, isLoading, mutate } = useSWR<BillingData>('/api/billing', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
  });
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const { showToast } = useToast();

  if (isLoading) {
    return (
      <div
        style={{
          padding: 'var(--spacing-md)',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div className="flex items-center gap-sm">
          <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading billing...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const planColor = PLAN_COLORS[data.plan] || '#A1A1AA';
  const statusConfig = STATUS_CONFIG[data.status] || STATUS_CONFIG.none;
  const isPaid = data.plan !== 'free' && data.status !== 'none';
  const isUnlimited = data.usage.analysesLimit === -1;
  const usageColor =
    data.usage.percentUsed > 85
      ? 'var(--error)'
      : data.usage.percentUsed > 60
        ? 'var(--warning)'
        : 'var(--success)';

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      if (!res.ok) {
        showToast('Failed to open billing portal. Please try again.', 'error');
        return;
      }
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      }
    } catch {
      showToast('Failed to open billing portal. Please try again.', 'error');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCancel = async (action: 'cancel' | 'resume') => {
    setCancelLoading(true);
    try {
      const res = await fetch('/api/billing/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setShowCancelConfirm(false);
        mutate();
      } else {
        showToast('Failed to update subscription. Please try again.', 'error');
      }
    } catch {
      showToast('Failed to update subscription. Please try again.', 'error');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleUpgrade = async (plan: 'pro' | 'team') => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) {
        showToast('Failed to start checkout. Please try again.', 'error');
        return;
      }
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      }
    } catch {
      showToast('Failed to start checkout. Please try again.', 'error');
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      {/* ── Part A: Plan & Status ──────────────────────────── */}
      <div
        style={{
          padding: 'var(--spacing-md)',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-sm">
            <span
              style={{
                background: `${planColor}20`,
                color: planColor,
                border: `1px solid ${planColor}40`,
                padding: '2px 10px',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '6px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              {data.planName}
            </span>
            <span
              className="flex items-center gap-xs"
              style={{
                fontSize: '11px',
                color: statusConfig.color,
                fontWeight: 500,
              }}
            >
              {statusConfig.icon}
              {statusConfig.label}
              {data.status === 'trialing' && data.trialEndsAt && (
                <span style={{ color: 'var(--text-muted)' }}>
                  ({daysUntil(data.trialEndsAt)}d left)
                </span>
              )}
            </span>
          </div>
          {data.currentPeriodEnd && isPaid && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {data.cancelAtPeriodEnd ? 'Access until' : 'Renews'}{' '}
              {formatDate(data.currentPeriodEnd)}
            </span>
          )}
        </div>

        {/* Cancellation banner */}
        {data.cancelAtPeriodEnd && data.currentPeriodEnd && (
          <div
            className="flex items-center justify-between"
            style={{
              marginTop: 'var(--spacing-sm)',
              padding: '8px 12px',
              background: 'rgba(251, 191, 36, 0.08)',
              border: '1px solid rgba(251, 191, 36, 0.2)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
            }}
          >
            <span style={{ color: '#fbbf24' }}>
              Your plan cancels on {formatDate(data.currentPeriodEnd)}
            </span>
            <button
              onClick={() => handleCancel('resume')}
              disabled={cancelLoading}
              className="flex items-center gap-xs"
              style={{
                background: 'none',
                border: 'none',
                color: '#34d399',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '2px 8px',
              }}
            >
              {cancelLoading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <RotateCcw size={12} />
              )}
              Resume Plan
            </button>
          </div>
        )}

        {/* Past due banner */}
        {data.status === 'past_due' && (
          <div
            style={{
              marginTop: 'var(--spacing-sm)',
              padding: '8px 12px',
              background: 'rgba(248, 113, 113, 0.08)',
              border: '1px solid rgba(248, 113, 113, 0.2)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              color: '#f87171',
            }}
          >
            Payment failed — update your payment method to keep access.
          </div>
        )}
      </div>

      {/* ── Part B: Usage Meter ──────────────────────────── */}
      <div
        style={{
          padding: 'var(--spacing-md)',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Monthly Usage</span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {data.usage.analysesUsed}
            {isUnlimited ? '' : ` / ${data.usage.analysesLimit}`}
            {' analyses'}
          </span>
        </div>
        {!isUnlimited && (
          <div
            style={{
              height: '6px',
              background: 'var(--bg-card-hover)',
              borderRadius: '3px',
              overflow: 'hidden',
              marginBottom: '8px',
            }}
          >
            <div
              style={{
                width: `${Math.min(100, data.usage.percentUsed)}%`,
                height: '100%',
                background: usageColor,
                borderRadius: '3px',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        )}
        <div className="flex items-center gap-sm" style={{ flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'var(--bg-card-hover)',
              color: 'var(--text-muted)',
            }}
          >
            {data.limits.maxPages === -1 ? '∞' : data.limits.maxPages} pages/doc
          </span>
          <span
            style={{
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'var(--bg-card-hover)',
              color: 'var(--text-muted)',
            }}
          >
            {data.limits.biasTypes} bias types
          </span>
        </div>

        {/* Upgrade CTA for free users (only when billing is configured) */}
        {data.plan === 'free' && data.upgradeAvailable !== false && (
          <button
            onClick={() => handleUpgrade('pro')}
            disabled={portalLoading}
            className="flex items-center gap-sm"
            style={{
              marginTop: 'var(--spacing-sm)',
              width: '100%',
              padding: '10px',
              background: `${PLAN_COLORS.pro}15`,
              border: `1px solid ${PLAN_COLORS.pro}30`,
              borderRadius: 'var(--radius-sm)',
              color: PLAN_COLORS.pro,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              justifyContent: 'center',
            }}
          >
            {portalLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            Upgrade to Pro — 14-day free trial
          </button>
        )}

        {/* Compare plans link */}
        <a
          href="/#pricing"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-xs"
          style={{
            marginTop: 'var(--spacing-xs)',
            justifyContent: 'center',
            fontSize: '12px',
            color: 'var(--text-muted)',
            textDecoration: 'none',
          }}
        >
          Compare all plans <ExternalLink size={11} />
        </a>
      </div>

      {/* ── Part C: Quick Actions ──────────────────────────── */}
      <div className="flex items-center gap-sm" style={{ flexWrap: 'wrap' }}>
        {/* Manage Billing (Stripe Portal) */}
        {data.hasStripeCustomer && (
          <button
            onClick={handlePortal}
            disabled={portalLoading}
            className="flex items-center gap-xs"
            style={{
              padding: '8px 14px',
              background: 'var(--bg-card-hover)',
              border: '1px solid var(--bg-active)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {portalLoading ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <CreditCard size={12} />
            )}
            Manage Billing
            <ExternalLink size={10} style={{ opacity: 0.5 }} />
          </button>
        )}

        {/* Invoices (via Portal) */}
        {data.hasStripeCustomer && (
          <button
            onClick={handlePortal}
            disabled={portalLoading}
            className="flex items-center gap-xs"
            style={{
              padding: '8px 14px',
              background: 'var(--bg-card-hover)',
              border: '1px solid var(--bg-active)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <FileText size={12} />
            Invoices
          </button>
        )}

        {/* Cancel Plan */}
        {isPaid && !data.cancelAtPeriodEnd && (
          <>
            {!showCancelConfirm ? (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="flex items-center gap-xs"
                style={{
                  padding: '8px 14px',
                  background: 'transparent',
                  border: '1px solid rgba(248, 113, 113, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  marginLeft: 'auto',
                }}
              >
                Cancel Plan
              </button>
            ) : (
              <div className="flex items-center gap-sm" style={{ marginLeft: 'auto' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  You&apos;ll keep access until period ends.
                </span>
                <button
                  onClick={() => handleCancel('cancel')}
                  disabled={cancelLoading}
                  className="flex items-center gap-xs"
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(248, 113, 113, 0.1)',
                    border: '1px solid rgba(248, 113, 113, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#f87171',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {cancelLoading ? <Loader2 size={12} className="animate-spin" /> : 'Confirm'}
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  style={{
                    padding: '6px 12px',
                    background: 'transparent',
                    border: '1px solid var(--bg-active)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Keep Plan
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
