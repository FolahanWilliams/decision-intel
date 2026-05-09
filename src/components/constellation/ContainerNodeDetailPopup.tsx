'use client';

/**
 * ContainerNodeDetailPopup — anchored detail card opened when the
 * reader clicks a node in the Constellation viz. Shows the procurement-
 * grade signal cluster (mode chip + name + DQI + critical-pattern chip
 * + T-N committee countdown + cross-doc conflict count) plus deep-link
 * "Open decision →" routing to the unified container detail page.
 *
 * Phase 3.5 ship — paired with ContainerConstellation viz.
 */

import Link from 'next/link';
import { ChevronRight, AlertCircle, Calendar, FileText } from 'lucide-react';
import { CONTAINER_MODES } from '@/lib/data/decision-container-modes';
import { riskBandColor, severityTint, type PositionedNode } from './constellation-layout';
import { dqiColorFor } from '@/lib/utils/grade';

interface ContainerNodeDetailPopupProps {
  node: PositionedNode;
  /** Optional outbound link counts (used to render fan-out chips). */
  outboundLinkCount?: number;
  inboundLinkCount?: number;
  onClose: () => void;
}

export function ContainerNodeDetailPopup({
  node,
  outboundLinkCount = 0,
  inboundLinkCount = 0,
  onClose,
}: ContainerNodeDetailPopupProps) {
  const mode = CONTAINER_MODES[node.kind];
  const stage = mode.stages.find(s => s.id === node.stageId);
  const bandColor = riskBandColor(node.riskBand);
  const dqiColor = node.compositeDqi != null ? dqiColorFor(node.compositeDqi) : 'var(--text-muted)';

  const countdownLabel = (() => {
    if (node.daysUntilCommittee == null) return null;
    if (node.daysUntilCommittee < 0) {
      return { text: `${Math.abs(node.daysUntilCommittee)}d ago`, severity: 'low' as const };
    }
    if (node.daysUntilCommittee === 0) return { text: 'Today', severity: 'critical' as const };
    if (node.daysUntilCommittee <= 7)
      return { text: `T-${node.daysUntilCommittee}d`, severity: 'critical' as const };
    if (node.daysUntilCommittee <= 30)
      return { text: `T-${node.daysUntilCommittee}d`, severity: 'high' as const };
    return { text: `T-${node.daysUntilCommittee}d`, severity: 'medium' as const };
  })();

  return (
    <div
      role="dialog"
      aria-label={`Decision detail: ${node.name}`}
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        width: 320,
        maxWidth: 'calc(100% - 24px)',
        zIndex: 30,
        background: 'var(--bg-card)',
        border: `1px solid ${severityTint(bandColor, 35)}`,
        borderLeft: `3px solid ${bandColor}`,
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        padding: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 8,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 'var(--fs-3xs)',
              textTransform: 'uppercase',
              letterSpacing: '0.10em',
              color: bandColor,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            {mode.label} · {stage?.label ?? node.stageId}
          </div>
          <h3
            style={{
              fontSize: 'var(--fs-md)',
              fontWeight: 600,
              margin: 0,
              color: 'var(--text-primary)',
              lineHeight: 1.3,
            }}
          >
            {node.name}
          </h3>
          {node.targetCompany && node.targetCompany !== node.name && (
            <div
              style={{
                fontSize: 'var(--fs-2xs)',
                color: 'var(--text-muted)',
                marginTop: 2,
              }}
            >
              {node.targetCompany}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: 18,
            lineHeight: 1,
            padding: 4,
          }}
        >
          ×
        </button>
      </div>

      {/* Risk-state signals strip */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          marginTop: 12,
          marginBottom: 12,
        }}
      >
        {countdownLabel && (
          <Chip
            icon={<Calendar size={11} />}
            color={
              countdownLabel.severity === 'critical'
                ? 'var(--severity-critical)'
                : countdownLabel.severity === 'high'
                  ? 'var(--severity-high)'
                  : countdownLabel.severity === 'medium'
                    ? 'var(--warning)'
                    : 'var(--text-muted)'
            }
            label={`${mode.committeeLabel} · ${countdownLabel.text}`}
          />
        )}
        {node.compositeDqi != null && node.compositeGrade && (
          <Chip
            color={dqiColor}
            label={`${node.compositeGrade} · ${Math.round(node.compositeDqi)}`}
          />
        )}
        {node.crossRefHighSeverityCount > 0 && (
          <Chip
            icon={<AlertCircle size={11} />}
            color="var(--severity-critical)"
            label={`${node.crossRefHighSeverityCount} high-severity conflict${node.crossRefHighSeverityCount === 1 ? '' : 's'}`}
          />
        )}
        {node.crossRefConflictCount > 0 && node.crossRefHighSeverityCount === 0 && (
          <Chip
            icon={<AlertCircle size={11} />}
            color="var(--warning)"
            label={`${node.crossRefConflictCount} conflict${node.crossRefConflictCount === 1 ? '' : 's'}`}
          />
        )}
        {node.recurringBiasCount > 0 && (
          <Chip
            color="var(--text-secondary)"
            label={`${node.recurringBiasCount} recurring bias${node.recurringBiasCount === 1 ? '' : 'es'}`}
          />
        )}
        {node.documentCount > 0 && (
          <Chip
            icon={<FileText size={11} />}
            color="var(--text-muted)"
            label={`${node.analyzedDocCount}/${node.documentCount} analyzed`}
          />
        )}
      </div>

      {/* Decision frame */}
      {node.decisionFrame && (
        <p
          style={{
            fontSize: 'var(--fs-xs)',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            margin: '0 0 12px 0',
            padding: 8,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-secondary)',
            borderLeft: '2px solid var(--border-color)',
          }}
        >
          {node.decisionFrame}
        </p>
      )}

      {/* Cognitive lineage chips */}
      {(outboundLinkCount > 0 || inboundLinkCount > 0) && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            fontSize: 'var(--fs-3xs)',
            color: 'var(--text-muted)',
            marginBottom: 12,
            paddingTop: 8,
            borderTop: '1px solid var(--border-color)',
          }}
        >
          {outboundLinkCount > 0 && (
            <span>
              <strong style={{ color: 'var(--text-secondary)' }}>{outboundLinkCount}</strong>{' '}
              outbound link{outboundLinkCount === 1 ? '' : 's'}
            </span>
          )}
          {inboundLinkCount > 0 && (
            <span>
              <strong style={{ color: 'var(--text-secondary)' }}>{inboundLinkCount}</strong> inbound
              link{inboundLinkCount === 1 ? '' : 's'}
            </span>
          )}
        </div>
      )}

      {/* Open decision → */}
      <Link
        href={`/dashboard/decisions/${node.id}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 'var(--fs-xs)',
          color: 'var(--accent-primary)',
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Open decision <ChevronRight size={12} />
      </Link>
    </div>
  );
}

function Chip({ icon, color, label }: { icon?: React.ReactNode; color: string; label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 6px',
        borderRadius: 'var(--radius-sm)',
        background: severityTint(color, 8),
        color,
        fontSize: 'var(--fs-3xs)',
        fontWeight: 600,
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
      }}
    >
      {icon}
      {label}
    </span>
  );
}
