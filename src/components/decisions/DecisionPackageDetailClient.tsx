'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils/format-date';
import {
  Package,
  ChevronLeft,
  Plus,
  X,
  Loader2,
  ShieldCheck,
  Trash2,
  CheckCircle2,
  Pencil,
  ExternalLink,
  ShieldCheck as ShieldCheckIcon,
  FileDown,
} from 'lucide-react';
import { CrossReferenceCard } from './CrossReferenceCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { DecisionDetailShell } from '@/components/documents/detail/DocumentDetailShell';
import { SettingsDrawer } from '@/components/documents/detail/SettingsDrawer';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface AggregationDto {
  compositeDqi: number | null;
  compositeGrade: 'A' | 'B' | 'C' | 'D' | 'F' | null;
  analyzedDocCount: number;
  recurringBiases: Array<{
    biasType: string;
    documentCount: number;
    totalOccurrences: number;
    topSeverity: 'critical' | 'high' | 'medium' | 'low';
  }>;
  allBiases: Array<{
    biasType: string;
    documentCount: number;
    totalOccurrences: number;
    topSeverity: 'critical' | 'high' | 'medium' | 'low';
  }>;
}

interface PackageDto {
  id: string;
  name: string;
  decisionFrame: string | null;
  status: string;
  decidedAt: string | null;
  visibility: string;
  ownerUserId: string;
  orgId: string | null;
  createdAt: string;
  updatedAt: string;
  compositeDqi: number | null;
  compositeGrade: string | null;
  documentCount: number;
  analyzedDocCount: number;
  recurringBiasCount: number;
  conflictCount: number;
  highSeverityConflictCount: number;
  isOwner: boolean;
}

interface MemberDocDto {
  id: string;
  documentId: string;
  role: string | null;
  position: number;
  addedAt: string;
  filename: string;
  documentType: string | null;
  status: string;
  visibility: string;
  uploadedAt: string;
  latestAnalysis: {
    id: string;
    overallScore: number;
    noiseScore: number;
    summary: string;
    createdAt: string;
    biases: Array<{ biasType: string; severity: string }>;
  } | null;
}

interface OutcomeDto {
  id: string;
  summary: string;
  realisedDqi: number | null;
  brierScore: number | null;
  reportedAt: string;
  reportedByUserId: string;
}

interface CrossRefRunDto {
  id: string;
  runAt: string;
  modelVersion: string;
  documentSnapshot: unknown;
  findings: unknown;
  conflictCount: number;
  highSeverityCount: number;
  status: string;
  errorMessage?: string | null;
}

interface InitialPayload {
  package: PackageDto;
  aggregation: AggregationDto;
  documents: MemberDocDto[];
  crossReference: CrossRefRunDto | null;
  outcome: OutcomeDto | null;
}

interface Props {
  packageId: string;
  initial: InitialPayload;
}

const STATUS_COLORS: Record<string, string> = {
  drafting: '#3b82f6',
  under_review: '#eab308',
  decided: '#16A34A',
  superseded: '#94a3b8',
};

const STATUS_LABEL: Record<string, string> = {
  drafting: 'Drafting',
  under_review: 'Under review',
  decided: 'Decided',
  superseded: 'Superseded',
};

function dqiTint(score: number | null): string {
  if (score == null) return 'var(--text-muted)';
  if (score >= 85) return 'var(--success, #10b981)';
  if (score >= 70) return 'var(--accent-primary, #16A34A)';
  if (score >= 55) return 'var(--warning, #d97706)';
  if (score >= 40) return 'var(--severity-high, #ef4444)';
  return 'var(--severity-critical, #b91c1c)';
}

type PackageTab = 'documents' | 'findings' | 'verdict' | 'stress' | 'outcome';

const PACKAGE_TAB_KEYS: PackageTab[] = ['documents', 'findings', 'verdict', 'stress', 'outcome'];

