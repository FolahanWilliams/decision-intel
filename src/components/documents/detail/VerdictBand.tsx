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
  Archive,
  UserCheck,
} from 'lucide-react';
import { gradeMetaFromScore } from '@/lib/utils/grade';
import { METHODOLOGY_VERSION } from '@/lib/scoring/dqi';
import { useAnalysisInsights } from '@/hooks/useAnalysisInsights';
import { usePlanLabels } from '@/hooks/usePlanLabels';

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
  /** Document upload timestamp (ISO). Drives the retention countdown
   *  chip on the monospace strip (J.2 lock 2026-05-08, James persona
   *  "retained until YYYY-MM-DD per Enterprise plan" ask). Plan tier
   *  comes from usePlanLabels() so the surface stays in lockstep with
   *  the canonical AUDIT_LOG_RETENTION_TIERS in trust-copy.ts. */
  uploadedAt?: string | null;
  /** Analysis id — when supplied, the band fetches /api/analysis/[id]/
   *  insights (deduped via useAnalysisInsights) and renders the author-
   *  calibration chip from feedbackAdequacy in the top row (M.2 lock
   *  2026-05-08, Margaret persona "SVP has authored 4 prior memos in
   *  this domain; 1 outcome logged; Brier 0.31" ask). */
  analysisId?: string | null;
}

// J.2 lock 2026-05-08 — retention window in YEARS keyed by plan tier.
// Mirrors AUDIT_LOG_RETENTION_TIERS in @/lib/constants/trust-copy.ts.
// Free is treated as the Individual floor (1y) since the Free user is
// the same buyer-class as Individual; the retention contract on /trust
// is the floor a procurement reader checks against. Edit trust-copy.ts
// FIRST when the contract changes; this map mirrors it.
const RETENTION_YEARS_BY_PLAN: Record<string, number> = {
  free: 1,
  pro: 1,
  team: 3,
  enterprise: 7,
};
const RETENTION_LABEL_BY_PLAN: Record<string, string> = {
  free: 'Individual floor',
  pro: 'Individual plan',
  team: 'Strategy plan',
  enterprise: 'Enterprise plan',
};

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

// J.2 — compute the retention end date from uploadedAt + plan years.
// Returns the ISO yyyy-mm-dd suffix and a plan label for the chip.
function computeRetention(
  uploadedAt: string | null | undefined,
  plan: string,
  planLoading: boolean
): { until: string; planLabel: string } | null {
  if (!uploadedAt || planLoading) return null;
  const years = RETENTION_YEARS_BY_PLAN[plan] ?? 1;
  const start = new Date(uploadedAt);
  if (!Number.isFinite(start.getTime())) return null;
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + years);
  const iso = end.toISOString().slice(0, 10);
  return { until: iso, planLabel: RETENTION_LABEL_BY_PLAN[plan] ?? 'Individual floor' };
}

