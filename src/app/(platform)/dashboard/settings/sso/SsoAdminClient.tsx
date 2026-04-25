'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Plus, RefreshCw, Trash2, CheckCircle, CircleAlert, XCircle } from 'lucide-react';

type OrgRef = { id: string; name: string; slug?: string | null };

type SsoConfig = {
  id: string;
  domain: string;
  providerId: string;
  protocol: string;
  displayName: string | null;
  status: 'pending' | 'active' | 'disabled';
  activatedAt: string | null;
  notes: string | null;
  createdAt: string;
};

interface Props {
  orgs: OrgRef[];
}

const STATUS_STYLES: Record<SsoConfig['status'], { label: string; badge: string; icon: typeof CheckCircle }> = {
  active: {
    label: 'Active',
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    icon: CheckCircle,
  },
  pending: {
    label: 'Pending — not yet activated',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: CircleAlert,
  },
  disabled: {
    label: 'Disabled',
    badge: 'bg-red-500/10 text-red-300 border-red-500/20',
    icon: XCircle,
  },
};

export function SsoAdminClient({ orgs }: Props) {
  const [activeOrgId, setActiveOrgId] = useState<string | null>(orgs[0]?.id ?? null);
  const [configs, setConfigs] = useState<SsoConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [newProviderId, setNewProviderId] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const refresh = useCallback(async (orgId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sso/admin/providers?orgId=${encodeURIComponent(orgId)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to load (${res.status})`);
      }
      const data = (await res.json()) as { configs: SsoConfig[] };
      setConfigs(data.configs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load SSO configs');
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeOrgId) void refresh(activeOrgId);
  }, [activeOrgId, refresh]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrgId) return;
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch('/api/sso/admin/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: activeOrgId,
          domain: newDomain,
          providerId: newProviderId,
          displayName: newDisplayName || undefined,
          notes: newNotes || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed (${res.status})`);
      }
      setNewDomain('');
      setNewProviderId('');
      setNewDisplayName('');
      setNewNotes('');
      setShowCreate(false);
      await refresh(activeOrgId);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (id: string, status: SsoConfig['status']) => {
    if (!activeOrgId) return;
    try {
      const res = await fetch(`/api/sso/admin/providers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Update failed (${res.status})`);
      }
      await refresh(activeOrgId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleDelete = async (id: string, domain: string) => {
    if (!activeOrgId) return;
    if (!confirm(`Remove SSO configuration for ${domain}? Users signing in from this domain will fall back to password / Google OAuth.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/sso/admin/providers/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Delete failed (${res.status})`);
      }
      await refresh(activeOrgId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: 960, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div className="flex items-center gap-3">
          <ShieldCheck size={24} style={{ color: 'var(--accent-primary)' }} />
          <div>
            <h1>SAML Single Sign-On</h1>
            <p className="text-sm text-muted mt-1">
              Manage SAML providers for your organisation. Once active, employees signing in from the
              registered domain are redirected to your Identity Provider.
            </p>
          </div>
        </div>
      </div>

      {/* Prerequisites strip */}
      <div
        className="card"
        style={{ marginBottom: 'var(--spacing-lg)', background: 'var(--bg-elevated)' }}
      >
        <div className="card-body">
          <h3 className="section-heading">Before you register an IdP</h3>
          <ol className="text-sm space-y-2 mt-3" style={{ color: 'var(--text-secondary)' }}>
            <li>
              <strong>1.</strong> Your Supabase project must be on the <strong>Pro</strong> plan or
              above — SAML is gated at that tier.
            </li>
            <li>
              <strong>2.</strong> An admin must enable SAML 2.0 Single Sign-on in the Supabase
              project dashboard (Authentication → Providers → SAML 2.0).
            </li>
            <li>
              <strong>3.</strong> Your IdP (Okta, Google Workspace, Azure AD, etc.) must have a
              custom SAML app configured with ACS URL{' '}
              <code className="text-xs bg-[var(--bg-card)] px-1 py-0.5 rounded">
                /auth/v1/sso/saml/acs
              </code>{' '}
              on the Supabase project URL.
            </li>
            <li>
              <strong>4.</strong> Register the IdP with Supabase via{' '}
              <code className="text-xs bg-[var(--bg-card)] px-1 py-0.5 rounded">
                supabase sso add --type saml --metadata-file …
              </code>
              . The CLI returns an <code>sso_provider_id</code> UUID.
            </li>
            <li>
              <strong>5.</strong> Paste that UUID and the employee email domain below. Status starts
              as <em>Pending</em>; activate it only after a test user has completed a successful IdP
              sign-in.
            </li>
          </ol>
          <p className="text-xs text-muted mt-4">
            Full setup walkthrough:{' '}
            <Link href="/security" className="text-[var(--accent-primary)] underline">
              /security
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Org picker — only shown when user has access to multiple orgs */}
      {orgs.length > 1 && (
        <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <div className="card-body">
            <label className="section-heading" htmlFor="sso-org-picker">
              Organisation
            </label>
            <select
              id="sso-org-picker"
              value={activeOrgId ?? ''}
              onChange={e => setActiveOrgId(e.target.value || null)}
              className="mt-2"
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 12px',
                width: '100%',
                maxWidth: 420,
              }}
            >
              {orgs.map(o => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Config list */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3>SAML providers</h3>
          <div className="flex items-center gap-2">
            {activeOrgId && (
              <button
                onClick={() => void refresh(activeOrgId)}
                className="button button-secondary"
                style={{ fontSize: 12 }}
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
            )}
            <button
              onClick={() => setShowCreate(prev => !prev)}
              className="button button-primary"
              style={{ fontSize: 12 }}
              disabled={!activeOrgId}
            >
              <Plus size={12} /> Register provider
            </button>
          </div>
        </div>
        <div className="card-body">
          {error && (
            <div
              className="text-sm mb-4"
              style={{ color: 'var(--severity-high)' }}
            >
              {error}
            </div>
          )}

          {showCreate && activeOrgId && (
            <form onSubmit={handleCreate} className="mb-6 space-y-3 p-4" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <label className="text-xs text-muted" htmlFor="sso-domain">
                  Email domain (e.g. acme.com)
                </label>
                <input
                  id="sso-domain"
                  value={newDomain}
                  onChange={e => setNewDomain(e.target.value)}
                  required
                  placeholder="acme.com"
                  style={{
                    display: 'block',
                    marginTop: 4,
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                />
              </div>
              <div>
                <label className="text-xs text-muted" htmlFor="sso-provider-id">
                  Supabase provider UUID (from <code>supabase sso add</code>)
                </label>
                <input
                  id="sso-provider-id"
                  value={newProviderId}
                  onChange={e => setNewProviderId(e.target.value)}
                  required
                  placeholder="00000000-0000-0000-0000-000000000000"
                  style={{
                    display: 'block',
                    marginTop: 4,
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'monospace',
                    fontSize: 13,
                  }}
                />
              </div>
              <div>
                <label className="text-xs text-muted" htmlFor="sso-display-name">
                  Display name (optional)
                </label>
                <input
                  id="sso-display-name"
                  value={newDisplayName}
                  onChange={e => setNewDisplayName(e.target.value)}
                  placeholder="Okta · Acme Inc"
                  style={{
                    display: 'block',
                    marginTop: 4,
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                />
              </div>
              <div>
                <label className="text-xs text-muted" htmlFor="sso-notes">
                  Notes (optional)
                </label>
                <textarea
                  id="sso-notes"
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  rows={2}
                  placeholder="IT contact, ticket ref, activation plan"
                  style={{
                    display: 'block',
                    marginTop: 4,
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                />
              </div>
              {createError && (
                <div className="text-xs" style={{ color: 'var(--severity-high)' }}>
                  {createError}
                </div>
              )}
              <div className="flex gap-2">
                <button type="submit" className="button button-primary" disabled={creating} style={{ fontSize: 13 }}>
                  {creating ? 'Saving…' : 'Register (pending)'}
                </button>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setShowCreate(false)}
                  style={{ fontSize: 13 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {loading && configs.length === 0 ? (
            <div className="text-sm text-muted">Loading…</div>
          ) : configs.length === 0 ? (
            <div className="text-sm text-muted">
              No SAML providers registered yet. Click <strong>Register provider</strong> once your
              Supabase CLI registration is complete.
            </div>
          ) : (
            <div className="space-y-3">
              {configs.map(c => {
                const statusStyle = STATUS_STYLES[c.status];
                const StatusIcon = statusStyle.icon;
                return (
                  <div
                    key={c.id}
                    className="liquid-glass p-4 border"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className="font-medium"
                            style={{ color: 'var(--text-primary)', fontSize: 15 }}
                          >
                            {c.displayName ?? c.domain}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${statusStyle.badge}`}
                          >
                            <StatusIcon size={10} /> {statusStyle.label}
                          </span>
                          <span
                            className="text-[10px] uppercase tracking-wider text-muted"
                          >
                            {c.protocol}
                          </span>
                        </div>
                        <div className="text-sm text-muted">
                          Domain: <code className="text-xs">{c.domain}</code>
                        </div>
                        <div className="text-xs text-muted mt-1">
                          Provider ID: <code className="text-xs">{c.providerId}</code>
                        </div>
                        {c.notes && (
                          <div className="text-xs text-muted mt-2 italic">{c.notes}</div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        {c.status !== 'active' && (
                          <button
                            onClick={() => handleStatusChange(c.id, 'active')}
                            className="button button-primary"
                            style={{ fontSize: 12 }}
                          >
                            Activate
                          </button>
                        )}
                        {c.status !== 'disabled' && c.status === 'active' && (
                          <button
                            onClick={() => handleStatusChange(c.id, 'disabled')}
                            className="button button-secondary"
                            style={{ fontSize: 12 }}
                          >
                            Disable
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(c.id, c.domain)}
                          className="button button-secondary"
                          style={{ fontSize: 12 }}
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
