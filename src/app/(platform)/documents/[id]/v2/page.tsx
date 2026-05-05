/**
 * Document detail · v2 — McKinsey-grade refactor preview.
 *
 * Locked 2026-05-05. Parallel route to /documents/[id] so the founder
 * can verify the new architecture on real audits before we swap.
 *
 * Architecture:
 *   - DocumentDetailShell (PDF/text left pane + audit right pane + sticky
 *     header + corner gear settings drawer)
 *   - 5 opinionated tabs (Findings / Actions / Stress test / Perspectives
 *     / Regulatory)
 *   - Settings drawer holds methodology / lineage / share / danger
 *
 * Once the founder validates the v2 UX on a few real audits, the route
 * swap is a single rename (this file → ../page.tsx, retire the v1
 * page.tsx). Until then, v1 stays live at /documents/[id].
 */

'use client';

import { useEffect, useState, useCallback, useMemo, use, lazy, Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Share2, FileText, AlertTriangle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ShareModal } from '@/components/ui/ShareModal';
import { useToast } from '@/components/ui/EnhancedToast';
import { createClientLogger } from '@/lib/utils/logger';
import type { BiasInstance } from '@/types';

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
} from '@/components/documents/detail/tabs';
import { BIAS_EDUCATION } from '@/lib/constants/bias-education';

const BiasAnnotatedPDFViewer = lazy(() =>
  import('@/components/visualizations/BiasAnnotatedPDFViewer').then(m => ({
    default: m.BiasAnnotatedPDFViewer,
  }))
);

const log = createClientLogger('DocumentDetailV2');

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
}

interface Document {
  id: string;
  filename: string;
  fileType?: string;
  uploadedAt: string;
  status: 'pending' | 'analyzing' | 'analyzed' | 'failed';
  isOwner?: boolean;
  isSample?: boolean;
  visibility?: string;
  analyses?: Analysis[];
}

const TAB_KEYS: DocDetailTab[] = ['findings', 'actions', 'stress', 'perspectives', 'regulatory'];

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

  /* ───── R²F per-document map (derived from biases) ───── */
  const r2fProtected = useMemo(
    () => deriveProtectedItems(biases),
    [biases]
  );
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

  /* ───── states ───── */
  if (loading) return <LoadingState />;
  if (error || !document) return <ErrorState error={error} />;

  const filename = document.filename;
  const dqiScore = analysis?.overallScore ?? null;
  const classification = document.isSample ? 'sample' : 'confidential';

  /* ───── left pane ───── */
  const isPdf =
    document.fileType === 'application/pdf' ||
    filename?.toLowerCase().endsWith('.pdf');

  const leftPane = isPdf ? (
    <Suspense
      fallback={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 48,
            color: 'var(--text-muted)',
            fontSize: 13,
          }}
        >
          <FileText size={16} style={{ marginRight: 8 }} /> Loading PDF…
        </div>
      }
    >
      <BiasAnnotatedPDFViewer
        documentId={document.id}
        biases={biases}
        onBiasSelect={handleBiasClick}
      />
    </Suspense>
  ) : (
    <ExtractedTextFallback />
  );

  /* ───── stress slots ───── */
  const stressSlots: StressTestSlot[] = [
    {
      id: 'boardroom',
      available: false,
      content: <StubPanel label="Boardroom" />,
    },
    {
      id: 'whatif',
      available: false,
      content: <StubPanel label="What-if" />,
    },
    {
      id: 'redteam',
      available: false,
      content: <StubPanel label="Red team" />,
    },
    {
      id: 'swot',
      available: false,
      content: <StubPanel label="SWOT" />,
    },
    {
      id: 'forgotten',
      available: false,
      content: <StubPanel label="Forgotten Questions" />,
    },
    {
      id: 'intelligence',
      available: false,
      content: <StubPanel label="Intelligence" />,
    },
  ];

  /* ───── regulatory triggers (placeholder; wired in next iteration) ───── */
  const regulatoryTriggers: RegulatoryTabFrameworkTrigger[] = [];

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
            csoSlot={<StubPanel label="CSO lens" />}
            icSlot={<StubPanel label="IC lens" />}
            boardSlot={<StubPanel label="Board lens" />}
            analystSlot={<StubPanel label="Analyst lens" />}
          />
        );
      case 'regulatory':
        return <RegulatoryTab triggers={regulatoryTriggers} />;
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

      {/* Settings drawer */}
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
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent-primary)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
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

      {/* Share modal */}
      {showShareModal && analysis && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          analysisId={analysis.id}
          documentName={document.filename}
          analysisData={{ score: analysis.overallScore, biases: analysis.biases }}
          onExportPdf={async () => {
            /* wired in next iteration */
          }}
          onExportCsv={() => {
            /* wired in next iteration */
          }}
          onExportMarkdown={() => {
            /* wired in next iteration */
          }}
          onExportJson={() => {
            /* wired in next iteration */
          }}
        />
      )}
    </>
  );
}

/* ───── helper components ───── */

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

function ExtractedTextFallback() {
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
        Extracted text · audit basis
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        Inline preview is not yet wired for non-PDF document types. The audit on the right
        runs against the extracted text the pipeline indexed at upload time. Open the
        original file in your local app to cross-reference passages.
      </div>
    </div>
  );
}

function StubPanel({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: 24,
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: 13,
        border: '1px dashed var(--border-color)',
        borderRadius: 'var(--radius-md, 8px)',
        fontStyle: 'italic',
      }}
    >
      {label} — wired in commit 5b (full data slot integration).
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
      if (res.ok) {
        onDeleted();
      } else {
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

/* ───── R²F derivation helpers ───── */

function deriveProtectedItems(biases: BiasInstance[]) {
  // Heuristic: if no biases are flagged at high+ severity on a given lens,
  // treat it as a "protected intuition" claim. v1 of this derivation —
  // future work pulls from the Validity Classifier + Reference Class
  // Forecast modules already in src/lib/learning/ for richer per-doc
  // anchors.
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
    severity: (b.severity?.toLowerCase() ?? 'low') as
      | 'critical'
      | 'high'
      | 'medium'
      | 'low',
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
