'use client';

import Link from 'next/link';
import { CheckCircle, ArrowRight, X, FileText, Scale } from 'lucide-react';
import { motion } from 'framer-motion';
import { ScoreReveal } from '@/components/ui/ScoreReveal';

export interface CompletedAnalysisSummary {
  docId: string;
  filename: string;
  overallScore: number;
  biasCount: number;
  noiseScore?: number;
  detectedBiases: Array<{ type: string; severity?: string }>;
}

interface Props {
  analysis: CompletedAnalysisSummary;
  onDismiss: () => void;
}

function humanizeBias(type: string): string {
  const words = type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return /bias$/i.test(words) ? words : `${words} Bias`;
}

const SEVERITY_ORDER: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  unknown: 0,
};

function severityColor(severity: string | undefined): string {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'var(--severity-high, #ef4444)';
    case 'medium':
      return 'var(--warning, #eab308)';
    default:
      return 'var(--text-muted)';
  }
}

export function InlineAnalysisResultCard({ analysis, onDismiss }: Props) {
  const top3 = [...analysis.detectedBiases]
    .sort(
      (a, b) =>
        (SEVERITY_ORDER[b.severity ?? 'unknown'] ?? 0) -
        (SEVERITY_ORDER[a.severity ?? 'unknown'] ?? 0)
    )
    .slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--accent-primary)',
        overflow: 'hidden',
        boxShadow: 'var(--liquid-shadow)',
      }}
    >
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <CheckCircle size={16} style={{ color: 'var(--success)' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--success)',
            }}
          >
            60-second audit complete
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--text-primary)',
              fontWeight: 500,
              marginTop: 2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <FileText size={12} style={{ opacity: 0.6, flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {analysis.filename}
            </span>
          </div>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss analysis result"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            padding: 4,
            display: 'flex',
          }}
        >
          <X size={16} />
        </button>
      </div>

      <div
        style={{
          padding: '24px 20px',
          display: 'grid',
          gridTemplateColumns: 'minmax(200px, 1fr) 1.5fr',
          gap: 28,
          alignItems: 'start',
        }}
      >
        <div>
          <ScoreReveal
            score={analysis.overallScore}
            label="Decision Quality Index"
            showGrade
            suspenseMs={1200}
          />
          {analysis.noiseScore != null && (
            <div
              style={{
                marginTop: 14,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                color: 'var(--text-secondary)',
              }}
            >
              <Scale size={12} />
              <span>
                Noise:{' '}
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {Math.round(analysis.noiseScore)}%
                </span>
              </span>
            </div>
          )}
        </div>

        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text-muted)',
              marginBottom: 10,
            }}
          >
            {analysis.biasCount === 0
              ? 'No cognitive biases flagged'
              : `${analysis.biasCount} cognitive bias${analysis.biasCount === 1 ? '' : 'es'} flagged`}
          </div>
          {top3.length > 0 ? (
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {top3.map((b, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 13.5,
                    color: 'var(--text-primary)',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: severityColor(b.severity),
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontWeight: 500 }}>{humanizeBias(b.type)}</span>
                  {b.severity && b.severity !== 'unknown' && (
                    <span
                      style={{
                        fontSize: 10,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        fontWeight: 600,
                      }}
                    >
                      {b.severity}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Reasoning chain scanned — no high-risk cognitive patterns surfaced.
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: 13,
            padding: '6px 0',
          }}
        >
          Upload another
        </button>
        <Link
          href={`/documents/${analysis.docId}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            background: 'var(--accent-primary)',
            color: 'var(--text-on-accent, #fff)',
            borderRadius: 'var(--radius-full)',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Deep Dive
          <ArrowRight size={14} />
        </Link>
      </div>
    </motion.div>
  );
}
