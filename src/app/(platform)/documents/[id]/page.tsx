/**
 * Document detail · v2 — McKinsey-grade refactor.
 *
 * Locked 2026-05-06 (commit 5b complete). Five opinionated tabs, PDF-
 * first split-pane, corner-gear settings drawer. Slots wire through
 * to the existing tab components (BoardroomTab / SimulatorTab /
 * RedTeamTab / SwotTab / ForgottenQuestionsTab / IntelligenceTab) +
 * the existing Perspectives components (LiveRedFlagsAlert /
 * LivePredictedQuestions / StructuralAssumptionsPanel / BoardReportView)
 * so behavior parity with v1 is preserved.
 *
 * Once route-swapped, this file becomes the live `/documents/[id]/page.tsx`.
 */

'use client';

import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  use,
  lazy,
  Suspense,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Share2, AlertTriangle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Skeleton } from '@/components/ui/skeleton';
import { ShareModal } from '@/components/ui/ShareModal';
import { useToast } from '@/components/ui/EnhancedToast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { createClientLogger } from '@/lib/utils/logger';
import type {
  BiasInstance,
  SwotAnalysisResult,
  CognitiveAnalysisResult,
  IntelligenceContextSummary,
  ComplianceResult,
} from '@/types';

import {
  DocumentDetailShell,
  type DocDetailTab,
} from '@/components/documents/detail/DocumentDetailShell';
import { SettingsDrawer } from '@/components/documents/detail/SettingsDrawer';
import {
  FindingsTab,
  ActionsTab,
  StressTestTab,
  PerspectivesTab,
  RegulatoryTab,
  type StressTestSlot,
  type RegulatoryTabFrameworkTrigger,
  type RegulatoryTabSovereignContext,
} from '@/components/documents/detail/tabs';
import { BIAS_EDUCATION } from '@/lib/constants/bias-education';
import { extractSynergyDefensibilityFromContent } from '@/lib/parsers/synergy-model-parser';
import { formatBiasNameCompact as formatBiasLabel } from '@/lib/utils/labels';
import { LiveRedFlagsAlert } from '@/components/analysis/LiveRedFlagsAlert';
import { LivePredictedQuestions } from '@/components/analysis/LivePredictedQuestions';
import { StructuralAssumptionsPanel } from '@/components/analysis/StructuralAssumptionsPanel';
import { CounterfactualPanel } from '@/components/ui/CounterfactualPanel';
import { RecommendationsPanel } from '@/components/ui/RecommendationsPanel';
import { InterventionPanel } from '@/components/ui/InterventionPanel';
import { LearningImpactCard } from '@/components/ui/LearningImpactCard';
import { DrRedTeamCard } from '@/components/analysis/DrRedTeamCard';
import { R2FDecompositionCard } from '@/components/documents/R2FDecompositionCard';
import { ReferenceClassChip } from '@/components/documents/ReferenceClassChip';
import { PaperApplicationsCard } from '@/components/analysis/PaperApplicationsCard';
import { RemediationChecklist } from '@/components/analysis/RemediationChecklist';
import { VerdictBand } from '@/components/documents/detail/VerdictBand';
import { AuditDeliverable } from '@/components/deliverable/AuditDeliverable';
import { ViewModeToggle, type InProductViewMode } from '@/components/deliverable/ViewModeToggle';
import { buildAuditDeliverable } from '@/lib/deliverable/buildAuditDeliverable';
import type { AnalysisResult } from '@/types';
import { SovereignContextStrip } from '@/components/documents/detail/SovereignContextStrip';
import { DecisionRoomList } from '@/components/ui/DecisionRoomCard';
import { VersionHistoryStrip } from '@/components/analysis/VersionHistoryStrip';
import { VersionDeltaCard } from '@/components/analysis/VersionDeltaCard';
import { OutcomeReporter } from './OutcomeReporter';
import { RegulatoryHorizonWidget } from './RegulatoryHorizonWidget';
import { InstitutionalMemoryWidget } from './InstitutionalMemoryWidget';
import type { Severity } from '@/components/documents/detail/primitives';
import { useOnboardingRole } from '@/hooks/useOnboardingRole';
import type { PerspectiveLens } from '@/components/documents/detail/tabs/PerspectivesTab';
import type { EmptyStateRole } from '@/lib/onboarding/role-empty-states';

// Per-role default Perspectives lens (R.3 lock 2026-05-08; persona audit
// finding from Richard archetype). M&A and PE/VC roles deliberate at the
// IC level — defaulting to CSO costs them one click per document load,
// 6 days/wk. Bizops users live in Analyst lens. CSOs default to CSO.
// Other / unknown / loading falls through to CSO (legacy default).
function defaultLensForRole(role: EmptyStateRole | null): PerspectiveLens {
  if (role === 'ma' || role === 'pe_vc') return 'ic';
  if (role === 'bizops') return 'analyst';
  return 'cso';
}

/* ---------------- Lazy-loaded heavy components ---------------- */

const BiasAnnotatedPDFViewer = lazy(() =>
  import('@/components/visualizations/BiasAnnotatedPDFViewer').then(m => ({
    default: m.BiasAnnotatedPDFViewer,
  }))
);
const BoardroomTab = lazy(() =>
  import('./tabs/BoardroomTab').then(m => ({ default: m.BoardroomTab }))
);
const SimulatorTab = lazy(() =>
  import('./tabs/SimulatorTab').then(m => ({ default: m.SimulatorTab }))
);
const RedTeamTab = lazy(() => import('./tabs/RedTeamTab').then(m => ({ default: m.RedTeamTab })));
const SwotTab = lazy(() => import('./tabs/SwotTab').then(m => ({ default: m.SwotTab })));
const ForgottenQuestionsTab = lazy(() =>
  import('./tabs/ForgottenQuestionsTab').then(m => ({ default: m.ForgottenQuestionsTab }))
);
const IntelligenceTab = lazy(() =>
  import('./tabs/IntelligenceTab').then(m => ({ default: m.IntelligenceTab }))
);
const BoardReportView = lazy(() =>
  import('./tabs/BoardReportView').then(m => ({ default: m.BoardReportView }))
);

const log = createClientLogger('DocumentDetailV2');

/* ---------------- Types ---------------- */

