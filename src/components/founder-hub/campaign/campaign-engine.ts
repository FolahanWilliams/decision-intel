/**
 * The Build — campaign engine (2026-06-01). Pure, deterministic, no I/O.
 *
 * Turns the founder's already-logged data (counts + streaks across the
 * FounderOs* tables + the wedge ledger) into XP, level (Scripture builder arc),
 * quest state, campaign-milestone progress, and unlocked badges.
 *
 * XP is INPUTS ONLY (the controllable, faithful work). Outcomes (conversions,
 * retention) drive milestones + badges, never XP — the anti-prosperity
 * guardrail made arithmetic.
 */

import {
  XP,
  LEVEL_ARCS,
  DAILY_QUESTS,
  WEEKLY_QUESTS,
  CAMPAIGN_MILESTONES,
  BADGES,
  WEEKLY_DM_TARGET,
  principleForDate,
  type LevelArc,
  type OperatingPrinciple,
} from './campaign-content';

export interface CampaignCounts {
  checkins: number;
  sfcZeroDays: number;
  deepWorkHours: number;
  deepReadingHours: number;
  threeCommitted: number;
  threeDone: number;
  reflections: number;
  readings: number;
  prayers: number;
  weeklyReviews: number;
  periodGoals: number;
  contentLogs: number;
  skillsComplete: number;
  dmsLogged: number;
  auditsRun: number;
  satSessions: number;
  satReps: number;
}

export interface CampaignInput {
  today: string; // YYYY-MM-DD
  counts: CampaignCounts;
  streaks: { sfcZero: number; three: number };
  highlightsHit: number;
  wedge: { dmsThisWeek: number; converted: number; retained: number };
  todayQuests: {
    set_three: boolean;
    commit_three: boolean;
    checkin: boolean;
    reading: boolean;
    prayer: boolean;
    reflection: boolean;
  };
  weekQuests: {
    week_three: boolean;
    review: boolean;
    checkinDays: number;
    sabbath: boolean;
  };
}

export interface QuestState {
  id: string;
  label: string;
  scriptureRef: string;
  xp: number;
  done: boolean;
  /** For progress-style weekly quests (e.g. DMs 3/5). */
  progress?: number;
  target?: number;
}

export interface MilestoneState {
  id: string;
  label: string;
  detail: string;
  scriptureRef: string;
  current: number;
  target: number;
  unit: string;
  done: boolean;
}

export interface BadgeState {
  id: string;
  label: string;
  how: string;
  scriptureRef: string;
  unlocked: boolean;
}

export interface CampaignState {
  totalXp: number;
  level: number;
  arc: LevelArc;
  nextArc: LevelArc | null;
  xpIntoLevel: number;
  xpForNextLevel: number | null;
  levelProgress: number; // 0-1 toward the next arc
  dailyQuests: QuestState[];
  dailyClear: boolean;
  dailyXpEarned: number;
  weeklyQuests: QuestState[];
  milestones: MilestoneState[];
  badges: BadgeState[];
  unlockedBadgeCount: number;
  principle: OperatingPrinciple;
}

/** Total XP from cumulative inputs only. */
export function computeXp(c: CampaignCounts): number {
  return Math.round(
    c.checkins * XP.checkin +
      c.sfcZeroDays * XP.sfcZeroDay +
      c.deepWorkHours * XP.deepWorkHour +
      c.deepReadingHours * XP.deepReadingHour +
      c.threeCommitted * XP.threeCommitted +
      c.threeDone * XP.threeDone +
      c.reflections * XP.reflection +
      c.readings * XP.reading +
      c.prayers * XP.prayer +
      c.weeklyReviews * XP.weeklyReview +
      c.periodGoals * XP.periodGoal +
      c.contentLogs * XP.contentLog +
      c.skillsComplete * XP.skillComplete +
      c.dmsLogged * XP.dmLogged +
      c.auditsRun * XP.auditRun +
      c.satSessions * XP.satSession +
      c.satReps * XP.satRep
  );
}

/** Highest arc whose threshold the XP has reached, plus the next one. */
export function resolveLevel(totalXp: number): {
  arc: LevelArc;
  nextArc: LevelArc | null;
} {
  let arc = LEVEL_ARCS[0];
  for (const a of LEVEL_ARCS) {
    if (totalXp >= a.xpThreshold) arc = a;
    else break;
  }
  const nextArc = LEVEL_ARCS.find(a => a.level === arc.level + 1) ?? null;
  return { arc, nextArc };
}

