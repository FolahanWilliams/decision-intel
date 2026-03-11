import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — must be declared before any imports that use them
// ---------------------------------------------------------------------------

vi.mock('next/server', () => ({
    NextResponse: {
        json: (body: unknown, init?: { status?: number }) => ({
            json: async () => body,
            status: init?.status || 200,
            body,
        }),
    },
}));

const mockGetUser = vi.fn();
vi.mock('@/utils/supabase/server', () => ({
    createClient: () => Promise.resolve({
        auth: { getUser: () => mockGetUser() },
    }),
}));

const mockFindMany = vi.fn();
const mockCount = vi.fn();

vi.mock('@/lib/prisma', () => ({
    prisma: {
        document: {
            findMany: (...args: unknown[]) => mockFindMany(...args),
            count: (...args: unknown[]) => mockCount(...args),
        },
    },
}));

import { GET } from './route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(url = 'http://localhost/api/documents') {
    return new Request(url);
}

beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user_123' } } });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/documents', () => {
    it('returns 401 when unauthenticated', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null } });

        const res = await GET(makeRequest());
        expect(res.status).toBe(401);

        const body = await res.json();
        expect(body.error).toBe('Unauthorized');
    });

    it('returns paginated documents for authenticated user', async () => {
        const docs = [
            { id: 'doc1', filename: 'test.pdf', status: 'complete', fileSize: 1024, uploadedAt: new Date(), analyses: [{ overallScore: 80 }] },
        ];
        mockFindMany.mockResolvedValue(docs);
        mockCount.mockResolvedValue(1);

        const res = await GET(makeRequest('http://localhost/api/documents?page=1&limit=10'));
        expect(res.status).toBe(200);

        const body = await res.json();
        expect(body.documents).toHaveLength(1);
        expect(body.documents[0].score).toBe(80);
        expect(body.total).toBe(1);
        expect(body.page).toBe(1);
    });

    it('handles pagination parameters', async () => {
        mockFindMany.mockResolvedValue([]);
        mockCount.mockResolvedValue(0);

        await GET(makeRequest('http://localhost/api/documents?page=2&limit=5'));

        expect(mockFindMany).toHaveBeenCalledWith(
            expect.objectContaining({
                skip: 5,
                take: 5,
            })
        );
    });

    it('clamps limit to valid range (1-100)', async () => {
        mockFindMany.mockResolvedValue([]);
        mockCount.mockResolvedValue(0);

        await GET(makeRequest('http://localhost/api/documents?limit=500'));

        expect(mockFindMany).toHaveBeenCalledWith(
            expect.objectContaining({
                take: 100,
            })
        );
    });

    it('handles schema drift (P2022) by falling back to core fields', async () => {
        const error = new Error('Column not found') as Error & { code: string };
        error.code = 'P2022';
        mockFindMany
            .mockRejectedValueOnce(error)
            .mockResolvedValueOnce([{ id: 'doc1', filename: 'test.pdf', status: 'complete', fileSize: 1024, uploadedAt: new Date(), analyses: [{ overallScore: 70 }] }]);
        mockCount.mockResolvedValue(1);

        const res = await GET(makeRequest('http://localhost/api/documents?detailed=true'));
        expect(res.status).toBe(200);

        // findMany called twice: first attempt (fails), then fallback
        expect(mockFindMany).toHaveBeenCalledTimes(2);
    });

    it('returns 500 on unexpected DB error', async () => {
        mockFindMany.mockRejectedValue(new Error('Connection refused'));
        // count should not be called if findMany fails with non-schema error
        // but since they're in Promise.all, both will be called
        mockCount.mockResolvedValue(0);

        const res = await GET(makeRequest());
        expect(res.status).toBe(500);

        const body = await res.json();
        expect(body.error).toBe('Failed to fetch documents');
    });
});