interface MarketContext {
  context: 'emerging_market' | 'developed_market' | 'cross_border' | 'unknown';
  emergingMarketCountries: string[];
  developedMarketCountries: string[];
  cagrCeiling: number;
  rationale: string;
}

interface Analysis {
  id: string;
  overallScore: number;
  noiseScore: number;
  summary: string;
  createdAt: string;
  biases: BiasInstance[];
  outcomeStatus?: string;
  outcomeDueAt?: string | null;
  outcome?: { occurredAt?: string | null } | null;
  recalibratedDqi?: unknown;
  swotAnalysis?: SwotAnalysisResult;
  cognitiveAnalysis?: CognitiveAnalysisResult;
  preMortem?: {
    failureScenarios: string[];
    preventiveMeasures: string[];
    inversion?: string[];
    redTeam?: Array<{
      objection: string;
      targetClaim: string;
      reasoning: string;
    }>;
  };
  simulation?: {
    overallVerdict: 'APPROVED' | 'REJECTED' | 'MIXED';
    twins: Array<{
      name: string;
      role: string;
      vote: 'APPROVE' | 'REJECT' | 'REVISE';
      confidence: number;
      rationale: string;
      keyRiskIdentified?: string;
      feedback?: string;
    }>;
  };
  intelligenceContext?: IntelligenceContextSummary;
  forgottenQuestions?: import('@/types').ForgottenQuestionsResult;
  compliance?: ComplianceResult;
  institutionalMemory?: import('@/types').InstitutionalMemoryResult;
  metaVerdict?: string;
  noiseStats?: { mean: number; stdDev: number; variance: number };
  factCheck?: {
    score: number;
    flags?: string[];
    verifications?: Array<{
      claim: string;
      verdict: string;
      explanation: string;
      sourceUrl?: string;
    }>;
  };
  logicalAnalysis?: {
    score: number;
    fallacies?: Array<{ name: string; severity: string; explanation: string }>;
  };
  previousAnalysisId?: string | null;
  marketContextApplied?: MarketContext;
  marketContextOverride?: MarketContext | null;
}

interface Document {
  id: string;
  filename: string;
  fileType?: string;
  content?: string;
  /** SHA-256 hash of the original document content. Surfaced in the
   *  VerdictBand monospace strip per DESIGN.md James persona ask
   *  (Item 1 lock 2026-05-07). May be null for legacy rows or rows where
   *  hashing failed at upload time. */
  contentHash?: string | null;
  uploadedAt: string;
  status: 'pending' | 'analyzing' | 'analyzed' | 'failed';
  isOwner?: boolean;
  isSample?: boolean;
  visibility?: string;
  analyses?: Analysis[];
  /// First DecisionContainer this doc belongs to (Phase 3 P3.4 — replaces
  /// legacy `deal` shape). A doc can sit in 0..n containers via the
  /// DecisionContainerDocument join; the API surfaces the most-recent
  /// container as the primary context. Null when the doc is standalone.
  container?: {
    id: string;
    name: string;
    kind: 'investment' | 'acquisition' | 'strategic';
    stageId: string;
    compositeDqi: number | null;
    compositeGrade: string | null;
    documentCount: number;
    analyzedDocCount: number;
    sector?: string | null;
    ticketSize?: number | null;
  } | null;
}

const TAB_KEYS: DocDetailTab[] = ['findings', 'actions', 'stress', 'perspectives', 'regulatory'];

/* ---------------- Page ---------------- */

