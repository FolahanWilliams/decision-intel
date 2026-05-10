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
  BookOpen,
  Layers,
  Brain,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { TabBar } from '@/components/ui/TabBar';
import { EnhancedEmptyState } from '@/components/ui/EnhancedEmptyState';
import { useOnboardingRole } from '@/hooks/useOnboardingRole';
import { emptyStateCopy } from '@/lib/onboarding/role-empty-states';
import { useInsights } from '@/hooks/useInsights';
import { CalibrationTrackerChip } from '@/components/analytics/CalibrationTrackerChip';

// Lazy-load heavy visualization components — only the active tab's bundle is loaded
const InsightsPageContent = lazy(() =>
  import('@/components/insights/InsightsPageContent').then(m => ({
    default: m.InsightsPageContent,
  }))
);
// ExplainabilityContent removed 2026-05-10 streamlining batch.
// Was broken AND duplicated DqiBreakdownPanel (the per-audit clickable
// component-by-component breakdown shipped in the DQI explainability
// surface ship). Per-audit breakdown is the right surface for
// explainability — Analytics tab is the wrong altitude.
// DecisionIntelligenceContent removed 2026-05-10 streamlining batch.
// Its "Personal" view rendered DecisionDNAPageContent — already its own
// dedicated section above on this tab (duplicate). The unique team-view
// cards (BiasGenomeBenchmark + TopCounterfactualsCard) are mounted
// directly below as their own sections.
const TopCounterfactualsCard = lazy(() =>
  import('@/components/analytics/TopCounterfactualsCard').then(m => ({
    default: m.TopCounterfactualsCard,
  }))
);
const BiasGenomeBenchmark = lazy(() =>
  import('@/components/analytics/BiasGenomeBenchmark').then(m => ({
    default: m.BiasGenomeBenchmark,
  }))
);
const BiasLibraryContent = lazy(() =>
  import('@/components/insights/BiasLibraryContent').then(m => ({ default: m.BiasLibraryContent }))
);
const BiasGenomeContributionCard = lazy(() =>
  import('@/components/insights/BiasGenomeContributionCard').then(m => ({
    default: m.BiasGenomeContributionCard,
  }))
);
const StructuralExposureCard = lazy(() =>
  import('@/components/analysis/StructuralExposureCard').then(m => ({
    default: m.StructuralExposureCard,
  }))
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
// Outcome Flywheel folded into Intelligence tab 2026-05-10 streamlining
// batch — was previously a standalone /dashboard/outcome-flywheel route +
// thin link card on Performance + sidebar sub-nav entry. Per founder
// "incorporate elements into the intelligence page."
const OutcomeFlywheelContent = lazy(() =>
  import('@/components/outcome-flywheel/OutcomeFlywheelContent').then(m => ({
    default: m.OutcomeFlywheelContent,
  }))
);
// Phase B 2026-05-09 evening — Decision DNA folded from a standalone
// /dashboard/decision-dna route into Analytics → Intelligence as a
// section. The standalone route now 308-redirects to
// /dashboard/analytics?view=intelligence#dna.
const DecisionDNAPageContent = lazy(() =>
  import('@/components/dna/DecisionDNAPageContent').then(m => ({
    default: m.DecisionDNAPageContent,
  }))
);

// 2 tabs (locked 2026-05-10 streamlining batch). The standalone Decision
// Knowledge Graph at /dashboard/decision-graph is the canonical graph
// surface (richer data, full-screen viz, sidebar sub-nav entry); having
// it ALSO appear as an Analytics tab was duplicate navigation. Performance
// now also folds in Outcome Flywheel as a section (was a thin link card +
// duplicate sidebar sub-nav entry — same streamlining principle).
const TABS = [
  { key: 'performance', label: 'Performance', icon: <BarChart3 size={15} /> },
  { key: 'intelligence', label: 'Intelligence', icon: <BrainCircuit size={15} /> },
];

const VALID_VIEWS = new Set(['performance', 'intelligence']);

// Legacy keys (from the previous 7-tab taxonomy + DNA/fingerprint + the
// short-lived 3-tab taxonomy with a Graph tab) are remapped so Slack deep
// links, bookmarks, and older emails keep resolving to the right surface.
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
  // 2026-05-10 streamlining — Decision Graph tab killed; standalone route
  // is the canonical graph surface.
  graph: 'performance',
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
  const role = useOnboardingRole();
  const analyticsCopy = emptyStateCopy('analytics', role);
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
              router.replace(`/dashboard/analytics?view=${key}`, { scroll: false });
            }}
          />
        )}
      </div>
      {hasNoData ? (
        <div className="container" style={{ paddingTop: 'var(--spacing-xl)' }}>
          <EnhancedEmptyState
            type="insights"
            title={analyticsCopy.title}
            description={analyticsCopy.description}
            showBrief
            briefContext="analytics"
          />
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

                <section>
                  <SectionHeading icon={<Activity size={13} />}>Decision Signals</SectionHeading>
                  <DecisionSignals />
                </section>

                {/* Calibration moved here from a standalone section heading
                    + Experiments cut entirely 2026-05-10 streamlining batch.
                    CalibrationTrackerChip in the page header carries the
                    headline number; full surface lives below. */}
                <section>
                  <SectionHeading icon={<Activity size={13} />}>Calibration</SectionHeading>
                  <CalibrationContent />
                </section>
              </>
            )}
            {view === 'intelligence' && (
              <>
                {/* Decision DNA — your personal calibration. Folded from
                    the deleted /dashboard/decision-dna route into
                    Intelligence (Phase B 2026-05-09 evening). */}
                <section id="dna" style={{ scrollMarginTop: 80 }}>
                  <SectionHeading icon={<Brain size={13} />}>
                    Decision DNA · Personal Calibration
                  </SectionHeading>
                  <DecisionDNAPageContent />
                </section>

                {/* Outcome Flywheel — folded from the deleted standalone
                    /dashboard/outcome-flywheel route into Intelligence
                    2026-05-10 streamlining batch (founder ask:
                    "wouldn't it just be best to almost merge or
                    incorporate some elements from that into the
                    intelligence page?"). The flywheel IS decision
                    intelligence — which calls paid off, which didn't,
                    how detection accuracy improves. Same family as
                    Decision DNA (personal calibration) + Bias Genome
                    contribution (cross-org calibration). */}
                <section id="flywheel" style={{ scrollMarginTop: 80 }}>
                  <SectionHeading icon={<TrendingUp size={13} />}>Outcome Flywheel</SectionHeading>
                  <OutcomeFlywheelContent />
                </section>

                {/* Bias Genome contribution surfaces the cross-org data
                    network effect to the contributor. */}
                <section>
                  <SectionHeading icon={<Network size={13} />}>
                    Bias Genome · Your Contribution
                  </SectionHeading>
                  <BiasGenomeContributionCard />
                </section>

                <section>
                  <SectionHeading icon={<BrainCircuit size={13} />}>
                    Top Counterfactuals
                  </SectionHeading>
                  <TopCounterfactualsCard />
                </section>

                <section>
                  <SectionHeading icon={<BrainCircuit size={13} />}>
                    Bias Genome Benchmark
                  </SectionHeading>
                  <BiasGenomeBenchmark />
                </section>

                <section>
                  <SectionHeading icon={<Layers size={13} />}>
                    Structural Exposure (Dalio 18-determinants)
                  </SectionHeading>
                  <StructuralExposureCard />
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
