'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { BarChart3, Dna, Lightbulb, Fingerprint } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { TabBar } from '@/components/ui/TabBar';
import { EnhancedEmptyState } from '@/components/ui/EnhancedEmptyState';
import { useInsights } from '@/hooks/useInsights';
import { InsightsPageContent } from '@/components/insights/InsightsPageContent';
import { DecisionDNAPageContent } from '@/components/dna/DecisionDNAPageContent';
import { ExplainabilityContent } from '@/components/explainability/ExplainabilityContent';
import { FingerprintContent } from '@/components/fingerprint/FingerprintContent';

const TABS = [
  { key: 'trends', label: 'Trends & Insights', icon: <BarChart3 size={15} /> },
  { key: 'dna', label: 'Decision DNA', icon: <Dna size={15} /> },
  { key: 'explainability', label: 'Explainability', icon: <Lightbulb size={15} /> },
  { key: 'fingerprint', label: 'Fingerprint', icon: <Fingerprint size={15} /> },
];

const VALID_VIEWS = new Set(['trends', 'dna', 'explainability', 'fingerprint']);

function AnalyticsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawView = searchParams.get('view') ?? 'trends';
  const view = VALID_VIEWS.has(rawView) ? rawView : 'trends';
  const { insights, isLoading } = useInsights();

  const hasNoData = !isLoading && (!insights || insights.empty);

  return (
    <div>
      <div className="container" style={{ paddingTop: 'var(--spacing-2xl)', paddingBottom: 0 }}>
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Analytics' }]} />
        <header className="mb-lg">
          <div className="flex items-center gap-md mb-sm">
            <BarChart3 size={28} style={{ color: 'var(--accent-primary)' }} />
            <h1>Analytics</h1>
          </div>
          <p className="text-muted">
            Trends, insights, decision profile, explainability, and cognitive fingerprint
          </p>
        </header>
        {!hasNoData && (
          <TabBar
            tabs={TABS}
            activeTab={view}
            onTabChange={key => router.replace(`/dashboard/analytics?view=${key}`, { scroll: false })}
          />
        )}
      </div>
      {hasNoData ? (
        <div className="container" style={{ paddingTop: 'var(--spacing-xl)' }}>
          <EnhancedEmptyState type="insights" />
        </div>
      ) : (
        <div style={{ marginTop: 'var(--spacing-md)' }}>
          {view === 'trends' && <InsightsPageContent />}
          {view === 'dna' && <DecisionDNAPageContent />}
          {view === 'explainability' && <ExplainabilityContent />}
          {view === 'fingerprint' && <FingerprintContent />}
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <ErrorBoundary sectionName="Analytics">
      <Suspense fallback={<PageSkeleton />}>
        <AnalyticsInner />
      </Suspense>
    </ErrorBoundary>
  );
}
