'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Crown,
  Shield,
  Eye,
  User,
  Mail,
  Loader2,
  Trash2,
  Copy,
  CheckCircle,
  AlertTriangle,
  X,
  Building2,
  FileText,
  Activity,
  Brain,
  RefreshCw,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useToast } from '@/components/ui/EnhancedToast';
import { TeammateWallModal } from '@/components/pricing/TeammateWallModal';
import dynamic from 'next/dynamic';
import { createClientLogger } from '@/lib/utils/logger';

const log = createClientLogger('TeamPage');

const TeamIntelligenceTab = dynamic(() => import('@/components/ui/TeamIntelligenceTab'), {
  loading: () => (
    <div className="flex items-center justify-center" style={{ minHeight: 200 }}>
      <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-secondary)' }} />
    </div>
  ),
});

interface TeamMember {
  id: string;
  userId: string;
  email: string;
  displayName: string | null;
  role: string;
  joinedAt: string;
}

interface TeamInvite {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  expiresAt: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  avatarUrl: string | null;
  members: TeamMember[];
  invites: TeamInvite[];
}

const ROLE_ICONS: Record<string, React.ReactNode> = {
  owner: <Crown size={14} />,
  admin: <Shield size={14} />,
  member: <User size={14} />,
  viewer: <Eye size={14} />,
};

const ROLE_COLORS: Record<string, string> = {
  owner: 'var(--warning)',
  admin: 'var(--text-highlight)',
  member: 'var(--text-secondary)',
  viewer: 'var(--text-muted)',
};

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
};

