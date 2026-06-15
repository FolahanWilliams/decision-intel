/**
 * 66-Day Protocol — pure reflection-trend math (2026-06-15).
 *
 * Deterministic, no I/O. Turns the optional FounderOsRealityReflection rows
 * (the descriptive 1-5 factor ratings) + the check-in rows into the read-only
 * "watch your mind grow" trend view. The DETERMINISTIC discipline is the whole
 * point — synthesis is trend arithmetic, NEVER an in-app AI coach.
 *
 * LOAD-BEARING: nothing here feeds the tree. The tree math lives in
 * tree-growth.ts and reads check-ins only; this module is read-only analysis
 * of an OPTIONAL signal. A correlation is shown only once there is a real
 * sample on BOTH sides (MIN_CORRELATION_N) — noise dressed as insight is worse
 * than nothing (the same N-floor honesty as the Vohra / calibration surfaces).
 */

import type { RealityCheckinLite } from './tree-growth';

export type ReflectionFactorId = 'mind' | 'energy' | 'intention';

/** Minimal shape the math needs from a persisted reflection row. */
export interface ReflectionLite {
  date: string; // YYYY-MM-DD
  mind?: number | null;
  energy?: number | null;
  intention?: number | null;
}

/** ≥ this rating = the "high" bucket for a correlation; ≤ REFLECTION_LOW = low. */
export const REFLECTION_HIGH = 4;
export const REFLECTION_LOW = 2;

/** Both buckets must clear this before a correlation renders. Below it, the
 *  signal is noise — surface nothing rather than a fabricated pattern. */
export const MIN_CORRELATION_N = 5;

/** How many most-recent rated days count as "recent" for the delta arrow. */
export const RECENT_WINDOW = 7;

export interface FactorTrend {
  id: ReflectionFactorId;
  /** Only days that carry a valid value, ascending by date. */
  series: ReadonlyArray<{ date: string; value: number }>;
  count: number;
  /** Mean across all rated days (null when none). */
  average: number | null;
  /** Mean of the most-recent up-to-RECENT_WINDOW rated days. */
  recentAverage: number | null;
  /** Mean of the rated days BEFORE the recent window. */
  priorAverage: number | null;
  /** recentAverage − priorAverage (null when either side is empty). */
  delta: number | null;
}

export interface OutcomeCorrelation {
  id: ReflectionFactorId;
  /** Stayed-on-track rate (0-1) on days rated ≥ REFLECTION_HIGH. */
  highRate: number;
  /** Stayed-on-track rate (0-1) on days rated ≤ REFLECTION_LOW. */
  lowRate: number;
  highN: number;
  lowN: number;
}

/** A valid 1-5 reading for a factor, or null. */
export function factorValue(r: ReflectionLite, id: ReflectionFactorId): number | null {
  const v = r[id];
  return typeof v === 'number' && Number.isFinite(v) && v >= 1 && v <= 5 ? v : null;
}

function mean(values: ReadonlyArray<number>): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Fold the reflection rows into a single factor's trend. Pure. */
export function summarizeFactor(
  rows: ReadonlyArray<ReflectionLite>,
  id: ReflectionFactorId
): FactorTrend {
  const series = rows
    .map(r => ({ date: r.date, value: factorValue(r, id) }))
    .filter((p): p is { date: string; value: number } => p.value !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  const values = series.map(p => p.value);
  const average = mean(values);

  const recent = values.slice(-RECENT_WINDOW);
  const prior = values.slice(0, Math.max(0, values.length - RECENT_WINDOW));
  const recentAverage = mean(recent);
  const priorAverage = mean(prior);
  const delta =
    recentAverage !== null && priorAverage !== null ? recentAverage - priorAverage : null;

  return {
    id,
    series,
    count: series.length,
    average,
    recentAverage,
    priorAverage,
    delta,
  };
}

/** Every factor's trend, in the order given. */
export function summarizeReflections(
  rows: ReadonlyArray<ReflectionLite>,
  ids: ReadonlyArray<ReflectionFactorId>
): FactorTrend[] {
  return ids.map(id => summarizeFactor(rows, id));
}

/** Map of date → stayed-on-track for nights that were marked (true/false only). */
function outcomeByDate(checkins: ReadonlyArray<RealityCheckinLite>): Map<string, boolean> {
  const m = new Map<string, boolean>();
  for (const c of checkins) {
    if (c.kind === 'night' && typeof c.stayedOnTrack === 'boolean') {
      m.set(c.date, c.stayedOnTrack);
    }
  }
  return m;
}

/**
 * Correlate a factor's high/low days with whether the night was on-track.
 * Returns null UNLESS both buckets independently clear `minN` — the honest
 * floor that keeps a 2-day coincidence from rendering as a "pattern".
 */
export function correlateFactorWithOutcome(
  reflections: ReadonlyArray<ReflectionLite>,
  checkins: ReadonlyArray<RealityCheckinLite>,
  id: ReflectionFactorId,
  minN: number = MIN_CORRELATION_N
): OutcomeCorrelation | null {
  const outcome = outcomeByDate(checkins);
  let highTotal = 0;
  let highClean = 0;
  let lowTotal = 0;
  let lowClean = 0;

  for (const r of reflections) {
    const v = factorValue(r, id);
    if (v === null) continue;
    const onTrack = outcome.get(r.date);
    if (onTrack === undefined) continue; // need a marked night to correlate
    if (v >= REFLECTION_HIGH) {
      highTotal += 1;
      if (onTrack) highClean += 1;
    } else if (v <= REFLECTION_LOW) {
      lowTotal += 1;
      if (onTrack) lowClean += 1;
    }
  }

  if (highTotal < minN || lowTotal < minN) return null;

  return {
    id,
    highRate: highClean / highTotal,
    lowRate: lowClean / lowTotal,
    highN: highTotal,
    lowN: lowTotal,
  };
}

/** Normalise a value series to a 0-1 sparkline path over a fixed scale (1..max,
 *  so the line is comparable day to day and never auto-rescales misleadingly).
 *  Returns an SVG path string; pure, so it can be unit-tested. */
export function sparklinePath(
  values: ReadonlyArray<number>,
  width: number,
  height: number,
  scaleMax: number
): string {
  if (values.length === 0) return '';
  if (values.length === 1) {
    const y = height - (clampScale(values[0], scaleMax) / scaleMax) * height;
    return `M0 ${round(y)} L${width} ${round(y)}`;
  }
  const step = width / (values.length - 1);
  return values
    .map((v, i) => {
      const x = i * step;
      const y = height - (clampScale(v, scaleMax) / scaleMax) * height;
      return `${i === 0 ? 'M' : 'L'}${round(x)} ${round(y)}`;
    })
    .join(' ');
}

function clampScale(v: number, scaleMax: number): number {
  return Math.max(0, Math.min(scaleMax, v));
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