export default function DocumentDetailV2Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // /demo → /onboarding/claim → /documents/[id]?claimed=true hand-off (#3
  // claim-flow fix 2026-05-26). The claim flow's terminal redirect lands
  // here with ?claimed=true; surface the success toast + strip the param
  // so a refresh doesn't re-fire. CLAUDE.md D9 lock (locked 2026-04-27)
  // specced this but it was never wired on the doc-detail side — the
  // toast was effectively missing for ~30 days. The exact same toast is
  // referenced in the audit memos and the chat-context history.
  useEffect(() => {
    if (searchParams.get('claimed') !== 'true') return;
    showToast('Audit claimed from your demo run', 'success');
    // Strip the param so a refresh / back-nav doesn't re-fire the toast.
    const url = new URL(window.location.href);
    url.searchParams.delete('claimed');
    router.replace(url.pathname + url.search, { scroll: false });
    // Intentionally NOT depending on showToast/router — both are stable
    // refs from next/navigation hooks; including them just re-fires the
    // effect after the replace, creating an infinite loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DocDetailTab>('findings');
  // View mode — Executive (deliverable) default, Analyst preserves the
  // legacy tabbed layout. Locked 2026-05-20 from the Deep Research
  // synthesis (cross-context format calibration). Persisted in
  // localStorage so the user's choice survives navigation.
  const [viewMode, setViewMode] = useState<InProductViewMode>(() => {
    if (typeof window === 'undefined') return 'executive';
    const stored = window.localStorage.getItem('di-doc-view-mode-v2');
    return stored === 'analyst' ? 'analyst' : 'executive';
  });
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('di-doc-view-mode-v2', viewMode);
    }
  }, [viewMode]);
  const [activeBiasId, setActiveBiasId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  // Cross-doc conflict count for the VerdictBand chip (Item 1 lock
  // 2026-05-07). Only fetched when the document is part of a deal —
  // pulls the deal's most-recent cross-reference run via
  // /api/deals/[id] which already returns deal.crossReference shape.
  const [dealConflictCount, setDealConflictCount] = useState<number | null>(null);
  const [dealHighSeverityCount, setDealHighSeverityCount] = useState<number | null>(null);

  // Onboarding role drives per-role default Perspectives lens (R.3 lock
  // 2026-05-08). Hook is one-shot module-cached, so multiple consumers
  // on the same page don't fan out independent fetches.
  const onboardingRole = useOnboardingRole();
  const initialLens = defaultLensForRole(onboardingRole);

  /* ───── data fetch ───── */
  const refetch = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents/${resolvedParams.id}`);
      if (!res.ok) {
        // Body parse on non-2xx so we can surface the API's error message.
        const body = await res.json().catch(() => null);
        const msg = body && typeof body.error === 'string' ? body.error : null;
        throw new Error(msg || `Could not load document (HTTP ${res.status})`);
      }
      const data = await res.json();
      setDocument(data);
    } catch (err) {
      log.warn('refetch failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load document');
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  /* ───── container cross-ref fetch (when doc is part of a container) ──── */
  const containerId = document?.container?.id ?? null;
  useEffect(() => {
    if (!containerId) {
      setDealConflictCount(null);
      setDealHighSeverityCount(null);
      return;
    }
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch(`/api/containers/${containerId}`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          crossRefConflictCount?: number;
          crossRefHighSeverityCount?: number;
        };
        if (cancelled) return;
        setDealConflictCount(
          typeof data.crossRefConflictCount === 'number' ? data.crossRefConflictCount : null
        );
        setDealHighSeverityCount(
          typeof data.crossRefHighSeverityCount === 'number' ? data.crossRefHighSeverityCount : null
        );
      } catch (err) {
        if (!cancelled) {
          // Non-load-bearing on the doc page — verdict band hides the
          // conflict chip silently when the fetch fails. Logged for
          // diagnostics but never surfaces an error toast.
          log.warn('deal cross-ref fetch failed:', err);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [containerId]);

  /* ───── derived ───── */
  const analysis = document?.analyses?.[0] ?? null;
  // Wrap in useMemo so the `[]` fallback is stable across renders —
  // raw `analysis?.biases ?? []` produced a fresh array on every
  // render, which made downstream useMemo deps recompute every render
  // (react-hooks/exhaustive-deps warned about this). The memo only
  // recomputes when analysis.biases actually changes.
  const biases = useMemo(() => analysis?.biases ?? [], [analysis?.biases]);

  const taxonomyIdByType = useMemo(() => {
    const m: Record<string, string> = {};
    for (const [key, entry] of Object.entries(BIAS_EDUCATION)) {
      if (entry?.taxonomyId) m[key] = entry.taxonomyId;
    }
    return m;
  }, []);

  const lifecycleStage = useMemo(() => {
    if (!analysis) return 'audited' as const;
    const status = analysis.outcomeStatus;
    if (status === 'outcome_logged' && analysis.recalibratedDqi) return 'calibrated' as const;
    if (status === 'outcome_logged') return 'outcome' as const;
    return 'audited' as const;
  }, [analysis]);

  const marketContext: MarketContext | null =
    analysis?.marketContextOverride ?? analysis?.marketContextApplied ?? null;

  /* ───── R²F per-document map ───── */
  const r2fProtected = useMemo(() => deriveProtectedItems(biases), [biases]);
  const r2fSuppressed = useMemo(
    () => deriveSuppressedItems(biases, taxonomyIdByType),
    [biases, taxonomyIdByType]
  );

  /* ───── Synergy defensibility (synergy_model uploads only) ─────
     Cascade-depth audit ship #2 lock 2026-05-09 evening. Pure regex over
     the inline STRUCTURED SYNERGY MODEL block in document.content (no
     extra round-trip; the data the parser persisted at upload time is
     already in scope). Memo'd off content so we don't re-parse on
     unrelated re-renders. Returns null for non-synergy uploads. */
  const synergyDefensibility = useMemo(() => {
    if (!document?.content) return null;
    return extractSynergyDefensibilityFromContent(document.content);
  }, [document?.content]);

  /* ───── linked PDF ↔ findings event bus ───── */
  const handleBiasClick = useCallback((bias: BiasInstance) => {
    setActiveBiasId(prev => (prev === bias.id ? null : bias.id));
  }, []);

  /* ───── tab switching from URL ───── */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('tab');
    if (t && TAB_KEYS.includes(t as DocDetailTab)) {
      setActiveTab(t as DocDetailTab);
    }
  }, []);
  const handleTabChange = useCallback((next: DocDetailTab) => {
    setActiveTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', next);
    window.history.replaceState({}, '', url.toString());
  }, []);

  /* ───── Regulatory triggers (from analysis.compliance) ───── */
  const regulatoryTriggers = useMemo(
    () => deriveRegulatoryTriggers(analysis?.compliance),
    [analysis?.compliance]
  );
  const sovereignContexts = useMemo(() => deriveSovereignContexts(marketContext), [marketContext]);

  /* ───── states ───── */
  if (loading) return <LoadingState />;
  if (error || !document) return <ErrorState error={error} />;

  const filename = document.filename;
  const dqiScore = analysis?.overallScore ?? null;
  const classification = document.isSample ? ('sample' as const) : ('confidential' as const);

  /* ───── left pane ───── */
  const isPdf = document.fileType === 'application/pdf' || filename?.toLowerCase().endsWith('.pdf');

  const leftPane = isPdf ? (
    <Suspense fallback={<PaneFallback label="Loading PDF…" />}>
      <BiasAnnotatedPDFViewer
        documentId={document.id}
        biases={biases}
        onBiasSelect={handleBiasClick}
        controlledActiveBiasId={activeBiasId}
        hideSidebar
      />
    </Suspense>
  ) : (
    <ExtractedTextFallback content={document.content} />
  );

  /* ───── stress slots ───── */
  const stressSlots: StressTestSlot[] = analysis
    ? [
        {
          id: 'boardroom',
          available: !!analysis.simulation,
          badge: analysis.simulation?.twins?.length,
          content: (
            <Suspense fallback={<PaneFallback label="Loading boardroom…" />}>
              <ErrorBoundary sectionName="Boardroom">
                <BoardroomTab simulation={analysis.simulation} />
              </ErrorBoundary>
            </Suspense>
          ),
        },
        {
          id: 'whatif',
          available: !!document.content,
          content: (
            <Suspense fallback={<PaneFallback label="Loading what-if…" />}>
              <ErrorBoundary sectionName="What-if simulator">
                <SimulatorTab
                  documentContent={document.content || ''}
                  documentId={document.id}
                  originalScore={analysis.overallScore}
                  originalNoiseScore={analysis.noiseScore}
                  originalBiasCount={biases.length}
                  originalBiasTypes={biases.map(b => b.biasType)}
                />
              </ErrorBoundary>
            </Suspense>
          ),
        },
        {
          id: 'redteam',
          available: !!(analysis.cognitiveAnalysis || analysis.preMortem),
          content: (
            <Suspense fallback={<PaneFallback label="Loading red team…" />}>
              <ErrorBoundary sectionName="Red team">
                <RedTeamTab
                  analysisId={analysis.id}
                  cognitiveAnalysis={analysis.cognitiveAnalysis}
                  preMortem={analysis.preMortem}
                />
              </ErrorBoundary>
            </Suspense>
          ),
        },
        {
          id: 'swot',
          available: !!analysis.swotAnalysis,
          content: (
            <Suspense fallback={<PaneFallback label="Loading SWOT…" />}>
              <ErrorBoundary sectionName="SWOT">
                <SwotTab swotAnalysis={analysis.swotAnalysis} />
              </ErrorBoundary>
            </Suspense>
          ),
        },
        {
          id: 'forgotten',
          available: !!analysis.forgottenQuestions?.questions?.length,
          badge: analysis.forgottenQuestions?.questions?.length,
          content: (
            <Suspense fallback={<PaneFallback label="Loading forgotten questions…" />}>
              <ErrorBoundary sectionName="Forgotten Questions">
                <ForgottenQuestionsTab
                  forgottenQuestions={analysis.forgottenQuestions}
                  analysisId={analysis.id}
                />
              </ErrorBoundary>
            </Suspense>
          ),
        },
        {
          id: 'intelligence',
          available: !!analysis.intelligenceContext,
          content: (
            <Suspense fallback={<PaneFallback label="Loading intelligence…" />}>
              <ErrorBoundary sectionName="Intelligence">
                <IntelligenceTab intelligenceContext={analysis.intelligenceContext} />
              </ErrorBoundary>
            </Suspense>
          ),
        },
      ]
    : EMPTY_STRESS_SLOTS;

  /* ───── tab body ───── */
  const tabBody = (() => {
    switch (activeTab) {
      case 'findings':
        return (
          <div style={{ display: 'grid', gap: 16 }}>
            <FindingsTab
              biases={biases}
              r2fProtected={r2fProtected}
              r2fSuppressed={r2fSuppressed}
              r2fSummary="Mapped from your memo's flagged passages and structural assumptions."
              synergyDefensibility={synergyDefensibility}
              activeBiasId={activeBiasId}
              onBiasClick={handleBiasClick}
              taxonomyIdByType={taxonomyIdByType}
            />

            {/* Reference-class match chip + R²F decomposition card —
               kept on the Findings tab AFTER the bias catalogue per
               DESIGN.md universal point #9 (R²F branding demoted on the
               live page; the IP-moat surface stays accessible but no
               longer above-fold). The above-fold above-tabs cluster
               carries Verdict Band + Top-3 Fix Tiles + R²F Signal Strip
               (plain-language eyebrows). */}
            {analysis && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <ReferenceClassChip biasTypes={biases.map(b => b.biasType)} />
              </div>
            )}

            {analysis && (
              <ErrorBoundary sectionName="R²F decomposition">
                <R2FDecompositionCard
                  overallScore={analysis.overallScore}
                  noiseScore={analysis.noiseScore}
                  biasCount={biases.length}
                />
              </ErrorBoundary>
            )}
          </div>
        );
      case 'actions':
        return (
          <div style={{ display: 'grid', gap: 16 }}>
            {/* Featured counterfactual — the "what would change" card with
               ROI math. The single strongest action surface; drives
               procurement-stage conversations. */}
            {analysis && (
              <ErrorBoundary sectionName="Featured counterfactual">
                <CounterfactualPanel analysisId={analysis.id} variant="featured" />
              </ErrorBoundary>
            )}

            <ActionsTab
              biases={biases}
              lifecycleStage={lifecycleStage}
              auditedAt={analysis?.createdAt}
              outcomeAt={analysis?.outcome?.occurredAt}
              outcomeDueAt={analysis?.outcomeDueAt}
              taxonomyIdByType={taxonomyIdByType}
              onBiasClick={handleBiasClick}
              outcomeReporterSlot={
                analysis ? (
                  <ErrorBoundary sectionName="Outcome reporter">
                    <div data-outcome-reporter>
                      <OutcomeReporter
                        analysisId={analysis.id}
                        analysisDate={analysis.createdAt}
                        biases={biases}
                      />
                    </div>
                  </ErrorBoundary>
                ) : undefined
              }
            />

            {/* Graph-powered recommendations — surfaced from the Decision
               Knowledge Graph (cross-org pattern matching). */}
            {analysis && (
              <ErrorBoundary sectionName="Recommendations">
                <RecommendationsPanel analysisId={analysis.id} />
              </ErrorBoundary>
            )}

            {/* Bias-targeted intervention plays — concrete actions per
               flagged bias, sourced from the playbook library. */}
            {analysis && biases.length > 0 && (
              <ErrorBoundary sectionName="Interventions">
                <InterventionPanel analysisId={analysis.id} biases={biases} />
              </ErrorBoundary>
            )}

            {/* Learning-impact card — what this audit contributes to the
               compounding flywheel (per-org calibration delta). */}
            {analysis && (
              <ErrorBoundary sectionName="Learning impact">
                <LearningImpactCard analysisId={analysis.id} />
              </ErrorBoundary>
            )}

            {/* Adversarial pre-mortem (Dr Red Team) — additional red-team
               angle complementing the Stress test → Red team sub-tab. */}
            {analysis && (
              <ErrorBoundary sectionName="Dr Red Team">
                <DrRedTeamCard analysisId={analysis.id} />
              </ErrorBoundary>
            )}
          </div>
        );
      case 'stress':
        return (
          <div style={{ display: 'grid', gap: 16 }}>
            {document?.container?.id ? (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                  fontSize: 12.5,
                  color: 'var(--text-secondary)',
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                  }}
                >
                  {document.container.kind}
                </span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {document.container.name}
                </span>
                {document.container.compositeDqi != null && (
                  <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-muted)' }}>
                    · DQI {Math.round(document.container.compositeDqi)}
                  </span>
                )}
                <a
                  href={`/dashboard/decisions/${document.container.id}`}
                  style={{ color: 'var(--accent-primary)', fontSize: 11, fontWeight: 600 }}
                >
                  View decision →
                </a>
              </div>
            ) : null}
            <StressTestTab slots={stressSlots} />
          </div>
        );
      case 'perspectives':
        return (
          <PerspectivesTab
            initialLens={initialLens}
            csoSlot={
              analysis ? (
                <CsoLensView
                  biases={biases}
                  summary={analysis.summary}
                  onSelectBias={handleBiasClick}
                />
              ) : (
                <PaneFallback label="Awaiting analysis" />
              )
            }
            icSlot={
              analysis ? (
                <IcLensView analysis={analysis} biases={biases} marketContext={marketContext} />
              ) : (
                <PaneFallback label="Awaiting analysis" />
              )
            }
            boardSlot={
              analysis && document ? (
                <Suspense fallback={<PaneFallback label="Loading board view…" />}>
                  <ErrorBoundary sectionName="Board view">
                    <BoardReportView
                      title={document.filename}
                      overallScore={analysis.overallScore}
                      summary={analysis.summary}
                      biases={biases}
                      simulation={analysis.simulation}
                      onExportPdf={() => Promise.resolve(setShowShareModal(true))}
                    />
                  </ErrorBoundary>
                </Suspense>
              ) : (
                <PaneFallback label="Awaiting analysis" />
              )
            }
            analystSlot={
              <AnalystLensView
                biases={biases}
                taxonomyIdByType={taxonomyIdByType}
                onBiasClick={handleBiasClick}
                activeBiasId={activeBiasId}
              />
            }
          />
        );
      case 'regulatory':
        return (
          <div style={{ display: 'grid', gap: 16 }}>
            <RegulatoryTab triggers={regulatoryTriggers} sovereignContexts={sovereignContexts} />
            {/* Regulatory Horizon — calendared regulatory tailwinds (EU AI
               Act, Basel III, SEC AI disclosure, GDPR Art 22, etc.) with
               enforcement dates. Procurement reviewers ask "when does
               this apply to us?" — this is the answer. */}
            {analysis?.compliance && (
              <ErrorBoundary sectionName="Regulatory horizon">
                <RegulatoryHorizonWidget compliance={analysis.compliance} />
              </ErrorBoundary>
            )}
            {/* Institutional Memory — past audits in the org with similar
               regulatory triggers. The "have we seen this before?"
               surface that compounds with every closed audit. */}
            {analysis?.institutionalMemory && (
              <ErrorBoundary sectionName="Institutional memory">
                <InstitutionalMemoryWidget memory={analysis.institutionalMemory} />
              </ErrorBoundary>
            )}
          </div>
        );
      default:
        return null;
    }
  })();

  // Top-of-page strip: version history (when this audit is part of a
  // version chain) + version-delta card (when this audit has a previous
  // version, surfaces the score change side-by-side). Both auto-hide
  // when not applicable.
  const topStrip = (
    <>
      {document && (
        <ErrorBoundary sectionName="Version history">
          <VersionHistoryStrip documentId={document.id} isOwner={!!document.isOwner} />
        </ErrorBoundary>
      )}
      {analysis?.previousAnalysisId && (
        <ErrorBoundary sectionName="Version delta">
          <VersionDeltaCard
            current={{
              id: analysis.id,
              overallScore: analysis.overallScore,
              noiseScore: analysis.noiseScore,
              biases: biases,
            }}
            previousAnalysisId={analysis.previousAnalysisId}
          />
        </ErrorBoundary>
      )}
    </>
  );

  /* AuditDeliverable composition — Executive view replaces the tabbed
     Analyst layout when viewMode === 'executive'. Same underlying
     AnalysisResult feeds both views (deliverable = composed MECE
     buckets + action titles; analyst = the legacy 5-tab structure).
     Per the 2026-05-20 universal-deliverable lock. */
  const executiveDeliverable =
    analysis && viewMode === 'executive'
      ? buildAuditDeliverable(analysis as unknown as AnalysisResult, {
          documentId: document.id,
          analysisId: analysis.id,
        })
      : null;

  const viewModeToggleEl = analysis ? (
    <ViewModeToggle value={viewMode} onChange={setViewMode} />
  ) : null;

  return (
    <>
      <DocumentDetailShell
        filename={filename}
        dqiScore={dqiScore}
        classification={classification}
        primaryAction={
          analysis
            ? {
                label: 'Forward to committee',
                onClick: () => setShowShareModal(true),
              }
            : undefined
        }
        activeTab={activeTab}
        onTabChange={handleTabChange}
        activeBiasId={activeBiasId}
        leftPane={leftPane}
        viewModeToggle={viewModeToggleEl}
        hideTabBar={viewMode === 'executive'}
        rightPaneContent={
          executiveDeliverable ? (
            <ErrorBoundary sectionName="Executive deliverable">
              <AuditDeliverable
                deliverable={executiveDeliverable}
                mode="executive"
                analysisId={analysis?.id}
              />
            </ErrorBoundary>
          ) : (
            tabBody
          )
        }
        rightPaneAboveTabs={
          analysis && viewMode === 'analyst' ? (
            /* Persona-validated above-fold cluster (DESIGN.md universal
               points #1, #2, #9 + Item 1 lock 2026-05-07).
               Executive mode swaps this entire cluster for the
               AuditDeliverable cover + 5 MECE buckets. Analyst mode
               preserves the legacy layout verbatim. */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <ErrorBoundary sectionName="Verdict band">
                <VerdictBand
                  overallScore={analysis.overallScore}
                  metaVerdict={analysis.metaVerdict ?? null}
                  contentHash={document.contentHash ?? null}
                  crossDocConflictCount={dealConflictCount}
                  crossDocHighSeverityCount={dealHighSeverityCount}
                  conflictHref={
                    document.container?.id ? `/dashboard/decisions/${document.container.id}` : null
                  }
                  auditedAt={analysis.createdAt}
                  documentId={document.id}
                  uploadedAt={document.uploadedAt ?? null}
                  analysisId={analysis.id}
                />
              </ErrorBoundary>
              {biases.length > 0 && (
                <ErrorBoundary sectionName="Remediation roadmap">
                  <RemediationChecklist biases={biases} documentId={document.id} />
                </ErrorBoundary>
              )}
              <ErrorBoundary sectionName="Sovereign context">
                <SovereignContextStrip
                  marketContext={marketContext}
                  overridden={!!analysis.marketContextOverride}
                />
              </ErrorBoundary>
              <ErrorBoundary sectionName="Paper applications">
                <PaperApplicationsCard analysisId={analysis.id} />
              </ErrorBoundary>
            </div>
          ) : null
        }
        hasPreview
        onOpenSettings={() => setShowSettings(true)}
        outcomeStrip={topStrip}
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Documents', href: '/dashboard?view=browse' },
              { label: filename },
            ]}
          />
        }
      />

      {/* Decision rooms — collaborative pre-IC review surface attached
         to this document. Lives BELOW the tabbed workspace so the daily
         flow (audit → fix → log outcome) isn't gated by team activity. */}
      {analysis && document && (
        <div style={{ padding: '0 24px 32px', maxWidth: 1600, margin: '0 auto' }}>
          <ErrorBoundary sectionName="Decision rooms">
            <DecisionRoomList documentId={document.id} analysisId={analysis.id} />
          </ErrorBoundary>
        </div>
      )}

      <SettingsDrawer
        open={showSettings}
        onClose={() => setShowSettings(false)}
        methodologySlot={
          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            DQI methodology v2.1.0 · 6 weighted components · noise jury (3 frames ×{' '}
            {analysis?.noiseScore != null ? Math.round(analysis.noiseScore) : '—'} mean) ·
            validity-aware weight shift per Kahneman & Klein 2009.
          </div>
        }
        reproducibilitySlot={
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              fontFamily: 'ui-monospace, monospace',
              lineHeight: 1.6,
            }}
          >
            <div>analysis_id: {analysis?.id ?? '—'}</div>
            <div>document_id: {document.id}</div>
            <div>methodology: v2.1.0</div>
          </div>
        }
        sharingSlot={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setShowSettings(false);
              setShowShareModal(true);
            }}
          >
            <Share2 size={13} /> Open share modal
          </button>
        }
        blindPriorSlot={
          <div style={{ display: 'grid', gap: 10 }}>
            <p
              style={{
                margin: 0,
                fontSize: 12.5,
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
              }}
            >
              Blind priors anchor independent probability estimates from decision-room participants{' '}
              <em>before</em> audit results are revealed — reducing anchoring bias and surfacing
              genuine disagreement.
            </p>
            {analysis?.id ? (
              <a
                href={`/dashboard/decision-rooms?doc=${document.id}`}
                className="btn btn-secondary"
                style={{ alignSelf: 'flex-start' }}
              >
                Open decision rooms →
              </a>
            ) : (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Run analysis first to enable blind prior collection.
              </span>
            )}
          </div>
        }
        dangerSlot={
          <DeleteDocumentButton
            documentId={document.id}
            onDeleted={() => {
              showToast('Document deleted', 'success');
              window.location.href = '/dashboard?view=browse';
            }}
          />
        }
      />

      {showShareModal && analysis && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          analysisId={analysis.id}
          documentName={document.filename}
          analysisData={{ score: analysis.overallScore, biases: analysis.biases }}
          onExportPdf={() => handleExportPdf(document, analysis, showToast)}
          onExportProvenanceRecord={async () => {
            // The flagship procurement artifact — hashed + tamper-evident DPR.
            // The server endpoint gates by plan + audit-logs the export itself;
            // it renders via headless Chromium. Opened synchronously to stay
            // inside the click gesture (avoids pop-up blocking).
            window.open(
              `/api/documents/${document.id}/provenance-record?format=pdf`,
              '_blank',
              'noopener,noreferrer'
            );
          }}
          onExportCsv={() => handleExportCsv(document, analysis, showToast)}
          onExportMarkdown={() => handleExportMarkdown(document, analysis, biases)}
          onExportJson={() => handleExportJson(document, analysis, biases)}
        />
      )}
    </>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*                  Lens Views                                    */
/* ────────────────────────────────────────────────────────────── */

function CsoLensView({
  biases,
  summary,
  onSelectBias,
}: {
  biases: BiasInstance[];
  summary: string;
  onSelectBias?: (bias: BiasInstance) => void;
}) {
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <ErrorBoundary sectionName="CSO red flags">
        <LiveRedFlagsAlert biases={biases} onSelect={onSelectBias} />
      </ErrorBoundary>
      <ErrorBoundary sectionName="Predicted committee questions">
        <LivePredictedQuestions
          biases={biases}
          summary={summary}
          topRecommendation={biases[0]?.suggestion}
        />
      </ErrorBoundary>
    </div>
  );
}

function IcLensView({
  analysis,
  biases,
  marketContext,
}: {
  analysis: Analysis;
  biases: BiasInstance[];
  marketContext: MarketContext | null;
}) {
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <ErrorBoundary sectionName="IC predicted questions">
        <LivePredictedQuestions
          biases={biases}
          summary={analysis.summary}
          topRecommendation={biases[0]?.suggestion}
        />
      </ErrorBoundary>
      <ErrorBoundary sectionName="IC structural assumptions">
        <StructuralAssumptionsPanel
          analysisId={analysis.id}
          autoRun
          marketContext={
            marketContext
              ? {
                  context: marketContext.context,
                  cagrCeiling: marketContext.cagrCeiling,
                  overridden: !!analysis.marketContextOverride,
                }
              : undefined
          }
        />
      </ErrorBoundary>
    </div>
  );
}

function AnalystLensView({
  biases,
  taxonomyIdByType,
  onBiasClick,
  activeBiasId,
}: {
  biases: BiasInstance[];
  taxonomyIdByType: Record<string, string>;
  onBiasClick?: (bias: BiasInstance) => void;
  activeBiasId?: string | null;
}) {
  // Analyst lens = the full Findings catalogue, dense view. We re-use
  // the FindingsTab body without the R²F pillar since that's already
  // visible on the dedicated Findings tab.
  return (
    <FindingsTab
      biases={biases}
      r2fProtected={[]}
      r2fSuppressed={[]}
      activeBiasId={activeBiasId}
      onBiasClick={onBiasClick}
      taxonomyIdByType={taxonomyIdByType}
    />
  );
}

/* ────────────────────────────────────────────────────────────── */
/*                  Helper components                             */
/* ────────────────────────────────────────────────────────────── */

/* Layout-matched skeleton (DESIGN.md loading-state pattern: skeleton, never
   a bare string — same shape as the final two-pane shell so nothing reflows
   when the audit lands). */
function LoadingState() {
  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', padding: 24 }} aria-busy="true">
      <Skeleton className="h-4 w-[240px]" style={{ marginBottom: 20 }} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20,
        }}
      >
        {/* Left pane — document preview */}
        <Skeleton style={{ height: 'min(68vh, 640px)', borderRadius: 'var(--radius-xl)' }} />
        {/* Right pane — verdict band + top-3 fix tiles + tab bar + panel */}
        <div className="stack-md">
          <Skeleton style={{ height: 96, borderRadius: 'var(--radius-xl)' }} />
          <div className="stack-sm">
            <Skeleton style={{ height: 60, borderRadius: 'var(--radius-lg)' }} />
            <Skeleton style={{ height: 60, borderRadius: 'var(--radius-lg)' }} />
            <Skeleton style={{ height: 60, borderRadius: 'var(--radius-lg)' }} />
          </div>
          <div className="flex gap-sm">
            {[...Array(5)].map((_, i) => (
              <Skeleton
                key={i}
                className="h-8 w-[88px]"
                style={{ borderRadius: 'var(--radius-full)' }}
              />
            ))}
          </div>
          <Skeleton style={{ height: 240, borderRadius: 'var(--radius-xl)' }} />
        </div>
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: string | null }) {
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 12,
        padding: 24,
        textAlign: 'center',
      }}
    >
      <AlertTriangle size={32} style={{ color: 'var(--severity-high)' }} />
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
        {error ?? 'Document not found'}
      </div>
      <Link
        href="/dashboard"
        style={{
          fontSize: 12,
          color: 'var(--accent-primary)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <ArrowLeft size={12} /> Back to dashboard
      </Link>
    </div>
  );
}

/* Tab-pane suspense fallback — generic content-shaped skeleton (heading +
   three text rows + a panel block) instead of the prior static icon+string. */
function PaneFallback({ label }: { label: string }) {
  return (
    <div className="stack-sm" style={{ padding: 24 }} aria-busy="true" aria-label={label}>
      <Skeleton className="h-4 w-[38%]" />
      <Skeleton className="h-3.5 w-[92%]" />
      <Skeleton className="h-3.5 w-[78%]" />
      <Skeleton className="h-3.5 w-[85%]" />
      <Skeleton style={{ height: 120, borderRadius: 'var(--radius-lg)', marginTop: 8 }} />
    </div>
  );
}

function ExtractedTextFallback({ content }: { content?: string }) {
  if (!content) {
    return (
      <div
        style={{
          flex: 1,
          padding: 32,
          overflowY: 'auto',
          background: 'var(--bg-tertiary)',
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            marginBottom: 16,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          Source preview · audit basis
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Inline preview is not yet wired for non-PDF document types. The audit on the right runs
          against the extracted text the pipeline indexed at upload time.
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        flex: 1,
        padding: 24,
        overflowY: 'auto',
        background: 'var(--bg-tertiary)',
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          marginBottom: 12,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          fontWeight: 700,
        }}
      >
        Extracted text
      </div>
      <pre
        style={{
          margin: 0,
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSize: 13,
          color: 'var(--text-primary)',
          lineHeight: 1.65,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {content.slice(0, 18000)}
        {content.length > 18000 ? '\n\n[...truncated for preview]' : ''}
      </pre>
    </div>
  );
}

function DeleteDocumentButton({
  documentId,
  onDeleted,
}: {
  documentId: string;
  onDeleted: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}`, { method: 'DELETE' });
      if (res.ok) onDeleted();
      else {
        log.warn('delete failed:', res.status);
        setLoading(false);
        setConfirming(false);
      }
    } catch (err) {
      log.warn('delete error:', err);
      setLoading(false);
    }
  };

  if (!confirming) {
    return (
      <button type="button" className="btn btn-danger-outline" onClick={() => setConfirming(true)}>
        Delete document
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        type="button"
        className="btn btn-danger"
        onClick={handleDelete}
        disabled={loading}
        style={{ flex: 1 }}
      >
        {loading ? 'Deleting…' : 'Confirm delete'}
      </button>
      <button type="button" className="btn btn-secondary" onClick={() => setConfirming(false)}>
        Cancel
      </button>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*                  Derivation helpers                            */
/* ────────────────────────────────────────────────────────────── */

const EMPTY_STRESS_SLOTS: StressTestSlot[] = (
  ['boardroom', 'whatif', 'redteam', 'swot', 'forgotten', 'intelligence'] as const
).map(id => ({
  id,
  available: false,
  content: <PaneFallback label={`No ${id} data`} />,
})) as StressTestSlot[];

function deriveProtectedItems(biases: BiasInstance[]) {
  const hasHighSeverity = biases.some(b =>
    ['critical', 'high'].includes(b.severity?.toLowerCase() ?? '')
  );
  if (hasHighSeverity || biases.length === 0) return [];
  return [
    {
      label: 'Reasoning baseline',
      rationale:
        'No critical or high-severity biases caught on this audit — the memo cleared the validity threshold.',
    },
  ];
}

function deriveSuppressedItems(biases: BiasInstance[], taxonomyIdByType: Record<string, string>) {
  const order = ['critical', 'high', 'medium', 'low'];
  const top = [...biases]
    .sort((a, b) => {
      const sa = order.indexOf(a.severity?.toLowerCase() ?? '');
      const sb = order.indexOf(b.severity?.toLowerCase() ?? '');
      return sa - sb;
    })
    .slice(0, 3);
  return top.map(b => ({
    biasLabel: formatBiasLabel(b.biasType),
    taxonomyId: taxonomyIdByType[b.biasType],
    severity: (b.severity?.toLowerCase() ?? 'low') as Severity,
    quote: b.excerpt,
    rationale: b.explanation || 'System-1 leak detected against base-rate evidence.',
  }));
}

function deriveRegulatoryTriggers(
  compliance: ComplianceResult | undefined
): RegulatoryTabFrameworkTrigger[] {
  if (!compliance) return [];
  const triggers: RegulatoryTabFrameworkTrigger[] = [];
  // ComplianceResult shape: per-framework keys with severity bands.
  // We pull the triggered frameworks by inspecting the assessments array
  // when present, falling back to known top-level severity flags.
  const c = compliance as unknown as Record<string, unknown>;
  const assessments = Array.isArray(c.assessments) ? (c.assessments as unknown[]) : [];
  for (const a of assessments) {
    if (typeof a !== 'object' || a === null) continue;
    const row = a as Record<string, unknown>;
    const framework = row.framework as { id?: string } | undefined;
    if (!framework?.id) continue;
    const triggeredProvisions = Array.isArray(row.triggeredProvisions)
      ? row.triggeredProvisions
      : [];
    if (triggeredProvisions.length === 0) continue;
    const sev = (row.overallRiskLevel as string | undefined)?.toLowerCase() as Severity;
    triggers.push({
      frameworkId: framework.id,
      triggeredBy: [],
      severity: ['critical', 'high', 'medium', 'low'].includes(sev) ? sev : 'medium',
      provisionCount: triggeredProvisions.length,
    });
  }
  return triggers;
}

function deriveSovereignContexts(
  marketContext: MarketContext | null
): RegulatoryTabSovereignContext[] {
  if (!marketContext || !marketContext.emergingMarketCountries?.length) return [];
  const NOTES: Record<string, string> = {
    nigeria: 'Naira free-float + CBN I&E window — FX exposure material',
    kenya: 'KES managed float — sovereign-cycle risk on cross-border ticket',
    ghana: 'Cedi + IMF cycle — currency and policy alignment open',
    waemu: 'CFA-zone peg — peg risk negligible; trade-routing risk material',
    'south africa': 'ZAR + SARB — model-risk attestation expected',
    egypt: 'EGP post-devaluation — exchange-rate band volatility',
  };
  return marketContext.emergingMarketCountries.slice(0, 3).map(c => ({
    jurisdiction: c.toUpperCase(),
    note: NOTES[c.toLowerCase()] ?? 'Emerging-market sovereign cycle exposure flagged.',
  }));
}

/* ────────────────────────────────────────────────────────────── */
/*                  Export handlers                               */
/* ────────────────────────────────────────────────────────────── */

type ToastFn = (message: string, kind?: 'success' | 'error' | 'info' | 'warning') => void;

/** Audit-log a fire-and-forget export action. */
function logExportAudit(
  action: 'EXPORT_PDF' | 'EXPORT_CSV' | 'EXPORT_MARKDOWN' | 'EXPORT_JSON',
  documentId: string,
  filename: string
) {
  fetch('/api/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action,
      resource: 'Document',
      resourceId: documentId,
      details: { filename },
    }),
  }).catch(err => log.warn(`audit ${action} failed:`, err));
}

