/**
 * Severity → color helper.
 *
 * Single source of truth for "severity string → CSS variable" mapping
 * used across the platform UI. Wraps the canonical `SEVERITY_COLORS`
 * map in `@/lib/constants/human-audit` so platform surfaces don't
 * re-implement the lookup with hardcoded hex (which then drifts when
 * the design tokens shift).
 *
 * Rule of thumb:
 *   - Platform surfaces (everything under /dashboard, /documents, etc.)
 *     should call `severityColor()` from this module.
 *   - Marketing surfaces (under (marketing) route group) intentionally
 *     use literal hex per the marketing palette discipline (CLAUDE.md
 *     "marketing surfaces with hardcoded palettes should call
 *     gradeMetaFromScore(score).color").
 *
 * Locked 2026-05-09 evening — Tier 1.2 of the hygiene cascade.
 */

import { SEVERITY_COLORS } from '@/lib/constants/human-audit';

/**
 * Return the severity-color CSS variable expression for a given
 * severity string. Unknown severities (and `undefined` / `null`) fall
 * through to a muted text token rather than throwing.
 *
 * Examples:
 *   severityColor('critical') → 'var(--severity-critical)'
 *   severityColor('high')     → 'var(--severity-high)'
 *   severityColor(undefined)  → 'var(--text-muted)'
 */
export function severityColor(severity: string | null | undefined): string {
  if (!severity) return 'var(--text-muted)';
  const key = severity.toLowerCase();
  return SEVERITY_COLORS[key] ?? 'var(--text-muted)';
}
