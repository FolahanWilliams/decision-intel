'use client';

/**
 * Document visibility + access-grant editor (3.5).
 *
 * Renders a small modal where the document owner picks one of three modes:
 *   - Private  — only the owner reads it.
 *   - Team     — anyone in the same org reads it (default).
 *   - Specific — owner + an explicit allowlist of teammates.
 *
 * When 'Specific' is picked, a teammate checkbox list appears. Save flips
 * the doc's visibility and replaces the grant set in one PATCH.
 *
 * Surface: opened from a small "Visibility · {label}" pill on the document
 * detail page header. Owner-only — for non-owners the API returns 404 so
 * the modal stays unreachable from the UI.
 */

import { useEffect, useState } from 'react';
import { Lock, Users, UserPlus, X, Check, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/EnhancedToast';

export type DocumentVisibility = 'private' | 'team' | 'specific';

interface Teammate {
  userId: string;
  email: string;
  displayName?: string;
}

interface Props {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
  /** Called after a successful save with the new visibility setting. */
  onSaved?: (visibility: DocumentVisibility) => void;
}

const OPTIONS: Array<{
  id: DocumentVisibility;
  label: string;
  hint: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
}> = [
  {
    id: 'private',
    label: 'Private',
    hint: 'Only you can read it.',
    icon: Lock,
  },
  {
    id: 'team',
    label: 'Team',
    hint: 'Everyone in your org can read it.',
    icon: Users,
  },
  {
    id: 'specific',
    label: 'Specific people',
    hint: 'You + the teammates you pick below.',
    icon: UserPlus,
  },
];

export function DocumentVisibilityModal({ documentId, isOpen, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [visibility, setVisibility] = useState<DocumentVisibility>('team');
  const [grantedUserIds, setGrantedUserIds] = useState<Set<string>>(new Set());
  const [teammates, setTeammates] = useState<Teammate[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetch(`/api/documents/${documentId}/visibility`).then(r => (r.ok ? r.json() : null)),
      fetch('/api/team').then(r => (r.ok ? r.json() : null)),
    ])
      .then(([visData, teamData]) => {
        if (cancelled) return;
        if (visData) {
          setVisibility((visData.visibility as DocumentVisibility) || 'team');
          setGrantedUserIds(
            new Set((visData.grants || []).map((g: { userId: string }) => g.userId))
          );
        }
        if (teamData) {
          const members: Array<{
            userId: string;
            email: string;
            displayName?: string | null;
          }> = teamData.organization?.members ?? [];
          setTeammates(
            members.map(m => ({
              userId: m.userId,
              email: m.email,
              displayName: m.displayName ?? undefined,
            }))
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [documentId, isOpen]);

  const toggleGrant = (userId: string) => {
    setGrantedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body =
        visibility === 'specific'
          ? { visibility, grantedUserIds: Array.from(grantedUserIds) }
          : { visibility };
      const res = await fetch(`/api/documents/${documentId}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || `Save failed (${res.status})`, 'error');
        return;
      }
      showToast(`Visibility set to ${visibility}.`, 'success');
      onSaved?.(visibility);
      onClose();
    } catch {
      showToast('Save failed. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="card w-full sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle style={{ fontSize: 15, fontWeight: 600 }}>
            Who can read this document?
          </DialogTitle>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            Visibility controls internal access. Public share links (created via the share
            modal) are governed separately by their own expiry rules.
          </p>
        </DialogHeader>

        {loading ? (
          <div
            style={{
              padding: 30,
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <Loader2
              size={18}
              className="animate-spin"
              style={{ display: 'inline-block', verticalAlign: -3, marginRight: 8 }}
            />
            Loading…
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {OPTIONS.map(opt => {
              const active = visibility === opt.id;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  onClick={() => setVisibility(opt.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    background: active ? 'rgba(22,163,74,0.08)' : 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon
                    size={18}
                    style={{
                      color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {opt.label}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        marginTop: 2,
                        lineHeight: 1.4,
                      }}
                    >
                      {opt.hint}
                    </div>
                  </div>
                  {active && (
                    <Check size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                  )}
                </button>
              );
            })}

            {visibility === 'specific' && (
              <div
                style={{
                  marginTop: 6,
                  padding: '12px 14px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-elevated)',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: 8,
                  }}
                >
                  Pick teammates
                </div>
                {teammates.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    No teammates found. Invite people from{' '}
                    <a
                      href="/dashboard/team"
                      style={{ color: 'var(--accent-primary)', fontWeight: 600 }}
                    >
                      Team settings
                    </a>{' '}
                    first.
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      maxHeight: 220,
                      overflowY: 'auto',
                    }}
                  >
                    {teammates.map(t => {
                      const checked = grantedUserIds.has(t.userId);
                      return (
                        <button
                          key={t.userId}
                          onClick={() => toggleGrant(t.userId)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            background: checked ? 'rgba(22,163,74,0.12)' : 'transparent',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <span
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: 4,
                              border: `1.5px solid ${checked ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                              background: checked ? 'var(--accent-primary)' : 'transparent',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {checked && <Check size={11} style={{ color: 'white' }} />}
                          </span>
                          <span
                            style={{
                              fontSize: 12.5,
                              color: 'var(--text-primary)',
                              fontWeight: 500,
                            }}
                          >
                            {t.displayName || t.email}
                          </span>
                          {t.displayName && (
                            <span
                              style={{
                                fontSize: 11,
                                color: 'var(--text-muted)',
                              }}
                            >
                              {t.email}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    marginTop: 8,
                  }}
                >
                  {grantedUserIds.size} teammate{grantedUserIds.size !== 1 ? 's' : ''} selected.
                </div>
              </div>
            )}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <X size={13} /> Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loading}
            style={{
              background: 'var(--accent-primary)',
              color: 'white',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const VISIBILITY_LABELS: Record<DocumentVisibility, string> = {
  private: 'Private',
  team: 'Team',
  specific: 'Specific',
};

const VISIBILITY_HEX: Record<DocumentVisibility, string> = {
  private: '#7F1D1D',
  team: '#16A34A',
  specific: '#2563EB',
};

/**
 * Trigger pill — sits in the document-detail header so the owner can
 * eyeball current state and click into the modal. For non-owners the
 * pill is render-only (display, no click).
 */
export function DocumentVisibilityPill({
  visibility,
  onClick,
}: {
  visibility: DocumentVisibility;
  onClick?: () => void;
}) {
  const Icon = visibility === 'private' ? Lock : visibility === 'team' ? Users : UserPlus;
  const colour = VISIBILITY_HEX[visibility];
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        border: `1px solid ${colour}33`,
        background: `${colour}14`,
        color: colour,
        fontSize: 11,
        fontWeight: 700,
        cursor: onClick ? 'pointer' : 'default',
        whiteSpace: 'nowrap',
      }}
      title={onClick ? 'Change document visibility' : 'Document visibility'}
    >
      <Icon size={11} />
      {VISIBILITY_LABELS[visibility]}
    </button>
  );
}
