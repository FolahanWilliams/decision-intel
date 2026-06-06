/**
 * Plan-limits regression suite.
 *
 * plan-limits.ts gates revenue: the admin/enterprise bypass, the
 * monthly analysis cap, and the team-seat cap. The load-bearing
 * invariant is FAIL-CLOSED on a count error — a regression that
 * fails-open hands every plan unlimited audits. Until now nothing
 * locked the bypass or the fail-closed posture.
 *
 * Locks: admin → enterprise (no DB hit), active-subscription
 * resolution, free fallback, container-audit bypass, monthly-cap
 * boundary, fail-closed on error, team-seat counting (members +
 * pending invites).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    subscription: { findFirst: vi.fn() },
    decisionContainerAuditPurchase: { findFirst: vi.fn() },
    analysis: { count: vi.fn() },
    teamMember: { findFirst: vi.fn(), count: vi.fn() },
    teamInvite: { count: vi.fn() },
    analysisReservation: {
      deleteMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));
vi.mock('./admin', () => ({ isAdminUserId: vi.fn() }));
vi.mock('./logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { prisma } from '@/lib/prisma';
import { isAdminUserId } from './admin';
import {
  getUserPlan,
  checkAnalysisLimit,
  checkTeamSizeLimit,
  reserveAnalysisSlot,
  releaseAnalysisSlot,
} from './plan-limits';
import { PLANS } from '@/lib/stripe';

const isAdmin = isAdminUserId as unknown as ReturnType<typeof vi.fn>;
const subFind = prisma.subscription.findFirst as unknown as ReturnType<typeof vi.fn>;
const purchaseFind = prisma.decisionContainerAuditPurchase.findFirst as unknown as ReturnType<
  typeof vi.fn
>;
const analysisCount = prisma.analysis.count as unknown as ReturnType<typeof vi.fn>;
const memberCount = prisma.teamMember.count as unknown as ReturnType<typeof vi.fn>;
const inviteCount = prisma.teamInvite.count as unknown as ReturnType<typeof vi.fn>;
const resvDeleteMany = prisma.analysisReservation.deleteMany as unknown as ReturnType<typeof vi.fn>;
const resvCount = prisma.analysisReservation.count as unknown as ReturnType<typeof vi.fn>;
const resvCreate = prisma.analysisReservation.create as unknown as ReturnType<typeof vi.fn>;
const resvDelete = prisma.analysisReservation.delete as unknown as ReturnType<typeof vi.fn>;
const txn = prisma.$transaction as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  isAdmin.mockReset();
  subFind.mockReset();
  purchaseFind.mockReset();
  analysisCount.mockReset();
  memberCount.mockReset();
  inviteCount.mockReset();
  resvDeleteMany.mockReset();
  resvCount.mockReset();
  resvCreate.mockReset();
  resvDelete.mockReset();
  txn.mockReset();
  // Default interactive-transaction impl: run the callback with a tx that
  // reuses the top-level reservation/analysis mocks + a no-op advisory lock.
  resvDeleteMany.mockResolvedValue({ count: 0 });
  txn.mockImplementation(async (cb: (tx: unknown) => unknown) =>
    cb({
      $queryRaw: vi.fn().mockResolvedValue([]),
      analysis: { count: analysisCount },
      analysisReservation: { deleteMany: resvDeleteMany, count: resvCount, create: resvCreate },
    })
  );
});

describe('getUserPlan', () => {
  it('resolves admins to enterprise WITHOUT touching the DB', async () => {
    isAdmin.mockReturnValue(true);
    expect(await getUserPlan('admin-1')).toBe('enterprise');
    expect(subFind).not.toHaveBeenCalled();
  });

  it('returns the active subscription plan for a normal user', async () => {
    isAdmin.mockReturnValue(false);
    subFind.mockResolvedValue({ plan: 'pro' });
    expect(await getUserPlan('u1')).toBe('pro');
  });

  it('defaults to free when there is no active subscription', async () => {
    isAdmin.mockReturnValue(false);
    subFind.mockResolvedValue(null);
    expect(await getUserPlan('u1')).toBe('free');
  });

  it('defaults to free on a schema-drift / DB error', async () => {
    isAdmin.mockReturnValue(false);
    subFind.mockRejectedValue(new Error('drift'));
    expect(await getUserPlan('u1')).toBe('free');
  });
});

describe('checkAnalysisLimit', () => {
  it('bypasses subscription limits when an active container-audit purchase exists', async () => {
    purchaseFind.mockResolvedValue({ id: 'p1', status: 'active' });
    const r = await checkAnalysisLimit('u1', 'container-1');
    expect(r.allowed).toBe(true);
    expect(r.plan).toBe('enterprise');
    expect(r.limit).toBe(-1);
    expect(analysisCount).not.toHaveBeenCalled();
  });

  it('allows when monthly usage is below the plan cap', async () => {
    isAdmin.mockReturnValue(false);
    subFind.mockResolvedValue(null); // free plan
    analysisCount.mockResolvedValue(PLANS.free.analysesPerMonth - 1);
    const r = await checkAnalysisLimit('u1');
    expect(r.allowed).toBe(true);
    expect(r.plan).toBe('free');
  });

  it('blocks when monthly usage has reached the plan cap', async () => {
    isAdmin.mockReturnValue(false);
    subFind.mockResolvedValue(null);
    analysisCount.mockResolvedValue(PLANS.free.analysesPerMonth);
    const r = await checkAnalysisLimit('u1');
    expect(r.allowed).toBe(false);
  });

  it('FAILS CLOSED — denies when the usage count query errors', async () => {
    isAdmin.mockReturnValue(false);
    subFind.mockResolvedValue(null);
    analysisCount.mockRejectedValue(new Error('count failed'));
    const r = await checkAnalysisLimit('u1');
    expect(r.allowed).toBe(false);
  });
});

describe('checkTeamSizeLimit', () => {
  it('counts pending invites against the seat cap so it cannot be spammed past', async () => {
    isAdmin.mockReturnValue(false);
    subFind.mockResolvedValue({ plan: 'team' });
    const limit = PLANS.team.maxTeamMembers;
    memberCount.mockResolvedValue(limit - 1);
    inviteCount.mockResolvedValue(1); // member + pending invite == limit
    const r = await checkTeamSizeLimit('org-1');
    expect(r.used).toBe(limit);
    expect(r.allowed).toBe(false);
  });

  it('FAILS CLOSED — denies a new seat when the count query errors', async () => {
    isAdmin.mockReturnValue(false);
    subFind.mockResolvedValue({ plan: 'team' });
    memberCount.mockRejectedValue(new Error('count failed'));
    const r = await checkTeamSizeLimit('org-1');
    expect(r.allowed).toBe(false);
  });
});

describe('reserveAnalysisSlot', () => {
  it('reserves a slot and returns its id when under the cap', async () => {
    isAdmin.mockReturnValue(false);
    subFind.mockResolvedValue(null); // free plan, limit 4
    analysisCount.mockResolvedValue(1); // 1 persisted this month
    resvCount.mockResolvedValue(0); // no live reservations
    resvCreate.mockResolvedValue({ id: 'res-1' });
    const r = await reserveAnalysisSlot('u1');
    expect(r.allowed).toBe(true);
    expect(r.reservationId).toBe('res-1');
    expect(resvCreate).toHaveBeenCalledTimes(1);
  });

  it('counts live reservations toward the cap — closes the cost race', async () => {
    isAdmin.mockReturnValue(false);
    subFind.mockResolvedValue(null); // free, limit 4
    analysisCount.mockResolvedValue(2); // 2 persisted
    resvCount.mockResolvedValue(2); // + 2 in-flight reservations = 4 = limit
    const r = await reserveAnalysisSlot('u1');
    expect(r.allowed).toBe(false);
    expect(r.reservationId).toBeNull();
    expect(resvCreate).not.toHaveBeenCalled();
  });

  it('bypasses entirely for unlimited plans (no reservation row, no transaction)', async () => {
    isAdmin.mockReturnValue(true); // enterprise → Infinity cap
    const r = await reserveAnalysisSlot('admin-1');
    expect(r.allowed).toBe(true);
    expect(r.reservationId).toBeNull();
    expect(txn).not.toHaveBeenCalled();
  });

  it('sweeps stale reservations inside the lock before counting', async () => {
    isAdmin.mockReturnValue(false);
    subFind.mockResolvedValue(null);
    analysisCount.mockResolvedValue(0);
    resvCount.mockResolvedValue(0);
    resvCreate.mockResolvedValue({ id: 'res-2' });
    await reserveAnalysisSlot('u1');
    expect(resvDeleteMany).toHaveBeenCalled();
  });

  it('falls back to the legacy non-atomic check on schema drift (table not migrated)', async () => {
    isAdmin.mockReturnValue(false);
    subFind.mockResolvedValue(null);
    analysisCount.mockResolvedValue(1); // checkAnalysisLimit → allowed (1 < 4)
    txn.mockRejectedValue(Object.assign(new Error('relation does not exist'), { code: 'P2021' }));
    const r = await reserveAnalysisSlot('u1');
    expect(r.allowed).toBe(true); // legacy check allowed it
    expect(r.reservationId).toBeNull(); // no reservation on the fallback path
  });
});

describe('releaseAnalysisSlot', () => {
  it('deletes the reservation row by id', async () => {
    resvDelete.mockResolvedValue({});
    await releaseAnalysisSlot('res-1');
    expect(resvDelete).toHaveBeenCalledWith({ where: { id: 'res-1' } });
  });

  it('is a no-op for a null id (unlimited plan / nothing reserved)', async () => {
    await releaseAnalysisSlot(null);
    expect(resvDelete).not.toHaveBeenCalled();
  });

  it('swallows a missing-row delete (already swept by TTL) without throwing', async () => {
    resvDelete.mockRejectedValue(new Error('not found'));
    await expect(releaseAnalysisSlot('res-x')).resolves.toBeUndefined();
  });
});
