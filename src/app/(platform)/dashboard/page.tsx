'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Brain,
  Scale,
  Shield,
  BarChart3,
  FileCheck,
  Trash2,
  Search,
  X,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  Clock,
  CloudUpload,
  GitCompareArrows,
  BrainCircuit,
  Video,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { DecisionIQCard } from '@/components/ui/DecisionIQCard';
import { DecisionDNAPreviewCard } from '@/components/dna/DecisionDNAPreviewCard';
import { FirstRunInlineWalkthrough } from '@/components/onboarding/FirstRunInlineWalkthrough';
import { RoleSwitcher } from '@/components/onboarding/RoleSwitcher';
import { useOnboardingRole } from '@/hooks/useOnboardingRole';
import {
  useFirstAuditExperience,
  hasFirstAuditOverlayBeenShown,
} from '@/hooks/useFirstAuditExperience';
import { FirstAuditGuidedOverlay } from '@/components/onboarding/FirstAuditGuidedOverlay';
import {
  PostFirstAuditWhatsNext,
  isPostFirstAuditDismissed,
  markPostFirstAuditDismissed,
} from '@/components/dashboard/PostFirstAuditWhatsNext';
import { bundlesForRole, type SampleBundle } from '@/lib/data/sample-bundles';
import type { EmptyStateRole } from '@/lib/onboarding/role-empty-states';
import { InlinePasteMemoCard } from '@/components/dashboard/InlinePasteMemoCard';
import { CsoDashboardRail } from '@/components/dashboard/CsoDashboardRail';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import useSWR from 'swr';
import { useDocuments } from '@/hooks/useDocuments';
import { useAnalysisStream } from '@/hooks/useAnalysisStream';
import type { OutcomeGateInfo } from '@/hooks/useAnalysisStream';
import { useContainers } from '@/hooks/useContainers';
import { useNotifications } from '@/components/ui/NotificationCenter';
import { useAnalysisProgress } from '@/components/ui/AnalysisProgressBar';
import { EnhancedEmptyState } from '@/components/ui/EnhancedEmptyState';
import { AccentCard } from '@/components/ui/AccentCard';
import { KGMergeConsentModal } from '@/components/pricing/KGMergeConsentModal';
import { OutcomeGateBanner, OutcomeGateModal } from '@/components/ui/OutcomeGate';
import { DraftOutcomeBanner } from '@/components/ui/DraftOutcomeBanner';
import { ModalStackProvider } from '@/components/ui/ModalStackContext';
import { SampleDataBanner } from '@/components/ui/SampleDataBanner';
import { SampleBadge } from '@/components/ui/SampleBadge';
import { DecisionTriageWidget } from '@/components/ui/DecisionTriageWidget';
import { NudgeWidget } from '@/components/dashboard/NudgeWidget';
import { ContainersWidget } from '@/components/dashboard/ContainersWidget';
import { MoatCompoundingCard } from '@/components/outcome-flywheel/MoatCompoundingCard';
import { AmbientSignalBanner } from '@/components/dashboard/AmbientSignalBanner';
import { RippleAlertBanner } from '@/components/dashboard/RippleAlertBanner';
import { useToast } from '@/components/ui/EnhancedToast';
import { createClientLogger } from '@/lib/utils/logger';

const log = createClientLogger('Dashboard');
import { OnboardingGuide } from '@/components/ui/OnboardingGuide';
import { WelcomeModal } from '@/components/ui/WelcomeModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { BulkUploadPanel } from '@/components/ui/BulkUploadPanel';
import { formatDate } from '@/lib/constants/human-audit';
import { ActivityFeed } from '@/components/ui/ActivityFeed';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { SparklineChart } from '@/components/ui/SparklineChart';
// useDeals + DOCUMENT_TYPES were sourced from src/hooks/useDeals.ts
// and src/types/deals.ts — both removed in the DecisionContainer
// refactor. Phase 2 reintroduces a useContainers hook reading from the
// unified DecisionContainer model. Document-type filter chips below
// derive from the canonical INVESTMENT_DOCUMENT_TYPES export.
import { INVESTMENT_DOCUMENT_TYPES } from '@/lib/prompts/investment-vertical';
const DOCUMENT_TYPES: ReadonlyArray<{ value: string; label: string }> = [
  ...INVESTMENT_DOCUMENT_TYPES.map(value => ({
    value,
    label: value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
  })),
  { value: 'other', label: 'Other' },
];
import { getBiasPreview } from '@/lib/utils/bias-preview';
import { getDocTypeCatch } from '@/lib/data/upload-guidance';
import { UploadGuidancePanel } from '@/components/upload/UploadGuidancePanel';
import { QuickScanModal } from '@/components/ui/QuickScanModal';
import { Zap, Lock as LockIcon, Sparkles } from 'lucide-react';
import { AnalysisShell } from '@/components/analysis/AnalysisShell';
import {
  InlineAnalysisResultCard,
  type CompletedAnalysisSummary,
} from '@/components/analysis/InlineAnalysisResultCard';
import {
  DiscoveryGradeImpactCard,
  STATIC_DEMO_ANCHOR,
  type DiscoveryGradeAnchor,
} from '@/components/discovery/DiscoveryGradeImpactCard';

const ANALYSIS_STEPS: { name: string; icon: React.ReactNode }[] = [
  { name: 'Preparing document', icon: <FileText size={16} /> },
  { name: 'Detecting cognitive biases', icon: <Brain size={16} /> },
  { name: 'Analyzing decision noise', icon: <Scale size={16} /> },
  { name: 'Fact checking claims', icon: <FileCheck size={16} /> },
  { name: 'Evaluating compliance', icon: <Shield size={16} /> },
  { name: 'Generating risk assessment', icon: <BarChart3 size={16} /> },
  { name: 'Finalizing report', icon: <CheckCircle size={16} /> },
];

type DashboardView = 'upload' | 'browse';

/** Map HTTP status codes and error patterns to user-friendly messages. */
function getDetailedErrorMessage(err: unknown, uploadRes?: Response | null): string {
  if (uploadRes) {
    if (uploadRes.status === 429) {
      const retryAfter = uploadRes.headers.get('Retry-After');
      if (retryAfter) {
        const seconds = parseInt(retryAfter, 10);
        if (!isNaN(seconds) && seconds > 0) {
          const minutes = Math.ceil(seconds / 60);
          return `Upload limit reached (30 per hour). Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`;
        }
      }
      return 'Upload limit reached. Please wait before trying again.';
    }
    if (uploadRes.status === 413) {
      // The server-side error body names the user's actual plan + cap
      // ("File too large (45.2MB · Individual plan cap is 25MB)…") so
      // we surface that verbatim if present. Generic fallback below
      // when the body parse fails.
      return 'File is too large for your plan. Upgrade for larger uploads — Individual handles 250MB (10× the Free cap). See /pricing.';
    }
    if (uploadRes.status === 415) {
      return 'Unsupported file type. Accepted formats: PDF, DOCX, PPTX, XLSX, CSV, HTML, TXT, MD.';
    }
    if (uploadRes.status === 401) {
      return 'Your session has expired. Please sign in again.';
    }
    if (uploadRes.status >= 500) {
      return 'A server error occurred. Our team has been notified — please try again later.';
    }
  }
  if (err instanceof TypeError && err.message === 'Failed to fetch') {
    return 'Network error. Check your internet connection and try again.';
  }
  if (err instanceof Error) {
    // Pass through already-specific API messages
    if (err.message.length > 10 && err.message.length < 200) return err.message;
  }
  return 'An unexpected error occurred during document analysis.';
}

const ROLE_DASHBOARD_SUBTITLE: Record<EmptyStateRole, string> = {
  cso: 'Strategic memos, audited before the board sees them',
  ma: "Pre-IC audit on every memo — Synergy Mirage, Conglomerate Fallacy, Winner's Curse",
  bizops: 'Quality gates on every recurring strategic recommendation',
  pe_vc: 'IC memos and portfolio reviews, audited live',
  other: 'Decision intelligence overview',
};

/** Persona-grade dashboard headline (locked 2026-05-02 from DiscoveryHookView
 *  aesthetic propagation). Display serif (Instrument Serif) at clamp(28-44px)
 *  matching the doc-detail Discovery hook so the entry-point feels continuous
 *  with where uploads land. The subtitle below picks up the role-aware tagline. */
const ROLE_DASHBOARD_HEADLINE: Record<EmptyStateRole, string> = {
  cso: 'Audited before the room sees it.',
  ma: 'IC-ready, before IC.',
  bizops: 'Quality gates on every strategic call.',
  pe_vc: 'Audited before the partners&rsquo; room.',
  other: 'Strategic memos, audited in 60 seconds.',
};

