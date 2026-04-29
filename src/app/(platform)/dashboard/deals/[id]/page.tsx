'use client';

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/components/ui/EnhancedToast';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit2,
  ChevronRight,
  FileText,
  Upload,
  AlertTriangle,
  Shield,
  TrendingUp,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
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
import type { DealCrossReferenceFinding } from '@/types/deals';
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

const badgeStyle = (color: string): React.CSSProperties => ({
  fontSize: 11,
  fontWeight: 600,
  color: color,
  background: `${color}18`,
  padding: '3px 8px',
  borderRadius: 4,
  whiteSpace: 'nowrap',
});

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: active ? 600 : 400,
  color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
  background: active ? 'rgba(22, 163, 74, 0.1)' : 'transparent',
  border: 'none',
  borderBottom: active ? '2px solid var(--accent-primary)' : '2px solid transparent',
  cursor: 'pointer',
  transition: 'all 0.15s',
});

export default function DealDetailPage() {
  const params = useParams();
  const dealId = params.id as string;

  const { deal, isLoading, error, mutate } = useDeal(dealId);
  const [activeTab, setActiveTab] = useState<'documents' | 'bias' | 'outcome' | 'brief'>(
    'documents'
  );
  const [showEditForm, setShowEditForm] = useState(false);
  const [advancingStage, setAdvancingStage] = useState(false);
  const { showToast } = useToast();

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

  if (isLoading) {
    return (
      <div className="container" style={{ maxWidth: 1000, padding: '24px 20px' }}>
        <div
          style={{
            height: 200,
            background: 'var(--bg-card-hover)',
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
          style={{ color: 'var(--accent-primary)', fontSize: 13, marginTop: 8, display: 'inline-block' }}
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  const stageColor = STAGE_COLORS[deal.stage] || '#6b7280';
  const typeColor = DEAL_TYPE_COLORS[deal.dealType] || '#6b7280';
  const statusColor = STATUS_COLORS[deal.status] || '#6b7280';
  const nextStage = getNextStage(deal.stage);

  return (
    <ErrorBoundary sectionName="Project Detail">
      <div className="container" style={{ maxWidth: 1000, padding: '24px 20px' }}>
        {/* Back link */}
        <Link
          href="/dashboard/deals"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            color: 'var(--text-muted)',
            fontSize: 12,
            textDecoration: 'none',
            marginBottom: 16,
          }}
        >
          <ArrowLeft size={14} /> Projects
        </Link>

        <UpgradeFromAudit dealId={dealId} />

        {/* Header */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--bg-elevated)',
            borderRadius: 12,
            padding: '20px 24px',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 12,
            }}
          >
            <div>
              <h1
                style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}
              >
                {deal.name}
              </h1>
              {deal.targetCompany && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                  {deal.targetCompany}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowEditForm(true)}
              className="btn btn-ghost"
              style={{
                padding: '6px 12px',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Edit2 size={13} /> Edit
            </button>
          </div>

          {/* Badges row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 14,
            }}
          >
            <span style={badgeStyle(typeColor)}>{getDealTypeLabel(deal.dealType)}</span>
            <span style={badgeStyle(stageColor)}>{getStageLabel(deal.stage)}</span>
            <span style={badgeStyle(statusColor)}>{deal.status}</span>
            {deal.sector && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{deal.sector}</span>
            )}
          </div>

          {/* Key metrics */}
          <div
            style={{
              display: 'flex',
              gap: 24,
              flexWrap: 'wrap',
              fontSize: 12,
              color: 'var(--text-secondary)',
            }}
          >
            {deal.ticketSize && (
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Ticket:</span>{' '}
                <span style={{ fontWeight: 600 }}>
                  {formatTicketSize(deal.ticketSize, deal.currency)}
                </span>
              </div>
            )}
            {deal.fundName && (
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Fund:</span>{' '}
                <span style={{ fontWeight: 600 }}>{deal.fundName}</span>
              </div>
            )}
            {deal.vintage && (
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Vintage:</span>{' '}
                <span style={{ fontWeight: 600 }}>{deal.vintage}</span>
              </div>
            )}
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Documents:</span>{' '}
              <span style={{ fontWeight: 600 }}>{deal.documents?.length || 0}</span>
            </div>
          </div>

          {/* Stage advance */}
          {nextStage && deal.status === 'active' && (
            <div
              style={{
                marginTop: 14,
                paddingTop: 14,
                borderTop: '1px solid var(--bg-card-hover)',
              }}
            >
              <button
                onClick={handleAdvanceStage}
                disabled={advancingStage}
                className="btn btn-primary"
                style={{
                  padding: '6px 16px',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                Advance to {getStageLabel(nextStage)} <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Composite DQI + bias signature (3.1 deal-as-decision-unit hero) */}
        {deal.aggregation && (
          <DealCompositeHero
            aggregation={deal.aggregation}
            totalDocs={deal.documents?.length || 0}
          />
        )}

        {/* Deal-level counterfactual ROI (Marcus's audit ask). Renders
            null until the deal has ≥2 analyzed docs AND the aggregate
            improvement is positive — single-doc deals already have the
            CounterfactualPanel on the document page. */}
        <DealCounterfactualHero dealId={deal.id} />

        {/* Cross-document conflict surface (3.1 deep) — the deal-level
            agent that catches "CIM says 40% growth, model assumes 15%"
            class contradictions across the docs. */}
        <CrossReferenceCard
          dealId={deal.id}
          initialRun={deal.crossReference ?? null}
          aggregation={deal.aggregation ?? null}
          onRunCompleted={() => mutate()}
        />

        {/* Upload-to-deal CTA — sits above the tabs so it's the primary verb
            on the page. Pre-binds dealId so the new doc lands in this deal
            automatically. */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: 14,
          }}
        >
          <UploadToDealButton dealId={deal.id} dealName={deal.name} onUploaded={() => mutate()} />
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 0,
            borderBottom: '1px solid var(--bg-elevated)',
            marginBottom: 20,
          }}
        >
          <button
            onClick={() => setActiveTab('documents')}
            style={tabStyle(activeTab === 'documents')}
          >
            Documents
          </button>
          <button onClick={() => setActiveTab('bias')} style={tabStyle(activeTab === 'bias')}>
            Bias Summary
          </button>
          <button onClick={() => setActiveTab('outcome')} style={tabStyle(activeTab === 'outcome')}>
            Outcome
          </button>
          <button onClick={() => setActiveTab('brief')} style={tabStyle(activeTab === 'brief')}>
            <FileText size={13} style={{ marginRight: 4, verticalAlign: -2 }} />
            Decision Brief
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'documents' && (
          <DocumentsTab
            documents={deal.documents || []}
            dealId={deal.id}
            crossRefFindings={extractFindings(deal.crossReference)}
          />
        )}
        {activeTab === 'bias' && (
          <BiasSummaryTab documents={deal.documents || []} aggregation={deal.aggregation ?? null} />
        )}
        {activeTab === 'outcome' && <OutcomeTab deal={deal} onUpdate={() => mutate()} />}
        {activeTab === 'brief' && <DecisionBriefTab dealId={dealId} />}

        {/* Edit modal */}
        <DealFormModal
          open={showEditForm}
          onOpenChange={setShowEditForm}
          deal={deal as unknown as DealSummary}
          onSuccess={() => mutate()}
        />
      </div>
    </ErrorBoundary>
  );
}

