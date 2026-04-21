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
import { Share2, ShieldCheck } from 'lucide-react';

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
}

interface Document {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  content: string;
  uploadedAt: string;
  status: string;
  isSample?: boolean;
  documentType?: string | null;
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

  const color = conviction.score >= 70 ? '#3b82f6' : conviction.score >= 40 ? '#16A34A' : '#71717a';

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

  // View-as toggle: Analyst (full detail) / CSO (condensed) / Board (inline report).
  // Persisted via ?view= URL param (primary source) + localStorage fallback so the
  // same user keeps their preferred density across documents. Default: CSO — the
  // most demo-ready view and the closest match to the previous "focused" default.
  type ViewMode = 'analyst' | 'cso' | 'board';
  const resolveInitialViewMode = (): ViewMode => {
    if (typeof window === 'undefined') return 'cso';
    const param = new URLSearchParams(window.location.search).get('view');
    if (param === 'analyst' || param === 'cso' || param === 'board') return param;
    // Legacy values from the previous Focused/Full toggle
    if (param === 'focused') return 'cso';
    if (param === 'full') return 'analyst';
    try {
      const saved = localStorage.getItem('di-doc-view-mode');
      if (saved === 'analyst' || saved === 'cso' || saved === 'board') return saved;
    } catch {
      /* ignore */
    }
    return 'cso';
  };
  const [viewMode, setViewModeState] = useState<ViewMode>(resolveInitialViewMode);
  const setViewMode = useCallback((next: ViewMode) => {
    setViewModeState(next);
    try {
      localStorage.setItem('di-doc-view-mode', next);
    } catch {
      /* ignore */
    }
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('view', next);
      window.history.replaceState({}, '', url.toString());
    }
  }, []);
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
      /* ignore */
    }
    return 'before';
  };
  const [phase, setPhaseState] = useState<DocumentPhase>(resolveInitialPhase);
  const setPhase = useCallback((next: DocumentPhase) => {
    setPhaseState(next);
    try {
      localStorage.setItem('di-doc-phase', next);
    } catch {
      /* ignore */
    }
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (next === 'before') url.searchParams.delete('phase');
      else url.searchParams.set('phase', next);
      window.history.replaceState({}, '', url.toString());
    }
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

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const res = await fetch(`/api/documents/${resolvedParams.id}`);
        if (!res.ok) throw new Error('Document not found');
        const data = await res.json();
        setDocument(data);
        if (data.analyses?.[0]?.biases?.[0]) {
          setSelectedBias(null); // Don't auto-select
        }
        // Log document view for audit trail (fire and forget)
        fetch('/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'VIEW_DOCUMENT',
            resource: 'Document',
            resourceId: data.id,
            details: { filename: data.filename },
          }),
        }).catch(err => log.warn('audit VIEW_DOCUMENT failed:', err));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        setLoading(false);
      }
    };
    fetchDocument();
  }, [resolvedParams.id]);

  // Abort any in-flight scan stream on unmount
  useEffect(() => {
    return () => {
      scanAbortRef.current?.abort();
    };
  }, []);

  const handleBoardReportExport = async () => {
    if (!document || !analysis) return;
    try {
      const { BoardReportGenerator } = await import('@/lib/reports/board-report-generator');
      const generator = new BoardReportGenerator();
      generator.generateReport({
        filename: document.filename,
        analysis,
        confidential: isBoardConfidential,
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
    } catch {
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
      .catch(() => {})
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
      .catch(() => {});
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
          { label: 'Documents', href: '/dashboard' },
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
                  fontSize: 'clamp(22px, 3vw, 30px)',
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  lineHeight: 1.2,
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
              </div>
            </div>
          </div>

          <div className="flex items-center gap-md">
            {/* Conviction Score — complementary to DQI (shown in ExecutiveSummary hero) */}
            {analysis && <ConvictionBadge analysis={analysis} />}

            <div className="flex items-center gap-sm">
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
              {analysis && (
                <button
                  onClick={() => setShowShareModal(true)}
                  className="btn btn-secondary btn-sm flex items-center gap-sm"
                  aria-label="Share and export"
                >
                  <Share2 size={14} />
                  Share & Export
                </button>
              )}
              {/* Decision Provenance Record — Pro-gated, server-side branded
                  PDF export. URL path is kept as /api/compliance/audit-packet
                  for backwards compatibility with the 2026-04-22 rename;
                  the user-visible label and filename both say "Decision
                  Provenance Record." */}
              {analysis && (
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/compliance/audit-packet/${analysis.id}`);
                      if (res.status === 402) {
                        alert(
                          'Decision Provenance Record export requires the Pro plan or higher. Upgrade to unlock regulator-grade compliance reports.'
                        );
                        return;
                      }
                      if (!res.ok) {
                        alert('Failed to generate Decision Provenance Record. Please try again.');
                        return;
                      }
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = window.document.createElement('a');
                      a.href = url;
                      const contentDisposition = res.headers.get('content-disposition') || '';
                      const match = contentDisposition.match(/filename="([^"]+)"/);
                      a.download = match?.[1] || `decision-provenance-record-${analysis.id}.pdf`;
                      window.document.body.appendChild(a);
                      a.click();
                      window.document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    } catch {
                      alert('Failed to download Decision Provenance Record.');
                    }
                  }}
                  className="btn btn-secondary btn-sm flex items-center gap-sm"
                  aria-label="Export Decision Provenance Record"
                  title="Export a regulator-grade PDF citing every framework section triggered by this decision (EU AI Act Art 14, SEC, Basel III)"
                >
                  <ShieldCheck size={14} />
                  Decision Provenance Record
                </button>
              )}
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

      {/* Temporal phase scrub — sits above the Executive Summary since
          it frames the entire document view. Swapping phases swaps the
          body below (before = full analyst/cso/board; during = human
          decision panel; after = outcome + recalibrated DQI). */}
      {analysis && (
        <ErrorBoundary sectionName="Decision timeline phase scrub">
          <TimelinePhaseScrub phase={phase} onChange={setPhase} />
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
          <PhaseDuringPanel
            documentId={resolvedParams.id}
            analysisId={analysis.id}
            hasHumanDecision={false}
          />
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
                  ? '#16A34A'
                  : analysis.overallScore > 60
                    ? '#eab308'
                    : '#ef4444'
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
                        ? '#16A34A'
                        : analysis.overallScore > 60
                          ? '#eab308'
                          : '#ef4444',
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
                /* toast already shown by handler */
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

          {/* Counterfactual Analysis */}
          {analysis && (
            <div className="mb-lg">
              <CounterfactualPanel analysisId={analysis.id} />
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
            className="grid"
            style={{ gridTemplateColumns: '1fr 380px', gap: 'var(--spacing-xl)' }}
          >
            <div className="flex flex-col gap-lg">
              {/* Tab Bar with group labels */}
              <div
                className="flex flex-wrap items-end gap-0 mb-lg"
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
                        biases={biases}
                        uploadedAt={document.uploadedAt}
                        analysisCreatedAt={analysis?.createdAt}
                        analysisId={analysis?.id}
                        compoundAdjustments={analysis?.compliance?.compoundScoring?.adjustments}
                        recognitionCues={analysis?.recognitionCues}
                        narrativePreMortem={analysis?.narrativePreMortem}
                        dealSector={document.deal?.sector ?? null}
                        dealTicketSize={document.deal?.ticketSize ?? null}
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
                                    falsPositiveBiases: string[];
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
          onExportProvenanceRecord={handleProvenanceRecordExport}
          onExportCsv={handleCsvExport}
          onExportMarkdown={handleMarkdownExport}
          onExportJson={handleJsonExport}
        />
      )}
    </div>
  );
}
