/**
 * String utilities — single source of truth for the `truncate` helper
 * that was previously copied in 4 PDF/export generators
 * (board-report-generator, decision-provenance-record-generator,
 * positioning-cheatsheet, BoardReportView). Consolidated 2026-04-27
 * during the slop-scan Phase 3 dedup.
 */

/** Truncate a string to `max` characters, trimming whitespace and
 *  appending an ellipsis when truncation occurs. Empty input returns
 *  empty string. Non-truncated input is returned trimmed. */
export function truncate(text: string, max: number): string {
  if (!text) return '';
  const clean = text.trim();
  return clean.length > max ? clean.slice(0, max - 1).trimEnd() + '…' : clean;
}
