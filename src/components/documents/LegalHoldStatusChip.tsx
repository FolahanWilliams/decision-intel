'use client';

/**
 * Legal-hold status surface on the document detail page (2.1 deep).
 *
 * Renders a compact chip showing whether the document is on legal hold.
 * Owner can place / release the hold inline. Held documents are
 * preserved by the retention cron — both soft-delete and hard-purge
 * skip them entirely.
 *
 * Procurement value: an in-progress litigation matter or regulator
 * inquiry needs a defensible hold register, not a verbal commitment to
 * "remember not to delete it."
 */

import { useState, useCallback } from 'react';
import { Lock, Unlock, Loader2, X, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/EnhancedToast';

interface Props {
  documentId: string;
  legalHoldId: string | null;
  legalHold: {
    id: string;
    reason: string | null;
    holdUntil: string | null;
    releasedAt: string | null;
    grantedById: string;
    createdAt: string;
  } | null;
  isOwner?: boolean;
  onChanged?: () => void;
}

export function LegalHoldStatusChip({
  documentId,
  legalHoldId,
  legalHold,
  isOwner,
  onChanged,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [reason, setReason] = useState('');
  const [holdUntil, setHoldUntil] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const isHeld = !!legalHoldId && (!legalHold || !legalHold.releasedAt);

  const handlePlace = useCallback(async () => {
    if (reason.trim().length < 4) {
      showToast('Reason is required (≥4 characters).', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/legal-holds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reason.trim(),
          holdUntil: holdUntil ? new Date(holdUntil).toISOString() : null,
          documentIds: [documentId],
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || `Hold failed (${res.status})`, 'error');
        return;
      }
      showToast('Document placed on legal hold.', 'success');
      setEditing(false);
      setReason('');
      setHoldUntil('');
      onChanged?.();
    } catch {
      showToast('Hold failed.', 'error');
    } finally {
      setSaving(false);
    }
  }, [documentId, reason, holdUntil, onChanged, showToast]);

  const handleRelease = useCallback(async () => {
    if (!legalHoldId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/legal-holds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: legalHoldId, release: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || `Release failed (${res.status})`, 'error');
        return;
      }
      showToast('Legal hold released.', 'success');
      onChanged?.();
    } catch {
      showToast('Release failed.', 'error');
    } finally {
      setSaving(false);
    }
  }, [legalHoldId, onChanged, showToast]);

  if (!isHeld && !isOwner) return null;

  return (
    <>
      <button
        onClick={isOwner ? () => setEditing(true) : undefined}
        disabled={!isOwner}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 999,
          border: `1px solid ${isHeld ? '#7F1D1D33' : 'var(--border-color)'}`,
          background: isHeld ? 'rgba(127,29,29,0.10)' : 'var(--bg-card)',
          color: isHeld ? '#7F1D1D' : 'var(--text-muted)',
          fontSize: 11,
          fontWeight: 700,
          cursor: isOwner ? 'pointer' : 'default',
          whiteSpace: 'nowrap',
        }}
        title={
          isHeld
            ? `Legal hold · ${legalHold?.reason ? legalHold.reason.slice(0, 80) : 'reason on file'}`
            : 'Place this document on legal hold'
        }
      >
        {isHeld ? <Lock size={11} /> : <Unlock size={11} />}
        {isHeld ? 'Legal hold' : 'No hold'}
      </button>

      {isOwner && (
        <Dialog open={editing} onOpenChange={open => !open && setEditing(false)}>
          <DialogContent className="card w-full sm:max-w-md" showCloseButton>
            <DialogHeader>
              <DialogTitle style={{ fontSize: 15, fontWeight: 700 }}>
                {isHeld ? 'Release legal hold' : 'Place on legal hold'}
              </DialogTitle>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                {isHeld
                  ? 'Releasing the hold removes retention protection. The document re-enters the cron\'s normal soft-delete + hard-purge schedule.'
                  : 'Held documents are preserved from retention enforcement. Both soft-delete and hard-purge skip them until the hold is released.'}
              </p>
            </DialogHeader>

            {!isHeld && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  marginTop: 8,
                }}
              >
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                    Reason (required)
                  </span>
                  <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    rows={3}
                    placeholder="e.g. Litigation matter — In re Acme v. ours, hold per outside counsel."
                    style={{
                      padding: '8px 10px',
                      fontSize: 13,
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                    Hold until (optional)
                  </span>
                  <input
                    type="date"
                    value={holdUntil}
                    onChange={e => setHoldUntil(e.target.value)}
                    style={{
                      padding: '8px 10px',
                      fontSize: 13,
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </label>
              </div>
            )}

            {isHeld && legalHold && (
              <div
                style={{
                  marginTop: 8,
                  padding: '10px 12px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                }}
              >
                <div style={{ marginBottom: 4 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Reason:</strong>{' '}
                  {legalHold.reason ?? '—'}
                </div>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Held since:</strong>{' '}
                  {new Date(legalHold.createdAt).toLocaleDateString()}
                  {legalHold.holdUntil && (
                    <>
                      {' · '}
                      <strong style={{ color: 'var(--text-primary)' }}>Until:</strong>{' '}
                      {new Date(legalHold.holdUntil).toLocaleDateString()}
                    </>
                  )}
                </div>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 6,
                marginTop: 12,
                paddingTop: 10,
                borderTop: '1px solid var(--border-color)',
              }}
            >
              <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                <X size={13} /> Cancel
              </Button>
              {isHeld ? (
                <Button
                  onClick={handleRelease}
                  disabled={saving}
                  style={{
                    background: '#DC2626',
                    color: 'white',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Unlock size={13} />}
                  Release
                </Button>
              ) : (
                <Button
                  onClick={handlePlace}
                  disabled={saving || reason.trim().length < 4}
                  style={{
                    background: '#7F1D1D',
                    color: 'white',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  Place on hold
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
