'use client';

import { useState } from 'react';
import { Shield, Zap, ArrowRight, Loader2 } from 'lucide-react';

interface DealAuditCTAProps {
  dealId: string;
  dealName: string;
  ticketSize: number | null;
  currency?: string;
  hasPurchase?: boolean;
}

const TIERS = [{ id: 'standard', label: 'Full Deal Audit', maxTicket: Infinity, price: 4999 }];

function getTier(ticketSize: number) {
  return TIERS.find(t => ticketSize <= t.maxTicket) || TIERS[TIERS.length - 1];
}

function formatTicketSize(amount: number) {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(0)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

export function DealAuditCTA({
  dealId,
  dealName,
  ticketSize,
  currency = 'USD',
  hasPurchase,
}: DealAuditCTAProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (hasPurchase) {
    return (
      <div
        style={{
          background: 'rgba(34, 197, 94, 0.08)',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <Shield size={20} style={{ color: '#22c55e' }} />
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Deal Audit Active
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Unlimited analyses for all documents linked to this deal.
          </div>
        </div>
      </div>
    );
  }

  if (!ticketSize) {
    return (
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
        }}
      >
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Set a ticket size on this deal to see audit pricing.
        </div>
      </div>
    );
  }

  const tier = getTier(ticketSize);

  async function handlePurchase() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/deal-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to start checkout');
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.06), rgba(99, 102, 241, 0.06))',
        border: '1px solid rgba(0, 210, 255, 0.15)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <Zap size={18} style={{ color: 'var(--accent-primary)' }} />
        <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Deal Audit
        </span>
        <span
          style={{
            fontSize: '10px',
            padding: '2px 8px',
            borderRadius: '999px',
            background: 'rgba(0, 210, 255, 0.15)',
            color: 'var(--accent-primary)',
          }}
        >
          {tier.label}
        </span>
      </div>

      <div
        style={{
          fontSize: '28px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '4px',
        }}
      >
        {new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
          maximumFractionDigits: 0,
        }).format(tier.price)}
        <span
          style={{
            fontSize: '13px',
            fontWeight: 400,
            color: 'var(--text-muted)',
            marginLeft: '4px',
          }}
        >
          one-time
        </span>
      </div>

      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
        Full cognitive bias audit for {dealName} ({formatTicketSize(ticketSize)} deal). Unlimited
        analyses for all linked documents.
      </div>

      <button
        onClick={handlePurchase}
        disabled={loading}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '10px 16px',
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--bg-primary)',
          background: 'var(--accent-primary)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          transition: 'opacity 0.2s',
        }}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
        {loading ? 'Redirecting to Stripe...' : 'Audit This Deal'}
      </button>

      {error && (
        <div style={{ fontSize: '12px', color: 'var(--error)', marginTop: '8px' }}>{error}</div>
      )}
    </div>
  );
}
