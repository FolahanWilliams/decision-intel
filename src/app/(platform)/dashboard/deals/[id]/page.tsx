/**
 * Deal Detail · v2 — McKinsey-grade refactor.
 *
 * Locked 2026-05-06. Same shell + visual rhythm as /documents/[id]:
 *
 *   ┌─── Header (sticky) ───────────────────────────────────┐
 *   │ deal name · DqiPill · stage chip · IC countdown · DPR │
 *   └───────────────────────────────────────────────────────┘
 *   ┌── Composite pane (~58%) ──┬── Audit pane (~42%) ──────┐
 *   │ DealCompositeHero          │ Documents · Findings     │
 *   │ DealCounterfactualHero     │ Brief · Stress · Outcome │
 *   │ CrossReferenceCard         │ ⚙ corner gear            │
 *   │ IcReadinessGate            │   (Edit + Archive deal)  │
 *   │ DealRegulatoryBelt         │                          │
 *   └───────────────────────────┴───────────────────────────┘
 *
 * The composite pane carries the always-visible "what does this deal
 * look like at a glance" view (composite DQI + bias signature + IC
 * readiness + regulatory exposure). The audit pane holds the 5 buyer-
 * question tabs. Settings drawer wires the new POST /api/deals/[id]/archive
 * endpoint shipped 2026-05-06 alongside the existing edit modal.
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useToast } from '@/components/ui/EnhancedToast';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronRight,
  FileText,
  Upload,
  AlertTriangle,
  GitCompareArrows,
  Clock,
  Pencil,
  Archive,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { gradeMetaFromScore } from '@/lib/utils/grade';
import { useDeal } from '@/hooks/useDeals';
import { DealFormModal } from '@/components/deals/DealFormModal';
import { DealOutcomeForm } from '@/components/deals/DealOutcomeForm';
import { DealOutcomeDisplay } from '@/components/deals/DealOutcomeDisplay';
import { DecisionBriefTab } from '@/components/deals/DecisionBriefTab';
import { UpgradeFromAudit } from '@/components/deals/UpgradeFromAudit';
import { DealCompositeHero } from '@/components/deals/DealCompositeHero';
import { DealCounterfactualHero } from '@/components/deals/DealCounterfactualHero';
import { UploadToDealButton } from '@/components/deals/UploadToDealButton';
import { CrossReferenceCard } from '@/components/deals/CrossReferenceCard';
import { CrossRefBadge } from '@/components/deals/CrossRefBadge';
import { IcReadinessGate } from '@/components/deals/IcReadinessGate';
import { DealRegulatoryBelt } from '@/components/deals/DealRegulatoryBelt';
import { InlineDealUploadZone } from '@/components/deals/InlineDealUploadZone';
import { DecisionDetailShell } from '@/components/documents/detail/DocumentDetailShell';
import { SettingsDrawer } from '@/components/documents/detail/SettingsDrawer';
import type { DealCrossReferenceFinding } from '@/types/deals';
import { extractCrossReferenceFindings as extractFindings } from '@/lib/utils/deal-cross-reference';
import {
  STAGE_COLORS,
  DEAL_TYPE_COLORS,
  STATUS_COLORS,
  getStageLabel,
  getDealTypeLabel,
  getDocTypeLabel,
  getNextStage,
  formatTicketSize,
  type DealSummary,
} from '@/types/deals';

type DealTab = 'documents' | 'findings' | 'brief' | 'stress' | 'outcome';

const TAB_KEYS: DealTab[] = ['documents', 'findings', 'brief', 'stress', 'outcome'];

/* ────────────────────────────────────────────────────────────── */
/*                  Page                                          */
/* ────────────────────────────────────────────────────────────── */

