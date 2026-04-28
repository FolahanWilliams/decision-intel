import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// NextResponse is used both as a constructor (`new NextResponse(csv, ...)`)
// and as a namespace (`NextResponse.json(...)`), so the mock must handle both.
// vi.mock factories are hoisted above imports, so we use vi.hoisted() to load
// the shared helpers in a way that's also hoisted. See @/test-utils/next-server-mock.
const { nextServerMockFactory, supabaseServerMockFactory } = await vi.hoisted(async () => ({
  nextServerMockFactory: (await import('@/test-utils/next-server-mock')).nextServerMockFactory,
  supabaseServerMockFactory: (await import('@/test-utils/supabase-server-mock'))
    .supabaseServerMockFactory,
}));
vi.mock('next/server', nextServerMockFactory);

const mockGetUser = vi.fn();
vi.mock('@/utils/supabase/server', () => supabaseServerMockFactory(() => mockGetUser));

const mockLogAudit = vi.fn();
vi.mock('@/lib/audit', () => ({
  logAudit: (...args: unknown[]) => mockLogAudit(...args),
}));

const mockFindMany = vi.fn();
vi.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

import { POST, GET } from './route';

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user_123' } } });
});

// ---------------------------------------------------------------------------
// POST /api/audit
// ---------------------------------------------------------------------------

describe('POST /api/audit', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const req = new NextRequest('http://localhost/api/audit', {
      method: 'POST',
      body: JSON.stringify({ action: 'VIEW_DOCUMENT', resource: 'Document', resourceId: 'doc1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('logs audit event and returns success', async () => {
    mockLogAudit.mockResolvedValue(undefined);

    const payload = { action: 'VIEW_DOCUMENT', resource: 'Document', resourceId: 'doc1' };
    const req = new NextRequest('http://localhost/api/audit', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockLogAudit).toHaveBeenCalledWith(payload);
  });

  it('returns 400 for invalid JSON body', async () => {
    // Create a request whose json() will throw
    const req = {
      json: () => {
        throw new SyntaxError('Unexpected token');
      },
    } as unknown as NextRequest;

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain('Invalid JSON');
  });

  it('returns 500 when logAudit fails', async () => {
    mockLogAudit.mockRejectedValue(new Error('DB error'));

    const req = new NextRequest('http://localhost/api/audit', {
      method: 'POST',
      body: JSON.stringify({ action: 'VIEW_DOCUMENT', resource: 'Document', resourceId: 'doc1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// GET /api/audit
// ---------------------------------------------------------------------------

describe('GET /api/audit', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const req = new NextRequest('http://localhost/api/audit?export=csv');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when export param is not csv', async () => {
    const req = new NextRequest('http://localhost/api/audit?export=json');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns CSV with correct headers', async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 'log1',
        action: 'VIEW_DOCUMENT',
        resource: 'Document',
        resourceId: 'doc1',
        ipAddress: '127.0.0.1',
        createdAt: new Date('2026-01-15T10:00:00Z'),
      },
    ]);

    const req = new NextRequest('http://localhost/api/audit?export=csv');
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it('escapes CSV fields containing commas', async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 'log1',
        action: 'VIEW_DOCUMENT',
        resource: 'Document,Special',
        resourceId: 'doc1',
        ipAddress: '127.0.0.1',
        createdAt: new Date('2026-01-15T10:00:00Z'),
      },
    ]);

    const req = new NextRequest('http://localhost/api/audit?export=csv');
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it('returns 500 on DB error', async () => {
    mockFindMany.mockRejectedValue(new Error('DB error'));

    const req = new NextRequest('http://localhost/api/audit?export=csv');
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});
