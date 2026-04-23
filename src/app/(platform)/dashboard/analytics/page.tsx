'use client';

import { Suspense, lazy, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  BarChart3,
  BrainCircuit,
  Network,
  TrendingUp,
  Activity,
  Lightbulb,
  Gauge,
  BookOpen,
  FlaskConical,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { TabBar } from '@/components/ui/TabBar';
import { EnhancedEmptyState } from '@/components/ui/EnhancedEmptyState';
import { useInsights } from '@/hooks/useInsights';
import { CalibrationTrackerChip } from '@/components/analytics/CalibrationTrackerChip';

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
const ExperimentsContent = lazy(() =>
  import('@/components/experiments/ExperimentsContent').then(m => ({
    default: m.ExperimentsContent,
  }))
);

// Consolidated from 7 → 3 tabs. Each tab now rolls up its previous
// siblings into one surface: Performance = DQI trends + outcome loop +
// decision signals (audits/nudges merged) + calibration; Intelligence =
// fingerprint + explainability + taxonomy; Graph = the Decision Knowledge
// Graph (own page for the full visualization, linked via NAV_TABS).
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
  // 2026-04-23 consolidation — /dashboard/decision-quality redirects here
  // with ?view=<tab>. Audits and Nudges already live in DecisionSignals
  // on Performance; Calibration and Experiments sit alongside.
  audits: 'performance',
  nudges: 'performance',
  calibration: 'performance',
  experiments: 'performance',
};

// Heavy visualizations navigate to separate pages instead of rendering inline
const NAV_TABS: Record<string, string> = {
  graph: '/dashboard/decision-graph',
};

function SectionHeading({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: '0.75rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        margin: 0,
        marginBottom: 'var(--spacing-md)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {icon && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22,
            height: 22,
            borderRadius: 6,
            background: 'rgba(22, 163, 74, 0.08)',
            color: 'var(--accent-primary)',
          }}
        >
          {icon}
        </span>
      )}
      <span>{children}</span>
    </h2>
  );
}

// Thin link card that replaces the old embedded OutcomeFlywheelContent.
// Dedupe with /dashboard/outcome-flywheel (cron writes there; sidebar
// FlywheelChips already surface pending + Brier globally).
function OutcomeFlywheelLinkCard() {
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '18px 22px',
        borderLeft: '3px solid var(--accent-primary)',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: 1, minWidth: 220 }}>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: 2,
          }}
        >
          Flywheel · Standalone surface
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 2,
          }}
        >
          Outcome Flywheel — recalibrated DQI, Brier trend, lessons learned.
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Pending + Brier signals are always visible in the sidebar. The full timeline + per-audit
          recalibration lives on its own page.
        </div>
      </div>
      <a
        href="/dashboard/outcome-flywheel"
        className="btn btn-primary btn-sm flex items-center gap-2"
        style={{ whiteSpace: 'nowrap' }}
      >
        Open Outcome Flywheel
        <span aria-hidden>→</span>
      </a>
    </div>
  );
}

// Inline toggle card that merges the old Cognitive Audits and Behavioural
// Nudges sections into one surface. Shares the .tab-chips styling so it
// visually matches the Settings chip-bar.
function DecisionSignals() {
  const [signal, setSignal] = useState<'audits' | 'nudges'>('audits');
  return (
    <div>
      <div className="mb-md" style={{ display: 'inline-flex' }}>
        <div className="tab-chips">
          <button
            type="button"
            className="tab-chip"
            data-state={signal === 'audits' ? 'active' : undefined}
            onClick={() => setSignal('audits')}
          >
            <Activity size={13} /> Cognitive Audits
          </button>
          <button
            type="button"
            className="tab-chip"
            data-state={signal === 'nudges' ? 'active' : undefined}
            onClick={() => setSignal('nudges')}
          >
            <Lightbulb size={13} /> Behavioural Nudges
          </button>
        </div>
      </div>
      <Suspense
        fallback={
          <div className="card">
            <div className="card-body" style={{ height: 200 }}>
              <div className="skeleton" style={{ width: '100%', height: '100%' }} />
            </div>
          </div>
        }
      >
        {signal === 'audits' ? <AuditsPageContent /> : <NudgesPageContent />}
      </Suspense>
    </div>
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
          <CalibrationTrackerChip />
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
            className="container stack-xl"
            style={{ marginTop: 'var(--spacing-lg)', paddingBottom: 'var(--spacing-2xl)' }}
          >
            {view === 'performance' && (
              <>
                <section>
                  <SectionHeading icon={<TrendingUp size={13} />}>
                    Trends &amp; Quality
                  </SectionHeading>
                  <InsightsPageContent />
                </section>

                {/* Outcome Flywheel lives on its own page — the cron
                    writes there, the sidebar chip (FlywheelChips) surfaces
                    pending + Brier globally, and the standalone surface
                    has room for the full timeline / recalibration view.
                    We show a thin summary-card link here instead of
                    embedding the full content (2026-04-23 dedupe). */}
                <section>
                  <SectionHeading icon={<TrendingUp size={13} />}>Outcome Flywheel</SectionHeading>
                  <OutcomeFlywheelLinkCard />
                </section>

                <section>
                  <SectionHeading icon={<Activity size={13} />}>Decision Signals</SectionHeading>
                  <DecisionSignals />
                </section>

                <section>
                  <SectionHeading icon={<Gauge size={13} />}>Calibration</SectionHeading>
                  <CalibrationContent />
                </section>

                <section>
                  <SectionHeading icon={<FlaskConical size={13} />}>Experiments</SectionHeading>
                  <ExperimentsContent />
                </section>
              </>
            )}
            {view === 'intelligence' && (
              <>
                <section>
                  <SectionHeading icon={<BrainCircuit size={13} />}>
                    Decision Intelligence
                  </SectionHeading>
                  <DecisionIntelligenceContent />
                </section>

                <section>
                  <SectionHeading icon={<Lightbulb size={13} />}>Explainability</SectionHeading>
                  <ExplainabilityContent />
                </section>

                <section>
                  <SectionHeading icon={<BookOpen size={13} />}>Bias Library</SectionHeading>
                  <BiasLibraryContent />
                </section>
              </>
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
