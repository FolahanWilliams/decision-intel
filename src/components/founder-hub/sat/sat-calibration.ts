/**
 * SAT Prep — pure calibration + analysis math (no I/O, no JSX, unit-tested).
 *
 * The Decision-Intel reasoning-audit lens applied to a test-taker: tag
 * confidence BEFORE answering, then Brier-score the gap between confidence and
 * correctness. Overconfident-and-wrong questions are the highest-ROI targets —
 * a baited System-1 pattern-match. Plus weak-area ranking (where to spend the
 * 30 min), root-cause breakdown, projected score (official tests only), and the
 * input-streak.
 *
 * Every consumer (Progress dashboard, daily-session focus picker, the
 * companion plan) reads from here; never re-implement the math inline.
 */

import type { SatSection } from './sat-content';

export interface ErrorEntryLite {
  date: string; // YYYY-MM-DD
  section: SatSection;
  skill: string;
  rootCause: string | null;
  confidence: number | null; // 0-3, tagged pre-answer
  wasCorrect: boolean;
}

export interface SessionLite {
  date: string; // YYYY-MM-DD
  completed: boolean;
}

export interface TestLite {
  date: string;
  section: string; // 'full' | 'rw' | 'math'
  rwScore: number | null;
  mathScore: number | null;
  totalScore: number | null;
}

/** Min confidence-tagged samples before a calibration verdict is honest. */
export const CALIBRATION_MIN_N = 5;
/** Min attempts on a skill before it can rank as a "weak area". */
export const WEAK_AREA_MIN_ATTEMPTS = 2;
/** Confidence at or above this, with a wrong answer, is an "overconfident miss". */
export const OVERCONFIDENT_THRESHOLD = 2;

/**
 * Subjective probability a confidence level maps to (for Brier scoring).
 * 0 = pure guess (~0.25 on a 4-option MCQ), 3 = near-certain.
 */
export function confidenceToProbability(c: number): number {
  switch (c) {
    case 0:
      return 0.25;
    case 1:
      return 0.5;
    case 2:
      return 0.75;
    case 3:
      return 0.95;
    default:
      return 0.5;
  }
}

export type CalibrationBand = 'well_calibrated' | 'overconfident' | 'underconfident' | 'too_few';

export interface CalibrationResult {
  sampleSize: number;
  brier: number | null; // lower is better; null below the floor
  meanConfidenceProb: number | null;
  accuracy: number | null;
  /** meanConfidenceProb − accuracy. Positive ⇒ overconfident. */
  gap: number | null;
  band: CalibrationBand;
}

/**
 * Brier-score the confidence-vs-correctness gap over confidence-tagged entries.
 * Brier = mean((p − outcome)²). Below CALIBRATION_MIN_N we return a `too_few`
 * band and null metrics rather than a noisy verdict (same N-floor honesty as
 * the Vohra + discipline-correlation surfaces).
 */
export function computeCalibration(entries: ErrorEntryLite[]): CalibrationResult {
  const tagged = entries.filter(e => e.confidence !== null && e.confidence !== undefined);
  const n = tagged.length;
  if (n < CALIBRATION_MIN_N) {
    return {
      sampleSize: n,
      brier: null,
      meanConfidenceProb: null,
      accuracy: null,
      gap: null,
      band: 'too_few',
    };
  }
  let brierSum = 0;
  let probSum = 0;
  let correctSum = 0;
  for (const e of tagged) {
    const p = confidenceToProbability(e.confidence as number);
    const outcome = e.wasCorrect ? 1 : 0;
    brierSum += (p - outcome) ** 2;
    probSum += p;
    correctSum += outcome;
  }
  const brier = brierSum / n;
  const meanConfidenceProb = probSum / n;
  const accuracy = correctSum / n;
  const gap = meanConfidenceProb - accuracy;
  let band: CalibrationBand;
  if (gap > 0.1) band = 'overconfident';
  else if (gap < -0.1) band = 'underconfident';
  else band = 'well_calibrated';
  return {
    sampleSize: n,
    brier: round3(brier),
    meanConfidenceProb: round3(meanConfidenceProb),
    accuracy: round3(accuracy),
    gap: round3(gap),
    band,
  };
}

export interface WeakArea {
  skill: string;
  attempted: number;
  wrong: number;
  errorRate: number; // 0-1
}

/**
 * Rank skills by error rate (then volume) over entries with enough attempts.
 * This is the weak-area-weighting axis — where the daily 30 minutes should go.
 */
