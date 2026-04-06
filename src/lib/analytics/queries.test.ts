import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    analyticsEvent: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { getFunnel, getCohortRetention, getEventUserCount } from './queries';

const mockFindMany = prisma.analyticsEvent.findMany as unknown as ReturnType<typeof vi.fn>;

function ev(userId: string, name: string, secondsFromStart: number) {
  return { userId, name, createdAt: new Date(2026, 0, 1, 0, 0, secondsFromStart) };
}

function evDays(userId: string, name: string, dayOffset: number) {
  return { userId, name, createdAt: new Date(2026, 0, 1 + dayOffset) };
}

describe('getFunnel', () => {
  beforeEach(() => mockFindMany.mockReset());

  it('returns empty result for empty steps', async () => {
    const r = await getFunnel([]);
    expect(r.steps).toEqual([]);
    expect(r.totalEntered).toBe(0);
    expect(r.totalCompleted).toBe(0);
  });

  it('counts ordered progression per user', async () => {
    // user A completes all 3 steps; B completes 2; C completes 1; D fires step 3 first then step 1 (should NOT complete)
    mockFindMany.mockResolvedValue([
      ev('a', 'upload', 1),
      ev('a', 'analysis_complete', 2),
      ev('a', 'share_created', 3),
      ev('b', 'upload', 1),
      ev('b', 'analysis_complete', 2),
      ev('c', 'upload', 1),
      ev('d', 'share_created', 1),
      ev('d', 'upload', 2),
    ]);
    const r = await getFunnel(['upload', 'analysis_complete', 'share_created']);
    expect(r.steps[0].users).toBe(4); // a, b, c, d all fired upload (d fired it second)
    expect(r.steps[1].users).toBe(2); // a, b
    expect(r.steps[2].users).toBe(1); // a
    expect(r.totalEntered).toBe(4);
    expect(r.totalCompleted).toBe(1);
    expect(r.conversionPct).toBe(25);
  });

  it('dropoffPct is computed relative to the previous step', async () => {
    mockFindMany.mockResolvedValue([
      ev('a', 'x', 1),
      ev('a', 'y', 2),
      ev('b', 'x', 1),
      ev('c', 'x', 1),
      ev('d', 'x', 1),
    ]);
    const r = await getFunnel(['x', 'y']);
    expect(r.steps[0].dropoffPct).toBe(0);
    expect(r.steps[1].dropoffPct).toBe(75); // 4 -> 1
  });

  it('ignores events without a userId', async () => {
    mockFindMany.mockResolvedValue([
      { userId: null, name: 'x', createdAt: new Date() },
      ev('a', 'x', 1),
    ]);
    const r = await getFunnel(['x']);
    expect(r.totalEntered).toBe(1);
  });
});

describe('getCohortRetention', () => {
  beforeEach(() => mockFindMany.mockReset());

  it('returns zero-retention when cohort is empty', async () => {
    mockFindMany.mockResolvedValueOnce([]); // cohort query
    const r = await getCohortRetention('user.created', 'analysis_complete', [1, 7, 30]);
    expect(r.cohortSize).toBe(0);
    expect(r.buckets).toHaveLength(3);
    expect(r.buckets.every(b => b.retained === 0)).toBe(true);
  });

  it('computes day-bucketed retention as cumulative', async () => {
    // cohort: users a,b,c signed up day 0
    mockFindMany.mockResolvedValueOnce([
      evDays('a', 'user.created', 0),
      evDays('b', 'user.created', 0),
      evDays('c', 'user.created', 0),
    ]);
    // retention: a returns day 1, b returns day 5, c returns day 20
    mockFindMany.mockResolvedValueOnce([
      evDays('a', 'analysis_complete', 1),
      evDays('b', 'analysis_complete', 5),
      evDays('c', 'analysis_complete', 20),
    ]);
    const r = await getCohortRetention('user.created', 'analysis_complete', [1, 7, 30]);
    expect(r.cohortSize).toBe(3);
    expect(r.buckets[0]).toEqual({ dayOffset: 1, retained: 1, retentionPct: 33.33 });
    expect(r.buckets[1]).toEqual({ dayOffset: 7, retained: 2, retentionPct: 66.67 });
    expect(r.buckets[2]).toEqual({ dayOffset: 30, retained: 3, retentionPct: 100 });
  });
});

describe('getEventUserCount', () => {
  beforeEach(() => mockFindMany.mockReset());

  it('returns the number of rows from a distinct query', async () => {
    mockFindMany.mockResolvedValue([{ userId: 'a' }, { userId: 'b' }, { userId: 'c' }]);
    const n = await getEventUserCount('analysis_complete');
    expect(n).toBe(3);
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ distinct: ['userId'] }));
  });
});
