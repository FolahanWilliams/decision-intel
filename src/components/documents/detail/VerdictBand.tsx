'use client';

/**
 * VerdictBand — the persona-validated above-fold verdict surface for the
 * document-detail page. Item 1 lock 2026-05-07.
 *
 * Per DESIGN.md persona-validated layout direction (universal points
 * #1 + #2): all four buyer personas (Margaret / Adaeze / Richard /
 * James) converged on a single horizontal verdict band as the FIRST
 * thing on the page, replacing the 4-tile metric row entirely.
 *
 * The shell header above this card carries memo title + DqiPill +
 * classification + DPR export CTA. The VerdictBand augments those with:
 *   - Status pill (AUDIT-READY / NEEDS REVISION / REVISE BEFORE BOARD)
 *     derived from the canonical grade thresholds.
 *   - Adversarial-analysis sentence (meta-judge verdict) — the highest-
 *     leverage single line on the audit, when present.
 *   - Cross-doc conflict count chip when the document is part of a deal
 *     (Richard persona's "second metric after DQI" ask, mirrored from the
 *     deal page header chip + DealKanban card per Item 4).
 *   - Monospace audit metadata strip — SHA-256 prefix + methodology
 *     version + last-audited timestamp + audit-log link (James persona's
 *     "FIRST-orientation content, not small footer info" ask).
 *
 * Mounted directly above the tab bar in the document-detail right pane.
 * Followed by RemediationChecklist (Top-3 Fix Tiles) and
 * PaperApplicationsCard (R²F Signal Strip) before the tab bar; below the
 * tab bar lives the existing 5-tab body. This is the locked above-fold
 * order from DESIGN.md §"The locked above-fold structure".
 */

