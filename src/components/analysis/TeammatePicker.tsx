'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Search, User } from 'lucide-react';

export interface Teammate {
  userId: string;
  email: string;
  displayName: string | null;
  role?: string;
}

interface Props {
  /** Currently-selected userId, or null when nothing is picked yet. */
  value: string | null;
  onChange: (userId: string | null) => void;
  /** Optional pre-loaded teammates. When omitted, the component fetches /api/team. */
  teammates?: Teammate[];
  /** Hide a specific user (e.g. self) from the list. */
  excludeUserId?: string | null;
  placeholder?: string;
  disabled?: boolean;
  /** Visual width — defaults to 220px. */
  width?: number | string;
}

/**
 * Lightweight teammate picker — fetches the caller's org members from
 * /api/team and renders a searchable dropdown. Used by:
 *   - the BiasCollabPanel "Assign to" form
 *   - any future @mention or share-with surface
 *
 * Single-org assumption: today every user is in at most one org. If we
 * ever ship multi-org users, this should accept an `orgId` prop and pass
 * it through to the API.
 */
export function TeammatePicker({
  value,
  onChange,
  teammates: provided,
  excludeUserId,
  placeholder = 'Pick a teammate',
  disabled = false,
  width = 240,
}: Props) {
  const [fetched, setFetched] = useState<Teammate[] | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Memo the resolution so the useMemo on `filtered` doesn't re-derive on
  // every render — `provided ?? fetched ?? []` would create a new [] each
  // render and invalidate the downstream memo.
  const teammates = useMemo(() => provided ?? fetched ?? [], [provided, fetched]);

  useEffect(() => {
    if (provided) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/team');
        if (!res.ok) throw new Error(`Failed (${res.status})`);
        const data = (await res.json()) as {
          organization?: {
            members?: Array<{
              userId: string;
              email: string;
              displayName?: string | null;
              role?: string;
            }>;
          } | null;
        };
        if (cancelled) return;
        const members = data.organization?.members ?? [];
        setFetched(
          members.map(m => ({
            userId: m.userId,
            email: m.email,
            displayName: m.displayName ?? null,
            role: m.role,
          }))
        );
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load teammates');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [provided]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return teammates
      .filter(t => (excludeUserId ? t.userId !== excludeUserId : true))
      .filter(t => {
        if (!q) return true;
        return t.email.toLowerCase().includes(q) || (t.displayName ?? '').toLowerCase().includes(q);
      });
  }, [teammates, query, excludeUserId]);

  const selected = teammates.find(t => t.userId === value) ?? null;

  return (
    <div style={{ position: 'relative', width, display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '7px 10px',
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <User size={13} style={{ opacity: 0.6 }} />
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selected ? (
            selected.displayName || selected.email
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>{placeholder}</span>
          )}
        </span>
        <ChevronDown size={13} style={{ opacity: 0.6 }} />
      </button>

      {open && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            zIndex: 50,
            maxHeight: 280,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 10px',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <Search size={12} style={{ color: 'var(--text-muted)' }} />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or email"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: 12.5,
              }}
            />
          </div>

          <div style={{ overflowY: 'auto', maxHeight: 220 }}>
            {error && (
              <div style={{ padding: 12, fontSize: 12, color: 'var(--severity-high)' }}>
                {error}
              </div>
            )}
            {!error && filtered.length === 0 && (
              <div style={{ padding: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                {teammates.length === 0
                  ? 'No teammates yet. Invite someone in Settings → Team.'
                  : 'No matches.'}
              </div>
            )}
            {filtered.map(t => (
              <button
                key={t.userId}
                type="button"
                onClick={() => {
                  onChange(t.userId);
                  setOpen(false);
                  setQuery('');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '8px 10px',
                  background: value === t.userId ? 'var(--bg-elevated)' : 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    background: 'var(--bg-elevated)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {(t.displayName?.[0] ?? t.email[0] ?? '?').toUpperCase()}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {t.displayName || t.email}
                  </div>
                  {t.displayName && (
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {t.email}
                    </div>
                  )}
                </div>
                {t.role === 'admin' && (
                  <span
                    style={{
                      fontSize: 9,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                    }}
                  >
                    Admin
                  </span>
                )}
              </button>
            ))}
          </div>

          {value && (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              style={{
                padding: '8px 10px',
                fontSize: 11.5,
                background: 'var(--bg-elevated)',
                color: 'var(--text-muted)',
                border: 'none',
                borderTop: '1px solid var(--border-color)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              Clear selection
            </button>
          )}
        </div>
      )}
    </div>
  );
}
