'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, X, CheckCircle, Phone, TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';
import { INTENT_LABELS } from '@/lib/outreach/types';
import type { OutreachIntent } from '@/lib/outreach/types';

interface Prospect {
  id: string;
  name: string;
  company: string | null;
  role: string | null;
  intent: string;
  status: string;
  outreachDate: string;
  lastContact: string | null;
  followUpDue: string | null;
  notes: string | null;
}

interface ProspectPipelineProps {
  founderPass: string;
  refreshKey?: number;
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  cold: { label: 'No reply', color: '#64748B' },
  warm: { label: 'Replied', color: '#F59E0B' },
  active: { label: 'In conversation', color: '#16A34A' },
  converted: { label: 'Converted', color: '#7C3AED' },
};

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'followup', label: 'Follow-up Due' },
  { key: 'warm', label: 'Replied' },
  { key: 'active', label: 'Active' },
  { key: 'converted', label: 'Converted' },
] as const;

type FilterKey = (typeof FILTER_TABS)[number]['key'];

function isFollowUpDue(prospect: Prospect): boolean {
  if (prospect.status !== 'cold' || !prospect.followUpDue) return false;
  return new Date(prospect.followUpDue) <= new Date();
}

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 8) return `${weeks}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function ProspectPipeline({ founderPass, refreshKey }: ProspectPipelineProps) {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Add form state
  const [addName, setAddName] = useState('');
  const [addCompany, setAddCompany] = useState('');
  const [addRole, setAddRole] = useState('');
  const [addIntent, setAddIntent] = useState<OutreachIntent>('connect');
  const [addNotes, setAddNotes] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchProspects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/founder-hub/prospects', {
        headers: { 'x-founder-pass': founderPass },
      });
      if (res.ok) {
        const json = await res.json();
        setProspects(json.data?.prospects || []);
      }
    } catch (err) {
      console.warn('[ProspectPipeline] fetchProspects failed:', err);
    } finally {
      setLoading(false);
    }
  }, [founderPass]);

  useEffect(() => {
    fetchProspects();
  }, [fetchProspects, refreshKey]);

  const updateStatus = useCallback(
    async (id: string, status: string) => {
      setUpdatingId(id);
      try {
        await fetch(`/api/founder-hub/prospects/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'x-founder-pass': founderPass },
          body: JSON.stringify({
            status,
            lastContact: new Date().toISOString(),
          }),
        });
        await fetchProspects();
      } finally {
        setUpdatingId(null);
      }
    },
    [founderPass, fetchProspects]
  );

  const archiveProspect = useCallback(
    async (id: string) => {
      setUpdatingId(id);
      try {
        await fetch(`/api/founder-hub/prospects/${id}`, {
          method: 'DELETE',
          headers: { 'x-founder-pass': founderPass },
        });
        await fetchProspects();
      } finally {
        setUpdatingId(null);
      }
    },
    [founderPass, fetchProspects]
  );

  const handleAddProspect = useCallback(async () => {
    if (!addName.trim()) return;
    setAdding(true);
    try {
      await fetch('/api/founder-hub/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-founder-pass': founderPass },
        body: JSON.stringify({
          name: addName.trim(),
          company: addCompany.trim() || undefined,
          role: addRole.trim() || undefined,
          intent: addIntent,
          notes: addNotes.trim() || undefined,
        }),
      });
      setAddName('');
      setAddCompany('');
      setAddRole('');
      setAddNotes('');
      setShowAddForm(false);
      await fetchProspects();
    } finally {
      setAdding(false);
    }
  }, [founderPass, addName, addCompany, addRole, addIntent, addNotes, fetchProspects]);

  // Compute filtered list
  const filtered = prospects.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'followup') return isFollowUpDue(p);
    return p.status === filter;
  });

  // Stats
  const total = prospects.length;
  const replied = prospects.filter(p => ['warm', 'active', 'converted'].includes(p.status)).length;
  const active = prospects.filter(p => p.status === 'active').length;
  const converted = prospects.filter(p => p.status === 'converted').length;
  const replyRate = total > 0 ? Math.round((replied / total) * 100) : 0;
  const followupCount = prospects.filter(isFollowUpDue).length;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        marginBottom: 20,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={15} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            Prospect Pipeline
          </span>
          {followupCount > 0 && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 'var(--radius-full)',
                background: '#F59E0B20',
                color: '#F59E0B',
                border: '1px solid #F59E0B40',
              }}
            >
              {followupCount} follow-up{followupCount > 1 ? 's' : ''} due
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={fetchProspects}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              padding: 4,
            }}
          >
            <RefreshCw size={13} />
          </button>
          <button
            onClick={() => setShowAddForm(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              background: showAddForm ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
              border: 'none',
              color: showAddForm ? 'var(--text-primary)' : '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={12} />
            Add manually
          </button>
        </div>
      </div>

      {/* Stats row */}
      {total > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 10,
            marginBottom: 16,
          }}
        >
          {[
            { label: 'Reached', value: total },
            { label: 'Reply rate', value: `${replyRate}%` },
            { label: 'Active', value: active },
            { label: 'Converted', value: converted },
          ].map(stat => (
            <div
              key={stat.label}
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginTop: 2,
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 12,
            }}
          >
            Add prospect
          </div>
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}
          >
            <input
              placeholder="Name *"
              value={addName}
              onChange={e => setAddName(e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="Company"
              value={addCompany}
              onChange={e => setAddCompany(e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="Role / title"
              value={addRole}
              onChange={e => setAddRole(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8, marginBottom: 8 }}>
            <select
              value={addIntent}
              onChange={e => setAddIntent(e.target.value as OutreachIntent)}
              style={inputStyle}
            >
              {Object.entries(INTENT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <input
              placeholder="Notes (optional)"
              value={addNotes}
              onChange={e => setAddNotes(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleAddProspect}
              disabled={!addName.trim() || adding}
              style={{
                padding: '7px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background:
                  !addName.trim() || adding ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                cursor: !addName.trim() || adding ? 'not-allowed' : 'pointer',
              }}
            >
              {adding ? 'Adding...' : 'Add to pipeline'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              style={{
                padding: '7px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      {total > 0 && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
          {FILTER_TABS.map(tab => {
            const count =
              tab.key === 'all'
                ? total
                : tab.key === 'followup'
                  ? followupCount
                  : prospects.filter(p => p.status === tab.key).length;
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: active
                    ? '1px solid var(--accent-primary)'
                    : '1px solid var(--border-color)',
                  background: active ? 'var(--accent-primary)15' : 'transparent',
                  color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {tab.label}
                {count > 0 && <span style={{ marginLeft: 4, opacity: 0.75 }}>{count}</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Prospect list */}
      {loading ? (
        <p
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            margin: 0,
            textAlign: 'center',
            padding: '16px 0',
          }}
        >
          Loading prospects...
        </p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 4px 0' }}>
            {total === 0 ? 'No prospects yet.' : 'No prospects in this filter.'}
          </p>
          {total === 0 && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
              Generate outreach below and save to pipeline, or add manually.
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(p => {
            const meta = STATUS_META[p.status] ?? STATUS_META.cold;
            const due = isFollowUpDue(p);
            const busy = updatingId === p.id;
            return (
              <div
                key={p.id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: `1px solid ${due ? '#F59E0B40' : 'var(--border-color)'}`,
                  borderLeft: `3px solid ${due ? '#F59E0B' : meta.color}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  opacity: busy ? 0.6 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                {/* Identity */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 2,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {p.name}
                    </span>
                    {p.company && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        — {p.company}
                      </span>
                    )}
                    {due && (
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#F59E0B',
                          background: '#F59E0B15',
                          border: '1px solid #F59E0B30',
                          borderRadius: 4,
                          padding: '1px 6px',
                        }}
                      >
                        <AlertCircle size={9} />
                        Follow up
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {p.role && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.role}</span>
                    )}
                    {p.role && (
                      <span style={{ fontSize: 11, color: 'var(--border-color)' }}>•</span>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {INTENT_LABELS[p.intent as OutreachIntent] ?? p.intent}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--border-color)' }}>•</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {formatRelativeDate(p.outreachDate)}
                    </span>
                  </div>
                </div>

                {/* Status badge */}
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: `${meta.color}15`,
                    color: meta.color,
                    border: `1px solid ${meta.color}30`,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {meta.label}
                </span>

                {/* Quick actions */}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {p.status === 'cold' && (
                    <ActionBtn
                      onClick={() => updateStatus(p.id, 'warm')}
                      title="Mark replied"
                      disabled={busy}
                    >
                      <CheckCircle size={13} />
                    </ActionBtn>
                  )}
                  {p.status === 'warm' && (
                    <>
                      <ActionBtn
                        onClick={() => updateStatus(p.id, 'active')}
                        title="Call scheduled"
                        disabled={busy}
                      >
                        <Phone size={13} />
                      </ActionBtn>
                      <ActionBtn
                        onClick={() => updateStatus(p.id, 'converted')}
                        title="Converted"
                        color="var(--accent-primary)"
                        disabled={busy}
                      >
                        <TrendingUp size={13} />
                      </ActionBtn>
                    </>
                  )}
                  {p.status === 'active' && (
                    <ActionBtn
                      onClick={() => updateStatus(p.id, 'converted')}
                      title="Converted"
                      color="var(--accent-primary)"
                      disabled={busy}
                    >
                      <TrendingUp size={13} />
                    </ActionBtn>
                  )}
                  <ActionBtn onClick={() => archiveProspect(p.id)} title="Archive" disabled={busy}>
                    <X size={13} />
                  </ActionBtn>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ActionBtn({
  onClick,
  title,
  disabled,
  color,
  children,
}: {
  onClick: () => void;
  title: string;
  disabled: boolean;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-color)',
        background: 'transparent',
        color: color ?? 'var(--text-muted)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: 0,
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '7px 10px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  fontSize: 12,
  outline: 'none',
  fontFamily: 'inherit',
};
