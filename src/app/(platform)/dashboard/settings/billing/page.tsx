import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { isAdminUserId } from '@/lib/utils/admin';
import { ChevronLeft, FileDown, ShieldCheck } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { BillingSection } from '@/components/ui/BillingSection';
import { InvoicesPanel } from '@/components/billing/InvoicesPanel';

/**
 * /dashboard/settings/billing (4.5 deep) — composite billing surface
 * extending the existing BillingSection with: invoice history (last 6),
 * upcoming-charge preview, and an Enterprise Quote Builder entry for
 * admins. Existing /dashboard/settings continues to embed BillingSection
 * inline; this dedicated page is the Stripe-portal-equivalent landing
 * for users who want the deeper view.
 */

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) redirect('/login?next=/dashboard/settings/billing');
  const admin = isAdminUserId(user.id);

  return (
    <ErrorBoundary sectionName="Billing">
      <div style={{ padding: 'var(--spacing-xl)', maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <Link
            href="/dashboard/settings"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--text-muted)',
              fontSize: 12,
              textDecoration: 'none',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            <ChevronLeft size={14} /> Back to settings
          </Link>
        </div>
        <h1 className="page-header" style={{ margin: '0 0 6px', color: 'var(--text-primary)' }}>
          Billing
        </h1>
        <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', fontSize: 14, maxWidth: 720 }}>
          Plan + usage + invoices in one place. Annual prepay (2 months free) is available on the
          public pricing page; this view is the post-subscription source of truth.
        </p>

        <div style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
          <BillingSection />
          <InvoicesPanel />
          {admin && (
            <div
              style={{
                background: 'rgba(22,163,74,0.06)',
                border: '1px solid rgba(22,163,74,0.25)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--spacing-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldCheck size={16} color="#16A34A" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Admin · Enterprise Quote Builder
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Build a procurement-grade quote PDF (seats, deals, retention, SLA, volume floor).
                  </div>
                </div>
              </div>
              <Link
                href="/dashboard/settings/billing/enterprise-quote"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--accent-primary)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                <FileDown size={13} /> Open quote builder
              </Link>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
