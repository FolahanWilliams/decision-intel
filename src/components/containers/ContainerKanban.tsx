'use client';

/**
 * ContainerKanban — unified kanban board for DecisionContainer rows.
 * Replaces the deleted DealKanban with a mode-aware board: columns are
 * the lifecycle stages from CONTAINER_MODES[kind].stages. When `kind`
 * is undefined (cross-mode dashboard), columns roll up to the universal
 * `pre_committee` / `committee_gate` / `post_committee` phases so a
 * fractional CSO reviewing both investments + acquisitions sees a
 * single 3-column board.
 */

import Link from 'next/link';
import { useMemo } from 'react';
import { GitCompareArrows } from 'lucide-react';
import { dqiColorFor } from '@/lib/utils/grade';
import { severityColor as canonicalSeverityColor } from '@/lib/utils/severity';
import { CONTAINER_MODES, type DecisionContainerKind } from '@/lib/data/decision-container-modes';
import type { ContainerSummary } from '@/types/containers';

interface ContainerKanbanProps {
  containers: ContainerSummary[];
  /** Mode filter — when set, columns reflect the mode's stage list. */
  kind?: DecisionContainerKind;
  /** Loading state from useContainers. */
  isLoading?: boolean;
}

const PHASE_COLUMNS: ReadonlyArray<{
  id: 'pre_committee' | 'committee_gate' | 'post_committee';
  label: string;
  eyebrow: string;
}> = [
  { id: 'pre_committee', label: 'Pre-committee', eyebrow: '01' },
  { id: 'committee_gate', label: 'Committee gate', eyebrow: '02' },
  { id: 'post_committee', label: 'Post-committee', eyebrow: '03' },
];

function severityBg(level: 'critical' | 'high' | 'medium' | 'low' | null): string {
  if (level === 'critical') return 'rgba(239, 68, 68, 0.10)';
  if (level === 'high') return 'rgba(239, 68, 68, 0.06)';
  if (level === 'medium') return 'rgba(245, 158, 11, 0.06)';
  return 'transparent';
}

function severityToColor(level: 'critical' | 'high' | 'medium' | 'low' | null): string {
  return canonicalSeverityColor(level);
}

function formatTicket(ticketSize: number | null, currency: string): string | null {
  if (ticketSize == null) return null;
  const symbol = currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$';
  if (ticketSize >= 1_000_000_000) return `${symbol}${(ticketSize / 1_000_000_000).toFixed(1)}B`;
  if (ticketSize >= 1_000_000) return `${symbol}${(ticketSize / 1_000_000).toFixed(1)}M`;
  if (ticketSize >= 1_000) return `${symbol}${(ticketSize / 1_000).toFixed(0)}K`;
  return `${symbol}${ticketSize.toFixed(0)}`;
}

function daysUntil(
  dateStr: string | null
): { label: string; severity: 'critical' | 'high' | 'medium' | 'low' | null } | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const days = Math.round((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < -7) return { label: `${Math.abs(days)}d ago`, severity: null };
  if (days < 0) return { label: `T+${Math.abs(days)}d`, severity: 'medium' };
  if (days === 0) return { label: 'Today', severity: 'critical' };
  if (days <= 7) return { label: `T-${days}d`, severity: 'high' };
  if (days <= 30) return { label: `T-${days}d`, severity: 'medium' };
  return { label: `T-${days}d`, severity: null };
}

