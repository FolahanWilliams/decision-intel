'use client';

/**
 * AmbientSignalBanner — surfaces pending thesis-formation signals
 * detected ambiently in Slack / Drive / email.
 *
 * Locked 2026-05-10 per Tier 2.2 + Deep Research paper #2 Ch 6 / Ch 12
 * condition #1 (friction collapse). Per Paper Ch 6: the audit must fire
 * BEFORE deal-fever locks in. This banner is the surface where ambient
 * detection asks the user "we saw you discussing [target] — start an
 * audit?" before the IC memo crystallises.
 *
 * Rendering rules:
 *   - Polls /api/ambient-signals?status=pending on mount + every 90s.
 *   - Returns null when there are no pending signals (banner is silent
 *     when not needed).
 *   - Cap the rendered list at 3 signals (most-recent-first). The full
 *     list is one click away via "View all".
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, FolderOpen, Mail, Lightbulb, X, ArrowRight, Loader2 } from 'lucide-react';

interface SignalExtractedFields {
  targetName?: string;
  decisionFrame?: string;
  convictionLanguage?: string;
  sector?: string;
  kind?: 'investment' | 'acquisition' | 'strategic';
}

interface SignalDto {
  id: string;
  source: 'slack' | 'drive' | 'email';
  sourceRef: string;
  sourceParentRef: string | null;
  detectedAt: string;
  confidence: number;
  extractedFields: SignalExtractedFields;
  excerpt: string;
  status: string;
  containerId: string | null;
  expiresAt: string;
}

const SOURCE_ICONS: Record<SignalDto['source'], typeof MessageSquare> = {
  slack: MessageSquare,
  drive: FolderOpen,
  email: Mail,
};

const SOURCE_LABELS: Record<SignalDto['source'], string> = {
  slack: 'Slack',
  drive: 'Drive',
  email: 'Email',
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  return `${d}d ago`;
}

export function AmbientSignalBanner() {
  const router = useRouter();
  const [signals, setSignals] = useState<SignalDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);

  const fetchSignals = useCallback(async () => {
    try {
      const res = await fetch('/api/ambient-signals?status=pending&limit=5', {
        credentials: 'include',
      });
      if (!res.ok) return;
      const data = (await res.json()) as { signals: SignalDto[] };
      setSignals(data.signals ?? []);
    } catch {
      // Banner is fail-silent — pre-T2.2 envs without the table return empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSignals();
    const interval = setInterval(() => void fetchSignals(), 90_000);
    return () => clearInterval(interval);
  }, [fetchSignals]);

  const dismiss = async (signalId: string) => {
    setResolving(signalId);
    try {
      await fetch(`/api/ambient-signals/${signalId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setSignals(prev => prev.filter(s => s.id !== signalId));
    } finally {
      setResolving(null);
    }
  };

  const startAudit = async (signal: SignalDto) => {
    setResolving(signal.id);
    // Mark confirmed without container yet; the /decisions/new flow will
    // pick up the prefill via query params.
    try {
      await fetch(`/api/ambient-signals/${signal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'confirm' }),
      });
    } finally {
      // Prefill the new-container surface from extractedFields.
      const params = new URLSearchParams({ from_signal: signal.id });
      if (signal.extractedFields.targetName) params.set('name', signal.extractedFields.targetName);
      if (signal.extractedFields.decisionFrame)
        params.set('frame', signal.extractedFields.decisionFrame);
      if (signal.extractedFields.kind) params.set('kind', signal.extractedFields.kind);
      if (signal.extractedFields.sector) params.set('sector', signal.extractedFields.sector);
      router.push(`/dashboard/decisions/new?${params.toString()}`);
    }
  };

  const visible = useMemo(() => signals.slice(0, 3), [signals]);

  if (loading || visible.length === 0) return null;

  return (
    <div
      style={{
        marginBottom: 16,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderTop: '3px solid var(--info)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Lightbulb size={14} style={{ color: 'var(--info)' }} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--info)',
          }}
        >
          Detected — possible decision in formation
        </span>
        <span
          style={{
            fontSize: 'var(--fs-xs)',
            color: 'var(--text-muted)',
            marginLeft: 'auto',
          }}
        >
          {visible.length} pending signal{visible.length !== 1 ? 's' : ''}
        </span>
      </header>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {visible.map((signal, idx) => {
          const Icon = SOURCE_ICONS[signal.source];
          const target =
            signal.extractedFields.targetName ?? signal.extractedFields.decisionFrame ?? 'Untitled';
          return (
            <li
              key={signal.id}
              style={{
                padding: '12px 16px',
                borderBottom: idx < visible.length - 1 ? '1px solid var(--border-color)' : 'none',
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
              }}
            >
              <Icon size={16} style={{ color: 'var(--text-muted)', marginTop: 2, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 6,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontSize: 'var(--fs-sm)',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {target}
                  </span>
                  {signal.extractedFields.kind && (
                    <span
                      style={{
                        fontSize: 'var(--fs-2xs)',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'color-mix(in srgb, var(--info) 12%, transparent)',
                        color: 'var(--info)',
                        fontWeight: 600,
                      }}
                    >
                      {signal.extractedFields.kind}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 'var(--fs-2xs)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {SOURCE_LABELS[signal.source]} · {timeAgo(signal.detectedAt)} ·{' '}
                    {Math.round(signal.confidence * 100)}% confidence
                  </span>
                </div>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: 'var(--fs-xs)',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    fontStyle: 'italic',
                  }}
                >
                  &ldquo;
                  {signal.excerpt.length > 220
                    ? signal.excerpt.slice(0, 217) + '…'
                    : signal.excerpt}
                  &rdquo;
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => startAudit(signal)}
                  disabled={resolving === signal.id}
                  style={{
                    padding: '6px 10px',
                    background: 'var(--accent-primary)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--fs-xs)',
                    fontWeight: 600,
                    color: '#fff',
                    cursor: resolving === signal.id ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {resolving === signal.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <ArrowRight size={12} />
                  )}
                  Start audit
                </button>
                <button
                  type="button"
                  onClick={() => dismiss(signal.id)}
                  disabled={resolving === signal.id}
                  aria-label="Dismiss signal"
                  style={{
                    padding: 4,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: resolving === signal.id ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignSelf: 'center',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
