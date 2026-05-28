/**
 * Faith OS progress metrics (2026-05-28).
 *
 * Pure, deterministic computation over the founder's journal entries +
 * reading-plan progress + daily checkins. No I/O, no Date.now() inside —
 * the caller passes `todayISO` so the functions stay react-hooks/purity safe
 * and unit-testable. The dynamic visualisations + the AI companion both read
 * from these.
 */

import { READING_PLANS } from '@/components/founder-hub/faith-os/content';

export interface ProgressJournalEntry {
  kind: string;
  scriptureRef: string | null;
  answered: boolean;
  createdAt: string;
}

export interface ProgressReadingRow {
  planId: string;
  reference: string;
  reflection: string | null;
  completedAt: string;
}

export interface ProgressCheckin {
  date: string; // YYYY-MM-DD
  prayer: boolean;
  scripture: boolean;
}

export interface DisciplineDay {
  date: string;
  prayer: boolean;
  scripture: boolean;
  /** 0 = neither, 1 = one of the two, 2 = both. */
  level: 0 | 1 | 2;
}

export interface ReadingCompletion {
  planId: string;
  title: string;
  done: number;
  total: number;
}

export interface CadenceWeek {
  weekStart: string; // YYYY-MM-DD (Sunday)
  count: number;
}

export interface RecurringScripture {
  ref: string;
  count: number;
}

export interface FaithProgress {
  totalEntries: number;
  actsDistribution: Record<string, number>;
  supplicationCount: number;
  answeredCount: number;
  /** answered / supplications, 0 when no supplications. */
  answeredRate: number;
  disciplineDays: DisciplineDay[]; // oldest → newest, one per day in the window
  prayerStreak: number;
  scriptureStreak: number;
  bothStreak: number;
  readingCompletion: ReadingCompletion[];
  cadence: CadenceWeek[];
  recurringScripture: RecurringScripture[];
}

const KIND_ORDER = ['adoration', 'confession', 'thanksgiving', 'supplication', 'reflection'];