export function ContainerKanban({ containers, kind, isLoading }: ContainerKanbanProps) {
  const columns = useMemo(() => {
    if (kind) {
      const mode = CONTAINER_MODES[kind];
      return mode.stages.map(s => ({
        id: s.id,
        label: s.label,
        eyebrow: s.eyebrow,
        phase: s.phase,
        items: containers.filter(c => c.kind === kind && c.stageId === s.id),
      }));
    }
    // Cross-mode roll-up — group by universal phase
    const phases = PHASE_COLUMNS.map(p => ({
      id: p.id,
      label: p.label,
      eyebrow: p.eyebrow,
      phase: p.id,
      items: [] as ContainerSummary[],
    }));
    for (const c of containers) {
      const mode = CONTAINER_MODES[c.kind];
      const stage = mode?.stages.find(s => s.id === c.stageId);
      const phaseId = stage?.phase ?? 'pre_committee';
      const bucket = phases.find(p => p.id === phaseId);
      if (bucket) bucket.items.push(c);
    }
    return phases;
  }, [containers, kind]);

  if (isLoading) {
    return <div style={{ padding: '24px', color: 'var(--text-muted)' }}>Loading containers…</div>;
  }

  if (containers.length === 0) {
    return (
      <div
        style={{
          padding: '40px 24px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div style={{ fontSize: 'var(--fs-md)', color: 'var(--text-primary)', marginBottom: 8 }}>
          No decisions yet
        </div>
        <div style={{ fontSize: 'var(--fs-sm)' }}>
          Create your first decision container to start tracking the audit moment before commit.
        </div>
        <Link
          href="/dashboard/decisions/new"
          style={{
            display: 'inline-block',
            marginTop: 16,
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-primary)',
            color: '#fff',
            fontSize: 'var(--fs-sm)',
            textDecoration: 'none',
          }}
        >
          New decision →
        </Link>
      </div>
    );
  }

  return (
    <div
      className="container-kanban"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns.length}, minmax(240px, 1fr))`,
        gap: 12,
        overflowX: 'auto',
      }}
    >
      {columns.map(col => (
        <div
          key={col.id}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: 12,
            minHeight: 200,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 12,
              fontSize: 'var(--fs-2xs)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
            }}
          >
            <span>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{col.eyebrow}</span>
              {' · '}
              <span style={{ color: 'var(--text-primary)' }}>{col.label}</span>
            </span>
            <span>{col.items.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {col.items.map(item => {
              const grade = item.compositeGrade;
              const dqiColor =
                item.compositeDqi != null ? dqiColorFor(item.compositeDqi) : undefined;
              const ticket = formatTicket(item.ticketSize, item.currency);
              const committee = daysUntil(item.committeeDate);
              const conflictSev: 'critical' | 'high' | 'medium' | 'low' | null =
                item.crossRefHighSeverityCount > 0
                  ? 'critical'
                  : item.crossRefConflictCount >= 3
                    ? 'high'
                    : item.crossRefConflictCount > 0
                      ? 'medium'
                      : null;

              return (
                <Link
                  key={item.id}
                  href={`/dashboard/decisions/${item.id}`}
                  style={{
                    display: 'block',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: 12,
                    textDecoration: 'none',
                    color: 'var(--text-primary)',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 'var(--fs-sm)',
                        fontWeight: 600,
                        lineHeight: 1.3,
                      }}
                    >
                      {item.name}
                    </div>
                    {grade && item.compositeDqi != null && (
                      <div
                        style={{
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-secondary)',
                          color: dqiColor,
                          fontSize: 'var(--fs-2xs)',
                          fontWeight: 600,
                          fontVariantNumeric: 'tabular-nums',
                          flexShrink: 0,
                        }}
                      >
                        {grade} · {Math.round(item.compositeDqi)}
                      </div>
                    )}
                  </div>
                  {item.targetCompany && (
                    <div
                      style={{
                        fontSize: 'var(--fs-2xs)',
                        color: 'var(--text-secondary)',
                        marginBottom: 4,
                      }}
                    >
                      {item.targetCompany}
                    </div>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 6,
                      fontSize: 'var(--fs-3xs)',
                      color: 'var(--text-muted)',
                      marginTop: 6,
                    }}
                  >
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-elevated)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {item.kind}
                    </span>
                    {ticket && (
                      <span
                        style={{
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-elevated)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {ticket}
                      </span>
                    )}
                    {committee && (
                      <span
                        style={{
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-sm)',
                          background: severityBg(committee.severity),
                          color: severityToColor(committee.severity),
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {committee.label}
                      </span>
                    )}
                    {item.crossRefConflictCount > 0 && (
                      <span
                        title={`${item.crossRefConflictCount} cross-doc conflicts flagged · ${item.crossRefHighSeverityCount} at high severity`}
                        style={{
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-sm)',
                          background: severityBg(conflictSev),
                          color: severityToColor(conflictSev),
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        <GitCompareArrows size={9} />
                        {item.crossRefConflictCount}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
            {col.items.length === 0 && (
              <div
                style={{
                  padding: '8px',
                  fontSize: 'var(--fs-2xs)',
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                }}
              >
                Empty
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
