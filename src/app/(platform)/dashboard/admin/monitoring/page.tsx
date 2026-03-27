'use client';

import { Suspense } from 'react';
import { MonitoringDashboard } from '@/components/admin/MonitoringDashboard';

export default function MonitoringPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading monitoring data...</p>
        </div>
      }
    >
      <MonitoringDashboard />
    </Suspense>
  );
}
