import { describe, it, expect } from 'vitest';
import {
  computeCampaign,
  computeXp,
  resolveLevel,
  type CampaignInput,
  type CampaignCounts,
} from './campaign-engine';
import { XP } from './campaign-content';

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

function input(partial: Partial<CampaignInput> = {}): CampaignInput {
  return {
    today: '2026-06-01',
    counts: { ...zeroCounts(), ...(partial.counts ?? {}) },
    streaks: { sfcZero: 0, three: 0, ...(partial.streaks ?? {}) },
    highlightsHit: partial.highlightsHit ?? 0,
    wedge: { dmsThisWeek: 0, converted: 0, retained: 0, ...(partial.wedge ?? {}) },
    todayQuests: {
      set_three: false,
      commit_three: false,
      checkin: false,
      reading: false,
      prayer: false,
      reflection: false,
      ...(partial.todayQuests ?? {}),
    },
    weekQuests: {
      week_three: false,
      review: false,
      checkinDays: 0,
      sabbath: false,
      ...(partial.weekQuests ?? {}),
    },
  };
}

describe('computeXp — inputs only', () => {
  it('zero input is zero XP at level 1 (Joshua)', () => {
    const s = computeCampaign(input());
    expect(s.totalXp).toBe(0);
    expect(s.level).toBe(1);
    expect(s.arc.name).toBe('Joshua');
  });

  it('XP accrues from controllable inputs', () => {
    expect(computeXp({ ...zeroCounts(), dmsLogged: 3 })).toBe(3 * XP.dmLogged);
    expect(computeXp({ ...zeroCounts(), checkins: 2, sfcZeroDays: 2 })).toBe(
      2 * XP.checkin + 2 * XP.sfcZeroDay
    );
  });

  it('GUARDRAIL: outcomes (converted / retained) never change XP', () => {
    const base = input({ counts: { ...zeroCounts(), dmsLogged: 10 } });
    const withOutcomes = input({
      counts: { ...zeroCounts(), dmsLogged: 10 },
      wedge: { dmsThisWeek: 0, converted: 8, retained: 8 },
    });
    expect(computeCampaign(withOutcomes).totalXp).toBe(computeCampaign(base).totalXp);
  });
});

describe('resolveLevel', () => {
  it('maps XP thresholds to the right builder arc', () => {
    expect(resolveLevel(0).arc.name).toBe('Joshua');
    expect(resolveLevel(500).arc.name).toBe('Nehemiah');
    expect(resolveLevel(499).arc.name).toBe('Joshua');
    expect(resolveLevel(3500).arc.name).toBe('Daniel');
    expect(resolveLevel(999999).arc.name).toBe('Paul');
    expect(resolveLevel(999999).nextArc).toBeNull();
  });

  it('level progress is the fraction toward the next arc', () => {
    // 500 = Nehemiah start; next (Joseph) at 1500 → 1000 span. At 1000 XP → 0.5.
    const s = computeCampaign(input({ counts: { ...zeroCounts(), dmsLogged: 50 } })); // 1000 XP
    expect(s.totalXp).toBe(1000);
    expect(s.arc.name).toBe('Nehemiah');
    expect(s.levelProgress).toBeCloseTo(0.5, 5);
  });
});

describe('daily quests', () => {
  it('marks done flags + dailyClear + dailyXpEarned', () => {
    const s = computeCampaign(
      input({
        todayQuests: {
          set_three: true,
          commit_three: true,
          checkin: true,
          reading: true,
          prayer: true,
          reflection: true,
        },
      })
    );
    expect(s.dailyQuests.every(q => q.done)).toBe(true);
    expect(s.dailyClear).toBe(true);
    expect(s.dailyXpEarned).toBe(s.dailyQuests.reduce((sum, q) => sum + q.xp, 0));
  });

  it('partial day is not a clear', () => {
    const s = computeCampaign(input({ todayQuests: { set_three: true } as never }));
    expect(s.dailyClear).toBe(false);
  });
});

describe('weekly quests', () => {
  it('DM quest shows progress and completes at the target', () => {
    const partial = computeCampaign(
      input({ wedge: { dmsThisWeek: 3, converted: 0, retained: 0 } })
    );
    const dmQ = partial.weeklyQuests.find(q => q.id === 'dms')!;
    expect(dmQ.progress).toBe(3);
    expect(dmQ.target).toBe(5);
    expect(dmQ.done).toBe(false);

    const full = computeCampaign(input({ wedge: { dmsThisWeek: 6, converted: 0, retained: 0 } }));
    expect(full.weeklyQuests.find(q => q.id === 'dms')!.done).toBe(true);
    expect(full.weeklyQuests.find(q => q.id === 'dms')!.progress).toBe(5); // capped at target
  });

  it('checkin-5 quest completes at 5 days', () => {
    const s = computeCampaign(input({ weekQuests: { checkinDays: 5 } as never }));
    expect(s.weeklyQuests.find(q => q.id === 'checkin_5')!.done).toBe(true);
  });
});

describe('campaign milestones', () => {
  it('kill-floor tracks paid conversions toward 5', () => {
    const s = computeCampaign(input({ wedge: { dmsThisWeek: 0, converted: 3, retained: 0 } }));
    const m = s.milestones.find(x => x.id === 'kill_floor')!;
    expect(m.current).toBe(3);
    expect(m.target).toBe(5);
    expect(m.done).toBe(false);
  });

  it('DM milestones track logged DMs and cap current at target', () => {
    const s = computeCampaign(input({ counts: { ...zeroCounts(), dmsLogged: 40 } }));
    expect(s.milestones.find(x => x.id === 'first_dm')!.done).toBe(true);
    const thirty = s.milestones.find(x => x.id === 'thirty_dms')!;
    expect(thirty.done).toBe(true);
    expect(thirty.current).toBe(30); // capped
  });
});

describe('badges', () => {
  it('unlock at their thresholds', () => {
    const s = computeCampaign(
      input({
        counts: { ...zeroCounts(), checkins: 1, dmsLogged: 10, weeklyReviews: 1 },
        streaks: { sfcZero: 7, three: 0 },
        wedge: { dmsThisWeek: 0, converted: 1, retained: 0 },
      })
    );
    const ids = s.badges.filter(b => b.unlocked).map(b => b.id);
    expect(ids).toContain('first_steps');
    expect(ids).toContain('week_streak');
    expect(ids).toContain('first_dm');
    expect(ids).toContain('ten_dms');
    expect(ids).toContain('first_paid');
    expect(ids).toContain('first_review');
    expect(ids).not.toContain('month_streak'); // needs 30
    expect(ids).not.toContain('fifty_dms');
    expect(s.unlockedBadgeCount).toBe(ids.length);
  });
});

describe('principle of the day', () => {
  it('is deterministic for a given date', () => {
    expect(computeCampaign(input({ today: '2026-06-01' })).principle.scriptureRef).toBe(
      computeCampaign(input({ today: '2026-06-01' })).principle.scriptureRef
    );
  });
});
