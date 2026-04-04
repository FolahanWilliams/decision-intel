'use client';

import { useCallback, useState } from 'react';
import { Copy, Trash2, Loader2 } from 'lucide-react';
import { card, sectionTitle, badge } from '../shared-styles';

interface ContentItem {
  id: string;
  contentType: string;
  title: string;
  body: string;
  topic: string | null;
  tone: string | null;
  status: string;
  createdAt: string;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  linkedin_post: { label: 'LinkedIn', color: '#0a66c2' },
  twitter_thread: { label: 'Twitter/X', color: '#1d9bf0' },
  blog_draft: { label: 'Blog', color: '#22c55e' },
  snippet: { label: 'Snippet', color: '#f59e0b' },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: '#71717a' },
  ready: { label: 'Ready', color: '#3b82f6' },
  posted: { label: 'Posted', color: '#22c55e' },
};

const STATUS_CYCLE: Record<string, string> = {
  draft: 'ready',
  ready: 'posted',
  posted: 'draft',
};

interface ContentLibraryProps {
  founderPass: string;
  items: ContentItem[];
  filterType: string;
  setFilterType: (t: string) => void;
  filterStatus: string;
  setFilterStatus: (s: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

export function ContentLibrary({
  founderPass,
  items,
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
  onRefresh,
  loading,
}: ContentLibraryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleStatusCycle = useCallback(async (id: string, currentStatus: string) => {
    const nextStatus = STATUS_CYCLE[currentStatus] || 'draft';
    try {
      await fetch('/api/founder-hub/content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-founder-pass': founderPass },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      onRefresh();
    } catch {
      // silent
    }
  }, [founderPass, onRefresh]);

  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/founder-hub/content?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-founder-pass': founderPass },
      });
      setConfirmDeleteId(null);
      onRefresh();
    } catch {
      // silent
    } finally {
      setDeletingId(null);
    }
  }, [founderPass, onRefresh]);

  const handleCopy = useCallback((body: string) => {
    navigator.clipboard.writeText(body);
  }, []);

  return (
    <div style={card}>
      <div style={{ ...sectionTitle, marginBottom: 16 }}>📚 Content Library</div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          style={{
            padding: '6px 12px', borderRadius: 6, fontSize: 12,
            border: '1px solid var(--border-primary, #222)',
            background: 'var(--bg-primary, #0a0a0a)',
            color: 'var(--text-primary, #fff)',
          }}
        >
          <option value="">All Types</option>
          <option value="linkedin_post">LinkedIn</option>
          <option value="twitter_thread">Twitter/X</option>
          <option value="blog_draft">Blog</option>
          <option value="snippet">Snippet</option>
        </select>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{
            padding: '6px 12px', borderRadius: 6, fontSize: 12,
            border: '1px solid var(--border-primary, #222)',
            background: 'var(--bg-primary, #0a0a0a)',
            color: 'var(--text-primary, #fff)',
          }}
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="posted">Posted</option>
        </select>
      </div>

      {/* Content list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted, #71717a)' }}>
          <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
          Loading...
        </div>
      ) : items.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 40,
          color: 'var(--text-muted, #71717a)',
          fontSize: 13,
        }}>
          No content yet. Generate your first piece above!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(item => {
            const typeInfo = TYPE_LABELS[item.contentType] || { label: item.contentType, color: '#71717a' };
            const statusInfo = STATUS_LABELS[item.status] || { label: item.status, color: '#71717a' };

            return (
              <div
                key={item.id}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid var(--border-primary, #222)',
                  background: 'var(--bg-primary, #0a0a0a)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={badge(typeInfo.color)}>{typeInfo.label}</span>
                      <button
                        onClick={() => handleStatusCycle(item.id, item.status)}
                        style={{
                          ...badge(statusInfo.color),
                          cursor: 'pointer',
                          border: `1px solid ${statusInfo.color}30`,
                          background: `${statusInfo.color}15`,
                        }}
                        title={`Click to change status → ${STATUS_CYCLE[item.status] || 'draft'}`}
                      >
                        {statusInfo.label}
                      </button>
                      <span style={{ fontSize: 11, color: 'var(--text-muted, #71717a)' }}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-primary, #fff)',
                      marginBottom: 4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {item.title}
                    </div>
                    <div style={{
                      fontSize: 12,
                      color: 'var(--text-secondary, #a1a1aa)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {item.body.slice(0, 120)}...
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button
                      onClick={() => handleCopy(item.body)}
                      style={{
                        padding: 6, borderRadius: 4, cursor: 'pointer',
                        border: '1px solid var(--border-primary, #222)',
                        background: 'transparent',
                        color: 'var(--text-muted, #71717a)',
                      }}
                      title="Copy to clipboard"
                    >
                      <Copy size={12} />
                    </button>
                    {confirmDeleteId === item.id ? (
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        style={{
                          padding: '4px 8px', borderRadius: 4, cursor: 'pointer',
                          border: '1px solid #ef444440',
                          background: '#ef444415',
                          color: '#ef4444',
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {deletingId === item.id ? '...' : 'Confirm'}
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(item.id)}
                        style={{
                          padding: 6, borderRadius: 4, cursor: 'pointer',
                          border: '1px solid var(--border-primary, #222)',
                          background: 'transparent',
                          color: 'var(--text-muted, #71717a)',
                        }}
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
