'use client';

import { Suspense } from 'react';
import { TrendingUp } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { OutcomeFlywheelContent } from '@/components/outcome-flywheel/OutcomeFlywheelContent';

export default function OutcomeFlywheelPage() {
  return (
    <ErrorBoundary sectionName="Outcome Flywheel">
      <Suspense fallback={<PageSkeleton />}>
        <div
          className="container"
          style={{
            paddingTop: 'var(--spacing-2xl)',
            paddingBottom: 'var(--spacing-2xl)',
          }}
        >
          <Breadcrumbs
            items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Outcome Flywheel' }]}
          />

          <header className="page-header">
            <div>
              <h1 className="flex items-center gap-md" style={{ margin: 0 }}>
                <TrendingUp size={28} style={{ color: 'var(--accent-primary)' }} />
                <span className="text-gradient">Outcome Attribution Flywheel</span>
              </h1>
              <p className="page-subtitle">
                Track which decisions paid off, which didn&apos;t, and how your bias detection
                accuracy improves over time.
              </p>
            </div>
          </header>

          <OutcomeFlywheelContent />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}
