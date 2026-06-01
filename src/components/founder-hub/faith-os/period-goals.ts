/**
 * Faith OS period goals — weekly + quarterly cascade keys + helpers (2026-06-01).
 *
 * Pure, deterministic, no I/O. The Rule of 3 is a hierarchy: a few quarter
 * "rocks" → a few weekly intentions → the day's three. This module computes the
 * stable period KEYS the daily three ladder up to, plus the labels the UI
 * renders. Weeks use the Sunday-week convention already used across the app
 * (FaithOSTab.weekStartISO / FounderOsWeeklyReview), so a week key is just its
 * Sunday-start ISO date — unambiguous + timezone-safe (a plain calendar key,
 * never re-localised).
 */

import { shiftIsoDate } from './daily-three';
import { PERIOD_GOAL_MAX } from './content';

export type GoalPeriod = 'week' | 'quarter';

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** 0 = Sunday … 6 = Saturday, from a YYYY-MM-DD string (UTC-noon, DST-safe). */
function dayOfWeek(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12)).getUTCDay();
}

/** The Sunday that starts the week containing `iso`, as a YYYY-MM-DD string. */
export function weekStartIso(iso: string): string {
  return shiftIsoDate(iso, -dayOfWeek(iso));
}

/** Stable week key = the week-start Sunday ISO date (e.g. "2026-05-31"). */
export function weekKeyFor(iso: string): string {
  return weekStartIso(iso);
}

/** Stable quarter key, e.g. "2026-Q2". */
export function quarterKeyFor(iso: string): string {
  const [y, m] = iso.split('-').map(Number);
  const q = Math.floor(((m ?? 1) - 1) / 3) + 1;
  return `${y}-Q${q}`;
}

export function periodKeyFor(period: GoalPeriod, iso: string): string {
  return period === 'week' ? weekKeyFor(iso) : quarterKeyFor(iso);
}

/** Human label for a week key (the Sunday ISO date) → "Week of May 31". */
export function weekLabel(key: string): string {
  const [, m, d] = key.split('-').map(Number);
  if (!m || !d) return 'This week';
  return `Week of ${MONTH_NAMES[m - 1]} ${d}`;
}

/** Human label for a quarter key "2026-Q2" → "Q2 2026". */
export function quarterLabel(key: string): string {
  const [y, q] = key.split('-Q');
  return q ? `Q${q} ${y}` : 'This quarter';
}

export function periodLabel(period: GoalPeriod, key: string): string {
  return period === 'week' ? weekLabel(key) : quarterLabel(key);
}

export type PeriodGoalStatus = 'open' | 'done' | 'carried' | 'released';

/** Statuses that count as a live commitment against the cap of three. */
export function isActivePeriodStatus(status: PeriodGoalStatus): boolean {
  return status === 'open' || status === 'done';
}

export interface PeriodGoalLite {
  status: PeriodGoalStatus;
}

/** How many more period goals can be added before the cap of three. */
export function periodSlotsLeft(goals: ReadonlyArray<PeriodGoalLite>): number {
  const active = goals.filter(g => isActivePeriodStatus(g.status)).length;
  return Math.max(0, PERIOD_GOAL_MAX - active);
}

export { PERIOD_GOAL_MAX };
