'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Share2, Copy, Check, Loader2, Lock, Eye, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/EnhancedToast';

// Graph share modal (A2 deep, locked 2026-04-27).
//
// Buyer scenario: CSO at /dashboard/decision-graph, sees her org's graph
// populated with 12 decisions + bias edges + 4 outcome nodes. She wants to
// send this to the CFO. Clicks Share → modal lets her toggle redaction
// (hide bias type names but keep DQI counts visible — for LP-bound reads),
// optional password, expiry. Submit → modal swaps to a "copy link" view
// with the URL + viewers count + revoke option.
//
// Snapshot semantics: server captures the graph-network report at create-
// time. The shared URL renders THAT snapshot, not live data — protects
// against future audits leaking via the shared link.

interface GraphShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Time range used by the live graph view; we snapshot the same range. */
  timeRangeDays: number;
}

interface ShareLinkResult {
  id: string;
  token: string;
  publicPath: string;
  expiresAt: string | null;
  isRedacted: boolean;
  hasPassword: boolean;
}

export function GraphShareModal({ open, onOpenChange, timeRangeDays }: GraphShareModalProps) {
  const { showToast } = useToast();
  const [isRedacted, setIsRedacted] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [expiresInDays, setExpiresInDays] = useState<number>(30);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<ShareLinkResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [confirmingRevoke, setConfirmingRevoke] = useState(false);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setCopied(false);
    setIsRedacted(false);
    setUsePassword(false);
    setPassword('');
    setExpiresInDays(30);
  }, []);

  const handleCreate = useCallback(async () => {
    if (creating) return;
    if (usePassword && password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/graph-share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isRedacted,
          expiresInDays,
          password: usePassword && password ? password : undefined,
          timeRangeDays,
        }),
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error ?? `Failed (${res.status})`);
      }
      const data = (await res.json()) as ShareLinkResult;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create share link.');
    } finally {
      setCreating(false);
    }
  }, [creating, usePassword, password, isRedacted, expiresInDays, timeRangeDays]);

  const fullUrl = result
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}${result.publicPath}`
    : '';

  const handleCopy = useCallback(async () => {
    if (!fullUrl) return;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      showToast('Share URL copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Could not copy. Long-press the field to copy manually.', 'error');
    }
  }, [fullUrl, showToast]);

  const handleRevoke = useCallback(async () => {
    if (!result || revoking) return;
    setRevoking(true);
    try {
      const res = await fetch(`/api/graph-share?id=${result.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Could not revoke');
      showToast('Share link revoked', 'success');
      reset();
      onOpenChange(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Revoke failed', 'error');
    } finally {
      setRevoking(false);
      setConfirmingRevoke(false);
    }
  }, [result, revoking, showToast, reset, onOpenChange]);

  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        if (!isOpen) reset();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Share2 size={18} style={{ color: 'var(--accent-primary)' }} />
            Share this Decision Knowledge Graph
          </DialogTitle>
          <DialogDescription>
            Generates a public URL that renders a snapshot of your graph at this moment. Subsequent
            audits stay private; only what&apos;s in the snapshot is visible to viewers.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            {/* Redaction toggle */}
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: 12,
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${isRedacted ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                background: isRedacted ? 'rgba(22, 163, 74, 0.04)' : 'var(--bg-card)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={isRedacted}
                onChange={e => setIsRedacted(e.target.checked)}
                style={{ marginTop: 2 }}
              />
              <span style={{ flex: 1 }}>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  <Eye size={13} />
                  Client-Safe Redact mode
                </span>
                <span
                  style={{
                    display: 'block',
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    marginTop: 4,
                    lineHeight: 1.5,
                  }}
                >
                  Hides specific bias names with [BIAS_N] placeholders. Keeps DQI counts, risk
                  levels, and structural patterns visible. Use when sharing with LPs / audit
                  committees / CFOs you don&apos;t want seeing every bias your team trips most.
                </span>
              </span>
            </label>

            {/* Expiry */}
            <div>
              <label
                htmlFor="graph-share-expiry"
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 6,
                }}
              >
                Expires in
              </label>
              <select
                id="graph-share-expiry"
                value={expiresInDays}
                onChange={e => setExpiresInDays(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                }}
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days (recommended)</option>
                <option value={90}>90 days</option>
                <option value={365}>1 year</option>
              </select>
            </div>

            {/* Password gate */}
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: 12,
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${usePassword ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                background: usePassword ? 'rgba(22, 163, 74, 0.04)' : 'var(--bg-card)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={usePassword}
                onChange={e => setUsePassword(e.target.checked)}
                style={{ marginTop: 2 }}
              />
              <span style={{ flex: 1 }}>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  <Lock size={13} />
                  Require a password
                </span>
              </span>
            </label>
            {usePassword && (
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 4 characters"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'var(--bg-card-hover)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  marginTop: -6,
                }}
                autoComplete="off"
              />
            )}

            {error && (
              <div
                role="alert"
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  fontSize: 12,
                  color: 'var(--error)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <AlertTriangle size={13} />
                {error}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="btn"
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating || (usePassword && password.length < 4)}
                className="btn"
                style={{
                  padding: '8px 16px',
                  background: 'var(--accent-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor:
                    creating || (usePassword && password.length < 4) ? 'not-allowed' : 'pointer',
                  opacity: creating || (usePassword && password.length < 4) ? 0.6 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
                {creating ? 'Creating…' : 'Create share link'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            <div
              style={{
                padding: 12,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(22, 163, 74, 0.06)',
                border: '1px solid rgba(22, 163, 74, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                color: 'var(--accent-primary)',
                fontWeight: 600,
              }}
            >
              <Check size={16} />
              Share link created
              {result.isRedacted && (
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: 'rgba(245, 158, 11, 0.12)',
                    color: '#fbbf24',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  Redacted
                </span>
              )}
              {result.hasPassword && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: 'rgba(99, 102, 241, 0.12)',
                    color: '#a5b4fc',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <Lock size={9} /> Password
                </span>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                gap: 6,
                alignItems: 'stretch',
              }}
            >
              <input
                type="text"
                readOnly
                value={fullUrl}
                onFocus={e => e.currentTarget.select()}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  background: 'var(--bg-card-hover)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              />
              <button
                type="button"
                onClick={handleCopy}
                className="btn"
                style={{
                  padding: '8px 14px',
                  background: copied ? 'var(--success)' : 'var(--accent-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  flexShrink: 0,
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            {result.expiresAt && (
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                }}
              >
                Expires{' '}
                {new Date(result.expiresAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            )}

            <div
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                padding: 10,
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
              }}
            >
              <strong style={{ color: 'var(--text-primary)' }}>What viewers will see:</strong> a
              read-only snapshot of the graph as it stands now — top decisions, bias patterns, risk
              state, structural anti-patterns. No live data, no future audits.
              {result.isRedacted && ' Bias names are hidden; counts and severity stay visible.'}
            </div>

            {/* Inline revoke confirmation — replaces native window.confirm
                per CLAUDE.md native-dialog ban on wow-moment surfaces. */}
            {confirmingRevoke ? (
              <div
                role="alertdialog"
                aria-labelledby="revoke-confirm-title"
                style={{
                  marginTop: 4,
                  padding: 12,
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(239, 68, 68, 0.06)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                <div
                  id="revoke-confirm-title"
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: 4,
                  }}
                >
                  Revoke this share link?
                </div>
                <p
                  style={{
                    margin: '0 0 10px',
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  Anyone with the URL will lose access immediately. This cannot be undone.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setConfirmingRevoke(false)}
                    disabled={revoking}
                    className="btn"
                    style={{
                      padding: '6px 12px',
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Keep link
                  </button>
                  <button
                    type="button"
                    onClick={handleRevoke}
                    disabled={revoking}
                    className="btn"
                    style={{
                      padding: '6px 12px',
                      background: 'var(--error)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: revoking ? 'wait' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {revoking && <Loader2 size={11} className="animate-spin" />}
                    {revoking ? 'Revoking…' : 'Revoke now'}
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  marginTop: 4,
                }}
              >
                <button
                  type="button"
                  onClick={() => setConfirmingRevoke(true)}
                  className="btn"
                  style={{
                    padding: '8px 14px',
                    background: 'transparent',
                    color: 'var(--error)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Revoke link
                </button>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="btn"
                  style={{
                    padding: '8px 16px',
                    background: 'var(--accent-primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