export function DecisionPackageDetailClient({ packageId, initial }: Props) {
  const router = useRouter();
  const [pkg, setPkg] = useState<PackageDto>(initial.package);
  const [aggregation, setAggregation] = useState<AggregationDto>(initial.aggregation);
  const [documents, setDocuments] = useState<MemberDocDto[]>(initial.documents);
  const [crossRef, setCrossRef] = useState<CrossRefRunDto | null>(initial.crossReference);
  const [outcome, setOutcome] = useState<OutcomeDto | null>(initial.outcome);
  const [editingHeader, setEditingHeader] = useState(false);
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [activeTab, setActiveTab] = useState<PackageTab>('documents');
  const [showSettings, setShowSettings] = useState(false);

  const refetch = useCallback(async () => {
    const res = await fetch(`/api/decision-packages/${packageId}`, { cache: 'no-store' });
    if (!res.ok) return;
    const data = (await res.json()) as InitialPayload;
    setPkg(data.package);
    setAggregation(data.aggregation);
    setDocuments(data.documents);
    setCrossRef(data.crossReference);
    setOutcome(data.outcome);
  }, [packageId]);

  const tint = STATUS_COLORS[pkg.status] ?? '#94a3b8';
  const statusLabel = STATUS_LABEL[pkg.status] ?? pkg.status;
  const totalDocs = documents.length;
  const analyzedDocs = aggregation.analyzedDocCount;

  /* ────── Header chips ────── */
  const headerChips = (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '3px 10px',
          borderRadius: 999,
          background: `${tint}1f`,
          border: `1px solid ${tint}66`,
          color: tint,
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        <Package size={11} /> {statusLabel}
      </span>
      {pkg.decidedAt && (
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Decided {formatDate(pkg.decidedAt)}
        </span>
      )}
    </div>
  );

  /* ────── Left pane: PackageHero + DPR strip + cross-ref ────── */
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
      <PackageHero
        pkg={pkg}
        aggregation={aggregation}
        documents={documents}
        editing={editingHeader}
        onEdit={() => setEditingHeader(true)}
        onCancelEdit={() => setEditingHeader(false)}
        onSaved={updated => {
          setPkg(prev => ({ ...prev, ...updated }));
          setEditingHeader(false);
          router.refresh();
        }}
      />

      {/* DPR strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '10px 14px',
          background: 'rgba(22,163,74,0.06)',
          border: '1px solid rgba(22,163,74,0.2)',
          borderRadius: 'var(--radius-md)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <ShieldCheckIcon size={16} color="#16A34A" />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Decision Provenance Record
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Procurement-grade artefact — composite + per-doc lineage in one PDF.
            </div>
          </div>
        </div>
        <a
          href={`/api/decision-packages/${packageId}/provenance-record?format=pdf`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-primary)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          <FileDown size={13} /> Download DPR
        </a>
      </div>

      <ErrorBoundary sectionName="Cross-reference">
        <CrossReferenceCard
          endpoint={`/api/decision-packages/${packageId}/cross-reference`}
          initialRun={crossRef}
          analyzedDocCount={aggregation.analyzedDocCount}
          onRunCompleted={async () => {
            await refetch();
          }}
        />
      </ErrorBoundary>
    </div>
  );

  /* ────── Tabs ────── */
  const tabs = [
    { id: 'documents' as const, label: 'Documents', badge: totalDocs || undefined },
    {
      id: 'findings' as const,
      label: 'Findings',
      available: analyzedDocs > 0,
    },
    { id: 'verdict' as const, label: 'Verdict' },
    {
      id: 'stress' as const,
      label: 'Stress test',
      available: analyzedDocs >= 2,
    },
    { id: 'outcome' as const, label: 'Outcome' },
  ];

  /* ────── Tab body ────── */
  const tabBody = (() => {
    switch (activeTab) {
      case 'documents':
        return (
          <PackageDocumentsTab
            packageId={packageId}
            documents={documents}
            isOwner={pkg.isOwner}
            showAddDoc={showAddDoc}
            onToggleAddDoc={() => setShowAddDoc(s => !s)}
            onCancelAddDoc={() => setShowAddDoc(false)}
            onChanged={refetch}
            analyzedDocCount={aggregation.analyzedDocCount}
          />
        );
      case 'findings':
        return <PackageFindingsTab aggregation={aggregation} analyzedDocs={analyzedDocs} />;
      case 'verdict':
        return (
          <PackageVerdictTab
            decisionFrame={pkg.decisionFrame}
            isOwner={pkg.isOwner}
            onEdit={() => {
              setEditingHeader(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        );
      case 'stress':
        return <PackageStressPlaceholder />;
      case 'outcome':
        return (
          <OutcomeBlock
            packageId={packageId}
            outcome={outcome}
            compositeDqi={pkg.compositeDqi}
            canReport={pkg.isOwner}
            onReported={async () => {
              await refetch();
            }}
          />
        );
      default:
        return null;
    }
  })();

  return (
    <ErrorBoundary sectionName="Decision Package Detail">
      <DecisionDetailShell
        title={pkg.name}
        dqiScore={pkg.compositeDqi}
        classification="confidential"
        headerChips={headerChips}
        primaryAction={
          analyzedDocs > 0
            ? {
                label: 'Download DPR',
                onClick: () => {
                  window.open(
                    `/api/decision-packages/${packageId}/provenance-record?format=pdf`,
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
          if (PACKAGE_TAB_KEYS.includes(t as PackageTab)) setActiveTab(t as PackageTab);
        }}
        leftPane={leftPane}
        rightPaneContent={tabBody}
        hasPreview
        onOpenSettings={() => setShowSettings(true)}
        settingsLabel="Package settings"
        breadcrumbs={
          <Link
            href="/dashboard/decisions"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--text-muted)',
              fontSize: 12,
              textDecoration: 'none',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            <ChevronLeft size={14} /> Back to packages
          </Link>
        }
      />

      <SettingsDrawer
        open={showSettings}
        onClose={() => setShowSettings(false)}
        methodologySlot={
          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            Composite DQI averages the latest analysis from every analyzed document in the package.
            Cross-reference flags surface contradictions across docs. The package- level DPR carries
            the composite verdict + per-doc lineage in a single hashed artefact for the audit
            committee.
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
            <div>package_id: {packageId}</div>
            <div>
              analyzed_docs: {analyzedDocs} / {totalDocs}
            </div>
            <div>cross_ref: {crossRef ? 'on file' : '—'}</div>
            <div>visibility: {pkg.visibility}</div>
          </div>
        }
        sharingSlot={
          pkg.isOwner ? (
            <button
              type="button"
              onClick={() => {
                setShowSettings(false);
                setEditingHeader(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
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
              <Pencil size={13} /> Edit package details
            </button>
          ) : (
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                fontStyle: 'italic',
              }}
            >
              You don&apos;t own this package; only the owner can edit details.
            </div>
          )
        }
        dangerSlot={
          pkg.isOwner ? (
            <DeletePackageButton
              packageId={packageId}
              packageName={pkg.name}
              onDeleted={() => router.push('/dashboard/decisions')}
            />
          ) : undefined
        }
      />
    </ErrorBoundary>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*                  Tab body components                            */
/* ────────────────────────────────────────────────────────────── */

function PackageDocumentsTab({
  packageId,
  documents,
  isOwner,
  showAddDoc,
  onToggleAddDoc,
  onCancelAddDoc,
  onChanged,
}: {
  packageId: string;
  documents: MemberDocDto[];
  isOwner: boolean;
  showAddDoc: boolean;
  onToggleAddDoc: () => void;
  onCancelAddDoc: () => void;
  onChanged: () => Promise<void>;
  analyzedDocCount: number;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 12 }}>
            {documents.length} doc{documents.length === 1 ? '' : 's'} attached. Add at least two
            analyzed documents to enable cross-document review.
          </p>
        </div>
        {isOwner && (
          <button
            onClick={onToggleAddDoc}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px',
              borderRadius: 'var(--radius-sm)',
              background: showAddDoc ? 'var(--bg-elevated)' : 'var(--accent-primary)',
              color: showAddDoc ? 'var(--text-secondary)' : '#fff',
              border: showAddDoc ? '1px solid var(--border-color)' : 'none',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {showAddDoc ? <X size={13} /> : <Plus size={13} />}
            {showAddDoc ? 'Cancel' : 'Add document'}
          </button>
        )}
      </div>

      {showAddDoc && isOwner && (
        <AddDocumentForm
          packageId={packageId}
          onAdded={async () => {
            onCancelAddDoc();
            await onChanged();
          }}
        />
      )}

      {documents.length === 0 ? (
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: 13,
            margin: 0,
            padding: '32px 16px',
            textAlign: 'center',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-md, 8px)',
          }}
        >
          No documents yet. Add at least 2 analyzed docs to enable cross-document review.
        </p>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
          {documents.map(d => (
            <li
              key={d.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-elevated)',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 2,
                  }}
                >
                  {d.role && (
                    <span
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        color: 'var(--accent-primary)',
                        background: 'rgba(22,163,74,0.12)',
                        padding: '1px 8px',
                        borderRadius: 'var(--radius-full)',
                      }}
                    >
                      {d.role}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    {d.visibility}
                  </span>
                </div>
                <Link
                  href={`/documents/${d.documentId}`}
                  style={{
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: 13,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {d.filename}
                  <ExternalLink size={11} style={{ opacity: 0.6 }} />
                </Link>
                {d.latestAnalysis && (
                  <p
                    style={{
                      margin: '2px 0 0',
                      color: 'var(--text-muted)',
                      fontSize: 11,
                      lineHeight: 1.4,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {d.latestAnalysis.summary}
                  </p>
                )}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  whiteSpace: 'nowrap',
                }}
              >
                {d.latestAnalysis ? (
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: dqiTint(d.latestAnalysis.overallScore),
                    }}
                  >
                    DQI {Math.round(d.latestAnalysis.overallScore)}
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Not analyzed</span>
                )}
                {isOwner && (
                  <RemoveDocButton joinId={d.id} packageId={packageId} onRemoved={onChanged} />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PackageFindingsTab({
  aggregation,
  analyzedDocs,
}: {
  aggregation: AggregationDto;
  analyzedDocs: number;
}) {
  if (analyzedDocs === 0) {
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
        Findings appear once at least one member document has been analyzed.
      </div>
    );
  }
  if (aggregation.recurringBiases.length === 0) {
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
        No recurring biases across the analyzed documents — clean signature, or audits are too
        independent for cross-document patterns to surface yet.
      </div>
    );
  }
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
            marginBottom: 4,
          }}
        >
          Recurring biases
        </h3>
        <p style={{ margin: '2px 0 14px', color: 'var(--text-muted)', fontSize: 12 }}>
          Biases that appear in two-or-more member documents — the package&rsquo;s decision- quality
          signature.
        </p>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
          {aggregation.recurringBiases.slice(0, 12).map(b => (
            <li
              key={b.biasType}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-elevated)',
                fontSize: 13,
              }}
            >
              <span style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                {b.biasType.replace(/_/g, ' ')}
              </span>
              <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color:
                      b.topSeverity === 'critical'
                        ? '#b91c1c'
                        : b.topSeverity === 'high'
                          ? '#ef4444'
                          : b.topSeverity === 'medium'
                            ? '#d97706'
                            : '#3b82f6',
                  }}
                >
                  {b.topSeverity}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  ×{b.documentCount} docs · ×{b.totalOccurrences} flags
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PackageVerdictTab({
  decisionFrame,
  isOwner,
  onEdit,
}: {
  decisionFrame: string | null;
  isOwner: boolean;
  onEdit: () => void;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md, 8px)',
        padding: 20,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 12,
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
          }}
        >
          Decision frame
        </h3>
        {isOwner && (
          <button
            type="button"
            onClick={onEdit}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              fontSize: 11.5,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            <Pencil size={11} /> Edit
          </button>
        )}
      </div>
      {decisionFrame ? (
        <p
          style={{
            margin: 0,
            fontSize: 14,
            lineHeight: 1.65,
            color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {decisionFrame}
        </p>
      ) : (
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: 'var(--text-muted)',
            fontStyle: 'italic',
            lineHeight: 1.55,
          }}
        >
          No decision frame yet. The frame is the question this package answers — a single sentence
          the audit committee can quote in their review.
          {isOwner && ' Click Edit to add one.'}
        </p>
      )}
    </div>
  );
}

function PackageStressPlaceholder() {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '40px 20px',
        color: 'var(--text-muted)',
        fontSize: 13,
        border: '1px dashed var(--border-color)',
        borderRadius: 'var(--radius-md, 8px)',
        lineHeight: 1.55,
      }}
    >
      Cross-document stress-test surface lands in a follow-up commit.
      <br />
      Today: scenario testing happens at the per-document level on the document detail page.
    </div>
  );
}