export function computeWeakAreas(entries: ErrorEntryLite[], limit = 5): WeakArea[] {
  const bySkill = new Map<string, { attempted: number; wrong: number }>();
  for (const e of entries) {
    const cur = bySkill.get(e.skill) ?? { attempted: 0, wrong: 0 };
    cur.attempted += 1;
    if (!e.wasCorrect) cur.wrong += 1;
    bySkill.set(e.skill, cur);
  }
  const ranked: WeakArea[] = [];
  for (const [skill, { attempted, wrong }] of bySkill) {
    if (attempted < WEAK_AREA_MIN_ATTEMPTS) continue;
    ranked.push({ skill, attempted, wrong, errorRate: round3(wrong / attempted) });
  }
  ranked.sort(
    (a, b) => b.errorRate - a.errorRate || b.wrong - a.wrong || b.attempted - a.attempted
  );
  return ranked.slice(0, limit);
}

export function rootCauseBreakdown(entries: ErrorEntryLite[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of entries) {
    if (e.wasCorrect) continue;
    const k = e.rootCause ?? 'untagged';
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

/** The highest-ROI review list: confident (≥2) but wrong. Generic so the
 *  caller's richer row type (with `note`, `id`, …) is preserved. */
export function overconfidentMisses<T extends ErrorEntryLite>(entries: T[]): T[] {
  return entries.filter(
    e =>
      !e.wasCorrect && e.confidence !== null && (e.confidence as number) >= OVERCONFIDENT_THRESHOLD
  );
}

export interface ProjectedScore {
  rwAvg: number | null;
  mathAvg: number | null;
  projectedTotal: number | null;
  sampleSize: number; // number of tests contributing
}

/**
 * Projected score from OFFICIAL tests only (the caller must never pass in
 * AI-drill data). Averages the most-recent up-to-`window` section scores
 * independently, so a Math-only sitting still updates Math without dragging
 * R&W. projectedTotal is the sum of the two section averages when both exist.
 */
export function computeProjectedScore(tests: TestLite[], window = 5): ProjectedScore {
  const sorted = [...tests].sort((a, b) => (a.date < b.date ? 1 : -1)); // most recent first
  const rwScores: number[] = [];
  const mathScores: number[] = [];
  for (const t of sorted) {
    if (t.rwScore != null && rwScores.length < window) rwScores.push(t.rwScore);
    if (t.mathScore != null && mathScores.length < window) mathScores.push(t.mathScore);
  }
  const rwAvg = rwScores.length ? Math.round(avg(rwScores)) : null;
  const mathAvg = mathScores.length ? Math.round(avg(mathScores)) : null;
  const projectedTotal = rwAvg != null && mathAvg != null ? rwAvg + mathAvg : null;
  const contributing = new Set<string>();
  for (const t of sorted) {
    if (t.rwScore != null || t.mathScore != null) contributing.add(t.date + t.section);
  }
  return { rwAvg, mathAvg, projectedTotal, sampleSize: contributing.size };
}

export interface StreakResult {
  current: number;
  longest: number;
}

/**
 * Input-streak over completed daily sessions. Current streak counts back from
 * today (or yesterday — a day not yet done does not break it until tomorrow).
 */
export function computeStreak(sessions: SessionLite[], todayIso?: string): StreakResult {
  const days = Array.from(new Set(sessions.filter(s => s.completed).map(s => s.date))).sort(); // ascending YYYY-MM-DD
  if (days.length === 0) return { current: 0, longest: 0 };

  // Longest run of consecutive calendar days.
  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    if (isNextDay(days[i - 1], days[i])) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  // Current streak: walk back from the most recent day, but only "live" if the
  // most recent completed day is today or yesterday.
  const today = todayIso ?? new Date().toISOString().slice(0, 10);
  const yesterday = addDaysIso(today, -1);
  const last = days[days.length - 1];
  let current = 0;
  if (last === today || last === yesterday) {
    current = 1;
    for (let i = days.length - 1; i > 0; i--) {
      if (isNextDay(days[i - 1], days[i])) current += 1;
      else break;
    }
  }
  return { current, longest };
}

// ── helpers ──────────────────────────────────────────────────────────
function avg(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
function round3(x: number): number {
  return Math.round(x * 1000) / 1000;
}
function isNextDay(prev: string, next: string): boolean {
  return addDaysIso(prev, 1) === next;
}
function addDaysIso(iso: string, delta: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}