export default function DealDetailPage() {
  const params = useParams();
  const dealId = params.id as string;
  const router = useRouter();
  const { showToast } = useToast();

  const { deal, isLoading, error, mutate } = useDeal(dealId);
  const [activeTab, setActiveTab] = useState<DealTab>('documents');
  const [showEditForm, setShowEditForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [advancingStage, setAdvancingStage] = useState(false);

  const handleAdvanceStage = useCallback(async () => {
    if (!deal) return;
    const next = getNextStage(deal.stage);
    if (!next) return;
    setAdvancingStage(true);
    try {
      const res = await fetch('/api/deals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deal.id, stage: next }),
      });
      if (res.ok) {
        showToast(`Advanced to ${getStageLabel(next)}`, 'success');
        mutate();
      } else {
        showToast('Failed to advance stage. Please try again.', 'error');
      }
    } catch {
      showToast('Failed to advance stage. Please try again.', 'error');
    } finally {
      setAdvancingStage(false);
    }
  }, [deal, mutate, showToast]);

  const crossRefFindings: DealCrossReferenceFinding[] = useMemo(
    () => (deal ? extractFindings(deal.crossReference) : []),
    [deal]
  );

  const compositeDqi = deal?.aggregation?.compositeDqi ?? null;
  const analyzedDocCount = deal?.aggregation?.analyzedDocCount ?? 0;
  const totalDocCount = deal?.documents?.length ?? 0;

  /* ────── Loading / Error ────── */

  if (isLoading) {
    return (
      <div style={{ padding: '32px 24px', maxWidth: 1600, margin: '0 auto' }}>
        <div
          style={{
            height: 240,
            background: 'var(--bg-card-hover, var(--bg-tertiary))',
            borderRadius: 12,
            animation: 'pulse 1.5s infinite',
          }}
        />
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div
        className="container"
        style={{ maxWidth: 1000, padding: '24px 20px', textAlign: 'center' }}
      >
        <AlertTriangle size={40} style={{ color: 'var(--error)', marginBottom: 12 }} />
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
          Project not found
        </div>
        <Link
          href="/dashboard/deals"
          style={{
            color: 'var(--accent-primary)',
            fontSize: 13,
            marginTop: 8,
            display: 'inline-block',
          }}
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  /* ────── Header chrome ────── */

  const stageColor = STAGE_COLORS[deal.stage] || '#6b7280';
  const typeColor = DEAL_TYPE_COLORS[deal.dealType] || '#6b7280';
  const statusColor = STATUS_COLORS[deal.status] || '#6b7280';
  const nextStage = getNextStage(deal.stage);

  // Cross-doc conflict count for the header chip — derived from the
  // already-fetched `crossRefFindings` so no extra round-trip.
  // Item 4 lock 2026-05-07: Richard persona expects this as the second
  // metric after composite DQI in the procurement-grade verdict band.
  const conflictCount = crossRefFindings.length;
  const conflictHighCount = crossRefFindings.filter(
    f => f.severity === 'high' || f.severity === 'critical'
  ).length;

  const headerChips = (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <Chip color={typeColor}>{getDealTypeLabel(deal.dealType)}</Chip>
      <Chip color={stageColor}>{getStageLabel(deal.stage)}</Chip>
      {deal.status !== 'active' && <Chip color={statusColor}>{deal.status}</Chip>}
      {deal.icDate && <IcCountdownChip icDate={deal.icDate as unknown as string} />}
      {conflictCount > 0 && (
        <ConflictCountChip conflictCount={conflictCount} highSeverityCount={conflictHighCount} />
      )}
      {deal.ticketSize && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatTicketSize(deal.ticketSize, deal.currency)}
        </span>
      )}
    </div>
  );

  /* ────── Left pane (always-visible composite) ────── */

  const leftPane = (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <UpgradeFromAudit dealId={dealId} />

      <ErrorBoundary sectionName="IC Readiness">
        <IcReadinessGate deal={deal} />
      </ErrorBoundary>

      <DealRegulatoryBelt countries={deal.emergingMarketCountries} />

      {deal.aggregation && (
        <ErrorBoundary sectionName="Composite hero">
          <DealCompositeHero aggregation={deal.aggregation} totalDocs={totalDocCount} />
        </ErrorBoundary>
      )}

      <ErrorBoundary sectionName="Cross-reference">
        <CrossReferenceCard
          dealId={deal.id}
          initialRun={deal.crossReference ?? null}
          aggregation={deal.aggregation ?? null}
          onRunCompleted={() => mutate()}
        />
      </ErrorBoundary>

      {/* Verb cluster — Upload + Ask Copilot. Lives at the bottom of the
         composite pane so the daily-flow primary actions are reachable
         without scrolling past the at-a-glance view. */}
      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          paddingTop: 12,
          borderTop: '1px solid var(--border-color)',
        }}
      >
        <UploadToDealButton dealId={deal.id} dealName={deal.name} onUploaded={() => mutate()} />
        {(() => {
          const latest = (deal.documents ?? [])
            .filter(d => d.status === 'analyzed' && d.analyses?.[0]?.id)
            .sort((a, b) => {
              const ta = new Date(a.analyses?.[0]?.createdAt ?? 0).getTime();
              const tb = new Date(b.analyses?.[0]?.createdAt ?? 0).getTime();
              return tb - ta;
            })[0];
          if (!latest) return null;
          return (
            <Link
              href={`/dashboard/ask?documentId=${latest.id}`}
              className="btn btn-secondary"
              style={{
                padding: '8px 14px',
                fontSize: 12.5,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                textDecoration: 'none',
              }}
            >
              Ask Copilot about this deal
            </Link>
          );
        })()}
        {nextStage && deal.status === 'active' && (
          <button
            onClick={handleAdvanceStage}
            disabled={advancingStage}
            className="btn btn-primary"
            style={{
              padding: '8px 14px',
              fontSize: 12.5,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Advance to {getStageLabel(nextStage)} <ChevronRight size={13} />
          </button>
        )}
      </div>
    </div>
  );

  /* ────── Tabs ────── */

  const tabs = [
    { id: 'documents' as const, label: 'Documents', badge: totalDocCount || undefined },
    {
      id: 'findings' as const,
      label: 'Findings',
      available: analyzedDocCount > 0,
    },
    {
      id: 'brief' as const,
      label: 'Brief',
      available: analyzedDocCount > 0,
    },
    {
      id: 'stress' as const,
      label: 'Stress test',
      available: analyzedDocCount >= 2,
    },
    { id: 'outcome' as const, label: 'Outcome' },
  ];

  const tabBody = (() => {
    switch (activeTab) {
      case 'documents':
        return (
          <DocumentsTab
            documents={deal.documents || []}
            dealId={deal.id}
            dealName={deal.name}
            onUploaded={() => mutate()}
            crossRefFindings={crossRefFindings}
          />
        );
      case 'findings':
        return (
          <BiasSummaryTab documents={deal.documents || []} aggregation={deal.aggregation ?? null} />
        );
      case 'brief':
        return <DecisionBriefTab dealId={dealId} />;
      case 'stress':
        return (
          <ErrorBoundary sectionName="Counterfactual hero">
            <DealCounterfactualHero dealId={deal.id} />
          </ErrorBoundary>
        );
      case 'outcome':
        return <OutcomeTab deal={deal} onUpdate={() => mutate()} />;
      default:
        return null;
    }
  })();

  return (
    <ErrorBoundary sectionName="Deal Detail">
      <DecisionDetailShell
        title={deal.name}
        dqiScore={compositeDqi}
        classification="confidential"
        headerChips={headerChips}
        primaryAction={
          analyzedDocCount > 0
            ? {
                label: 'Export Deal DPR',
                onClick: () => {
                  window.open(
                    `/api/deals/${deal.id}/provenance-record?format=pdf`,
                    '_blank',
                    'noopener'
                  );
                },
              }
            : undefined
        }
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={t => {
          if (TAB_KEYS.includes(t as DealTab)) setActiveTab(t as DealTab);
        }}
        leftPane={leftPane}
        rightPaneContent={tabBody}
        hasPreview
        onOpenSettings={() => setShowSettings(true)}
        settingsLabel="Deal settings"
        breadcrumbs={
          <Link
            href="/dashboard/deals"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              color: 'var(--text-muted)',
              fontSize: 12,
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={14} /> Projects
          </Link>
        }
      />

      <SettingsDrawer
        open={showSettings}
        onClose={() => setShowSettings(false)}
        methodologySlot={
          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            Composite DQI averages the latest analysis from every analyzed document in the deal.
            Cross-reference flags surface contradictions across docs (CIM vs model vs IC deck). The
            deal-level DPR carries the composite verdict + per-doc audit lineage in a single hashed
            artefact for the audit committee.
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
            <div>deal_id: {deal.id}</div>
            <div>
              analyzed_docs: {analyzedDocCount} / {totalDocCount}
            </div>
            <div>cross_ref: {deal.crossReference ? 'on file' : '—'}</div>
          </div>
        }
        sharingSlot={
          <button
            type="button"
            onClick={() => {
              setShowSettings(false);
              setShowEditForm(true);
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
            }}
          >
            <Pencil size={13} /> Edit deal details
          </button>
        }
        dangerSlot={
          <ArchiveDealButton
            dealId={deal.id}
            dealName={deal.name}
            isArchived={deal.status === 'archived'}
            onArchived={() => {
              showToast('Deal archived. Documents purge after the grace window.', 'success');
              router.push('/dashboard/deals');
            }}
          />
        }
      />

      <DealFormModal
        open={showEditForm}
        onOpenChange={setShowEditForm}
        deal={deal as unknown as DealSummary}
        onSuccess={() => mutate()}
      />
    </ErrorBoundary>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*                  Helper components                             */
/* ────────────────────────────────────────────────────────────── */

function Chip({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        color,
        background: `${color}18`,
        border: `1px solid ${color}33`,
        padding: '2px 8px',
        borderRadius: 999,
        letterSpacing: '0.04em',
        textTransform: 'capitalize',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

function IcCountdownChip({ icDate }: { icDate: string }) {
  // Capture a stable mount-time so the countdown is computed during
  // render purely (Date.now() in render trips react-hooks/purity).
  // Minute-level precision is fine — the chip caption changes slowly,
  // and a remount on next page-visit refreshes it.
  const [mountTime] = useState(() => Date.now());
  const ms = new Date(icDate).getTime() - mountTime;
  if (Number.isNaN(ms)) return null;
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  const isOverdue = days < 0;
  const isImminent = !isOverdue && days <= 7;
  const color = isOverdue
    ? 'var(--severity-critical)'
    : isImminent
      ? 'var(--severity-medium)'
      : 'var(--info)';
  const label = isOverdue
    ? `IC ${Math.abs(days)}d overdue`
    : days === 0
      ? 'IC today'
      : `IC in ${days}d`;
  return (
    <span
      title={`IC date · ${new Date(icDate).toISOString().slice(0, 10)}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 10.5,
        fontWeight: 700,
        color,
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        border: `1px solid ${color}`,
        padding: '2px 8px',
        borderRadius: 999,
        letterSpacing: '0.04em',
      }}
    >
      <Clock size={11} /> {label}
    </span>
  );
}

/**
 * ConflictCountChip — header-row chip surfacing the cross-doc conflict
 * count from the most-recent DealCrossReference run. Color-coded by
 * highSeverityCount: any high/critical conflicts → red; ≥3 conflicts
 * with no high severity → amber; 1-2 medium/low conflicts → info-blue.
 *
 * Item 4 lock 2026-05-07. Mounted in the deal page header chip row
 * directly after IC countdown, BEFORE ticket size — Richard persona
 * (mid-market PE Head of M&A) expects this as the second metric after
 * composite DQI in the procurement-grade verdict band.
 */
function ConflictCountChip({
  conflictCount,
  highSeverityCount,
}: {
  conflictCount: number;
  highSeverityCount: number;
}) {
  const color =
    highSeverityCount > 0 ? 'var(--error)' : conflictCount >= 3 ? 'var(--warning)' : 'var(--info)';
  const label = `${conflictCount} conflict${conflictCount !== 1 ? 's' : ''}${
    highSeverityCount > 0 ? ` · ${highSeverityCount} high` : ''
  }`;
  const title =
    highSeverityCount > 0
      ? `${conflictCount} cross-doc conflict${conflictCount !== 1 ? 's' : ''} flagged · ${highSeverityCount} at high or critical severity`
      : `${conflictCount} cross-doc conflict${conflictCount !== 1 ? 's' : ''} flagged across analyzed documents`;
  return (
    <span
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 10.5,
        fontWeight: 700,
        color,
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        border: `1px solid ${color}`,
        padding: '2px 8px',
        borderRadius: 999,
        letterSpacing: '0.04em',
      }}
    >
      <GitCompareArrows size={11} /> {label}
    </span>
  );
}

function ArchiveDealButton({
  dealId,
  dealName,
  isArchived,
  onArchived,
}: {
  dealId: string;
  dealName: string;
  isArchived: boolean;
  onArchived: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  if (isArchived) {
    return (
      <div
        style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          fontStyle: 'italic',
          padding: '8px 14px',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
          borderRadius: 6,
        }}
      >
        Deal already archived. Attached documents are scheduled for purge after the grace window.
      </div>
    );
  }

  const handleArchive = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/deals/${dealId}/archive`, { method: 'POST' });
      if (res.ok) {
        onArchived();
      } else {
        // Body-parse fallback so we can surface the API's error message.
        const body = await res.json().catch(() => null);
        const msg =
          body && typeof body.error === 'string'
            ? body.error
            : `Archive failed (HTTP ${res.status})`;
        showToast(msg, 'error');
        setLoading(false);
        setConfirming(false);
      }
    } catch {
      showToast('Archive failed. Please try again.', 'error');
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
        <Archive size={13} /> Archive deal
      </button>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        Archiving <strong>{dealName}</strong> marks it as archived and soft-deletes attached
        documents. They will be permanently purged after the retention grace window. This action is
        recoverable during the grace window only via support.
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={handleArchive}
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
          {loading ? 'Archiving…' : 'Confirm archive'}
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
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*                  Documents Tab                                 */
/* ────────────────────────────────────────────────────────────── */

function DocumentsTab({
  documents,
  dealId,
  dealName,
  onUploaded,
  crossRefFindings = [],
}: {
  documents: Array<{
    id: string;
    filename: string;
    documentType: string | null;
    status: string;
    analyses?: Array<{ id: string; overallScore: number; createdAt: string }>;
  }>;
  dealId: string;
  dealName: string;
  onUploaded: () => void;
  crossRefFindings?: DealCrossReferenceFinding[];
}) {
  const router = useRouter();
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

  const selectedCount = selectedDocs.size;
  const canCompare = selectedCount >= 2 && selectedCount <= 3;
  const compareHref = canCompare
    ? `/dashboard/compare?doc=${Array.from(selectedDocs).join(',')}`
    : '/dashboard/compare';
  const compareLabel =
    selectedCount === 0
      ? 'Compare documents'
      : selectedCount === 1
        ? 'Select 1 more to compare'
        : selectedCount > 3
          ? 'Select 2–3 to compare'
          : `Compare ${selectedCount}`;
  const compareActive = selectedCount === 0 || canCompare;

  if (documents.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <InlineDealUploadZone dealId={dealId} dealName={dealName} onUploaded={onUploaded} />
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            background: 'var(--bg-card)',
            borderRadius: 10,
            border: '1px dashed var(--border-color)',
          }}
        >
          <FileText size={32} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
          <div
            style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}
          >
            No documents linked to this project
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
            Drop a document above to upload it directly into this deal, or open the dashboard to
            link an existing analysis.
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn btn-secondary"
            style={{
              padding: '6px 16px',
              fontSize: 12,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              margin: '0 auto',
            }}
          >
            <Upload size={13} /> Open dashboard
          </button>
        </div>
      </div>
    );
  }

  const allSelected = selectedDocs.size === documents.length && documents.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <InlineDealUploadZone dealId={dealId} dealName={dealName} onUploaded={onUploaded} />

      {documents.length >= 2 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 4,
          }}
        >
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              fontSize: 11.5,
              color: 'var(--text-secondary)',
            }}
          >
            <input
              type="checkbox"
              aria-label="Select all documents"
              checked={allSelected}
              onChange={e => {
                if (e.target.checked) {
                  setSelectedDocs(new Set(documents.map(d => d.id)));
                } else {
                  setSelectedDocs(new Set());
                }
              }}
              style={{
                width: 13,
                height: 13,
                accentColor: 'var(--accent-primary)',
                cursor: 'pointer',
              }}
            />
            {selectedCount > 0 ? `${selectedCount} selected` : `${documents.length} documents`}
          </label>
          <Link
            href={compareHref}
            onClick={e => {
              if (!compareActive) e.preventDefault();
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11,
              fontWeight: 600,
              color: compareActive ? 'var(--accent-primary)' : 'var(--text-muted)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              background: compareActive ? 'rgba(22, 163, 74, 0.08)' : 'var(--bg-tertiary)',
              border: `1px solid ${
                compareActive ? 'rgba(22, 163, 74, 0.22)' : 'var(--border-color)'
              }`,
              cursor: compareActive ? 'pointer' : 'not-allowed',
              textDecoration: 'none',
            }}
          >
            <GitCompareArrows size={12} />
            {compareLabel}
          </Link>
        </div>
      )}

      {documents.map(doc => {
        const latestScore = doc.analyses?.[0]?.overallScore;
        const scoreColour =
          latestScore === undefined ? null : gradeMetaFromScore(latestScore).color;
        const isSelected = selectedDocs.has(doc.id);
        return (
          <div
            key={doc.id}
            className="card"
            style={{
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderColor: isSelected ? 'var(--accent-primary)' : undefined,
              background: isSelected ? 'rgba(22, 163, 74, 0.04)' : undefined,
            }}
          >
            {documents.length >= 2 && (
              <input
                type="checkbox"
                aria-label={`Select ${doc.filename}`}
                checked={isSelected}
                onChange={e => {
                  e.stopPropagation();
                  setSelectedDocs(prev => {
                    const next = new Set(prev);
                    if (e.target.checked) next.add(doc.id);
                    else next.delete(doc.id);
                    return next;
                  });
                }}
                onClick={e => e.stopPropagation()}
                style={{
                  width: 13,
                  height: 13,
                  accentColor: 'var(--accent-primary)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              />
            )}
            <Link
              href={`/documents/${doc.id}`}
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <FileText size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {doc.filename}
                </div>
              </div>
              {scoreColour && latestScore !== undefined && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: scoreColour,
                    background: `${scoreColour}18`,
                    border: `1px solid ${scoreColour}33`,
                    padding: '2px 8px',
                    borderRadius: 999,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                  title="Decision Quality Index"
                >
                  DQI {Math.round(latestScore)}
                </span>
              )}
              <CrossRefBadge documentId={doc.id} findings={crossRefFindings} />
              {doc.documentType && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    color: 'var(--accent-primary)',
                    background: 'rgba(22, 163, 74, 0.1)',
                    padding: '2px 6px',
                    borderRadius: 4,
                  }}
                >
                  {getDocTypeLabel(doc.documentType)}
                </span>
              )}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color:
                    doc.status === 'analyzed'
                      ? 'var(--success)'
                      : doc.status === 'error'
                        ? 'var(--error)'
                        : 'var(--warning)',
                  background:
                    doc.status === 'analyzed'
                      ? 'rgba(16, 185, 129, 0.1)'
                      : doc.status === 'error'
                        ? 'rgba(239, 68, 68, 0.1)'
                        : 'rgba(245, 158, 11, 0.1)',
                  padding: '2px 6px',
                  borderRadius: 4,
                }}
              >
                {doc.status}
              </span>
            </Link>
          </div>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*                  Bias Summary (Findings) Tab                   */