async function handleExportPdf(
  document: Document,
  analysis: Analysis,
  showToast: ToastFn
): Promise<void> {
  try {
    const { PdfGenerator } = await import('@/lib/reports/pdf-generator');
    const generator = new PdfGenerator();
    generator.generateReport({
      filename: document.filename,
      analysis: analysis as unknown as Parameters<typeof generator.generateReport>[0]['analysis'],
    });
    logExportAudit('EXPORT_PDF', document.id, document.filename);
    showToast('PDF report generated successfully', 'success');
  } catch (err) {
    log.error('Failed to generate PDF:', err);
    showToast('Failed to generate PDF report', 'error');
  }
}

async function handleExportCsv(
  document: Document,
  analysis: Analysis,
  showToast: ToastFn
): Promise<void> {
  try {
    const { CsvGenerator } = await import('@/lib/reports/csv-generator');
    const generator = new CsvGenerator();
    generator.generateReport(
      document.filename,
      analysis as unknown as Parameters<typeof generator.generateReport>[1]
    );
    logExportAudit('EXPORT_CSV', document.id, document.filename);
    showToast('CSV export generated successfully', 'success');
  } catch (err) {
    log.error('Failed to generate CSV:', err);
    showToast('Failed to generate CSV report', 'error');
  }
}

