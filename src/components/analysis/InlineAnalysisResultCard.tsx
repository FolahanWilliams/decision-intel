'use client';

import Link from 'next/link';
import { ArrowRight, Calendar, CheckCircle, FileText, Scale, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { ScoreReveal } from '@/components/ui/ScoreReveal';
import { trackEvent } from '@/lib/analytics/track';

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
                marginTop: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md, 8px)',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  flexShrink: 0,
                }}
                aria-hidden
              >
                <Scale size={14} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--text-muted)',
                    marginBottom: 1,
                  }}
                >
                  Noise score
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
                    {Math.round(analysis.noiseScore)}%
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.35 }}>
                    judge disagreement across 3 independent reads
                  </span>
                </div>
              </div>
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

      <PostRevealBookingRow />
    </motion.div>
  );
}

/**
 * Design-partner booking beat that sits under the DQI reveal. The user
 * just saw their own score — this is the highest-intent moment in the
 * whole product surface, and a 30-minute founder call is the natural
 * next step. Uses CSS variables so it reads correctly under both light
 * and dark platform themes, unlike the marketing-side BookDemoCTA which
 * is light-only by design.
 */
function PostRevealBookingRow() {
  const bookingUrl = process.env.NEXT_PUBLIC_DEMO_BOOKING_URL;
  const href = bookingUrl || '/pricing#design-partner';
  const external = !!bookingUrl;

  return (
    <div
      style={{
        padding: '14px 20px',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap',
        background:
          'linear-gradient(to right, var(--bg-card) 0%, rgba(22, 163, 74, 0.06) 100%)',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: 10,
          background: 'rgba(22, 163, 74, 0.15)',
          color: 'var(--accent-primary)',
          border: '1px solid rgba(22, 163, 74, 0.3)',
          flexShrink: 0,
        }}
        aria-hidden
      >
        <Calendar size={15} strokeWidth={2.25} />
      </span>
      <div style={{ flex: 1, minWidth: 180 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.35,
            marginBottom: 2,
          }}
        >
          Want the founder to walk through this audit with you?
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            lineHeight: 1.4,
          }}
        >
          30 minutes, live. Bring another memo and we&rsquo;ll audit that too.
        </div>
      </div>
      <Link
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        onClick={() => trackEvent('book_demo_click', { source: 'post_reveal' })}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 14px',
          background: 'transparent',
          color: 'var(--accent-primary)',
          border: '1px solid var(--accent-primary)',
          borderRadius: 'var(--radius-full)',
          fontSize: 13,
          fontWeight: 700,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        Book a 30-min call
        <ArrowRight size={13} />
      </Link>
    </div>
  );
}
