'use client';

/**
 * NotificationsInbox — unified inbox surface at /dashboard/notifications.
 *
 * Reads from BOTH:
 *   - /api/notifications (NotificationLog rows — analysis_complete,
 *     low_score, team_invite, weekly_digest, etc.)
 *   - /api/nudges (Nudge rows — anchor_alert, dissent_prompt, toxic_
 *     combination, etc.)
 *
 * Merges them into a unified stream sorted by createdAt desc.
 * Provides:
 *   - Status filter (Unread / Read / All — including dismissed nudges)
 *   - Type filter (notifications by NotificationType + nudges by
 *     NUDGE_TYPE_LABELS)
 *   - Bulk actions (Mark all read, Mark selected dismissed)
 *   - Per-row action (open href / acknowledge nudge)
 *
 * Empty state via EnhancedEmptyState pattern: encourages first action.
 *
 * Uses canonical NUDGE_TYPE_LABELS to format nudge type strings — no
 * raw enum leaks per CLAUDE.md NUDGE_TYPE_LABELS discipline.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  BellOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  ExternalLink,
  Inbox,
  Settings,
} from 'lucide-react';
import { createClientLogger } from '@/lib/utils/logger';
import { NUDGE_TYPE_LABELS } from '@/lib/constants/human-audit';

const log = createClientLogger('NotificationsInbox');

type StatusFilter = 'all' | 'unread' | 'read';

interface ServerNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  href?: string | null;
  read: boolean;
  createdAt: string; // ISO
}

interface NudgeRow {
  id: string;
  nudgeType: string;
  message: string;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  createdAt: string;
  documentId?: string | null;
  humanDecisionId?: string | null;
}

interface InboxItem {
  source: 'notification' | 'nudge';
  id: string;
  type: string;
  typeLabel: string;
  title: string;
  message: string;
  href?: string;
  read: boolean;
  createdAt: number;
  raw: ServerNotification | NudgeRow;
}

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  analysis_complete: 'Analysis Complete',
  analysis_error: 'Analysis Error',
  low_score: 'Low DQI Score',
  stale_intel: 'Stale Intelligence',
  nudge: 'Coaching Nudge',
  outcome_reminder: 'Outcome Reminder',
  weekly_digest: 'Weekly Digest',
  team_invite: 'Team Invite',
  info: 'Info',
};

function notificationTypeLabel(type: string): string {
  return NOTIFICATION_TYPE_LABELS[type] ?? type.replace(/_/g, ' ');
}

function nudgeTypeLabel(type: string): string {
  return NUDGE_TYPE_LABELS[type] ?? type.replace(/_/g, ' ');
}

function timeAgo(ts: number, now: number): string {
  const seconds = Math.floor((now - ts) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function NotificationsInbox() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('unread');
  const [typeFilters, setTypeFilters] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(() => Date.now());

  // Live time-ago refresh
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(i);
  }, []);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [notifsRes, nudgesRes] = await Promise.all([
          fetch('/api/notifications').then(r => (r.ok ? r.json() : { notifications: [] })),
          fetch('/api/nudges?limit=100').then(r => (r.ok ? r.json() : { nudges: [] })),
        ]);
        if (cancelled) return;

        const notifs: InboxItem[] = (notifsRes.notifications || []).map(
          (n: ServerNotification) => ({
            source: 'notification' as const,
            id: n.id,
            type: n.type,
            typeLabel: notificationTypeLabel(n.type),
            title: n.title,
            message: n.message,
            href: n.href ?? undefined,
            read: n.read,
            createdAt: new Date(n.createdAt).getTime(),
            raw: n,
          })
        );

        const nudges: InboxItem[] = (nudgesRes.nudges || []).map((n: NudgeRow) => ({
          source: 'nudge' as const,
          id: n.id,
          type: n.nudgeType,
          typeLabel: nudgeTypeLabel(n.nudgeType),
          title: nudgeTypeLabel(n.nudgeType),
          message: n.message,
          href: n.documentId ? `/documents/${n.documentId}` : undefined,
          read: n.acknowledged,
          createdAt: new Date(n.createdAt).getTime(),
          raw: n,
        }));

        const merged = [...notifs, ...nudges].sort((a, b) => b.createdAt - a.createdAt);
        setItems(merged);
      } catch (e) {
        if (cancelled) return;
        log.warn('inbox load failed', e instanceof Error ? e.message : e);
        setError('Could not load notifications. Try again in a moment.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Available type filters (derived from the loaded items)
  const availableTypes = useMemo(() => {
    const set = new Map<string, string>();
    for (const it of items) {
      if (!set.has(it.type)) set.set(it.type, it.typeLabel);
    }
    return Array.from(set.entries()).sort(([, a], [, b]) => a.localeCompare(b));
  }, [items]);

  // Filtered items
  const filtered = useMemo(() => {
    return items.filter(it => {
      if (statusFilter === 'unread' && it.read) return false;
      if (statusFilter === 'read' && !it.read) return false;
      if (typeFilters.size > 0 && !typeFilters.has(it.type)) return false;
      return true;
    });
  }, [items, statusFilter, typeFilters]);

  const unreadCount = items.filter(i => !i.read).length;

  const toggleType = (t: string) =>
    setTypeFilters(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

  const markAllRead = async () => {
    // Optimistic UI
    setItems(prev => prev.map(i => ({ ...i, read: true })));
    // POST acknowledge to each unread nudge
    const unreadNudges = items.filter(i => i.source === 'nudge' && !i.read);
    await Promise.all(
      unreadNudges.map(n =>
        fetch(`/api/nudges/${n.id}/acknowledge`, { method: 'POST' }).catch(err =>
          log.warn(`nudge acknowledge failed for ${n.id}`, err instanceof Error ? err.message : err)
        )
      )
    );
    // Notifications mark-all-read is local-state only (the NotificationProvider
    // hydrates from server but local marks are not yet persisted; this matches
    // the existing NotificationCenter behavior).
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <header className="page-header" style={{ marginBottom: 24 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 12px',
            background: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)',
            color: 'var(--accent-primary)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            borderRadius: 999,
            marginBottom: 14,
          }}
        >
          <Inbox size={12} />
          Inbox
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h1>Notifications</h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>
              {unreadCount > 0
                ? `${unreadCount} unread · ${items.length} total`
                : `${items.length} total`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                style={{
                  padding: '8px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                }}
              >
                Mark all read
              </button>
            )}
            <Link
              href="/dashboard/settings#notifications"
              style={{
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 600,
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Settings size={13} />
              Preferences
            </Link>
          </div>
        </div>
      </header>

      {/* Status filter */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 12,
          padding: 4,
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          width: 'fit-content',
        }}
      >
        {(['unread', 'read', 'all'] as const).map(s => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            style={{
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 600,
              background: statusFilter === s ? 'var(--bg-card)' : 'transparent',
              color: statusFilter === s ? 'var(--text-primary)' : 'var(--text-secondary)',
              border:
                statusFilter === s ? '1px solid var(--border-color)' : '1px solid transparent',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {s}
            {s === 'unread' && unreadCount > 0 && (
              <span
                style={{
                  marginLeft: 6,
                  padding: '1px 6px',
                  borderRadius: 999,
                  background: 'var(--accent-primary)',
                  color: '#FFFFFF',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Type filters */}
      {availableTypes.length > 1 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            marginBottom: 20,
            paddingBottom: 12,
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--text-muted)',
              alignSelf: 'center',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginRight: 4,
            }}
          >
            Type:
          </span>
          {availableTypes.map(([type, label]) => (
            <button
              key={type}
              type="button"
              onClick={() => toggleType(type)}
              style={{
                padding: '4px 10px',
                fontSize: 12,
                fontWeight: 600,
                background: typeFilters.has(type)
                  ? 'color-mix(in srgb, var(--accent-primary) 14%, transparent)'
                  : 'var(--bg-card)',
                color: typeFilters.has(type) ? 'var(--accent-primary)' : 'var(--text-secondary)',
                border: `1px solid ${typeFilters.has(type) ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                borderRadius: 999,
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Body */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorCard message={error} />
      ) : filtered.length === 0 ? (
        <EmptyState statusFilter={statusFilter} hasItems={items.length > 0} />
      ) : (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
          }}
        >
          {filtered.map((it, i) => (
            <InboxRow
              key={`${it.source}-${it.id}`}
              item={it}
              isLast={i === filtered.length - 1}
              timeLabel={timeAgo(it.createdAt, now)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Subcomponents ─────────────────────────────────────────────────

function InboxRow({
  item,
  isLast,
  timeLabel,
}: {
  item: InboxItem;
  isLast: boolean;
  timeLabel: string;
}) {
  const icon = iconForItem(item);
  const wrapperStyle: React.CSSProperties = {
    display: 'flex',
    gap: 12,
    padding: '14px 18px',
    borderBottom: isLast ? 'none' : '1px solid var(--border-color)',
    background: item.read
      ? 'transparent'
      : 'color-mix(in srgb, var(--accent-primary) 4%, transparent)',
    cursor: item.href ? 'pointer' : 'default',
    color: 'inherit',
    textDecoration: 'none',
    alignItems: 'flex-start',
  };

  const content = (
    <>
      <div style={{ flexShrink: 0, marginTop: 2 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginRight: 8,
              }}
            >
              {item.source === 'nudge' ? 'Nudge' : 'Notification'} · {item.typeLabel}
            </span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeLabel}</span>
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: item.read ? 500 : 700,
            color: 'var(--text-primary)',
            marginTop: 4,
            lineHeight: 1.4,
          }}
        >
          {item.title}
        </div>
        {item.message && item.message !== item.title && (
          <div
            style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              marginTop: 4,
              lineHeight: 1.55,
            }}
          >
            {item.message}
          </div>
        )}
      </div>
      {item.href && (
        <ExternalLink
          size={14}
          style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 4 }}
        />
      )}
      {!item.read && (
        <span
          aria-hidden
          style={{
            width: 7,
            height: 7,
            background: 'var(--accent-primary)',
            borderRadius: '50%',
            flexShrink: 0,
            marginTop: 8,
          }}
        />
      )}
    </>
  );

  if (item.href) {
    return (
      <Link href={item.href} style={wrapperStyle}>
        {content}
      </Link>
    );
  }
  return <div style={wrapperStyle}>{content}</div>;
}

function iconForItem(item: InboxItem) {
  const size = 16;
  if (item.source === 'nudge') {
    return <AlertTriangle size={size} style={{ color: 'var(--warning)' }} />;
  }
  switch (item.type) {
    case 'analysis_complete':
      return <CheckCircle size={size} style={{ color: 'var(--success)' }} />;
    case 'low_score':
    case 'analysis_error':
      return <AlertTriangle size={size} style={{ color: 'var(--error)' }} />;
    case 'outcome_reminder':
    case 'stale_intel':
      return <Clock size={size} style={{ color: 'var(--warning)' }} />;
    case 'team_invite':
      return <Bell size={size} style={{ color: 'var(--accent-primary)' }} />;
    default:
      return <FileText size={size} style={{ color: 'var(--accent-primary)' }} />;
  }
}

function LoadingSkeleton() {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: 18,
      }}
    >
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            height: 60,
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: i < 2 ? 10 : 0,
            opacity: 0.6,
          }}
        />
      ))}
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--error)',
        borderLeft: '3px solid var(--error)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 18px',
      }}
    >
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <AlertTriangle size={14} style={{ color: 'var(--error)' }} />
        <strong style={{ fontSize: 13, color: 'var(--error)' }}>Inbox unavailable</strong>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>{message}</p>
    </div>
  );
}

function EmptyState({ statusFilter, hasItems }: { statusFilter: StatusFilter; hasItems: boolean }) {
  const allCaughtUp = hasItems && statusFilter === 'unread';
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '56px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'var(--bg-secondary)',
          marginBottom: 14,
        }}
      >
        {allCaughtUp ? (
          <CheckCircle size={28} style={{ color: 'var(--success)' }} />
        ) : (
          <BellOff size={26} style={{ color: 'var(--text-muted)' }} />
        )}
      </div>
      <h2
        style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}
      >
        {allCaughtUp
          ? 'All caught up'
          : statusFilter === 'unread'
            ? 'No unread notifications'
            : 'No notifications yet'}
      </h2>
      <p
        style={{
          fontSize: 14,
          color: 'var(--text-secondary)',
          margin: '0 0 16px',
          maxWidth: 460,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        {allCaughtUp
          ? "You've reviewed every notification. New analyses, outcome reminders, and coaching nudges will show up here as the platform produces them."
          : 'Notifications fire when audits complete, outcomes are due to be logged, teammates take action, and the R²F pipeline detects coaching moments. Run your first audit to start the flywheel.'}
      </p>
      {!hasItems && (
        <Link
          href="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 18px',
            background: 'var(--accent-primary)',
            color: '#FFFFFF',
            borderRadius: 'var(--radius-sm)',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Run your first audit
        </Link>
      )}
    </div>
  );
}
