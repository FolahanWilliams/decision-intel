import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { createClient } from '@/utils/supabase/server';
import { isAdminUserId } from '@/lib/utils/admin';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AdminAuditLog } from '@/components/admin/AdminAuditLog';

/**
 * Admin-only firehose view of the AuditLog table.
 *
 * Gated server-side against ADMIN_USER_IDS — non-admins get redirected
 * to /dashboard rather than seeing a Forbidden screen they'd have to
 * click away from. The UI itself also hits /api/admin/audit-log which
 * performs the same check, so a stale-session attempt to reach the API
 * directly still fails 403.
 */
export default async function AdminAuditLogPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect('/login?next=/dashboard/admin/audit-log');
  }
  if (!isAdminUserId(user.id)) {
    redirect('/dashboard');
  }

  return (
    <ErrorBoundary sectionName="Admin Audit Log">
      <Suspense
        fallback={
          <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Loading audit log…</p>
          </div>
        }
      >
        <AdminAuditLog />
      </Suspense>
    </ErrorBoundary>
  );
}
