'use client';

import { type ReactNode } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react';
import { dqiColorFor, gradeFromScore } from '@/lib/utils/grade';

/**
 * VerdictBand — the canonical top-of-page verdict pattern (DESIGN.md
 * persona-validated layout, locked 2026-05-01).
 *
 * Replaces the prior 4-tile metric grid + page-header chip row + scattered
 * status indicators on every detail page (document, decision package, deal)
 * with a single coherent card carrying:
 *
 *   Row 1 (primary):  artefact title  ·  category  ·  DQI/grade  ·  exposure
 *   Row 2 (status):   conflict count  ·  status pill  ·  author calibration
 *   Row 3 (audit):    SHA-256 · methodology version · audit log →  [Export DPR]
 *
 * All four buyer personas (Margaret / Adaeze / Richard / James) converged
 * on this anatomy as the FIRST thing they want above the fold. The three
 * rows respectively answer:
 *
 *   "what is this and is it good?"  (Margaret + Richard's verdict-in-3s)
 *   "is it deal-killing?"            (Richard's conflict + status)
 *   "is it audit-grade?"             (James's tamper-evidence + DPR)
 */

export type VerdictStatus =
  | 'pending' // analysis still running
  | 'proceed' // DQI ≥ 70 / no conflicts / IC-ready
  | 'modify' // DQI 55-69 OR minor conflicts — needs revision
  | 'hold' // DQI < 55 OR critical conflicts — kill / pause
  | 'unknown'; // analysis missing / not started

const STATUS_LABEL: Record<VerdictStatus, string> = {
  pending: 'Audit running',
  proceed: 'Proceed',
  modify: 'Needs revision',
  hold: 'Hold',
  unknown: 'Pending audit',
};

const STATUS_BG: Record<VerdictStatus, string> = {
  pending: 'color-mix(in srgb, var(--info) 12%, transparent)',
  proceed: 'color-mix(in srgb, var(--success) 14%, transparent)',
  modify: 'color-mix(in srgb, var(--warning) 14%, transparent)',
  hold: 'color-mix(in srgb, var(--error) 14%, transparent)',
  unknown: 'var(--bg-secondary)',
};

const STATUS_FG: Record<VerdictStatus, string> = {
  pending: 'var(--info)',
  proceed: 'var(--success)',
  modify: 'var(--warning)',
  hold: 'var(--error)',
  unknown: 'var(--text-muted)',
};

const STATUS_ICON: Record<VerdictStatus, LucideIcon> = {
  pending: CircleDashed,
  proceed: CheckCircle2,
  modify: AlertTriangle,
  hold: AlertTriangle,
  unknown: CircleDashed,
};

/** Auto-derive a status from DQI score + conflict count. The caller can
 *  still override by passing `status` directly. */
function deriveStatus(
  dqiScore: number | null | undefined,
  conflictCount: number | undefined,
  isPending: boolean
): VerdictStatus {
  if (isPending) return 'pending';
  if (dqiScore == null) return 'unknown';
  // Critical conflicts always escalate to hold regardless of score.
  if ((conflictCount ?? 0) >= 3 && dqiScore < 70) return 'hold';
  if (dqiScore >= 70) return 'proceed';
  if (dqiScore >= 55) return 'modify';
  return 'hold';
}

