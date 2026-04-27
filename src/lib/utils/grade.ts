/**
 * Grade helpers — single source of truth for "score → grade" conversions.
 *
 * Canonical thresholds live in [src/lib/scoring/dqi.ts](../scoring/dqi.ts)
 * GRADE_THRESHOLDS. CLAUDE.md "DQI Grade Boundaries (locked)" specifies:
 *   A 85+, B 70+, C 55+, D 40+, F 0+.
 *
 * Drift in helper copies is a real bug — `quick-score.ts:scoreToGrade`
 * had drifted to 90/70/50/30 (caught 2026-04-27 during slop-scan
 * Phase 3 dedup). This module is now the only place a UI / route
 * should call to convert a score to a grade letter, color, or
 * structured meta object.
 */

import { GRADE_THRESHOLDS } from '@/lib/scoring/dqi';

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

/** Convert a 0-100 score to its grade letter using the canonical
 *  thresholds. Always returns 'F' for scores below 0 or NaN. */
export function gradeFromScore(score: number): Grade {
  if (typeof score !== 'number' || !Number.isFinite(score)) return 'F';
  for (const t of GRADE_THRESHOLDS) {
    if (score >= t.min) return t.grade;
  }
  return 'F';
}

/** Full grade meta record (letter + color + label + min threshold).
 *  Useful when the caller needs to render multiple meta fields. */
export function gradeMetaFromScore(score: number): (typeof GRADE_THRESHOLDS)[number] {
  if (typeof score !== 'number' || !Number.isFinite(score)) {
    return GRADE_THRESHOLDS[GRADE_THRESHOLDS.length - 1];
  }
  for (const t of GRADE_THRESHOLDS) {
    if (score >= t.min) return t;
  }
  return GRADE_THRESHOLDS[GRADE_THRESHOLDS.length - 1];
}

/** CSS variable–first color helper for rendering DQI scores in platform UI.
 *  Uses CSS variables with hex fallbacks so it renders in both Storybook
 *  contexts and live theme. Marketing surfaces with hardcoded palettes
 *  should call `gradeMetaFromScore(score).color` to get the hex directly. */
export function dqiColorFor(score: number): string {
  if (score >= 85) return 'var(--success, #10b981)';
  if (score >= 70) return 'var(--accent-primary, #16A34A)';
  if (score >= 55) return 'var(--warning, #d97706)';
  if (score >= 40) return 'var(--severity-high, #ef4444)';
  return 'var(--severity-critical, #b91c1c)';
}
