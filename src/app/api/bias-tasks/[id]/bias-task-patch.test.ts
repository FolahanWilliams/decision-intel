/**
 * BiasTask PATCH authorization-matrix lock.
 *
 * Codifies the per-field authorization gates against drift. A 2026-05-25
 * security audit flagged the outer-gate condition as effectively
 * read-permissive for any org member — claiming that other PATCH fields
 * (title / description / dueAt) gate ONLY on the outer check. That
 * claim was a false positive: every per-field write inside the handler
 * carries an explicit `isCreator || isOrgAdmin` (or stricter) gate that
 * fires BEFORE the prisma.update.
 *
 * This suite locks the matrix so any future regression — or a future
 * audit reading the same handler — has a passing-test contradiction
 * before raising the same flag.
 *
 * Authorization matrix (the design contract):
 *   - status       → assignee | creator | org admin
 *   - assigneeUserId (reassign) → creator | org admin
 *   - title        → creator | org admin
 *   - description  → creator | org admin
 *   - dueAt        → creator | org admin
 *   - resolutionNote → assignee | creator | org admin
 *
 * The outer gate (`!isCreator && !isAssignee && !isOrgAdmin && !isOrgMember`)
 * is a TENANT-ISOLATION floor — it rejects users with no relationship
 * to the task's org. It is not a write-permission gate. Per-field
 * gates downstream enforce actual write privileges.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks (mirror src/app/api/decision-priors/decision-priors.test.ts pattern)
// ---------------------------------------------------------------------------

vi.mock('next/server', () => {
  class MockNextResponse {
    status: number;
    body: unknown;
    headers: Map<string, string>;
    constructor(body: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      this.body = body;
      this.status = init?.status || 200;
      this.headers = new Map(Object.entries(init?.headers || {}));
    }
    async json() {
      return this.body;
    }
    static json(body: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      return new MockNextResponse(body, init);
    }
  }
  return {
    NextRequest: class {
      public url: string;
      public method: string;
      private _body: string | null;
      constructor(url: string, init?: { method?: string; body?: string }) {
        this.url = url;
        this.method = init?.method || 'GET';
        this._body = init?.body || null;
      }
      async json() {
        if (!this._body) throw new Error('No body');
        return JSON.parse(this._body);
      }
    },
    NextResponse: MockNextResponse,
  };
});

const mockGetUser = vi.fn();
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

const mockTaskFindUnique = vi.fn();
const mockTaskUpdate = vi.fn();
const mockTaskDelete = vi.fn();
const mockTeamMemberFindFirst = vi.fn();
vi.mock('@/lib/prisma', () => ({
  prisma: {
    biasTask: {
      findUnique: (...args: unknown[]) => mockTaskFindUnique(...args),
      update: (...args: unknown[]) => mockTaskUpdate(...args),
      delete: (...args: unknown[]) => mockTaskDelete(...args),
    },
    teamMember: {
      findFirst: (...args: unknown[]) => mockTeamMemberFindFirst(...args),
    },
  },
}));

vi.mock('@/lib/utils/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn(() => Promise.resolve()),
}));

import { NextRequest } from 'next/server';
import { PATCH } from './route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface TaskFixture {
  id: string;
  createdByUserId: string;
  assigneeUserId: string | null;
  orgId: string | null;
  biasInstanceId: string;
  status: string;
  title: string;
  description: string | null;
  dueAt: Date | null;
  resolvedAt: Date | null;
  resolutionNote: string | null;
}

function makeTask(overrides: Partial<TaskFixture> = {}): TaskFixture {
  return {
    id: 'task-1',
    createdByUserId: 'creator-user',
    assigneeUserId: 'assignee-user',
    orgId: 'org-1',
    biasInstanceId: 'bias-1',
    status: 'open',
    title: 'Investigate anchoring bias on the Q3 IC memo',
    description: null,
    dueAt: null,
    resolvedAt: null,
    resolutionNote: null,
    ...overrides,
  };
}

function makePatchRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/bias-tasks/task-1', {
    method: 'PATCH',
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

/**
 * Mock the teamMember.findFirst sequence the handler calls:
 *   1st call: userIsOrgAdmin check
 *   2nd call: userInOrg check (only if not admin)
 *   3rd call: reassignment "new assignee must be in org" check (only if reassigning)
 */
function mockMembership(input: {
  isAdmin?: boolean;
  isOrgMember?: boolean;
  newAssigneeInOrg?: boolean;
}) {
  mockTeamMemberFindFirst.mockReset();
  // 1st call: admin check
  if (input.isAdmin) {
    mockTeamMemberFindFirst.mockResolvedValueOnce({ id: 'member-row' });
  } else {
    mockTeamMemberFindFirst.mockResolvedValueOnce(null);
  }
  // 2nd call: member check (only fires when not admin)
  if (!input.isAdmin) {
    if (input.isOrgMember) {
      mockTeamMemberFindFirst.mockResolvedValueOnce({ id: 'member-row' });
    } else {
      mockTeamMemberFindFirst.mockResolvedValueOnce(null);
    }
  }
  // 3rd call: new-assignee-in-org check (only fires on reassignment)
  if (input.newAssigneeInOrg !== undefined) {
    if (input.newAssigneeInOrg) {
      mockTeamMemberFindFirst.mockResolvedValueOnce({ id: 'new-assignee-row' });
    } else {
      mockTeamMemberFindFirst.mockResolvedValueOnce(null);
    }
  }
}

