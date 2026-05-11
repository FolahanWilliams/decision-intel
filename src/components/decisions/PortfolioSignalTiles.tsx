'use client';

/**
 * PortfolioSignalTiles — the portfolio analog of RemediationChecklist
 * on the document-detail page (locked 2026-05-11 alongside the
 * constellation viz retirement).
 *
 * Doc-detail's RemediationChecklist surfaces the top 3 prioritized
 * fixes on a single audit. This component surfaces the top 3
 * portfolio-level signals worth acting on:
 *
 *   #1 Highest-risk decision  — lowest composite DQI (deep-link →
 *      /decisions/[id] so the reader lands on the audit body).
 *   #2 Next committee gate    — closest future committeeDate; copy
 *      reads "T-Nd · {decision name}" so the urgency is unmissable.
 *   #3 Most conflicted        — highest cross-doc high-severity
 *      conflict count (falls back to total conflict count when no
 *      high-severity flags).
 *
 * Pure client-side derivation over ContainerSummary[]. Renders null
 * when the portfolio has no actionable signals (no DQIs computed AND
 * no gates set AND no conflicts).
 */

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  GitCompareArrows,
  ChevronRight,
  TrendingDown,
  Target,
} from 'lucide-react';
import type { ContainerSummary } from '@/types/containers';
import { CONTAINER_MODES } from '@/lib/data/decision-container-modes';
import { gradeMetaFromScore } from '@/lib/utils/grade';

interface Props {
  containers: ContainerSummary[];
}

type TileKind = 'risk' | 'gate' | 'conflict';

interface SignalTile {
  kind: TileKind;
  rank: 1 | 2 | 3;
  label: string;
  badge: string;
  badgeColor: string;
  containerId: string;
  containerName: string;
  containerKind: string;
  body: string;
  icon: typeof AlertTriangle;
}

function pickHighestRisk(containers: ContainerSummary[]): SignalTile | null {
  const scored = containers.filter(c => c.compositeDqi !== null && c.status !== 'archived');
  if (scored.length === 0) return null;
  const worst = scored.reduce((acc, c) =>
    (c.compositeDqi as number) < (acc.compositeDqi as number) ? c : acc
  );
  const grade = gradeMetaFromScore(worst.compositeDqi as number);
  // Only surface as a "risk" tile when the grade is C or worse — A/B
  // portfolios don't need a "highest-risk" callout (everything is fine).
  if (grade.grade === 'A' || grade.grade === 'B') return null;
  return {
    kind: 'risk',
    rank: 1,
    label: 'Highest-risk decision',
    badge: `${grade.grade} · ${Math.round(worst.compositeDqi as number)}/100`,
    badgeColor: grade.color ?? 'var(--warning)',
    containerId: worst.id,
    containerName: worst.name,
    containerKind: worst.kind,
    body:
      worst.recurringBiasCount > 0
        ? `${worst.recurringBiasCount} recurring bias${worst.recurringBiasCount === 1 ? '' : 'es'} across ${worst.analyzedDocCount} audited doc${worst.analyzedDocCount === 1 ? '' : 's'}.`
        : `${worst.analyzedDocCount} audited doc${worst.analyzedDocCount === 1 ? '' : 's'}; composite below committee-ready bar.`,
    icon: TrendingDown,
  };
}

function pickNextGate(containers: ContainerSummary[], now: number): SignalTile | null {
  const active = containers.filter(c => c.status !== 'archived' && c.committeeDate);
  if (active.length === 0) return null;
  let best: ContainerSummary | null = null;
  let bestDays = Infinity;
  for (const c of active) {
    const t = new Date(c.committeeDate as string).getTime();
    if (!Number.isFinite(t)) continue;
    const days = Math.ceil((t - now) / (1000 * 60 * 60 * 24));
    if (days < 0) continue;
    if (days < bestDays) {
      bestDays = days;
      best = c;
    }
  }
  if (best === null) return null;
  const urgent = bestDays <= 7;
  return {
    kind: 'gate',
    rank: 2,
    label: 'Next committee gate',
    badge: bestDays === 0 ? 'today' : `T-${bestDays}d`,
    badgeColor: urgent ? 'var(--error)' : bestDays <= 14 ? 'var(--warning)' : 'var(--info)',
    containerId: best.id,
    containerName: best.name,
    containerKind: best.kind,
    body: urgent
      ? `${CONTAINER_MODES[best.kind].label} review imminent — audit before the room sees it.`
      : `${CONTAINER_MODES[best.kind].label} review on the calendar.`,
    icon: CalendarClock,
  };
}

