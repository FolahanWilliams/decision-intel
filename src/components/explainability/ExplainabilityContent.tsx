'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useCallback } from 'react';
import useSWR from 'swr';
import { FileText, BarChart3, Calendar, Loader2, AlertTriangle } from 'lucide-react';
import { ExplainabilityDashboard } from '@/components/explainability/ExplainabilityDashboard';

interface Analysis {
  id: string;
  overallScore: number | null;
  createdAt: string;
  summary: string | null;
}

interface Document {
  id: string;
  filename: string;
  analyses: Analysis[];
}

interface DocumentsResponse {
  documents: Document[];
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--success)';
  if (score >= 60) return 'var(--warning)';
  if (score >= 40) return 'var(--accent-warning)';
  return 'var(--error)';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function RecentAnalysesPicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, isLoading, error, mutate } = useSWR<DocumentsResponse>(
    '/api/documents?limit=10&sortBy=updatedAt',
    fetcher
  );

  const handleSelect = useCallback(
    (analysisId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('analysisId', analysisId);
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  const analysisItems =
    data?.documents?.flatMap(doc =>
      doc.analyses.map(analysis => ({
        ...analysis,
        filename: doc.filename,
      }))
    ) ?? [];

  analysisItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div style={{ padding: 'var(--spacing-xl)', maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h2
          style={{
            color: 'var(--text-primary)',
            fontSize: '20px',
            fontWeight: 700,
            margin: 0,
            marginBottom: 'var(--spacing-sm)',
          }}
        >
          Explainability Dashboard
        </h2>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '15px',
            margin: 0,
          }}
        >
          Select an analysis to explore its decision quality breakdown
        </p>
      </div>

      {isLoading && (
        <div
          className="flex items-center"
          style={{
            justifyContent: 'center',
            padding: 'var(--spacing-xl)',
            gap: 'var(--spacing-sm)',
          }}
        >
          <Loader2
            size={20}
            style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Loading recent analyses...
          </span>
        </div>
      )}

      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-md)',
            padding: 'var(--spacing-md) var(--spacing-lg)',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <AlertTriangle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px', flex: 1 }}>
            Failed to load analyses. Please try again.
          </span>
          <button
            onClick={() => mutate()}
            style={{
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#ef4444',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {!isLoading && !error && analysisItems.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--spacing-xl)',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--glass-border)',
          }}
        >
          <FileText
            size={32}
            style={{ color: 'var(--text-muted)', marginBottom: 'var(--spacing-sm)' }}
          />
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: 0 }}>
            No analyses yet. Upload and analyze a document first.
          </p>
        </div>
      )}

      {!isLoading && !error && analysisItems.length > 0 && (
        <div className="grid grid-2 grid-3 gap-md">
          {analysisItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-sm)',
                padding: 'var(--spacing-md)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.15s ease, transform 0.15s ease',
                width: '100%',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--glass-border)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div className="flex items-center" style={{ gap: 'var(--spacing-sm)', minWidth: 0 }}>
                <FileText size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <span
                  style={{
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.filename}
                </span>
              </div>

              <div
                className="flex items-center"
                style={{ gap: 'var(--spacing-md)', fontSize: '13px' }}
              >
                {item.overallScore != null && (
                  <span className="flex items-center" style={{ gap: '4px' }}>
                    <BarChart3 size={13} style={{ color: getScoreColor(item.overallScore) }} />
                    <span
                      style={{
                        color: getScoreColor(item.overallScore),
                        fontWeight: 700,
                      }}
                    >
                      {item.overallScore}
                    </span>
                  </span>
                )}
                <span
                  className="flex items-center"
                  style={{ gap: '4px', color: 'var(--text-muted)' }}
                >
                  <Calendar size={12} />
                  {formatDate(item.createdAt)}
                </span>
              </div>

              {item.summary && (
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '12px',
                    margin: 0,
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {item.summary.length > 100 ? `${item.summary.slice(0, 100)}...` : item.summary}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ExplainabilityContent() {
  const searchParams = useSearchParams();
  const analysisId = searchParams.get('analysisId');

  if (!analysisId) {
    return <RecentAnalysesPicker />;
  }

  return <ExplainabilityDashboard analysisId={analysisId} />;
}
