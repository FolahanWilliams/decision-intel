/**
 * The Build — campaign state API (2026-06-01).
 *
 * Aggregates the founder's ALREADY-LOGGED data (no new tables) across the
 * FounderOs* tables (Supabase user.id) + the WedgeProspect ledger (userId
 * 'founder'), feeds the pure campaign engine, and returns XP / level / quests /
 * milestones / badges. Founder-private; founder-pass + Supabase dual-gate.
 *
 * GET /api/founder-os/campaign?today=YYYY-MM-DD
 *   today is the client's LOCAL day (the founder's day is HIS day, not UTC);
 *   falls back to the server UTC date if absent.
 */

import { prisma } from '@/lib/prisma';
import { authenticateFounderOs } from '@/lib/founder-os/auth';
import { verifyFounderPass } from '@/lib/utils/founder-auth';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';
import {
  computeCampaign,
  type CampaignInput,
  type CampaignCounts,
} from '@/components/founder-hub/campaign/campaign-engine';
import {
  summarizeDailyThree,
  type DailyGoalLite,
} from '@/components/founder-hub/faith-os/daily-three';
import { weekKeyFor, weekStartIso } from '@/components/founder-hub/faith-os/period-goals';

const log = createLogger('FounderOsCampaign');

export const dynamic = 'force-dynamic';

const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;
const FOUNDER_USER_ID = 'founder';

function zeroCounts(): CampaignCounts {
  return {
    checkins: 0,
    sfcZeroDays: 0,
    deepWorkHours: 0,
    deepReadingHours: 0,
    threeCommitted: 0,
    threeDone: 0,
    reflections: 0,
    readings: 0,
    prayers: 0,
    weeklyReviews: 0,
    periodGoals: 0,
    contentLogs: 0,
    skillsComplete: 0,
    dmsLogged: 0,
    auditsRun: 0,
  };
}

/** Consecutive SFC-zero days ending today (grace: an empty today counts back
 *  from yesterday) — mirrors the daily-three show-up-streak grace. */
function sfcZeroStreak(rows: Array<{ date: string; sfcZero: boolean }>, today: string): number {
  const zeroDays = new Set(rows.filter(r => r.sfcZero).map(r => r.date));
  const shift = (iso: string, d: number): string => {
    const [y, m, dd] = iso.split('-').map(Number);
    const dt = new Date(Date.UTC(y, (m ?? 1) - 1, dd ?? 1, 12));
    dt.setUTCDate(dt.getUTCDate() + d);
    return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
  };
  let cursor = zeroDays.has(today) ? today : shift(today, -1);
  let streak = 0;
  while (zeroDays.has(cursor)) {
    streak += 1;
    cursor = shift(cursor, -1);
  }
  return streak;
}

