'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  Zap,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  GitBranch,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';
import { getBiasDisplayName } from '@/lib/utils/bias-normalize';
import { getBiasColor } from '@/lib/utils/bias-colors';

interface LearningImpactData {
  hasOutcome: boolean;
  // When outcome exists
  outcome?: { outcome: string; impactScore: number | null };
  confirmedBiases?: string[];
  falsPositiveBiases?: string[];
  edgesUpdated?: number;
  orgAccuracyMessage?: string | null;
  // When no outcome
  potentialLearnings?: {
    biasCount: number;
    biasTypes: string[];
    similarDecisions: number;
    outcomesNeeded: number;
    message: string;
  };
}

const fetcher = (url: string) =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error('Failed to fetch');
    return r.json();
  });

const OUTCOME_LABELS: Record<string, { label: string; color: string }> = {
  success: { label: 'Success', color: '#34d399' },
  partial_success: { label: 'Partial', color: '#fbbf24' },
  failure: { label: 'Failed', color: '#f87171' },
  too_early: { label: 'Too Early', color: '#A1A1AA' },
};

export function LearningImpactCard({ analysisId }: { analysisId: string }) {
  const { data, isLoading } = useSWR<LearningImpactData>(
    analysisId ? `/api/learning/impact?analysisId=${analysisId}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );
  const [expanded, setExpanded] = useState(false);

  if (isLoading || !data) return null;

  // ─── Outcome exists: show what was learned ──────────────────────────
  if (data.hasOutcome && data.outcome) {
    const outcomeInfo = OUTCOME_LABELS[data.outcome.outcome] || OUTCOME_LABELS.too_early;
    const confirmed = data.confirmedBiases || [];
    const falsePositives = data.falsPositiveBiases || [];
    const hasDetails = confirmed.length > 0 || falsePositives.length > 0 || data.edgesUpdated;

    return (
      <div
        className="card liquid-glass-premium animate-fade-in"
        style={{ overflow: 'hidden' }}
      >
        <div
          className="card-header flex items-center justify-between"
          style={{
            paddingBottom: expanded ? 'var(--spacing-sm)' : 'var(--spacing-md)',
            cursor: hasDetails ? 'pointer' : 'default',
          }}
          onClick={() => hasDetails && setExpanded(!expanded)}
        >
          <div className="flex items-center gap-sm">
            <Zap size={16} style={{ color: '#34d399' }} />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Learning Impact</span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '6px',
                background: `${outcomeInfo.color}15`,
                color: outcomeInfo.color,
                border: `1px solid ${outcomeInfo.color}30`,
              }}
            >
              {outcomeInfo.label}
            </span>
          </div>
          <div className="flex items-center gap-sm">
            {/* Summary stats inline */}
            {confirmed.length > 0 && (
              <span className="flex items-center gap-xs" style={{ fontSize: '11px', color: '#34d399' }}>
                <CheckCircle size={12} />
                {confirmed.length} confirmed
              </span>
            )}
            {falsePositives.length > 0 && (
              <span className="flex items-center gap-xs" style={{ fontSize: '11px', color: '#fbbf24' }}>
                <XCircle size={12} />
                {falsePositives.length} false pos.
              </span>
            )}
            {(data.edgesUpdated ?? 0) > 0 && (
              <span className="flex items-center gap-xs" style={{ fontSize: '11px', color: '#38bdf8' }}>
                <GitBranch size={12} />
                {data.edgesUpdated} edges
              </span>
            )}
            {hasDetails &&
              (expanded ? (
                <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} />
              ) : (
                <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
              ))}
          </div>
        </div>

        {expanded && (
          <div className="card-body" style={{ paddingTop: 0 }}>
            {/* Accuracy message */}
            {data.orgAccuracyMessage && (
              <div
                className="flex items-center gap-xs"
                style={{
                  fontSize: '12px',
                  color: '#34d399',
                  marginBottom: 'var(--spacing-sm)',
                  padding: '6px 10px',
                  background: 'rgba(52, 211, 153, 0.08)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <TrendingUp size={13} />
                {data.orgAccuracyMessage}
              </div>
            )}

            {/* Bias pills */}
            {confirmed.length > 0 && (
              <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Confirmed Biases
                </div>
                <div className="flex flex-wrap gap-xs">
                  {confirmed.map(b => {
                    const color = getBiasColor(b);
                    return (
                      <span
                        key={b}
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: `${color.bg}20`,
                          color: color.text,
                          border: `1px solid ${color.border}`,
                        }}
                      >
                        {getBiasDisplayName(b)}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {falsePositives.length > 0 && (
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  False Positives
                </div>
                <div className="flex flex-wrap gap-xs">
                  {falsePositives.map(b => (
                    <span
                      key={b}
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: 'rgba(251, 191, 36, 0.1)',
                        color: '#fbbf24',
                        border: '1px solid rgba(251, 191, 36, 0.2)',
                        textDecoration: 'line-through',
                        opacity: 0.7,
                      }}
                    >
                      {getBiasDisplayName(b)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ─── No outcome yet: show what they'll learn ────────────────────────
  if (data.potentialLearnings) {
    const pl = data.potentialLearnings;
    if (pl.biasCount === 0) return null;

    return (
      <div
        className="card animate-fade-in"
        style={{
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px dashed rgba(255, 255, 255, 0.12)',
        }}
      >
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-sm">
            <Zap size={16} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Complete the Learning Loop
            </span>
          </div>
          <ArrowUpRight size={14} style={{ color: 'var(--text-muted)' }} />
        </div>
        <div className="card-body" style={{ paddingTop: 0 }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            {pl.message}
          </p>
          <div
            className="flex items-center gap-md"
            style={{ marginTop: 'var(--spacing-sm)', fontSize: '11px', color: 'var(--text-muted)' }}
          >
            {pl.similarDecisions > 0 && (
              <span>
                {pl.similarDecisions} similar decision{pl.similarDecisions !== 1 ? 's' : ''} will
                benefit
              </span>
            )}
            {pl.outcomesNeeded > 0 && (
              <span>
                {pl.outcomesNeeded} more outcome{pl.outcomesNeeded !== 1 ? 's' : ''} needed for
                statistical significance
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