function DeletePackageButton({
  packageId,
  packageName,
  onDeleted,
}: {
  packageId: string;
  packageName: string;
  onDeleted: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

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
        <Trash2 size={13} /> Delete package
      </button>
    );
  }

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/decision-packages/${packageId}`, { method: 'DELETE' });
      if (res.ok) {
        onDeleted();
      } else {
        setLoading(false);
        setConfirming(false);
      }
    } catch {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        Deleting <strong>{packageName}</strong> removes the package, its document attachments,
        cross-reference runs, and outcome record. The underlying documents themselves are NOT
        deleted — they remain accessible from /dashboard/documents.
      </p>
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
    </div>
  );
}

/* The legacy inline JSX below this point has been migrated into the
 * tab body components above. Kept this comment as a tombstone marker
 * so a future reader knows the migration was intentional, not lost. */

function PackageHero({
  pkg,
  aggregation,
  documents,
  editing,
  onEdit,
  onCancelEdit,
  onSaved,
}: {
  pkg: PackageDto;
  aggregation: AggregationDto;
  documents: MemberDocDto[];
  editing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaved: (updated: Partial<PackageDto>) => void;
}) {
  const [name, setName] = useState(pkg.name);
  const [decisionFrame, setDecisionFrame] = useState(pkg.decisionFrame ?? '');
  const [status, setStatus] = useState(pkg.status);
  const [visibility, setVisibility] = useState<'team' | 'private'>(
    pkg.visibility === 'private' ? 'private' : 'team'
  );
  const [saving, setSaving] = useState(false);

  // Reset local state when entering edit mode after pkg changes
  useEffect(() => {
    if (editing) {
      setName(pkg.name);
      setDecisionFrame(pkg.decisionFrame ?? '');
      setStatus(pkg.status);
      setVisibility(pkg.visibility === 'private' ? 'private' : 'team');
    }
  }, [editing, pkg.name, pkg.decisionFrame, pkg.status, pkg.visibility]);

  const tint = STATUS_COLORS[pkg.status] ?? '#94a3b8';

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/decision-packages/${pkg.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          decisionFrame: decisionFrame.trim() || null,
          status,
          visibility,
        }),
      });
      if (!res.ok) return;
      onSaved({
        name: name.trim(),
        decisionFrame: decisionFrame.trim() || null,
        status,
        visibility,
      });
    } finally {
      setSaving(false);
    }
  };

  const memberFlags = useMemo(() => {
    const docCount = documents.length;
    const analyzed = documents.filter(d => d.latestAnalysis !== null).length;
    return { docCount, analyzed };
  }, [documents]);

  return (
    <div
      className="card"
      style={{
        background: 'var(--bg-elevated)',
        borderColor: 'var(--border-color)',
        marginBottom: 16,
      }}
    >
      <div className="card-body" style={{ padding: 'var(--spacing-lg)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: 280 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                background: `${tint}1f`,
                border: `1px solid ${tint}66`,
                color: tint,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              <Package size={11} />
              {STATUS_LABEL[pkg.status] ?? pkg.status}
            </div>
            {editing ? (
              <input
                value={name}
                onChange={e => setName(e.target.value.slice(0, 120))}
                style={{
                  width: '100%',
                  fontSize: 24,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 10px',
                }}
              />
            ) : (
              <h1
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  lineHeight: 1.2,
                }}
              >
                {pkg.name}
              </h1>
            )}
            {editing ? (
              <textarea
                value={decisionFrame}
                onChange={e => setDecisionFrame(e.target.value.slice(0, 600))}
                placeholder="Decision frame — the question this package answers."
                rows={2}
                style={{
                  width: '100%',
                  marginTop: 10,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  color: 'var(--text-primary)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 10px',
                  resize: 'vertical',
                }}
              />
            ) : pkg.decisionFrame ? (
              <p
                style={{
                  margin: '10px 0 0',
                  color: 'var(--text-secondary)',
                  fontSize: 15,
                  lineHeight: 1.5,
                  maxWidth: 720,
                }}
              >
                {pkg.decisionFrame}
              </p>
            ) : null}
            {editing && (
              <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    fontSize: 13,
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="drafting">Drafting</option>
                  <option value="under_review">Under review</option>
                  <option value="decided">Decided</option>
                  <option value="superseded">Superseded</option>
                </select>
                <select
                  value={visibility}
                  onChange={e => setVisibility(e.target.value === 'private' ? 'private' : 'team')}
                  style={{
                    padding: '6px 10px',
                    fontSize: 13,
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="team">Visibility · Team</option>
                  <option value="private">Visibility · Private</option>
                </select>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontWeight: 700,
              }}
            >
              Composite DQI
            </div>
            <div
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: dqiTint(pkg.compositeDqi),
                lineHeight: 1,
              }}
            >
              {pkg.compositeDqi != null ? Math.round(pkg.compositeDqi) : '—'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {pkg.compositeGrade ? `Grade ${pkg.compositeGrade}` : 'No analyses yet'}
            </div>
            {pkg.isOwner && !editing && (
              <button
                onClick={onEdit}
                style={{
                  marginTop: 6,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Pencil size={11} /> Edit
              </button>
            )}
            {editing && (
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <button
                  onClick={onCancelEdit}
                  disabled={saving}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent-primary)',
                    color: '#fff',
                    border: 'none',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: saving ? 'wait' : 'pointer',
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </div>
        <div
          style={{
            marginTop: 16,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 12,
          }}
        >
          <Stat
            label="Documents"
            value={`${memberFlags.analyzed}/${memberFlags.docCount}`}
            hint="analyzed / total"
          />
          <Stat
            label="Recurring biases"
            value={`${aggregation.recurringBiases.length}`}
            hint="present in ≥2 docs"
          />
          <Stat
            label="Conflicts"
            value={`${pkg.conflictCount}`}
            hint={
              pkg.highSeverityConflictCount > 0
                ? `${pkg.highSeverityConflictCount} high-severity`
                : 'cross-doc'
            }
            tint={
              pkg.highSeverityConflictCount > 0
                ? '#DC2626'
                : pkg.conflictCount > 0
                  ? '#D97706'
                  : undefined
            }
          />
          <Stat
            label="Decided"
            value={pkg.decidedAt ? formatDate(pkg.decidedAt) : '—'}
            hint={pkg.decidedAt ? '' : 'Pending'}
          />
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tint,
}: {
  label: string;
  value: string;
  hint: string;
  tint?: string;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 12px',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--text-muted)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: tint ?? 'var(--text-primary)',
          marginTop: 4,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{hint}</div>
    </div>
  );
}

function AddDocumentForm({
  packageId,
  onAdded,
}: {
  packageId: string;
  onAdded: () => void | Promise<void>;
}) {
  const [docs, setDocs] = useState<Array<{ id: string; filename: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [role, setRole] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/documents?limit=50', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { documents?: Array<{ id: string; filename: string }> };
        if (!cancelled) setDocs(data.documents ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async () => {
    if (!selectedId) {
      setError('Pick a document');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/decision-packages/${packageId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: selectedId,
          role: role.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Could not add the document.');
        return;
      }
      await onAdded();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--spacing-md)',
        marginBottom: 14,
      }}
    >
      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
          Loading your documents…
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          <select
            value={selectedId ?? ''}
            onChange={e => setSelectedId(e.target.value || null)}
            style={{
              padding: '8px 10px',
              fontSize: 13,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">Pick a document…</option>
            {docs.map(d => (
              <option key={d.id} value={d.id}>
                {d.filename}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={role}
            onChange={e => setRole(e.target.value.slice(0, 60))}
            placeholder="Role label (memo / model / counsel / deck)"
            style={{
              padding: '8px 10px',
              fontSize: 13,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
            }}
          />
          {error && (
            <div
              style={{
                color: 'var(--severity-high)',
                fontSize: 12,
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(239,68,68,0.08)',
              }}
            >
              {error}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={submit}
              disabled={submitting || !selectedId}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-primary)',
                color: '#fff',
                border: 'none',
                fontSize: 13,
                fontWeight: 700,
                cursor: submitting ? 'wait' : 'pointer',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Add to package
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RemoveDocButton({
  joinId,
  packageId,
  onRemoved,
}: {
  joinId: string;
  packageId: string;
  onRemoved: () => void | Promise<void>;
}) {
  const [removing, setRemoving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const confirmRemove = async () => {
    setShowConfirm(false);
    setRemoving(true);
    try {
      const res = await fetch(`/api/decision-packages/${packageId}/documents/${joinId}`, {
        method: 'DELETE',
      });
      if (res.ok) await onRemoved();
    } finally {
      setRemoving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={removing}
        title="Remove from package"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: removing ? 'wait' : 'pointer',
          padding: 4,
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        {removing ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
      </button>
      <Dialog
        open={showConfirm}
        onOpenChange={isOpen => {
          if (!isOpen) setShowConfirm(false);
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Trash2 size={18} style={{ color: 'var(--severity-high, #ef4444)' }} />
              Remove document?
            </DialogTitle>
            <DialogDescription>
              The document stays in your library — only its link to this Decision Package is
              removed. The composite DQI and cross-reference run will recompute without it.
            </DialogDescription>
          </DialogHeader>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              marginTop: 16,
            }}
          >
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              className="btn"
              style={{
                padding: '8px 16px',
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Keep in package
            </button>
            <button
              type="button"
              onClick={confirmRemove}
              className="btn"
              style={{
                padding: '8px 16px',
                background: 'var(--severity-high, #ef4444)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Remove
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function OutcomeBlock({
  packageId,
  outcome,
  compositeDqi,
  canReport,
  onReported,
}: {
  packageId: string;
  outcome: OutcomeDto | null;
  compositeDqi: number | null;
  canReport: boolean;
  onReported: () => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [summary, setSummary] = useState(outcome?.summary ?? '');
  const [realisedDqi, setRealisedDqi] = useState(outcome?.realisedDqi ?? compositeDqi ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSummary(outcome?.summary ?? '');
    setRealisedDqi(outcome?.realisedDqi ?? compositeDqi ?? null);
  }, [outcome, compositeDqi]);

  const submit = async () => {
    if (summary.trim().length === 0) {
      setError('Summary is required');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/decision-packages/${packageId}/outcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: summary.trim(),
          realisedDqi: realisedDqi ?? undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Could not record the outcome.');
        return;
      }
      setEditing(false);
      await onReported();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="card"
      style={{
        marginTop: 16,
        background: outcome ? 'rgba(22,163,74,0.06)' : 'var(--bg-card)',
        borderColor: outcome ? 'rgba(22,163,74,0.25)' : 'var(--border-color)',
      }}
    >
      <div className="card-header">
        <h3
          style={{
            margin: 0,
            color: 'var(--text-primary)',
            fontSize: 14,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {outcome ? <CheckCircle2 size={14} color="#16A34A" /> : <ShieldCheck size={14} />}
          Outcome
        </h3>
        <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: 12 }}>
          {outcome
            ? `Reported ${formatDate(outcome.reportedAt)}`
            : 'Closes the loop. Reporting an outcome flips the package to "decided".'}
        </p>
      </div>
      <div className="card-body" style={{ paddingTop: 0 }}>
        {!editing && outcome ? (
          <>
            <p
              style={{
                margin: 0,
                color: 'var(--text-primary)',
                fontSize: 14,
                lineHeight: 1.55,
              }}
            >
              {outcome.summary}
            </p>
            <div
              style={{
                marginTop: 10,
                display: 'flex',
                gap: 14,
                flexWrap: 'wrap',
                fontSize: 12,
                color: 'var(--text-muted)',
              }}
            >
              {outcome.realisedDqi != null && (
                <span>
                  Realised DQI:{' '}
                  <strong style={{ color: dqiTint(outcome.realisedDqi) }}>
                    {Math.round(outcome.realisedDqi)}
                  </strong>
                </span>
              )}
              {outcome.brierScore != null && (
                <span>Mean Brier: {outcome.brierScore.toFixed(3)}</span>
              )}
            </div>
            {canReport && (
              <button
                onClick={() => setEditing(true)}
                style={{
                  marginTop: 10,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                Update outcome
              </button>
            )}
          </>
        ) : !canReport && !outcome ? (
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>
            The package owner records the outcome.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            <textarea
              value={summary}
              onChange={e => setSummary(e.target.value.slice(0, 2000))}
              rows={4}
              placeholder="Plain-English outcome — what happened, what's the takeaway?"
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: 13,
                fontFamily: 'inherit',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <label
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                Realised DQI (0–100, optional):
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={realisedDqi ?? ''}
                  onChange={e =>
                    setRealisedDqi(e.target.value === '' ? null : Number(e.target.value))
                  }
                  style={{
                    width: 80,
                    padding: '6px 8px',
                    fontSize: 13,
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                  }}
                />
              </label>
            </div>
            {error && (
              <div
                style={{
                  color: 'var(--severity-high)',
                  fontSize: 12,
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(239,68,68,0.08)',
                }}
              >
                {error}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              {outcome && (
                <button
                  onClick={() => setEditing(false)}
                  disabled={submitting}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              )}
              <button
                onClick={submit}
                disabled={submitting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--accent-primary)',
                  color: '#fff',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: submitting ? 'wait' : 'pointer',
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={13} />
                )}
                {outcome ? 'Update outcome' : 'Record outcome'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
