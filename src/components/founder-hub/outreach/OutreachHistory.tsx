'use client';

import { useCallback, useEffect, useState } from 'react';
import { INTENT_LABELS } from '@/lib/outreach/types';
import type { OutreachIntent } from '@/lib/outreach/types';

interface HistoryItem {
  id: string;
  intent: OutreachIntent;
  contactName: string | null;
  contactTitle: string | null;
  contactCompany: string | null;
  generatedMessage: string;
  status: 'draft' | 'sent' | 'replied' | 'closed';
  sentAt: string | null;
  outcome: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  founderPass: string;
  refreshKey: number;
}

const STATUS_ORDER: Array<HistoryItem['status']> = ['draft', 'sent', 'replied', 'closed'];
const STATUS_LABELS: Record<HistoryItem['status'], string> = {
  draft: 'Draft',
  sent: 'Sent',
  replied: 'Replied',
  closed: 'Closed',
};
const STATUS_COLORS: Record<HistoryItem['status'], string> = {
  draft: '#94A3B8',
  sent: '#3B82F6',
  replied: '#16A34A',
  closed: '#8B5CF6',
};

export function OutreachHistory({ founderPass, refreshKey }: Props) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/founder-hub/outreach/history', {
        headers: { 'x-founder-pass': founderPass },
      });
      if (!res.ok) return;
      const json = await res.json();
      if (Array.isArray(json.data)) setItems(json.data as HistoryItem[]);
    } finally {
      setLoading(false);
    }
  }, [founderPass]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const updateStatus = async (id: string, status: HistoryItem['status']) => {
    await fetch('/api/founder-hub/outreach/history', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-founder-pass': founderPass },
      body: JSON.stringify({ id, status }),
    });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this outreach artifact?')) return;
    await fetch(`/api/founder-hub/outreach/history?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'x-founder-pass': founderPass },
    });
    load();
  };

  const grouped = STATUS_ORDER.map(status => ({
    status,
    items: items.filter(i => i.status === status),
  }));

  return (
    <div style={panel}>
      <div style={heading}>
        <span>Recent Outreach</span>
        <button type="button" onClick={load} style={refreshBtn}>
          Refresh
        </button>
      </div>

      {loading && items.length === 0 && (
        <div style={emptyState}>Loading history...</div>
      )}

      {!loading && items.length === 0 && (
        <div style={emptyState}>
          No outreach yet. Generate your first one to start tracking.
        </div>
      )}

      {grouped.map(group =>
        group.items.length === 0 ? null : (
          <div key={group.status} style={{ marginBottom: 20 }}>
            <div style={groupHeader}>
              <span style={{ color: STATUS_COLORS[group.status] }}>
                {STATUS_LABELS[group.status]}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {group.items.length}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {group.items.map(item => (
                <div key={item.id} style={itemCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.contactName ?? 'Unnamed'}
                      {item.contactCompany && (
                        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                          {' — '}
                          {item.contactCompany}
                        </span>
                      )}
                    </div>
                    <span style={chip(STATUS_COLORS[item.status])}>
                      {INTENT_LABELS[item.intent]}
                    </span>
                  </div>
                  <div style={previewText}>
                    {item.generatedMessage.slice(0, 140)}
                    {item.generatedMessage.length > 140 ? '...' : ''}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    {item.status === 'draft' && (
                      <button
                        type="button"
                        onClick={() => updateStatus(item.id, 'sent')}
                        style={smallBtn}
                      >
                        Mark sent
                      </button>
                    )}
                    {item.status === 'sent' && (
                      <>
                        <button
                          type="button"
                          onClick={() => updateStatus(item.id, 'replied')}
                          style={smallBtn}
                        >
                          Mark replied
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStatus(item.id, 'closed')}
                          style={smallBtn}
                        >
                          Close
                        </button>
                      </>
                    )}
                    {item.status === 'replied' && (
                      <button
                        type="button"
                        onClick={() => updateStatus(item.id, 'closed')}
                        style={smallBtn}
                      >
                        Close
                      </button>
                    )}
                    <button type="button" onClick={() => remove(item.id)} style={dangerBtn}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}

const panel: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  padding: 20,
  height: 'fit-content',
  position: 'sticky',
  top: 20,
};

const heading: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--text-primary)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 16,
};

const refreshBtn: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-color)',
  background: 'transparent',
  color: 'var(--text-muted)',
  fontSize: 10,
  fontWeight: 600,
  cursor: 'pointer',
  textTransform: 'none',
  letterSpacing: 0,
};

const groupHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 8,
};

const itemCard: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  padding: 12,
};

const previewText: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-secondary)',
  lineHeight: 1.45,
};

const chip = (color: string): React.CSSProperties => ({
  padding: '2px 8px',
  borderRadius: 'var(--radius-full)',
  background: `${color}20`,
  color,
  fontSize: 10,
  fontWeight: 700,
  whiteSpace: 'nowrap',
});

const smallBtn: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-color)',
  background: 'transparent',
  color: 'var(--text-primary)',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
};

const dangerBtn: React.CSSProperties = {
  ...smallBtn,
  color: '#EF4444',
  borderColor: '#EF444440',
};

const emptyState: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-muted)',
  padding: 16,
  textAlign: 'center',
};
