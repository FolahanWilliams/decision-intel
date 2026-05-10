'use client';

/**
 * ContainerCompositeHero — composite metrics header for the container
 * detail page. Shows kind chip + composite DQI + grade + member count
 * + recurring biases + named patterns + cross-doc conflict count.
 * Replaces the deleted DealCompositeHero with a mode-aware shell.
 */

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  GitCompareArrows,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Hash,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { dqiColorFor } from '@/lib/utils/grade';
import { getContainerMode, type DecisionContainerKind } from '@/lib/data/decision-container-modes';
import { METHODOLOGY_VERSION } from '@/lib/scoring/dqi';
import type { ContainerDetail } from '@/types/containers';
import {
  ContainerDqiBreakdownPanel,
  fetchPerDocBreakdowns,
} from '@/components/dqi/ContainerDqiBreakdownPanel';
import type { PerDocBreakdown } from '@/components/dqi/ContainerDqiBreakdownPanel';

/**
 * Status pill semantics for container-level verdict (mirrors the
 * VerdictBand `deriveStatus` helper at the document level). Procurement
 * grammar — "audit-ready" / "needs revision" / "revise before board"
 * reads enterprise; "passed/failed" reads SaaS. Container-level
 * overrides include critical named patterns (Synergy Mirage / Winner's
 * Curse / Conglomerate Fallacy) which are deal-blocking signals
 * regardless of composite grade.
 */
function deriveContainerStatus(
  grade: string | null,
  criticalPatternCount: number,
  highSeverityConflicts: number
): { label: string; color: string; icon: typeof ShieldCheck } {
  if (criticalPatternCount > 0 || highSeverityConflicts > 0) {
    return { label: 'Revise before committee', color: 'var(--error)', icon: AlertOctagon };
  }
  if (grade === 'A' || grade === 'B') {
    return { label: 'Audit-ready', color: 'var(--success)', icon: ShieldCheck };
  }
  if (grade === 'C') {
    return { label: 'Needs revision', color: 'var(--warning)', icon: AlertTriangle };
  }
  if (grade === null) {
    return { label: 'Pending audits', color: 'var(--text-muted)', icon: Clock };
  }
  return { label: 'Revise before committee', color: 'var(--error)', icon: AlertOctagon };
}

/** Format the container id as a SHA-256-style mono prefix (first 12
 *  chars + ellipsis). Mirrors the doc-detail VerdictBand contentHash
 *  treatment so the procurement reader sees the same shape across both
 *  detail surfaces. The container id is a UUID, not a hash, so no
 *  cryptographic claim — just a stable monospace identity reference. */
function formatContainerIdMono(id: string): string {
  if (!id) return '';
  return id.length > 12 ? `${id.slice(0, 12)}…` : id;
}