export async function GET(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }
  // The wedge ledger lives under the literal 'founder' id behind the pass.
  const founderPassOk = verifyFounderPass(request.headers.get('x-founder-pass')).ok;

  const url = new URL(request.url);
  const todayParam = url.searchParams.get('today');
  const today =
    todayParam && DATE_RX.test(todayParam) ? todayParam : new Date().toISOString().slice(0, 10);
  const weekStart = weekStartIso(today);
  const weekKey = weekKeyFor(today);
  const wkStartDate = new Date(`${weekStart}T00:00:00.000Z`);
  const todayStart = new Date(`${today}T00:00:00.000Z`);

  const uid = auth.userId;
  const counts = zeroCounts();
  const input: CampaignInput = {
    today,
    counts,
    streaks: { sfcZero: 0, three: 0 },
    highlightsHit: 0,
    wedge: { dmsThisWeek: 0, converted: 0, retained: 0 },
    todayQuests: {
      set_three: false,
      commit_three: false,
      checkin: false,
      reading: false,
      prayer: false,
      reflection: false,
    },
    weekQuests: { week_three: false, review: false, checkinDays: 0, sabbath: false },
  };

  try {
    const [
      checkinAgg,
      sfcZeroCount,
      deepAgg,
      recentCheckins,
      dailyGoalRows,
      threeCommittedCount,
      threeDoneCount,
      highlightsHitCount,
      reflectionsCount,
      todayReflection,
      readingsCount,
      todayReadingCount,
      prayersCount,
      todayPrayerCount,
      weeklyReviewsCount,
      thisWeekReview,
      periodGoalsCount,
      weekThreeCount,
      contentLogsCount,
      skillsCompleteCount,
      todayCheckin,
      weekCheckinDates,
    ] = await Promise.all([
      prisma.founderOsCheckin.count({ where: { userId: uid } }),
      prisma.founderOsCheckin.count({ where: { userId: uid, sfcZero: true } }),
      prisma.founderOsCheckin.aggregate({
        where: { userId: uid },
        _sum: { deepWorkHours: true, deepReadingMinutes: true },
      }),
      prisma.founderOsCheckin.findMany({
        where: { userId: uid },
        select: { date: true, sfcZero: true },
        orderBy: { date: 'desc' },
        take: 120,
      }),
      prisma.founderOsDailyGoal.findMany({
        where: { userId: uid },
        select: { date: true, status: true, isHighlight: true, committed: true },
        orderBy: { date: 'desc' },
        take: 200,
      }),
      prisma.founderOsDailyGoal.count({ where: { userId: uid, committed: true } }),
      prisma.founderOsDailyGoal.count({ where: { userId: uid, status: 'done' } }),
      prisma.founderOsDailyGoal.count({
        where: { userId: uid, isHighlight: true, status: 'done' },
      }),
      prisma.founderOsDailyReflection.count({ where: { userId: uid } }),
      prisma.founderOsDailyReflection.findUnique({
        where: { userId_date: { userId: uid, date: today } },
        select: { moved: true, blocked: true },
      }),
      prisma.founderOsReadingProgress.count({ where: { userId: uid } }),
      prisma.founderOsReadingProgress.count({
        where: { userId: uid, completedAt: { gte: todayStart } },
      }),
      prisma.founderOsPrayerJournal.count({ where: { userId: uid } }),
      prisma.founderOsPrayerJournal.count({
        where: { userId: uid, createdAt: { gte: todayStart } },
      }),
      prisma.founderOsWeeklyReview.count({ where: { userId: uid } }),
      prisma.founderOsWeeklyReview.findUnique({
        where: { userId_weekStartDate: { userId: uid, weekStartDate: weekStart } },
        select: { id: true },
      }),
      prisma.founderOsPeriodGoal.count({ where: { userId: uid } }),
      prisma.founderOsPeriodGoal.count({
        where: { userId: uid, period: 'week', periodKey: weekKey },
      }),
      prisma.founderOsContentLog.count({ where: { userId: uid } }),
      prisma.founderOsSkill.count({ where: { userId: uid, status: 'complete' } }),
      prisma.founderOsCheckin.findUnique({
        where: { userId_date: { userId: uid, date: today } },
        select: { id: true },
      }),
      prisma.founderOsCheckin.findMany({
        where: { userId: uid, date: { gte: weekStart } },
        select: { date: true },
      }),
    ]);

    counts.checkins = checkinAgg;
    counts.sfcZeroDays = sfcZeroCount;
    counts.deepWorkHours = deepAgg._sum.deepWorkHours ?? 0;
    counts.deepReadingHours = (deepAgg._sum.deepReadingMinutes ?? 0) / 60;
    counts.threeCommitted = threeCommittedCount;
    counts.threeDone = threeDoneCount;
    counts.reflections = reflectionsCount;
    counts.readings = readingsCount;
    counts.prayers = prayersCount;
    counts.weeklyReviews = weeklyReviewsCount;
    counts.periodGoals = periodGoalsCount;
    counts.contentLogs = contentLogsCount;
    counts.skillsComplete = skillsCompleteCount;
    // auditsRun stays 0 — running the founder's own analyses isn't cleanly
    // attributable from these tables; XP from it is 0 until a clean hook exists.

    input.highlightsHit = highlightsHitCount;

    // Streaks
    input.streaks.sfcZero = sfcZeroStreak(recentCheckins, today);
    const three = summarizeDailyThree(
      dailyGoalRows.map(
        (g): DailyGoalLite => ({
          date: g.date,
          status: g.status as DailyGoalLite['status'],
          isHighlight: g.isHighlight,
          committed: g.committed,
        })
      ),
      today
    );
    input.streaks.three = three.currentStreak;

    // Today quests
    input.todayQuests.set_three = three.todayActiveCount > 0;
    input.todayQuests.commit_three = three.todayCommitted;
    input.todayQuests.checkin = Boolean(todayCheckin);
    input.todayQuests.reading = todayReadingCount > 0;
    input.todayQuests.prayer = todayPrayerCount > 0;
    input.todayQuests.reflection = Boolean(
      todayReflection && (todayReflection.moved || todayReflection.blocked)
    );

    // Week quests
    input.weekQuests.week_three = weekThreeCount > 0;
    input.weekQuests.review = Boolean(thisWeekReview);
    input.weekQuests.checkinDays = new Set(weekCheckinDates.map(r => r.date)).size;
    // sabbath is localStorage-only (not persisted) — left false; surfaced as a
    // self-tracked quest the founder ticks in the Faith OS Sabbath card.

    // Wedge ledger (founder-pass-gated, literal 'founder' id)
    if (founderPassOk) {
      const [dmsLogged, dmsThisWeek, converted] = await Promise.all([
        prisma.wedgeProspect.count({ where: { userId: FOUNDER_USER_ID } }),
        prisma.wedgeProspect.count({
          where: { userId: FOUNDER_USER_ID, createdAt: { gte: wkStartDate } },
        }),
        prisma.wedgeProspect.count({ where: { userId: FOUNDER_USER_ID, stage: 'converted' } }),
      ]);
      counts.dmsLogged = dmsLogged;
      input.wedge.dmsThisWeek = dmsThisWeek;
      input.wedge.converted = converted;
      // 90-day retention isn't tracked on the ledger yet — converted is the
      // honest proxy for the graduation milestone until a retention flag exists.
      input.wedge.retained = converted;
    }
  } catch (err) {
    log.warn('aggregation failed — returning level-1 campaign:', err);
    // Fall through with the zeroed input → a valid level-1 campaign.
  }

  return apiSuccess({ data: { campaign: computeCampaign(input) } });
}
