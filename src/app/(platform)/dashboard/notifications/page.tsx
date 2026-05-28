/**
 * /dashboard/notifications — unified inbox for in-app notifications +
 * server-persisted nudges.
 *
 * Shipped 2026-05-28 as honorable-mention #6 from the 2026-05-28 nightly
 * audit. The NotificationBell dropdown shows recent items (capped); this
 * page is the comprehensive surface a user reaches from "View all →" or
 * from the sidebar / command palette.
 *
 * Architecture: client-side fetch from /api/notifications + /api/nudges
 * in parallel; merge + sort by createdAt desc; render with status filters
 * (Unread / Read / All) + type filters (Analysis / Outcome / Nudge /
 * Team / Digest). Each row deep-links to its referenced surface.
 */

import type { Metadata } from 'next';
import { NotificationsInbox } from '@/components/notifications/NotificationsInbox';

export const metadata: Metadata = {
  title: 'Notifications · Decision Intel',
  description: 'Unified inbox for in-app notifications, nudges, and outcome reminders.',
};

export default function NotificationsPage() {
  return (
    <main style={{ padding: '24px 24px 96px' }}>
      <NotificationsInbox />
    </main>
  );
}