function formatRelativeDays(iso: string | null | undefined, now: number): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return null;
  const days = Math.max(0, Math.floor((now - then) / (24 * 60 * 60 * 1000)));
  if (days === 0) return 'today';
  if (days === 1) return '1d ago';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

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
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [perDoc, setPerDoc] = useState<PerDocBreakdown[]>([]);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [breakdownError, setBreakdownError] = useState<string | null>(null);
  // Capture mount-time so relative-time copy stays pure across renders
  // (react-hooks/purity flags Date.now() in render).
  const [mountTime] = useState(() => Date.now());
  const mode = getContainerMode(container.kind as DecisionContainerKind);

  // Open the composite-DQI breakdown panel + lazy-fetch per-doc DQI on
  // first open. Driven by the click handler (event-handler pattern) to
  // satisfy react-hooks/set-state-in-effect — useEffect-driven fetches
  // are forbidden for user-action-triggered side effects.
  const openBreakdown = () => {
    setBreakdownOpen(true);
    if (perDoc.length > 0) return; // already cached
    setBreakdownLoading(true);
    setBreakdownError(null);
    fetchPerDocBreakdowns(container)
      .then(rows => setPerDoc(rows))
      .catch(err => setBreakdownError(err instanceof Error ? err.message : String(err)))
      .finally(() => setBreakdownLoading(false));
  };
  const stage = mode.stages.find(s => s.id === container.stageId);
  const dqiColor =
    container.compositeDqi != null ? dqiColorFor(container.compositeDqi) : 'var(--text-muted)';
  const ticket = formatTicket(container.ticketSize, container.currency);

  // Status pill + audit-metadata strip (locked 2026-05-10 batch 3 #3).
  // Per DESIGN.md persona-validated layout direction: the verdict is the
  // FIRST read on every detail surface. Container detail mirrors the
  // doc-detail VerdictBand pattern with container-shaped semantics —
  // critical named patterns (Synergy Mirage / etc.) override grade-
  // based labels because they're deal-blocking signals.
  const status = deriveContainerStatus(
    container.compositeGrade,
    container.aggregation.criticalPatternCount,
    container.crossRefHighSeverityCount
  );
  const StatusIcon = status.icon;
  const auditedRelative = formatRelativeDays(container.updatedAt, mountTime);

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
      {/* Status pill — first read at the container level. Mirrors the
          doc-detail VerdictBand status semantics; container override
          fires on critical named patterns (Synergy Mirage / etc.) +
          high-severity cross-doc conflicts. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          background: `color-mix(in srgb, ${status.color} 8%, var(--bg-card))`,
          border: `1px solid color-mix(in srgb, ${status.color} 22%, var(--border-color))`,
          borderRadius: 'var(--radius-sm)',
          fontSize: 'var(--fs-xs)',
          fontWeight: 600,
          color: status.color,
          alignSelf: 'flex-start',
        }}
      >
        <StatusIcon size={14} />
        <span>{status.label}</span>
      </div>

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
        <button
          type="button"
          onClick={openBreakdown}
          disabled={container.compositeDqi == null}
          aria-label="See composite DQI breakdown"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            textAlign: 'center',
            cursor: container.compositeDqi != null ? 'pointer' : 'default',
            transition: 'border-color 0.15s, transform 0.15s',
            font: 'inherit',
            color: 'inherit',
          }}
          onMouseEnter={e => {
            if (container.compositeDqi != null)
              (e.currentTarget as HTMLButtonElement).style.borderColor = dqiColor;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-color)';
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
          {container.compositeDqi != null && (
            <div
              style={{
                fontSize: 10,
                color: 'var(--text-muted)',
                marginTop: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              See breakdown →
            </div>
          )}
        </button>

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

      {/* Monospace audit-metadata strip — James persona "FIRST-orientation
          content" ask, container-shaped. Container id mono prefix +
          methodology version stamp + last-audited relative timestamp +
          audit-log deep link. Mirrors doc-detail VerdictBand pattern. */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 12,
          padding: '8px 10px',
          marginTop: 4,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          fontFamily: 'var(--font-mono, ui-monospace, SFMono-Regular, monospace)',
          fontSize: 11,
          color: 'var(--text-muted)',
        }}
      >
        <span
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          title={`Container id: ${container.id}`}
        >
          <Hash size={11} />
          {formatContainerIdMono(container.id)}
        </span>
        <span style={{ color: 'var(--border-color)' }}>·</span>
        <span title="DQI methodology version (from canonical METHODOLOGY_VERSION)">
          DQI v{METHODOLOGY_VERSION}
        </span>
        {auditedRelative && (
          <>
            <span style={{ color: 'var(--border-color)' }}>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Clock size={11} />
              audited {auditedRelative}
            </span>
          </>
        )}
        <span style={{ color: 'var(--border-color)' }}>·</span>
        <a
          href={`/dashboard/admin/audit-log?containerId=${encodeURIComponent(container.id)}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            color: 'var(--accent-primary)',
            textDecoration: 'none',
          }}
          title="Filter the audit log to this decision"
        >
          audit log
          <ExternalLink size={10} />
        </a>
      </div>

      <ContainerDqiBreakdownPanel
        open={breakdownOpen}
        onOpenChange={setBreakdownOpen}
        container={container}
        perDoc={perDoc}
        loading={breakdownLoading}
        fetchError={breakdownError}
      />
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
