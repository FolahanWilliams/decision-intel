import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mocks (hoisted to avoid TDZ issues) ───────────────────────────────────

const { mockGetUser, mockPrisma } = vi.hoisted(() => {
  const mockGetUser = vi.fn();
  const mockPrisma = {
    teamMember: { findFirst: vi.fn() },
    deal: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
  };
  return { mockGetUser, mockPrisma };
});

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(() => ({ auth: { getUser: mockGetUser } })),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

vi.mock('@/lib/utils/logger', () => ({
  createLogger: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn() }),
}));

import { POST, GET, PATCH } from './route';

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeRequest(method: string, body?: unknown, url?: string) {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  return new NextRequest(new URL(url || 'http://localhost/api/deals'), init);
}

const VALID_DEAL = {
  name: 'Acme Buyout',
  dealType: 'buyout',
  sector: 'Technology',
  ticketSize: 5_000_000,
};

const USER = { id: 'user-1', email: 'test@example.com' };

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: USER } });
  mockPrisma.teamMember.findFirst.mockResolvedValue({ orgId: 'org-1' });
});

// ─── POST /api/deals ───────────────────────────────────────────────────────

describe('POST /api/deals', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await POST(makeRequest('POST', VALID_DEAL));
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid JSON', async () => {
    const req = new NextRequest(new URL('http://localhost/api/deals'), {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid JSON');
  });

  it('returns 400 when name is missing', async () => {
    const res = await POST(makeRequest('POST', { dealType: 'buyout' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Validation failed');
    expect(data.details).toBeDefined();
  });

  it('returns 400 when dealType is invalid', async () => {
    const res = await POST(makeRequest('POST', { name: 'Test', dealType: 'invalid' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when name exceeds 200 chars', async () => {
    const res = await POST(makeRequest('POST', { name: 'x'.repeat(201), dealType: 'venture' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when ticketSize is negative', async () => {
    const res = await POST(
      makeRequest('POST', { name: 'Test', dealType: 'buyout', ticketSize: -1000 })
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when currency is not 3 chars', async () => {
    const res = await POST(
      makeRequest('POST', { name: 'Test', dealType: 'buyout', currency: 'US' })
    );
    expect(res.status).toBe(400);
  });

  it('creates deal with org membership and returns 201', async () => {
    const created = { id: 'deal-1', orgId: 'org-1', ...VALID_DEAL, stage: 'screening' };
    mockPrisma.deal.create.mockResolvedValue(created);

    const res = await POST(makeRequest('POST', VALID_DEAL));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBe('deal-1');
    expect(mockPrisma.deal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ orgId: 'org-1', name: 'Acme Buyout' }),
      })
    );
  });

  it('falls back to userId when no org membership', async () => {
    mockPrisma.teamMember.findFirst.mockResolvedValue(null);
    mockPrisma.deal.create.mockResolvedValue({ id: 'deal-2', orgId: 'user-1' });

    const res = await POST(makeRequest('POST', VALID_DEAL));
    expect(res.status).toBe(201);
    expect(mockPrisma.deal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ orgId: 'user-1' }),
      })
    );
  });

  it('falls back to userId on schema drift', async () => {
    mockPrisma.teamMember.findFirst.mockRejectedValue(new Error('P2021'));
    mockPrisma.deal.create.mockResolvedValue({ id: 'deal-3', orgId: 'user-1' });

    const res = await POST(makeRequest('POST', VALID_DEAL));
    expect(res.status).toBe(201);
    expect(mockPrisma.deal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ orgId: 'user-1' }),
      })
    );
  });

  it('defaults stage to screening and currency to USD', async () => {
    mockPrisma.deal.create.mockResolvedValue({ id: 'deal-4' });
    await POST(makeRequest('POST', { name: 'Test', dealType: 'venture' }));
    expect(mockPrisma.deal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ stage: 'screening', currency: 'USD' }),
      })
    );
  });

  it('returns 500 on database error', async () => {
    mockPrisma.deal.create.mockRejectedValue(new Error('DB down'));
    const res = await POST(makeRequest('POST', VALID_DEAL));
    expect(res.status).toBe(500);
  });
});

// ─── GET /api/deals ────────────────────────────────────────────────────────

