'use client';

import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { MonitoringDashboard } from '@/components/admin/MonitoringDashboard';

export default function MonitoringPage() {
  return (
    <ErrorBoundary sectionName="Admin Monitoring">
      <Suspense
        fallback={
          <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Loading monitoring data...</p>
          </div>
        }
      >
        <MonitoringDashboard />
      </Suspense>
    </ErrorBoundary>
  );
}