export default function Dashboard() {
  const onboardingRole = useOnboardingRole();
  const dashboardSubtitle = onboardingRole
    ? ROLE_DASHBOARD_SUBTITLE[onboardingRole]
    : ROLE_DASHBOARD_SUBTITLE.other;
  const dashboardHeadline = onboardingRole
    ? ROLE_DASHBOARD_HEADLINE[onboardingRole]
    : ROLE_DASHBOARD_HEADLINE.other;
  const [isDragOver, setIsDragOver] = useState(false);
  const [kgConsent, setKgConsent] = useState<{
    status: 'pending' | 'merged' | 'private' | 'not_applicable';
    memoCount: number;
  } | null>(null);

  // Fetch KG merge consent status. If the user is on a team plan, had
  // prior memos on Pro, and has not made a decision, show the modal.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/knowledge-graph/consent')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!cancelled && data?.status) {
          setKgConsent({ status: data.status, memoCount: data.memoCount ?? 0 });
        }
      })
      .catch(err => log.warn('knowledge-graph/consent fetch failed:', err));
    return () => {
      cancelled = true;
    };
  }, []);
  const [globalDrag, setGlobalDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState<'uploading' | 'analyzing'>('uploading');
  const [error, setError] = useState<string | null>(null);
  // Upload/delete errors auto-dismiss after 8s so the error banner doesn't
  // persist indefinitely after a failed action — users can still dismiss
  // manually via the × button on the banner.
  useEffect(() => {
    if (!error) return;
    const handle = setTimeout(() => setError(null), 8000);
    return () => clearTimeout(handle);
  }, [error]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const viewParam = searchParams.get('view');
  const initialView: DashboardView = viewParam === 'browse' ? 'browse' : 'upload';
  const [activeView, setActiveView] = useState<DashboardView>(initialView);

  // Keep URL in sync with the active view so the page is shareable/bookmarkable.
  // replaceState avoids adding to browser history on every tab click.
  const switchView = useCallback((next: DashboardView) => {
    setActiveView(next);
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (next === 'upload') {
      url.searchParams.delete('view');
    } else {
      url.searchParams.set('view', next);
    }
    window.history.replaceState({}, '', url.toString());
  }, []);
  const globalDragCounter = useRef(0);

  // Upload confirmation state
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>('');
  const [selectedDealId, setSelectedDealId] = useState<string>('');
  // Bulk upload queue — populated when the user drops or selects 2+ files
  // on the main upload zone. Locked 2026-05-10 streamlining batch — the
  // separate always-visible BulkUploadPanel was killed; the main upload
  // zone is now the single entry point and forwards multi-file drops here.
  const [bulkFiles, setBulkFiles] = useState<File[] | null>(null);

  // Live DecisionContainer list for the upload "Link to a decision" selector
  // (completes the Phase-2 wiring the legacy useDeals stub left empty). The
  // upload route accepts the chosen id as `containerId` and creates the
  // DecisionContainerDocument join.
  const { containers: containerSummaries } = useContainers({ status: 'active' }, 1, 100);
  const dealsList = useMemo(
    () =>
      containerSummaries.map(c => ({
        id: c.id,
        name: c.name || c.targetCompany || c.decisionFrame?.slice(0, 60) || 'Untitled decision',
        stage: c.stageId,
        updatedAt: c.updatedAt,
        fundName: c.fundName,
        targetCompany: c.targetCompany,
      })),
    [containerSummaries]
  );

  // Decision Frame context — when user comes from /decisions/new
  const [activeFrameId, setActiveFrameId] = useState<string | null>(null);
  const [activeFrameStatement, setActiveFrameStatement] = useState<string | null>(null);

  // Search and filter state (debounced for performance on large lists)
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'analyzing' | 'pending'>(
    'all'
  );
  const [docsPage, setDocsPage] = useState(1);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'scoreHigh' | 'scoreLow' | 'name'>(
    'newest'
  );
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  /** Inline "paste a memo" mode — replaces the upload zone when a user
   *  clicks the "Paste text" four-door, so there's no bounce to
   *  /dashboard/cognitive-audits/submit?source=manual. The deep link
   *  stays valid for external callers; this state is for the in-dashboard
   *  keep-me-on-this-surface path. */
  const [inlineMode, setInlineMode] = useState<'none' | 'paste'>('none');
  // 4.2 deep — first-run walkthrough plumbing. When the user clicks
  // "Run audit" on a sample card we load the memo into the paste flow
  // and auto-submit on mount.
  const [pasteSeed, setPasteSeed] = useState<{ content: string; autoSubmit: boolean } | null>(null);
  const [batchDeleting, setBatchDeleting] = useState(false);

  // Welcome modal self-gates via /api/onboarding; rendering is unconditional.
  // The `?welcome=true` param is still honored (legacy) but no longer required.
  const [showWelcome, setShowWelcome] = useState(true);
  const [quickScanOpen, setQuickScanOpen] = useState(false);

  // Handle Stripe checkout redirects (?upgraded=true or ?frameId=...) and welcome flow
  const { showToast } = useToast();

  // Plan usage for upload hint
  const { data: billingData } = useSWR<{
    usage: { analysesThisMonth: number };
    limits: { analysesPerMonth: number; maxUploadMB?: number };
    plan: 'free' | 'pro' | 'team' | 'enterprise';
    planName: string;
  }>('/api/billing', url => fetch(url).then(r => (r.ok ? r.json() : null)), {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') === 'true') {
      showToast('Welcome to your upgraded plan! Your new limits are now active.', 'success');
      window.history.replaceState({}, '', '/dashboard');
    }
    // Fresh-signup arrivals from the marketing funnel carry ?welcome=true
    // (legacy) or ?onboarding=1 (sign-in-first hero CTA, 2026-05-07 lock —
    // also emitted by the specimen + case-study CTAs). The WelcomeModal and
    // the product tour both self-gate on /api/onboarding state, so the param
    // is purely a fresh-arrival signal — acknowledge it by stripping it so a
    // refresh or shared URL doesn't carry onboarding cruft (the upgraded /
    // frameId branches strip theirs the same way).
    if (params.get('welcome') === 'true' || params.get('onboarding') === '1') {
      window.history.replaceState({}, '', '/dashboard');
    }
    const fId = params.get('frameId');
    if (fId) {
      setActiveFrameId(fId);
      setActiveView('upload');
      // Fetch the decision statement for context
      fetch(`/api/decision-frames?id=${fId}`)
        .then(r => (r.ok ? r.json() : null))
        .then(data => {
          if (data?.decisionStatement) setActiveFrameStatement(data.decisionStatement);
        })
        .catch(err => log.warn('decision-frames fetch failed:', err));
      window.history.replaceState({}, '', '/dashboard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce search input → searchQuery (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Delete confirmation state
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    docId: string;
    filename: string;
  }>({
    open: false,
    docId: '',
    filename: '',
  });
  const [deleting, setDeleting] = useState(false);

  const { addNotification } = useNotifications();
  const {
    startTracking,
    updateProgress,
    completeTracking,
    errorTracking,
    updateBiasCount,
    updateNoiseScore,
  } = useAnalysisProgress();
  const [showActivityFeed, setShowActivityFeed] = useState(false);
  const {
    activities,
    isLoading: feedLoading,
    hasMore: feedHasMore,
    loadMore: feedLoadMore,
  } = useActivityFeed({ limit: 12 });

  // SWR: cached document list with auto-revalidation
  const {
    documents: uploadedDocs,
    total: totalDocs,
    totalPages: docsTotalPages,
    isLoading: loadingDocs,
    mutate: mutateDocs,
  } = useDocuments(true, docsPage);

  // Outcome gate state for soft/hard gate UI
  const [outcomeReminder, setOutcomeReminder] = useState<{
    pendingCount: number;
    analysisIds: string[];
  } | null>(null);
  // Legacy hard-gate state — server no longer returns 423, so this only
  // populates on older deployments. Rendered as a dismissible banner, never
  // a blocking modal.
  const [hardGateInfo, setHardGateInfo] = useState<OutcomeGateInfo | null>(null);

  // Bias count accumulator for pipeline graph badges
  const biasCountRef = useRef(0);
  // Accumulated bias types + noise score so the inline result card can show
  // key findings without a second fetch after SSE completion.
  const detectedBiasesRef = useRef<Array<{ type: string; severity: string }>>([]);
  const noiseScoreRef = useRef<number | undefined>(undefined);
  const [lastCompletedAnalysis, setLastCompletedAnalysis] =
    useState<CompletedAnalysisSummary | null>(null);

  // First-audit experience signal (Improvement #1, shipped 2026-05-28).
  // Drives the persona-aware first-visit empty state, the first-audit
  // guided overlay, and the post-first-audit "what's next" tile pack.
  // totalDocs is already SWR-fetched above; pass it as the optimistic
  // value so the hook doesn't fan out a second request.
  const firstAuditExperience = useFirstAuditExperience(totalDocs ?? null);
  const [overlayActive, setOverlayActive] = useState(false);
  const [whatsNextDismissed, setWhatsNextDismissed] = useState(false);

  // Fire the first-audit overlay when (a) the user's just-completed
  // audit IS their first (totalDocs <= 1 after the audit lands) AND
  // (b) the overlay hasn't been shown this session yet.
  useEffect(() => {
    if (!lastCompletedAnalysis) return undefined;
    if (firstAuditExperience.totalDocs == null) return undefined;
    if (firstAuditExperience.totalDocs > 1) return undefined;
    if (hasFirstAuditOverlayBeenShown()) return undefined;
    // 600ms delay so the result card lands first; the overlay teaches
    // what the user is looking at, not what they're about to see.
    const t = setTimeout(() => setOverlayActive(true), 600);
    return () => clearTimeout(t);
  }, [lastCompletedAnalysis, firstAuditExperience.totalDocs]);

  // Hydrate the dismissed signal once.
  useEffect(() => {
    if (isPostFirstAuditDismissed()) setWhatsNextDismissed(true);
  }, []);

  // SSE: streaming analysis with typed events, auto-retry, AbortController cleanup
  const {
    startAnalysis,
    cancelAnalysis,
    steps: analysisSteps,
    progress: currentProgress,
    timedOut: streamTimedOut,
    outcomeGate,
  } = useAnalysisStream({
    stepNames: ANALYSIS_STEPS.map(s => s.name),
    onBiasDetected: (biasType, severity) => {
      // Increment bias count in the progress context (called per bias event)
      biasCountRef.current += 1;
      updateBiasCount(biasCountRef.current);
      detectedBiasesRef.current.push({ type: biasType, severity });
    },
    onNoiseUpdate: score => {
      noiseScoreRef.current = score;
      updateNoiseScore(score);
    },
    onOutcomeReminder: (count, ids) => {
      setOutcomeReminder({ pendingCount: count, analysisIds: ids });
    },
  });

  // Surface hard-gate reminder banner when the hook reports legacy gate info.
  useEffect(() => {
    if (outcomeGate) {
      setHardGateInfo(outcomeGate);
    }
  }, [outcomeGate]);

  // Sync analysis progress to the global floating progress bar.
  // Pass the per-node description (Tier-A #2 ship 2026-05-26) so the
  // collapsed view surfaces the educational caption — the SSE has been
  // sending this all along; it just wasn't propagated past the hook.
  useEffect(() => {
    if (currentProgress > 0 && analysisSteps.length > 0) {
      const runningStep = analysisSteps.find(s => s.status === 'running');
      updateProgress(
        currentProgress,
        runningStep?.name || 'Analyzing...',
        runningStep?.description
      );
    }
  }, [currentProgress, analysisSteps, updateProgress]);

  // Auto-switch to browse view when user has documents
  useEffect(() => {
    if (uploadedDocs.length > 0 && !uploading) {
      setActiveView('upload');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Global drag detection — show overlay when dragging files anywhere on the page
  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      e.preventDefault();
      globalDragCounter.current++;
      if (e.dataTransfer?.types.includes('Files')) {
        setGlobalDrag(true);
      }
    };
    const onDragLeave = (e: DragEvent) => {
      e.preventDefault();
      globalDragCounter.current--;
      if (globalDragCounter.current <= 0) {
        globalDragCounter.current = 0;
        setGlobalDrag(false);
      }
    };
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      globalDragCounter.current = 0;
      setGlobalDrag(false);
      if (!e.dataTransfer?.files.length || uploading) return;
      const files = Array.from(e.dataTransfer.files);
      // Mirror the upload-zone behaviour: 1 → confirm modal, 2+ → bulk queue.
      if (files.length === 1) {
        setPendingFile(files[0]);
      } else {
        setBulkFiles(files);
      }
    };

    document.addEventListener('dragenter', onDragEnter);
    document.addEventListener('dragleave', onDragLeave);
    document.addEventListener('dragover', onDragOver);
    document.addEventListener('drop', onDrop);
    return () => {
      document.removeEventListener('dragenter', onDragEnter);
      document.removeEventListener('dragleave', onDragLeave);
      document.removeEventListener('dragover', onDragOver);
      document.removeEventListener('drop', onDrop);
    };
  }, [uploading]);

  // Scroll the upload zone into view when the user picks "Analyze a document"
  // from the NewDecisionModal — works whether they were already on /dashboard
  // (custom event) or navigated here from elsewhere (sessionStorage flag).
  useEffect(() => {
    const focusUploadZone = () => {
      const el = document.getElementById('upload-memo-zone');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    window.addEventListener('di-focus-upload-zone', focusUploadZone);
    let raf = 0;
    try {
      if (sessionStorage.getItem('di-focus-upload-zone') === '1') {
        sessionStorage.removeItem('di-focus-upload-zone');
        // Defer until after first paint so the zone is laid out.
        raf = window.setTimeout(focusUploadZone, 350);
      }
    } catch {
      // sessionStorage blocked (private mode) — the custom-event path still works.
    }
    return () => {
      window.removeEventListener('di-focus-upload-zone', focusUploadZone);
      if (raf) window.clearTimeout(raf);
    };
  }, []);

  // Filtered documents based on search and status
  const filteredDocs = useMemo(() => {
    return uploadedDocs.filter(doc => {
      const matchesSearch = doc.filename.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [uploadedDocs, searchQuery, statusFilter]);

  // Sorted documents based on sort selection
  const sortedDocs = useMemo(() => {
    const docs = [...filteredDocs];
    switch (sortBy) {
      case 'oldest':
        return docs.sort(
          (a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
        );
      case 'scoreHigh':
        return docs.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
      case 'scoreLow':
        return docs.sort((a, b) => (a.score ?? 101) - (b.score ?? 101));
      case 'name':
        return docs.sort((a, b) => a.filename.localeCompare(b.filename));
      case 'newest':
      default:
        return docs.sort(
          (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        );
    }
  }, [filteredDocs, sortBy]);

  // Clear selection when filters change
  useEffect(() => {
    setSelectedDocs(new Set());
  }, [searchQuery, statusFilter, docsPage]);

  // Batch delete handler
  const handleBatchDelete = async () => {
    if (selectedDocs.size === 0) return;
    setBatchDeleting(true);
    try {
      await Promise.all(
        Array.from(selectedDocs).map(id => fetch(`/api/documents/${id}`, { method: 'DELETE' }))
      );
      setSelectedDocs(new Set());
      mutateDocs();
      showToast(`Deleted ${selectedDocs.size} document(s)`, 'success');
    } catch {
      showToast('Failed to delete some documents', 'error');
    } finally {
      setBatchDeleting(false);
    }
  };

  // Risk summary computed from analyzed documents
  const riskSummary = useMemo(() => {
    let high = 0,
      medium = 0,
      low = 0,
      totalScore = 0,
      scored = 0;
    uploadedDocs.forEach(doc => {
      if (doc.score !== undefined) {
        scored++;
        totalScore += doc.score;
        if (doc.score < 40) high++;
        else if (doc.score < 70) medium++;
        else low++;
      }
    });
    return {
      total: scored,
      high,
      medium,
      low,
      avg: scored > 0 ? Math.round(totalScore / scored) : 0,
    };
  }, [uploadedDocs]);

  // Sparkline data — last 10 scores for mini-chart in KPI cards
  const sparklineData = useMemo(() => {
    return [...uploadedDocs]
      .filter(d => d.score !== undefined)
      .sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime())
      .slice(-10)
      .map(d => d.score || 0);
  }, [uploadedDocs]);

  // Delete document handler — uses SWR mutate for cache invalidation
  const handleDelete = async () => {
    if (!deleteModal.docId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${deleteModal.docId}`, { method: 'DELETE' });
      if (res.ok) {
        // Optimistically remove from cache, then revalidate
        await mutateDocs(
          current =>
            current
              ? { ...current, documents: current.documents.filter(d => d.id !== deleteModal.docId) }
              : current,
          { revalidate: true }
        );
        setDeleteModal({ open: false, docId: '', filename: '' });
      } else {
        setError('Failed to delete document');
      }
    } catch (err) {
      log.error('Delete failed:', err);
      setError('Failed to delete document');
    } finally {
      setDeleting(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const uploadAndAnalyze = async (file: File) => {
    setError(null);
    setUploading(true);
    setUploadProgress(0);
    setUploadPhase('uploading');

    // Default empty state when SWR cache is undefined (e.g. if the
    // initial fetch failed due to schema drift or network error).
    // Declared outside try/catch so the catch handler can reference it.
    const emptyState = { documents: [], total: 0, page: 1, totalPages: 1 };

    try {
      // Upload file with XHR for progress tracking
      const formData = new FormData();
      formData.append('file', file);
      if (activeFrameId) {
        formData.append('frameId', activeFrameId);
      }
      if (selectedDocType) {
        formData.append('documentType', selectedDocType);
      }
      if (selectedDealId) {
        // The upload route reads `containerId` (DecisionContainer) — `dealId`
        // is only its legacy fallback alias.
        formData.append('containerId', selectedDealId);
      }

      const uploadData = await new Promise<{ id: string; filename: string; cached?: boolean }>(
        (resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/upload');

          xhr.upload.onprogress = e => {
            if (e.lengthComputable) {
              setUploadProgress(Math.round((e.loaded / e.total) * 100));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                resolve(JSON.parse(xhr.responseText));
              } catch {
                reject(new Error('Invalid server response'));
              }
            } else {
              let errorMessage: string | undefined;
              try {
                const data = JSON.parse(xhr.responseText);
                errorMessage = data.error;
              } catch {
                /* use status-based message */
              }
              const fakeRes = { status: xhr.status } as Response;
              reject(new Error(errorMessage || getDetailedErrorMessage(null, fakeRes)));
            }
          };

          xhr.onerror = () => reject(new TypeError('Failed to fetch'));
          xhr.send(formData);
        }
      );

      setUploadPhase('analyzing');
      // Don't reset progress to 0 — the analysis stream will drive progress from here

      // If the server returned a cached result (same content hash — this exact
      // document was already audited), skip streaming. Previously this was
      // SILENT: the progress bar vanished and nothing visible happened, which
      // reads as a broken upload. Now we tell the user + open the existing
      // audit so the click always lands somewhere.
      if (uploadData.cached) {
        await mutateDocs(undefined, { revalidate: true });
        showToast('You already audited this document — opening your existing audit.', 'info');
        router.push(`/documents/${uploadData.id}`);
        return;
      }

      // Optimistically add to SWR cache with analyzing status.
      await mutateDocs(
        current => {
          const base = current ?? emptyState;
          return {
            ...base,
            documents: [
              {
                id: uploadData.id,
                filename: uploadData.filename,
                status: 'analyzing',
                uploadedAt: new Date().toISOString(),
              },
              ...base.documents,
            ],
          };
        },
        { revalidate: false }
      );

      // Stream analysis via the hook (auto-retry, typed events, AbortController cleanup)
      biasCountRef.current = 0;
      detectedBiasesRef.current = [];
      noiseScoreRef.current = undefined;
      setLastCompletedAnalysis(null);
      startTracking(uploadData.id, uploadData.filename);
      const finalResult = await startAnalysis(uploadData.id);

      if (finalResult) {
        const score = finalResult?.overallScore as number;
        const resolvedAnalysisId =
          typeof (finalResult as Record<string, unknown>).analysisId === 'string'
            ? ((finalResult as Record<string, unknown>).analysisId as string)
            : null;
        completeTracking(uploadData.id);
        setLastCompletedAnalysis({
          docId: uploadData.id,
          filename: uploadData.filename,
          overallScore: score,
          biasCount: biasCountRef.current,
          noiseScore: noiseScoreRef.current,
          detectedBiases: [...detectedBiasesRef.current],
          analysisId: resolvedAnalysisId,
        });
        addNotification({
          type: score < 40 ? 'low_score' : 'analysis_complete',
          title: score < 40 ? 'Low Score Alert' : 'Analysis Complete',
          message: `${uploadData.filename} scored ${score}/100`,
          href: `/documents/${uploadData.id}`,
        });
        // Update SWR cache with the completed result
        await mutateDocs(
          current => {
            const base = current ?? emptyState;
            return {
              ...base,
              documents: base.documents.map(doc =>
                doc.id === uploadData.id ? { ...doc, status: 'complete', score } : doc
              ),
            };
          },
          { revalidate: true }
        );
      } else {
        // Stream ended without a result (timeout, disconnect, or error).
        // Always revalidate so the SWR cache picks up whatever state the
        // server left the document in (complete, error, or still analyzing).
        await mutateDocs(undefined, { revalidate: true });
        // Don't leave the user staring at a vanished progress bar — the
        // document was saved; point them to it.
        showToast(
          'The audit didn’t finish streaming — your document was saved. Open it to see the status or retry.',
          'warning'
        );
      }
    } catch (err) {
      log.error('Upload/Analysis error:', err instanceof Error ? err.message : 'Unknown error');
      setError(getDetailedErrorMessage(err));
      errorTracking();

      // Mark as error in SWR cache and revalidate to sync with server state
      await mutateDocs(
        current => {
          const base = current ?? emptyState;
          return {
            ...base,
            documents: base.documents.map(doc =>
              doc.status === 'analyzing' ? { ...doc, status: 'error' } : doc
            ),
          };
        },
        { revalidate: true }
      );
    } finally {
      setUploading(false);
    }
  };

  const retryAnalysis = async (docId: string) => {
    setError(null);
    setUploading(true);
    const emptyState = { documents: [], total: 0, page: 1, totalPages: 1 };

    try {
      await mutateDocs(
        current => {
          const base = current ?? emptyState;
          return {
            ...base,
            documents: base.documents.map(doc =>
              doc.id === docId ? { ...doc, status: 'analyzing' } : doc
            ),
          };
        },
        { revalidate: false }
      );

      const retryDoc = uploadedDocs.find(d => d.id === docId);
      biasCountRef.current = 0;
      detectedBiasesRef.current = [];
      noiseScoreRef.current = undefined;
      setLastCompletedAnalysis(null);
      startTracking(docId, retryDoc?.filename || 'Document');
      const finalResult = await startAnalysis(docId);

      if (finalResult) {
        const retryScore = finalResult?.overallScore as number;
        const resolvedAnalysisId =
          typeof (finalResult as Record<string, unknown>).analysisId === 'string'
            ? ((finalResult as Record<string, unknown>).analysisId as string)
            : null;
        completeTracking(docId);
        setLastCompletedAnalysis({
          docId,
          filename: retryDoc?.filename || 'Document',
          overallScore: retryScore,
          biasCount: biasCountRef.current,
          noiseScore: noiseScoreRef.current,
          detectedBiases: [...detectedBiasesRef.current],
          analysisId: resolvedAnalysisId,
        });
        addNotification({
          type: retryScore < 40 ? 'low_score' : 'analysis_complete',
          title: retryScore < 40 ? 'Low Score Alert' : 'Analysis Complete',
          message: `${retryDoc?.filename || 'Document'} scored ${retryScore}/100`,
          href: `/documents/${docId}`,
        });
        await mutateDocs(
          current => {
            const base = current ?? emptyState;
            return {
              ...base,
              documents: base.documents.map(doc =>
                doc.id === docId ? { ...doc, status: 'complete', score: retryScore } : doc
              ),
            };
          },
          { revalidate: true }
        );
      } else {
        await mutateDocs(undefined, { revalidate: true });
      }
    } catch (err) {
      log.error('Retry analysis error:', err instanceof Error ? err.message : 'Unknown error');
      setError(getDetailedErrorMessage(err));
      errorTracking();
      await mutateDocs(undefined, { revalidate: true });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    // Single-file → existing confirm-modal flow. Multi-file → bulk queue.
    // Both routes go through the same upload zone — the founder's
    // streamlining ask: "merge bulk upload into the main upload box."
    if (files.length === 1) {
      setPendingFile(files[0]);
    } else {
      setBulkFiles(files);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) {
      e.target.value = '';
      return;
    }
    if (files.length === 1) {
      setPendingFile(files[0]);
    } else {
      setBulkFiles(files);
    }
    // Reset so the same file can be re-selected (otherwise onChange won't fire)
    e.target.value = '';
  };

  const confirmUpload = async () => {
    if (!pendingFile) return;
    const file = pendingFile;
    setPendingFile(null);
    await uploadAndAnalyze(file);
    setSelectedDocType('');
    setSelectedDealId('');
  };

  return (
    // stack-xl gives predictable, non-collapsing vertical rhythm between
    // every direct child (page-header → KPI cards → banners → onboarding
    // → widgets → view content). Replaces the fragile margin-based
    // approach that was silently crunching when empty AnimatePresence
    // containers sat between siblings.
    //
    // ModalStackProvider locked 2026-05-10 (audit batch 4 #1) — priority-
    // ordered banner queue so cold-prospect first-load renders at most
    // ONE banner. Priority ladder: outcome_gate_hard > kg_consent >
    // outcome_gate_soft > draft_outcome > sample_data. New banners pick
    // a tier from MODAL_STACK_PRIORITY in @/components/ui/ModalStackContext.
    <ModalStackProvider>
      <div className="stack-xl">
        {/* Welcome modal for first-time users */}
        {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}

        {/* Header — persona-grade hero (locked 2026-05-02). Display serif
          H1 matches the DiscoveryHookView aesthetic on doc-detail so the
          entry-point feels continuous with where uploads land. The
          eyebrow + subtitle hierarchy is identical to the Discovery hook
          for visual coherence. Globals.css rule against display serif on
          platform surfaces is intentionally extended here — the dashboard
          IS the entry-point deliverable surface, not an analyst panel. */}
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 'var(--fs-3xs)',
                fontWeight: 600,
                color: 'var(--text-muted)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              Dashboard
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-display, "Instrument Serif", Georgia, serif)',
                fontSize: 'clamp(28px, 3.4vw, 44px)',
                lineHeight: 1.1,
                fontWeight: 400,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                margin: 0,
              }}
              dangerouslySetInnerHTML={{ __html: dashboardHeadline }}
            />
            <p
              className="page-subtitle"
              style={{ marginTop: 8, fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}
            >
              {dashboardSubtitle}
            </p>
            {/* Always-visible role indicator + switcher. The role drives
                every persona-aware surface; a mis-tagged user can now see
                and correct it, re-targeting the dashboard in the same tick. */}
            <RoleSwitcher />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setQuickScanOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{ gap: 6 }}
            >
              <Zap size={14} style={{ color: 'var(--accent-primary)' }} />
              Quick Bias Check
            </button>
          </div>
          {/* View switcher — always rendered so the layout is stable from
            first paint (prevents a content shift when the SWR docs list
            resolves). Buttons remain functional for empty state too;
            Browse just shows its own empty state when there are no docs. */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              background: 'var(--bg-card-hover)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-full)',
              padding: '3px',
            }}
          >
            <button
              onClick={() => switchView('upload')}
              style={{
                padding: '6px 16px',
                fontSize: '13px',
                fontWeight: activeView === 'upload' ? 600 : 400,
                borderRadius: 'var(--radius-full)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s',
                background: activeView === 'upload' ? 'var(--bg-active)' : 'transparent',
                color: activeView === 'upload' ? 'var(--text-highlight)' : 'var(--text-muted)',
              }}
            >
              <Upload size={14} />
              Upload &amp; Monitor
            </button>
            <button
              onClick={() => switchView('browse')}
              style={{
                padding: '6px 16px',
                fontSize: '13px',
                fontWeight: activeView === 'browse' ? 600 : 400,
                borderRadius: 'var(--radius-full)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s',
                background: activeView === 'browse' ? 'var(--bg-active)' : 'transparent',
                color: activeView === 'browse' ? 'var(--text-highlight)' : 'var(--text-muted)',
              }}
            >
              <Search size={14} />
              Browse &amp; Analyze
            </button>
          </div>
        </div>

        {/* CSO pipeline rail — Strategy+ tier only, collapsible. Shows
          in-flight audits / outcomes awaiting report / active decision
          rooms. Self-hides on Free + Pro via /api/cso-rail plan gate. */}
        <CsoDashboardRail />

        {/* Hero KPI Cards — always rendered so first paint matches the
          post-load layout (prevents the content-shift flash when SWR
          resolves). Empty / zero values are handled by the —/0 fallbacks. */}
        <>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-md sm:gap-lg"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08 } },
            }}
          >
            {/* KPI grid — 4 cards. Each gets a 2px top accent stripe so
              the eye reads semantic role at a glance (Phase F follow-up
              2026-05-09 evening — solves the all-same-card flatness on
              the dashboard hero). Avg Quality's accent dynamically
              tracks the grade band so a returning CSO sees red instantly
              when their average drops below D. */}
            {[
              {
                label: 'Total Documents',
                value: totalDocs,
                numericValue: totalDocs,
                icon: <FileText size={18} />,
                iconBg: 'var(--bg-card-hover)',
                iconColor: 'var(--text-secondary)',
                sparkColor: 'var(--text-muted)',
                accentColor: 'var(--accent-secondary, #6366f1)', // info / data
              },
              {
                label: 'Analyzed',
                value: uploadedDocs.filter(d => d.status === 'complete').length,
                numericValue: uploadedDocs.filter(d => d.status === 'complete').length,
                icon: <CheckCircle size={18} />,
                iconBg: 'rgba(22, 163, 74, 0.10)',
                iconColor: 'var(--success)',
                sparkColor: 'var(--text-muted)',
                accentColor: 'var(--success)', // completion / verified
              },
              {
                label: 'Avg Quality',
                value: riskSummary.avg,
                numericValue: riskSummary.avg,
                suffix: '%',
                icon: <TrendingUp size={18} />,
                iconBg: 'var(--bg-card-hover)',
                iconColor: 'var(--text-secondary)',
                sparkColor: 'var(--text-muted)',
                showSparkline: true,
                // Dynamically grade-coded — A/B → green, C → amber, D/F → red
                accentColor:
                  riskSummary.avg >= 70
                    ? 'var(--success)'
                    : riskSummary.avg >= 55
                      ? 'var(--warning)'
                      : riskSummary.avg >= 40
                        ? 'var(--severity-high)'
                        : riskSummary.avg > 0
                          ? 'var(--severity-critical)'
                          : 'var(--text-muted)',
              },
              {
                label: 'Decision IQ',
                value: -1, // Sentinel: replaced by custom component
                numericValue: -1,
                icon: <Brain size={18} />,
                iconBg: 'rgba(22, 163, 74, 0.10)',
                iconColor: 'var(--accent-primary)',
                sparkColor: 'var(--text-muted)',
                isCustom: true,
                accentColor: 'var(--accent-primary)', // primary / proprietary metric
              },
            ].map(stat => {
              // Decision IQ uses its own self-contained component
              if ((stat as Record<string, unknown>).isCustom) {
                return (
                  <motion.div
                    key={stat.label}
                    variants={{
                      hidden: { opacity: 0, y: 20, scale: 0.97 },
                      visible: { opacity: 1, y: 0, scale: 1 },
                    }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{
                      y: -4,
                      boxShadow: '0 16px 36px rgba(15, 23, 42, 0.18)',
                    }}
                    style={{
                      borderTop: `2px solid ${stat.accentColor}`,
                      borderRadius: 'var(--radius-lg)',
                    }}
                  >
                    <DecisionIQCard />
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={stat.label}
                  className="stat-card liquid-glass-premium"
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.97 },
                    visible: { opacity: 1, y: 0, scale: 1 },
                  }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{
                    y: -4,
                    boxShadow: '0 16px 36px rgba(15, 23, 42, 0.18)',
                  }}
                  style={{ borderTop: `2px solid ${stat.accentColor}` }}
                >
                  <div
                    className="flex items-center justify-between"
                    style={{ marginBottom: 'var(--spacing-md)' }}
                  >
                    <div
                      className="stat-card-icon"
                      style={{
                        background: stat.iconBg,
                        color: stat.iconColor,
                        marginBottom: 0,
                      }}
                    >
                      {stat.icon}
                    </div>
                    {stat.showSparkline && sparklineData.length >= 2 && (
                      <SparklineChart
                        data={sparklineData}
                        color={stat.sparkColor}
                        width={72}
                        height={28}
                      />
                    )}
                  </div>
                  <div className="stat-card-value" style={{ color: 'var(--text-highlight)' }}>
                    {riskSummary.total > 0 || stat.label === 'Total Documents' ? (
                      <AnimatedNumber
                        value={stat.numericValue}
                        suffix={stat.suffix || ''}
                        duration={900}
                      />
                    ) : (
                      '—'
                    )}
                  </div>
                  <div className="stat-card-label">{stat.label}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </>

        {/* Decision DNA preview — surfaces the personal-calibration moat as
          a 3-stat row (top-triggered bias / belief delta / follow-success).
          Renders a discovery card when the user has no data yet. The full
          surface lives at /dashboard/analytics?view=intelligence#dna
          (folded in Phase B 2026-05-09 evening). */}
        <DecisionDNAPreviewCard />

        {/* Banners / widgets — rendered bare (no mb-lg wrapper divs) so null
          returns don't create empty flex items that inflate stack-xl's
          gap. AnimatePresence contributes no DOM when empty; each child
          component self-conditionally returns null. */}
        <AnimatePresence>
          {streamTimedOut && !uploading && (
            <motion.div
              className="p-md bg-warning/10 border border-warning/30 rounded-lg flex items-center gap-sm"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
            >
              <AlertTriangle size={18} className="text-warning shrink-0" />
              <span className="text-warning text-sm">
                Analysis is taking longer than expected. The server may still be processing —
                refresh the page or try again.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              className="p-md bg-error/10 border border-error/30 rounded-lg flex items-center gap-sm"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
            >
              <AlertTriangle size={18} className="text-error shrink-0" />
              <span className="text-error text-sm">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-error/60 hover:text-error"
                aria-label="Dismiss error"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {outcomeReminder && (
          <OutcomeGateBanner
            pendingCount={outcomeReminder.pendingCount}
            pendingAnalysisIds={outcomeReminder.analysisIds}
            onDismiss={() => setOutcomeReminder(null)}
          />
        )}

        <SampleDataBanner />
        <DraftOutcomeBanner />

        {hardGateInfo && hardGateInfo.level === 'hard' ? (
          // Hard-blocking modal: the upload was actually rejected by the API
          // (Organization.enforceOutcomeGate=true + 5+ pending outcomes past
          // 30 days). User must log an outcome before they can proceed —
          // not dismissible. Phase 2 of Outcome Gate Enforcement (locked
          // 2026-04-26).
          <OutcomeGateModal
            gateInfo={hardGateInfo}
            onClose={() => setHardGateInfo(null)}
            onOutcomeSubmitted={() => {
              // Outcome logged — clear gate state so user can re-attempt
              // the upload. The next /api/analyze/stream call will pass
              // the gate (assuming pending count dropped below threshold).
              setHardGateInfo(null);
            }}
          />
        ) : hardGateInfo ? (
          // Soft / legacy reminder: dismissible banner.
          <OutcomeGateBanner
            pendingCount={hardGateInfo.pendingCount}
            pendingAnalysisIds={hardGateInfo.pendingAnalysisIds}
            level="hard"
            onDismiss={() => setHardGateInfo(null)}
          />
        ) : null}

        {/* Ambient thesis-formation signals (T2.2, locked 2026-05-10) —
            renders when ambient detection has surfaced pending signals
            from connected Slack channels / Drive folders. Self-hides when
            empty. Per Paper #2 Ch 6: the audit must fire BEFORE deal-fever
            locks in; ambient capture is the surface that gets us there. */}
        <ErrorBoundary sectionName="Ambient signals">
          <AmbientSignalBanner />
        </ErrorBoundary>

        {/* RippleAlertBanner — M-7 ship 2026-05-13. Surfaces proactive
            depends_on ripple alerts when an anchor container's status
            shifts (archived) or its outcome resolves unfavorably (Brier
            ≥ 0.20 OR failure-language summary). Self-hides when no
            ripples. Paper #2 Ch 5: cross-decision pattern detection is
            the killer differentiator; this is the proactive surface
            that turns detection into a notification. */}
        <ErrorBoundary sectionName="Ripple alerts">
          <RippleAlertBanner />
        </ErrorBoundary>

        <OnboardingGuide documentCount={totalDocs ?? 0} />
        <DecisionTriageWidget />
        <ErrorBoundary sectionName="Nudges">
          <NudgeWidget />
        </ErrorBoundary>

        {/* Moat compounding card — Improvement #4, shipped 2026-05-28.
            Makes the per-user data-flywheel visible as a Strava-style
            calibration timeline + band-tiered narrative (cold start /
            early / calibrating / compounding). Renders nothing when
            the user has zero audits. */}
        <ErrorBoundary sectionName="Moat compounding">
          <MoatCompoundingCard />
        </ErrorBoundary>

        {/* Container roll-up widget (Phase 3 P3.5 — replaces deleted
         UnifiedDecisionsFeed). Top-5 most-recently-updated decisions
         across all modes. */}
        <ErrorBoundary sectionName="Active decisions">
          <ContainersWidget />
        </ErrorBoundary>

        {/* JournalWidget removed Phase C 2026-05-09 evening — redundant
          with the unified journal + audits feed at
          /dashboard/decisions?view=log (folded in 2026-05-10 Phase G).
          Sidebar surfaces Decisions one click away; the dashboard widget
          added noise without new signal. */}

        {/* ═══════ UPLOAD & MONITOR VIEW ═══════ */}
        {activeView === 'upload' && (
          <>
            {/* Upload Confirmation Dialog */}
            <Dialog
              open={!!pendingFile && !uploading}
              onOpenChange={(isOpen: boolean) => {
                if (!isOpen) {
                  setPendingFile(null);
                  setSelectedDocType('');
                  setSelectedDealId('');
                }
              }}
            >
              <DialogContent className="sm:max-w-md" showCloseButton>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base">
                    <FileText size={18} style={{ color: 'var(--text-highlight)' }} />
                    Ready to Analyze
                  </DialogTitle>
                  <DialogDescription>
                    Review file details and optionally tag before analysis.
                  </DialogDescription>
                </DialogHeader>

                {pendingFile && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* File preview */}
                    <div
                      className="flex items-center gap-md"
                      style={{
                        padding: 'var(--spacing-md)',
                        background: 'var(--bg-card)',
                        borderRadius: 8,
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 8,
                          flexShrink: 0,
                        }}
                      >
                        <FileText size={22} className="text-accent-primary" />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p
                          className="font-medium text-sm"
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {pendingFile.name}
                        </p>
                        <p className="text-xs text-muted">
                          {(pendingFile.size / 1024).toFixed(1)} KB ·{' '}
                          {pendingFile.type || pendingFile.name.split('.').pop()?.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    {(() => {
                      const preview = getBiasPreview(pendingFile.name, selectedDocType);
                      const catchLine = getDocTypeCatch(selectedDocType);
                      return (
                        <div
                          style={{
                            fontSize: 12,
                            color: 'var(--text-muted)',
                            lineHeight: 1.5,
                            padding: '8px 12px',
                            background: 'rgba(22, 163, 74, 0.06)',
                            border: '1px solid rgba(22, 163, 74, 0.18)',
                            borderRadius: 8,
                          }}
                        >
                          Looks like a {preview.docTypeLabel} — we&apos;ll check for{' '}
                          {preview.biasLabels.map((b, idx) => (
                            <span key={b}>
                              <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                                {b}
                              </span>
                              {idx < preview.biasLabels.length - 1 ? ' + ' : ''}
                            </span>
                          ))}{' '}
                          first.
                          {catchLine && (
                            <span
                              style={{
                                display: 'block',
                                marginTop: 6,
                                color: 'var(--text-secondary)',
                              }}
                            >
                              {catchLine}
                            </span>
                          )}
                        </div>
                      );
                    })()}

                    {/* Document type + Deal selectors — stacked for clarity */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div>
                        <label
                          className="text-xs text-secondary font-medium"
                          style={{ display: 'block', marginBottom: 4 }}
                        >
                          Document Type{' '}
                          <span className="text-muted" style={{ fontWeight: 400 }}>
                            (optional — focuses the audit)
                          </span>
                        </label>
                        <p
                          className="text-xs text-muted"
                          style={{ margin: '0 0 6px', lineHeight: 1.45 }}
                        >
                          Pick the type and we zero in on what matters most for it. Skip it and we
                          infer from your file.
                        </p>
                        <select
                          value={selectedDocType}
                          onChange={e => setSelectedDocType(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 8,
                            color: 'var(--text-primary)',
                            fontSize: 13,
                            outline: 'none',
                          }}
                        >
                          <option value="">Select type...</option>
                          {DOCUMENT_TYPES.map(t => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={{ display: dealsList.length > 0 ? 'block' : 'none' }}>
                        <label
                          className="text-xs text-secondary font-medium"
                          style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}
                        >
                          Link to a decision <span className="text-muted">(optional)</span>
                        </label>
                        <select
                          value={selectedDealId}
                          onChange={e => setSelectedDealId(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 8,
                            color: 'var(--text-primary)',
                            fontSize: 13,
                            outline: 'none',
                          }}
                        >
                          <option value="">Select a decision...</option>
                          {(() => {
                            // Sort by updatedAt desc (proxy for "recently used");
                            // pin top 3 at the top under a "Recent" optgroup, render
                            // the rest alphabetically below so a CSO with 40+ deals
                            // still finds the one they touched yesterday in one click.
                            const byRecency = [...dealsList].sort((a, b) => {
                              const aT = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
                              const bT = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
                              return bT - aT;
                            });
                            const recent = byRecency.slice(0, 3);
                            const recentIds = new Set(recent.map(d => d.id));
                            const rest = [...dealsList]
                              .filter(d => !recentIds.has(d.id))
                              .sort((a, b) => a.name.localeCompare(b.name));
                            return (
                              <>
                                {recent.length > 0 && (
                                  <optgroup label="Recent">
                                    {recent.map(d => (
                                      <option key={d.id} value={d.id}>
                                        {d.name}
                                      </option>
                                    ))}
                                  </optgroup>
                                )}
                                {rest.length > 0 && (
                                  <optgroup label={recent.length > 0 ? 'All decisions' : undefined}>
                                    {rest.map(d => (
                                      <option key={d.id} value={d.id}>
                                        {d.name}
                                      </option>
                                    ))}
                                  </optgroup>
                                )}
                              </>
                            );
                          })()}
                        </select>
                      </div>
                    </div>

                    {/* Actions */}
                    <DialogFooter>
                      <button
                        onClick={() => {
                          setPendingFile(null);
                          setSelectedDocType('');
                          setSelectedDealId('');
                        }}
                        className="btn btn-ghost text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmUpload}
                        className="btn btn-primary flex items-center gap-sm"
                      >
                        <Brain size={16} />
                        Start Analysis
                      </button>
                    </DialogFooter>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Decision Frame Context Banner */}
            {activeFrameStatement && (
              <div
                className="card mb-md animate-fade-in"
                style={{
                  padding: 'var(--spacing-md)',
                  background: 'rgba(22, 163, 74, 0.08)',
                  border: '1px solid rgba(22, 163, 74, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                }}
              >
                <FileText size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--accent-primary)',
                      fontWeight: 600,
                      marginBottom: '2px',
                    }}
                  >
                    Decision Frame Active
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {activeFrameStatement}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveFrameId(null);
                    setActiveFrameStatement(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: '4px',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* 4.2 deep — first-run walkthrough renders only when the org
              has zero analyses, no upload in flight, and no paste session
              already open. Dismissible per-org via localStorage. */}
            {uploadedDocs.length === 0 &&
              !uploading &&
              !pendingFile &&
              !lastCompletedAnalysis &&
              inlineMode === 'none' && (
                <FirstRunInlineWalkthrough
                  visible
                  onLoadAndRun={bundle => {
                    setPasteSeed({ content: bundle.content, autoSubmit: true });
                    setInlineMode('paste');
                  }}
                  onLoadOnly={bundle => {
                    setPasteSeed({ content: bundle.content, autoSubmit: false });
                    setInlineMode('paste');
                  }}
                />
              )}

            {/* Scroll anchor — the "Analyze a document" action (NewDecisionModal)
                scrolls here so the click always lands somewhere, even when the
                user is already on /dashboard. */}
            <div id="upload-memo-zone" aria-hidden style={{ scrollMarginTop: 84 }} />

            {/* Upload Zone - Enhanced with drag feedback */}
            <ErrorBoundary sectionName="Upload">
              {!uploading && !pendingFile && lastCompletedAnalysis ? (
                <>
                  {/* Empathic-mode Discovery card for cold users (first 3
                    audits). totalDocs already counts the just-completed
                    audit, so `<= 3` matches the founder's "first three
                    audits" cold-context window. The discovery card sets
                    a per-decision dollar frame BEFORE the platform
                    vocabulary in InlineAnalysisResultCard appears below.
                    Anchor uses STATIC_DEMO_ANCHOR for the dollar math
                    (we don't know the user's ticket size from the
                    dashboard upload path) but personalises the
                    artefactLabel + topBiasLabel from the just-completed
                    analysis so the framing reads "your decision" not
                    "a generic sample". (C4 lock 2026-04-28.) */}
                  {(totalDocs ?? 0) <= 3 && lastCompletedAnalysis.detectedBiases.length > 0 && (
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                      <DiscoveryGradeImpactCard
                        variant="post-upload"
                        anchor={
                          {
                            ...STATIC_DEMO_ANCHOR,
                            contextLabel: 'Your audit',
                            artefactLabel: lastCompletedAnalysis.filename,
                            topBiasLabel: lastCompletedAnalysis.detectedBiases[0]?.type
                              ? lastCompletedAnalysis.detectedBiases[0].type
                                  .replace(/_/g, ' ')
                                  .replace(/\b\w/g, (c: string) => c.toUpperCase())
                              : STATIC_DEMO_ANCHOR.topBiasLabel,
                          } satisfies DiscoveryGradeAnchor
                        }
                        ctaLabel="See what your audit found ↓"
                        ctaHref="#inline-analysis-result"
                      />
                    </div>
                  )}
                  <div id="inline-analysis-result">
                    <InlineAnalysisResultCard
                      analysis={lastCompletedAnalysis}
                      onDismiss={() => setLastCompletedAnalysis(null)}
                      preResolvedAnalysisId={lastCompletedAnalysis.analysisId ?? null}
                    />
                  </div>

                  {/* Post-first-audit "what's next" tile pack —
                      Improvement #1, shipped 2026-05-28. Fires once
                      when the user's FIRST audit lands (totalDocs <= 1
                      after audit) and they haven't dismissed it this
                      session. Persona-aware copy via onboardingRole. */}
                  {firstAuditExperience.totalDocs != null &&
                    firstAuditExperience.totalDocs <= 1 &&
                    !whatsNextDismissed && (
                      <PostFirstAuditWhatsNext
                        onboardingRole={onboardingRole}
                        analysisId={lastCompletedAnalysis.analysisId ?? null}
                        filename={lastCompletedAnalysis.filename}
                        onDismiss={() => {
                          markPostFirstAuditDismissed();
                          setWhatsNextDismissed(true);
                        }}
                      />
                    )}
                </>
              ) : !uploading && !pendingFile && inlineMode === 'paste' ? (
                <InlinePasteMemoCard
                  onClose={() => {
                    setInlineMode('none');
                    setPasteSeed(null);
                  }}
                  initialContent={pasteSeed?.content}
                  autoSubmit={pasteSeed?.autoSubmit ?? false}
                />
              ) : !uploading && !pendingFile ? (
                <>
                  <div
                    id="onborda-upload"
                    className={`upload-zone liquid-glass-iridescent liquid-glass-shimmer ${isDragOver ? 'dragover' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-input')?.click()}
                    role="button"
                    tabIndex={0}
                    aria-label="Upload document. Drop a file or click to browse."
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ')
                        document.getElementById('file-input')?.click();
                    }}
                  >
                    <input
                      type="file"
                      id="file-input"
                      hidden
                      multiple
                      accept=".pdf,.txt,.md,.docx,.pptx,.xlsx,.csv,.html,.htm"
                      disabled={uploading}
                      onChange={handleFileSelect}
                    />
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 18,
                        textAlign: 'center',
                        padding: '12px 0',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.14em',
                          color: 'var(--accent-primary)',
                        }}
                      >
                        Upload · 60-second audit
                      </div>
                      <div
                        style={{
                          width: 84,
                          height: 84,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 'var(--radius-xl)',
                          background: isDragOver
                            ? 'rgba(22, 163, 74, 0.18)'
                            : 'linear-gradient(135deg, rgba(22,163,74,0.14) 0%, rgba(22,163,74,0.06) 100%)',
                          border: `2px solid rgba(22, 163, 74, ${isDragOver ? 0.5 : 0.24})`,
                          transition: 'all 0.2s ease',
                          transform: isDragOver ? 'scale(1.08)' : 'scale(1)',
                          boxShadow: isDragOver
                            ? '0 10px 30px rgba(22, 163, 74, 0.24)'
                            : '0 4px 18px rgba(22, 163, 74, 0.08)',
                        }}
                      >
                        {isDragOver ? (
                          <CloudUpload size={36} style={{ color: 'var(--accent-primary)' }} />
                        ) : (
                          <Upload size={36} style={{ color: 'var(--accent-primary)' }} />
                        )}
                      </div>
                      <div style={{ maxWidth: 480 }}>
                        <p
                          style={{
                            fontSize: 'clamp(18px, 2.2vw, 22px)',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            letterSpacing: '-0.01em',
                            lineHeight: 1.25,
                            margin: 0,
                          }}
                        >
                          {isDragOver
                            ? 'Drop to upload'
                            : 'Drop your strategic memo (or up to 10), or click to browse'}
                        </p>
                        <p
                          style={{
                            fontSize: 14,
                            color: 'var(--text-secondary)',
                            marginTop: 8,
                            lineHeight: 1.55,
                          }}
                        >
                          Board decks, market-entry recommendations, M&amp;A memos, investment
                          theses. You&apos;ll have a full DQI grade, flagged biases, and predicted
                          CEO questions before your next meeting.
                        </p>
                        <p className="text-xs text-muted" style={{ marginTop: 10 }}>
                          PDF, DOCX, PPTX, XLSX, CSV, HTML, TXT, MD · up to{' '}
                          {billingData?.limits.maxUploadMB ?? 25} MB
                        </p>
                        {billingData && billingData.limits.analysesPerMonth > 0 && (
                          <p className="text-xs text-muted" style={{ marginTop: 6 }}>
                            {billingData.usage.analysesThisMonth}/
                            {billingData.limits.analysesPerMonth} analyses used this month (
                            {billingData.planName})
                          </p>
                        )}
                        {billingData &&
                          billingData.limits.analysesPerMonth > 0 &&
                          billingData.plan === 'free' &&
                          billingData.usage.analysesThisMonth /
                            billingData.limits.analysesPerMonth >=
                            0.8 && (
                            <Link
                              href="/dashboard/settings"
                              className="text-xs"
                              style={{
                                marginTop: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: 'var(--warning, #eab308)',
                                fontWeight: 600,
                              }}
                            >
                              <AlertTriangle size={12} />
                              {billingData.usage.analysesThisMonth >=
                              billingData.limits.analysesPerMonth
                                ? 'Limit reached — upgrade to continue analyzing'
                                : 'Approaching limit — upgrade for more analyses'}
                            </Link>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Reassurance chip strip — calms first-time anxiety. Shows only
                  on the empty dropzone state (not during upload / analyzing
                  so we don't duplicate feedback). */}
                  {!uploading && !pendingFile && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                        marginTop: 14,
                      }}
                    >
                      {[
                        { label: 'Under 60 seconds', icon: <Zap size={12} /> },
                        { label: 'SOC 2-ready · AES-256', icon: <Shield size={12} /> },
                        { label: 'Never used for training', icon: <LockIcon size={12} /> },
                        ...(billingData?.plan === 'free' &&
                        billingData?.limits?.analysesPerMonth > 0
                          ? [
                              {
                                label: `${billingData.limits.analysesPerMonth} free this month`,
                                icon: <Sparkles size={12} />,
                              },
                            ]
                          : []),
                      ].map(chip => (
                        <span
                          key={chip.label}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            padding: '6px 12px',
                            borderRadius: 999,
                          }}
                        >
                          <span style={{ color: 'var(--accent-primary)', display: 'inline-flex' }}>
                            {chip.icon}
                          </span>
                          {chip.label}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Four doors row — every ingestion mode on one surface.
                    File upload is the default (the dropzone above); the
                    three alternative modes route to their dedicated pages
                    without forcing a trip through the sidebar. Consolidates
                    the "same pipeline, different door" UX so cognitive-
                    audits/submit, meetings/new, and the email inbound
                    setup are all one click from /dashboard. */}
                  {!uploading && !pendingFile && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 10,
                        flexWrap: 'wrap',
                        marginTop: 18,
                        fontSize: 12,
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)' }}>Not uploading a file?</span>
                      <button
                        type="button"
                        onClick={() => setInlineMode('paste')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          fontWeight: 600,
                          color: 'var(--accent-primary)',
                          background: 'transparent',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          fontSize: 'inherit',
                        }}
                      >
                        <BrainCircuit size={13} />
                        Paste text
                      </button>
                      <span style={{ color: 'var(--border-color)' }}>·</span>
                      <Link
                        href="/dashboard/cognitive-audits/submit?source=meeting_recording"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          fontWeight: 600,
                          color: 'var(--accent-primary)',
                          textDecoration: 'none',
                        }}
                      >
                        <Video size={13} />
                        Submit a meeting
                      </Link>
                      <span style={{ color: 'var(--border-color)' }}>·</span>
                      <Link
                        href="/dashboard/settings/integrations"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          fontWeight: 600,
                          color: 'var(--accent-primary)',
                          textDecoration: 'none',
                        }}
                      >
                        <Mail size={13} />
                        Email inbox
                      </Link>
                      <span style={{ color: 'var(--border-color)' }}>·</span>
                      {/* 4th door: sample memo (Tier-A #4 ship 2026-05-26).
                       * Surfaces the role-matched bundle library as a peer
                       * ingestion mode alongside Paste / Meeting / Email.
                       * Always visible — restores the discovery path for
                       * the returning-with-zero-docs case where the
                       * FirstRunInlineWalkthrough has been dismissed. Loads
                       * the bundle into the paste card with autoSubmit=false
                       * so the user can read the memo before running.
                       * Falls back to the 'other' mixed library when no
                       * onboarding role is set (e.g. mid-onboarding state). */}
                      <button
                        type="button"
                        onClick={() => {
                          const role = onboardingRole ?? 'other';
                          const bundles = bundlesForRole(role);
                          const firstBundle: SampleBundle | undefined = bundles[0];
                          if (!firstBundle) return;
                          setPasteSeed({ content: firstBundle.content, autoSubmit: false });
                          setInlineMode('paste');
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          fontWeight: 600,
                          color: 'var(--accent-primary)',
                          background: 'transparent',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          fontSize: 'inherit',
                        }}
                        aria-label="Try the platform with a role-matched sample memo"
                      >
                        <FileText size={13} />
                        Try a sample
                      </button>
                    </div>
                  )}
                  {/* "What can I upload?" guidance — the always-available
                    answer to "is my document welcome here?" + "why does
                    this matter?". Re-openable (unlike the dismissible
                    first-run walkthrough); reads the upload-guidance SSOT.
                    The sample CTA reuses the four-doors "Try a sample"
                    behaviour so a "show me one first" user has a path. */}
                  {!uploading && !pendingFile && (
                    <UploadGuidancePanel
                      role={onboardingRole}
                      defaultOpen={uploadedDocs.length === 0}
                      onTrySample={() => {
                        const role = onboardingRole ?? 'other';
                        const bundles = bundlesForRole(role);
                        const firstBundle: SampleBundle | undefined = bundles[0];
                        if (!firstBundle) return;
                        setPasteSeed({ content: firstBundle.content, autoSubmit: false });
                        setInlineMode('paste');
                      }}
                    />
                  )}
                </>
              ) : uploading ? (
                uploadPhase === 'uploading' ? (
                  // While the file is still transferring, show a compact
                  // upload-progress bar. The unified AnalysisShell takes over
                  // once the server has accepted the upload and streaming begins.
                  <div className="card">
                    <div className="card-body">
                      <div className="flex items-center justify-between mb-md">
                        <div className="flex items-center gap-sm">
                          <CloudUpload size={16} className="text-accent-primary" />
                          <span className="text-sm font-medium">Uploading document…</span>
                        </div>
                        <span
                          className="text-sm font-semibold"
                          style={{ color: 'var(--text-highlight)' }}
                        >
                          {uploadProgress}%
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${uploadProgress}%`, transition: 'width 0.3s ease' }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <AnalysisShell
                    filename={pendingFile?.name ?? 'Strategic memo'}
                    currentProgress={currentProgress}
                    steps={analysisSteps}
                    biasCount={biasCountRef.current}
                    onCancel={() => {
                      cancelAnalysis();
                      setUploading(false);
                    }}
                  />
                )
              ) : null}
            </ErrorBoundary>

            {/* Bulk Upload — locked 2026-05-10 streamlining batch.
              Previously rendered as an always-visible separate card
              below the main upload zone (two upload boxes). Now mounts
              ONLY when the user drops/selects 2+ files on the main
              upload zone, with the dropped files pre-populated in the
              queue. Single upload box, dual-mode (single-file confirm
              modal vs bulk queue) — the founder's ask. */}
            {bulkFiles && bulkFiles.length > 0 && (
              <ErrorBoundary sectionName="Bulk Upload">
                <BulkUploadPanel
                  initialFiles={bulkFiles}
                  onComplete={() => mutateDocs?.()}
                  onDismiss={() => setBulkFiles(null)}
                />
              </ErrorBoundary>
            )}

            {/* Currently Analyzing Section */}
            <ErrorBoundary sectionName="Documents">
              {uploadedDocs.filter(d => d.status === 'analyzing').length > 0 && (
                <div className="section">
                  <h2 className="section-header flex items-center gap-2">
                    <Loader2 size={18} className="animate-spin text-accent-primary" />
                    Currently Analyzing
                  </h2>
                  <div className="space-y-3">
                    {uploadedDocs
                      .filter(d => d.status === 'analyzing')
                      .map(doc => (
                        <div key={doc.id} className="card">
                          <div className="card-body flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 'var(--radius-md)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: 'var(--bg-secondary)',
                                }}
                              >
                                <FileText size={18} style={{ color: 'var(--text-highlight)' }} />
                              </div>
                              <div>
                                <span className="font-medium text-sm inline-flex items-center gap-2">
                                  {doc.filename}
                                  {doc.isSample && <SampleBadge size="xs" />}
                                </span>
                                <p className="text-xs text-muted mt-0.5">
                                  Analysis in progress — results will appear when complete
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="progress-bar" style={{ width: 80 }}>
                                <div
                                  className="progress-bar-fill animate-pulse"
                                  style={{ width: '60%' }}
                                />
                              </div>
                              <Loader2
                                size={16}
                                className="animate-spin text-accent-primary shrink-0"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Recent Analyses Section */}
              {uploadedDocs.filter(d => d.status === 'complete').length > 0 && (
                <div className="section">
                  <div
                    className="flex items-center justify-between"
                    style={{ marginBottom: 'var(--spacing-md)' }}
                  >
                    <h2
                      className="section-header flex items-center gap-2"
                      style={{ marginBottom: 0 }}
                    >
                      <CheckCircle size={18} style={{ color: 'var(--success)' }} />
                      Recent Analyses
                    </h2>
                    <button
                      onClick={() => setActiveView('browse')}
                      className="text-sm text-secondary hover:text-primary hover:underline flex items-center gap-1"
                    >
                      View All <ChevronRight size={14} />
                    </button>
                  </div>
                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: {},
                      visible: { transition: { staggerChildren: 0.06 } },
                    }}
                  >
                    {uploadedDocs
                      .filter(d => d.status === 'complete')
                      .slice(0, 6)
                      .map(doc => (
                        <motion.div
                          key={doc.id}
                          variants={{
                            hidden: { opacity: 0, y: 16 },
                            visible: { opacity: 1, y: 0 },
                          }}
                          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                          whileHover={{ y: -3, transition: { duration: 0.2 } }}
                        >
                          <Link
                            href={`/documents/${doc.id}`}
                            className="card group hover:border-[var(--border-hover)] transition-all"
                            style={{ textDecoration: 'none', display: 'block' }}
                          >
                            <div className="card-body">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div
                                    style={{
                                      width: 32,
                                      height: 32,
                                      flexShrink: 0,
                                      borderRadius: 'var(--radius-md)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      background: 'var(--bg-secondary)',
                                    }}
                                  >
                                    <FileText
                                      size={16}
                                      style={{ color: 'var(--text-secondary)' }}
                                    />
                                  </div>
                                  <span className="font-medium text-sm truncate max-w-[130px]">
                                    {doc.filename}
                                  </span>
                                </div>
                                {doc.score !== undefined && (
                                  <span
                                    className="text-sm font-bold shrink-0 ml-2"
                                    style={{
                                      color:
                                        doc.score >= 70
                                          ? 'var(--success)'
                                          : doc.score >= 40
                                            ? 'var(--warning)'
                                            : 'var(--error)',
                                    }}
                                  >
                                    {Math.round(doc.score)}%
                                  </span>
                                )}
                              </div>
                              {doc.score !== undefined && (
                                <div className="progress-bar mb-2">
                                  <div
                                    className="progress-bar-fill"
                                    style={{
                                      width: `${doc.score}%`,
                                      background:
                                        doc.score >= 70
                                          ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                                          : doc.score >= 40
                                            ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                                            : 'linear-gradient(90deg, #ef4444, #dc2626)',
                                    }}
                                  />
                                </div>
                              )}
                              <div className="flex items-center justify-between text-xs text-muted">
                                <span>{formatDate(doc.uploadedAt)}</span>
                                <span className="flex items-center gap-1 group-hover:text-primary transition-colors">
                                  View Analysis <ArrowRight size={12} />
                                </span>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                  </motion.div>
                </div>
              )}
            </ErrorBoundary>

            {/* De-duplicated 2026-05-18 (founder screenshot): the empty
              upload view previously rendered a SECOND upload CTA here —
              an EnhancedEmptyState "Start your <KG>" card whose
              "Choose a File" fired the same #file-input as the real
              dropzone above (#onborda-upload). Two stacked ways to do
              the identical thing read as confusing. The dropzone is the
              single canonical upload surface (drag + multi-file +
              format list + the onborda tour anchor + its own value
              copy); FirstRunInlineWalkthrough is the try-a-sample path;
              the four-doors row is paste/meeting/email. The retrospective
              nudge that lived in this block is a marketing nuance, not a
              third upload affordance — re-add as ONE line in the
              dropzone copy if wanted, never a separate card. */}
          </>
        )}

        {/* ═══════ BROWSE & ANALYZE VIEW ═══════ */}
        {activeView === 'browse' && (
          <>
            {/* Activity Feed - Collapsible. AccentCard info accent
                (informational/data surface); bodyStyle padding:0 keeps
                the existing collapse-button header + card-body
                edge-to-edge. The sibling Documents card below stays a
                bare .card on purpose — it's a ~250-line deep-nested
                anchored section with its own prominent search/filter
                header (already highly visually distinct, not the
                indistinct-stacked-white-card problem the AccentCard
                discipline targets), and a close-tag rematch there is
                pure regression risk for a marginal stripe. */}
            <AccentCard accent="info" bodyStyle={{ padding: 0 }}>
              <button
                onClick={() => setShowActivityFeed(prev => !prev)}
                className="w-full card-header flex items-center justify-between hover:bg-[var(--bg-card-hover)] transition-colors"
                aria-expanded={showActivityFeed}
              >
                <h3 className="flex items-center gap-2 text-base">
                  <Clock size={18} style={{ color: 'var(--text-secondary)' }} />
                  Recent Activity
                  {activities.length > 0 && (
                    <span className="text-xs text-muted font-normal">
                      ({activities.length} events)
                    </span>
                  )}
                </h3>
                <ChevronRight
                  size={18}
                  className={`text-muted transition-transform ${showActivityFeed ? 'rotate-90' : ''}`}
                />
              </button>
              {showActivityFeed && (
                <div className="card-body">
                  <ErrorBoundary sectionName="Activity Feed">
                    <ActivityFeed
                      activities={activities}
                      isLoading={feedLoading}
                      hasMore={feedHasMore}
                      onLoadMore={feedLoadMore}
                    />
                  </ErrorBoundary>
                </div>
              )}
            </AccentCard>

            {/* Documents List */}
            <style>
              {`
              .docrow {
                position: relative;
              }
              .docrow:hover {
                background: var(--bg-secondary);
                border-left-color: var(--accent-primary) !important;
              }
              .docrow:hover .docrow-fileicon {
                transform: translateY(-1px);
              }
              .docrow .docrow-fileicon {
                transition: transform 0.18s ease;
              }
            `}
            </style>
            <div id="documents" className="card">
              <div className="card-header flex items-center justify-between">
                <div className="flex items-center gap-md">
                  <h3 className="text-base">Documents</h3>
                  {totalDocs > 0 && (
                    <span className="text-xs text-muted">
                      {sortedDocs.length} shown · {totalDocs} total
                    </span>
                  )}
                </div>

                {/* Compact Search & Filter */}
                <div className="flex items-center gap-sm">
                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                    />
                    <input
                      type="text"
                      placeholder="Search..."
                      aria-label="Search documents"
                      value={searchInput}
                      onChange={e => {
                        setSearchInput(e.target.value);
                        setDocsPage(1);
                      }}
                      className="pl-8 pr-7 py-1.5 text-sm bg-primary border border-border w-40 focus:w-56 transition-all"
                    />
                    {searchInput && (
                      <button
                        onClick={() => {
                          setSearchInput('');
                          setSearchQuery('');
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
                        aria-label="Clear search"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <select
                    value={statusFilter}
                    aria-label="Filter by status"
                    onChange={e => {
                      setStatusFilter(
                        e.target.value as 'all' | 'complete' | 'analyzing' | 'pending'
                      );
                      setDocsPage(1);
                    }}
                    className="px-3 py-1.5 text-sm bg-primary border border-border"
                  >
                    <option value="all">All Status</option>
                    <option value="complete">Complete</option>
                    <option value="analyzing">Analyzing</option>
                    <option value="pending">Pending</option>
                  </select>

                  <select
                    value={sortBy}
                    aria-label="Sort documents"
                    onChange={e => setSortBy(e.target.value as typeof sortBy)}
                    className="px-3 py-1.5 text-sm bg-primary border border-border"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="scoreHigh">Score: High→Low</option>
                    <option value="scoreLow">Score: Low→High</option>
                    <option value="name">Name A-Z</option>
                  </select>
                </div>
              </div>

              <div className="card-body p-0">
                {loadingDocs ? (
                  <div className="divide-y divide-border">
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} className="flex items-center justify-between p-md animate-pulse">
                        <div className="flex items-center gap-md">
                          <div className="w-5 h-5 skeleton-shimmer" />
                          <div className="h-4 w-48 skeleton-shimmer" />
                        </div>
                        <div className="flex items-center gap-md">
                          <div className="h-3 w-20 skeleton-shimmer" />
                          <div className="h-7 w-24 skeleton-shimmer" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : uploadedDocs.length === 0 ? (
                  <EnhancedEmptyState
                    type="documents"
                    showBrief
                    briefContext="documents"
                    actions={[
                      {
                        label: 'Go to Upload',
                        onClick: () => setActiveView('upload'),
                        variant: 'primary',
                        icon: <Upload className="w-4 h-4" />,
                      },
                    ]}
                  />
                ) : sortedDocs.length === 0 ? (
                  <div className="flex flex-col items-center gap-sm p-xl text-center">
                    <Search size={32} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                    <p className="text-sm text-muted">No matches found</p>
                    <button
                      onClick={() => {
                        setSearchInput('');
                        setSearchQuery('');
                        setStatusFilter('all');
                      }}
                      className="btn btn-ghost text-sm"
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {/* Select all header + compare entry point */}
                    <div
                      className="flex items-center gap-md p-md"
                      style={{
                        background: 'var(--bg-secondary)',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div className="flex items-center gap-md">
                        <input
                          type="checkbox"
                          aria-label="Select all documents"
                          checked={selectedDocs.size === sortedDocs.length && sortedDocs.length > 0}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedDocs(new Set(sortedDocs.map(d => d.id)));
                            } else {
                              setSelectedDocs(new Set());
                            }
                          }}
                          style={{
                            width: 14,
                            height: 14,
                            accentColor: 'var(--accent-primary)',
                            cursor: 'pointer',
                          }}
                        />
                        <span className="text-xs text-muted">
                          {selectedDocs.size > 0
                            ? `${selectedDocs.size} selected`
                            : `${sortedDocs.length} documents`}
                        </span>
                      </div>
                      {/* Compare empty-state hint — Item C lock 2026-05-07.
                        Users with exactly 1 audit see no Compare affordance
                        because the chip below requires sortedDocs.length >= 2.
                        This single-line hint surfaces the feature so the
                        user knows Compare exists + unlocks on the next
                        upload. Renders only at length === 1 so it never
                        competes with the active chip below. */}
                      {sortedDocs.length === 1 && (
                        <span
                          className="flex items-center gap-xs text-xs"
                          style={{
                            color: 'var(--text-muted)',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-color)',
                            fontStyle: 'italic',
                            whiteSpace: 'nowrap',
                          }}
                          title="Side-by-side compare unlocks at 2+ audited memos"
                        >
                          <GitCompareArrows size={12} />
                          Compare unlocks on your next audit
                        </span>
                      )}
                      {sortedDocs.length >= 2 &&
                        (() => {
                          // One verb, one chip, four progressive states.
                          // Collapses the prior split between the header
                          // "Compare memos" discovery chip and the batch-bar
                          // "Compare Selected" action button.
                          const count = selectedDocs.size;
                          const canCompare = count >= 2 && count <= 3;
                          const href = canCompare
                            ? `/dashboard/compare?doc=${Array.from(selectedDocs).slice(0, 3).join(',')}`
                            : '/dashboard/compare';
                          const label =
                            count === 0
                              ? 'Compare memos'
                              : count === 1
                                ? 'Select 1 more to compare'
                                : count > 3
                                  ? 'Select 2–3 to compare'
                                  : `Compare ${count}`;
                          const active = count === 0 || canCompare;
                          const title = canCompare
                            ? `Compare ${count} selected memos`
                            : count > 3
                              ? 'Compare accepts up to 3 memos at a time'
                              : 'Compare 2–3 memos side-by-side';
                          const style: React.CSSProperties = {
                            color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-full)',
                            background: active ? 'rgba(22, 163, 74, 0.08)' : 'var(--bg-tertiary)',
                            border: `1px solid ${
                              active ? 'rgba(22, 163, 74, 0.22)' : 'var(--border-color)'
                            }`,
                            textDecoration: 'none',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            cursor: active ? 'pointer' : 'default',
                            pointerEvents: active ? 'auto' : 'none',
                          };
                          return (
                            <Link
                              href={href}
                              className="flex items-center gap-xs text-xs"
                              title={title}
                              aria-disabled={!active}
                              style={style}
                            >
                              <GitCompareArrows size={12} />
                              {label}
                            </Link>
                          );
                        })()}
                    </div>
                    {sortedDocs.map((doc, idx) => (
                      <div
                        key={doc.id}
                        className="docrow flex items-center justify-between p-md transition-all animate-fade-in"
                        style={{
                          animationDelay: `${idx * 0.03}s`,
                          borderLeft: '3px solid transparent',
                        }}
                      >
                        <div className="flex items-center gap-md min-w-0">
                          <input
                            type="checkbox"
                            aria-label={`Select ${doc.filename}`}
                            checked={selectedDocs.has(doc.id)}
                            onChange={e => {
                              setSelectedDocs(prev => {
                                const next = new Set(prev);
                                if (e.target.checked) next.add(doc.id);
                                else next.delete(doc.id);
                                return next;
                              });
                            }}
                            style={{
                              width: 14,
                              height: 14,
                              accentColor: 'var(--accent-primary)',
                              cursor: 'pointer',
                              flexShrink: 0,
                            }}
                          />
                          <div
                            className="docrow-fileicon"
                            style={{
                              width: 36,
                              height: 36,
                              flexShrink: 0,
                              borderRadius: 'var(--radius-md)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: doc.isSample
                                ? 'rgba(22, 163, 74, 0.08)'
                                : 'var(--bg-secondary)',
                              border: doc.isSample
                                ? '1px solid rgba(22, 163, 74, 0.18)'
                                : '1px solid var(--border-color)',
                            }}
                          >
                            <FileText
                              size={16}
                              style={{
                                color: doc.isSample
                                  ? 'var(--accent-primary)'
                                  : 'var(--text-secondary)',
                              }}
                            />
                          </div>
                          <span className="truncate text-sm font-medium inline-flex items-center gap-2">
                            {doc.filename}
                            {doc.isSample && <SampleBadge size="xs" />}
                          </span>
                        </div>

                        <div className="flex items-center gap-md shrink-0">
                          {doc.status === 'analyzing' && (
                            <span className="flex items-center gap-sm text-xs text-muted">
                              <Loader2 size={12} className="animate-spin" />
                              Analyzing
                            </span>
                          )}

                          {(doc.status === 'error' || doc.status === 'pending') && (
                            <div className="flex items-center gap-sm">
                              {doc.status === 'error' && (
                                <span className="badge badge-critical">Failed</span>
                              )}
                              {doc.status === 'pending' && (
                                <span className="text-xs text-muted">Pending</span>
                              )}
                              <button
                                onClick={() => retryAnalysis(doc.id)}
                                disabled={uploading}
                                className="btn btn-ghost btn-sm flex items-center gap-1 text-xs"
                              >
                                <RefreshCw size={12} />
                                {doc.status === 'error' ? 'Retry' : 'Analyze'}
                              </button>
                            </div>
                          )}

                          {/* Fallback: doc has a status that didn't match analyzing/error/pending/complete
                            (e.g. legacy 'queued', sample memos with status='ready', etc.). Without this
                            block the row would render empty on the right side — the visible bug on the
                            documents browse where sample docs sat with no action. */}
                          {doc.status !== 'analyzing' &&
                            doc.status !== 'error' &&
                            doc.status !== 'pending' &&
                            doc.status !== 'complete' && (
                              <Link
                                href={`/documents/${doc.id}`}
                                className="btn btn-ghost btn-sm flex items-center gap-2"
                                title="Open document"
                              >
                                <ArrowRight size={14} />
                                Open
                              </Link>
                            )}

                          {doc.status === 'complete' && (
                            <>
                              {doc.score !== undefined && (
                                <div className="flex items-center gap-2">
                                  <span
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                                    style={{
                                      color:
                                        doc.score < 40
                                          ? 'var(--error)'
                                          : doc.score < 70
                                            ? 'var(--warning)'
                                            : 'var(--success)',
                                      background:
                                        doc.score < 40
                                          ? 'rgba(239, 68, 68, 0.1)'
                                          : doc.score < 70
                                            ? 'rgba(245, 158, 11, 0.1)'
                                            : 'rgba(34, 197, 94, 0.1)',
                                    }}
                                  >
                                    {doc.score < 40
                                      ? 'HIGH RISK'
                                      : doc.score < 70
                                        ? 'MEDIUM'
                                        : 'LOW RISK'}
                                  </span>
                                  <div className="progress-bar" style={{ width: 64 }}>
                                    <div
                                      className="progress-bar-fill"
                                      style={{
                                        width: `${doc.score}%`,
                                        background:
                                          doc.score >= 70
                                            ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                                            : doc.score >= 40
                                              ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                                              : 'linear-gradient(90deg, #ef4444, #dc2626)',
                                      }}
                                    />
                                  </div>
                                  <span
                                    className="text-sm font-bold min-w-[36px]"
                                    style={{
                                      color:
                                        doc.score >= 70
                                          ? 'var(--success)'
                                          : doc.score >= 40
                                            ? 'var(--warning)'
                                            : 'var(--error)',
                                    }}
                                  >
                                    {Math.round(doc.score)}%
                                  </span>
                                </div>
                              )}
                              <Link
                                href={`/documents/${doc.id}`}
                                className="btn btn-primary btn-sm flex items-center gap-2"
                              >
                                <BarChart3 size={14} />
                                View Analysis
                              </Link>
                              <a
                                href={`/api/documents/${doc.id}/provenance-record?format=pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-ghost btn-sm flex items-center gap-1"
                                title="Download Decision Provenance Record · hashed + tamper-evident PDF"
                                aria-label="Download Decision Provenance Record"
                                style={{ whiteSpace: 'nowrap' }}
                              >
                                <ShieldCheck size={14} />
                                DPR
                              </a>
                            </>
                          )}

                          {deleteModal.open && deleteModal.docId === doc.id ? (
                            <div className="flex items-center gap-xs">
                              <span className="text-xs text-muted">Delete?</span>
                              <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="px-2 py-0.5 text-xs rounded"
                                style={{
                                  background: 'rgba(239,68,68,0.15)',
                                  color: 'var(--error)',
                                  border: '1px solid rgba(239,68,68,0.3)',
                                }}
                              >
                                {deleting ? <Loader2 size={10} className="animate-spin" /> : 'Yes'}
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteModal({ open: false, docId: '', filename: '' })
                                }
                                disabled={deleting}
                                className="px-2 py-0.5 text-xs text-muted rounded"
                                style={{ border: '1px solid var(--border-color)' }}
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() =>
                                setDeleteModal({
                                  open: true,
                                  docId: doc.id,
                                  filename: doc.filename,
                                })
                              }
                              className="p-1.5 text-muted hover:text-error transition-colors rounded"
                              title="Delete"
                              aria-label={`Delete ${doc.filename}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Batch action bar */}
            {selectedDocs.size > 0 && (
              <div
                className="flex items-center justify-between p-sm mt-sm"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <span className="text-sm font-medium">
                  {selectedDocs.size} document{selectedDocs.size > 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center gap-sm">
                  <button
                    onClick={() => setSelectedDocs(new Set())}
                    className="btn btn-ghost text-sm"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleBatchDelete}
                    disabled={batchDeleting}
                    className="btn btn-sm flex items-center gap-xs text-sm"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: 'var(--error)',
                    }}
                  >
                    {batchDeleting ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Trash2 size={12} />
                    )}
                    Delete Selected
                  </button>
                </div>
              </div>
            )}

            {/* Documents Paginator */}
            {docsTotalPages > 1 && (
              <div className="flex items-center justify-center gap-sm mt-md">
                <button
                  onClick={() => setDocsPage(p => Math.max(1, p - 1))}
                  disabled={docsPage <= 1}
                  className="btn btn-ghost text-sm"
                >
                  Previous
                </button>
                <span className="text-sm text-muted">
                  Page {docsPage} of {docsTotalPages}
                </span>
                <button
                  onClick={() => setDocsPage(p => Math.min(docsTotalPages, p + 1))}
                  disabled={docsPage >= docsTotalPages}
                  className="btn btn-ghost text-sm"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Delete Confirmation Modal */}
        {/* Global drag overlay — appears when dragging files anywhere on the page */}
        {globalDrag && !uploading && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.70)',
              backdropFilter: 'blur(20px) saturate(150%)',
            }}
          >
            <div
              className="animate-fade-in"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--spacing-lg)',
                padding: 'var(--spacing-2xl)',
                border: '2px dashed var(--border-hover)',
                borderRadius: 'var(--radius-xl)',
                background: 'var(--bg-card-hover)',
                backdropFilter: 'blur(24px) saturate(160%)',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <CloudUpload size={48} style={{ color: 'var(--accent-primary)' }} />
              <div className="text-center">
                <p className="font-semibold text-lg">Drop your document here</p>
                <p className="text-sm text-muted mt-1">
                  PDF, DOCX, PPTX, XLSX, CSV, HTML, TXT, MD · Max{' '}
                  {billingData?.limits.maxUploadMB ?? 25} MB
                </p>
                {billingData && billingData.limits.analysesPerMonth > 0 && (
                  <p className="text-xs text-muted" style={{ marginTop: '4px' }}>
                    {billingData.usage.analysesThisMonth}/{billingData.limits.analysesPerMonth}{' '}
                    analyses used this month ({billingData.planName})
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Scan Panel */}
        <QuickScanModal open={quickScanOpen} onClose={() => setQuickScanOpen(false)} />

        {/* Knowledge Graph merge consent (shown when a Pro user's org
          upgraded to Strategy and they have personal memos to decide on) */}
        <KGMergeConsentModal
          open={kgConsent?.status === 'pending'}
          memoCount={kgConsent?.memoCount ?? 0}
          onDecision={decision =>
            setKgConsent(prev =>
              prev ? { ...prev, status: decision === 'merged' ? 'merged' : 'private' } : prev
            )
          }
        />

        {/* First-audit guided overlay — Improvement #1, shipped
            2026-05-28. Fires exactly once per user when their first
            audit completes. Teaches "what you're looking at", "read
            like an audit committee", "the artefact you forward".
            Dismissible; sessionStorage signal prevents re-fire. */}
        <FirstAuditGuidedOverlay
          active={overlayActive}
          onComplete={() => setOverlayActive(false)}
        />
      </div>
    </ModalStackProvider>
  );
}