import { useState } from 'react';
import {
  Swords,
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
import { gradeMetaFromScore } from '@/lib/utils/grade';
import { METHODOLOGY_VERSION } from '@/lib/scoring/dqi';

interface VerdictBandProps {
  /** Canonical DQI score (0-100). Required because the verdict band is
   *  only rendered when an audit exists. */
  overallScore: number;
  /** Adversarial-analysis sentence from the meta-judge node. When present
   *  and not the placeholder "no significant adversarial points
   *  detected" string, surfaces inline as the highest-leverage line. */
  metaVerdict?: string | null;
  /** SHA-256 prefix of the original document content. Hashing is the
   *  load-bearing tamper-evidence signal — surfaced verbatim per James
   *  persona ask. Render the first 12 chars + ellipsis for compactness. */
  contentHash?: string | null;
  /** When this document is part of a deal, the cross-doc conflict count
   *  rendered as a click-through chip. Mirrors the Item 4 chip from
   *  DealKanban + the deal page header. */
  crossDocConflictCount?: number | null;
  /** High + critical severity subset of `crossDocConflictCount`. Drives
   *  chip color: red when > 0, amber when ≥3 conflicts but no high,
   *  info-blue otherwise. */
  crossDocHighSeverityCount?: number | null;
  /** Optional deep link target for the conflict chip — typically the
   *  parent deal's detail page. */
  conflictHref?: string | null;
  /** Audit timestamp (ISO string) used for the "audited X days ago"
   *  copy in the monospace footer. */
  auditedAt?: string | null;
  /** Document id, used for the audit-log deep link. */
  documentId?: string | null;
}

/**
 * Status pill semantics — derived from grade letter + presence of high
 * severity cross-doc conflicts. Margaret + Richard expect this as the
 * first read; the language is procurement-grade ("audit-ready" vs
 * "needs revision" reads enterprise; "passed" vs "failed" reads SaaS).
 */
function deriveStatus(
  grade: 'A' | 'B' | 'C' | 'D' | 'F',
  highSeverityConflicts: number
): { label: string; color: string; icon: typeof ShieldCheck } {
  // Any high/critical cross-doc conflict overrides the grade-based label.
  if (highSeverityConflicts > 0) {
    return { label: 'Revise before board', color: 'var(--error)', icon: AlertOctagon };
  }
  if (grade === 'A' || grade === 'B') {
    return { label: 'Audit-ready', color: 'var(--success)', icon: ShieldCheck };
  }
  if (grade === 'C') {
    return { label: 'Needs revision', color: 'var(--warning)', icon: AlertTriangle };
  }
  return { label: 'Revise before board', color: 'var(--error)', icon: AlertOctagon };
}

function formatRelativeDays(iso: string | null | undefined, mountTime: number): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return null;
  const days = Math.floor((mountTime - then) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'audited today';
  if (days === 1) return 'audited yesterday';
  if (days < 30) return `audited ${days}d ago`;
  if (days < 365) return `audited ${Math.round(days / 30)}mo ago`;
  return `audited ${Math.round(days / 365)}y ago`;
}

export function VerdictBand({
  overallScore,
  metaVerdict,
  contentHash,
  crossDocConflictCount,
  crossDocHighSeverityCount,
  conflictHref,
  auditedAt,
  documentId,
}: VerdictBandProps) {
  // Capture mount-time so relative-time copy stays pure across renders
  // (per react-hooks/purity — Date.now() in render is flagged).
  const [mountTime] = useState(() => Date.now());
  const [verdictExpanded, setVerdictExpanded] = useState(false);

  const gradeMeta = gradeMetaFromScore(overallScore);
  const conflictCount = crossDocConflictCount ?? 0;
  const highCount = crossDocHighSeverityCount ?? 0;
  const status = deriveStatus(gradeMeta.grade, highCount);
  const StatusIcon = status.icon;

  const auditedRelative = formatRelativeDays(auditedAt, mountTime);

  // Conflict chip — only renders when the document has cross-doc
  // conflicts attached. Color rule mirrors DealKanban + deal-page chip.
  const showConflictChip = conflictCount > 0;
  const conflictColor =
    highCount > 0
      ? 'var(--error)'
      : conflictCount >= 3
        ? 'var(--warning)'
        : 'var(--info)';

  // The meta-judge verdict is render-suppressed when missing or when the
  // pipeline emitted the "all clear" sentinel (mirrors MetaVerdictPanel).
  const hasInlineVerdict =
    !!metaVerdict &&
    metaVerdict !==
      'No significant adversarial points detected; proposal cleared baseline checks.';
  const verdictPreview = hasInlineVerdict ? metaVerdict!.slice(0, 200) : '';
  const verdictNeedsTruncation = hasInlineVerdict && (metaVerdict?.length ?? 0) > 200;

  return (
    <section
      aria-label="Audit verdict"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${status.color}`,
        borderRadius: 'var(--radius-md, 8px)',
        padding: '14px 16px',
        marginBottom: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Top row — status pill + cross-doc conflict chip + auditedAt */}
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
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: status.color,
            background: `color-mix(in srgb, ${status.color} 12%, transparent)`,
            border: `1px solid ${status.color}`,
            padding: '4px 10px',
            borderRadius: 999,
          }}
        >
          <StatusIcon size={12} strokeWidth={2.5} aria-hidden />
          {status.label}
        </span>

        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            letterSpacing: '-0.005em',
          }}
        >
          {gradeMeta.label}
        </span>

        {showConflictChip && (
          <ConflictChip
            count={conflictCount}
            highCount={highCount}
            color={conflictColor}
            href={conflictHref ?? null}
          />
        )}

        <span style={{ flex: 1 }} />

        {auditedRelative && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              color: 'var(--text-muted)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <Clock size={11} strokeWidth={2} aria-hidden />
            {auditedRelative}
          </span>
        )}
      </div>

      {/* Adversarial-analysis sentence (meta-judge verdict) — collapsible */}
      {hasInlineVerdict && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => verdictNeedsTruncation && setVerdictExpanded(v => !v)}
          onKeyDown={e => {
            if ((e.key === 'Enter' || e.key === ' ') && verdictNeedsTruncation) {
              e.preventDefault();
              setVerdictExpanded(v => !v);
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: '10px 12px',
            background: 'color-mix(in srgb, var(--warning) 6%, transparent)',
            border: '1px solid color-mix(in srgb, var(--warning) 25%, var(--border-color))',
            borderRadius: 'var(--radius-sm, 6px)',
            cursor: verdictNeedsTruncation ? 'pointer' : 'default',
          }}
        >
          <Swords
            size={14}
            strokeWidth={2.25}
            style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }}
            aria-hidden
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--warning)',
                marginBottom: 4,
              }}
            >
              Meta-judge · adversarial analysis
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                lineHeight: 1.55,
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {verdictExpanded || !verdictNeedsTruncation
                ? metaVerdict
                : `${verdictPreview}…`}
            </p>
          </div>
          {verdictNeedsTruncation && (
            <span
              style={{
                color: 'var(--text-muted)',
                marginTop: 2,
                flexShrink: 0,
              }}
              aria-hidden
            >
              {verdictExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          )}
        </div>
      )}

      {/* Audit metadata strip — monospace, James persona's first-orientation
          content. Renders SHA-256 prefix + methodology version + audit
          log deep link. Stays inside the verdict band so it reads as
          procurement-grade evidence, not buried-in-settings noise. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '8px 12px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-sm, 6px)',
          fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
          fontSize: 11,
          color: 'var(--text-muted)',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Hash size={11} strokeWidth={2} aria-hidden />
          {contentHash ? `${contentHash.slice(0, 12)}…` : 'sha256: —'}
        </span>
        <span style={{ color: 'var(--border-color)' }} aria-hidden>
          ·
        </span>
        <span>methodology v{METHODOLOGY_VERSION}</span>
        {documentId && (
          <>
            <span style={{ color: 'var(--border-color)' }} aria-hidden>
              ·
            </span>
            <a
              href={`/dashboard/admin/audit-log?documentId=${documentId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                color: 'var(--accent-primary)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              audit log
              <ExternalLink size={9} strokeWidth={2.25} aria-hidden />
            </a>
          </>
        )}
      </div>
    </section>
  );
}

function ConflictChip({
  count,
  highCount,
  color,
  href,
}: {
  count: number;
  highCount: number;
  color: string;
  href: string | null;
}) {
  const label = `${count} cross-doc conflict${count !== 1 ? 's' : ''}${
    highCount > 0 ? ` · ${highCount} high` : ''
  }`;
  const title =
    highCount > 0
      ? `${count} cross-doc conflict${count !== 1 ? 's' : ''} flagged · ${highCount} at high or critical severity`
      : `${count} cross-doc conflict${count !== 1 ? 's' : ''} flagged across analyzed documents in this deal`;
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 11,
    fontWeight: 700,
    color,
    background: `color-mix(in srgb, ${color} 12%, transparent)`,
    border: `1px solid ${color}`,
    padding: '3px 9px',
    borderRadius: 999,
    letterSpacing: '0.04em',
    textDecoration: 'none',
  };
  if (href) {
    return (
      <a href={href} title={title} style={baseStyle}>
        <GitCompareArrows size={11} strokeWidth={2.25} aria-hidden />
        {label}
      </a>
    );
  }
  return (
    <span title={title} style={baseStyle}>
      <GitCompareArrows size={11} strokeWidth={2.25} aria-hidden />
      {label}
    </span>
  );
}
