'use client';

/**
 * ContainerCompositeHero — composite metrics header for the container
 * detail page. Shows kind chip + composite DQI + grade + member count
 * + recurring biases + named patterns + cross-doc conflict count.
 * Replaces the deleted DealCompositeHero with a mode-aware shell.
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, GitCompareArrows } from 'lucide-react';
import { dqiColorFor } from '@/lib/utils/grade';
import { getContainerMode, type DecisionContainerKind } from '@/lib/data/decision-container-modes';
import type { ContainerDetail } from '@/types/containers';

interface ContainerCompositeHeroProps {
  container: ContainerDetail;
}

function formatTicket(ticketSize: number | null, currency: string): string | null {
  if (ticketSize == null) return null;
  const symbol = currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$';
  if (ticketSize >= 1_000_000_000) return `${symbol}${(ticketSize / 1_000_000_000).toFixed(2)}B`;
  if (ticketSize >= 1_000_000) return `${symbol}${(ticketSize / 1_000_000).toFixed(1)}M`;
  if (ticketSize >= 1_000) return `${symbol}${(ticketSize / 1_000).toFixed(0)}K`;
  return `${symbol}${ticketSize.toFixed(0)}`;
}

export function ContainerCompositeHero({ container }: ContainerCompositeHeroProps) {
  const [biasesExpanded, setBiasesExpanded] = useState(false);
  const mode = getContainerMode(container.kind as DecisionContainerKind);
  const stage = mode.stages.find(s => s.id === container.stageId);
  const dqiColor =
    container.compositeDqi != null ? dqiColorFor(container.compositeDqi) : 'var(--text-muted)';
  const ticket = formatTicket(container.ticketSize, container.currency);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {/* Top: kind + stage + counts */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          fontSize: 'var(--fs-2xs)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
        }}
      >
        <span
          style={{
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-elevated)',
            color: 'var(--text-secondary)',
            fontWeight: 600,
          }}
        >
          {mode.label}
        </span>
        {stage && (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
            }}
          >
            {stage.eyebrow} · {stage.label}
          </span>
        )}
        {container.dealType && (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              textTransform: 'capitalize',
            }}
          >
            {container.dealType.replace(/_/g, ' ')}
          </span>
        )}
        {container.sector && (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              textTransform: 'capitalize',
            }}
          >
            {container.sector.replace(/_/g, ' ')}
          </span>
        )}
        {container.fundName && (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
            }}
          >
            {container.fundName}
            {container.vintage ? ` · ${container.vintage}` : ''}
          </span>
        )}
        {ticket && (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {ticket}
          </span>
        )}
      </div>

      {/* Composite DQI tile */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(140px, auto) 1fr',
          gap: 16,
          alignItems: 'center',
        }}
      >
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 'var(--fs-3xs)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              marginBottom: 4,
            }}
          >
            Composite DQI
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: dqiColor,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
            }}
          >
            {container.compositeDqi != null ? Math.round(container.compositeDqi) : '—'}
          </div>
          <div
            style={{
              fontSize: 'var(--fs-xs)',
              color: 'var(--text-secondary)',
              marginTop: 4,
            }}
          >
            Grade {container.compositeGrade ?? '—'}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: 10,
          }}
        >
          <Stat
            label="Documents"
            value={`${container.analyzedDocCount}/${container.documentCount}`}
            hint="analyzed"
          />
          <Stat
            label="Recurring biases"
            value={String(container.recurringBiasCount)}
            hint="across docs"
          />
          <Stat
            label="Named patterns"
            value={String(container.aggregation.namedPatterns.length)}
            hint={
              container.aggregation.criticalPatternCount > 0
                ? `${container.aggregation.criticalPatternCount} critical`
                : container.aggregation.highPatternCount > 0
                  ? `${container.aggregation.highPatternCount} high`
                  : 'none critical'
            }
            hintTone={
              container.aggregation.criticalPatternCount > 0
                ? 'critical'
                : container.aggregation.highPatternCount > 0
                  ? 'high'
                  : 'neutral'
            }
          />
          <Stat
            label="Cross-doc conflicts"
            value={String(container.crossRefConflictCount)}
            hint={
              container.crossRefHighSeverityCount > 0
                ? `${container.crossRefHighSeverityCount} high+`
                : container.crossRefConflictCount > 0
                  ? 'medium / low'
                  : 'clean'
            }
            hintTone={
              container.crossRefHighSeverityCount > 0
                ? 'critical'
                : container.crossRefConflictCount > 0
                  ? 'medium'
                  : 'success'
            }
          />
        </div>
      </div>

      {/* Recurring biases drawer */}
      {container.aggregation.allBiases.length > 0 && (
        <div>
          <button
            onClick={() => setBiasesExpanded(!biasesExpanded)}
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 8px',
              fontSize: 'var(--fs-xs)',
              color: 'var(--text-secondary)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {biasesExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Bias signature ({container.aggregation.allBiases.length} unique)
          </button>
          {biasesExpanded && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                marginTop: 8,
              }}
            >
              {container.aggregation.allBiases.slice(0, 12).map(b => (
                <span
                  key={b.biasType}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--fs-2xs)',
                  }}
                  title={`${b.count} occurrences across ${b.documentIds.length} document${b.documentIds.length === 1 ? '' : 's'}`}
                >
                  {b.biasType.replace(/_/g, ' ')} · {b.count}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cross-ref summary chip */}
      {container.crossRefConflictCount > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 10px',
            borderRadius: 'var(--radius-md)',
            background:
              container.crossRefHighSeverityCount > 0
                ? 'rgba(239, 68, 68, 0.06)'
                : 'rgba(245, 158, 11, 0.04)',
            color: container.crossRefHighSeverityCount > 0 ? 'var(--error)' : 'var(--warning)',
            fontSize: 'var(--fs-xs)',
          }}
        >
          <GitCompareArrows size={14} />
          <span>
            {container.crossRefConflictCount} cross-doc conflict
            {container.crossRefConflictCount === 1 ? '' : 's'}
            {container.crossRefHighSeverityCount > 0
              ? ` · ${container.crossRefHighSeverityCount} at high severity`
              : ''}
          </span>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  hintTone,
}: {
  label: string;
  value: string;
  hint?: string;
  hintTone?: 'success' | 'medium' | 'high' | 'critical' | 'neutral';
}) {
  const hintColor =
    hintTone === 'critical'
      ? 'var(--error)'
      : hintTone === 'high'
        ? 'var(--severity-high)'
        : hintTone === 'medium'
          ? 'var(--warning)'
          : hintTone === 'success'
            ? 'var(--success)'
            : 'var(--text-muted)';
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: 10,
      }}
    >
      <div
        style={{
          fontSize: 'var(--fs-3xs)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 'var(--fs-md)',
          fontWeight: 600,
          color: 'var(--text-primary)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
      {hint && (
        <div
          style={{
            fontSize: 'var(--fs-3xs)',
            color: hintColor,
            marginTop: 2,
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}
