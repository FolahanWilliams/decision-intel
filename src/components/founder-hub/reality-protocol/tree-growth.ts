/**
 * 66-Day Protocol — pure tree-growth + verse-selection math (2026-06-14).
 *
 * Deterministic, no I/O. Turns the raw FounderOsRealityCheckin rows into the
 * numbers the tree + stats render. The LOAD-BEARING design rule lives here in
 * code, not just in copy:
 *
 *   progress = min(1, totalCheckins / CHECKINS_TO_BLOOM)
 *
 * The tree grows ONLY from check-ins (showing up), never from elapsed calendar
 * time, and a slip is counted as a check-in like any other — so a slip night
 * still GROWS the tree (you showed up and were honest). `cleanCount` /
 * `slipCount` are surfaced as honest data, never as a reset. There is no
 * streak counter by design.
 */

import {
  PROTOCOL_START_ISO,
  PROTOCOL_TOTAL_DAYS,
  CHECKINS_TO_BLOOM,
  TREE_STAGES,
  VERSES,
  RISING_VERSE_REFS,
  type ProtocolVerse,
} from './content';

export type CheckinKind = 'morning' | 'night';

/** Minimal shape the math needs from a persisted check-in row. */
export interface RealityCheckinLite {
  date: string; // YYYY-MM-DD (founder's local day)
  kind: CheckinKind;
  /** Night mark: true = chose reality, false = slip, null/undefined = morning row. */
  stayedOnTrack?: boolean | null;
}

export interface ProtocolState {
  /** Engaged days (distinct days with ≥1 check-in), capped at the window. The
   *  "Day N of 66" number — deliberately NOT calendar days, so progress is
   *  earned by showing up, not gifted by time passing. */
  dayNumber: number;
  /** Total check-ins logged across the window (morning + night, all days). */
  totalCheckins: number;
  /** Distinct days with ≥1 check-in. */
  engagedDays: number;
  /** Tree fill, 0-1 (= totalCheckins / CHECKINS_TO_BLOOM, capped). */
  progress: number;
  /** True once the tree is in full bloom. */
  bloom: boolean;
  /** Nights marked "stayed on track". Honest data, never a reset. */
  cleanCount: number;
  /** Nights marked "slipped". Honest data, never a reset. */
  slipCount: number;
  /** Cosmetic growth-stage label for `progress`. */
  stageLabel: string;
}

/** Local calendar day as YYYY-MM-DD. The founder's day is HIS day (matches
 *  every other FounderOs* surface, which key on a local date string). */
export function todayIso(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
}

/** Whole-number day index of an ISO date (UTC-noon math avoids DST drift; the
 *  string is a plain calendar key, never re-localised). */
function epochDay(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.floor(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0) / 86400000);
}

/** Shift a YYYY-MM-DD by `delta` days. */
export function shiftIso(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(
    dt.getUTCDate()
  ).padStart(2, '0')}`;
}

/** The calendar finish line: start + 66 days = 19 Aug from a 14 Jun start. */
export function finishIso(startIso: string = PROTOCOL_START_ISO): string {
  return shiftIso(startIso, PROTOCOL_TOTAL_DAYS);
}

/** Calendar days elapsed since the protocol start (0 on the start day, clamped
 *  to never go negative — a pre-start visit reads as day 0). Informational
 *  only; it does NOT drive the tree (showing up does). */
export function calendarDaysElapsed(today: string, startIso: string = PROTOCOL_START_ISO): number {
  return Math.max(0, epochDay(today) - epochDay(startIso));
}

function stageLabelFor(progress: number): string {
  let label = TREE_STAGES[0].label;
  for (const s of TREE_STAGES) {
    if (progress >= s.min) label = s.label;
  }
  return label;
}

/** Fold the persisted check-ins into the tree + stats state. Pure. */
export function computeProtocolState(checkins: ReadonlyArray<RealityCheckinLite>): ProtocolState {
  const days = new Set<string>();
  let totalCheckins = 0;
  let cleanCount = 0;
  let slipCount = 0;

  for (const c of checkins) {
    days.add(c.date);
    totalCheckins += 1;
    if (c.kind === 'night') {
      if (c.stayedOnTrack === true) cleanCount += 1;
      else if (c.stayedOnTrack === false) slipCount += 1;
    }
  }

  const engagedDays = days.size;
  const progress = Math.min(1, totalCheckins / CHECKINS_TO_BLOOM);

  return {
    dayNumber: Math.min(PROTOCOL_TOTAL_DAYS, engagedDays),
    totalCheckins,
    engagedDays,
    progress,
    bloom: progress >= 1,
    cleanCount,
    slipCount,
    stageLabel: stageLabelFor(progress),
  };
}

/** What's been done for a given day. Generic so callers passing the full
 *  persisted row (with escapePlan / note / etc.) keep those fields. */
export function checkinsForDay<T extends RealityCheckinLite>(
  checkins: ReadonlyArray<T>,
  date: string
): { morning?: T; night?: T } {
  const out: { morning?: T; night?: T } = {};
  for (const c of checkins) {
    if (c.date !== date) continue;
    if (c.kind === 'morning') out.morning = c;
    else if (c.kind === 'night') out.night = c;
  }
  return out;
}

/** Pick the verse for a check-in. Deterministic by date + kind so re-opening
 *  the same check-in shows the same verse. On a slip night, surface a "rising"
 *  verse (Prov 24:16 leads) — the reframe is the whole point of the slip rule. */
export function selectVerse(args: {
  dateIso: string;
  kind: CheckinKind;
  slipped?: boolean;
}): ProtocolVerse {
  const { dateIso, kind, slipped } = args;
  const e = Math.abs(epochDay(dateIso));

  if (slipped) {
    const rising = RISING_VERSE_REFS.map(ref => VERSES.find(v => v.ref === ref)).filter(
      (v): v is ProtocolVerse => Boolean(v)
    );
    const pool = rising.length > 0 ? rising : VERSES;
    return pool[e % pool.length];
  }

  const slot = kind === 'night' ? 1 : 0;
  return VERSES[(e * 2 + slot) % VERSES.length];
}
