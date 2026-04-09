'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Trash2, Loader2, X } from 'lucide-react';

/**
 * Dashboard banner for the Cold-Start Fix (M4).
 *
 * Three modes:
 *
 *   1. Fresh workspace (0 real docs, 0 sample docs) →
 *        "Populate with 3 sample analyses?" [Populate] [Dismiss]
 *
 *   2. Active sample mode (≥1 sample doc, <5 real docs) →
 *        "These 3 analyses are sample data. Upload your own to replace them." (info)
 *
 *   3. Ready to graduate (≥1 sample doc, ≥5 real docs) →
 *        "You have enough real decisions to stand on your own. Remove sample data?" [Remove] [Keep]
 *
 * Dismissals are remembered via localStorage so the banner doesn't nag
 * across page reloads. The underlying sample data is untouched — only
 * the banner visibility changes.
 */

interface DemoStatus {
  sampleCount: number;
  realCount: number;
  hasSamples: boolean;
  canClear: boolean;
  shouldOfferSeed: boolean;
  clearThreshold: number;
}

const DISMISS_KEY_SEED = 'di.demo.banner.seed.dismissed';
const DISMISS_KEY_CLEAR = 'di.demo.banner.clear.dismissed';

export function SampleDataBanner() {
  const [status, setStatus] = useState<DemoStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<'seed' | 'clear' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seedDismissed, setSeedDismissed] = useState(false);
  const [clearDismissed, setClearDismissed] = useState(false);

  // Load dismissal state from localStorage once on mount
  useEffect(() => {
    try {
      setSeedDismissed(localStorage.getItem(DISMISS_KEY_SEED) === '1');
      setClearDismissed(localStorage.getItem(DISMISS_KEY_CLEAR) === '1');
    } catch {
      // SSR / incognito / quota — treat as not-dismissed
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/demo/status');
      if (!res.ok) return;
      const data = (await res.json()) as DemoStatus;
      setStatus(data);
    } catch {
      // Silently fail — schema may not be migrated yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleSeed = async () => {
    setActionLoading('seed');
    setError(null);
    try {
      const res = await fetch('/api/demo/seed', { method: 'POST' });
      if (!res.ok) {
        setError('Could not populate sample data. Please try again.');
        return;
      }
      await fetchStatus();
    } catch {
      setError('Could not populate sample data. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClear = async () => {
    setActionLoading('clear');
    setError(null);
    try {
      const res = await fetch('/api/demo/clear-samples', { method: 'POST' });
      if (!res.ok) {
        setError('Could not clear sample data. Please try again.');
        return;
      }
      await fetchStatus();
    } catch {
      setError('Could not clear sample data. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const dismissSeedBanner = () => {
    setSeedDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY_SEED, '1');
    } catch {
      // Ignore
    }
  };

  const dismissClearBanner = () => {
    setClearDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY_CLEAR, '1');
    } catch {
      // Ignore
    }
  };

  if (loading || !status) return null;

  // ── Mode 1: Fresh workspace — offer to populate ──────────────────────────
  if (status.shouldOfferSeed && !seedDismissed) {
    return (
      <div
        className="rounded-lg border"
        style={{
          padding: '14px 18px',
          marginBottom: 16,
          background: 'rgba(59, 130, 246, 0.06)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <Sparkles size={20} style={{ color: '#60a5fa', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            Explore Decision Intel with sample data
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Populate your workspace with 3 anonymized sample analyses (Nokia acquisition, a strategy
            expansion, and a capital allocation decision) so you can see the Decision Graph, Bias
            Library, and Team Cognitive Profile in action. Remove them any time.
          </div>
          {error && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>{error}</div>}
        </div>
        <button
          onClick={handleSeed}
          disabled={actionLoading !== null}
          className="btn btn-primary btn-sm"
          style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {actionLoading === 'seed' ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Sparkles size={14} />
          )}
          Populate
        </button>
        <button
          onClick={dismissSeedBanner}
          aria-label="Dismiss"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4,
          }}
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  // ── Mode 3: Ready to graduate — offer to clear ───────────────────────────
  if (status.canClear && !clearDismissed) {
    return (
      <div
        className="rounded-lg border"
        style={{
          padding: '14px 18px',
          marginBottom: 16,
          background: 'rgba(34, 197, 94, 0.06)',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <Trash2 size={20} style={{ color: '#4ade80', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            Ready to remove sample data?
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            You have {status.realCount} real analyses — enough to stand on your own. Remove the{' '}
            {status.sampleCount} sample {status.sampleCount === 1 ? 'analysis' : 'analyses'} we
            seeded at signup?
          </div>
          {error && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>{error}</div>}
        </div>
        <button
          onClick={handleClear}
          disabled={actionLoading !== null}
          className="btn btn-secondary btn-sm"
          style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {actionLoading === 'clear' ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Trash2 size={14} />
          )}
          Remove sample data
        </button>
        <button
          onClick={dismissClearBanner}
          aria-label="Keep samples for now"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4,
          }}
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  // Mode 2 and default: no banner shown
  return null;
}
