'use client';

/**
 * AmbientCaptureConsentPanel — opt-in / opt-out toggles for ambient
 * thesis-formation detection on Slack + Drive (Tier 2.2, locked 2026-05-10).
 *
 * Privacy posture: default OFF on every installation. Enabling capture
 * on Slack lets the user pick which channels are parsed (must already
 * be in monitoredChannels — the same list that gates analysis ingestion,
 * so users only manage one consent list). Enabling on Drive reuses the
 * existing monitoredFolders for scoping.
 *
 * Surfaces only when at least one integration is installed; otherwise
 * the empty-state explains the pathway.
 */

import { useCallback, useEffect, useState } from 'react';
import { AccentCard } from '@/components/ui/AccentCard';
import {
  Radio,
  ShieldCheck,
  MessageSquare,
  FolderOpen,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

interface ConsentState {
  slack: {
    installed: boolean;
    ambientCaptureEnabled: boolean;
    monitoredChannels: string[];
    ambientCaptureChannels: string[];
  };
  drive: {
    installed: boolean;
    ambientCaptureEnabled: boolean;
    monitoredFolders: string[];
  };
}

export function AmbientCaptureConsentPanel() {
  const [state, setState] = useState<ConsentState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations/ambient-consent', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load ambient consent state');
      const data = (await res.json()) as ConsentState;
      setState(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchState();
  }, [fetchState]);

  const patch = async (
    body:
      | { slack: { ambientCaptureEnabled?: boolean; ambientCaptureChannels?: string[] } }
      | { drive: { ambientCaptureEnabled: boolean } }
  ) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/integrations/ambient-consent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? 'Failed to update consent');
      }
      await fetchState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AccentCard
      accent="info"
      title={
        <>
          <Radio size={16} style={{ color: 'var(--info)' }} />
          <span>Ambient Decision Capture</span>
        </>
      }
    >
      <p
        style={{
          margin: '0 0 12px',
          fontSize: 'var(--fs-xs)',
          color: 'var(--text-muted)',
          lineHeight: 1.5,
        }}
      >
        Watch the connected Slack channels and Drive folders for early thesis-formation signals.
        When the classifier flags a likely decision in formation, the dashboard shows a banner
        inviting you to start an audit — before the memo crystallises. Per paper Ch 6 (Deep
        Research, 2026-05-10), the audit must fire pre-formalization to beat deal-fever. Default
        OFF; you control which channels are watched.
      </p>

      <p
        style={{
          margin: '0 0 16px',
          fontSize: 'var(--fs-2xs)',
          color: 'var(--text-muted)',
          lineHeight: 1.5,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 6,
          padding: '8px 10px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        <ShieldCheck size={12} style={{ marginTop: 2, flexShrink: 0, color: 'var(--success)' }} />
        <span>
          Raw message content is never persisted; only ≤500-char excerpts of explicitly- flagged
          signals are stored, and unconfirmed signals auto-archive after 14 days. Every consent flip
          is audit-logged.
        </span>
      </p>

      {loading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--text-muted)',
            fontSize: 'var(--fs-sm)',
          }}
        >
          <Loader2 size={14} className="animate-spin" /> Loading consent state…
        </div>
      )}

      {!loading && state && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Slack section */}
          <div
            style={{
              padding: '12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
              }}
            >
              <MessageSquare size={14} style={{ color: 'var(--text-secondary)' }} />
              <span
                style={{
                  fontSize: 'var(--fs-sm)',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                Slack
              </span>
              {state.slack.installed ? (
                <label
                  style={{
                    marginLeft: 'auto',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: 'var(--fs-xs)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={state.slack.ambientCaptureEnabled}
                    disabled={saving}
                    onChange={e => patch({ slack: { ambientCaptureEnabled: e.target.checked } })}
                  />
                  <span>Watch for signals</span>
                </label>
              ) : (
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: 'var(--fs-2xs)',
                    color: 'var(--text-muted)',
                  }}
                >
                  Not connected
                </span>
              )}
            </div>
            {state.slack.installed ? (
              state.slack.monitoredChannels.length === 0 ? (
                <p style={{ margin: 0, fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}>
                  No channels are currently monitored — configure channels in the Slack section
                  above to enable ambient capture.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                    }}
                  >
                    Channels to watch (subset of monitored)
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {state.slack.monitoredChannels.map(channelId => {
                      const watching = state.slack.ambientCaptureChannels.includes(channelId);
                      return (
                        <button
                          key={channelId}
                          type="button"
                          disabled={saving || !state.slack.ambientCaptureEnabled}
                          onClick={() => {
                            const next = watching
                              ? state.slack.ambientCaptureChannels.filter(c => c !== channelId)
                              : [...state.slack.ambientCaptureChannels, channelId];
                            void patch({ slack: { ambientCaptureChannels: next } });
                          }}
                          style={{
                            padding: '4px 8px',
                            background: watching
                              ? 'color-mix(in srgb, var(--info) 14%, var(--bg-card))'
                              : 'var(--bg-card)',
                            border: `1px solid ${watching ? 'var(--info)' : 'var(--border-color)'}`,
                            borderRadius: 'var(--radius-full)',
                            fontSize: 'var(--fs-2xs)',
                            color: watching ? 'var(--info)' : 'var(--text-secondary)',
                            fontWeight: watching ? 600 : 500,
                            cursor:
                              saving || !state.slack.ambientCaptureEnabled
                                ? 'not-allowed'
                                : 'pointer',
                            opacity: !state.slack.ambientCaptureEnabled ? 0.5 : 1,
                          }}
                        >
                          {channelId}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )
            ) : null}
          </div>

          {/* Drive section */}
          <div
            style={{
              padding: '12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 4,
              }}
            >
              <FolderOpen size={14} style={{ color: 'var(--text-secondary)' }} />
              <span
                style={{
                  fontSize: 'var(--fs-sm)',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                Google Drive
              </span>
              {state.drive.installed ? (
                <label
                  style={{
                    marginLeft: 'auto',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: 'var(--fs-xs)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={state.drive.ambientCaptureEnabled}
                    disabled={saving}
                    onChange={e => patch({ drive: { ambientCaptureEnabled: e.target.checked } })}
                  />
                  <span>Watch for signals</span>
                </label>
              ) : (
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: 'var(--fs-2xs)',
                    color: 'var(--text-muted)',
                  }}
                >
                  Not connected
                </span>
              )}
            </div>
            {state.drive.installed && (
              <p
                style={{ margin: '4px 0 0', fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}
              >
                Scope inherits from your monitored folders ({state.drive.monitoredFolders.length}{' '}
                currently). File-body classification is metadata-only in v1; full content parsing is
                queued for the next session.
              </p>
            )}
          </div>

          {error && (
            <p
              role="alert"
              style={{
                margin: 0,
                fontSize: 'var(--fs-xs)',
                color: 'var(--error)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <AlertTriangle size={12} /> {error}
            </p>
          )}
        </div>
      )}
    </AccentCard>
  );
}