export interface VerdictBandProps {
  /** Artefact title — usually the memo title (NOT the auto-generated paste-…-Z.txt
   *  filename). Caller is responsible for picking the cleanest available name. */
  title: ReactNode;
  /** Auto-detected category like "Strategic Memo · M&A" or "IC Memo · Pan-African". */
  category?: string;
  /** Eyebrow before the title. Defaults to category-derived. */
  eyebrow?: string;
  /** DQI score 0-100. Null when the audit is missing / not yet completed. */
  dqiScore?: number | null;
  /** True when the audit is currently running — replaces score with a pending state. */
  isPending?: boolean;
  /** Optional dollar exposure, e.g. £600M decision value. */
  exposure?: { amount: number; currency: string; label?: string };
  /** Cross-document conflict count (deal-context only). Renders a red badge if > 0. */
  conflictCount?: number;
  /** Click handler for the conflicts badge — opens the cross-ref panel. */
  onConflictClick?: () => void;
  /** Verdict status. If omitted, derives from dqiScore + conflictCount. */
  status?: VerdictStatus;
  /** Override the status pill label (for IC-context: "IC-ready", "Hold for review"). */
  statusLabel?: string;
  /** Optional author calibration line — Margaret persona ask. */
  authorCalibration?: ReactNode;
  /** Document SHA-256 (or first 8-12 hex chars) — James persona ask. */
  documentHash?: string;
  /** Methodology version stamp. Defaults to v2.1.0 if not provided. */
  methodologyVersion?: string;
  /** Audit log link href — opens the immutable event log filtered to this artefact. */
  auditLogHref?: string;
  /** Primary CTA — usually "Export DPR PDF". Right-aligned on row 3. */
  primaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
    icon?: LucideIcon;
    pending?: boolean;
  };
  /** Optional badges that render INSIDE row 1 next to title — sample badge,
   *  visibility pill, legal hold chip, etc. */
  badges?: ReactNode;
  /** Stable id for testing / anchor scroll. */
  id?: string;
}

