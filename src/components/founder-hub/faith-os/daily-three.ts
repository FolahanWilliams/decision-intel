/**
 * Faith OS "Today's Three" — pure summary math (2026-06-01).
 *
 * Deterministic, no I/O. Turns the raw FounderOsDailyGoal rows into the
 * numbers the UI renders: today's slots, the show-up streak, completion +
 * highlight-hit rates, and a per-day strip for the heatmap.
 *
 * Design choice (load-bearing): the STREAK rewards SHOWING UP — setting the
 * day's three — not perfection. Per the Faith OS philosophy ("the streak is
 * showing up, not perfection") and the anti-prosperity guardrail, a day
 * counts toward the streak if the practice happened, regardless of how many
 * goals were completed. Completion is surfaced separately as its own rate so
 * the two signals never get conflated into a single guilt metric.
 *
 * The cap of three is the feature. `activeCount` counts only open + done
 * goals (live commitments); `released` and `carried` goals free their slot,
 * so the math and the API agree on what "the three" means.
 */

import { DAILY_THREE_MAX } from './content';

export type DailyGoalStatus = 'open' | 'done' | 'carried' | 'released';

/** Minimal shape the math needs — text/rank/intention are irrelevant here. */
export interface DailyGoalLite {
  date: string; // YYYY-MM-DD
  status: DailyGoalStatus;
  isHighlight: boolean;
  committed: boolean;
}

export interface DailyThreeDay {
  date: string;
  /** Active goals set that day (open + done). */
  set: number;
  /** Completed that day. */
  done: number;
  hasHighlight: boolean;
  highlightDone: boolean;
}

export interface DailyThreeSummary {
  /** Active goals for `today` (open + done) — what counts against the cap. */
  todayActiveCount: number;
  /** How many more can be added today before hitting the cap of three. */
  slotsLeft: number;
  /** True when there is ≥1 active goal today AND every active goal is committed. */
  todayCommitted: boolean;
  /** Consecutive days (ending today, or yesterday if today is still empty)
   *  on which at least one goal was set. The show-up streak. */
  currentStreak: number;
  /** Distinct days in the window with ≥1 active goal. */
  daysActive: number;
  /** done / (open + done) across the window, 0-1. 0 when none set. */
  completionRate: number;
  /** Of days that had a Highlight, the share whose Highlight was done, 0-1. */
  highlightHitRate: number;
  /** Count of days that had a Highlight (denominator for highlightHitRate). */
  highlightDays: number;
  /** Most-recent `windowDays` days, oldest → newest, for the heatmap. */
  perDay: DailyThreeDay[];
}

/** Is this goal a live commitment (counts against the cap + the rates)? */
function isActive(status: DailyGoalStatus): boolean {
  return status === 'open' || status === 'done';
}

/** Shift a YYYY-MM-DD string by `delta` days (UTC-noon math avoids DST drift;
 *  the date string is the founder's local day, treated as a plain calendar
 *  key — never re-localised). */
export function shiftIsoDate(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

export function summarizeDailyThree(
  goals: ReadonlyArray<DailyGoalLite>,
  today: string,
  windowDays = 30
): DailyThreeSummary {
  // Bucket goals by date once.
  const byDate = new Map<string, DailyGoalLite[]>();
  for (const g of goals) {
    const list = byDate.get(g.date);
    if (list) list.push(g);
    else byDate.set(g.date, [g]);
  }

  const todayGoals = (byDate.get(today) ?? []).filter(g => isActive(g.status));
  const todayActiveCount = todayGoals.length;
  const slotsLeft = Math.max(0, DAILY_THREE_MAX - todayActiveCount);
  const todayCommitted = todayActiveCount > 0 && todayGoals.every(g => g.committed);

  // Show-up streak. Start at today if it has goals, else yesterday (grace for
  // the in-progress current day), then walk backwards while each day has ≥1
  // active goal set.
  const dayHasGoals = (iso: string): boolean =>
    (byDate.get(iso) ?? []).some(g => isActive(g.status));
  let currentStreak = 0;
  let cursor = dayHasGoals(today) ? today : shiftIsoDate(today, -1);
  while (dayHasGoals(cursor)) {
    currentStreak += 1;
    cursor = shiftIsoDate(cursor, -1);
  }

  // Window aggregates + per-day strip (oldest → newest).
  const perDay: DailyThreeDay[] = [];
  let totalSet = 0;
  let totalDone = 0;
  let daysActive = 0;
  let highlightDays = 0;
  let highlightHits = 0;

  for (let i = windowDays - 1; i >= 0; i--) {
    const iso = shiftIsoDate(today, -i);
    const dayGoals = (byDate.get(iso) ?? []).filter(g => isActive(g.status));
    const set = dayGoals.length;
    const done = dayGoals.filter(g => g.status === 'done').length;
    const hasHighlight = dayGoals.some(g => g.isHighlight);
    const highlightDone = dayGoals.some(g => g.isHighlight && g.status === 'done');

    perDay.push({ date: iso, set, done, hasHighlight, highlightDone });

    totalSet += set;
    totalDone += done;
    if (set > 0) daysActive += 1;
    if (hasHighlight) {
      highlightDays += 1;
      if (highlightDone) highlightHits += 1;
    }
  }

  return {
    todayActiveCount,
    slotsLeft,
    todayCommitted,
    currentStreak,
    daysActive,
    completionRate: totalSet > 0 ? totalDone / totalSet : 0,
    highlightHitRate: highlightDays > 0 ? highlightHits / highlightDays : 0,
    highlightDays,
    perDay,
  };
}