// ─── Documents Tab ────────────────────────────────────────────────────────────

/**
 * Pull the findings array out of a DealCrossReference run regardless of
 * which JSON shape is persisted (legacy bare-array vs the wrapped
 * { findings, summary } object). Returns [] when no run / no findings.
 */
function extractFindings(
  run: { findings?: unknown } | null | undefined
): DealCrossReferenceFinding[] {
  if (!run || !run.findings) return [];
  if (Array.isArray(run.findings)) return run.findings as DealCrossReferenceFinding[];
  const wrapped = run.findings as { findings?: DealCrossReferenceFinding[] };
  return wrapped.findings ?? [];
}

function DocumentsTab({
  documents,
  dealId: _dealId,
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
  crossRefFindings?: DealCrossReferenceFinding[];
}) {
  const router = useRouter();

  if (documents.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '40px 20px',
          background: 'var(--bg-card)',
          borderRadius: 10,
          border: '1px dashed var(--bg-active)',
        }}
      >
        <FileText size={32} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
        <div
          style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}
        >
          No documents linked to this project
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
          Upload strategic documents, board memos, or assessments from the dashboard and link them
          to this project.
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="btn btn-primary"
          style={{
            padding: '6px 16px',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            margin: '0 auto',
          }}
        >
          <Upload size={13} /> Upload Document
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {documents.map(doc => {
        const latestScore = doc.analyses?.[0]?.overallScore;
        const scoreColour =
          latestScore === undefined
            ? null
            : latestScore >= 85
              ? '#16A34A'
              : latestScore >= 70
                ? '#2563EB'
                : latestScore >= 55
                  ? '#D97706'
                  : '#DC2626';
        return (
          <Link
            key={doc.id}
            href={`/documents/${doc.id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div
              className="card"
              style={{
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
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
                    color: '#16A34A',
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
                      ? '#10b981'
                      : doc.status === 'error'
                        ? '#ef4444'
                        : '#f59e0b',
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
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ─── Bias Summary Tab ─────────────────────────────────────────────────────────

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
        }}
      >
        No documents to summarize. Upload and analyze deal documents first.
      </div>
    );
  }

  const allBiases = aggregation?.allBiases ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--bg-elevated)',
          borderRadius: 10,
          padding: '18px 22px',
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 6,
          }}
        >
          Bias signature across this deal
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}
        >
          {analyzedCount} of {documents.length} document
          {documents.length !== 1 ? 's' : ''} analyzed. The composite Deal DQI and recurring biases
          are shown above the tabs. Below: every bias flagged on any document linked to this deal,
          ranked by how many documents share it.
        </div>
      </div>

      {allBiases.length > 0 ? (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--bg-elevated)',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 80px 80px 80px',
              gap: 12,
              padding: '10px 16px',
              background: 'var(--bg-elevated)',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            <div>Bias</div>
            <div style={{ textAlign: 'right' }}>Docs</div>
            <div style={{ textAlign: 'right' }}>Flags</div>
            <div style={{ textAlign: 'right' }}>Top sev.</div>
          </div>
          {allBiases.map(b => (
            <div
              key={b.biasType}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 80px 80px 80px',
                gap: 12,
                padding: '10px 16px',
                borderTop: '1px solid var(--bg-elevated)',
                fontSize: 12.5,
                color: 'var(--text-primary)',
                alignItems: 'center',
              }}
            >
              <div style={{ fontWeight: 600 }}>
                {b.biasType
                  .split('_')
                  .map(w => w[0]?.toUpperCase() + w.slice(1))
                  .join(' ')}
              </div>
              <div
                style={{
                  textAlign: 'right',
                  fontVariantNumeric: 'tabular-nums',
                  color: b.documentCount >= 2 ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: b.documentCount >= 2 ? 700 : 500,
                }}
              >
                {b.documentCount}
              </div>
              <div
                style={{
                  textAlign: 'right',
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--text-secondary)',
                }}
              >
                {b.totalOccurrences}
              </div>
              <div
                style={{
                  textAlign: 'right',
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  color:
                    b.topSeverity === 'critical'
                      ? '#7F1D1D'
                      : b.topSeverity === 'high'
                        ? '#DC2626'
                        : b.topSeverity === 'medium'
                          ? '#D97706'
                          : '#2563EB',
                }}
              >
                {b.topSeverity}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            fontSize: 12.5,
            color: 'var(--text-muted)',
            padding: '14px 18px',
            background: 'var(--bg-card)',
            borderRadius: 10,
            border: '1px dashed var(--border-color)',
          }}
        >
          {analyzedCount === 0
            ? 'Analyze the linked documents to see the deal-level bias signature.'
            : 'No biases flagged on the analyzed documents — clean reasoning so far.'}
        </div>
      )}

      {analyzedCount > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 4,
            }}
          >
            Drill into individual analyses
          </div>
          {documents
            .filter(d => d.status === 'analyzed')
            .map(doc => (
              <Link
                key={doc.id}
                href={`/documents/${doc.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  color: '#16A34A',
                  textDecoration: 'none',
                }}
              >
                <FileText size={12} />
                {doc.filename} — view audit
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}

// ─── Outcome Tab ──────────────────────────────────────────────────────────────

interface ROIData {
  ticketSize: number;
  totalBiasesDetected: number;
  confirmedBiases: number;
  biasImpactRate: number;
  valueProtected: number;
  breakdown: { biasType: string; confirmed: boolean; estimatedLoss: number }[];
}

function ValueProtectedCard({ dealId }: { dealId: string }) {
  const [roi, setRoi] = useState<ROIData | null>(null);

  useEffect(() => {
    fetch(`/api/deals/${dealId}/roi`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => setRoi(d))
      .catch(() => null);
  }, [dealId]);

  if (!roi || roi.valueProtected === 0) return null;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(59, 130, 246, 0.06))',
        border: '1px solid rgba(34, 197, 94, 0.2)',
        borderRadius: 10,
        padding: '18px 22px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Shield className="w-4 h-4" style={{ color: '#22c55e' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#22c55e' }}>Value Protected</span>
      </div>

      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
        ${roi.valueProtected.toLocaleString()}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
        Estimated capital protected by bias detection on ${roi.ticketSize.toLocaleString()} ticket
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Biases Detected</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            {roi.totalBiasesDetected}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Confirmed</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#22c55e' }}>
            {roi.confirmedBiases}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Impact Rate</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            {Math.round(roi.biasImpactRate * 100)}%
          </div>
        </div>
      </div>

      {roi.breakdown.filter(b => b.confirmed).length > 0 && (
        <div style={{ borderTop: '1px solid var(--bg-card-hover)', paddingTop: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
            Confirmed Bias Breakdown
          </div>
          {roi.breakdown
            .filter(b => b.confirmed)
            .map((b, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  padding: '3px 0',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <TrendingUp className="w-3 h-3" style={{ color: '#22c55e' }} />
                  {b.biasType}
                </span>
                <span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
                  ${b.estimatedLoss.toLocaleString()}
                </span>
              </div>
            ))}
        </div>
      )}

      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 10, fontStyle: 'italic' }}>
        Methodology: ticket size x research-based loss rate per confirmed bias type (Kahneman,
        Malmendier & Tate)
      </div>
    </div>
  );
}

function OutcomeTab({
  deal,
  onUpdate,
}: {
  deal: { id: string; currency: string; outcome: import('@/types/deals').DealOutcome | null };
  onUpdate: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Value Protected Card */}
      <ValueProtectedCard dealId={deal.id} />

      {/* Display existing outcome */}
      {deal.outcome && <DealOutcomeDisplay outcome={deal.outcome} currency={deal.currency} />}

      {/* Outcome notes */}
      {deal.outcome?.notes && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--bg-elevated)',
            borderRadius: 10,
            padding: '14px 18px',
          }}
        >
          <div
            style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}
          >
            Notes
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {deal.outcome.notes}
          </div>
        </div>
      )}

      {/* Form */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--bg-elevated)',
          borderRadius: 10,
          padding: '18px 22px',
        }}
      >
        <DealOutcomeForm
          dealId={deal.id}
          currency={deal.currency}
          existingOutcome={deal.outcome}
          onSuccess={onUpdate}
        />
      </div>
    </div>
  );
}
