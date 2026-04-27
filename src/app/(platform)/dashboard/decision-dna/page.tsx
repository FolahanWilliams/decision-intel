'use client';

import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DecisionDNAPageContent } from '@/components/dna/DecisionDNAPageContent';

// Decision DNA — personal calibration profile per user. The page-level
// breadcrumbs sit above the component's own container; the component owns
// its H1, animation grid, and refresh button. See [DecisionDNAPageContent]
// for the body and useDecisionDNA for the data hook.
export default function DecisionDNAPage() {
  return (
    <ErrorBoundary sectionName="Decision DNA">
      <Suspense fallback={<PageSkeleton />}>
        <div className="container" style={{ paddingTop: 'var(--spacing-lg)' }}>
          <Breadcrumbs
            items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Decision DNA' }]}
          />
        </div>
        <DecisionDNAPageContent />
      </Suspense>
    </ErrorBoundary>
  );
}