/* ────────────────────────────────────────────────────────────── */

function BiasSummaryTab({
  documents,
  aggregation,
}: {
  documents: Array<{ id: string; filename: string; status: string }>;
  aggregation: import('@/types/deals').DealAggregationDto | null;
}) {
  const analyzedCount = documents.filter(d => d.status === 'analyzed').length;

  if (documents.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: 'var(--text-muted)',
          fontSize: 13,
          border: '1px dashed var(--border-color)',
          borderRadius: 'var(--radius-md, 8px)',
        }}
      >
        No documents to summarise. Upload and analyze deal documents first.
      </div>
    );
  }

  if (analyzedCount === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: 'var(--text-muted)',
          fontSize: 13,
          border: '1px dashed var(--border-color)',
          borderRadius: 'var(--radius-md, 8px)',
        }}
      >
        Documents are still analyzing. Findings appear once at least one analysis completes.
      </div>
    );
  }

  const allBiases = aggregation?.allBiases ?? [];
  const biasFrequency: Record<string, number> = {};
  for (const bias of allBiases) {
    biasFrequency[bias.biasType] = (biasFrequency[bias.biasType] ?? 0) + 1;
  }
  const sortedBiases = Object.entries(biasFrequency).sort(([, a], [, b]) => b - a);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md, 8px)',
          padding: 16,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text-secondary)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Aggregated bias signature · {allBiases.length} flag{allBiases.length === 1 ? '' : 's'}{' '}
          across {analyzedCount} document{analyzedCount === 1 ? '' : 's'}
        </h3>
        {sortedBiases.length === 0 ? (
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No bias flags surfaced across the analyzed documents.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 6 }}>
            {sortedBiases.slice(0, 12).map(([type, count]) => (
              <div
                key={type}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 12.5,
                }}
              >
                <span style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                  {type.replace(/_/g, ' ').replace(/bias$/i, '').trim()}
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    color: 'var(--accent-primary)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  ×{count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderLeft: '3px solid var(--info)',
          borderRadius: 'var(--radius-md, 8px)',
          padding: 14,
          fontSize: 12.5,
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
        }}
      >
        <strong style={{ color: 'var(--text-primary)' }}>What&apos;s shown:</strong> aggregated bias
        flags across every analyzed document in this deal. The cross-reference card on the composite
        pane shows where the documents <em>contradict</em> each other — the second signal an
        audit-committee reader looks for.
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*                  Outcome Tab                                   */
/* ────────────────────────────────────────────────────────────── */

function OutcomeTab({
  deal,
  onUpdate,
}: {
  deal: { id: string; currency: string; outcome: import('@/types/deals').DealOutcome | null };
  onUpdate: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {deal.outcome && <DealOutcomeDisplay outcome={deal.outcome} currency={deal.currency} />}

      {deal.outcome?.notes && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 10,
            padding: '14px 18px',
          }}
        >
          <div
            style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}
          >
            Notes
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {deal.outcome.notes}
          </div>
        </div>
      )}

      <DealOutcomeForm dealId={deal.id} currency={deal.currency} onSuccess={onUpdate} />
    </div>
  );
}