describe('GET /api/deals', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await GET(makeRequest('GET', undefined, 'http://localhost/api/deals'));
    expect(res.status).toBe(401);
  });

  it('returns paginated deals with defaults', async () => {
    const deals = [{ id: 'deal-1', name: 'Deal A' }];
    mockPrisma.deal.findMany.mockResolvedValue(deals);
    mockPrisma.deal.count.mockResolvedValue(1);

    const res = await GET(makeRequest('GET', undefined, 'http://localhost/api/deals'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data).toHaveLength(1);
    expect(data.pagination).toMatchObject({ page: 1, limit: 50, total: 1 });
  });

  it('applies status filter', async () => {
    mockPrisma.deal.findMany.mockResolvedValue([]);
    mockPrisma.deal.count.mockResolvedValue(0);

    await GET(makeRequest('GET', undefined, 'http://localhost/api/deals?status=active'));
    expect(mockPrisma.deal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'active' }),
      })
    );
  });

  it('applies stage filter', async () => {
    mockPrisma.deal.findMany.mockResolvedValue([]);
    mockPrisma.deal.count.mockResolvedValue(0);

    await GET(makeRequest('GET', undefined, 'http://localhost/api/deals?stage=closing'));
    expect(mockPrisma.deal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ stage: 'closing' }),
      })
    );
  });

  it('applies dealType filter', async () => {
    mockPrisma.deal.findMany.mockResolvedValue([]);
    mockPrisma.deal.count.mockResolvedValue(0);

    await GET(makeRequest('GET', undefined, 'http://localhost/api/deals?dealType=venture'));
    expect(mockPrisma.deal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ dealType: 'venture' }),
      })
    );
  });

  it('caps limit at 100', async () => {
    mockPrisma.deal.findMany.mockResolvedValue([]);
    mockPrisma.deal.count.mockResolvedValue(0);

    const res = await GET(makeRequest('GET', undefined, 'http://localhost/api/deals?limit=500'));
    const data = await res.json();
    expect(data.pagination.limit).toBe(100);
  });

  it('handles custom page and limit', async () => {
    mockPrisma.deal.findMany.mockResolvedValue([]);
    mockPrisma.deal.count.mockResolvedValue(75);

    const res = await GET(
      makeRequest('GET', undefined, 'http://localhost/api/deals?page=3&limit=25')
    );
    const data = await res.json();
    expect(data.pagination).toMatchObject({ page: 3, limit: 25, total: 75, totalPages: 3 });
    expect(mockPrisma.deal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 50, take: 25 })
    );
  });

  it('returns 500 on database error', async () => {
    mockPrisma.deal.findMany.mockRejectedValue(new Error('DB down'));
    const res = await GET(makeRequest('GET', undefined, 'http://localhost/api/deals'));
    expect(res.status).toBe(500);
  });
});

// ─── PATCH /api/deals ──────────────────────────────────────────────────────

describe('PATCH /api/deals', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await PATCH(makeRequest('PATCH', { id: 'deal-1', name: 'Updated' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid JSON', async () => {
    const req = new NextRequest(new URL('http://localhost/api/deals'), {
      method: 'PATCH',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid JSON');
  });

  it('returns 400 when deal ID is missing', async () => {
    const res = await PATCH(makeRequest('PATCH', { name: 'Updated' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Deal ID required');
  });

  it('returns 400 on validation failure', async () => {
    const res = await PATCH(makeRequest('PATCH', { id: 'deal-1', ticketSize: -500 }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Validation failed');
  });

  it('returns 404 when deal not found', async () => {
    mockPrisma.deal.findFirst.mockResolvedValue(null);
    const res = await PATCH(makeRequest('PATCH', { id: 'deal-999', name: 'Updated' }));
    expect(res.status).toBe(404);
  });

  it('updates deal successfully', async () => {
    mockPrisma.deal.findFirst.mockResolvedValue({ id: 'deal-1', orgId: 'org-1' });
    mockPrisma.deal.updateMany.mockResolvedValue({ count: 1 });
    const updated = { id: 'deal-1', name: 'Updated Deal', orgId: 'org-1' };
    mockPrisma.deal.findUnique.mockResolvedValue(updated);

    const res = await PATCH(makeRequest('PATCH', { id: 'deal-1', name: 'Updated Deal' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBe('Updated Deal');
  });

  it('verifies ownership via orgId', async () => {
    mockPrisma.deal.findFirst.mockResolvedValue({ id: 'deal-1', orgId: 'org-1' });
    mockPrisma.deal.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.deal.findUnique.mockResolvedValue({ id: 'deal-1' });

    await PATCH(makeRequest('PATCH', { id: 'deal-1', name: 'Test' }));
    expect(mockPrisma.deal.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'deal-1', orgId: 'org-1' },
      })
    );
    expect(mockPrisma.deal.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'deal-1', orgId: 'org-1' },
      })
    );
  });

  it('handles status update', async () => {
    mockPrisma.deal.findFirst.mockResolvedValue({ id: 'deal-1', orgId: 'org-1' });
    mockPrisma.deal.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.deal.findUnique.mockResolvedValue({ id: 'deal-1', status: 'invested' });

    const res = await PATCH(makeRequest('PATCH', { id: 'deal-1', status: 'invested' }));
    expect(res.status).toBe(200);
  });

  it('returns 404 when updateMany matches 0 rows', async () => {
    mockPrisma.deal.findFirst.mockResolvedValue({ id: 'deal-1', orgId: 'org-1' });
    mockPrisma.deal.updateMany.mockResolvedValue({ count: 0 });

    const res = await PATCH(makeRequest('PATCH', { id: 'deal-1', name: 'Test' }));
    expect(res.status).toBe(404);
  });

  it('returns 500 on database error', async () => {
    mockPrisma.deal.findFirst.mockResolvedValue({ id: 'deal-1', orgId: 'org-1' });
    mockPrisma.deal.updateMany.mockRejectedValue(new Error('DB down'));

    const res = await PATCH(makeRequest('PATCH', { id: 'deal-1', name: 'Test' }));
    expect(res.status).toBe(500);
  });
});
