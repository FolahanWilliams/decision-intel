'use client';

/**
 * Deal-detail hero strip showing the composite DQI + recurring bias
 * signature across every analyzed document linked to this deal (3.1).
 *
 * Sits above the tabs so the deal-as-decision-unit reading is the first
 * thing a CSO sees. Pure presentational; computation happens server-side
 * in `aggregateDeal()` so every consumer sees the same numbers.
 *
 * Click-to-open extension (DQI explainability surface 3, locked
 * 2026-05-09 evening): the composite DQI block opens a navigation-grade
 * breakdown panel showing per-document rows + recurring patterns +
 * named compound failure patterns + cross-document conflicts. Different
 * shape from the per-audit panel — composite is an average so the
 * decomposition is "where did this average come from", not "which
 * weighted component contributed what" (that's the per-doc view, one
 * click away).
 */

import { useState } from 'react';
import { Activity, AlertTriangle } from 'lucide-react';
import { formatBiasName } from '@/lib/utils/labels';
import type { DealAggregationDto, DealDocument } from '@/types/deals';
import { DealCalibrationChip } from './DealCalibrationChip';
import { DealDqiBreakdownPanel } from '@/components/dqi/DealDqiBreakdownPanel';

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
  /**
   * Optional context for the click-to-open breakdown panel. When omitted
   * the composite block is non-clickable (the panel needs the document
   * list + cross-doc conflict counts to be informative). Callers that
   * already have these in scope (the deal-detail page does, kanban
   * preview cards typically don't) should pass them through.
   */
  dealName?: string;
  documents?: DealDocument[];
  conflictCount?: number;
  conflictHighCount?: number;
}

export function DealCompositeHero({
  aggregation,
  totalDocs,
  dealName,
  documents,
  conflictCount = 0,
  conflictHighCount = 0,
}: Props) {
  const { compositeDqi, compositeGrade, analyzedDocCount, recurringBiases } = aggregation;
  const hasComposite = compositeDqi !== null && compositeGrade !== null;
  const topRecurring = recurringBiases.slice(0, 5);
  const [panelOpen, setPanelOpen] = useState(false);
  const canOpenPanel =
    hasComposite && Array.isArray(documents) && typeof dealName === 'string' && dealName.length > 0;

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
      {/* Composite DQI block — clickable when the caller passes the
          breakdown panel context. The button is a lightweight wrapper
          so the visual layout doesn't shift; it just adds focus +
          cursor + an inline "Click to see how it's computed →" hint. */}
      <button
        type="button"
        onClick={canOpenPanel ? () => setPanelOpen(true) : undefined}
        disabled={!canOpenPanel}
        aria-label={
          canOpenPanel
            ? 'Open composite DQI breakdown — see per-document scores and recurring patterns'
            : undefined
        }
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 14,
          padding: 0,
          background: 'transparent',
          border: 'none',
          textAlign: 'left',
          cursor: canOpenPanel ? 'pointer' : 'default',
        }}
      >
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
          {/* Calibration evidence — per-org Brier when outcomes have
              accumulated, platform seed baseline as the honest fallback.
              Cloverpop-defense surface (CLAUDE.md External Attack
              Vectors). B5 lock 2026-04-30. */}
          <DealCalibrationChip />
          {canOpenPanel && (
            <div
              style={{
                marginTop: 6,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--accent-primary)',
              }}
            >
              Click to see how it&rsquo;s computed →
            </div>
          )}
        </div>
      </button>

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

      {canOpenPanel && documents && dealName && (
        <DealDqiBreakdownPanel
          open={panelOpen}
          onOpenChange={setPanelOpen}
          dealName={dealName}
          aggregation={aggregation}
          totalDocs={totalDocs}
          documents={documents}
          conflictCount={conflictCount}
          conflictHighCount={conflictHighCount}
        />
      )}
    </div>
  );
}
