'use client';

import { Suspense, lazy } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  BarChart3,
  Lightbulb,
  BrainCircuit,
  TrendingUp,
  Network,
  BookOpen,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { TabBar } from '@/components/ui/TabBar';
import { EnhancedEmptyState } from '@/components/ui/EnhancedEmptyState';
import { useInsights } from '@/hooks/useInsights';

// Lazy-load heavy visualization components — only the active tab's bundle is loaded
const InsightsPageContent = lazy(() =>
  import('@/components/insights/InsightsPageContent').then(m => ({
    default: m.InsightsPageContent,
  }))
);
const ExplainabilityContent = lazy(() =>
  import('@/components/explainability/ExplainabilityContent').then(m => ({
    default: m.ExplainabilityContent,
  }))
);
const DecisionIntelligenceContent = lazy(() =>
  import('@/components/analytics/DecisionIntelligenceContent').then(m => ({
    default: m.DecisionIntelligenceContent,
  }))
);
const BiasLibraryContent = lazy(() =>
  import('@/components/insights/BiasLibraryContent').then(m => ({ default: m.BiasLibraryContent }))
);

const TABS = [
  { key: 'trends', label: 'Trends & Insights', icon: <BarChart3 size={15} /> },
  { key: 'intelligence', label: 'Decision Intelligence', icon: <BrainCircuit size={15} /> },
  { key: 'explainability', label: 'Explainability', icon: <Lightbulb size={15} /> },
  { key: 'library', label: 'Bias Library', icon: <BookOpen size={15} /> },
  { key: 'quality', label: 'Decision Quality', icon: <BrainCircuit size={15} /> },
  { key: 'flywheel', label: 'Outcome Flywheel', icon: <TrendingUp size={15} /> },
  { key: 'graph', label: 'Decision Graph', icon: <Network size={15} /> },
];

const VALID_VIEWS = new Set([
  'trends',
  'intelligence',
  'explainability',
  'library',
  'quality',
  'flywheel',
  'graph',
]);

// Tabs that navigate to separate pages instead of rendering inline
const NAV_TABS: Record<string, string> = {
  quality: '/dashboard/decision-quality',
  flywheel: '/dashboard/outcome-flywheel',
  graph: '/dashboard/decision-graph',
};

function AnalyticsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawView = searchParams.get('view') ?? 'trends';
  // Redirect legacy DNA/Fingerprint URLs to the merged Decision Intelligence tab
  const normalizedView =
    rawView === 'dna' || rawView === 'fingerprint' ? 'intelligence' : rawView;
  const view = VALID_VIEWS.has(normalizedView) ? normalizedView : 'trends';

  // Replace URL if we normalized a legacy view
  if (normalizedView !== rawView) {
    router.replace(`/dashboard/analytics?view=${view}`, { scroll: false });
  }
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
            Trends, decision intelligence, explainability, and industry benchmarks
          </p>
        </header>
        {!hasNoData && (
          <TabBar
            tabs={TABS}
            activeTab={view}
            onTabChange={key => {
              if (NAV_TABS[key]) {
                router.push(NAV_TABS[key]);
              } else {
                router.replace(`/dashboard/analytics?view=${key}`, { scroll: false });
              }
            }}
          />
        )}
      </div>
      {hasNoData ? (
        <div className="container" style={{ paddingTop: 'var(--spacing-xl)' }}>
          <EnhancedEmptyState type="insights" />
        </div>
      ) : (
        <Suspense fallback={<PageSkeleton />}>
          <div style={{ marginTop: 'var(--spacing-md)' }}>
            {view === 'trends' && <InsightsPageContent />}
            {view === 'intelligence' && <DecisionIntelligenceContent />}
            {view === 'explainability' && <ExplainabilityContent />}
            {view === 'library' && <BiasLibraryContent />}
          </div>
        </Suspense>
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
