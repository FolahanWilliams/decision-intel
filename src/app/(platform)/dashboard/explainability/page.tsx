'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ExplainabilityDashboard } from '@/components/explainability/ExplainabilityDashboard';

function ExplainabilityContent() {
  const searchParams = useSearchParams();
  const analysisId = searchParams.get('analysisId');

  if (!analysisId) {
    return (
      <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          No analysis selected. Navigate to a document and click &ldquo;Explain Score&rdquo; to view the explainability dashboard.
        </p>
      </div>
    );
  }

  return <ExplainabilityDashboard analysisId={analysisId} />;
}

export default function ExplainabilityPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      }
    >
      <ExplainabilityContent />
    </Suspense>
  );
}
