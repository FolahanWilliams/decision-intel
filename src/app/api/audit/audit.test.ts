import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// NextResponse is used both as a constructor (`new NextResponse(csv, ...)`)
// and as a namespace (`NextResponse.json(...)`), so the mock must handle both.
// vi.mock is hoisted, so we must define the class inside the factory.
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
        async json() { return this.body; }
        async text() { return String(this.body); }
        static json(body: unknown, init?: { status?: number }) {
            return new MockNextResponse(body, init);
        }
    }
    return {
        NextRequest: class {
            public url: string;
            private _body: unknown;
            constructor(url: string, init?: { method?: string; body?: string; headers?: Record<string, string> }) {
                this.url = url;
                this._body = init?.body ? JSON.parse(init.body) : null;
            }
            async json() { return this._body; }
        },
        NextResponse: MockNextResponse,
    };
});

const mockAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
    auth: () => mockAuth(),
}));

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
    mockAuth.mockResolvedValue({ userId: 'user_123' });
});

// ---------------------------------------------------------------------------
// POST /api/audit
// ---------------------------------------------------------------------------

describe('POST /api/audit', () => {
    it('returns 401 when unauthenticated', async () => {
        mockAuth.mockResolvedValue({ userId: null });

        const req = new NextRequest('http://localhost/api/audit', {
            method: 'POST',
            body: JSON.stringify({ action: 'VIEW', resource: 'Document', resourceId: 'doc1' }),
        });

        const res = await POST(req);
        expect(res.status).toBe(401);
    });

    it('logs audit event and returns success', async () => {
        mockLogAudit.mockResolvedValue(undefined);

        const payload = { action: 'VIEW', resource: 'Document', resourceId: 'doc1' };
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
            json: () => { throw new SyntaxError('Unexpected token'); },
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
            body: JSON.stringify({ action: 'VIEW', resource: 'Document', resourceId: 'doc1' }),
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
        mockAuth.mockResolvedValue({ userId: null });

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
                action: 'VIEW',
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
                action: 'VIEW',
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
