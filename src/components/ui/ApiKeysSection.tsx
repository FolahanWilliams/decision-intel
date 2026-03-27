'use client';

import { useState, useEffect, useCallback } from 'react';
import { Key, Plus, Copy, Trash2, Loader2, Check, AlertTriangle, Shield } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  rateLimit: number;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

const AVAILABLE_SCOPES = ['analyze', 'documents', 'outcomes', 'insights'] as const;

const SCOPE_COLORS: Record<string, string> = {
  analyze: '#6366f1',
  documents: '#38bdf8',
  outcomes: '#34d399',
  insights: '#fbbf24',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ApiKeysSection() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create flow
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newScopes, setNewScopes] = useState<Set<string>>(new Set(['analyze']));
  const [creating, setCreating] = useState(false);
  const [newKeyRaw, setNewKeyRaw] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Revoke flow
  const [revoking, setRevoking] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/keys');
      if (res.status === 503) {
        setError('API keys not yet available');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setKeys(data.keys || []);
      setError(null);
    } catch {
      setError('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreate = async () => {
    if (!newName.trim() || newScopes.size === 0) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          scopes: Array.from(newScopes),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create key');
        return;
      }
      setNewKeyRaw(data.rawKey);
      setNewName('');
      setNewScopes(new Set(['analyze']));
      fetchKeys();
    } catch {
      setError('Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    setRevoking(keyId);
    try {
      const res = await fetch(`/api/v1/keys?id=${keyId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchKeys();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to revoke key');
      }
    } catch {
      setError('Failed to revoke key');
    } finally {
      setRevoking(null);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  };

  const toggleScope = (scope: string) => {
    setNewScopes(prev => {
      const next = new Set(prev);
      if (next.has(scope)) next.delete(scope);
      else next.add(scope);
      return next;
    });
  };

  const activeKeys = keys.filter(k => !k.revokedAt);
  const revokedKeys = keys.filter(k => k.revokedAt);

  return (
    <div className="card mb-lg animate-fade-in" style={{ animationDelay: '0.35s' }}>
      <div className="card-header flex items-center justify-between">
        <h3 className="flex items-center gap-sm">
          <Key size={18} />
          API Keys
        </h3>
        {!showCreate && !newKeyRaw && (
          <button
            onClick={() => setShowCreate(true)}
            className="btn btn-ghost flex items-center gap-xs text-xs"
            style={{ padding: '4px 12px' }}
          >
            <Plus size={14} />
            Create Key
          </button>
        )}
      </div>

      <div className="card-body">
        {error && (
          <div
            className="flex items-center gap-sm"
            style={{
              padding: '8px 12px',
              background: 'rgba(248, 113, 113, 0.08)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              color: '#f87171',
              marginBottom: 'var(--spacing-md)',
            }}
          >
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {/* New key secret display (shown once after creation) */}
        {newKeyRaw && (
          <div
            style={{
              padding: 'var(--spacing-md)',
              background: 'rgba(34, 197, 94, 0.06)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--spacing-md)',
            }}
          >
            <div
              className="flex items-center gap-sm"
              style={{ fontSize: '12px', fontWeight: 600, color: '#34d399', marginBottom: '8px' }}
            >
              <Shield size={14} />
              Save this key — it won&apos;t be shown again
            </div>
            <div className="flex items-center gap-sm">
              <code
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-highlight)',
                  wordBreak: 'break-all',
                }}
              >
                {newKeyRaw}
              </code>
              <button
                onClick={() => handleCopy(newKeyRaw)}
                className="btn btn-ghost p-sm"
                style={{ flexShrink: 0 }}
              >
                {copied ? <Check size={14} style={{ color: '#34d399' }} /> : <Copy size={14} />}
              </button>
            </div>
            <button
              onClick={() => {
                setNewKeyRaw(null);
                setShowCreate(false);
              }}
              className="btn btn-ghost text-xs"
              style={{ marginTop: '8px' }}
            >
              Done
            </button>
          </div>
        )}

        {/* Create key form */}
        {showCreate && !newKeyRaw && (
          <div
            style={{
              padding: 'var(--spacing-md)',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--spacing-md)',
            }}
          >
            <div style={{ marginBottom: 'var(--spacing-sm)' }}>
              <label
                className="text-xs text-muted font-medium block"
                style={{ marginBottom: '4px' }}
              >
                Key Name
              </label>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Production Integration"
                className="input"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                }}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <label
                className="text-xs text-muted font-medium block"
                style={{ marginBottom: '4px' }}
              >
                Scopes
              </label>
              <div className="flex flex-wrap gap-xs">
                {AVAILABLE_SCOPES.map(scope => (
                  <button
                    key={scope}
                    onClick={() => toggleScope(scope)}
                    style={{
                      padding: '4px 12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: '6px',
                      border: `1px solid ${newScopes.has(scope) ? SCOPE_COLORS[scope] + '60' : 'rgba(255,255,255,0.1)'}`,
                      background: newScopes.has(scope) ? SCOPE_COLORS[scope] + '15' : 'transparent',
                      color: newScopes.has(scope) ? SCOPE_COLORS[scope] : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {scope}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-sm">
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim() || newScopes.size === 0}
                className="btn btn-primary flex items-center gap-xs text-xs"
              >
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
                Create Key
              </button>
              <button
                onClick={() => {
                  setShowCreate(false);
                  setNewName('');
                }}
                className="btn btn-ghost text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div
            className="flex items-center justify-center"
            style={{ padding: 'var(--spacing-lg)' }}
          >
            <Loader2 size={18} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
          </div>
        )}

        {/* Empty state */}
        {!loading && activeKeys.length === 0 && !showCreate && !newKeyRaw && (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-lg) 0' }}>
            <Key size={24} style={{ margin: '0 auto 8px', color: 'var(--text-muted)' }} />
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Create an API key to integrate Decision Intel programmatically.
            </p>
          </div>
        )}

        {/* Active keys list */}
        {activeKeys.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {activeKeys.map(key => (
              <div
                key={key.id}
                className="flex items-center justify-between"
                style={{
                  padding: '10px 0',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="flex items-center gap-sm">
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{key.name}</span>
                    <code
                      style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        borderRadius: '4px',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {key.keyPrefix}...
                    </code>
                  </div>
                  <div className="flex items-center gap-sm" style={{ marginTop: '4px' }}>
                    {(key.scopes as string[]).map(scope => (
                      <span
                        key={scope}
                        style={{
                          fontSize: '9px',
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: (SCOPE_COLORS[scope] || '#666') + '15',
                          color: SCOPE_COLORS[scope] || 'var(--text-muted)',
                        }}
                      >
                        {scope}
                      </span>
                    ))}
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {key.lastUsedAt ? `Used ${timeAgo(key.lastUsedAt)}` : 'Never used'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(key.id)}
                  disabled={revoking === key.id}
                  className="btn btn-ghost p-sm"
                  style={{ color: 'var(--text-muted)', flexShrink: 0 }}
                  title="Revoke key"
                >
                  {revoking === key.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Revoked keys (collapsed) */}
        {revokedKeys.length > 0 && (
          <div style={{ marginTop: 'var(--spacing-md)' }}>
            <span
              style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {revokedKeys.length} revoked key{revokedKeys.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
