import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
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
      <div style={{ padding: 'var(--spacing-xl)' }}>
        <h1 style={{ color: 'var(--text-primary)' }}>Package not found</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          This Decision Package either doesn&rsquo;t exist or you don&rsquo;t have access.
        </p>
      </div>
    );
  }

  return (
    <ErrorBoundary sectionName="Decision Package Detail">
      <DecisionPackageDetailClient packageId={id} initial={initial} />
    </ErrorBoundary>
  );
}
