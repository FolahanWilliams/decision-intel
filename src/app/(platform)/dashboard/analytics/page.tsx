'use client';

import { Suspense, lazy } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { BarChart3, BrainCircuit, Network, TrendingUp } from 'lucide-react';
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
const AuditsPageContent = lazy(() =>
  import('@/components/audits/AuditsPageContent').then(m => ({ default: m.AuditsPageContent }))
);
const NudgesPageContent = lazy(() =>
  import('@/components/nudges/NudgesPageContent').then(m => ({ default: m.NudgesPageContent }))
);
const CalibrationContent = lazy(() =>
  import('@/components/calibration/CalibrationContent').then(m => ({
    default: m.CalibrationContent,
  }))
);
const OutcomeFlywheelContent = lazy(() =>
  import('@/components/outcome-flywheel/OutcomeFlywheelContent').then(m => ({
    default: m.OutcomeFlywheelContent,
  }))
);

// Consolidated from 7 → 3 tabs. Each tab now rolls up its previous
// siblings into one surface: Performance = DQI trends + quality audits +
// outcome loop; Intelligence = fingerprint + explainability + taxonomy;
// Graph = the Decision Knowledge Graph (still its own page for the full
// visualization, linked out via NAV_TABS).
const TABS = [
  { key: 'performance', label: 'Performance', icon: <BarChart3 size={15} /> },
  { key: 'intelligence', label: 'Intelligence', icon: <BrainCircuit size={15} /> },
  { key: 'graph', label: 'Decision Graph', icon: <Network size={15} /> },
];

const VALID_VIEWS = new Set(['performance', 'intelligence', 'graph']);

// Legacy keys (from the previous 7-tab taxonomy + DNA/fingerprint) are
// remapped to the new 3-tab taxonomy so Slack deep links, bookmarks, and
// older emails keep resolving to the right surface.
const LEGACY_VIEW_MAP: Record<string, string> = {
  trends: 'performance',
  quality: 'performance',
  flywheel: 'performance',
  explainability: 'intelligence',
  library: 'intelligence',
  dna: 'intelligence',
  fingerprint: 'intelligence',
};

// Heavy visualizations navigate to separate pages instead of rendering inline
const NAV_TABS: Record<string, string> = {
  graph: '/dashboard/decision-graph',
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-md"
      style={{
        fontSize: '0.75rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        marginTop: 'var(--spacing-xl)',
      }}
    >
      {children}
    </h2>
  );
}

function AnalyticsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawView = searchParams.get('view') ?? 'performance';
  const remapped = LEGACY_VIEW_MAP[rawView] ?? rawView;
  const view = VALID_VIEWS.has(remapped) ? remapped : 'performance';

  // Replace URL if we remapped a legacy view
  if (view !== rawView) {
    router.replace(`/dashboard/analytics?view=${view}`, { scroll: false });
  }

  const { insights, isLoading } = useInsights();
  const hasNoData = !isLoading && (!insights || insights.empty);

  return (
    <div>
      <div className="container" style={{ paddingTop: 'var(--spacing-2xl)', paddingBottom: 0 }}>
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Analytics' }]} />
        <header className="page-header">
          <div>
            <h1 className="flex items-center gap-md" style={{ margin: 0 }}>
              <BarChart3 size={28} style={{ color: 'var(--accent-primary)' }} />
              <span className="text-gradient">Analytics</span>
            </h1>
            <p className="page-subtitle">
              Track how your Decision Quality Index compounds, quarter after quarter, across every
              strategic memo your team produces.
            </p>
          </div>
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
          <EnhancedEmptyState type="insights" showBrief briefContext="analytics" />
        </div>
      ) : (
        <Suspense fallback={<PageSkeleton />}>
          <div
            className="container"
            style={{ marginTop: 'var(--spacing-md)', paddingBottom: 'var(--spacing-2xl)' }}
          >
            {view === 'performance' && (
              <div>
                <SectionHeading>Trends &amp; Quality</SectionHeading>
                <InsightsPageContent />

                <SectionHeading>
                  <TrendingUp
                    size={13}
                    style={{ display: 'inline', marginRight: 6, verticalAlign: '-2px' }}
                  />
                  Outcome Flywheel
                </SectionHeading>
                <OutcomeFlywheelContent />

                <SectionHeading>Cognitive Audits</SectionHeading>
                <AuditsPageContent />

                <SectionHeading>Nudges</SectionHeading>
                <div style={{ marginTop: 'var(--spacing-md)' }}>
                  <NudgesPageContent />
                </div>

                <SectionHeading>Calibration</SectionHeading>
                <div style={{ marginTop: 'var(--spacing-md)' }}>
                  <CalibrationContent />
                </div>
              </div>
            )}
            {view === 'intelligence' && (
              <div>
                <SectionHeading>Decision Intelligence</SectionHeading>
                <DecisionIntelligenceContent />

                <SectionHeading>Explainability</SectionHeading>
                <ExplainabilityContent />

                <SectionHeading>Bias Library</SectionHeading>
                <BiasLibraryContent />
              </div>
            )}
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
