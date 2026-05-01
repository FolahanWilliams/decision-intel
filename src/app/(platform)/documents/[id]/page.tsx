'use client';

import { useEffect, useState, useCallback, useMemo, useRef, use, lazy, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ChevronRight,
  Lightbulb,
  Terminal,
  Info,
  RefreshCw,
  Brain,
  Users,
  Globe,
  GitCompareArrows,
  BookOpen,
  Link2,
  HelpCircle,
  X,
} from 'lucide-react';
import { useToast } from '@/components/ui/EnhancedToast';
import { SSEReader } from '@/lib/sse';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClientLogger } from '@/lib/utils/logger';
import { formatDate } from '@/lib/constants/human-audit';
import { formatBiasName } from '@/lib/utils/labels';
import { computeConviction } from '@/lib/scoring/conviction';
import { computeDQChain } from '@/lib/scoring/dq-chain';

const log = createClientLogger('DocumentDetail');
import { BiasDetailModal } from './BiasDetailModal';
import { OutcomeReporter } from './OutcomeReporter';
import { DraftOutcomeCard } from '@/components/ui/DraftOutcomeCard';
import { SampleBadge } from '@/components/ui/SampleBadge';
import { CalibrationChip } from '@/components/analysis/CalibrationChip';
import { DecisionPriorCapture, PostAnalysisPrior } from '@/components/ui/DecisionPriorCapture';
import { OutcomeTimeframePicker } from '@/components/ui/OutcomeTimeframePicker';
import { CounterfactualPanel } from '@/components/ui/CounterfactualPanel';
import { LearningImpactCard } from '@/components/ui/LearningImpactCard';
import { InterventionPanel } from '@/components/ui/InterventionPanel';
import { MetaVerdictPanel } from '@/components/ui/MetaVerdictPanel';
import { ToxicAlertBanner } from '@/components/ui/ToxicAlertBanner';
import { DecisionRoomList } from '@/components/ui/DecisionRoomCard';
import { ToxicCombinationCard } from '@/components/visualizations/ToxicCombinationCard';
import { ScoringBreakdown } from '@/components/visualizations/ScoringBreakdown';
import { RelatedDecisions } from '@/components/ui/RelatedDecisions';
import { DecisionScorecard } from '@/components/analysis/DecisionScorecard';
import { R2FDecompositionCard } from '@/components/documents/R2FDecompositionCard';
import { R2FBadge } from '@/components/ui/R2FBadge';
import { ReferenceClassChip } from '@/components/documents/ReferenceClassChip';
import { ReportOutcomeFab } from '@/components/documents/ReportOutcomeFab';
import {
  DocumentVisibilityModal,
  DocumentVisibilityPill,
  type DocumentVisibility,
} from '@/components/documents/DocumentVisibilityModal';
import { LegalHoldStatusChip } from '@/components/documents/LegalHoldStatusChip';
import { DrRedTeamCard } from '@/components/analysis/DrRedTeamCard';
import { RecommendationsPanel } from '@/components/ui/RecommendationsPanel';
import { ExecutiveSummary } from '@/components/visualizations/ExecutiveSummary';
import {
  TimelinePhaseScrub,
  PhaseDuringPanel,
  PhaseAfterPanel,
  type DocumentPhase,
} from '@/components/documents/TimelinePhaseScrub';
import { LiveRedFlagsAlert } from '@/components/analysis/LiveRedFlagsAlert';
import { LivePredictedQuestions } from '@/components/analysis/LivePredictedQuestions';
import { NoiseTaxCard } from '@/components/analysis/NoiseTaxCard';
import { StructuralAssumptionsPanel } from '@/components/analysis/StructuralAssumptionsPanel';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { trackEvent } from '@/lib/analytics/track';
import { PageSkeleton, CardSkeleton } from '@/components/ui/LoadingSkeleton';
import {
  BiasInstance,
  SwotAnalysisResult,
  LogicalAnalysisResult,
  CognitiveAnalysisResult,
  NoiseBenchmark,
  InstitutionalMemoryResult,
  ComplianceResult,
  IntelligenceContextSummary,
  RecognitionCuesResult,
  NarrativePreMortem,
} from '@/types';
import { RegulatoryHorizonWidget } from './RegulatoryHorizonWidget';
import { InstitutionalMemoryWidget } from './InstitutionalMemoryWidget';
import dynamic from 'next/dynamic';
const BiasNetwork = dynamic(
  () => import('@/components/visualizations/BiasNetwork').then(m => ({ default: m.BiasNetwork })),
  { ssr: false }
);
import { ShareModal } from '@/components/ui/ShareModal';
import { Share2, Trash2, GitBranch, Upload } from 'lucide-react';
import { VersionHistoryStrip } from '@/components/analysis/VersionHistoryStrip';
import { VersionDeltaCard } from '@/components/analysis/VersionDeltaCard';

// Lazy-loaded tab components
const OverviewTab = lazy(() =>
  import('./tabs/OverviewTab').then(m => ({ default: m.OverviewTab }))
);
const SwotTab = lazy(() => import('./tabs/SwotTab').then(m => ({ default: m.SwotTab })));
const NoiseTab = lazy(() => import('./tabs/NoiseTab').then(m => ({ default: m.NoiseTab })));
const IntelligenceTab = lazy(() =>
  import('./tabs/IntelligenceTab').then(m => ({ default: m.IntelligenceTab }))
);
const EvidenceTab = lazy(() =>
  import('./tabs/EvidenceTab').then(m => ({ default: m.EvidenceTab }))
);
const PerspectivesTab = lazy(() =>
  import('./tabs/PerspectivesTab').then(m => ({ default: m.PerspectivesTab }))
);
const DQChainTab = lazy(() => import('./tabs/DQChainTab').then(m => ({ default: m.DQChainTab })));
const ForgottenQuestionsTab = lazy(() =>
  import('./tabs/ForgottenQuestionsTab').then(m => ({ default: m.ForgottenQuestionsTab }))
);
const BiasAnnotatedPDFViewer = lazy(() =>
  import('@/components/visualizations/BiasAnnotatedPDFViewer').then(m => ({
    default: m.BiasAnnotatedPDFViewer,
  }))
);
// Board-ready inline preview — mirrors the exported PDF.
import { BoardReportView } from './tabs/BoardReportView';

interface VerificationSource {
  ticker?: string;
  endpoint?: string;
  field?: string;
  value?: number | string;
  displayValue?: string;
  period?: string;
}

interface Verification {
  claimId: number;
  claim: string;
  verdict: 'VERIFIED' | 'CONTRADICTED' | 'UNVERIFIABLE';
  explanation: string;
  source?: VerificationSource;
  sourceUrl?: string;
}

interface FactCheck {
  score: number;
  flags: string[];
  verifications?: Verification[];
  primaryCompany?: { ticker: string; name: string };
  primaryTopic?: string;
  dataFetchedAt?: string;
  searchSources?: string[];
}

interface Analysis {
  id: string;
  overallScore: number;
  noiseScore: number;
  summary: string;
  createdAt: string;
  biases: BiasInstance[];
  noiseStats?: { mean: number; stdDev: number; variance: number };
  noiseBenchmarks?: NoiseBenchmark[];
  factCheck?: FactCheck;
  compliance?: ComplianceResult & {
    compoundScoring?: {
      calibratedScore: number;
      compoundMultiplier: number;
      contextAdjustment: number;
      confidenceDecay: number;
      amplifyingInteractions: Array<{ bias: string; multiplier: number; interactions: string[] }>;
      adjustments: Array<{ source: string; delta: number; description: string }>;
    };
    bayesianPriors?: {
      adjustedScore: number;
      beliefDelta: number;
      informationGain: number;
      priorInfluence: number;
      biasAdjustments: Array<{
        biasType: string;
        priorConfidence: number;
        posteriorConfidence: number;
        direction: string;
        reason: string;
      }>;
    };
    calibration?: import('@/types').CalibrationInsight;
  };
  swotAnalysis?: SwotAnalysisResult;
  logicalAnalysis?: LogicalAnalysisResult;
  cognitiveAnalysis?: CognitiveAnalysisResult;
  preMortem?: {
    failureScenarios: string[];
    preventiveMeasures: string[];
    imageUrl?: string | null;
  };
  biasWebImageUrl?: string | null;
  preMortemImageUrl?: string | null;
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
  institutionalMemory?: InstitutionalMemoryResult;
  intelligenceContext?: IntelligenceContextSummary;
  metaVerdict?: string;
  outcomeStatus?: string;
  recognitionCues?: RecognitionCuesResult;
  narrativePreMortem?: NarrativePreMortem;
  dqChain?: import('@/types').DQChainSummary;
  forgottenQuestions?: import('@/types').ForgottenQuestionsResult;
  marketContextApplied?: {
    context: 'emerging_market' | 'developed_market' | 'cross_border' | 'unknown';
    emergingMarketCountries: string[];
    developedMarketCountries: string[];
    cagrCeiling: number;
    rationale: string;
  };
  marketContextOverride?: {
    context: 'emerging_market' | 'developed_market' | 'cross_border' | 'unknown';
    emergingMarketCountries: string[];
    developedMarketCountries: string[];
    cagrCeiling: number;
    rationale: string;
    overriddenAt?: string;
    overriddenBy?: string;
  } | null;
}

interface Document {
  id: string;
  userId?: string;
  filename: string;
  fileType: string;
  fileSize: number;
  content: string;
  uploadedAt: string;
  status: string;
  isSample?: boolean;
  isOwner?: boolean;
  documentType?: string | null;
  visibility?: 'private' | 'team' | 'specific';
  legalHoldId?: string | null;
  legalHold?: {
    id: string;
    reason: string | null;
    holdUntil: string | null;
    releasedAt: string | null;
    grantedById: string;
    createdAt: string;
  } | null;
  analyses: Analysis[];
  deal?: {
    id: string;
    name: string;
    sector: string | null;
    ticketSize: number | null;
  } | null;
}

type TabId =
  | 'overview'
  | 'evidence'
  | 'swot'
  | 'noise'
  | 'dq-chain'
  | 'perspectives'
  | 'intelligence'
  | 'forgotten-questions'
  | 'pdf-view';

const VALID_TABS: TabId[] = [
  'overview',
  'evidence',
  'swot',
  'noise',
  'dq-chain',
  'perspectives',
  'intelligence',
  'forgotten-questions',
  'pdf-view',
];

// Map old tab IDs to new ones for backward compatibility
const TAB_ALIASES: Record<string, TabId> = {
  replay: 'evidence',
  logic: 'evidence',
  'red-team': 'perspectives',
  boardroom: 'perspectives',
  simulator: 'perspectives',
  rpd: 'overview',
};

// ─── Conviction Score Badge ─────────────────────────────────────────────────

