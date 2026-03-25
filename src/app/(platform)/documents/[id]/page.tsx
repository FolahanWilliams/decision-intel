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
  PlayCircle,
  Info,
  RefreshCw,
  Brain,
  Users,
  Vote,
  Globe,
} from 'lucide-react';
import { useToast } from '@/components/ui/ToastContext';
import { SSEReader } from '@/lib/sse';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClientLogger } from '@/lib/utils/logger';
import { formatDate } from '@/lib/constants/human-audit';

const log = createClientLogger('DocumentDetail');
import { BiasDetailModal } from './BiasDetailModal';
import { OutcomeReporter } from './OutcomeReporter';
import { DraftOutcomeCard } from '@/components/ui/DraftOutcomeCard';
import { DecisionPriorCapture, PostAnalysisPrior } from '@/components/ui/DecisionPriorCapture';
import { OutcomeTimeframePicker } from '@/components/ui/OutcomeTimeframePicker';
import { CounterfactualPanel } from '@/components/ui/CounterfactualPanel';
import { DecisionRoomList } from '@/components/ui/DecisionRoomCard';
import { ToxicCombinationCard } from '@/components/visualizations/ToxicCombinationCard';
import { ScoringBreakdown } from '@/components/visualizations/ScoringBreakdown';
import { RelatedDecisions } from '@/components/ui/RelatedDecisions';
import { RecommendationsPanel } from '@/components/ui/RecommendationsPanel';
import { ExecutiveSummary } from '@/components/visualizations/ExecutiveSummary';
import { ErrorBoundary } from '@/components/ErrorBoundary';
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
} from '@/types';
import { RegulatoryHorizonWidget } from './RegulatoryHorizonWidget';
import { InstitutionalMemoryWidget } from './InstitutionalMemoryWidget';
import { BiasNetwork } from '@/components/visualizations/BiasNetwork';
import { ShareModal } from '@/components/ui/ShareModal';
import { Share2 } from 'lucide-react';

// Lazy-loaded tab components
const OverviewTab = lazy(() =>
  import('./tabs/OverviewTab').then(m => ({ default: m.OverviewTab }))
);
const LogicTab = lazy(() => import('./tabs/LogicTab').then(m => ({ default: m.LogicTab })));
const SwotTab = lazy(() => import('./tabs/SwotTab').then(m => ({ default: m.SwotTab })));
const NoiseTab = lazy(() => import('./tabs/NoiseTab').then(m => ({ default: m.NoiseTab })));
const RedTeamTab = lazy(() => import('./tabs/RedTeamTab').then(m => ({ default: m.RedTeamTab })));
const BoardroomTab = lazy(() =>
  import('./tabs/BoardroomTab').then(m => ({ default: m.BoardroomTab }))
);
const SimulatorTab = lazy(() =>
  import('./tabs/SimulatorTab').then(m => ({ default: m.SimulatorTab }))
);
const IntelligenceTab = lazy(() =>
  import('./tabs/IntelligenceTab').then(m => ({ default: m.IntelligenceTab }))
);
const ReplayTab = lazy(() => import('./tabs/ReplayTab').then(m => ({ default: m.ReplayTab })));

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
      biasAdjustments: Array<{ biasType: string; priorConfidence: number; posteriorConfidence: number; direction: string; reason: string }>;
    };
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
}

interface Document {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  content: string;
  uploadedAt: string;
  status: string;
  analyses: Analysis[];
}

type TabId =
  | 'overview'
  | 'biases'
  | 'factcheck'
  | 'compliance'
  | 'cognitive'
  | 'logic'
  | 'swot'
  | 'noise'
  | 'simulator'
  | 'red-team'
  | 'boardroom'
  | 'intelligence'
  | 'replay';

