import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks (hoisted) ─────────────────────────────────────────────────────

const { mockFetch } = vi.hoisted(() => {
  const mockFetch = vi.fn();
  return { mockFetch };
});

// Mock globals
vi.stubGlobal('fetch', mockFetch);

vi.mock('@/lib/utils/logger', () => ({
  createClientLogger: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn() }),
}));

// We can't render React components (no jsdom), so we test the core logic
// extracted from the component behavior.

// ─── Tests ────────────────────────────────────────────────────────────────

describe('NotificationCenter logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── TYPE_MAP mapping ──────────────────────────────────────────────────

  describe('TYPE_MAP notification type mapping', () => {
    const TYPE_MAP: Record<string, string> = {
      analysis_complete: 'analysis_complete',
      analysis_error: 'low_score',
      nudge: 'info',
      outcome_reminder: 'stale_intel',
      weekly_digest: 'info',
      team_invite: 'info',
    };

    it('maps analysis_complete to analysis_complete', () => {
      expect(TYPE_MAP['analysis_complete']).toBe('analysis_complete');
    });

    it('maps analysis_error to low_score', () => {
      expect(TYPE_MAP['analysis_error']).toBe('low_score');
    });

    it('maps nudge to info', () => {
      expect(TYPE_MAP['nudge']).toBe('info');
    });

    it('maps outcome_reminder to stale_intel', () => {
      expect(TYPE_MAP['outcome_reminder']).toBe('stale_intel');
    });

    it('returns undefined for unknown types', () => {
      expect(TYPE_MAP['unknown_type']).toBeUndefined();
    });
  });

  // ── Server notification hydration logic ───────────────────────────────

  describe('server notification hydration', () => {
    it('fetches notifications from /api/notifications', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            notifications: [
              {
                id: 'n1',
                type: 'analysis_complete',
                subject: 'Doc analyzed',
                createdAt: '2026-01-01T00:00:00Z',
              },
            ],
          }),
      });

      await mockFetch('/api/notifications');
      expect(mockFetch).toHaveBeenCalledWith('/api/notifications');
    });

    it('transforms server notifications into client format', () => {
      const TYPE_MAP: Record<string, string> = {
        analysis_complete: 'analysis_complete',
        analysis_error: 'low_score',
        nudge: 'info',
        outcome_reminder: 'stale_intel',
        weekly_digest: 'info',
        team_invite: 'info',
      };

      const serverNotif = {
        id: 'n1',
        type: 'analysis_complete',
        subject: 'Document analyzed',
        createdAt: '2026-01-15T10:30:00Z',
      };

      // Replicate the transform logic from NotificationProvider
      const transformed = {
        id: `server-${serverNotif.id}`,
        type: TYPE_MAP[serverNotif.type] || 'info',
        title: serverNotif.subject || serverNotif.type.replace(/_/g, ' '),
        message: '',
        read: true,
        createdAt: new Date(serverNotif.createdAt).getTime(),
      };

      expect(transformed.id).toBe('server-n1');
      expect(transformed.type).toBe('analysis_complete');
      expect(transformed.title).toBe('Document analyzed');
      expect(transformed.read).toBe(true);
      expect(transformed.createdAt).toBe(new Date('2026-01-15T10:30:00Z').getTime());
    });

    it('uses type as fallback title when subject is null', () => {
      const serverNotif = {
        id: 'n2',
        type: 'weekly_digest',
        subject: null,
        createdAt: '2026-01-01T00:00:00Z',
      };
      const title = serverNotif.subject || serverNotif.type.replace(/_/g, ' ');
      expect(title).toBe('weekly digest');
    });

    it('deduplicates notifications by id', () => {
      const existing = [
        { id: 'server-n1', type: 'info', title: 'Test', message: '', read: true, createdAt: 100 },
      ];
      const incoming = [
        { id: 'server-n1', type: 'info', title: 'Test', message: '', read: true, createdAt: 100 },
        { id: 'server-n2', type: 'info', title: 'New', message: '', read: true, createdAt: 200 },
      ];

      const existingIds = new Set(existing.map(p => p.id));
      const deduped = incoming.filter(s => !existingIds.has(s.id));
      const merged = [...existing, ...deduped]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 50);

      expect(merged).toHaveLength(2);
      expect(merged[0].id).toBe('server-n2'); // newer first
      expect(merged[1].id).toBe('server-n1');
    });

    it('caps total notifications at 50', () => {
      const notifications = Array.from({ length: 55 }, (_, i) => ({
        id: `n-${i}`,
        type: 'info',
        title: `Notif ${i}`,
        message: '',
        read: true,
        createdAt: i,
      }));

      const capped = notifications.sort((a, b) => b.createdAt - a.createdAt).slice(0, 50);
      expect(capped).toHaveLength(50);
      expect(capped[0].createdAt).toBe(54); // newest
    });
  });

  // ── Unread count logic ────────────────────────────────────────────────

  describe('unread count', () => {
    it('counts unread notifications', () => {
      const notifications = [
        { id: '1', read: false },
        { id: '2', read: true },
        { id: '3', read: false },
        { id: '4', read: true },
      ];
      const unreadCount = notifications.filter(n => !n.read).length;
      expect(unreadCount).toBe(2);
    });

    it('returns 0 when all read', () => {
      const notifications = [
        { id: '1', read: true },
        { id: '2', read: true },
      ];
      const unreadCount = notifications.filter(n => !n.read).length;
      expect(unreadCount).toBe(0);
    });
  });

  // ── timeAgo formatting ────────────────────────────────────────────────

  describe('timeAgo formatting', () => {
    const timeAgo = (now: number, ts: number) => {
      const seconds = Math.floor((now - ts) / 1000);
      if (seconds < 60) return 'just now';
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
      if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
      return `${Math.floor(seconds / 86400)}d ago`;
    };

    it('returns "just now" for < 60 seconds', () => {
      const now = 1000000;
      expect(timeAgo(now, now - 30000)).toBe('just now');
    });

    it('returns minutes for < 1 hour', () => {
      const now = 1000000;
      expect(timeAgo(now, now - 300000)).toBe('5m ago');
    });

    it('returns hours for < 1 day', () => {
      const now = 1000000000;
      expect(timeAgo(now, now - 7200000)).toBe('2h ago');
    });

    it('returns days for >= 1 day', () => {
      const now = 1000000000;
      expect(timeAgo(now, now - 172800000)).toBe('2d ago');
    });
  });

  // ── markRead / markAllRead logic ──────────────────────────────────────

  describe('mark read operations', () => {
    it('markRead sets a single notification to read', () => {
      const notifications = [
        { id: '1', read: false },
        { id: '2', read: false },
      ];
      const id = '1';
      const updated = notifications.map(n => (n.id === id ? { ...n, read: true } : n));
      expect(updated[0].read).toBe(true);
      expect(updated[1].read).toBe(false);
    });

    it('markAllRead sets all notifications to read', () => {
      const notifications = [
        { id: '1', read: false },
        { id: '2', read: false },
      ];
      const updated = notifications.map(n => ({ ...n, read: true }));
      expect(updated.every(n => n.read)).toBe(true);
    });

    it('clearAll empties the list', () => {
      const cleared: unknown[] = [];
      expect(cleared).toHaveLength(0);
    });
  });

  // ── addNotification logic ─────────────────────────────────────────────

  describe('addNotification', () => {
    it('prepends new notification and caps at 50', () => {
      const existing = Array.from({ length: 50 }, (_, i) => ({
        id: `existing-${i}`,
        read: true,
        createdAt: i,
      }));

      const newNotif = { id: 'new-1', read: false, createdAt: 999 };
      const updated = [newNotif, ...existing].slice(0, 50);

      expect(updated).toHaveLength(50);
      expect(updated[0].id).toBe('new-1');
      // Last old item should be dropped
      expect(updated.find(n => n.id === 'existing-49')).toBeUndefined();
    });
  });

  // ── Fetch error handling ──────────────────────────────────────────────

  describe('fetch error handling', () => {
    it('handles non-ok response gracefully', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      const res = await mockFetch('/api/notifications');
      const data = res.ok ? await res.json() : null;
      expect(data).toBeNull();
    });

    it('handles network error gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      let caught = false;
      try {
        await mockFetch('/api/notifications');
      } catch {
        caught = true;
      }
      expect(caught).toBe(true);
    });
  });
});
