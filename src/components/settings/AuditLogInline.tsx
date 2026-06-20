'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Download,
  Search,
  FileText,
  Upload,
  MessageSquare,
  Bot,
  Briefcase,
  Share2,
  ClipboardList,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

interface AuditEntry {
  id: string;
  action: string;
  resource: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  EXPORT_PDF: <Download size={14} />,
  EXPORT_CSV: <Download size={14} />,
  SCAN_DOCUMENT: <Search size={14} />,
  VIEW_DOCUMENT: <FileText size={14} />,
  UPLOAD_DOCUMENT: <Upload size={14} />,
  CHAT_MESSAGE: <MessageSquare size={14} />,
  COPILOT_MESSAGE: <Bot size={14} />,
  SHARE_LINK_CREATED: <Share2 size={14} />,
};

// Loose-match container/decision actions to one icon without listing each.
function iconForAction(action: string): React.ReactNode {
  if (ACTION_ICONS[action]) return ACTION_ICONS[action];
  if (action.startsWith('CONTAINER_') || action.startsWith('PROSPECT_'))
    return <Briefcase size={14} />;
  return <ClipboardList size={14} />;
}

/** "just now" / "5m ago" / "2h ago" / date — makes the feed read as live. */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export function AuditLogInline() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Check admin status once on mount so the org-wide firehose shortcut
  // only renders for ADMIN_USER_IDS users. 401 / 403 / non-admin responses
  // all resolve to `false` — the link stays hidden and non-admins never
  // see an affordance they couldn't use.
  const [isAdmin, setIsAdmin] = useState(false);

  const loadLogs = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/audit?limit=15');
      const data = res.ok ? await res.json() : { logs: [] };
      setLogs(data.logs || []);
    } catch {
      // network blip — keep the prior list rather than blanking the feed
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadLogs();
    // Gentle live refresh so the feed shows what's happening without hammering
    // the endpoint (30s; cleared on unmount).
    const id = window.setInterval(() => void loadLogs(), 30_000);
    return () => window.clearInterval(id);
  }, [loadLogs]);

  useEffect(() => {
    fetch('/api/admin/is-admin')
      .then(r => (r.ok ? r.json() : { isAdmin: false }))
      .then(data => setIsAdmin(!!data.isAdmin))
      .catch(() => setIsAdmin(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
        <Loader2 size={18} className="animate-spin" style={{ margin: '0 auto 8px' }} />
        Loading audit log...
      </div>
    );
  }

  return (
    <div>
      <div className="card mb-lg">
        <div
          className="card-header"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <h3 className="flex items-center gap-sm">
            <ShieldCheck size={18} />
            Recent Activity
          </h3>
          <button
            onClick={() => void loadLogs()}
            disabled={refreshing}
            aria-label="Refresh activity"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 12,
              color: 'var(--text-muted)',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: 999,
              padding: '4px 10px',
              cursor: refreshing ? 'default' : 'pointer',
            }}
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : undefined} />
            Refresh
          </button>
        </div>
        <div className="card-body">
          {logs.length === 0 ? (
            <p
              style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 24 }}
            >
              No audit log entries yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {logs.map(log => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                    {iconForAction(log.action)}
                  </span>
                  <span style={{ flex: 1, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {log.action.replace(/_/g, ' ')}
                  </span>
                  {log.resource && (
                    <span
                      style={{
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {log.resource}
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                    {relativeTime(log.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <Link
            href="/dashboard/audit-log"
            style={{
              display: 'block',
              textAlign: 'center',
              marginTop: 16,
              padding: 10,
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--accent-primary)',
              textDecoration: 'none',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
            }}
          >
            View Full Audit Log
          </Link>

          {isAdmin && (
            <Link
              href="/dashboard/admin/audit-log"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 8,
                padding: 10,
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--accent-primary)',
                textDecoration: 'none',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(var(--success-rgb), 0.3)',
                background: 'rgba(var(--success-rgb), 0.06)',
              }}
            >
              <ShieldAlert size={14} />
              View org-wide audit log (admin)
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