export function computeCampaign(input: CampaignInput): CampaignState {
  const { counts, streaks, wedge, todayQuests, weekQuests } = input;
  const totalXp = computeXp(counts);
  const { arc, nextArc } = resolveLevel(totalXp);

  const xpIntoLevel = totalXp - arc.xpThreshold;
  const xpForNextLevel = nextArc ? nextArc.xpThreshold - arc.xpThreshold : null;
  const levelProgress = xpForNextLevel ? Math.min(1, xpIntoLevel / xpForNextLevel) : 1;

  // Daily quests
  const dailyDone: Record<string, boolean> = {
    set_three: todayQuests.set_three,
    commit_three: todayQuests.commit_three,
    checkin: todayQuests.checkin,
    reading: todayQuests.reading,
    prayer: todayQuests.prayer,
    reflection: todayQuests.reflection,
  };
  const dailyQuests: QuestState[] = DAILY_QUESTS.map(q => ({
    id: q.id,
    label: q.label,
    scriptureRef: q.scriptureRef,
    xp: q.xp ?? 0,
    done: Boolean(dailyDone[q.id]),
  }));
  const dailyClear = dailyQuests.every(q => q.done);
  const dailyXpEarned = dailyQuests.reduce((s, q) => s + (q.done ? q.xp : 0), 0);

  // Weekly quests
  const weeklyQuests: QuestState[] = WEEKLY_QUESTS.map(q => {
    if (q.id === 'dms') {
      const progress = Math.min(wedge.dmsThisWeek, WEEKLY_DM_TARGET);
      return {
        id: q.id,
        label: q.label,
        scriptureRef: q.scriptureRef,
        xp: q.xp ?? 0,
        done: wedge.dmsThisWeek >= WEEKLY_DM_TARGET,
        progress,
        target: WEEKLY_DM_TARGET,
      };
    }
    if (q.id === 'checkin_5') {
      return {
        id: q.id,
        label: q.label,
        scriptureRef: q.scriptureRef,
        xp: q.xp ?? 0,
        done: weekQuests.checkinDays >= 5,
        progress: Math.min(weekQuests.checkinDays, 5),
        target: 5,
      };
    }
    const doneMap: Record<string, boolean> = {
      week_three: weekQuests.week_three,
      review: weekQuests.review,
      sabbath: weekQuests.sabbath,
    };
    return {
      id: q.id,
      label: q.label,
      scriptureRef: q.scriptureRef,
      xp: q.xp ?? 0,
      done: Boolean(doneMap[q.id]),
    };
  });

  // Campaign milestones (real gates; progress, not XP)
  const milestoneCurrent: Record<string, number> = {
    first_dm: counts.dmsLogged,
    thirty_dms: counts.dmsLogged,
    kill_floor: wedge.converted,
    graduation: wedge.retained,
    streak_30: streaks.sfcZero,
  };
  const milestones: MilestoneState[] = CAMPAIGN_MILESTONES.map(m => {
    const current = milestoneCurrent[m.id] ?? 0;
    return {
      id: m.id,
      label: m.label,
      detail: m.detail,
      scriptureRef: m.scriptureRef,
      current: Math.min(current, m.target),
      target: m.target,
      unit: m.unit,
      done: current >= m.target,
    };
  });

  // Badges (derived from thresholds)
  const badgeUnlocked: Record<string, boolean> = {
    first_steps: counts.checkins >= 1,
    week_streak: streaks.sfcZero >= 7,
    month_streak: streaks.sfcZero >= 30,
    first_dm: counts.dmsLogged >= 1,
    ten_dms: counts.dmsLogged >= 10,
    fifty_dms: counts.dmsLogged >= 50,
    first_paid: wedge.converted >= 1,
    first_review: counts.weeklyReviews >= 1,
    reader: counts.readings >= 30,
    pray_er: counts.prayers >= 50,
    first_skill: counts.skillsComplete >= 1,
    highlight_master: input.highlightsHit >= 14,
  };
  const badges: BadgeState[] = BADGES.map(b => ({
    id: b.id,
    label: b.label,
    how: b.how,
    scriptureRef: b.scriptureRef,
    unlocked: Boolean(badgeUnlocked[b.id]),
  }));
  const unlockedBadgeCount = badges.filter(b => b.unlocked).length;

  return {
    totalXp,
    level: arc.level,
    arc,
    nextArc,
    xpIntoLevel,
    xpForNextLevel,
    levelProgress,
    dailyQuests,
    dailyClear,
    dailyXpEarned,
    weeklyQuests,
    milestones,
    badges,
    unlockedBadgeCount,
    principle: principleForDate(input.today),
  };
}
