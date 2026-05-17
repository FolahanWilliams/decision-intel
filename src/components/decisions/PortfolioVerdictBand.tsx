'use client';

/**
 * PortfolioVerdictBand — the procurement-grade above-fold verdict
 * surface for /dashboard/decisions, locked 2026-05-11 alongside the
 * constellation viz retirement.
 *
 * Translates the doc-detail VerdictBand pattern (status pill +
 * adversarial verdict + monospace audit metadata) from a SINGLE
 * artefact to the PORTFOLIO. The reader sees, at a glance:
 *
 *   - Portfolio status pill (Audit-ready / Needs attention /
 *     Time-sensitive / Revise before committee) derived from worst
 *     grade × high-severity conflicts × nearest committee gate.
 *   - 3 stat tiles: Active decisions · Documents audited · Next gate.
 *   - Monospace metadata strip: methodology version + pipeline
 *     freshness + canonical methodology pointer.
 *
 * Pure-function over ContainerSummary[]; no API calls; renders null
 * when the portfolio is empty so the surface gracefully degrades for
 * cold-start users (the kanban + empty state below pick up the slack).
 */

import { useMemo, useState } from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, Clock, Hash, CalendarClock } from 'lucide-react';
import type { ContainerSummary } from '@/types/containers';
import { METHODOLOGY_VERSION } from '@/lib/scoring/dqi';
import { gradeMetaFromScore } from '@/lib/utils/grade';

interface Props {
  containers: ContainerSummary[];
}

interface PortfolioStatus {
  label: string;
  body: string;
  color: string;
  Icon: typeof ShieldCheck;
}

function deriveStatus(args: {
  worstGrade: 'A' | 'B' | 'C' | 'D' | 'F' | null;
  highSeverityConflicts: number;
  daysToNextGate: number | null;
}): PortfolioStatus {
  const { worstGrade, highSeverityConflicts, daysToNextGate } = args;
  if (worstGrade === 'F' || (worstGrade === 'D' && highSeverityConflicts > 0)) {
    return {
      label: 'Revise before committee',
      body: 'One or more decisions are below the committee-ready bar.',
      color: 'var(--error)',
      Icon: AlertOctagon,
    };
  }
  if (highSeverityConflicts > 0) {
    return {
      label: 'Cross-doc conflicts',
      body: `${highSeverityConflicts} high-severity conflict${highSeverityConflicts === 1 ? '' : 's'} across the portfolio.`,
      color: 'var(--error)',
      Icon: AlertOctagon,
    };
  }
  if (worstGrade === 'D') {
    return {
      label: 'Needs revision',
      body: 'At least one decision needs a remediation pass before its next gate.',
      color: 'var(--warning)',
      Icon: AlertTriangle,
    };
  }
  if (daysToNextGate !== null && daysToNextGate <= 7) {
    return {
      label: 'Time-sensitive',
      body: `Next committee gate in ${daysToNextGate}d.`,
      color: 'var(--warning)',
      Icon: Clock,
    };
  }
  if (worstGrade === 'C') {
    return {
      label: 'Audit-ready (watch list)',
      body: 'Portfolio passes the committee bar; one or more decisions sit at the grade C floor.',
      color: 'var(--warning)',
      Icon: AlertTriangle,
    };
  }
  return {
    label: 'Audit-ready',
    body: 'Every audited decision meets the committee-ready bar.',
    color: 'var(--success)',
    Icon: ShieldCheck,
  };
}

function gradeRank(g: 'A' | 'B' | 'C' | 'D' | 'F'): number {
  return { A: 0, B: 1, C: 2, D: 3, F: 4 }[g];
}