function ConvictionBadge({ analysis }: { analysis: Analysis }) {
  const conviction = useMemo(() => {
    const factCheck = analysis.factCheck;
    const noiseStats = analysis.noiseStats;
    const logicalAnalysis = analysis.logicalAnalysis;
    const cognitiveAnalysis = analysis.cognitiveAnalysis;

    let verificationRate: number | null = null;
    if (factCheck?.verifications && factCheck.verifications.length > 0) {
      const verified = factCheck.verifications.filter(v => v.verdict === 'VERIFIED').length;
      verificationRate = verified / factCheck.verifications.length;
    }

    return computeConviction({
      factCheckScore: factCheck?.score ?? null,
      verificationRate,
      logicalScore: logicalAnalysis?.score ?? null,
      noiseStdDev: noiseStats?.stdDev ?? null,
      blindSpotGap: cognitiveAnalysis?.blindSpotGap ?? null,
    });
  }, [analysis]);

  const color =
    conviction.score >= 70
      ? 'var(--info)'
      : conviction.score >= 40
        ? 'var(--accent-primary)'
        : 'var(--text-muted)';

  return (
    <div style={{ textAlign: 'center', marginRight: '8px' }} title={conviction.interpretation}>
      <div
        style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Conviction
      </div>
      <div
        style={{
          fontSize: '36px',
          fontWeight: 700,
          lineHeight: 1,
          fontFamily: "'JetBrains Mono', monospace",
          color,
        }}
      >
        {conviction.score}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function DocumentAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBias, setSelectedBias] = useState<BiasInstance | null>(null);
  const [streamLogs, setStreamLogs] = useState<
    { msg: string; type: 'info' | 'bias' | 'success'; ts: string }[]
  >([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [, setIsExportingPdf] = useState(false);
  const [, setIsExportingCsv] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [visibilityState, setVisibilityState] = useState<DocumentVisibility | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingVersion, setIsUploadingVersion] = useState(false);
  const [versionUploadError, setVersionUploadError] = useState<string | null>(null);
  const versionFileInputRef = useRef<HTMLInputElement | null>(null);
  const scanAbortRef = useRef<AbortController | null>(null);

  // Decision prior state
  const [prior, setPrior] = useState<{
    id?: string;
    analysisId: string;
    defaultAction: string;
    confidence: number;
    evidenceToChange?: string;
    postAnalysisAction?: string;
    beliefDelta?: number;
  } | null>(null);
  const [priorLoading, setPriorLoading] = useState(false);

  // Toxic combinations state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [toxicCombinations, setToxicCombinations] = useState<any[]>([]);

  // View-as toggle: Analyst (full detail) / CSO (condensed) / IC (pre-IC
  // memo cover) / Board (inline report). Persisted via ?view= URL param
  // (primary source) + localStorage fallback so the same user keeps their
  // preferred density across documents. Default: CSO — the most demo-ready
  // view and the closest match to the previous "focused" default.
  // The `ic` mode (added 2026-04-25) reorders existing surfaces for an
  // investment-committee reader: predicted IC questions → structural
  // assumptions (Dalio overlay) → top biases as IC risks → DPR prominence.
  type ViewMode = 'analyst' | 'cso' | 'ic' | 'board';
  const resolveInitialViewMode = (): ViewMode => {
    if (typeof window === 'undefined') return 'cso';
    const param = new URLSearchParams(window.location.search).get('view');
    if (param === 'analyst' || param === 'cso' || param === 'ic' || param === 'board') {
      return param;
    }
    // Legacy values from the previous Focused/Full toggle
    if (param === 'focused') return 'cso';
    if (param === 'full') return 'analyst';
    try {
      const saved = localStorage.getItem('di-doc-view-mode');
      if (saved === 'analyst' || saved === 'cso' || saved === 'ic' || saved === 'board') {
        return saved;
      }
    } catch {
      // localStorage may throw in private-mode Safari / SSR — silent fallback to default per CLAUDE.md fire-and-forget exceptions.
    }
    return 'cso';
  };
  const [viewMode, setViewModeState] = useState<ViewMode>(resolveInitialViewMode);
  // setViewMode is defined below — it also snaps phase to 'before' when the
  // user switches to CSO or Board, both of which currently only render
  // content at phase='before'. The snap prevents the blank-state
  // combinations (CSO + during, Board + after) that previously surfaced
  // no content at all. Defined after setPhase so we can call it here.
  // Temporal phase scrub — independent axis from viewMode. 'before' is the
  // default (full analyst/cso/board content). 'during' surfaces the human-
  // decision record. 'after' surfaces recalibrated DQI + Brier + lessons.
  // Persisted via ?phase= URL param + localStorage so the user stays on the
  // same phase across documents.
  const resolveInitialPhase = (): DocumentPhase => {
    if (typeof window === 'undefined') return 'before';
    const param = new URLSearchParams(window.location.search).get('phase');
    if (param === 'before' || param === 'during' || param === 'after') return param;
    try {
      const saved = localStorage.getItem('di-doc-phase');
      if (saved === 'before' || saved === 'during' || saved === 'after') return saved;
    } catch {
      // localStorage may throw in private-mode Safari / SSR — silent fallback to default per CLAUDE.md fire-and-forget exceptions.
    }
    return 'before';
  };
  const [phase, setPhaseState] = useState<DocumentPhase>(resolveInitialPhase);
  const [phaseResetNotice, setPhaseResetNotice] = useState(false);
  const setPhase = useCallback((next: DocumentPhase) => {
    setPhaseState(next);
    try {
      localStorage.setItem('di-doc-phase', next);
    } catch {
      // localStorage may throw in private-mode Safari — silent fallback per CLAUDE.md fire-and-forget exceptions.
    }
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (next === 'before') url.searchParams.delete('phase');
      else url.searchParams.set('phase', next);
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  // setViewMode — defined here (after setPhase) so it can snap phase to
  // 'before' when the user switches to CSO or Board. Both of those views
  // currently only render content at phase='before' (the during + after
  // phase panels are analyst-only), so allowing the combinations would
  // surface an empty page. Snapping is the simpler guard per the
  // 2026-04-24 polish decision; the user can re-select during/after
  // after switching back to Analyst.
  const setViewMode = useCallback(
    (next: ViewMode) => {
      setViewModeState(next);
      try {
        localStorage.setItem('di-doc-view-mode', next);
      } catch {
        // localStorage may throw in private-mode Safari — silent fallback per CLAUDE.md fire-and-forget exceptions.
      }
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('view', next);
        window.history.replaceState({}, '', url.toString());
      }
      // CSO + Board are explicitly pre-IC framings (condensed exec
      // summary / 2-page board export preview); they have no
      // during/after meaning and snap to 'before' on entry. IC was
      // unlocked 2026-04-26 (P1 #21, Marcus persona finding) so an M&A
      // user running a post-close audit can stay in IC view-mode while
      // navigating phase=during/after. The during/after PhaseDuringPanel
      // + PhaseAfterPanel are view-mode-agnostic, so IC + during shows
      // the human-decision record, IC + after shows the
      // recalibrated-DQI + Brier + lessons panel — which is exactly the
      // post-close trail Marcus wanted in IC mode.
      if ((next === 'cso' || next === 'board') && phase !== 'before') {
        setPhase('before');
        setPhaseResetNotice(true);
      }
    },
    [phase, setPhase]
  );

  // Direct-URL guard: if the user lands on /documents/[id]?view=cso&phase=after
  // (or via localStorage persistence) we resolve the mismatch on mount by
  // snapping phase to 'before'. Without this, the user sees an empty page
  // and no way to recover short of clicking Analyst then a phase chip.
  // The guard applies only to CSO + Board now (per the IC unlock above);
  // IC + phase=during/after is a valid combination as of 2026-04-26.
  useEffect(() => {
    if ((viewMode === 'cso' || viewMode === 'board') && phase !== 'before') {
      setPhase('before');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [isExportingBoardView, setIsExportingBoardView] = useState(false);
  // Confidential classification toggle for the Board view + its PDF
  // export. Kept as component state (not persisted) so every document
  // starts un-classified by default — a CSO has to opt in each time
  // they intend to forward internally.
  const [isBoardConfidential, setIsBoardConfidential] = useState(false);

  // URL-based tab state (#7)
  const tabFromUrl = searchParams.get('tab') ?? '';
  const resolvedTab = TAB_ALIASES[tabFromUrl] ?? tabFromUrl;
  const activeTab: TabId = VALID_TABS.includes(resolvedTab as TabId)
    ? (resolvedTab as TabId)
    : 'overview';

  const { showToast } = useToast();

  // D9 (locked 2026-04-27): post-claim landing toast. The /onboarding/claim
  // page redirects here with ?claimed=true after transferring ownership.
  // Fires once per mount; the param is stripped from the URL afterward so
  // a refresh doesn't re-fire and a copy-paste of the URL doesn't show
  // a stale "claimed" message.
  useEffect(() => {
    if (searchParams.get('claimed') === 'true') {
      showToast('Audit claimed from your demo run. It now lives in your account.', 'success');
      const params = new URLSearchParams(searchParams.toString());
      params.delete('claimed');
      const qs = params.toString();
      router.replace(`/documents/${resolvedParams.id}${qs ? `?${qs}` : ''}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // D3 (lock 2026-04-28): RPD pre-mortem suggestions cross-tab navigation.
  // RPDPreMortemSuggestionsCard on the Overview tab dispatches
  // 'document-detail-navigate' when a suggestion is clicked. We push the
  // target tab into the URL; PerspectivesTab listens for the same event
  // to set its sub-view (what-if), and RPDSimulatorCard reads the
  // sessionStorage prefill on mount.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ tab?: string }>).detail;
      const tab = detail?.tab;
      if (!tab || !VALID_TABS.includes(tab as TabId)) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tab);
      router.push(`/documents/${resolvedParams.id}?${params.toString()}`, { scroll: false });
    };
    window.addEventListener('document-detail-navigate', handler);
    return () => window.removeEventListener('document-detail-navigate', handler);
  }, [router, searchParams, resolvedParams.id]);

  const handleTabChange = useCallback(
    (tabId: TabId) => {
      setSelectedBias(null);
      const params = new URLSearchParams(searchParams.toString());
      if (tabId === 'overview') {
        params.delete('tab');
      } else {
        params.set('tab', tabId);
      }
      const qs = params.toString();
      router.push(`/documents/${resolvedParams.id}${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [router, resolvedParams.id, searchParams]
  );

  const refetchDocument = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents/${resolvedParams.id}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const apiMessage = body && typeof body.error === 'string' ? body.error : null;
        if (res.status === 404) {
          throw new Error(apiMessage || 'Document not found');
        }
        throw new Error(apiMessage || `Could not load document (HTTP ${res.status})`);
      }
      const data = await res.json();
      setDocument(data);
      if (data.visibility) setVisibilityState(data.visibility as DocumentVisibility);
      if (data.analyses?.[0]?.biases?.[0]) {
        setSelectedBias(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document');
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    refetchDocument().then(() => {
      // Audit-log the view (fire-and-forget) on first load only.
      const id = resolvedParams.id;
      fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'VIEW_DOCUMENT',
          resource: 'Document',
          resourceId: id,
        }),
      }).catch(err => log.warn('audit VIEW_DOCUMENT failed:', err));
    });
  }, [resolvedParams.id, refetchDocument]);

  // Abort any in-flight scan stream on unmount
  useEffect(() => {
    return () => {
      scanAbortRef.current?.abort();
    };
  }, []);

  // "Upload new version" — sends the file to /api/upload with
  // versionOfDocumentId set to the current document. The API resolves the
  // chain root, computes nextVersionNumber, and the analyze pipeline auto-
  // links previousAnalysisId on the new analysis. We navigate to the new
  // doc on success so the user sees the VersionDeltaCard render in place.
  const handleVersionFilePicked = async (file: File) => {
    if (!document?.id) return;
    setVersionUploadError(null);
    setIsUploadingVersion(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('versionOfDocumentId', document.id);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Upload failed (${res.status})`);
      }
      const data = (await res.json()) as { id?: string };
      if (!data.id) throw new Error('Upload returned no document id');
      showToast('New version uploaded — running audit now…', 'success');
      // Navigate to the new doc; the analyze stream picks up automatically
      // and the VersionDeltaCard renders once the new Analysis is persisted.
      router.push(`/documents/${data.id}`);
    } catch (err) {
      log.error('version upload failed:', err);
      setVersionUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploadingVersion(false);
    }
  };

  const handleBoardReportExport = async () => {
    if (!document || !analysis) return;
    try {
      // Fetch the top counterfactual scenario (silent-tolerant) so the
      // board PDF renders a PROJECTED IMPACT section with real ROI math.
      // Null when /api/counterfactual has no positive scenarios for this
      // analysis or the fetch fails — the PDF gracefully omits the
      // section rather than rendering fabricated numbers.
      let counterfactualTop:
        | import('@/lib/reports/board-report-generator').BoardCounterfactualTop
        | null = null;
      try {
        const cfRes = await fetch(`/api/counterfactual?analysisId=${analysis.id}`);
        if (cfRes.ok) {
          const cfData = (await cfRes.json()) as {
            scenarios?: Array<{
              biasType: string;
              expectedImprovement: number;
              impactUsd?: number;
              confidence?: number;
              similarDecisionsCount?: number;
            }>;
          };
          const positives = (cfData.scenarios || [])
            .filter(s => s.expectedImprovement > 0)
            .sort((a, b) => b.expectedImprovement - a.expectedImprovement);
          if (positives.length > 0) {
            const top = positives[0];
            counterfactualTop = {
              biasType: top.biasType,
              expectedImprovement: top.expectedImprovement,
              impactUsd: top.impactUsd,
              confidence: top.confidence,
              similarDecisionsCount: top.similarDecisionsCount,
            };
          }
        }
      } catch (cfErr) {
        log.warn('Board report counterfactual fetch failed (non-fatal):', cfErr);
      }

      // Build the provenance chain + regulatory exposure summary so the
      // board report carries a verifiable trail (P1 #22, 2026-04-26
      // Margaret + Titi finding). Both fields are optional in the
      // generator — if any piece is missing we omit the section rather
      // than fabricate.
      let provenance:
        | import('@/lib/reports/board-report-generator').BoardReportProvenance
        | undefined;
      try {
        const docHashRes = await fetch(
          `/api/documents/${document.id}?fields=contentHash,promptVersion`
        );
        const docHashJson = (await docHashRes.json().catch(() => null)) as {
          contentHash?: string | null;
          analyses?: Array<{ id: string; promptVersion?: { hash?: string | null } | null }>;
        } | null;
        const documentHash = docHashJson?.contentHash || 'UNAVAILABLE';
        const promptFingerprint = docHashJson?.analyses?.[0]?.promptVersion?.hash || 'UNAVAILABLE';
        provenance = {
          analysisId: analysis.id,
          documentHash,
          modelTag: 'gemini-3-flash-preview',
          promptFingerprint,
          generatedAt: new Date().toISOString(),
        };
      } catch (provErr) {
        log.warn('Board report provenance fetch failed (non-fatal):', provErr);
      }

      let regulatoryExposure:
        | import('@/lib/reports/board-report-generator').BoardReportRegulatoryExposure[]
        | undefined;
      try {
        const { getCrossFrameworkRisk } = await import('@/lib/compliance/bias-regulation-map');
        const { formatBiasName } = await import('@/lib/utils/labels');
        const sortedBiases = [...(analysis.biases || [])].sort((a, b) => {
          const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
          return (
            (order[a.severity?.toLowerCase() ?? ''] ?? 4) -
            (order[b.severity?.toLowerCase() ?? ''] ?? 4)
          );
        });
        const seenBias = new Set<string>();
        regulatoryExposure = [];
        for (const bias of sortedBiases) {
          if (seenBias.has(bias.biasType) || regulatoryExposure.length >= 5) continue;
          seenBias.add(bias.biasType);
          const risk = getCrossFrameworkRisk(bias.biasType);
          regulatoryExposure.push({
            biasLabel: formatBiasName(bias.biasType),
            frameworks: risk.frameworks.map(f => f.frameworkName),
          });
        }
      } catch (regErr) {
        log.warn('Board report regulatory mapping failed (non-fatal):', regErr);
      }

      const { BoardReportGenerator } = await import('@/lib/reports/board-report-generator');
      const generator = new BoardReportGenerator();
      generator.generateReport({
        filename: document.filename,
        analysis,
        confidential: isBoardConfidential,
        counterfactualTop,
        provenance,
        regulatoryExposure,
      });
      fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'EXPORT_BOARD_REPORT',
          resource: 'Document',
          resourceId: document.id,
          details: { filename: document.filename, confidential: isBoardConfidential },
        }),
      }).catch(err => log.warn('audit EXPORT_BOARD_REPORT failed:', err));
      showToast(
        isBoardConfidential ? 'Confidential board report generated' : 'Board report generated',
        'success'
      );
    } catch (error) {
      log.error('Failed to generate board report:', error);
      showToast('Failed to generate board report', 'error');
      throw error;
    }
  };

  // Decision Provenance Record — design-partner perk. Fetches the record
  // JSON from /api/documents/[id]/provenance-record (POST persists + returns
  // data), then hands the data to DecisionProvenanceRecordGenerator
  // client-side. The generator is client-side jsPDF so the PDF download is
  // a browser action.
  //
  // Renamed from handleDefensePacketExport on 2026-04-22.
  const handleProvenanceRecordExport = async () => {
    if (!document) return;
    try {
      const res = await fetch(`/api/documents/${document.id}/provenance-record`, {
        method: 'POST',
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({ error: 'Failed to generate record.' }))) as {
          error?: string;
        };
        throw new Error(body.error || 'Failed to generate record.');
      }
      const { data } = (await res.json()) as {
        data: import('@/lib/reports/provenance-record-data').ProvenanceRecordData;
      };
      const { DecisionProvenanceRecordGenerator } =
        await import('@/lib/reports/decision-provenance-record-generator');
      const generator = new DecisionProvenanceRecordGenerator();
      // ProvenanceRecordData serialized through JSON loses the Date type on
      // generatedAt — rehydrate before handing to jsPDF.
      generator.generateAndDownload({
        ...data,
        generatedAt: new Date(data.generatedAt as unknown as string),
      });
      fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'EXPORT_PROVENANCE_RECORD',
          resource: 'Document',
          resourceId: document.id,
          details: { filename: document.filename },
        }),
      }).catch(err => log.warn('audit EXPORT_PROVENANCE_RECORD failed:', err));
      showToast('Decision Provenance Record generated', 'success');
    } catch (error) {
      log.error('Failed to generate provenance record:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to generate provenance record',
        'error'
      );
      throw error;
    }
  };

  // Hallway Brief — single-page PDF a CSO hands the CEO in the hallway
  // before a board meeting. Sits between the board report (committee
  // artifact) and the DPR (regulator artifact). Purely client-side jsPDF.
  const handleHallwayBriefExport = async () => {
    if (!document || !analysis) return;
    try {
      const { HallwayBriefGenerator } = await import('@/lib/reports/hallway-brief-generator');
      const generator = new HallwayBriefGenerator();
      generator.generateAndDownload({
        filename: document.filename,
        overallScore: analysis.overallScore,
        noiseScore: analysis.noiseScore,
        summary: analysis.summary,
        metaVerdict: analysis.metaVerdict ?? null,
        biases: biases.map(b => ({
          biasType: b.biasType,
          severity: b.severity,
          confidence: b.confidence,
          excerpt: b.excerpt,
          explanation: b.explanation,
          suggestion: b.suggestion,
        })),
        generatedAt: new Date(),
      });
      fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'EXPORT_HALLWAY_BRIEF',
          resource: 'Document',
          resourceId: document.id,
          details: { filename: document.filename },
        }),
      }).catch(err => log.warn('audit EXPORT_HALLWAY_BRIEF failed:', err));
      showToast('Hallway Brief generated', 'success');
    } catch (error) {
      log.error('Failed to generate hallway brief:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to generate hallway brief',
        'error'
      );
    }
  };

  const handleExport = async () => {
    if (!document || !analysis) return;
    setIsExportingPdf(true);
    try {
      const { PdfGenerator } = await import('@/lib/reports/pdf-generator');
      const generator = new PdfGenerator();
      generator.generateReport({ filename: document.filename, analysis });
      try {
        const auditPayload = JSON.stringify({
          action: 'EXPORT_PDF',
          resource: 'Document',
          resourceId: document.id,
          details: { filename: document.filename },
        });
        fetch('/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: auditPayload,
        }).catch(err => log.warn('audit EXPORT_PDF failed:', err));
      } catch (stringifyError) {
        log.error('Failed to stringify audit payload:', stringifyError);
      }
      showToast('PDF report generated successfully', 'success');
    } catch (error) {
      log.error('Failed to generate PDF:', error);
      showToast('Failed to generate PDF report', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleCsvExport = async () => {
    if (!document || !analysis) return;
    setIsExportingCsv(true);
    try {
      const { CsvGenerator } = await import('@/lib/reports/csv-generator');
      const generator = new CsvGenerator();
      generator.generateReport(document.filename, analysis);
      fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'EXPORT_CSV',
          resource: 'Document',
          resourceId: document.id,
          details: { filename: document.filename },
        }),
      }).catch(err => log.warn('audit EXPORT_CSV failed:', err));
      showToast('CSV export generated successfully', 'success');
    } catch (error) {
      log.error('Failed to generate CSV:', error);
      showToast('Failed to generate CSV report', 'error');
    } finally {
      setIsExportingCsv(false);
    }
  };

  const runLiveScan = async () => {
    if (!document) return;
    // Abort any in-flight scan
    scanAbortRef.current?.abort();
    const controller = new AbortController();
    scanAbortRef.current = controller;

    setIsScanning(true);
    setStreamLogs([
      {
        msg: 'Establishing secure stream...',
        type: 'info',
        ts: new Date().toLocaleTimeString([], { hour12: false }),
      },
    ]);
    setScanProgress(0);

    try {
      const response = await fetch('/api/analyze/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: document.id }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorMessage = `Analysis failed (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          /* ignore parse errors */
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Failed to start stream');

      const decoder = new TextDecoder();
      const sseReader = new SSEReader();
      let streamError: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sseReader.processChunk(chunk, (update: any) => {
          const ts = new Date().toLocaleTimeString([], { hour12: false });
          if (update.type === 'step') {
            const icon = update.status === 'complete' ? '✓' : '►';
            const color = update.status === 'complete' ? 'success' : 'info';
            setStreamLogs(prev => [...prev, { msg: `${icon} ${update.step}`, type: color, ts }]);
          } else if (update.type === 'bias' && update.result.found) {
            setStreamLogs(prev => [
              ...prev,
              {
                msg: `⚠ BIAS: ${update.biasType} (${update.result.severity.toUpperCase()})`,
                type: 'bias',
                ts,
              },
            ]);
          } else if (update.type === 'noise') {
            setStreamLogs(prev => [
              ...prev,
              {
                msg: `◐ NOISE: ${Math.round(update.result.score)}% variance detected`,
                type: 'info',
                ts,
              },
            ]);
          } else if (update.type === 'complete') {
            trackEvent('analysis_completed', { score: update.result?.overallScore });
            setStreamLogs(prev => [
              ...prev,
              { msg: '✓ Analysis complete. Results saved.', type: 'success', ts },
            ]);
            // Re-fetch from API to get the full record with DB-generated
            // fields (id, createdAt, BiasInstance IDs) instead of injecting
            // the raw finalReport which is missing those fields.
            fetch(`/api/documents/${document.id}`, { signal: controller.signal })
              .then(r => (r.ok ? r.json() : null))
              .then(data => {
                if (data) setDocument(data);
              })
              .catch(err => {
                if (err?.name !== 'AbortError') {
                  console.warn('Failed to refresh document after stream:', err);
                }
              });
          } else if (update.type === 'error') {
            streamError = update.message || 'Analysis failed during stream';
          }
          if (typeof update.progress === 'number') setScanProgress(update.progress);
        });
      }

      if (streamError) {
        throw new Error(streamError);
      }
    } catch (err) {
      // Ignore abort errors (user navigated away or started a new scan)
      if (err instanceof Error && err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : 'Live scan failed';
      setStreamLogs(prev => [
        ...prev,
        {
          msg: `Error: ${msg}`,
          type: 'bias',
          ts: new Date().toLocaleTimeString([], { hour12: false }),
        },
      ]);
      showToast(msg, 'error');
    } finally {
      setIsScanning(false);
    }
  };

  // Derive analysis data before any early returns so hooks stay unconditional
  const analysis = document?.analyses?.[0];
  const biases = useMemo(() => analysis?.biases || [], [analysis]);
  const selectedBiasIndex = selectedBias ? biases.findIndex(b => b.id === selectedBias.id) : -1;

  // Listen for command-palette-triggered board report export
  useEffect(() => {
    const handler = () => {
      void handleBoardReportExport();
    };
    window.addEventListener('command-palette-export-board-report', handler);
    return () => window.removeEventListener('command-palette-export-board-report', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document, analysis]);

  // Compute DQ Chain on the client from available analysis data
  const dqChain = useMemo(() => {
    if (!analysis) return undefined;
    try {
      return computeDQChain({
        logicalAnalysis: analysis.logicalAnalysis,
        swotAnalysis: analysis.swotAnalysis,
        cognitiveAnalysis: analysis.cognitiveAnalysis,
        factCheck: analysis.factCheck
          ? {
              totalClaims: analysis.factCheck.verifications?.length ?? 0,
              verifiedClaims:
                analysis.factCheck.verifications?.filter(
                  (v: Verification) => v.verdict === 'VERIFIED'
                ).length ?? 0,
              contradictedClaims:
                analysis.factCheck.verifications?.filter(
                  (v: Verification) => v.verdict === 'CONTRADICTED'
                ).length ?? 0,
              score: analysis.factCheck.score,
            }
          : undefined,
        noiseStdDev: analysis.noiseStats?.stdDev,
        biasCount: biases.length,
        preMortemCount: analysis.preMortem?.failureScenarios?.length,
      });
    } catch (err) {
      console.warn('[DocumentPage] computeDQChain failed (returning undefined fallback):', err);
      return undefined;
    }
  }, [analysis, biases.length]);

  // Fetch decision prior for this analysis
  useEffect(() => {
    if (!analysis?.id) return;
    setPriorLoading(true);
    fetch(`/api/decision-priors?analysisId=${analysis.id}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.prior) setPrior(data.prior);
      })
      .catch(err => log.warn('decision-priors fetch failed:', err))
      .finally(() => setPriorLoading(false));
  }, [analysis?.id]);

  // Fetch toxic combinations for this analysis
  useEffect(() => {
    if (!analysis?.id) return;
    fetch(`/api/toxic-combinations?analysisId=${analysis.id}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.combinations) setToxicCombinations(data.combinations);
      })
      .catch(err => log.warn('toxic-combinations fetch failed:', err));
  }, [analysis?.id]);

  const handleMarkdownExport = useCallback(async () => {
    if (!analysis || !document) return;
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
      factCheck: analysis.factCheck as
        | {
            score: number;
            verifications?: Array<{ claim: string; verdict: string; explanation: string }>;
          }
        | undefined,
      swotAnalysis: analysis.swotAnalysis as
        | {
            strengths: string[];
            weaknesses: string[];
            opportunities: string[];
            threats: string[];
            strategicAdvice: string;
          }
        | undefined,
      simulation: analysis.simulation as
        | {
            overallVerdict: string;
            twins?: Array<{
              name: string;
              role: string;
              vote: string;
              confidence: number;
              rationale: string;
            }>;
          }
        | undefined,
      noiseStats: analysis.noiseStats as
        | { mean: number; stdDev: number; variance: number }
        | undefined,
      logicalAnalysis: analysis.logicalAnalysis as
        | {
            score: number;
            fallacies?: Array<{ name: string; severity: string; explanation: string }>;
          }
        | undefined,
      compliance: analysis.compliance as
        | { status: string; riskScore: number; summary: string }
        | undefined,
    });
    downloadMarkdown(md, document.filename);
  }, [analysis, document, biases]);

  const handleJsonExport = useCallback(async () => {
    if (!analysis || !document) return;
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
      factCheck: analysis.factCheck as
        | {
            score: number;
            verifications?: Array<{ claim: string; verdict: string; explanation: string }>;
          }
        | undefined,
      swotAnalysis: analysis.swotAnalysis as
        | {
            strengths: string[];
            weaknesses: string[];
            opportunities: string[];
            threats: string[];
            strategicAdvice: string;
          }
        | undefined,
      simulation: analysis.simulation as
        | {
            overallVerdict: string;
            twins?: Array<{
              name: string;
              role: string;
              vote: string;
              confidence: number;
              rationale: string;
            }>;
          }
        | undefined,
      noiseStats: analysis.noiseStats as
        | { mean: number; stdDev: number; variance: number }
        | undefined,
      logicalAnalysis: analysis.logicalAnalysis as
        | {
            score: number;
            fallacies?: Array<{ name: string; severity: string; explanation: string }>;
          }
        | undefined,
      compliance: analysis.compliance as
        | { status: string; riskScore: number; summary: string }
        | undefined,
    });
    downloadJson(json, document.filename);
  }, [analysis, document, biases]);

  if (loading) return <PageSkeleton rows={6} />;

  if (error || !document) {
    return (
      <div>
        <div className="card">
          <div className="card-body flex flex-col items-center gap-md">
            <AlertTriangle size={48} style={{ color: 'var(--error)' }} />
            <p style={{ color: 'var(--error)' }}>{error || 'Document not found'}</p>
            <Link href="/dashboard" className="btn btn-primary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const TAB_GROUPS: { label: string; tabs: { id: TabId; label: string; icon: typeof Brain }[] }[] =
    [
      {
        label: 'Overview',
        tabs: [{ id: 'overview', label: 'Overview', icon: Brain }],
      },
      {
        label: 'Deep Analysis',
        tabs: [
          { id: 'evidence', label: 'Evidence', icon: CheckCircle },
          { id: 'swot', label: 'SWOT', icon: Lightbulb },
          { id: 'noise', label: 'Noise', icon: Info },
          { id: 'dq-chain', label: 'DQ Chain', icon: Link2 },
        ],
      },
      {
        label: 'Scenarios',
        tabs: [{ id: 'perspectives', label: 'Perspectives', icon: Users }],
      },
      ...(analysis?.forgottenQuestions?.questions?.length
        ? [
            {
              label: 'Unknown Unknowns',
              tabs: [
                {
                  id: 'forgotten-questions' as const,
                  label: 'Forgotten Questions',
                  icon: HelpCircle,
                },
              ],
            },
          ]
        : []),
      ...(analysis?.intelligenceContext
        ? [
            {
              label: 'Context',
              tabs: [{ id: 'intelligence' as const, label: 'Intelligence', icon: Globe }],
            },
          ]
        : []),
      ...(document.fileType === 'application/pdf' ||
      document.filename?.toLowerCase().endsWith('.pdf')
        ? [
            {
              label: 'Document',
              tabs: [{ id: 'pdf-view' as const, label: 'PDF View', icon: FileText }],
            },
          ]
        : []),
    ];

  return (
    <div className="container" style={{ paddingBottom: 'var(--spacing-2xl)' }}>
      {/* Breadcrumbs (#11) */}
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Documents', href: '/dashboard?view=browse' },
          { label: document.filename },
        ]}
      />

      {/* Header */}
      <header style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-md">
            <Link href="/dashboard" className="btn btn-ghost p-2" aria-label="Back to dashboard">
              <ArrowLeft size={20} />
            </Link>
            <div style={{ minWidth: 0 }}>
              <h1
                style={{
                  /* Shared platform page-H1 token so this page feels
                     continuous with /dashboard, /projects, etc. rather
                     than reading as smaller/lighter. Token definition
                     lives in globals.css → --fs-page-h1-platform
                     (28-40px clamp). */
                  fontSize: 'var(--fs-page-h1-platform)',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.15,
                  color: 'var(--text-primary)',
                  margin: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                {document.filename}
                {document.isSample && <SampleBadge />}
              </h1>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 6,
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {formatDate(document.uploadedAt)} • {(document.fileSize / 1024).toFixed(1)} KB
                </span>
                {document.status === 'complete' && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--success)',
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: 'rgba(22,163,74,0.1)',
                      border: '1px solid rgba(22,163,74,0.25)',
                    }}
                  >
                    <CheckCircle size={11} /> Analyzed
                  </span>
                )}
                {analysis && <R2FBadge size="xs" compact />}
                {visibilityState && (
                  <DocumentVisibilityPill
                    visibility={visibilityState}
                    onClick={document.isOwner ? () => setShowVisibilityModal(true) : undefined}
                  />
                )}
                <LegalHoldStatusChip
                  documentId={document.id}
                  legalHoldId={document.legalHoldId ?? null}
                  legalHold={document.legalHold ?? null}
                  isOwner={!!document.isOwner}
                  onChanged={() => void refetchDocument()}
                />
                {/* "Log the outcome" pill — visible in the header for any
                    analysis older than 30 days that hasn't yet had its
                    outcome logged (B-#3 audit finding). The flywheel
                    is the load-bearing claim for "compounds quarter
                    over quarter"; if the user has to scroll past the
                    entire Analyst view to reach the reporter, the
                    flywheel never closes. The existing in-flow overdue
                    banner stays — this is the lower-stakes nudge that
                    fires earlier and is reachable from the header
                    without scrolling. */}
                {analysis &&
                  (() => {
                    const extra = analysis as unknown as {
                      outcomeStatus?: string;
                    };
                    if (extra.outcomeStatus === 'outcome_logged') return null;
                    const createdMs = new Date(analysis.createdAt).getTime();
                    const ageDays = (Date.now() - createdMs) / (1000 * 60 * 60 * 24);
                    if (Number.isNaN(ageDays) || ageDays < 30) return null;
                    const ageLabel =
                      ageDays >= 365 ? `${Math.floor(ageDays / 30)}mo` : `${Math.floor(ageDays)}d`;
                    return (
                      <a
                        href="#outcome-reporter"
                        onClick={e => {
                          e.preventDefault();
                          window.document
                            .querySelector('[data-outcome-reporter]')
                            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        title={`Log what actually happened — recalibrates DQI and closes the flywheel loop. Analysis is ${ageLabel} old.`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#B45309',
                          textDecoration: 'none',
                          padding: '3px 10px',
                          borderRadius: 999,
                          background: 'rgba(245, 158, 11, 0.1)',
                          border: '1px solid rgba(245, 158, 11, 0.32)',
                          letterSpacing: '0.02em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Log the outcome →
                        <span
                          style={{
                            fontSize: 10,
                            opacity: 0.7,
                            fontWeight: 500,
                          }}
                        >
                          {ageLabel}
                        </span>
                      </a>
                    );
                  })()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-md">
            {/* Conviction Score — complementary to DQI (shown in ExecutiveSummary hero) */}
            {analysis && <ConvictionBadge analysis={analysis} />}

            {/* Header actions grouped 2026-04-26 (Opus 4.6 audit) into:
                  PRIMARY (Share & Export — accent fill)
                  SECONDARY (Explain Score, Upload new version)
                  DANGER (Delete — separated by a visual divider).
                The 8-item flat row was cognitively overloading; the grouping
                gives the eye a hierarchy without rearranging the JSX wholesale. */}
            <div className="flex items-center gap-sm">
              {analysis && (
                <button
                  onClick={() => setShowShareModal(true)}
                  className="btn btn-primary btn-sm flex items-center gap-sm"
                  aria-label="Share and export"
                >
                  <Share2 size={14} />
                  Share & Export
                </button>
              )}
              {analysis && (
                <Link
                  href={`/dashboard/analytics?view=explainability&analysisId=${analysis.id}`}
                  className="btn btn-secondary btn-sm flex items-center gap-sm"
                  aria-label="Explain score"
                >
                  <Lightbulb size={14} />
                  Explain Score
                </Link>
              )}
              {/* DPR export — consolidated 2026-04-26 into the Share &
                  Export modal only. The standalone header button used a
                  different code path (/api/compliance/audit-packet vs the
                  modal's /api/documents/[id]/provenance-record + client-
                  side jsPDF) so two clicks produced two different PDFs.
                  Single source of truth now. */}
              <button
                onClick={() => versionFileInputRef.current?.click()}
                disabled={isUploadingVersion}
                className="btn btn-sm flex items-center gap-sm"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--accent-primary)',
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                  opacity: isUploadingVersion ? 0.6 : 1,
                }}
                aria-label="Upload new version"
                title="Upload a revised version of this memo. The new audit shows DQI delta + biases resolved/emerged."
              >
                {isUploadingVersion ? (
                  <Upload size={14} className="animate-pulse" />
                ) : (
                  <GitBranch size={14} />
                )}
                {isUploadingVersion ? 'Uploading…' : 'Upload new version'}
              </button>
              <input
                ref={versionFileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt,.md,.rtf"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) void handleVersionFilePicked(file);
                  // Reset so picking the same filename twice still fires onChange.
                  e.target.value = '';
                }}
              />
              {/* Danger action — separated by a vertical divider so it
                  reads as a different action class than the primary /
                  secondary cluster. */}
              <span
                aria-hidden
                style={{
                  width: 1,
                  height: 22,
                  background: 'var(--border-color)',
                  margin: '0 4px',
                }}
              />
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn btn-sm flex items-center gap-sm"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: 'var(--severity-high)',
                  fontWeight: 600,
                }}
                aria-label="Delete document"
                title="Soft-delete this document. Recoverable during the grace window; hard-purged after that."
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Calibration dual-score chip (M10 — visible flywheel).
            Renders under the header whenever an analysis exists; internally
            decides whether to show the calibrated score or the gamified
            unlock hint based on the org's confirmed-outcome sample size. */}
        {analysis?.compliance?.calibration && (
          <div
            style={{ marginTop: 'var(--spacing-sm)', display: 'flex', justifyContent: 'flex-end' }}
          >
            <CalibrationChip calibration={analysis.compliance.calibration} />
          </div>
        )}

        {/* Gradient accent line */}
        <div
          style={{
            height: '2px',
            marginTop: 'var(--spacing-md)',
            background: 'linear-gradient(90deg, var(--border-color), transparent)',
            borderRadius: '1px',
          }}
        />

        {/* Contextual actions */}
        {analysis && (
          <div className="flex items-center gap-sm" style={{ marginTop: 'var(--spacing-sm)' }}>
            <Link
              href={`/dashboard/compare?doc=${document.id}`}
              className="flex items-center gap-xs text-xs"
              style={{
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
            >
              <GitCompareArrows size={12} />
              Compare
            </Link>
            <Link
              href="/dashboard/analytics?view=library"
              className="flex items-center gap-xs text-xs"
              style={{
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
            >
              <BookOpen size={12} />
              Bias Library
            </Link>
          </div>
        )}
      </header>

      {/* Overdue outcome banner — prompts the user to close the flywheel loop
          by reporting what actually happened. The server's outcome-reminders
          cron flips outcomeStatus to 'outcome_overdue' past outcomeDueAt; we
          also flag early if dueAt is in the past but the cron hasn't run yet. */}
      {analysis &&
        (() => {
          const extra = analysis as unknown as {
            outcomeStatus?: string;
            outcomeDueAt?: string;
          };
          const dueDate = extra.outcomeDueAt ? new Date(extra.outcomeDueAt) : null;
          const isOverdue =
            extra.outcomeStatus === 'outcome_overdue' ||
            (extra.outcomeStatus === 'pending_outcome' &&
              dueDate !== null &&
              dueDate.getTime() < Date.now());
          if (!isOverdue) return null;
          return (
            <div
              className="mb-lg"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 12,
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: 'var(--text-primary)',
              }}
              role="status"
            >
              <AlertTriangle size={16} style={{ color: '#F59E0B', flexShrink: 0 }} />
              <div style={{ fontSize: 13, lineHeight: 1.5, flex: 1 }}>
                <strong style={{ fontWeight: 600 }}>Outcome due.</strong>{' '}
                {dueDate
                  ? `This decision was flagged for review on ${dueDate.toLocaleDateString()}. `
                  : 'This decision has passed its review date. '}
                Reporting the actual outcome recalibrates your DQI and sharpens future audits.
              </div>
              <a
                href="#outcome-reporter"
                onClick={e => {
                  e.preventDefault();
                  window.document
                    .querySelector('[data-outcome-reporter]')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#B45309',
                  textDecoration: 'none',
                  padding: '6px 12px',
                  borderRadius: 999,
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  background: 'rgba(255, 255, 255, 0.6)',
                  flexShrink: 0,
                }}
              >
                Report outcome →
              </a>
            </div>
          );
        })()}

      {versionUploadError && (
        <div
          role="alert"
          style={{
            padding: '8px 12px',
            background: 'var(--severity-high)10',
            border: '1px solid var(--severity-high)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--severity-high)',
            fontSize: 13,
            marginBottom: 12,
          }}
        >
          {versionUploadError}
        </div>
      )}

      {/* Document version chain — only renders when ≥2 versions exist. */}
      {document?.id && (
        <ErrorBoundary sectionName="Version history strip">
          <VersionHistoryStrip documentId={document.id} isOwner={!!document.isOwner} />
        </ErrorBoundary>
      )}

      {/* Cross-version delta — only renders when this analysis is linked
          to a predecessor via Analysis.previousAnalysisId. Quietly null when
          this is v1. The cast through `unknown` keeps TS happy while the
          new previousAnalysisId field propagates through the wider typed
          surfaces. */}
      {(() => {
        const prevId = (analysis as unknown as { previousAnalysisId?: string | null } | undefined)
          ?.previousAnalysisId;
        if (!analysis || !prevId) return null;
        return (
          <ErrorBoundary sectionName="Version delta card">
            <VersionDeltaCard
              current={{
                id: analysis.id,
                overallScore: analysis.overallScore,
                noiseScore: analysis.noiseScore,
                biases: biases.map(b => ({ biasType: b.biasType, severity: b.severity })),
              }}
              previousAnalysisId={prevId}
            />
          </ErrorBoundary>
        );
      })()}

      {/* Temporal phase scrub — sits above the Executive Summary since
          it frames the entire document view. Swapping phases swaps the
          body below (before = full analyst/cso/board; during = human
          decision panel; after = outcome + recalibrated DQI). */}
      {/* Phase scrubber renders only when viewMode === 'analyst' (the
          only mode that has during/after panels). Hiding it on cso/ic/
          board views — instead of the prior silent-snap-back-to-before
          behaviour — eliminates the blank-state combinations Opus 4.6
          flagged ("3 phases × 4 view modes = 12 cells, only 4 work").
          The auto-snap effect still fires on direct-URL ?phase=after
          loads so a stale link doesn't strand the user. */}
      {analysis && viewMode === 'analyst' && (
        <ErrorBoundary sectionName="Decision timeline phase scrub">
          <TimelinePhaseScrub phase={phase} onChange={setPhase} />
        </ErrorBoundary>
      )}

      {phaseResetNotice && (
        <div
          role="status"
          aria-live="polite"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '10px 14px',
            marginTop: 8,
            marginBottom: 16,
            borderRadius: 8,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            fontSize: 13,
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}
        >
          <span>
            Phase snapped to <strong style={{ color: 'var(--text-primary)' }}>Before</strong>.
            Switch to <strong style={{ color: 'var(--text-primary)' }}>Analyst</strong> view to
            explore During and After.
          </span>
          <button
            type="button"
            onClick={() => setPhaseResetNotice(false)}
            aria-label="Dismiss phase-reset notice"
            style={{
              flexShrink: 0,
              background: 'transparent',
              border: 'none',
              padding: 4,
              borderRadius: 4,
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Reference-class forecast — one-line "this memo resembles X of N
          historical cases, Y failed" above the Executive Summary. Null
          when the bias signature has no overlap with the seed corpus. */}
      {analysis && phase === 'before' && biases.length > 0 && (
        <ErrorBoundary sectionName="Reference-class forecast">
          <ReferenceClassChip biasTypes={biases.map(b => b.biasType)} />
        </ErrorBoundary>
      )}

      {/* Executive Summary */}
      {analysis && (
        <ErrorBoundary sectionName="Executive Summary">
          <div className="mb-xl">
            <ExecutiveSummary
              overallScore={analysis.overallScore}
              noiseScore={analysis.noiseScore}
              biasCount={biases.length}
              riskLevel={
                analysis.overallScore < 50
                  ? 'critical'
                  : analysis.overallScore < 70
                    ? 'high'
                    : analysis.overallScore < 85
                      ? 'medium'
                      : 'low'
              }
              summary={analysis.summary}
              verdict={
                analysis.overallScore > 80
                  ? 'APPROVED'
                  : analysis.overallScore < 60
                    ? 'REJECTED'
                    : 'MIXED'
              }
            />
          </div>
        </ErrorBoundary>
      )}

      {/* R²F decomposition — names the framework in-product so the moat
          is visible to the CSO and screenshottable for their board. */}
      {analysis && phase === 'before' && (
        <ErrorBoundary sectionName="R²F decomposition">
          <R2FDecompositionCard
            overallScore={analysis.overallScore}
            noiseScore={analysis.noiseScore}
            biasCount={biases.length}
          />
        </ErrorBoundary>
      )}

      {/* Featured Counterfactual — ROI hero card for the top-impact bias.
          Renders in every view (Analyst / CSO / Board). Null if backend has
          no scenarios or no positive-impact bias. */}
      {analysis && phase === 'before' && (
        <ErrorBoundary sectionName="Counterfactual Hero">
          <CounterfactualPanel analysisId={analysis.id} variant="featured" />
        </ErrorBoundary>
      )}

      {/* Phase: During — the human-decision record. Swap the analyst/cso/
          board surface for a dedicated panel that either shows the logged
          decision or prompts the user to log it. */}
      {analysis && phase === 'during' && (
        <ErrorBoundary sectionName="Phase: During panel">
          {/* Omit hasHumanDecision so the panel self-fetches the linked
              HumanDecision via /api/human-decisions?analysisId=… — wired
              2026-04-23 once the filter shipped. */}
          <PhaseDuringPanel documentId={resolvedParams.id} analysisId={analysis.id} />
        </ErrorBoundary>
      )}

      {/* Phase: After — outcome + recalibrated DQI + Brier + lessons.
          Pulls hasOutcome + recalibratedDqi off the analysis payload; the
          panel self-handles the "no outcome yet" stub. */}
      {analysis && phase === 'after' && (
        <ErrorBoundary sectionName="Phase: After panel">
          <PhaseAfterPanel
            documentId={resolvedParams.id}
            analysisId={analysis.id}
            hasOutcome={analysis.outcomeStatus === 'outcome_logged'}
            recalibratedDqi={
              (
                analysis as unknown as {
                  recalibratedDqi?: {
                    originalScore: number;
                    recalibratedScore: number;
                    delta: number;
                    recalibratedGrade: string;
                    brierScore?: number;
                    brierCategory?: 'excellent' | 'good' | 'fair' | 'poor';
                  };
                }
              ).recalibratedDqi
            }
            outcomeLabel={
              (
                analysis as unknown as {
                  outcome?: { outcome: string };
                }
              ).outcome?.outcome
            }
            lessonsLearned={
              (
                analysis as unknown as {
                  outcome?: { lessonsLearned?: string };
                }
              ).outcome?.lessonsLearned
            }
          />
        </ErrorBoundary>
      )}

      {/* View-as Toggle: Analyst / CSO / Board */}
      {analysis && phase === 'before' && (
        <div
          className="flex items-center justify-between mb-lg"
          style={{
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: 12,
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div
            className="flex items-center"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
            }}
            role="tablist"
            aria-label="View as"
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                padding: '0 12px',
                borderRight: '1px solid var(--border-color)',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              View as
            </span>
            {(
              [
                { key: 'analyst', label: 'Analyst', hint: 'Everything — every tab, every metric' },
                { key: 'cso', label: 'CSO', hint: 'Summary + DQI + top risk + recommended action' },
                {
                  key: 'ic',
                  label: 'IC',
                  hint: 'Pre-IC memo cover — predicted IC questions, structural assumptions, top risks, DPR',
                },
                { key: 'board', label: 'Board', hint: '2-page board-ready preview, inline' },
              ] as Array<{ key: ViewMode; label: string; hint: string }>
            ).map((opt, idx) => {
              const active = viewMode === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setViewMode(opt.key)}
                  role="tab"
                  aria-selected={active}
                  title={opt.hint}
                  style={{
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: active ? 600 : 500,
                    color: active ? 'var(--text-highlight)' : 'var(--text-muted)',
                    background: active ? 'var(--bg-elevated)' : 'transparent',
                    border: 'none',
                    borderLeft: idx === 0 ? 'none' : '1px solid var(--border-color)',
                    borderBottom: active
                      ? '2px solid var(--accent-primary)'
                      : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {viewMode === 'analyst'
              ? 'Full analyst view — every surface'
              : viewMode === 'cso'
                ? 'Condensed for the Chief Strategy Officer'
                : viewMode === 'ic'
                  ? 'Pre-IC memo cover — what your committee reads first'
                  : 'Board-ready report — export as PDF above'}
          </span>
        </div>
      )}

      {/* CSO View: Red Flags → Predicted Questions → Recommendation → CTAs.
          The shared hero above (ExecutiveSummary + featured counterfactual)
          already handles the DQI top-line, so CSO focuses on what an exec
          actually walks into the meeting with: the risks, the expected
          objections, and a clear "proceed / caution / review" verdict. */}
      {analysis && viewMode === 'cso' && phase === 'before' && (
        <div className="mb-xl" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <LiveRedFlagsAlert biases={biases} onSelect={bias => setSelectedBias(bias)} />

          <LivePredictedQuestions
            biases={biases}
            summary={analysis.summary}
            topRecommendation={biases[0]?.suggestion}
          />

          {/* Recommendation verdict card */}
          <div
            className="card animate-fade-in"
            style={{
              borderLeft: `4px solid ${
                analysis.overallScore > 80
                  ? 'var(--accent-primary)'
                  : analysis.overallScore > 60
                    ? 'var(--warning)'
                    : 'var(--error)'
              }`,
              marginBottom: 32,
            }}
          >
            <div className="card-body" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color:
                      analysis.overallScore > 80
                        ? 'var(--accent-primary)'
                        : analysis.overallScore > 60
                          ? 'var(--warning)'
                          : 'var(--error)',
                  }}
                >
                  Recommendation ·{' '}
                  {analysis.simulation?.overallVerdict ||
                    (analysis.overallScore > 80
                      ? 'Proceed'
                      : analysis.overallScore > 60
                        ? 'Proceed with caution'
                        : 'Review required')}
                </span>
              </div>
              <p
                style={{
                  fontSize: 15,
                  color: 'var(--text-primary)',
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                {analysis.summary}
              </p>
            </div>
          </div>

          {/* Deep Dive CTA — lateral switchers */}
          <div className="flex items-center justify-center gap-md" style={{ flexWrap: 'wrap' }}>
            <button
              onClick={() => setViewMode('analyst')}
              className="btn btn-ghost flex items-center gap-sm"
              style={{ fontSize: 13 }}
            >
              View Full Analysis →
            </button>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>or</span>
            <button
              onClick={() => setViewMode('board')}
              className="btn btn-secondary flex items-center gap-sm"
              style={{ fontSize: 13 }}
            >
              View Board-Ready Report →
            </button>
          </div>
        </div>
      )}

      {/* IC View: Pre-IC memo cover. Order: predicted IC questions →
          structural assumptions (Dalio overlay) → top risks for IC review →
          DPR-prominence verdict card. The ExecutiveSummary + DQI hero +
          featured CounterfactualPanel above this block already cover the
          "thesis + DQI + counterfactual" beats; this block adds the IC-
          specific surfaces a fund analyst expects to see when prepping a
          memo cover. */}
      {analysis && viewMode === 'ic' && phase === 'before' && (
        <div className="mb-xl" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <LivePredictedQuestions
            biases={biases}
            summary={analysis.summary}
            topRecommendation={biases[0]?.suggestion}
          />

          {/* Structural assumptions — the Dalio overlay every IC reader cares about */}
          <ErrorBoundary sectionName="IC structural assumptions">
            <StructuralAssumptionsPanel
              analysisId={analysis.id}
              autoRun={true}
              marketContext={
                analysis.marketContextOverride
                  ? {
                      context: analysis.marketContextOverride.context,
                      cagrCeiling: analysis.marketContextOverride.cagrCeiling,
                      overridden: true,
                    }
                  : analysis.marketContextApplied
                    ? {
                        context: analysis.marketContextApplied.context,
                        cagrCeiling: analysis.marketContextApplied.cagrCeiling,
                      }
                    : undefined
              }
            />
          </ErrorBoundary>

          <LiveRedFlagsAlert biases={biases} onSelect={bias => setSelectedBias(bias)} />

          {/* DPR-prominence card: an IC reader cares whether they can carry the
              Decision Provenance Record into the meeting (and forward it to LPs
              after the outcome lands). Make the export action the primary
              right-side CTA so it does not get lost in the export-modal labyrinth. */}
          <div
            className="card animate-fade-in"
            style={{
              borderLeft: '4px solid var(--accent-primary)',
              marginBottom: 8,
            }}
          >
            <div
              className="card-body"
              style={{
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1, minWidth: 280 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: 'var(--accent-primary)',
                    marginBottom: 6,
                  }}
                >
                  Pre-IC packet · Decision Provenance Record
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: 6,
                  }}
                >
                  Carry this audit into the IC, then forward to your LPs after the outcome lands.
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    margin: 0,
                    lineHeight: 1.55,
                  }}
                >
                  The DPR is hashed and tamper-evident, aligned with EU AI Act Art. 14, GDPR Art.
                  22, NDPR Art. 12, and 14 other regulatory frameworks. The same artefact your GC
                  walks into the audit committee with.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={handleProvenanceRecordExport}
                  className="btn btn-primary flex items-center gap-sm"
                  style={{ fontSize: 13 }}
                >
                  Export DPR (PDF)
                </button>
                <button
                  onClick={() => setViewMode('analyst')}
                  className="btn btn-ghost flex items-center gap-sm"
                  style={{ fontSize: 13 }}
                >
                  View Full Analysis →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === Board View: inline 2-page preview of the board-ready PDF === */}
      {analysis && viewMode === 'board' && phase === 'before' && (
        <ErrorBoundary sectionName="Board Report View">
          <BoardReportView
            title={document.filename.replace(/\.[^.]+$/, '')}
            overallScore={analysis.overallScore}
            summary={analysis.summary}
            biases={biases}
            simulation={
              analysis.simulation as
                | {
                    twins?: Array<{
                      name: string;
                      role: string;
                      vote: string;
                      confidence: number;
                      rationale: string;
                    }>;
                  }
                | undefined
            }
            exporting={isExportingBoardView}
            confidential={isBoardConfidential}
            onToggleConfidential={() => setIsBoardConfidential(prev => !prev)}
            onExportPdf={async () => {
              setIsExportingBoardView(true);
              try {
                await handleBoardReportExport();
              } catch {
                // handleBoardReportExport surfaces its own toast on failure — silent here is intentional per CLAUDE.md fire-and-forget exceptions.
              } finally {
                setIsExportingBoardView(false);
              }
            }}
          />
        </ErrorBoundary>
      )}

      {/* === Analyst (full) Analysis View === */}
      {viewMode === 'analyst' && phase === 'before' && (
        <>
          {/* Bias Network Map */}
          {analysis && biases.length > 0 && (
            <div className="mb-xl">
              <ErrorBoundary sectionName="Bias Network">
                <div className="card">
                  <div
                    className="card-header"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '18px 20px',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <Brain size={16} style={{ color: 'var(--accent-primary)' }} />
                      Bias Network Map
                    </h3>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Interactive &middot; Click nodes to explore
                    </span>
                  </div>
                  <div className="card-body">
                    <BiasNetwork
                      biases={biases.map(b => ({
                        ...b,
                        category: 'cognitive',
                      }))}
                      onBiasClick={biasType => {
                        const bias = biases.find(b => b.biasType === biasType);
                        if (bias) setSelectedBias(bias);
                      }}
                    />
                  </div>
                </div>
              </ErrorBoundary>
            </div>
          )}

          {/* Decision Prior — capture or display */}
          {analysis && !priorLoading && (
            <div className="mb-lg">
              {prior ? (
                <PostAnalysisPrior
                  analysisId={analysis.id}
                  prior={prior}
                  onUpdated={beliefDelta => {
                    setPrior(prev =>
                      prev ? { ...prev, beliefDelta, postAnalysisAction: 'updated' } : prev
                    );
                  }}
                />
              ) : (
                <DecisionPriorCapture
                  analysisId={analysis.id}
                  onPriorSaved={savedPrior => {
                    setPrior({
                      analysisId: analysis.id,
                      defaultAction: savedPrior.defaultAction,
                      confidence: savedPrior.confidence,
                    });
                  }}
                />
              )}
            </div>
          )}

          {/* Outcome Timeframe Picker — set when to review */}
          {analysis && (
            <div className="mb-lg">
              <OutcomeTimeframePicker
                analysisId={analysis.id}
                currentDueAt={(analysis as unknown as { outcomeDueAt?: string }).outcomeDueAt}
              />
            </div>
          )}

          {/* Auto-Detected Outcome (Draft) */}
          {analysis && (
            <div className="mb-lg">
              <DraftOutcomeCard analysisId={analysis.id} />
            </div>
          )}

          {/* Decision Outcome Tracker */}
          {analysis && (
            <div className="mb-lg" data-outcome-reporter>
              <OutcomeReporter
                analysisId={analysis.id}
                analysisDate={analysis.createdAt}
                biases={biases}
                twins={analysis.simulation?.twins}
              />
            </div>
          )}

          {/* Learning Flywheel — what the org learned from this decision */}
          {analysis && (
            <div className="mb-lg">
              <LearningImpactCard analysisId={analysis.id} />
            </div>
          )}

          {/* What-If Intervention Panel — causal do-calculus */}
          {analysis && biases.length > 0 && (
            <div className="mb-lg">
              <InterventionPanel analysisId={analysis.id} biases={biases} />
            </div>
          )}

          {/* MetaVerdict — adversarial analysis */}
          {analysis?.metaVerdict && (
            <ErrorBoundary sectionName="MetaVerdict">
              <MetaVerdictPanel verdict={analysis.metaVerdict} />
            </ErrorBoundary>
          )}

          {/* Toxic Combinations — compound risk detection */}
          {toxicCombinations.length > 0 && (
            <div className="mb-lg">
              <ToxicCombinationCard
                combinations={toxicCombinations}
                onAcknowledge={async id => {
                  const res = await fetch('/api/toxic-combinations', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, status: 'acknowledged' }),
                  });
                  if (res.ok) {
                    setToxicCombinations(prev =>
                      prev.map(c => (c.id === id ? { ...c, status: 'acknowledged' } : c))
                    );
                  }
                }}
                onMitigate={async (id, notes) => {
                  const res = await fetch('/api/toxic-combinations', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, status: 'mitigated', mitigationNotes: notes }),
                  });
                  if (res.ok) {
                    setToxicCombinations(prev =>
                      prev.map(c =>
                        c.id === id ? { ...c, status: 'mitigated', mitigationNotes: notes } : c
                      )
                    );
                  }
                }}
              />
            </div>
          )}

          {/* Decision Room — collaborative blind priors */}
          {document && (
            <div className="mb-lg">
              <DecisionRoomList documentId={document.id} analysisId={analysis?.id} />
            </div>
          )}

          {/* S-1 Decision Scorecard — consolidates SimilarDecisionsBanner +
              RiskScoreCard + ActOnThisPanel into ONE card with three internal
              sections. Reduces above-fold card count from 11 → 9 and unifies
              the mental model: "score → history → next step" as one artifact. */}
          {analysis && (
            <div className="mb-lg">
              <DecisionScorecard
                analysisId={analysis.id}
                biases={analysis.biases ?? []}
                documentType={document.documentType ?? null}
              />
            </div>
          )}

          {/* M7 — Dr. Red Team. The dissent without the social cost.
              User-invoked: does nothing until clicked. When clicked, generates
              a signature adversarial response against the decision's weakest
              load-bearing assumption. */}
          {analysis && (
            <div className="mb-lg">
              <DrRedTeamCard analysisId={analysis.id} />
            </div>
          )}

          {/* Related Decisions — knowledge graph connections */}
          {analysis && (
            <div className="mb-lg">
              <RelatedDecisions analysisId={analysis.id} />
            </div>
          )}

          {/* Graph-Powered Recommendations */}
          {analysis && (
            <div className="mb-lg">
              <RecommendationsPanel analysisId={analysis.id} />
            </div>
          )}

          {/* Re-scan Button */}
          <div className="flex justify-end gap-md mb-lg">
            <button
              onClick={runLiveScan}
              disabled={isScanning}
              className="btn btn-primary flex items-center gap-sm"
            >
              {isScanning ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              Run Live Audit
            </button>
          </div>

          {/* Live Scan Feed — only shown while actively scanning or when logs exist.
              The executive summary renders above in the shared ExecutiveSummary hero, so
              we don't duplicate it here. */}
          {(isScanning || streamLogs.length > 0) && (
            <div className="mb-xl">
              <div className="card animate-fade-in" style={{ background: 'var(--bg-card)' }}>
                <div
                  className="card-header"
                  style={{ background: 'var(--bg-secondary)', padding: '18px 20px' }}
                >
                  <h3 className="flex items-center gap-sm text-xs">
                    <Terminal size={14} /> Live Scan Feed
                  </h3>
                </div>
                <div
                  className="card-body"
                  style={{
                    padding: 'var(--spacing-md)',
                    fontSize: '10px',
                    maxHeight: '260px',
                    overflowY: 'auto',
                    fontFamily: 'monospace',
                  }}
                >
                  {isScanning && (
                    <div className="mb-md">
                      <div className="progress-bar" style={{ marginBottom: '4px' }}>
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${scanProgress}%` }}
                          role="progressbar"
                          aria-valuenow={scanProgress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                      </div>
                      <div className="text-muted">Progress: {scanProgress}%</div>
                    </div>
                  )}
                  {streamLogs.map((log, i) => (
                    <div
                      key={i}
                      style={{
                        marginBottom: '4px',
                        color:
                          log.type === 'bias'
                            ? 'var(--error)'
                            : log.type === 'success'
                              ? 'var(--success)'
                              : 'var(--text-secondary)',
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)' }}>[{log.ts}]</span> {log.msg}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Financial Fact Check */}
          {analysis?.factCheck && (
            <ErrorBoundary sectionName="Financial Fact Check">
              <div className="card mb-xl animate-fade-in" style={{ animationDelay: '0.5s' }}>
                <div className="card-header flex items-center justify-between">
                  <h3 className="flex items-center gap-sm">
                    <CheckCircle size={18} style={{ color: 'var(--accent-primary)' }} />
                    Financial Fact Check
                    {(analysis.factCheck.primaryCompany || analysis.factCheck.primaryTopic) && (
                      <span
                        className="badge badge-secondary"
                        style={{ marginLeft: '8px', fontSize: '10px' }}
                      >
                        {analysis.factCheck.primaryCompany
                          ? `${analysis.factCheck.primaryCompany.name} (${analysis.factCheck.primaryCompany.ticker})`
                          : analysis.factCheck.primaryTopic}
                      </span>
                    )}
                  </h3>
                  {analysis.factCheck.dataFetchedAt && (
                    <span className="text-xs text-muted">
                      Data fetched: {formatDate(analysis.factCheck.dataFetchedAt, true)}
                    </span>
                  )}
                </div>
                {analysis.factCheck.searchSources &&
                  analysis.factCheck.searchSources.length > 0 && (
                    <div
                      style={{
                        padding: '12px 16px',
                        background: 'var(--bg-card)',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      <div
                        className="flex items-center gap-sm"
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          marginBottom: '8px',
                          color: 'var(--accent-primary)',
                        }}
                      >
                        <FileText size={12} />
                        Verified with Google Search Grounding
                      </div>
                      <div className="flex flex-wrap gap-sm">
                        {analysis.factCheck.searchSources.map((source, i) => {
                          try {
                            return (
                              <a
                                key={i}
                                href={source}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="badge hover:opacity-80 transition-opacity"
                                style={{
                                  textDecoration: 'none',
                                  background: 'var(--bg-card)',
                                  border: '1px solid var(--border-color)',
                                  color: 'var(--text-primary)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  maxWidth: '100%',
                                }}
                              >
                                <span style={{ opacity: 0.7 }}>Source {i + 1}:</span>
                                <span style={{ fontWeight: 500 }}>{new URL(source).hostname}</span>
                              </a>
                            );
                          } catch {
                            // Malformed URL from search source — skip silently per CLAUDE.md fire-and-forget exceptions (fallback to no-render).
                            return null;
                          }
                        })}
                      </div>
                    </div>
                  )}
                <div className="card-body" style={{ padding: 0 }}>
                  {analysis.factCheck.verifications &&
                  analysis.factCheck.verifications.length > 0 ? (
                    analysis.factCheck.verifications.map((v, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '16px',
                          borderBottom:
                            idx < (analysis.factCheck?.verifications?.length || 0) - 1
                              ? '1px solid var(--border-color)'
                              : 'none',
                        }}
                      >
                        <div className="flex items-start gap-md">
                          <div style={{ marginTop: '2px' }}>
                            {v.verdict?.toUpperCase() === 'VERIFIED' ? (
                              <CheckCircle
                                size={16}
                                style={{ color: 'var(--success)' }}
                                aria-label="Verified"
                              />
                            ) : v.verdict?.toUpperCase() === 'CONTRADICTED' ? (
                              <AlertTriangle
                                size={16}
                                style={{ color: 'var(--error)' }}
                                aria-label="Contradicted"
                              />
                            ) : (
                              <Info
                                size={16}
                                style={{ color: 'var(--warning)' }}
                                aria-label="Unverifiable"
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <p
                              style={{
                                fontSize: '13px',
                                fontWeight: 500,
                                marginBottom: '4px',
                                color: 'var(--text-primary)',
                              }}
                            >
                              &quot;{v.claim}&quot;
                            </p>
                            <div
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                marginBottom: '6px',
                                color:
                                  v.verdict?.toUpperCase() === 'VERIFIED'
                                    ? 'var(--success)'
                                    : v.verdict?.toUpperCase() === 'CONTRADICTED'
                                      ? 'var(--error)'
                                      : 'var(--warning)',
                              }}
                            >
                              {v.verdict?.toUpperCase()}
                            </div>
                            <p
                              style={{
                                fontSize: '12px',
                                color: 'var(--text-secondary)',
                                lineHeight: 1.5,
                                marginBottom: '8px',
                              }}
                            >
                              {v.explanation}
                            </p>
                            {v.sourceUrl && (
                              <a
                                href={v.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-xs text-[10px]"
                                style={{ color: 'var(--accent-primary)' }}
                              >
                                <FileText size={10} />
                                Evidence Source:{' '}
                                {(() => {
                                  try {
                                    return new URL(v.sourceUrl).hostname;
                                  } catch {
                                    return 'External Source';
                                  }
                                })()}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-xl text-center text-muted">
                      <p>No specific financial claims were isolated for verification.</p>
                    </div>
                  )}
                </div>
              </div>
            </ErrorBoundary>
          )}

          {/* Toxic Combination Alert Banner */}
          {toxicCombinations.length > 0 && <ToxicAlertBanner combinations={toxicCombinations} />}

          {/* Key Findings Summary Bar */}
          {analysis && (
            <div
              className="grid grid-cols-2 md:grid-cols-4 gap-lg mb-xl"
              style={{ marginTop: toxicCombinations.length > 0 ? 0 : 'var(--spacing-md)' }}
            >
              <div className="card" style={{ padding: '20px 24px', borderRadius: 12 }}>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Decision Quality
                </div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                    color:
                      analysis.overallScore >= 70
                        ? '#34d399'
                        : analysis.overallScore >= 40
                          ? '#fbbf24'
                          : '#f87171',
                  }}
                >
                  {Math.round(analysis.overallScore)}
                  <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)' }}>
                    /100
                  </span>
                </div>
              </div>

              <div className="card" style={{ padding: '20px 24px', borderRadius: 12 }}>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Biases Found
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span
                    style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      fontFamily: "'JetBrains Mono', monospace",
                      color:
                        biases.length === 0
                          ? '#34d399'
                          : biases.length <= 3
                            ? '#fbbf24'
                            : '#f87171',
                    }}
                  >
                    {biases.length}
                  </span>
                  {biases.length > 0 && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {biases.filter(b => b.severity === 'high' || b.severity === 'critical')
                        .length > 0
                        ? `${biases.filter(b => b.severity === 'high' || b.severity === 'critical').length} high severity`
                        : 'low-medium severity'}
                    </span>
                  )}
                </div>
              </div>

              <div className="card" style={{ padding: '20px 24px', borderRadius: 12 }}>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Noise Score
                </div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                    color:
                      analysis.noiseScore <= 30
                        ? '#34d399'
                        : analysis.noiseScore <= 60
                          ? '#fbbf24'
                          : '#f87171',
                  }}
                >
                  {Math.round(analysis.noiseScore)}
                  <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)' }}>
                    /100
                  </span>
                </div>
              </div>

              <div className="card" style={{ padding: '20px 24px', borderRadius: 12 }}>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Risk Alerts
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span
                    style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      fontFamily: "'JetBrains Mono', monospace",
                      color:
                        toxicCombinations.length === 0
                          ? '#34d399'
                          : toxicCombinations.length <= 2
                            ? '#fbbf24'
                            : '#f87171',
                    }}
                  >
                    {toxicCombinations.length}
                  </span>
                  {toxicCombinations.length > 0 && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      toxic combination{toxicCombinations.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tabs + Content */}
          <div
            className="grid doc-detail-main-grid"
            style={{ gridTemplateColumns: '1fr 380px', gap: 'var(--spacing-xl)' }}
          >
            <div className="flex flex-col gap-lg">
              {/* Tab Bar with group labels */}
              <div
                className="flex flex-wrap items-end gap-0 mb-lg doc-detail-tab-bar"
                role="tablist"
                aria-label="Analysis tabs"
                style={{
                  borderBottom: '1px solid var(--border-color)',
                  borderRadius: '8px 8px 0 0',
                  overflow: 'hidden',
                }}
              >
                {TAB_GROUPS.map((group, gi) => (
                  <div key={group.label} className="flex items-end">
                    {gi > 0 && (
                      <div
                        style={{
                          width: 1,
                          height: 24,
                          background: 'var(--border-color)',
                          margin: '0 4px',
                          alignSelf: 'center',
                        }}
                      />
                    )}
                    <div className="flex flex-col">
                      {group.label !== 'Overview' && (
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            padding: '0 16px 2px',
                            userSelect: 'none',
                          }}
                        >
                          {group.label}
                        </span>
                      )}
                      <div className="flex">
                        {group.tabs.map(tab => (
                          <button
                            key={tab.id}
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            aria-controls={`tabpanel-${tab.id}`}
                            onClick={() => handleTabChange(tab.id)}
                            className="flex items-center gap-sm text-sm font-medium transition-colors -mb-px"
                            style={
                              activeTab === tab.id
                                ? {
                                    padding: '10px 18px',
                                    background: 'var(--bg-card)',
                                    color: 'var(--text-primary)',
                                    borderBottom: '2px solid var(--accent-primary)',
                                    borderRadius: '8px 8px 0 0',
                                  }
                                : {
                                    padding: '10px 18px',
                                    color: 'var(--text-muted)',
                                    background: 'transparent',
                                    borderBottom: '2px solid transparent',
                                    borderRadius: '8px 8px 0 0',
                                  }
                            }
                          >
                            <tab.icon size={14} />
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tab Panels (lazy loaded, each wrapped in ErrorBoundary) */}
              <div role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={activeTab}>
                <Suspense fallback={<CardSkeleton lines={5} />}>
                  {activeTab === 'overview' && (
                    <ErrorBoundary sectionName="Overview">
                      <OverviewTab
                        documentContent={document.content}
                        documentId={document.id}
                        biases={biases}
                        uploadedAt={document.uploadedAt}
                        analysisCreatedAt={analysis?.createdAt}
                        analysisId={analysis?.id}
                        compoundAdjustments={analysis?.compliance?.compoundScoring?.adjustments}
                        recognitionCues={analysis?.recognitionCues}
                        narrativePreMortem={analysis?.narrativePreMortem}
                        dealSector={document.deal?.sector ?? null}
                        dealTicketSize={document.deal?.ticketSize ?? null}
                        marketContextApplied={analysis?.marketContextApplied}
                        marketContextOverride={analysis?.marketContextOverride ?? null}
                        onMarketContextChanged={() => void refetchDocument()}
                        isOwner={!!document.isOwner}
                      />
                    </ErrorBoundary>
                  )}
                  {activeTab === 'evidence' && analysis && (
                    <ErrorBoundary sectionName="Evidence">
                      <EvidenceTab
                        analysisData={{
                          overallScore: analysis.overallScore,
                          noiseScore: analysis.noiseScore,
                          summary: analysis.summary,
                          biases: biases.map(b => ({
                            biasType: b.biasType,
                            found: true,
                            severity: b.severity as 'low' | 'medium' | 'high' | 'critical',
                            excerpt: b.excerpt,
                            explanation: b.explanation,
                            suggestion: b.suggestion,
                          })),
                          ...(analysis.noiseStats
                            ? {
                                noiseStats: analysis.noiseStats as {
                                  mean: number;
                                  stdDev: number;
                                  variance: number;
                                },
                              }
                            : {}),
                          ...(analysis.factCheck
                            ? {
                                factCheck: analysis.factCheck as {
                                  score: number;
                                  flags: string[];
                                  verifications?: Array<{
                                    claim: string;
                                    verdict: 'VERIFIED' | 'CONTRADICTED' | 'UNVERIFIABLE';
                                    explanation: string;
                                  }>;
                                },
                              }
                            : {}),
                          ...(analysis.compliance
                            ? {
                                compliance:
                                  analysis.compliance as import('@/types').ComplianceResult,
                              }
                            : {}),
                          ...(analysis.logicalAnalysis
                            ? {
                                logicalAnalysis:
                                  analysis.logicalAnalysis as import('@/types').LogicalAnalysisResult,
                              }
                            : {}),
                          ...(analysis.swotAnalysis
                            ? {
                                swotAnalysis:
                                  analysis.swotAnalysis as import('@/types').SwotAnalysisResult,
                              }
                            : {}),
                          ...(analysis.simulation
                            ? {
                                simulation:
                                  analysis.simulation as import('@/types').SimulationResult,
                              }
                            : {}),
                          ...(analysis.cognitiveAnalysis
                            ? {
                                cognitiveAnalysis:
                                  analysis.cognitiveAnalysis as import('@/types').CognitiveAnalysisResult,
                              }
                            : {}),
                        }}
                        logicalAnalysis={analysis?.logicalAnalysis}
                        outcome={
                          analysis?.outcomeStatus === 'outcome_logged'
                            ? (
                                analysis as unknown as {
                                  outcome?: {
                                    outcome: string;
                                    confirmedBiases: string[];
                                    falsePositiveBiases: string[];
                                    lessonsLearned?: string;
                                    notes?: string;
                                    impactScore?: number;
                                    mostAccurateTwin?: string;
                                  };
                                }
                              ).outcome
                            : null
                        }
                        recalibratedDqi={
                          (
                            analysis as unknown as {
                              recalibratedDqi?: {
                                originalScore: number;
                                recalibratedScore: number;
                                delta: number;
                                recalibratedGrade: string;
                                brierScore?: number;
                                brierCategory?: 'excellent' | 'good' | 'fair' | 'poor';
                              };
                            }
                          ).recalibratedDqi
                        }
                      />
                    </ErrorBoundary>
                  )}
                  {activeTab === 'swot' && (
                    <ErrorBoundary sectionName="SWOT Analysis">
                      <SwotTab swotAnalysis={analysis?.swotAnalysis} />
                    </ErrorBoundary>
                  )}
                  {activeTab === 'noise' && analysis && (
                    <ErrorBoundary sectionName="Noise Analysis">
                      <NoiseTab
                        noiseScore={analysis.noiseScore}
                        noiseStats={analysis.noiseStats}
                        noiseBenchmarks={analysis.noiseBenchmarks}
                      />
                    </ErrorBoundary>
                  )}
                  {activeTab === 'dq-chain' && (
                    <ErrorBoundary sectionName="Decision Quality Chain">
                      <DQChainTab dqChain={dqChain} />
                    </ErrorBoundary>
                  )}
                  {activeTab === 'perspectives' && (
                    <ErrorBoundary sectionName="Perspectives">
                      <PerspectivesTab
                        analysisId={analysis?.id}
                        cognitiveAnalysis={analysis?.cognitiveAnalysis}
                        preMortem={analysis?.preMortem}
                        simulation={analysis?.simulation}
                        hasOutcome={analysis?.outcomeStatus === 'outcome_logged'}
                        documentContent={document.content}
                        documentId={document.id}
                        originalScore={analysis?.overallScore}
                        originalNoiseScore={analysis?.noiseScore}
                        originalBiasCount={biases.length}
                        originalBiasTypes={biases.map(b => b.biasType)}
                      />
                    </ErrorBoundary>
                  )}
                  {activeTab === 'intelligence' && (
                    <ErrorBoundary sectionName="Intelligence Context">
                      <IntelligenceTab intelligenceContext={analysis?.intelligenceContext} />
                    </ErrorBoundary>
                  )}
                  {activeTab === 'forgotten-questions' && (
                    <ErrorBoundary sectionName="Forgotten Questions">
                      <ForgottenQuestionsTab
                        forgottenQuestions={analysis?.forgottenQuestions}
                        analysisId={analysis?.id}
                      />
                    </ErrorBoundary>
                  )}
                  {activeTab === 'pdf-view' && (
                    <ErrorBoundary sectionName="PDF Viewer">
                      <BiasAnnotatedPDFViewer documentId={document.id} biases={biases} />
                    </ErrorBoundary>
                  )}
                </Suspense>
              </div>
            </div>

            {/* Right Column: Bias Sidebar */}
            <ErrorBoundary sectionName="Bias Sidebar">
              <div className="flex flex-col gap-xl">
                <div className="card" style={{ borderRadius: 12 }}>
                  <div
                    className="card-body p-md flex justify-around"
                    style={{ padding: '20px 24px' }}
                  >
                    <div className="text-center">
                      <div
                        style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}
                      >
                        Decision Quality
                      </div>
                      <div style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>
                        {analysis ? Math.round(analysis.overallScore) : '--'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div
                        style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}
                      >
                        Noise Score
                      </div>
                      <div style={{ color: 'var(--accent-secondary)', fontWeight: 700 }}>
                        {analysis ? Math.round(analysis.noiseScore) : '--'}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="card"
                  style={{ alignSelf: 'start', width: '100%', borderRadius: 12 }}
                >
                  <div className="card-header" style={{ padding: '18px 20px' }}>
                    <h3>Detected Biases</h3>
                  </div>
                  <div
                    style={{ maxHeight: '60vh', overflowY: 'auto' }}
                    role="list"
                    aria-label="Detected biases"
                  >
                    {biases.length > 0 ? (
                      biases.map((bias, _idx) => (
                        <div
                          key={bias.id}
                          role="listitem"
                          tabIndex={0}
                          onClick={() => setSelectedBias(bias)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedBias(bias);
                            }
                          }}
                          style={{
                            padding: '12px 16px',
                            margin: '6px 8px',
                            borderRadius: 8,
                            cursor: 'pointer',
                            background:
                              selectedBias?.id === bias.id ? 'var(--bg-card)' : 'transparent',
                            borderLeft:
                              selectedBias?.id === bias.id
                                ? '3px solid var(--accent-primary)'
                                : '3px solid transparent',
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span style={{ fontWeight: 500, fontSize: '13px' }}>
                              {formatBiasName(bias.biasType)}
                            </span>
                            <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                          </div>
                          <div
                            className="flex items-center gap-xs"
                            style={{ marginTop: 'var(--spacing-xs)' }}
                          >
                            <span
                              className={`badge badge-${bias.severity}`}
                              style={{ fontSize: '9px' }}
                            >
                              {bias.severity}
                              <span className="sr-only"> severity</span>
                            </span>
                            {bias.confidence != null && (
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                {Math.round(bias.confidence * 100)}%
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-xl text-center text-muted text-xs">No data available</div>
                    )}
                  </div>
                </div>

                {/* Noise Tax ROI Projection */}
                {analysis && (
                  <NoiseTaxCard
                    overallScore={analysis.overallScore}
                    noiseScore={analysis.noiseScore}
                    biasCount={biases.length}
                  />
                )}
              </div>
            </ErrorBoundary>
          </div>
        </>
      )}

      {/* Bias Detail Modal (accessible) */}
      {selectedBias && (
        <BiasDetailModal
          bias={selectedBias}
          biases={biases}
          currentIndex={selectedBiasIndex}
          onClose={() => setSelectedBias(null)}
          onNavigate={setSelectedBias}
        />
      )}

      {/* No biases celebration */}
      {biases.length === 0 && analysis && (
        <div className="card animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div
            className="card-body flex flex-col items-center gap-md"
            style={{ padding: 'var(--spacing-2xl)' }}
          >
            <CheckCircle size={64} style={{ color: 'var(--success)' }} />
            <h3 style={{ color: 'var(--success)' }}>No Cognitive Biases Detected!</h3>
            <p style={{ textAlign: 'center', maxWidth: 500 }}>
              This document appears to demonstrate sound decision-making practices without
              significant cognitive bias patterns.
            </p>
          </div>
        </div>
      )}

      {/* Regulatory & Institutional Memory Widgets */}
      {analysis?.compliance && (
        <ErrorBoundary sectionName="Regulatory Horizon">
          <div className="mb-xl">
            <RegulatoryHorizonWidget compliance={analysis.compliance} />
          </div>
        </ErrorBoundary>
      )}
      {analysis?.compliance &&
        (analysis.compliance.compoundScoring || analysis.compliance.bayesianPriors) && (
          <ErrorBoundary sectionName="Scoring Breakdown">
            <div className="mb-xl">
              <ScoringBreakdown
                compoundScoring={analysis.compliance.compoundScoring}
                bayesianPriors={analysis.compliance.bayesianPriors}
                overallScore={analysis.overallScore}
              />
            </div>
          </ErrorBoundary>
        )}
      {analysis?.institutionalMemory && (
        <ErrorBoundary sectionName="Institutional Memory">
          <div className="mb-xl">
            <InstitutionalMemoryWidget memory={analysis.institutionalMemory} />
          </div>
        </ErrorBoundary>
      )}

      {/* Share & Export Modal */}
      {analysis && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          documentName={document.filename}
          analysisId={analysis.id}
          analysisData={{
            overallScore: analysis.overallScore,
            noiseScore: analysis.noiseScore,
            summary: analysis.summary,
          }}
          onExportPdf={handleExport}
          onExportBoardReport={handleBoardReportExport}
          onExportHallwayBrief={handleHallwayBriefExport}
          onExportProvenanceRecord={handleProvenanceRecordExport}
          onExportCsv={handleCsvExport}
          onExportMarkdown={handleMarkdownExport}
          onExportJson={handleJsonExport}
        />
      )}

      {/* Document visibility (3.5) — owner-only modal. */}
      {document.isOwner && (
        <DocumentVisibilityModal
          documentId={document.id}
          isOpen={showVisibilityModal}
          onClose={() => setShowVisibilityModal(false)}
          onSaved={vis => setVisibilityState(vis)}
        />
      )}

      {analysis && <ReportOutcomeFab outcomeStatus={analysis.outcomeStatus} phase={phase} />}

      {/* Delete confirmation — soft-delete with grace-window framing.
          Hard-purge happens later via the enforce-retention cron, never
          synchronously, so the user-perceived action is reversible during
          the grace window. */}
      {showDeleteConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--spacing-lg)',
          }}
          onClick={() => !isDeleting && setShowDeleteConfirm(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-lg)',
              maxWidth: 480,
              width: '100%',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div className="flex items-start gap-3 mb-4">
              <Trash2 size={20} style={{ color: 'var(--severity-high)', marginTop: 2 }} />
              <div>
                <h2
                  id="delete-confirm-title"
                  style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}
                >
                  Delete this document?
                </h2>
                <p
                  className="text-sm mt-2"
                  style={{ color: 'var(--text-secondary)', lineHeight: 1.55 }}
                >
                  <strong>{document.filename}</strong> will be soft-deleted immediately and
                  invisible across the platform. The document and its analyses are recoverable via
                  support during the 30-day grace window, then permanently purged (DB rows + storage
                  blob) by the retention cron.
                </p>
                <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                  This action is logged to the audit trail.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    const res = await fetch(`/api/documents/${document.id}`, { method: 'DELETE' });
                    if (!res.ok) {
                      const body = await res.json().catch(() => ({}));
                      showToast(
                        body.error ||
                          `Delete failed (${res.status}). Please retry or contact support.`,
                        'error'
                      );
                      setIsDeleting(false);
                      return;
                    }
                    showToast(
                      'Document deleted. Recoverable during the 30-day grace window.',
                      'success'
                    );
                    setShowDeleteConfirm(false);
                    router.push('/dashboard/documents');
                  } catch (err) {
                    log.error('document delete failed:', err);
                    showToast('Delete failed. Please retry.', 'error');
                    setIsDeleting(false);
                  }
                }}
                className="btn btn-sm"
                style={{
                  background: 'var(--severity-high)',
                  color: 'white',
                  fontWeight: 600,
                  opacity: isDeleting ? 0.6 : 1,
                }}
              >
                {isDeleting ? 'Deleting…' : 'Delete document'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/*
        Responsive overrides for the document-detail page.
        Added 2026-04-26 (P1 #17, Adaeze persona finding) — the main grid
        and the tab bar were both broken on phones: the 380px sidebar
        column either crushed the main content or caused horizontal
        scroll, and the `flex-wrap + overflow:hidden` tab bar silently
        clipped the second row of tabs (Intelligence / Forgotten
        Questions / PDF View) so they were unreachable without knowing
        the URL param. Mobile is the highest-traffic post-upload state
        — Adaeze opens this on a 4G commute the moment her DQI score
        completes — so the breakage was at the worst possible moment.

        Fix shape:
          (1) <900px: stack the main grid into a single column so the
              sidebar panels render below the analysis content.
          (2) <900px: tab bar switches from `flex-wrap + overflow:hidden`
              to `flex-nowrap + overflow-x:auto + scroll-snap` so tabs
              scroll horizontally with native momentum, no clipping.
        Both rules use !important to override the inline styles on the
        elements (those styles were the source of truth on desktop and
        the responsive override needs to win on the narrow viewport).
      */}
      <style>{`
        @media (max-width: 900px) {
          .doc-detail-main-grid {
            grid-template-columns: 1fr !important;
          }
          .doc-detail-tab-bar {
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            -webkit-overflow-scrolling: touch;
            scroll-snap-type: x proximity;
          }
          .doc-detail-tab-bar > * {
            flex-shrink: 0;
          }
        }
      `}</style>
    </div>
  );
}