const PATCH_PARAMS = { params: Promise.resolve({ id: 'task-1' }) };

// ---------------------------------------------------------------------------
// Auth + not-found floor
// ---------------------------------------------------------------------------

describe('PATCH /api/bias-tasks/:id — auth floor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await PATCH(makePatchRequest({ title: 'x' }), PATCH_PARAMS);
    expect(res.status).toBe(401);
  });

  it('returns 404 when task not found', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockTaskFindUnique.mockResolvedValue(null);
    const res = await PATCH(makePatchRequest({ title: 'x' }), PATCH_PARAMS);
    expect(res.status).toBe(404);
  });

  it('returns 400 when body is unparseable', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockTaskFindUnique.mockResolvedValue(makeTask());
    const req = new NextRequest('http://localhost/api/bias-tasks/task-1', {
      method: 'PATCH',
    }) as unknown as NextRequest;
    const res = await PATCH(req, PATCH_PARAMS);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Outer gate (tenant isolation) — random user with no relationship → 403
// ---------------------------------------------------------------------------

describe('PATCH /api/bias-tasks/:id — outer tenant-isolation gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'stranger-user' } } });
    mockTaskFindUnique.mockResolvedValue(makeTask());
  });

  it('returns 403 when caller has no relationship to the task (not creator / not assignee / not in org)', async () => {
    mockMembership({ isAdmin: false, isOrgMember: false });
    const res = await PATCH(makePatchRequest({ title: 'x' }), PATCH_PARAMS);
    expect(res.status).toBe(403);
    expect(mockTaskUpdate).not.toHaveBeenCalled();
  });

  it('returns 403 when task has no orgId AND caller is not creator/assignee (no org-member fallback)', async () => {
    mockTaskFindUnique.mockResolvedValue(makeTask({ orgId: null }));
    // userIsOrgAdmin + userInOrg both short-circuit to false when orgId is null
    const res = await PATCH(makePatchRequest({ title: 'x' }), PATCH_PARAMS);
    expect(res.status).toBe(403);
    expect(mockTaskUpdate).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// THE FALSE-POSITIVE PROOF — org member who is NOT creator/assignee/admin
// CANNOT edit title / description / dueAt / assignee / status. The audit
// claimed otherwise; these tests directly contradict that claim.
// ---------------------------------------------------------------------------

describe('PATCH /api/bias-tasks/:id — org member without creator/assignee/admin role', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'random-org-member' } } });
    mockTaskFindUnique.mockResolvedValue(makeTask());
    mockMembership({ isAdmin: false, isOrgMember: true });
  });

  it('returns 403 when org member (not creator) tries to edit title', async () => {
    const res = await PATCH(makePatchRequest({ title: 'pwned' }), PATCH_PARAMS);
    expect(res.status).toBe(403);
    expect(mockTaskUpdate).not.toHaveBeenCalled();
  });

  it('returns 403 when org member tries to edit description', async () => {
    const res = await PATCH(makePatchRequest({ description: 'pwned' }), PATCH_PARAMS);
    expect(res.status).toBe(403);
    expect(mockTaskUpdate).not.toHaveBeenCalled();
  });

  it('returns 403 when org member tries to set dueAt', async () => {
    const res = await PATCH(
      makePatchRequest({ dueAt: new Date('2027-01-01').toISOString() }),
      PATCH_PARAMS
    );
    expect(res.status).toBe(403);
    expect(mockTaskUpdate).not.toHaveBeenCalled();
  });

  it('returns 403 when org member tries to reassign', async () => {
    const res = await PATCH(makePatchRequest({ assigneeUserId: 'new-assignee' }), PATCH_PARAMS);
    expect(res.status).toBe(403);
    expect(mockTaskUpdate).not.toHaveBeenCalled();
  });

  it('returns 403 when org member (not assignee) tries to change status', async () => {
    const res = await PATCH(makePatchRequest({ status: 'resolved' }), PATCH_PARAMS);
    expect(res.status).toBe(403);
    expect(mockTaskUpdate).not.toHaveBeenCalled();
  });

  it('returns 400 "Nothing to update" when org member sends empty body (outer gate passes, no fields qualify)', async () => {
    // This is the only case where the outer gate IS effectively a pass for
    // org members — but the request still does nothing because no per-field
    // gate fires. Documents the intentional behavior: org members can ping
    // the endpoint but cannot WRITE without a tighter role.
    const res = await PATCH(makePatchRequest({}), PATCH_PARAMS);
    expect(res.status).toBe(400);
    expect(mockTaskUpdate).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Creator can edit anything (per the matrix)
// ---------------------------------------------------------------------------

describe('PATCH /api/bias-tasks/:id — creator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'creator-user' } } });
    mockTaskFindUnique.mockResolvedValue(makeTask());
    mockMembership({ isAdmin: false, isOrgMember: true });
    mockTaskUpdate.mockResolvedValue(makeTask());
  });

  it('creator can edit title', async () => {
    const res = await PATCH(makePatchRequest({ title: 'Sharpened title' }), PATCH_PARAMS);
    expect(res.status).toBe(200);
    expect(mockTaskUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ title: 'Sharpened title' }) })
    );
  });

  it('creator can edit description', async () => {
    const res = await PATCH(makePatchRequest({ description: 'New context' }), PATCH_PARAMS);
    expect(res.status).toBe(200);
    expect(mockTaskUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ description: 'New context' }) })
    );
  });

  it('creator can set dueAt', async () => {
    const dueAt = new Date('2027-01-01').toISOString();
    const res = await PATCH(makePatchRequest({ dueAt }), PATCH_PARAMS);
    expect(res.status).toBe(200);
    expect(mockTaskUpdate).toHaveBeenCalled();
  });

  it('creator can change status', async () => {
    const res = await PATCH(makePatchRequest({ status: 'resolved' }), PATCH_PARAMS);
    expect(res.status).toBe(200);
    expect(mockTaskUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'resolved' }),
      })
    );
  });

  it('creator can reassign (when new assignee is in org)', async () => {
    mockMembership({ isAdmin: false, isOrgMember: true, newAssigneeInOrg: true });
    const res = await PATCH(
      makePatchRequest({ assigneeUserId: 'new-assignee-user' }),
      PATCH_PARAMS
    );
    expect(res.status).toBe(200);
    expect(mockTaskUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ assigneeUserId: 'new-assignee-user' }),
      })
    );
  });

  it('creator cannot reassign to a non-org-member (400)', async () => {
    mockMembership({ isAdmin: false, isOrgMember: true, newAssigneeInOrg: false });
    const res = await PATCH(makePatchRequest({ assigneeUserId: 'outsider' }), PATCH_PARAMS);
    expect(res.status).toBe(400);
    expect(mockTaskUpdate).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Assignee — narrow: status + resolutionNote only
// ---------------------------------------------------------------------------

describe('PATCH /api/bias-tasks/:id — assignee', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'assignee-user' } } });
    mockTaskFindUnique.mockResolvedValue(makeTask());
    mockMembership({ isAdmin: false, isOrgMember: true });
    mockTaskUpdate.mockResolvedValue(makeTask());
  });

  it('assignee can change status', async () => {
    const res = await PATCH(makePatchRequest({ status: 'in_progress' }), PATCH_PARAMS);
    expect(res.status).toBe(200);
  });

  it('assignee can add resolutionNote', async () => {
    const res = await PATCH(
      makePatchRequest({ resolutionNote: 'Verified + fixed.' }),
      PATCH_PARAMS
    );
    expect(res.status).toBe(200);
  });

  it('assignee CANNOT edit title (creator/admin only)', async () => {
    const res = await PATCH(makePatchRequest({ title: 'pwned' }), PATCH_PARAMS);
    expect(res.status).toBe(403);
    expect(mockTaskUpdate).not.toHaveBeenCalled();
  });

  it('assignee CANNOT reassign (creator/admin only)', async () => {
    const res = await PATCH(makePatchRequest({ assigneeUserId: 'someone-else' }), PATCH_PARAMS);
    expect(res.status).toBe(403);
    expect(mockTaskUpdate).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Org admin — can do anything
// ---------------------------------------------------------------------------

describe('PATCH /api/bias-tasks/:id — org admin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-user' } } });
    mockTaskFindUnique.mockResolvedValue(makeTask());
    mockMembership({ isAdmin: true });
    mockTaskUpdate.mockResolvedValue(makeTask());
  });

  it('org admin can edit title', async () => {
    const res = await PATCH(makePatchRequest({ title: 'Admin-rewritten title' }), PATCH_PARAMS);
    expect(res.status).toBe(200);
  });

  it('org admin can reassign', async () => {
    mockMembership({ isAdmin: true, newAssigneeInOrg: true });
    const res = await PATCH(
      makePatchRequest({ assigneeUserId: 'new-assignee-user' }),
      PATCH_PARAMS
    );
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Status validation
// ---------------------------------------------------------------------------

describe('PATCH /api/bias-tasks/:id — status validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'creator-user' } } });
    mockTaskFindUnique.mockResolvedValue(makeTask());
    mockMembership({ isAdmin: false, isOrgMember: true });
  });

  it('rejects invalid status values (400)', async () => {
    const res = await PATCH(makePatchRequest({ status: 'invented_status' }), PATCH_PARAMS);
    expect(res.status).toBe(400);
    expect(mockTaskUpdate).not.toHaveBeenCalled();
  });
});
