'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit2,
  ChevronRight,
  FileText,
  Upload,
  AlertTriangle,
} from 'lucide-react';
import { useDeal } from '@/hooks/useDeals';
import { DealFormModal } from '@/components/deals/DealFormModal';
import { DealOutcomeForm } from '@/components/deals/DealOutcomeForm';
import { DealOutcomeDisplay } from '@/components/deals/DealOutcomeDisplay';
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
  color: active ? '#6366f1' : 'var(--text-muted)',
  background: active ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
  border: 'none',
  borderBottom: active ? '2px solid #6366f1' : '2px solid transparent',
  cursor: 'pointer',
  transition: 'all 0.15s',
});

export default function DealDetailPage() {
  const params = useParams();
  const dealId = params.id as string;

  const { deal, isLoading, error, mutate } = useDeal(dealId);
  const [activeTab, setActiveTab] = useState<'documents' | 'bias' | 'outcome'>('documents');
  const [showEditForm, setShowEditForm] = useState(false);
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
      if (res.ok) mutate();
    } finally {
      setAdvancingStage(false);
    }
  }, [deal, mutate]);

  if (isLoading) {
    return (
      <div className="container" style={{ maxWidth: 1000, padding: '24px 20px' }}>
        <div style={{ height: 200, background: 'rgba(255, 255, 255, 0.04)', borderRadius: 12, animation: 'pulse 1.5s infinite' }} />
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="container" style={{ maxWidth: 1000, padding: '24px 20px', textAlign: 'center' }}>
        <AlertTriangle size={40} style={{ color: '#ef4444', marginBottom: 12 }} />
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Deal not found</div>
        <Link href="/dashboard/deals" style={{ color: '#6366f1', fontSize: 13, marginTop: 8, display: 'inline-block' }}>
          Back to Deal Pipeline
        </Link>
      </div>
    );
  }

  const stageColor = STAGE_COLORS[deal.stage] || '#6b7280';
  const typeColor = DEAL_TYPE_COLORS[deal.dealType] || '#6b7280';
  const statusColor = STATUS_COLORS[deal.status] || '#6b7280';
  const nextStage = getNextStage(deal.stage);

  return (
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
        <ArrowLeft size={14} /> Deal Pipeline
      </Link>

      {/* Header */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 12,
          padding: '20px 24px',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
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
            style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Edit2 size={13} /> Edit
          </button>
        </div>

        {/* Badges row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          <span style={badgeStyle(typeColor)}>{getDealTypeLabel(deal.dealType)}</span>
          <span style={badgeStyle(stageColor)}>{getStageLabel(deal.stage)}</span>
          <span style={badgeStyle(statusColor)}>{deal.status}</span>
          {deal.sector && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{deal.sector}</span>
          )}
        </div>

        {/* Key metrics */}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-secondary)' }}>
          {deal.ticketSize && (
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Ticket:</span>{' '}
              <span style={{ fontWeight: 600 }}>{formatTicketSize(deal.ticketSize, deal.currency)}</span>
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
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <button
              onClick={handleAdvanceStage}
              disabled={advancingStage}
              className="btn btn-primary"
              style={{ padding: '6px 16px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              Advance to {getStageLabel(nextStage)} <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: 20 }}>
        <button onClick={() => setActiveTab('documents')} style={tabStyle(activeTab === 'documents')}>
          Documents
        </button>
        <button onClick={() => setActiveTab('bias')} style={tabStyle(activeTab === 'bias')}>
          Bias Summary
        </button>
        <button onClick={() => setActiveTab('outcome')} style={tabStyle(activeTab === 'outcome')}>
          Outcome
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'documents' && (
        <DocumentsTab documents={deal.documents || []} dealId={deal.id} />
      )}
      {activeTab === 'bias' && (
        <BiasSummaryTab documents={deal.documents || []} />
      )}
      {activeTab === 'outcome' && (
        <OutcomeTab deal={deal} onUpdate={() => mutate()} />
      )}

      {/* Edit modal */}
      <DealFormModal
        open={showEditForm}
        onOpenChange={setShowEditForm}
        deal={deal as unknown as DealSummary}
        onSuccess={() => mutate()}
      />
    </div>
  );
}

// ─── Documents Tab ────────────────────────────────────────────────────────────

function DocumentsTab({ documents, dealId }: { documents: Array<{ id: string; filename: string; documentType: string | null; status: string }>; dealId: string }) {
  const router = useRouter();

  if (documents.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '40px 20px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 10,
          border: '1px dashed rgba(255, 255, 255, 0.1)',
        }}
      >
        <FileText size={32} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
          No documents linked to this deal
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
          Upload IC memos, CIMs, or term sheets from the dashboard and link them to this deal.
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="btn btn-primary"
          style={{ padding: '6px 16px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, margin: '0 auto' }}
        >
          <Upload size={13} /> Upload Document
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {documents.map((doc) => (
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
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {doc.filename}
              </div>
            </div>
            {doc.documentType && (
              <span style={{ fontSize: 10, fontWeight: 500, color: '#6366f1', background: 'rgba(99, 102, 241, 0.1)', padding: '2px 6px', borderRadius: 4 }}>
                {getDocTypeLabel(doc.documentType)}
              </span>
            )}
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: doc.status === 'analyzed' ? '#10b981' : doc.status === 'error' ? '#ef4444' : '#f59e0b',
                background: doc.status === 'analyzed' ? 'rgba(16, 185, 129, 0.1)' : doc.status === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                padding: '2px 6px',
                borderRadius: 4,
              }}
            >
              {doc.status}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Bias Summary Tab ─────────────────────────────────────────────────────────

function BiasSummaryTab({ documents }: { documents: Array<{ id: string; filename: string; status: string }> }) {
  const analyzedCount = documents.filter((d) => d.status === 'analyzed').length;

  if (documents.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
        No documents to summarize. Upload and analyze deal documents first.
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 10,
        padding: '20px 24px',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
        Bias Analysis Overview
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {analyzedCount} of {documents.length} document{documents.length !== 1 ? 's' : ''} analyzed.
        {analyzedCount > 0
          ? ' View individual document analyses for detailed bias findings.'
          : ' Analyze linked documents to see aggregated bias patterns across this deal.'}
      </div>
      {analyzedCount > 0 && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {documents
            .filter((d) => d.status === 'analyzed')
            .map((doc) => (
              <Link
                key={doc.id}
                href={`/documents/${doc.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  color: '#6366f1',
                  textDecoration: 'none',
                }}
              >
                <FileText size={12} />
                {doc.filename} — View Analysis
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}

// ─── Outcome Tab ──────────────────────────────────────────────────────────────

function OutcomeTab({
  deal,
  onUpdate,
}: {
  deal: { id: string; currency: string; outcome: import('@/types/deals').DealOutcome | null };
  onUpdate: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Display existing outcome */}
      {deal.outcome && (
        <DealOutcomeDisplay outcome={deal.outcome} currency={deal.currency} />
      )}

      {/* Outcome notes */}
      {deal.outcome?.notes && (
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 10,
            padding: '14px 18px',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Notes</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{deal.outcome.notes}</div>
        </div>
      )}

      {/* Form */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
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