function formatRelativeFresh(iso: string | null, mountTime: number): string {
  if (!iso) return 'never';
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return 'never';
  const mins = Math.max(0, Math.floor((mountTime - then) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.round(days / 30)}mo ago`;
  return `${Math.round(days / 365)}y ago`;
}

export function PortfolioVerdictBand({ containers }: Props) {
  const [mountTime] = useState(() => Date.now());

  const metrics = useMemo(() => {
    if (containers.length === 0) {
      return null;
    }

    const activeCount = containers.filter(c => c.status !== 'archived').length;
    const documentsAudited = containers.reduce((sum, c) => sum + c.analyzedDocCount, 0);
    const documentsTotal = containers.reduce((sum, c) => sum + c.documentCount, 0);

    const highSeverityConflicts = containers.reduce(
      (sum, c) => sum + (c.crossRefHighSeverityCount ?? 0),
      0
    );

    // Worst grade across containers that have a composite DQI computed.
    let worstGrade: 'A' | 'B' | 'C' | 'D' | 'F' | null = null;
    for (const c of containers) {
      if (c.compositeDqi === null) continue;
      const g = gradeMetaFromScore(c.compositeDqi).grade;
      if (worstGrade === null || gradeRank(g) > gradeRank(worstGrade)) {
        worstGrade = g;
      }
    }

    // Closest future committee date across active containers.
    let nextGate: { date: string; daysOut: number; name: string } | null = null;
    for (const c of containers) {
      if (!c.committeeDate) continue;
      if (c.status === 'archived') continue;
      const t = new Date(c.committeeDate).getTime();
      if (!Number.isFinite(t)) continue;
      const days = Math.ceil((t - mountTime) / (1000 * 60 * 60 * 24));
      if (days < 0) continue;
      if (nextGate === null || days < nextGate.daysOut) {
        nextGate = { date: c.committeeDate, daysOut: days, name: c.name };
      }
    }

    // Pipeline freshness — most recent updatedAt across active containers.
    let freshest: string | null = null;
    for (const c of containers) {
      if (c.status === 'archived') continue;
      if (freshest === null || new Date(c.updatedAt).getTime() > new Date(freshest).getTime()) {
        freshest = c.updatedAt;
      }
    }

    return {
      activeCount,
      documentsAudited,
      documentsTotal,
      highSeverityConflicts,
      worstGrade,
      nextGate,
      freshest,
    };
  }, [containers, mountTime]);

  if (metrics === null) {
    return null;
  }

  const status = deriveStatus({
    worstGrade: metrics.worstGrade,
    highSeverityConflicts: metrics.highSeverityConflicts,
    daysToNextGate: metrics.nextGate?.daysOut ?? null,
  });
  const StatusIcon = status.Icon;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderTop: `3px solid ${status.color}`,
        borderRadius: 'var(--radius-md)',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {/* Status pill + body row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 10px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-secondary)',
            border: `1px solid ${status.color}`,
            color: status.color,
            fontSize: 'var(--fs-xs)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
          }}
        >
          <StatusIcon size={13} />
          {status.label}
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 220,
            fontSize: 'var(--fs-sm)',
            color: 'var(--text-primary)',
            lineHeight: 1.55,
          }}
        >
          {status.body}
        </div>
      </div>

      {/* Stat tiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10,
        }}
      >
        <StatTile
          label="Active decisions"
          value={String(metrics.activeCount)}
          hint={metrics.worstGrade ? `worst grade · ${metrics.worstGrade}` : 'no composite DQI yet'}
        />
        <StatTile
          label="Documents audited"
          value={String(metrics.documentsAudited)}
          hint={
            metrics.documentsTotal > metrics.documentsAudited
              ? `${metrics.documentsTotal - metrics.documentsAudited} pending`
              : `${metrics.documentsTotal} total`
          }
        />
        <StatTile
          label="Next committee gate"
          value={metrics.nextGate ? `T-${metrics.nextGate.daysOut}d` : '—'}
          hint={metrics.nextGate ? metrics.nextGate.name : 'no gates set'}
          accent={metrics.nextGate && metrics.nextGate.daysOut <= 7 ? 'var(--warning)' : undefined}
          icon={<CalendarClock size={11} />}
        />
      </div>

      {/* Monospace metadata strip — methodology + freshness + canonical pointer */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          paddingTop: 10,
          borderTop: '1px dashed var(--border-color)',
          fontSize: 'var(--fs-3xs)',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)',
          alignItems: 'center',
        }}
      >
        <MetaChip icon={<Hash size={10} />}>methodology {METHODOLOGY_VERSION}</MetaChip>
        <MetaChip icon={<Clock size={10} />}>
          pipeline updated {formatRelativeFresh(metrics.freshest, mountTime)}
        </MetaChip>
        <span style={{ marginLeft: 'auto', fontStyle: 'italic' }}>
          R²F · DQI weights canonical · audit log preserved
        </span>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  hint,
  accent,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  accent?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 12px',
      }}
    >
      <div
        style={{
          fontSize: 'var(--fs-3xs)',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 600,
          marginBottom: 4,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {icon}
        {label}
      </div>
      <div
        style={{
          fontSize: 'var(--fs-xl)',
          fontWeight: 700,
          color: accent ?? 'var(--text-primary)',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 'var(--fs-3xs)',
          color: 'var(--text-muted)',
          marginTop: 4,
        }}
      >
        {hint}
      </div>
    </div>
  );
}

function MetaChip({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {icon}
      {children}
    </span>
  );
}
