import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { ArrowLeft, Package } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { createClient } from '@/utils/supabase/server';
import { DecisionPackageDetailClient } from '@/components/decisions/DecisionPackageDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

async function fetchInitial(packageId: string, cookie: string) {
  const h = await headers();
  const protocol = h.get('x-forwarded-proto') || 'https';
  const host = h.get('host') || 'localhost:3000';
  const url = `${protocol}://${host}/api/decision-packages/${encodeURIComponent(packageId)}`;
  const res = await fetch(url, {
    cache: 'no-store',
    headers: cookie ? { cookie } : undefined,
  });
  if (!res.ok) {
    return null;
  }
  return res.json();
}

export const dynamic = 'force-dynamic';

export default async function DecisionPackageDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) redirect(`/login?next=/dashboard/decisions/${id}`);

  const h = await headers();
  const cookie = h.get('cookie') || '';
  const initial = await fetchInitial(id, cookie);

  if (!initial?.package) {
    return (
      <div
        style={{
          maxWidth: 560,
          margin: '0 auto',
          padding: 'var(--spacing-xl)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div>
          <Link
            href="/dashboard/decisions"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-muted)',
              textDecoration: 'none',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            <ArrowLeft size={13} /> All Decision Packages
          </Link>
        </div>
        <div
          style={{
            padding: 'var(--spacing-lg)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: '3px solid var(--warning)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            gap: 14,
          }}
        >
          <Package size={20} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 6,
              }}
            >
              Decision Package not found
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
              }}
            >
              This Decision Package either doesn&rsquo;t exist, was deleted, or you don&rsquo;t have
              access. If you followed a shared link, ask the package owner to invite you; if you
              bookmarked this page from your own org, the package may have been removed.
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              <Link
                href="/dashboard/decisions"
                className="btn btn-primary flex items-center gap-sm"
                style={{ fontSize: 13, padding: '8px 14px' }}
              >
                Browse Decision Packages
              </Link>
              <Link
                href="/dashboard"
                className="btn btn-ghost flex items-center gap-sm"
                style={{ fontSize: 13, padding: '8px 14px' }}
              >
                Back to dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary sectionName="Decision Package Detail">
      <DecisionPackageDetailClient packageId={id} initial={initial} />
    </ErrorBoundary>
  );
}