export function VerdictBand({
  title,
  category,
  eyebrow,
  dqiScore,
  isPending = false,
  exposure,
  conflictCount,
  onConflictClick,
  status,
  statusLabel,
  authorCalibration,
  documentHash,
  methodologyVersion = 'v2.1.0',
  auditLogHref,
  primaryAction,
  badges,
  id,
}: VerdictBandProps) {
  const resolvedStatus = status ?? deriveStatus(dqiScore, conflictCount, isPending);
  const StatusIcon = STATUS_ICON[resolvedStatus];
  const showScore = dqiScore != null && !isPending;
  const grade = showScore ? gradeFromScore(dqiScore!) : null;
  const scoreColor = showScore ? dqiColorFor(dqiScore!) : 'var(--text-muted)';

  const formattedExposure =
    exposure && Number.isFinite(exposure.amount)
      ? `${exposure.currency}${formatExposure(exposure.amount)}`
      : null;

  const truncatedHash = documentHash
    ? `${documentHash.slice(0, 12)}${documentHash.length > 12 ? '…' : ''}`
    : null;

  return (
    <section
      id={id}
      aria-label="Audit verdict"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xl)',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Row 1 — eyebrow + title + score + exposure */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {(eyebrow || category) && (
          <div
            style={{
              fontSize: 'var(--fs-3xs)',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            {eyebrow ?? category}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
              minWidth: 0,
              flex: 1,
            }}
          >
            <h1
              style={{
                fontSize: 'var(--fs-page-h1-platform)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                color: 'var(--text-primary)',
                margin: 0,
                overflowWrap: 'anywhere',
              }}
            >
              {title}
            </h1>
            {badges}
          </div>

          {/* Right cluster: DQI score + grade + exposure */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 14,
              flexWrap: 'wrap',
            }}
          >
            {showScore && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: 2,
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--fs-3xs)',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  Decision Quality
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'baseline',
                    gap: 8,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                  }}
                >
                  <span style={{ fontSize: 36, color: scoreColor, lineHeight: 1 }}>
                    {Math.round(dqiScore!)}
                  </span>
                  <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>
                    /100
                  </span>
                  {grade && (
                    <span
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: scoreColor,
                        marginLeft: 2,
                      }}
                    >
                      · {grade}
                    </span>
                  )}
                </span>
              </div>
            )}

            {!showScore && (
              <span
                style={{
                  fontSize: 'var(--fs-sm)',
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                }}
              >
                {isPending ? 'Audit running…' : 'No audit yet'}
              </span>
            )}

            {formattedExposure && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: 2,
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--fs-3xs)',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  {exposure?.label ?? 'Exposure'}
                </span>
                <span
                  style={{
                    fontSize: 'var(--fs-md)',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  {formattedExposure}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2 — status pill + conflicts + author calibration */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 'var(--radius-full)',
            background: STATUS_BG[resolvedStatus],
            color: STATUS_FG[resolvedStatus],
            fontSize: 'var(--fs-xs)',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          <StatusIcon size={12} aria-hidden />
          {statusLabel ?? STATUS_LABEL[resolvedStatus]}
        </span>

        {conflictCount != null && conflictCount > 0 && (
          <button
            type="button"
            onClick={onConflictClick}
            disabled={!onConflictClick}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'color-mix(in srgb, var(--error) 12%, transparent)',
              color: 'var(--error)',
              fontSize: 'var(--fs-xs)',
              fontWeight: 600,
              border: '1px solid color-mix(in srgb, var(--error) 30%, transparent)',
              cursor: onConflictClick ? 'pointer' : 'default',
            }}
            title={onConflictClick ? 'Open cross-document conflicts panel' : undefined}
          >
            <AlertTriangle size={12} aria-hidden />
            {conflictCount} cross-doc conflict{conflictCount === 1 ? '' : 's'}
          </button>
        )}

        {conflictCount === 0 && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'color-mix(in srgb, var(--success) 10%, transparent)',
              color: 'var(--success)',
              fontSize: 'var(--fs-xs)',
              fontWeight: 600,
              border: '1px solid color-mix(in srgb, var(--success) 25%, transparent)',
            }}
          >
            <CheckCircle2 size={12} aria-hidden />
            No cross-doc conflicts
          </span>
        )}

        {authorCalibration && (
          <span
            style={{
              fontSize: 'var(--fs-xs)',
              color: 'var(--text-muted)',
            }}
          >
            {authorCalibration}
          </span>
        )}
      </div>

      {/* Row 3 — audit metadata + primary action */}
      {(documentHash || methodologyVersion || auditLogHref || primaryAction) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
            paddingTop: 12,
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 'var(--fs-3xs)',
              color: 'var(--text-muted)',
              letterSpacing: 0,
            }}
          >
            {truncatedHash && (
              <span title={`SHA-256 input hash: ${documentHash}`}>
                <span style={{ opacity: 0.7 }}>SHA-256 </span>
                {truncatedHash}
              </span>
            )}
            {methodologyVersion && (
              <span>
                <span style={{ opacity: 0.7 }}>methodology </span>
                {methodologyVersion}
              </span>
            )}
            {auditLogHref && (
              <a
                href={auditLogHref}
                style={{
                  color: 'var(--accent-secondary)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                audit log
                <ExternalLink size={10} aria-hidden />
              </a>
            )}
          </div>

          {primaryAction &&
            (primaryAction.href ? (
              <a
                href={primaryAction.href}
                onClick={primaryAction.onClick}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  background: primaryAction.pending
                    ? 'var(--bg-secondary)'
                    : 'var(--accent-primary)',
                  color: primaryAction.pending ? 'var(--text-muted)' : '#fff',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--fs-sm)',
                  fontWeight: 600,
                  textDecoration: 'none',
                  pointerEvents: primaryAction.pending ? 'none' : 'auto',
                }}
              >
                {primaryAction.icon && <primaryAction.icon size={14} aria-hidden />}
                {primaryAction.pending ? 'Generating…' : primaryAction.label}
              </a>
            ) : (
              <button
                type="button"
                onClick={primaryAction.onClick}
                disabled={primaryAction.pending}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  background: primaryAction.pending
                    ? 'var(--bg-secondary)'
                    : 'var(--accent-primary)',
                  color: primaryAction.pending ? 'var(--text-muted)' : '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--fs-sm)',
                  fontWeight: 600,
                  cursor: primaryAction.pending ? 'wait' : 'pointer',
                }}
              >
                {primaryAction.icon && <primaryAction.icon size={14} aria-hidden />}
                {primaryAction.pending ? 'Generating…' : primaryAction.label}
              </button>
            ))}
        </div>
      )}
    </section>
  );
}

// ── helpers ──────────────────────────────────────────────────────────

function formatExposure(amount: number): string {
  // Compact monetary formatter: 600M / 1.2B / 25K
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(abs >= 10_000_000_000 ? 0 : 1)}B`;
  if (abs >= 1_000_000) return `${(amount / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${(amount / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`;
  return amount.toFixed(0);
}