function shiftISO(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function weekStartOf(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() - d.getDay()); // back to Sunday
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Normalise a scripture ref to a chapter-level key so "Proverbs 3:5-6" and
 *  "Proverbs 3:5" both count toward "Proverbs 3" recurrence. */
function normalizeRef(ref: string): string {
  const trimmed = ref.trim();
  // Keep "Book Chapter"; drop the verse range after the colon.
  const colon = trimmed.indexOf(':');
  return colon === -1 ? trimmed : trimmed.slice(0, colon).trim();
}

/**
 * Compute consecutive-day streaks ending today (or yesterday if today not
 * logged yet) for prayer, scripture, and both-together.
 */
function computeStreaks(
  byDate: Map<string, ProgressCheckin>,
  todayISO: string
): { prayerStreak: number; scriptureStreak: number; bothStreak: number } {
  let prayerStreak = 0;
  let scriptureStreak = 0;
  let bothStreak = 0;
  let prayerLive = true;
  let scriptureLive = true;
  let bothLive = true;

  let cursor = todayISO;
  for (let i = 0; i < 400 && (prayerLive || scriptureLive || bothLive); i++) {
    const c = byDate.get(cursor);
    const prayer = !!c?.prayer;
    const scripture = !!c?.scripture;

    // Today may not be logged yet — don't break the streak on a blank today.
    const isTodayBlank = i === 0 && !c;

    if (prayerLive) {
      if (prayer) prayerStreak++;
      else if (!isTodayBlank) prayerLive = false;
    }
    if (scriptureLive) {
      if (scripture) scriptureStreak++;
      else if (!isTodayBlank) scriptureLive = false;
    }
    if (bothLive) {
      if (prayer && scripture) bothStreak++;
      else if (!isTodayBlank) bothLive = false;
    }
    cursor = shiftISO(cursor, -1);
  }
  return { prayerStreak, scriptureStreak, bothStreak };
}

export function computeFaithProgress(
  journal: ProgressJournalEntry[],
  reading: ProgressReadingRow[],
  checkins: ProgressCheckin[],
  todayISO: string,
  heatmapDays = 91,
  cadenceWeeks = 12
): FaithProgress {
  // ACTS distribution
  const actsDistribution: Record<string, number> = {};
  for (const k of KIND_ORDER) actsDistribution[k] = 0;
  let supplicationCount = 0;
  let answeredCount = 0;
  for (const e of journal) {
    actsDistribution[e.kind] = (actsDistribution[e.kind] ?? 0) + 1;
    if (e.kind === 'supplication') {
      supplicationCount++;
      if (e.answered) answeredCount++;
    }
  }
  const answeredRate = supplicationCount === 0 ? 0 : answeredCount / supplicationCount;

  // Discipline heatmap days (oldest → newest)
  const byDate = new Map<string, ProgressCheckin>();
  for (const c of checkins) byDate.set(c.date, c);
  const disciplineDays: DisciplineDay[] = [];
  for (let i = heatmapDays - 1; i >= 0; i--) {
    const date = shiftISO(todayISO, -i);
    const c = byDate.get(date);
    const prayer = !!c?.prayer;
    const scripture = !!c?.scripture;
    const level: 0 | 1 | 2 = prayer && scripture ? 2 : prayer || scripture ? 1 : 0;
    disciplineDays.push({ date, prayer, scripture, level });
  }

  const { prayerStreak, scriptureStreak, bothStreak } = computeStreaks(byDate, todayISO);

  // Reading completion per plan
  const readingByPlan = new Map<string, Set<string>>();
  for (const r of reading) {
    if (!readingByPlan.has(r.planId)) readingByPlan.set(r.planId, new Set());
    readingByPlan.get(r.planId)!.add(r.reference);
  }
  const readingCompletion: ReadingCompletion[] = READING_PLANS.map(plan => ({
    planId: plan.id,
    title: plan.title,
    done: readingByPlan.get(plan.id)?.size ?? 0,
    total: plan.entries.length,
  }));

  // Journal cadence — entries per week, last `cadenceWeeks` weeks
  const thisWeek = weekStartOf(todayISO);
  const weekBuckets = new Map<string, number>();
  for (let i = 0; i < cadenceWeeks; i++) {
    weekBuckets.set(shiftISO(thisWeek, -7 * i), 0);
  }
  for (const e of journal) {
    const w = weekStartOf(e.createdAt.slice(0, 10));
    if (weekBuckets.has(w)) weekBuckets.set(w, (weekBuckets.get(w) ?? 0) + 1);
  }
  const cadence: CadenceWeek[] = Array.from(weekBuckets.entries())
    .map(([weekStart, count]) => ({ weekStart, count }))
    .sort((a, b) => (a.weekStart < b.weekStart ? -1 : 1));

  // Recurring scripture — across journal anchors + reading references
  const refCounts = new Map<string, number>();
  for (const e of journal) {
    if (e.scriptureRef) {
      const key = normalizeRef(e.scriptureRef);
      if (key) refCounts.set(key, (refCounts.get(key) ?? 0) + 1);
    }
  }
  for (const r of reading) {
    const key = normalizeRef(r.reference);
    if (key) refCounts.set(key, (refCounts.get(key) ?? 0) + 1);
  }
  const recurringScripture: RecurringScripture[] = Array.from(refCounts.entries())
    .map(([ref, count]) => ({ ref, count }))
    .filter(r => r.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    totalEntries: journal.length,
    actsDistribution,
    supplicationCount,
    answeredCount,
    answeredRate,
    disciplineDays,
    prayerStreak,
    scriptureStreak,
    bothStreak,
    readingCompletion,
    cadence,
    recurringScripture,
  };
}

export const ACTS_KIND_ORDER = KIND_ORDER;
