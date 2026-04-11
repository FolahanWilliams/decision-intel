'use client';

import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

// IntegrationMarketplace is ~1700 lines — lazy-load to avoid blocking FCP.
const IntegrationMarketplace = dynamic(
  () =>
    import('@/components/settings/IntegrationMarketplace').then(m => ({
      default: m.IntegrationMarketplace,
    })),
  {
    loading: () => (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Loader2
          size={24}
          style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)' }}
        />
      </div>
    ),
  }
);

export default function IntegrationsPage() {
  return (
    <ErrorBoundary sectionName="Integrations">
      <div className="container" style={{ paddingTop: 'var(--spacing-lg)' }}>
        <Link
          href="/dashboard/settings?tab=connections"
          className="flex items-center gap-xs text-xs text-muted mb-md"
          style={{ textDecoration: 'none' }}
        >
          <ArrowLeft size={14} />
          Back to Settings
        </Link>
      </div>
      <IntegrationMarketplace />
    </ErrorBoundary>
  );
}
