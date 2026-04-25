import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { isAdminUserId } from '@/lib/utils/admin';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ENTERPRISE_QUOTE_DEFAULTS } from '@/lib/stripe';
import { EnterpriseQuoteBuilderClient } from '@/components/billing/EnterpriseQuoteBuilderClient';

export default async function EnterpriseQuotePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) redirect('/login?next=/dashboard/settings/billing/enterprise-quote');
  if (!isAdminUserId(user.id)) {
    return (
      <div style={{ padding: 'var(--spacing-xl)' }}>
        <h1 style={{ color: 'var(--text-primary)' }}>Admin only</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          The Enterprise Quote Builder is restricted to admin users. If you should have access,
          confirm your Supabase user id is in the ADMIN_USER_IDS env var.
        </p>
      </div>
    );
  }

  return (
    <ErrorBoundary sectionName="Enterprise Quote Builder">
      <EnterpriseQuoteBuilderClient defaults={ENTERPRISE_QUOTE_DEFAULTS} />
    </ErrorBoundary>
  );
}
