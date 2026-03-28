'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { IntegrationMarketplace } from '@/components/settings/IntegrationMarketplace';

export default function IntegrationsPage() {
  return (
    <ErrorBoundary sectionName="Integrations">
      <IntegrationMarketplace />
    </ErrorBoundary>
  );
}
