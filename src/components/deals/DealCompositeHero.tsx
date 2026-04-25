'use client';

/**
 * Deal-detail hero strip showing the composite DQI + recurring bias
 * signature across every analyzed document linked to this deal (3.1).
 *
 * Sits above the tabs so the deal-as-decision-unit reading is the first
 * thing a CSO sees. Pure presentational; computation happens server-side
 * in `aggregateDeal()` so every consumer sees the same numbers.
 */

import { Activity, AlertTriangle } from 'lucide-react';
import { formatBiasName } from '@/lib/utils/labels';
import type { DealAggregationDto } from '@/types/deals';

const GRADE_HEX: Record<NonNullable<DealAggregationDto['compositeGrade']>, string> = {
  A: '#16A34A',
  B: '#2563EB',
  C: '#D97706',
  D: '#DC2626',
  F: '#7F1D1D',
};

const SEVERITY_HEX: Record<DealAggregationDto['recurringBiases'][0]['topSeverity'], string> = {
  critical: '#7F1D1D',
  high: '#DC2626',
  medium: '#D97706',
  low: '#2563EB',
};

interface Props {
  aggregation: DealAggregationDto;
  totalDocs: number;
}

export function DealCompositeHero({ aggregation, totalDocs }: Props) {
  const { compositeDqi, compositeGrade, analyzedDocCount, recurringBiases } = aggregation;
  const hasComposite = compositeDqi !== null && compositeGrade !== null;
  const topRecurring = recurringBiases.slice(0, 5);

  if (!hasComposite) {
    return (
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px dashed var(--border-color)',
          borderRadius: 10,
          padding: '14px 18px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Activity size={18} style={{ color: 'var(--text-muted)' }} />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            Composite Deal DQI not available yet
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {totalDocs === 0
              ? 'Upload the first document on this deal to start scoring.'
              : `${totalDocs} document${totalDocs !== 1 ? 's' : ''} linked, none analyzed yet.`}
          </div>
        </div>
      </div>
    );
  }

  const gradeColour = GRADE_HEX[compositeGrade];

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${gradeColour}`,
        borderRadius: 10,
        padding: '16px 20px',
        marginBottom: 16,
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: 24,
        alignItems: 'center',
      }}
    >
      {/* Composite DQI block */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            lineHeight: 1,
            color: gradeColour,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {Math.round(compositeDqi)}
        </div>
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            Composite Deal DQI
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginTop: 2,
            }}
          >
            Grade {compositeGrade} · {analyzedDocCount} of {totalDocs} doc
            {totalDocs !== 1 ? 's' : ''} analyzed
          </div>
        </div>
      </div>

      {/* Bias signature block — only renders when ≥1 recurring bias exists */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: 8,
          }}
        >
          <AlertTriangle size={11} />
          Recurring biases — appear in ≥2 docs on this deal
        </div>
        {topRecurring.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            No recurring patterns yet. With more analyzed docs the bias signature surfaces here.
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {topRecurring.map(b => {
              const colour = SEVERITY_HEX[b.topSeverity];
              return (
                <span
                  key={b.biasType}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: colour,
                    background: `${colour}18`,
                    border: `1px solid ${colour}33`,
                    padding: '3px 8px',
                    borderRadius: 999,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  title={`${b.documentCount} docs · ${b.totalOccurrences} flag${b.totalOccurrences !== 1 ? 's' : ''} · top severity: ${b.topSeverity}`}
                >
                  {formatBiasName(b.biasType)}
                  <span style={{ opacity: 0.7, fontWeight: 500 }}>· {b.documentCount}</span>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
