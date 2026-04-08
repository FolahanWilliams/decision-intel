'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Download, Search, FileText, LogIn, ClipboardList, Loader2 } from 'lucide-react';
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
  SCAN_DOCUMENT: <Search size={14} />,
  VIEW_DOCUMENT: <FileText size={14} />,
  LOGIN: <LogIn size={14} />,
};

export function AuditLogInline() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/audit?limit=15')
      .then(r => (r.ok ? r.json() : { logs: [] }))
      .then(data => setLogs(data.logs || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
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
        <div className="card-header">
          <h3 className="flex items-center gap-sm">
            <ShieldCheck size={18} />
            Recent Activity
          </h3>
        </div>
        <div className="card-body">
          {logs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 24 }}>
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
                    {ACTION_ICONS[log.action] || <ClipboardList size={14} />}
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
                    {new Date(log.createdAt).toLocaleDateString()}
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
        </div>
      </div>
    </div>
  );
}