export default function TeamPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showTeammateWall, setShowTeammateWall] = useState(false);
  const [plan, setPlan] = useState<string>('free');
  const [activeTab, setActiveTab] = useState<'members' | 'activity' | 'intelligence'>('members');

  useEffect(() => {
    fetch('/api/billing')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data?.plan) setPlan(data.plan);
      })
      .catch(err => log.warn('billing fetch failed:', err));
  }, []);

  const isTeamPlan = plan === 'team' || plan === 'enterprise';

  const fetchTeam = useCallback(async () => {
    setFetchError(null);
    try {
      const res = await fetch('/api/team');
      if (res.ok) {
        const data = await res.json();
        setOrg(data.organization);
        setMyRole(data.role);
      } else if (res.status >= 500) {
        setFetchError('Failed to load team data. Please try again.');
      }
    } catch {
      setFetchError('Failed to load team data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  if (loading) {
    return (
      <div
        className="container"
        style={{
          paddingTop: 'var(--spacing-2xl)',
          paddingBottom: 'var(--spacing-2xl)',
          maxWidth: 900,
        }}
      >
        <div className="flex items-center justify-center" style={{ minHeight: 300 }}>
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-secondary)' }} />
        </div>
      </div>
    );
  }

  // Error state
  if (fetchError) {
    return (
      <div
        className="container"
        style={{
          paddingTop: 'var(--spacing-2xl)',
          paddingBottom: 'var(--spacing-2xl)',
          maxWidth: 900,
        }}
      >
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Team' }]} />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-md)',
            padding: 'var(--spacing-md) var(--spacing-lg)',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <AlertTriangle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px', flex: 1 }}>
            {fetchError}
          </span>
          <button
            onClick={() => {
              setLoading(true);
              fetchTeam();
            }}
            style={{
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#ef4444',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No team yet — show creation prompt
  if (!org) {
    return (
      <div
        className="container"
        style={{
          paddingTop: 'var(--spacing-2xl)',
          paddingBottom: 'var(--spacing-2xl)',
          maxWidth: 900,
        }}
      >
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Team' }]} />
        <div
          className="card animate-fade-in"
          style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              margin: '0 auto var(--spacing-lg)',
              background: 'rgba(22, 163, 74, 0.10)',
              border: '1px solid rgba(22, 163, 74, 0.22)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={28} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <h2 style={{ marginBottom: 'var(--spacing-sm)' }}>Create Your Team</h2>
          <p className="text-muted" style={{ maxWidth: 440, margin: '0 auto var(--spacing-xl)' }}>
            Set up a team to collaborate on analyses, share documents, and track cognitive biases
            across your organization.
          </p>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Building2 size={16} />
            Create Organization
          </button>
        </div>

        {showCreateModal && (
          <CreateOrgModal
            onClose={() => setShowCreateModal(false)}
            onCreated={() => {
              setShowCreateModal(false);
              fetchTeam();
            }}
          />
        )}
      </div>
    );
  }

  const isAdmin = myRole === 'owner' || myRole === 'admin';

  return (
    <div
      className="container"
      style={{
        paddingTop: 'var(--spacing-2xl)',
        paddingBottom: 'var(--spacing-2xl)',
        maxWidth: 900,
      }}
    >
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Team' }]} />

      {/* Header */}
      <header className="page-header">
        <div className="flex items-center gap-md">
          <div
            style={{
              width: 48,
              height: 48,
              background: 'var(--accent-gradient)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            {org.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1>
              <span className="text-gradient">{org.name}</span>
            </h1>
            <p className="page-subtitle">
              {org.members.length} member{org.members.length !== 1 ? 's' : ''} &middot; /{org.slug}
            </p>
          </div>
        </div>
        {isAdmin && (
          <button
            className="btn btn-primary"
            style={{ gap: 8 }}
            onClick={() => {
              if (isTeamPlan) {
                setShowInviteModal(true);
              } else {
                setShowTeammateWall(true);
              }
            }}
          >
            <UserPlus size={16} />
            Invite Member
          </button>
        )}
      </header>

      {/* Tabs */}
      <div
        className="flex items-center gap-sm mb-lg"
        style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0' }}
      >
        {(['members', 'activity', 'intelligence'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom:
                activeTab === tab ? '2px solid var(--text-highlight)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--text-highlight)' : 'var(--text-muted)',
              fontWeight: activeTab === tab ? 600 : 400,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s',
            }}
          >
            {tab === 'members' ? (
              <Users size={15} />
            ) : tab === 'activity' ? (
              <Activity size={15} />
            ) : (
              <Brain size={15} />
            )}
            {tab === 'members' ? 'Members' : tab === 'activity' ? 'Team Activity' : 'Intelligence'}
          </button>
        ))}
      </div>

      {activeTab === 'activity' && <TeamActivityTab />}

      {activeTab === 'intelligence' && org && <TeamIntelligenceTab orgId={org.id} />}

      {activeTab === 'members' && (
        <>
          {/* Members List */}
          <div className="card mb-lg animate-fade-in">
            <div className="card-header">
              <h3 className="flex items-center gap-sm">
                <Users size={18} />
                Team Members
              </h3>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {org.members.map((member, idx) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  isAdmin={isAdmin}
                  myRole={myRole!}
                  isLast={idx === org.members.length - 1}
                  onUpdate={fetchTeam}
                />
              ))}
            </div>
          </div>

          {/* Pending Invites */}
          {isAdmin && org.invites.length > 0 && (
            <div className="card mb-lg animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="card-header">
                <h3 className="flex items-center gap-sm">
                  <Mail size={18} />
                  Pending Invitations
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      background: 'rgba(22, 163, 74, 0.12)',
                      borderRadius: '12px',
                      color: 'var(--accent-primary)',
                      fontWeight: 600,
                    }}
                  >
                    {org.invites.length}
                  </span>
                </h3>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {org.invites.map((invite, idx) => (
                  <InviteRow
                    key={invite.id}
                    invite={invite}
                    isLast={idx === org.invites.length - 1}
                    onRevoke={fetchTeam}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Team Stats */}
          <div className="card animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="card-header">
              <h3 className="flex items-center gap-sm">
                <Shield size={18} />
                Team Overview
              </h3>
            </div>
            <div className="card-body">
              <div className="grid grid-2 gap-lg">
                <StatCard label="Total Members" value={org.members.length.toString()} />
                <StatCard label="Pending Invites" value={org.invites.length.toString()} />
                <StatCard
                  label="Admins"
                  value={org.members
                    .filter(m => m.role === 'owner' || m.role === 'admin')
                    .length.toString()}
                />
                <StatCard label="Team URL" value={`/${org.slug}`} />
              </div>
            </div>
          </div>
        </>
      )}

      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          onInvited={() => {
            setShowInviteModal(false);
            fetchTeam();
          }}
        />
      )}

      <TeammateWallModal
        open={showTeammateWall}
        onClose={() => setShowTeammateWall(false)}
        source="team-page-invite"
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: 'var(--spacing-md)',
        background: 'var(--bg-secondary)',
        borderRadius: '8px',
      }}
    >
      <div className="text-xs text-muted" style={{ marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontSize: '18px', fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function MemberRow({
  member,
  isAdmin,
  myRole,
  isLast,
  onUpdate,
}: {
  member: TeamMember;
  isAdmin: boolean;
  myRole: string;
  isLast: boolean;
  onUpdate: () => void;
}) {
  const [removing, setRemoving] = useState(false);
  const [changingRole, setChangingRole] = useState(false);
  const { showToast } = useToast();

  const canModify =
    isAdmin && member.role !== 'owner' && !(member.role === 'admin' && myRole !== 'owner');

  const handleRemove = async () => {
    if (!confirm(`Remove ${member.displayName || member.email} from the team?`)) return;
    setRemoving(true);
    try {
      const res = await fetch(`/api/team/members?userId=${member.userId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Member removed', 'success');
        onUpdate();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to remove member', 'error');
      }
    } catch {
      showToast('Failed to remove member', 'error');
    } finally {
      setRemoving(false);
    }
  };

  const handleRoleChange = async (newRole: string) => {
    setChangingRole(true);
    try {
      const res = await fetch('/api/team/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: member.id, role: newRole }),
      });
      if (res.ok) {
        showToast(`Role updated to ${ROLE_LABELS[newRole]}`, 'success');
        onUpdate();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to update role', 'error');
      }
    } catch {
      showToast('Failed to update role', 'error');
    } finally {
      setChangingRole(false);
    }
  };

  return (
    <div
      className="flex items-center justify-between"
      style={{
        padding: 'var(--spacing-md) var(--spacing-lg)',
        borderBottom: isLast ? 'none' : '1px solid var(--liquid-border)',
      }}
    >
      <div className="flex items-center gap-md">
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${ROLE_COLORS[member.role]}, var(--bg-tertiary))`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          {(member.displayName || member.email).charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 500, fontSize: '14px' }}>
            {member.displayName || member.email.split('@')[0]}
          </div>
          <div className="text-xs text-muted">{member.email}</div>
        </div>
      </div>
      <div className="flex items-center gap-sm">
        <span
          className="flex items-center gap-xs"
          style={{
            fontSize: '12px',
            padding: '3px 10px',
            borderRadius: '12px',
            background: member.role === 'owner' ? 'rgba(234, 179, 8, 0.12)' : 'var(--bg-tertiary)',
            color: ROLE_COLORS[member.role],
            fontWeight: 600,
          }}
        >
          {ROLE_ICONS[member.role]}
          {ROLE_LABELS[member.role]}
        </span>

        {canModify && (
          <>
            <select
              value={member.role}
              onChange={e => handleRoleChange(e.target.value)}
              disabled={changingRole}
              style={{
                fontSize: '12px',
                padding: '4px 8px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--liquid-border)',
                borderRadius: '6px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {myRole === 'owner' && <option value="admin">Admin</option>}
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              onClick={handleRemove}
              disabled={removing}
              title="Remove member"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--error)',
                cursor: 'pointer',
                padding: '4px',
                opacity: removing ? 0.5 : 1,
              }}
            >
              {removing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function InviteRow({
  invite,
  isLast,
  onRevoke,
}: {
  invite: TeamInvite;
  isLast: boolean;
  onRevoke: () => void;
}) {
  const [revoking, setRevoking] = useState(false);
  const [resending, setResending] = useState(false);
  const { showToast } = useToast();

  const handleRevoke = async () => {
    setRevoking(true);
    try {
      const res = await fetch(`/api/team/invite?id=${invite.id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Invite revoked', 'success');
        onRevoke();
      } else {
        showToast('Failed to revoke invite', 'error');
      }
    } catch {
      showToast('Failed to revoke invite', 'error');
    } finally {
      setRevoking(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await fetch('/api/team/invite', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: invite.id }),
      });
      if (res.ok) {
        showToast('Invite resent', 'success');
        onRevoke(); // refresh the list to show updated expiry
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Failed to resend invite', 'error');
      }
    } catch {
      showToast('Failed to resend invite', 'error');
    } finally {
      setResending(false);
    }
  };

  const isExpired = new Date(invite.expiresAt) < new Date();

  return (
    <div
      className="flex items-center justify-between"
      style={{
        padding: 'var(--spacing-md) var(--spacing-lg)',
        borderBottom: isLast ? 'none' : '1px solid var(--liquid-border)',
        opacity: isExpired ? 0.5 : 1,
      }}
    >
      <div className="flex items-center gap-md">
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--bg-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <Mail size={16} />
        </div>
        <div>
          <div style={{ fontWeight: 500, fontSize: '14px' }}>{invite.email}</div>
          <div className="text-xs text-muted">
            {isExpired ? (
              <span style={{ color: 'var(--error)' }}>Expired</span>
            ) : (
              <>
                Invited as {ROLE_LABELS[invite.role]} &middot; expires{' '}
                {new Date(invite.expiresAt).toLocaleDateString()}
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-xs">
        <button
          onClick={handleResend}
          disabled={resending || revoking}
          className="btn flex items-center gap-sm"
          style={{
            background: 'transparent',
            borderColor: 'var(--text-muted)',
            color: 'var(--text-secondary)',
            fontSize: '12px',
            padding: '4px 10px',
          }}
        >
          {resending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          Resend
        </button>
        <button
          onClick={handleRevoke}
          disabled={revoking || resending}
          className="btn flex items-center gap-sm"
          style={{
            background: 'transparent',
            borderColor: 'var(--error)',
            color: 'var(--error)',
            fontSize: '12px',
            padding: '4px 10px',
          }}
        >
          {revoking ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
          Revoke
        </button>
      </div>
    </div>
  );
}

function CreateOrgModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleNameChange = (value: string) => {
    setName(value);
    // Auto-generate slug from name
    setSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 50)
    );
  };

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim() }),
      });
      if (res.ok) {
        showToast('Organization created!', 'success');
        onCreated();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create organization');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
      onKeyDown={e => e.key === 'Escape' && onClose()}
    >
      <div
        className="card"
        style={{ maxWidth: 460, width: '90%' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="card-header">
          <h3 className="flex items-center gap-sm">
            <Building2 size={18} />
            Create Organization
          </h3>
        </div>
        <div className="card-body">
          <div className="flex flex-col gap-lg">
            <div>
              <label
                htmlFor="org-name"
                className="text-xs font-medium text-muted block"
                style={{ marginBottom: '6px' }}
              >
                Organization Name
              </label>
              <input
                id="org-name"
                type="text"
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="Acme Corp"
                maxLength={100}
                style={{
                  width: '100%',
                  padding: 'var(--spacing-md)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--liquid-border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label
                htmlFor="org-slug"
                className="text-xs font-medium text-muted block"
                style={{ marginBottom: '6px' }}
              >
                Team URL
              </label>
              <div className="flex items-center" style={{ gap: '4px' }}>
                <span className="text-muted text-sm">/</span>
                <input
                  id="org-slug"
                  type="text"
                  value={slug}
                  onChange={e =>
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, '')
                        .slice(0, 50)
                    )
                  }
                  placeholder="acme-corp"
                  maxLength={50}
                  style={{
                    flex: 1,
                    padding: 'var(--spacing-md)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--liquid-border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-sm text-sm" style={{ color: 'var(--error)' }}>
                <AlertTriangle size={14} />
                {error}
              </div>
            )}
          </div>
          <div
            className="flex items-center justify-end gap-sm"
            style={{ marginTop: 'var(--spacing-xl)' }}
          >
            <button className="btn btn-ghost" onClick={onClose} disabled={creating}>
              Cancel
            </button>
            <button
              className="btn btn-primary flex items-center gap-sm"
              onClick={handleCreate}
              disabled={creating || !name.trim() || !slug.trim()}
            >
              {creating ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle size={14} />
              )}
              {creating ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InviteModal({ onClose, onInvited }: { onClose: () => void; onInvited: () => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleInvite = async () => {
    if (!email.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      if (res.ok) {
        showToast(`Invite sent to ${email}`, 'success');
        onInvited();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to send invite');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/dashboard/team`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
      onKeyDown={e => e.key === 'Escape' && onClose()}
    >
      <div
        className="card"
        style={{ maxWidth: 460, width: '90%' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="card-header">
          <h3 className="flex items-center gap-sm">
            <UserPlus size={18} />
            Invite Team Member
          </h3>
        </div>
        <div className="card-body">
          <div className="flex flex-col gap-lg">
            <div>
              <label
                htmlFor="invite-email"
                className="text-xs font-medium text-muted block"
                style={{ marginBottom: '6px' }}
              >
                Email Address
              </label>
              <input
                id="invite-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                style={{
                  width: '100%',
                  padding: 'var(--spacing-md)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--liquid-border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && email.trim()) handleInvite();
                }}
              />
            </div>
            <div>
              <label
                htmlFor="invite-role"
                className="text-xs font-medium text-muted block"
                style={{ marginBottom: '6px' }}
              >
                Role
              </label>
              <select
                id="invite-role"
                value={role}
                onChange={e => setRole(e.target.value)}
                style={{
                  width: '100%',
                  padding: 'var(--spacing-md)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--liquid-border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                }}
              >
                <option value="admin">Admin — can manage members and settings</option>
                <option value="member">Member — can create and view analyses</option>
                <option value="viewer">Viewer — read-only access to shared analyses</option>
              </select>
            </div>
            {error && (
              <div className="flex items-center gap-sm text-sm" style={{ color: 'var(--error)' }}>
                <AlertTriangle size={14} />
                {error}
              </div>
            )}
          </div>
          <div
            className="flex items-center justify-between"
            style={{ marginTop: 'var(--spacing-xl)' }}
          >
            <button
              className="btn btn-ghost flex items-center gap-sm"
              style={{ fontSize: '12px' }}
              onClick={handleCopyLink}
            >
              {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Join Link'}
            </button>
            <div className="flex items-center gap-sm">
              <button className="btn btn-ghost" onClick={onClose} disabled={sending}>
                Cancel
              </button>
              <button
                className="btn btn-primary flex items-center gap-sm"
                onClick={handleInvite}
                disabled={sending || !email.trim()}
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                {sending ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TeamDocument {
  id: string;
  filename: string;
  status: string;
  uploadedAt: string;
  updatedAt: string;
  uploadedBy: string;
  latestScore: number | null;
}

interface TeamActivityEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  displayName: string;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  UPLOAD_DOCUMENT: 'uploaded a document',
  ANALYZE_DOCUMENT: 'analyzed a document',
  EXPORT_PDF: 'exported a PDF',
  SCAN_DOCUMENT: 'scanned a document',
  VIEW_ANALYSIS: 'viewed an analysis',
  DELETE_DOCUMENT: 'deleted a document',
  UPDATE_SETTINGS: 'updated settings',
  CREATE_PERSONA: 'created a persona',
};

function TeamActivityTab() {
  const [documents, setDocuments] = useState<TeamDocument[]>([]);
  const [activity, setActivity] = useState<TeamActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await fetch('/api/team/activity');
        if (res.ok) {
          const data = await res.json();
          setDocuments(data.documents || []);
          setActivity(data.activity || []);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 200 }}>
        <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-secondary)' }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-lg">
      {/* Shared Documents */}
      <div className="card animate-fade-in">
        <div className="card-header">
          <h3 className="flex items-center gap-sm">
            <FileText size={18} />
            Team Documents
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: 'var(--text-highlight)',
                fontWeight: 600,
              }}
            >
              {documents.length}
            </span>
          </h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {documents.length === 0 ? (
            <div
              className="text-muted text-sm"
              style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}
            >
              No team documents yet. Team members&apos; uploaded documents will appear here.
            </div>
          ) : (
            documents.map((doc, idx) => (
              <a
                key={doc.id}
                href={`/documents/${doc.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--spacing-md) var(--spacing-lg)',
                  borderBottom:
                    idx === documents.length - 1 ? 'none' : '1px solid var(--liquid-border)',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'background 0.15s',
                }}
              >
                <div className="flex items-center gap-md">
                  <FileText size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '13px' }}>{doc.filename}</div>
                    <div className="text-xs text-muted">
                      by {doc.uploadedBy} &middot; {new Date(doc.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-sm">
                  {doc.latestScore !== null && (
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '8px',
                        background:
                          doc.latestScore >= 70
                            ? 'rgba(34, 197, 94, 0.12)'
                            : doc.latestScore >= 40
                              ? 'rgba(234, 179, 8, 0.12)'
                              : 'rgba(239, 68, 68, 0.12)',
                        color:
                          doc.latestScore >= 70
                            ? 'var(--success)'
                            : doc.latestScore >= 40
                              ? 'var(--warning)'
                              : 'var(--error)',
                      }}
                    >
                      {Math.round(doc.latestScore)}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '8px',
                      background:
                        doc.status === 'analyzed' ? 'rgba(34, 197, 94, 0.1)' : 'var(--bg-tertiary)',
                      color: doc.status === 'analyzed' ? 'var(--success)' : 'var(--text-muted)',
                      fontWeight: 500,
                    }}
                  >
                    {doc.status}
                  </span>
                </div>
              </a>
            ))
          )}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="card animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="card-header">
          <h3 className="flex items-center gap-sm">
            <Activity size={18} />
            Recent Activity
          </h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {activity.length === 0 ? (
            <div
              className="text-muted text-sm"
              style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}
            >
              No team activity yet.
            </div>
          ) : (
            activity.slice(0, 20).map((entry, idx) => (
              <div
                key={entry.id}
                className="flex items-center gap-md"
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-lg)',
                  borderBottom:
                    idx === Math.min(activity.length, 20) - 1
                      ? 'none'
                      : '1px solid var(--liquid-border)',
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'var(--bg-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                  }}
                >
                  {entry.displayName.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="text-sm">
                    <strong>{entry.displayName}</strong>{' '}
                    <span className="text-muted">
                      {ACTION_LABELS[entry.action] || entry.action.toLowerCase().replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-muted" style={{ flexShrink: 0 }}>
                  {new Date(entry.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