const VALID_TABS: TabId[] = [
  'overview',
  'logic',
  'swot',
  'noise',
  'red-team',
  'boardroom',
  'simulator',
  'intelligence',
  'replay',
];

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

  // URL-based tab state (#7)
  const tabFromUrl = searchParams.get('tab') as TabId | null;
  const activeTab: TabId = tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'overview';

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
        }).catch(() => {});
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
        }).catch(() => {});
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
      }).catch(() => {});
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
              .catch(() => {});
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
      <div className="container" style={{ paddingTop: 'var(--spacing-2xl)' }}>
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
        label: 'Analysis',
        tabs: [
          { id: 'replay', label: 'Replay', icon: PlayCircle },
          { id: 'logic', label: 'Logic', icon: CheckCircle },
          { id: 'swot', label: 'SWOT', icon: Lightbulb },
          { id: 'noise', label: 'Noise', icon: Info },
        ],
      },
      {
        label: 'Scenarios',
        tabs: [
          ...(analysis?.cognitiveAnalysis
            ? [{ id: 'red-team' as const, label: 'Red Team', icon: Users }]
            : []),
          ...(analysis?.simulation
            ? [{ id: 'boardroom' as const, label: 'Boardroom', icon: Vote }]
            : []),
          { id: 'simulator' as const, label: 'Simulator', icon: PlayCircle },
        ],
      },
      ...(analysis?.intelligenceContext
        ? [
            {
              label: 'Context',
              tabs: [{ id: 'intelligence' as const, label: 'Intelligence', icon: Globe }],
            },
          ]
        : []),
    ];

  return (
    <div
      className="container"
      style={{ paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)' }}
    >
      {/* Breadcrumbs (#11) */}
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Documents', href: '/dashboard' },
          { label: document.filename },
        ]}
      />

      {/* Header */}
      <header style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-md">
            <Link href="/dashboard" className="btn btn-ghost p-2" aria-label="Back to dashboard">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-semibold">{document.filename}</h1>
              <p className="text-sm text-muted">
                {formatDate(document.uploadedAt)} • {(document.fileSize / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-md">
            {/* Prominent score display */}
            {analysis && (
              <div style={{ textAlign: 'center', marginRight: '8px' }}>
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Score
                </div>
                <div
                  style={{
                    fontSize: '36px',
                    fontWeight: 700,
                    lineHeight: 1,
                    fontFamily: "'JetBrains Mono', monospace",
                    color:
                      analysis.overallScore >= 70
                        ? '#22c55e'
                        : analysis.overallScore >= 40
                          ? '#f59e0b'
                          : '#ef4444',
                  }}
                >
                  {Math.round(analysis.overallScore)}
                </div>
              </div>
            )}

            <div className="flex items-center gap-sm">
              {document.status === 'complete' && (
                <span
                  className="flex items-center gap-sm text-sm"
                  style={{ color: 'var(--success)' }}
                >
                  <CheckCircle size={16} /> Complete
                </span>
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
            </div>
          </div>
        </div>

        {/* Gradient accent line */}
        <div
          style={{
            height: '2px',
            marginTop: 'var(--spacing-md)',
            background:
              'linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.15), rgba(255,255,255,0.05))',
            borderRadius: '1px',
          }}
        />
      </header>

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

      {/* Bias Network Map */}
      {analysis && biases.length > 0 && (
        <div className="mb-xl">
          <ErrorBoundary sectionName="Bias Network">
            <div className="card">
              <div
                className="card-header"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
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
        <div className="mb-lg">
          <OutcomeReporter
            analysisId={analysis.id}
            analysisDate={analysis.createdAt}
            biases={biases}
            twins={analysis.simulation?.twins}
          />
        </div>
      )}

      {/* Counterfactual Analysis */}
      {analysis && (
        <div className="mb-lg">
          <CounterfactualPanel analysisId={analysis.id} />
        </div>
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
          {isScanning ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          Run Live Audit
        </button>
      </div>

      {/* Summary & Live Stream */}
      <div className="grid grid-3 mb-xl">
        <div className="col-span-2">
          {analysis?.summary ? (
            <div className="card h-full animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="card-header">
                <h3>Executive Summary</h3>
              </div>
              <div className="card-body">
                <p style={{ fontSize: '1rem', lineHeight: 1.6 }}>{analysis.summary}</p>
              </div>
            </div>
          ) : (
            <div className="card h-full flex items-center justify-center p-xl">
              <p className="text-muted">Initiate LIVE SCAN to generate audit summary.</p>
            </div>
          )}
        </div>

        {/* Scan Terminal */}
        <div
          className="card animate-fade-in"
          style={{ animationDelay: '0.4s', background: 'var(--bg-card)' }}
        >
          <div className="card-header" style={{ background: 'var(--bg-secondary)' }}>
            <h3 className="flex items-center gap-sm text-xs">
              <Terminal size={14} /> Live Scan Feed
            </h3>
          </div>
          <div
            className="card-body"
            style={{
              padding: 'var(--spacing-md)',
              fontSize: '10px',
              height: '200px',
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
            {analysis.factCheck.searchSources && analysis.factCheck.searchSources.length > 0 && (
              <div
                style={{
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.06)',
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
                            background: 'rgba(255, 255, 255, 0.05)',
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
              {analysis.factCheck.verifications && analysis.factCheck.verifications.length > 0 ? (
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

      {/* Tabs + Content */}
      <div className="grid" style={{ gridTemplateColumns: '1fr 350px', gap: 'var(--spacing-lg)' }}>
        <div className="flex flex-col gap-lg">
          {/* Tab Bar with group labels */}
          <div
            className="flex flex-wrap items-end gap-0 mb-lg"
            role="tablist"
            aria-label="Analysis tabs"
            style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
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
                        className="flex items-center gap-sm px-4 py-2 text-sm font-medium transition-colors -mb-px"
                        style={
                          activeTab === tab.id
                            ? {
                                background: 'rgba(255, 255, 255, 0.06)',
                                color: '#FFFFFF',
                                borderBottom: '2px solid #FFFFFF',
                              }
                            : {
                                color: 'var(--text-muted)',
                                background: 'transparent',
                                borderBottom: '2px solid transparent',
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
                  />
                </ErrorBoundary>
              )}
              {activeTab === 'replay' && analysis && (
                <ErrorBoundary sectionName="Decision Replay">
                  <ReplayTab
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
                        ? { compliance: analysis.compliance as import('@/types').ComplianceResult }
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
                        ? { simulation: analysis.simulation as import('@/types').SimulationResult }
                        : {}),
                      ...(analysis.cognitiveAnalysis
                        ? {
                            cognitiveAnalysis:
                              analysis.cognitiveAnalysis as import('@/types').CognitiveAnalysisResult,
                          }
                        : {}),
                    }}
                  />
                </ErrorBoundary>
              )}
              {activeTab === 'logic' && (
                <ErrorBoundary sectionName="Logic Analysis">
                  <LogicTab logicalAnalysis={analysis?.logicalAnalysis} />
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
              {activeTab === 'red-team' && (
                <ErrorBoundary sectionName="Red Team">
                  <RedTeamTab
                    analysisId={analysis?.id}
                    cognitiveAnalysis={analysis?.cognitiveAnalysis}
                    preMortem={analysis?.preMortem}
                  />
                </ErrorBoundary>
              )}
              {activeTab === 'boardroom' && (
                <ErrorBoundary sectionName="Boardroom Simulation">
                  <BoardroomTab simulation={analysis?.simulation} />
                </ErrorBoundary>
              )}
              {activeTab === 'simulator' && (
                <ErrorBoundary sectionName="What-If Simulator">
                  <SimulatorTab
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
            </Suspense>
          </div>
        </div>

        {/* Right Column: Bias Sidebar */}
        <ErrorBoundary sectionName="Bias Sidebar">
          <div className="flex flex-col gap-lg">
            <div className="card">
              <div className="card-body p-md flex justify-around">
                <div className="text-center">
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>
                    Decision Quality
                  </div>
                  <div style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>
                    {analysis ? Math.round(analysis.overallScore) : '--'}
                  </div>
                </div>
                <div className="text-center">
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>
                    Noise Score
                  </div>
                  <div style={{ color: 'var(--accent-secondary)', fontWeight: 700 }}>
                    {analysis ? Math.round(analysis.noiseScore) : '--'}
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={{ alignSelf: 'start', width: '100%' }}>
              <div className="card-header">
                <h3>Detected Biases</h3>
              </div>
              <div
                style={{ maxHeight: '60vh', overflowY: 'auto' }}
                role="list"
                aria-label="Detected biases"
              >
                {biases.length > 0 ? (
                  biases.map((bias, idx) => (
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
                        padding: 'var(--spacing-md)',
                        borderBottom:
                          idx < biases.length - 1 ? '1px solid var(--border-color)' : 'none',
                        cursor: 'pointer',
                        background:
                          selectedBias?.id === bias.id
                            ? 'rgba(255, 255, 255, 0.06)'
                            : 'transparent',
                        borderLeft:
                          selectedBias?.id === bias.id
                            ? '3px solid var(--accent-primary)'
                            : '3px solid transparent',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span style={{ fontWeight: 500, fontSize: '13px' }}>{bias.biasType}</span>
                        <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                      </div>
                      <span
                        className={`badge badge-${bias.severity}`}
                        style={{ marginTop: 'var(--spacing-xs)', fontSize: '9px' }}
                      >
                        {bias.severity}
                        <span className="sr-only"> severity</span>
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-xl text-center text-muted text-xs">No data available</div>
                )}
              </div>
            </div>
          </div>
        </ErrorBoundary>
      </div>

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
      {analysis?.compliance && (analysis.compliance.compoundScoring || analysis.compliance.bayesianPriors) && (
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
          onExportCsv={handleCsvExport}
          onExportMarkdown={handleMarkdownExport}
          onExportJson={handleJsonExport}
        />
      )}
    </div>
  );
}