// M.2 — render copy for the author-calibration chip. Returns null when
// feedbackAdequacy is in the cold-start band so the band doesn't surface
// "0 outcomes" as a finding (cold-start IS surfaced via PaperApplicationsCard
// SignalBlock — the chip is the procurement-grade earned-confidence signal,
// not the cold-start signal).
function buildAuthorCalibrationCopy(
  fa:
    | {
        verdict: 'adequate' | 'sparse' | 'cold_start' | 'unknown';
        closedOutcomes: number;
        recentClosedOutcomes: number;
        meanBrier: number | null;
        domainMatchCount: number | null;
        domainHint: string | null;
      }
    | null
    | undefined
): { label: string; tooltip: string; color: string } | null {
  if (!fa) return null;
  if (fa.verdict === 'unknown') return null;
  if (fa.closedOutcomes === 0) return null;

  const brierFragment =
    fa.meanBrier !== null && Number.isFinite(fa.meanBrier)
      ? ` · Brier ${fa.meanBrier.toFixed(2)}`
      : '';
  const domainFragment =
    fa.domainMatchCount !== null && fa.domainHint
      ? ` (${fa.domainMatchCount} in domain)`
      : '';
  const memoWord = fa.closedOutcomes === 1 ? 'memo' : 'memos';
  const label = `Author · ${fa.closedOutcomes} prior ${memoWord} closed${domainFragment}${brierFragment}`;
  const tooltipBase =
    fa.verdict === 'adequate'
      ? 'Calibrated track record per Kahneman & Klein 2009 second condition'
      : fa.verdict === 'sparse'
        ? 'Sparse track record — closed-loop calibration is partial'
        : 'Cold-start author — limited closed-loop history';
  const tooltip =
    `${tooltipBase}. ${fa.closedOutcomes} closed outcomes total, ${fa.recentClosedOutcomes} in last 18mo` +
    (fa.meanBrier !== null ? `, mean Brier ${fa.meanBrier.toFixed(3)}.` : '.');
  const color =
    fa.verdict === 'adequate'
      ? 'var(--success)'
      : fa.verdict === 'sparse'
        ? 'var(--warning)'
        : 'var(--text-muted)';
  return { label, tooltip, color };
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
  uploadedAt,
  analysisId,
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

  // J.2 — retention countdown chip. usePlanLabels() reads /api/billing
  // (deduped by its own internal cache), so the same fetch covers any
  // other plan-aware surface on the page.
  const { plan, isLoading: planLoading } = usePlanLabels();
  const retention = computeRetention(uploadedAt, plan, planLoading);

  // M.2 — author-calibration chip. useAnalysisInsights deduplicates the
  // /api/analysis/[id]/insights fetch with PaperApplicationsCard so the
  // page only hits the endpoint once. Renders null until the fetch
  // resolves, and null again when the author has no closed outcomes —
  // the chip is the earned-confidence signal, not the cold-start signal.
  const insights = useAnalysisInsights(analysisId);
  const authorCopy = buildAuthorCalibrationCopy(insights.data?.feedbackAdequacy);

  // Conflict chip — only renders when the document has cross-doc
  // conflicts attached. Color rule mirrors DealKanban + deal-page chip.
  const showConflictChip = conflictCount > 0;
  const conflictColor =
    highCount > 0 ? 'var(--error)' : conflictCount >= 3 ? 'var(--warning)' : 'var(--info)';

  // The meta-judge verdict is render-suppressed when missing or when the
  // pipeline emitted the "all clear" sentinel (mirrors MetaVerdictPanel).
  const hasInlineVerdict =
    !!metaVerdict &&
    metaVerdict !== 'No significant adversarial points detected; proposal cleared baseline checks.';
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

        {/* M.2 — author calibration chip. Procurement-grade earned-
            confidence signal anchored in Kahneman & Klein 2009 second
            condition. Renders only when feedbackAdequacy reports ≥1
            closed outcome. */}
        {authorCopy && (
          <span
            title={authorCopy.tooltip}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 700,
              color: authorCopy.color,
              background: `color-mix(in srgb, ${authorCopy.color} 12%, transparent)`,
              border: `1px solid ${authorCopy.color}`,
              padding: '3px 9px',
              borderRadius: 999,
              letterSpacing: '0.04em',
            }}
          >
            <UserCheck size={11} strokeWidth={2.25} aria-hidden />
            {authorCopy.label}
          </span>
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
              {verdictExpanded || !verdictNeedsTruncation ? metaVerdict : `${verdictPreview}…`}
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
        {/* J.2 — retention countdown chip. Reads from
            AUDIT_LOG_RETENTION_TIERS (mirrored in RETENTION_YEARS_BY_PLAN
            above). Stays in the monospace strip so it reads as
            procurement-grade evidence (James persona ask), not
            UI-decoration. */}
        {retention && (
          <>
            <span style={{ color: 'var(--border-color)' }} aria-hidden>
              ·
            </span>
            <span
              title={`Audit log + DPR retained until ${retention.until} on the ${retention.planLabel} retention window. Custom retention (HIPAA / banking / government) negotiable on Enterprise pilot agreement.`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <Archive size={11} strokeWidth={2} aria-hidden />
              retained until {retention.until}
            </span>
          </>
        )}
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