async function handleExportMarkdown(
  document: Document,
  analysis: Analysis,
  biases: BiasInstance[]
): Promise<void> {
  const { generateMarkdownReport, downloadMarkdown } =
    await import('@/lib/reports/markdown-generator');
  const md = generateMarkdownReport({
    filename: document.filename,
    uploadedAt: document.uploadedAt,
    overallScore: analysis.overallScore,
    noiseScore: analysis.noiseScore,
    summary: analysis.summary,
    biases: biases.map(b => ({
      biasType: b.biasType,
      severity: b.severity,
      excerpt: b.excerpt,
      explanation: b.explanation,
      suggestion: b.suggestion,
    })),
    swotAnalysis: analysis.swotAnalysis as Parameters<
      typeof generateMarkdownReport
    >[0]['swotAnalysis'],
    simulation: analysis.simulation as Parameters<typeof generateMarkdownReport>[0]['simulation'],
    compliance: analysis.compliance as Parameters<typeof generateMarkdownReport>[0]['compliance'],
  });
  downloadMarkdown(md, document.filename);
  logExportAudit('EXPORT_MARKDOWN', document.id, document.filename);
}

async function handleExportJson(
  document: Document,
  analysis: Analysis,
  biases: BiasInstance[]
): Promise<void> {
  const { generateJsonReport, downloadJson } = await import('@/lib/reports/json-generator');
  const json = generateJsonReport({
    filename: document.filename,
    uploadedAt: document.uploadedAt,
    overallScore: analysis.overallScore,
    noiseScore: analysis.noiseScore,
    summary: analysis.summary,
    biases: biases.map(b => ({
      biasType: b.biasType,
      severity: b.severity,
      excerpt: b.excerpt,
      explanation: b.explanation,
      suggestion: b.suggestion,
    })),
    swotAnalysis: analysis.swotAnalysis as Parameters<typeof generateJsonReport>[0]['swotAnalysis'],
    simulation: analysis.simulation as Parameters<typeof generateJsonReport>[0]['simulation'],
    compliance: analysis.compliance as Parameters<typeof generateJsonReport>[0]['compliance'],
  });
  downloadJson(json, document.filename);
  logExportAudit('EXPORT_JSON', document.id, document.filename);
}

/* Suppress unused-react-import warning when ReactNode is only used in JSX. */
void (null as unknown as ReactNode);
