'use client';

/**
 * ContainersWidget — top-5 most-recently-updated decisions across all
 * modes (cross-mode roll-up). Lives on /dashboard home as the
 * "across all my decisions" entry point.
 *
 * Phase 3 P3.5 — replaces the deleted UnifiedDecisionsFeed. Reads
 * useContainers with no kind filter so a fractional CSO reviewing
 * both investments + acquisitions sees them merged. Each row deep-
 * links to /dashboard/decisions/[id]; the section header links to
 * /dashboard/decisions for the full kanban.
 */

import Link from 'next/link';
import { ChevronRight, Plus, Briefcase } from 'lucide-react';
import { useContainers } from '@/hooks/useContainers';
import { dqiColorFor } from '@/lib/utils/grade';
import { CONTAINER_MODES } from '@/lib/data/decision-container-modes';
import { severityColor } from '@/lib/utils/severity';

const MAX_ROWS = 5;

function daysUntil(
  dateStr: string | null
): { label: string; severity: 'critical' | 'high' | 'medium' | 'low' | null } | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const days = Math.round((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return null;
  if (days === 0) return { label: 'Today', severity: 'critical' };
  if (days <= 7) return { label: `T-${days}d`, severity: 'high' };
  if (days <= 30) return { label: `T-${days}d`, severity: 'medium' };
  return null;
}

export function ContainersWidget() {
  const { containers, isLoading } = useContainers({ status: 'active' }, 1, MAX_ROWS);

  return (
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
        <div>
          <div
            style={{
              fontSize: 'var(--fs-3xs)',
              textTransform: 'uppercase',
              letterSpacing: '0.10em',
              color: 'var(--text-muted)',
              fontWeight: 600,
              marginBottom: 2,
            }}
          >
            Active decisions
          </div>
          <h2 style={{ fontSize: 'var(--fs-md)', fontWeight: 600 }}>
            Across investments, acquisitions, and strategic decisions
          </h2>
        </div>
        <Link
          href="/dashboard/decisions/new"
          style={{
            padding: '6px 10px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-primary)',
            color: '#fff',
            textDecoration: 'none',
            fontSize: 'var(--fs-xs)',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Plus size={12} />
          New
        </Link>
      </div>

      {isLoading ? (
        <div style={{ padding: 12, color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>
          Loading…
        </div>
      ) : containers.length === 0 ? (
        <div
          style={{
            padding: '20px 12px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 'var(--fs-sm)',
          }}
        >
          <Briefcase
            size={18}
            style={{ display: 'block', margin: '0 auto 8px', color: 'var(--text-muted)' }}
          />
          No active decisions yet. Create one to start tracking the audit moment before commit.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {containers.map(c => {
            const mode = CONTAINER_MODES[c.kind];
            const stage = mode.stages.find(s => s.id === c.stageId);
            const dqiColor =
              c.compositeDqi != null ? dqiColorFor(c.compositeDqi) : 'var(--text-muted)';
            const countdown = daysUntil(c.committeeDate);
            const conflictSev: 'critical' | 'high' | 'medium' | 'low' | null =
              c.crossRefHighSeverityCount > 0
                ? 'critical'
                : c.crossRefConflictCount > 0
                  ? 'medium'
                  : null;
            return (
              <Link
                key={c.id}
                href={`/dashboard/decisions/${c.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  textDecoration: 'none',
                  color: 'var(--text-primary)',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--fs-3xs)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    flexShrink: 0,
                    minWidth: 60,
                  }}
                >
                  {mode.label}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 'var(--fs-sm)',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {c.name}
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--fs-2xs)',
                      color: 'var(--text-muted)',
                      marginTop: 2,
                    }}
                  >
                    {stage?.label ?? c.stageId}
                    {c.targetCompany && ` · ${c.targetCompany}`}
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexShrink: 0,
                  }}
                >
                  {countdown && (
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        background:
                          countdown.severity === 'critical'
                            ? 'rgba(239, 68, 68, 0.10)'
                            : countdown.severity === 'high'
                              ? 'rgba(239, 68, 68, 0.06)'
                              : 'rgba(245, 158, 11, 0.06)',
                        color: severityColor(countdown.severity),
                        fontSize: 'var(--fs-3xs)',
                        fontWeight: 600,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {countdown.label}
                    </span>
                  )}
                  {c.crossRefConflictCount > 0 && (
                    <span
                      title={`${c.crossRefConflictCount} cross-doc conflicts`}
                      style={{
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        background:
                          conflictSev === 'critical'
                            ? 'rgba(239, 68, 68, 0.10)'
                            : 'rgba(245, 158, 11, 0.06)',
                        color: severityColor(conflictSev),
                        fontSize: 'var(--fs-3xs)',
                        fontWeight: 600,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {c.crossRefConflictCount} conflict{c.crossRefConflictCount === 1 ? '' : 's'}
                    </span>
                  )}
                  {c.compositeDqi != null && c.compositeGrade && (
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-card)',
                        color: dqiColor,
                        fontSize: 'var(--fs-3xs)',
                        fontWeight: 600,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {c.compositeGrade} · {Math.round(c.compositeDqi)}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Link
        href="/dashboard/decisions"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          marginTop: 12,
          fontSize: 'var(--fs-xs)',
          color: 'var(--accent-primary)',
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        All decisions <ChevronRight size={12} />
      </Link>
    </div>
  );
}
