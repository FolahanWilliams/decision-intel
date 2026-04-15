'use client';

import { useState } from 'react';
import { X, Check, ArrowRight, Users, Network, Shield, MessageSquare } from 'lucide-react';
import { trackEvent } from '@/lib/analytics/track';

interface TeammateWallModalProps {
  open: boolean;
  onClose: () => void;
  /** Optional source context for analytics (e.g. "settings-team", "dashboard-invite-button") */
  source?: string;
}

const BENEFITS = [
  {
    icon: Network,
    title: 'Shared Decision Knowledge Graph',
    body: 'Your personal memos merge into a living network across your whole team. Today\u2019s decision always inherits yesterday\u2019s lessons.',
  },
  {
    icon: Users,
    title: 'Decision Rooms',
    body: 'Blind prior collection before group discussion. Consensus scoring reveals when agreement is genuine or groupthink.',
  },
  {
    icon: MessageSquare,
    title: 'Slack, Drive, and Email integrations',
    body: 'Audits happen where your team already works. No new workflow to adopt.',
  },
  {
    icon: Shield,
    title: 'Compliance mapping + audit logs',
    body: 'SOX, GDPR, MiFID II, FCA Consumer Duty. Full audit trail for legal and risk review.',
  },
];

export function TeammateWallModal({ open, onClose, source = 'unknown' }: TeammateWallModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    trackEvent('teammate_wall_upgrade_clicked', { source });
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'team', cycle: 'monthly' }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error || 'Could not start checkout. Please try again.');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="teammate-wall-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: 20,
          maxWidth: 640,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          border: '1px solid #E2E8F0',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '32px 32px 24px',
            borderBottom: '1px solid #E2E8F0',
            position: 'relative',
          }}
        >
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 8,
              color: '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#16A34A',
              marginBottom: 8,
            }}
          >
            Upgrade to Strategy
          </div>
          <h2
            id="teammate-wall-title"
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#0F172A',
              lineHeight: 1.2,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Your Personal Decision History stays yours on Individual.
          </h2>
          <p
            style={{
              fontSize: 15,
              color: '#64748B',
              lineHeight: 1.6,
              marginTop: 12,
              marginBottom: 0,
            }}
          >
            To invite a teammate, your team needs a shared Decision Knowledge Graph. Strategy
            connects everyone&rsquo;s memos, assumptions, and outcomes so your team learns as one
            asset instead of siloed notebooks.
          </p>
        </div>

        {/* Benefits */}
        <div style={{ padding: '24px 32px' }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#475569',
              marginBottom: 16,
            }}
          >
            What you get with Strategy
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {BENEFITS.map(b => {
              const Icon = b.icon;
              return (
                <div key={b.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      flexShrink: 0,
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={16} style={{ color: '#16A34A' }} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#0F172A',
                        marginBottom: 2,
                      }}
                    >
                      {b.title}
                    </div>
                    <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>{b.body}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              marginTop: 24,
              padding: '14px 16px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 10,
              fontSize: 13,
              color: '#475569',
              lineHeight: 1.6,
            }}
          >
            <Check
              size={14}
              style={{ color: '#16A34A', display: 'inline', marginRight: 6, verticalAlign: 'middle' }}
            />
            <strong style={{ color: '#0F172A' }}>You stay in control.</strong> Your Personal
            Decision History only merges into the team graph with your explicit opt-in during team
            onboarding. Your private memos never leak without consent.
          </div>
        </div>

        {/* Footer CTAs */}
        <div
          style={{
            padding: '20px 32px 28px',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            background: '#FAFBFC',
            borderRadius: '0 0 20px 20px',
          }}
        >
          {error && (
            <div
              role="alert"
              style={{
                fontSize: 13,
                color: '#B91C1C',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                padding: '8px 12px',
                borderRadius: 8,
              }}
            >
              {error}
            </div>
          )}
          <button
            onClick={handleUpgrade}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '14px 20px',
              borderRadius: 10,
              background: '#16A34A',
              color: '#FFFFFF',
              fontSize: 15,
              fontWeight: 600,
              border: 'none',
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
              width: '100%',
            }}
          >
            {loading ? 'Redirecting to checkout...' : 'Start 30-day pilot on Strategy'}
            {!loading && <ArrowRight size={16} />}
          </button>
          <button
            onClick={() => {
              trackEvent('teammate_wall_dismissed', { source });
              onClose();
            }}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              color: '#64748B',
              fontSize: 13,
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Keep my history private on Professional
          </button>
          <p
            style={{
              fontSize: 11,
              color: '#94A3B8',
              textAlign: 'center',
              margin: '4px 0 0',
              lineHeight: 1.5,
            }}
          >
            $2,499/mo · 15 seats · No card required for the pilot
          </p>
        </div>
      </div>
    </div>
  );
}
