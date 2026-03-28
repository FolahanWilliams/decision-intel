'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import { Bell, FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NotificationType = 'analysis_complete' | 'low_score' | 'stale_intel' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  href?: string;
  read: boolean;
  createdAt: number;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const TYPE_MAP: Record<string, NotificationType> = {
  analysis_complete: 'analysis_complete',
  analysis_error: 'low_score',
  nudge: 'info',
  outcome_reminder: 'stale_intel',
  weekly_digest: 'info',
  team_invite: 'info',
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const serverFetched = useRef(false);

  // Hydrate from server-persisted NotificationLog on first mount
  useEffect(() => {
    if (serverFetched.current) return;
    serverFetched.current = true;
    fetch('/api/notifications')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!data?.notifications?.length) return;
        const serverNotifs: Notification[] = data.notifications.map(
          (n: { id: string; type: string; subject: string | null; createdAt: string }) => ({
            id: `server-${n.id}`,
            type: TYPE_MAP[n.type] || 'info',
            title: n.subject || n.type.replace(/_/g, ' '),
            message: '',
            read: true, // Server notifications are already "delivered"
            createdAt: new Date(n.createdAt).getTime(),
          })
        );
        setNotifications(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const deduped = serverNotifs.filter(s => !existingIds.has(s.id));
          return [...prev, ...deduped].sort((a, b) => b.createdAt - a.createdAt).slice(0, 50);
        });
      })
      .catch((err) => {
        // Log fetch failures so they're not silently swallowed
        console.warn('Failed to fetch notifications:', err instanceof Error ? err.message : err);
      });
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    const notification: Notification = {
      ...n,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      read: false,
      createdAt: Date.now(),
    };
    setNotifications(prev => [notification, ...prev].slice(0, 50));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, addNotification, markRead, markAllRead, clearAll }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}

// ---------------------------------------------------------------------------
// Dropdown UI
// ---------------------------------------------------------------------------

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(0);

  // Update every 10s when open so relative timestamps stay fresh
  // (now is initialized to 0 to avoid hydration mismatch; handleToggle sets it on open)
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(interval);
  }, [open]);

  const handleToggle = useCallback(() => {
    setNow(Date.now());
    setOpen(prev => !prev);
  }, []);

  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const iconForType = (type: NotificationType) => {
    switch (type) {
      case 'analysis_complete':
        return <CheckCircle size={14} style={{ color: 'var(--success)' }} />;
      case 'low_score':
        return <AlertTriangle size={14} style={{ color: 'var(--error)' }} />;
      case 'stale_intel':
        return <Clock size={14} style={{ color: 'var(--warning)' }} />;
      default:
        return <FileText size={14} style={{ color: 'var(--accent-primary)' }} />;
    }
  };

  const timeAgo = (ts: number) => {
    const seconds = Math.floor((now - ts) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={handleToggle}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '6px',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              width: '8px',
              height: '8px',
              background: 'var(--error)',
              borderRadius: '50%',
            }}
          />
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 29 }}
            aria-hidden
          />
          <div
            role="dialog"
            aria-label="Notifications"
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              width: '360px',
              maxHeight: '400px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              zIndex: 30,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between"
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 600 }}>
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </span>
              <div className="flex items-center gap-xs">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {notifications.length === 0 && (
                <div
                  className="flex flex-col items-center justify-center"
                  style={{ padding: '32px 16px', color: 'var(--text-muted)', fontSize: '13px' }}
                >
                  <Bell size={24} style={{ opacity: 0.3, marginBottom: '8px' }} />
                  No notifications
                </div>
              )}
              {notifications.map(n => {
                const content = (
                  <div
                    className="flex gap-sm"
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border-color)',
                      background: n.read ? 'transparent' : 'rgba(255, 255, 255, 0.04)',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      markRead(n.id);
                      if (!n.href) setOpen(false);
                    }}
                  >
                    <div style={{ flexShrink: 0, marginTop: '2px' }}>{iconForType(n.type)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: '13px', fontWeight: n.read ? 400 : 600 }}>
                          {n.title}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            flexShrink: 0,
                            marginLeft: '8px',
                          }}
                        >
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          margin: '2px 0 0',
                          lineHeight: 1.4,
                        }}
                      >
                        {n.message}
                      </p>
                    </div>
                    {!n.read && (
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          background: 'var(--text-highlight)',
                          borderRadius: '50%',
                          flexShrink: 0,
                          marginTop: '6px',
                        }}
                      />
                    )}
                  </div>
                );

                return n.href ? (
                  <Link
                    key={n.id}
                    href={n.href}
                    onClick={() => setOpen(false)}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={n.id}>{content}</div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
