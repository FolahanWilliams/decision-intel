'use client';

import { useState } from 'react';
import { Check, Network, Lock, Loader2, AlertCircle } from 'lucide-react';
import { trackEvent } from '@/lib/analytics/track';

interface KGMergeConsentModalProps {
  open: boolean;
  /** Number of personal memos this user has. Shown to make the stakes concrete. */
  memoCount: number;
  /** Optional org name for personalization ("Acme Strategy team"). */
  orgName?: string | null;
  /** Called after the user records a decision. The dashboard closes the modal. */
  onDecision: (decision: 'merged' | 'private') => void;
}

export function KGMergeConsentModal({
  open,
  memoCount,
  orgName,
  onDecision,
}: KGMergeConsentModalProps) {
  const [loading, setLoading] = useState<'merged' | 'private' | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const recordDecision = async (decision: 'merged' | 'private') => {
    setLoading(decision);
    setError(null);
    trackEvent('kg_merge_consent_decision', { decision, memoCount });
    try {
      const res = await fetch('/api/knowledge-graph/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || 'Could not record your decision. Please try again.');
      }
      onDecision(decision);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error');
      setLoading(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="kg-consent-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 20,
          maxWidth: 620,
          width: '100%',
          maxHeight: '92vh',
          overflow: 'auto',
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          border: '1px solid #E2E8F0',
        }}
      >
        {/* Header */}
        <div style={{ padding: '32px 32px 20px', borderBottom: '1px solid #E2E8F0' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#16A34A',
              background: '#F0FDF4',
              padding: '4px 10px',
              borderRadius: 999,
              marginBottom: 16,
            }}
          >
            <Network size={12} /> Welcome to Strategy
          </div>
          <h2
            id="kg-consent-title"
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#0F172A',
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
              margin: '0 0 10px',
            }}
          >
            Merge your Personal Decision History into {orgName ? orgName + '\u2019s' : 'your team\u2019s'} Knowledge Graph?
          </h2>
          <p
            style={{
              fontSize: 15,
              color: '#475569',
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            You have <strong style={{ color: '#0F172A' }}>{memoCount}</strong> memo
            {memoCount === 1 ? '' : 's'} tracked in your Personal Decision History. Your team is
            now on Strategy, which unlocks a shared Decision Knowledge Graph. Your decision below
            controls whether your prior memos join that shared graph or stay private to you.
          </p>
        </div>

        {/* Option A: Merge */}
        <div style={{ padding: '24px 32px 0' }}>
          <div
            style={{
              border: '1px solid #BBF7D0',
              background: '#F0FDF4',
              borderRadius: 14,
              padding: '18px 20px',
              marginBottom: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: '#16A34A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Network size={16} color="#FFFFFF" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                  Merge my history into the team graph
                </div>
                <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                  Your {memoCount} memo{memoCount === 1 ? '' : 's'}, along with the biases,
                  assumptions, and outcomes you captured, become searchable nodes in the team
                  Knowledge Graph. Your teammates will see how your prior decisions connect to
                  theirs. This is how institutional memory compounds.
                </div>
              </div>
            </div>
            <button
              onClick={() => recordDecision('merged')}
              disabled={loading !== null}
              style={{
                width: '100%',
                padding: '11px 16px',
                borderRadius: 10,
                border: 'none',
                background: '#16A34A',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer',
                opacity: loading && loading !== 'merged' ? 0.5 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {loading === 'merged' ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Recording your decision...
                </>
              ) : (
                <>
                  <Check size={14} /> Merge my history
                </>
              )}
            </button>
          </div>

          {/* Option B: Keep private */}
          <div
            style={{
              border: '1px solid #E2E8F0',
              background: '#FAFBFC',
              borderRadius: 14,
              padding: '18px 20px',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Lock size={15} color="#475569" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                  Keep my history private
                </div>
                <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                  Your {memoCount} memo{memoCount === 1 ? '' : 's'} stay visible only to you. Any
                  new memos you create from now on will live in the team graph. This is a
                  reasonable choice if prior memos covered sensitive personal calibration or early
                  drafts you would rather not surface to the team.
                </div>
              </div>
            </div>
            <button
              onClick={() => recordDecision('private')}
              disabled={loading !== null}
              style={{
                width: '100%',
                padding: '11px 16px',
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#0F172A',
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer',
                opacity: loading && loading !== 'private' ? 0.5 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {loading === 'private' ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Recording your decision...
                </>
              ) : (
                <>
                  <Lock size={14} /> Keep my history private
                </>
              )}
            </button>
          </div>

          {error && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '10px 14px',
                marginBottom: 16,
                fontSize: 13,
                color: '#B91C1C',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 10,
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div
          style={{
            padding: '18px 32px 28px',
            borderTop: '1px solid #E2E8F0',
            background: '#FAFBFC',
            borderRadius: '0 0 20px 20px',
            fontSize: 12,
            color: '#64748B',
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: '#0F172A' }}>One-time decision.</strong> This choice applies only
          to memos captured before your team joined Strategy. New memos you audit from this point
          forward will automatically live in the team graph. You can contact support if you need
          to revise this choice later.
        </div>
      </div>
    </div>
  );
}
