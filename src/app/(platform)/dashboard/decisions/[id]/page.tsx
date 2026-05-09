'use client';

/**
 * /dashboard/decisions/[id] — unified container detail page (Phase 2).
 *
 * Replaces /dashboard/deals/[id] + the legacy decision-package detail
 * with a mode-aware shell. Layout: ContainerCompositeHero (composite
 * metrics + bias signature) above CommitteeReadinessGate (5-gate
 * checklist) above member-document list with per-doc DQI tiles.
 */

import { use } from 'react';
import Link from 'next/link';
import { ChevronLeft, FileText, Download, GitCompareArrows } from 'lucide-react';
import { useContainer } from '@/hooks/useContainers';
import { ContainerCompositeHero } from '@/components/containers/ContainerCompositeHero';
import { CommitteeReadinessGate } from '@/components/containers/CommitteeReadinessGate';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { dqiColorFor } from '@/lib/utils/grade';

export default function ContainerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { container, isLoading, error, mutate } = useContainer(id);

  if (isLoading) {
    return <div style={{ padding: 24, color: 'var(--text-muted)' }}>Loading decision…</div>;
  }

  if (error || !container) {
    return (
      <div style={{ padding: 24 }}>
        <Link
          href="/dashboard/decisions"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--accent-primary)',
            textDecoration: 'none',
            fontSize: 'var(--fs-sm)',
            marginBottom: 12,
          }}
        >
          <ChevronLeft size={14} />
          All decisions
        </Link>
        <div
          style={{
            padding: 16,
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--error)',
          }}
        >
          {error?.message ?? 'Decision not found.'}
        </div>
      </div>
    );
  }

  const exportPdf = async () => {
    window.location.href = `/api/containers/${container.id}/provenance-record?format=pdf`;
  };

  const triggerCrossRef = async () => {
    try {
      const res = await fetch(`/api/containers/${container.id}/cross-reference`, {
        method: 'POST',
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        alert(json?.error ?? 'Cross-reference failed');
        return;
      }
      mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Cross-reference failed');
    }
  };

  return (
    <ErrorBoundary sectionName="Decision detail">
      <Link
        href="/dashboard/decisions"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: 'var(--accent-primary)',
          textDecoration: 'none',
          fontSize: 'var(--fs-sm)',
          marginBottom: 12,
        }}
      >
        <ChevronLeft size={14} />
        All decisions
      </Link>

      <div className="page-header" style={{ marginBottom: 16 }}>
        <h1>{container.name}</h1>
        {container.decisionFrame && (
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: 'var(--fs-sm)',
              marginTop: 4,
              fontStyle: 'italic',
            }}
          >
            {container.decisionFrame}
          </p>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 360px',
          gap: 16,
          alignItems: 'flex-start',
        }}
        className="container-detail-grid"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ContainerCompositeHero container={container} />

          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <h2 style={{ fontSize: 'var(--fs-md)', fontWeight: 600 }}>
                Documents ({container.documentCount})
              </h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={triggerCrossRef}
                  disabled={container.analyzedDocCount < 2}
                  title={
                    container.analyzedDocCount < 2
                      ? 'Cross-reference requires ≥2 analyzed documents'
                      : 'Run cross-doc cross-reference'
                  }
                  style={{
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color:
                      container.analyzedDocCount < 2 ? 'var(--text-muted)' : 'var(--text-primary)',
                    fontSize: 'var(--fs-xs)',
                    cursor: container.analyzedDocCount < 2 ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <GitCompareArrows size={12} />
                  Cross-reference
                </button>
                <button
                  type="button"
                  onClick={exportPdf}
                  disabled={container.analyzedDocCount === 0}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--accent-primary)',
                    border: 'none',
                    color: '#fff',
                    fontSize: 'var(--fs-xs)',
                    fontWeight: 600,
                    cursor: container.analyzedDocCount === 0 ? 'not-allowed' : 'pointer',
                    opacity: container.analyzedDocCount === 0 ? 0.5 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Download size={12} />
                  Export DPR
                </button>
              </div>
            </div>
            {container.documents.length === 0 ? (
              <div
                style={{
                  padding: 20,
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: 'var(--fs-sm)',
                }}
              >
                No documents attached yet. Upload a memo to start the audit.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {container.documents.map(m => {
                  const a = m.document.latestAnalysis;
                  const dqiColor = a ? dqiColorFor(a.overallScore) : 'var(--text-muted)';
                  return (
                    <Link
                      key={m.id}
                      href={`/documents/${m.documentId}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: 10,
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        textDecoration: 'none',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <FileText size={16} style={{ color: 'var(--text-muted)' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 500 }}>
                          {m.document.filename}
                        </div>
                        <div
                          style={{
                            fontSize: 'var(--fs-2xs)',
                            color: 'var(--text-muted)',
                            marginTop: 2,
                          }}
                        >
                          {m.document.documentType ?? 'document'} ·{' '}
                          {m.document.status === 'analyzed' ? 'analyzed' : m.document.status}
                          {a ? ` · ${a.biasCount} biases` : ''}
                        </div>
                      </div>
                      {a && (
                        <div
                          style={{
                            padding: '4px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-card)',
                            color: dqiColor,
                            fontSize: 'var(--fs-xs)',
                            fontWeight: 600,
                            fontVariantNumeric: 'tabular-nums',
                            flexShrink: 0,
                          }}
                        >
                          {Math.round(a.overallScore)}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {container.outcome && (
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: 16,
              }}
            >
              <h2 style={{ fontSize: 'var(--fs-md)', fontWeight: 600, marginBottom: 8 }}>
                Outcome
              </h2>
              <p
                style={{
                  fontSize: 'var(--fs-sm)',
                  color: 'var(--text-secondary)',
                  marginBottom: 12,
                }}
              >
                {container.outcome.summary}
              </p>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                Reported {new Date(container.outcome.reportedAt).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <CommitteeReadinessGate container={container} />
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          :global(.container-detail-grid) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </ErrorBoundary>
  );
}