function pickMostConflicted(containers: ContainerSummary[]): SignalTile | null {
  const flagged = containers.filter(
    c => c.status !== 'archived' && (c.crossRefConflictCount ?? 0) > 0
  );
  if (flagged.length === 0) return null;
  const worst = flagged.reduce((acc, c) => {
    const hSev = c.crossRefHighSeverityCount ?? 0;
    const aSev = acc.crossRefHighSeverityCount ?? 0;
    if (hSev > aSev) return c;
    if (hSev === aSev && (c.crossRefConflictCount ?? 0) > (acc.crossRefConflictCount ?? 0)) {
      return c;
    }
    return acc;
  });
  const high = worst.crossRefHighSeverityCount ?? 0;
  const total = worst.crossRefConflictCount ?? 0;
  return {
    kind: 'conflict',
    rank: 3,
    label: 'Most cross-doc conflicts',
    badge: high > 0 ? `${high} high-sev` : `${total} flagged`,
    badgeColor: high > 0 ? 'var(--error)' : 'var(--warning)',
    containerId: worst.id,
    containerName: worst.name,
    containerKind: worst.kind,
    body: `${total} cross-document conflict${total === 1 ? '' : 's'} across ${worst.analyzedDocCount} audited doc${worst.analyzedDocCount === 1 ? '' : 's'}.`,
    icon: GitCompareArrows,
  };
}

export function PortfolioSignalTiles({ containers }: Props) {
  // Capture mount-time once so Date.now() doesn't fire during render
  // (react-hooks/purity rule). Per-day precision is enough for the
  // T-N committee countdown.
  const [mountTime] = useState(() => Date.now());
  const tiles = useMemo(() => {
    const now = mountTime;
    const out: SignalTile[] = [];
    const risk = pickHighestRisk(containers);
    if (risk) out.push(risk);
    const gate = pickNextGate(containers, now);
    if (gate) out.push(gate);
    const conflict = pickMostConflicted(containers);
    if (conflict) out.push(conflict);
    // Re-rank so the visible rank numbers stay 1..N regardless of which
    // of the three tiles fired.
    return out.map((t, i) => ({ ...t, rank: (i + 1) as 1 | 2 | 3 }));
  }, [containers, mountTime]);

  if (tiles.length === 0) return null;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 18px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 12,
        }}
      >
        <Target size={14} style={{ color: 'var(--accent-primary)' }} />
        <span
          style={{
            fontSize: 'var(--fs-sm)',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          Where attention is needed
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 'var(--fs-3xs)',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 600,
          }}
        >
          Top {tiles.length} portfolio signal{tiles.length === 1 ? '' : 's'}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tiles.map(tile => {
          const Icon = tile.icon;
          return (
            <Link
              key={`${tile.kind}-${tile.containerId}`}
              href={`/dashboard/decisions/${tile.containerId}`}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: '12px 14px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderLeft: `3px solid ${tile.badgeColor}`,
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'border-color 150ms, background 150ms',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg-elevated)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg-secondary)';
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-card)',
                  border: `1px solid ${tile.badgeColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: tile.badgeColor,
                }}
              >
                <Icon size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 'var(--fs-3xs)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--text-muted)',
                    }}
                  >
                    #{tile.rank} · {tile.label}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: tile.badgeColor,
                      background: 'var(--bg-card)',
                      border: `1px solid ${tile.badgeColor}`,
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-full)',
                    }}
                  >
                    {tile.badge}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 'var(--fs-sm)',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: 4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tile.containerName}
                </div>
                <div
                  style={{
                    fontSize: 'var(--fs-xs)',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  {tile.body}
                </div>
              </div>
              <ChevronRight
                size={16}
                style={{ color: 'var(--text-muted)', flexShrink: 0, alignSelf: 'center' }}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
