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
import { ArrowLeft, Share2, FileText, AlertTriangle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
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
import { LiveRedFlagsAlert } from '@/components/analysis/LiveRedFlagsAlert';
import { LivePredictedQuestions } from '@/components/analysis/LivePredictedQuestions';
import { StructuralAssumptionsPanel } from '@/components/analysis/StructuralAssumptionsPanel';
import type { Severity } from '@/components/documents/detail/primitives';

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
const RedTeamTab = lazy(() =>
  import('./tabs/RedTeamTab').then(m => ({ default: m.RedTeamTab }))
);
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
  marketContextApplied?: MarketContext;
  marketContextOverride?: MarketContext | null;
}

interface Document {
  id: string;
  filename: string;
  fileType?: string;
  content?: string;
  uploadedAt: string;
  status: 'pending' | 'analyzing' | 'analyzed' | 'failed';
  isOwner?: boolean;
  isSample?: boolean;
  visibility?: string;
  analyses?: Analysis[];
}

const TAB_KEYS: DocDetailTab[] = ['findings', 'actions', 'stress', 'perspectives', 'regulatory'];

/* ---------------- Page ---------------- */

export default function DocumentDetailV2Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { showToast } = useToast();

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DocDetailTab>('findings');
  const [activeBiasId, setActiveBiasId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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

  /* ───── derived ───── */
  const analysis = document?.analyses?.[0] ?? null;
  const biases = analysis?.biases ?? [];

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
  const sovereignContexts = useMemo(
    () => deriveSovereignContexts(marketContext),
    [marketContext]
  );

  /* ───── states ───── */
  if (loading) return <LoadingState />;
  if (error || !document) return <ErrorState error={error} />;

  const filename = document.filename;
  const dqiScore = analysis?.overallScore ?? null;
  const classification = document.isSample ? ('sample' as const) : ('confidential' as const);

  /* ───── left pane ───── */
  const isPdf =
    document.fileType === 'application/pdf' || filename?.toLowerCase().endsWith('.pdf');

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
          <FindingsTab
            biases={biases}
            r2fProtected={r2fProtected}
            r2fSuppressed={r2fSuppressed}
            r2fSummary="Mapped from your memo's flagged passages and structural assumptions."
            activeBiasId={activeBiasId}
            onBiasClick={handleBiasClick}
            taxonomyIdByType={taxonomyIdByType}
          />
        );
      case 'actions':
        return (
          <ActionsTab
            biases={biases}
            lifecycleStage={lifecycleStage}
            auditedAt={analysis?.createdAt}
            outcomeAt={analysis?.outcome?.occurredAt}
            outcomeDueAt={analysis?.outcomeDueAt}
            taxonomyIdByType={taxonomyIdByType}
            onBiasClick={handleBiasClick}
          />
        );
      case 'stress':
        return <StressTestTab slots={stressSlots} />;
      case 'perspectives':
        return (
          <PerspectivesTab
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
                <IcLensView
                  analysis={analysis}
                  biases={biases}
                  marketContext={marketContext}
                />
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
                      onExportPdf={() =>
                        Promise.resolve(setShowShareModal(true))
                      }
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
          <RegulatoryTab
            triggers={regulatoryTriggers}
            sovereignContexts={sovereignContexts}
          />
        );
      default:
        return null;
    }
  })();

  return (
    <>
      <DocumentDetailShell
        filename={filename}
        dqiScore={dqiScore}
        classification={classification}
        primaryAction={
          analysis
            ? {
                label: 'Share & Export DPR',
                onClick: () => setShowShareModal(true),
              }
            : undefined
        }
        activeTab={activeTab}
        onTabChange={handleTabChange}
        activeBiasId={activeBiasId}
        leftPane={leftPane}
        rightPaneContent={tabBody}
        hasPreview
        onOpenSettings={() => setShowSettings(true)}
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
            onClick={() => {
              setShowSettings(false);
              setShowShareModal(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Share2 size={13} /> Open share modal
          </button>
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

function LoadingState() {
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: 14,
      }}
    >
      Loading audit…
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

function PaneFallback({ label }: { label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        color: 'var(--text-muted)',
        fontSize: 13,
        gap: 8,
      }}
    >
      <FileText size={14} /> {label}
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
          Inline preview is not yet wired for non-PDF document types. The audit on the
          right runs against the extracted text the pipeline indexed at upload time.
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
          fontFamily:
            '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
      <button
        type="button"
        onClick={() => setConfirming(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 14px',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--severity-critical)',
          background: 'transparent',
          border: '1px solid var(--severity-critical)',
          borderRadius: 6,
          cursor: 'pointer',
        }}
      >
        Delete document
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        style={{
          flex: 1,
          padding: '8px 14px',
          fontSize: 13,
          fontWeight: 600,
          color: '#fff',
          background: 'var(--severity-critical)',
          border: 'none',
          borderRadius: 6,
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? 'Deleting…' : 'Confirm delete'}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        style={{
          padding: '8px 14px',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--text-secondary)',
          background: 'transparent',
          border: '1px solid var(--border-color)',
          borderRadius: 6,
          cursor: 'pointer',
        }}
      >
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

function deriveSuppressedItems(
  biases: BiasInstance[],
  taxonomyIdByType: Record<string, string>
) {
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

function formatBiasLabel(biasType: string): string {
  return biasType
    .replace(/_bias$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
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
  const { generateMarkdownReport, downloadMarkdown } = await import(
    '@/lib/reports/markdown-generator'
  );
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
    swotAnalysis: analysis.swotAnalysis as Parameters<typeof generateMarkdownReport>[0]['swotAnalysis'],
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
