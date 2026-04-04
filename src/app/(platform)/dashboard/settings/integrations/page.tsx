'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { IntegrationMarketplace } from '@/components/settings/IntegrationMarketplace';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

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
