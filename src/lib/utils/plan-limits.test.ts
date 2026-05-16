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
  },
}));
vi.mock('./admin', () => ({ isAdminUserId: vi.fn() }));
vi.mock('./logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { prisma } from '@/lib/prisma';
import { isAdminUserId } from './admin';
import { getUserPlan, checkAnalysisLimit, checkTeamSizeLimit } from './plan-limits';
import { PLANS } from '@/lib/stripe';

const isAdmin = isAdminUserId as unknown as ReturnType<typeof vi.fn>;
const subFind = prisma.subscription.findFirst as unknown as ReturnType<typeof vi.fn>;
const purchaseFind = prisma.decisionContainerAuditPurchase
  .findFirst as unknown as ReturnType<typeof vi.fn>;
const analysisCount = prisma.analysis.count as unknown as ReturnType<typeof vi.fn>;
const memberCount = prisma.teamMember.count as unknown as ReturnType<typeof vi.fn>;
const inviteCount = prisma.teamInvite.count as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  isAdmin.mockReset();
  subFind.mockReset();
  purchaseFind.mockReset();
  analysisCount.mockReset();
  memberCount.mockReset();
  inviteCount.mockReset();
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
