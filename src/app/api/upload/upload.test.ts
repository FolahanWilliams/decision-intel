import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — declared before imports
// ---------------------------------------------------------------------------

const mockHeaders = new Map<string, string>();

vi.mock('next/server', () => ({
  NextRequest: class {
    url: string;
    headers = {
      get: (key: string) => mockHeaders.get(key) || null,
    };
    formData: () => Promise<FormData>;
    constructor(input?: string | URL) {
      this.url = typeof input === 'string' ? input : input?.toString() || 'http://localhost/api/upload';
      this.formData = async () => new FormData();
    }
  },
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
  createClient: () =>
    Promise.resolve({
      auth: { getUser: () => mockGetUser() },
    }),
}));

const mockCheckRateLimit = vi.fn();
vi.mock('@/lib/utils/rate-limit', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
}));

const mockParseFile = vi.fn();
vi.mock('@/lib/utils/file-parser', () => ({
  parseFile: (...args: unknown[]) => mockParseFile(...args),
}));

const mockDocCreate = vi.fn();
const mockDocFindFirst = vi.fn();
const mockDocFindMany = vi.fn();
const mockDocDelete = vi.fn();
const mockDocCount = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    document: {
      create: (...args: unknown[]) => mockDocCreate(...args),
      findFirst: (...args: unknown[]) => mockDocFindFirst(...args),
      findMany: (...args: unknown[]) => mockDocFindMany(...args),
      delete: (...args: unknown[]) => mockDocDelete(...args),
      count: (...args: unknown[]) => mockDocCount(...args),
    },
  },
}));

const mockSupabaseUpload = vi.fn();
vi.mock('@/lib/supabase', () => ({
  getServiceSupabase: () => ({
    storage: {
      from: () => ({
        upload: (...args: unknown[]) => mockSupabaseUpload(...args),
      }),
    },
  }),
}));

import { POST, GET } from './route';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockRequest(file?: File) {
  const formData = new FormData();
  if (file) formData.append('file', file);

  const req = new NextRequest('http://localhost/api/upload') as NextRequest & {
    formData: () => Promise<FormData>;
  };
  req.formData = async () => formData;
  return req;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user_123' } } });
  mockCheckRateLimit.mockResolvedValue({
    success: true,
    limit: 5,
    remaining: 4,
    reset: Date.now(),
  });
  mockDocFindFirst.mockResolvedValue(null); // no cache hit
  mockSupabaseUpload.mockResolvedValue({ error: null });
  mockHeaders.clear();
  mockHeaders.set('x-forwarded-for', '127.0.0.1');
});

// ---------------------------------------------------------------------------
// POST /api/upload
// ---------------------------------------------------------------------------

describe('POST /api/upload', () => {
  it('returns 429 when rate limited', async () => {
    mockCheckRateLimit.mockResolvedValue({
      success: false,
      limit: 5,
      remaining: 0,
      reset: Date.now() + 3600,
    });

    const req = createMockRequest(new File(['test'], 'test.txt', { type: 'text/plain' }));
    const res = await POST(req);

    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain('Rate limit');
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const req = createMockRequest(new File(['test'], 'test.txt', { type: 'text/plain' }));
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('returns 400 when no file provided', async () => {
    const req = createMockRequest(); // no file
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('No file provided');
  });

  it('returns 400 for files over 5MB', async () => {
    const bigContent = new Uint8Array(6 * 1024 * 1024); // 6MB
    const file = new File([bigContent], 'big.txt', { type: 'text/plain' });

    const req = createMockRequest(file);
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('File too large');
  });

  it('returns 400 for unsupported file types', async () => {
    const file = new File(['test'], 'image.png', { type: 'image/png' });

    const req = createMockRequest(file);
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Invalid file type');
  });

  it('returns cached result if document was already analyzed', async () => {
    mockDocFindFirst.mockResolvedValue({
      id: 'doc_cached',
      filename: 'cached.txt',
      status: 'complete',
      analyses: [{ overallScore: 85 }],
    });

    const file = new File(['cached content'], 'cached.txt', { type: 'text/plain' });
    const req = createMockRequest(file);
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.cached).toBe(true);
    expect(body.id).toBe('doc_cached');
  });

  it('uploads and creates document successfully', async () => {
    mockParseFile.mockResolvedValue('This is the extracted document content');
    mockDocCreate.mockResolvedValue({
      id: 'doc_new',
      filename: 'test.txt',
      status: 'pending',
    });

    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const req = createMockRequest(file);
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('doc_new');
    expect(body.status).toBe('pending');
  });

  it('returns 400 when document is empty after parsing', async () => {
    mockParseFile.mockResolvedValue('   '); // whitespace only

    const file = new File([''], 'empty.txt', { type: 'text/plain' });
    const req = createMockRequest(file);
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('empty');
  });

  it('handles schema drift on create (P2022) by falling back', async () => {
    mockParseFile.mockResolvedValue('Valid content for analysis');
    const schemaDriftError = new Error('Column not found') as Error & { code: string };
    schemaDriftError.code = 'P2022';

    mockDocCreate
      .mockRejectedValueOnce(schemaDriftError)
      .mockResolvedValueOnce({ id: 'doc_fallback', filename: 'test.txt', status: 'pending' });

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const req = createMockRequest(file);
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockDocCreate).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// GET /api/upload (document list)
// ---------------------------------------------------------------------------

describe('GET /api/upload', () => {
  function createGetRequest(params?: Record<string, string>) {
    const url = new URL('http://localhost/api/upload');
    if (params) {
      for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    }
    return new NextRequest(url);
  }

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const res = await GET(createGetRequest());
    expect(res.status).toBe(401);
  });

  it('returns user documents with pagination', async () => {
    mockDocFindMany.mockResolvedValue([{ id: 'doc1', filename: 'test.pdf', status: 'complete' }]);
    mockDocCount.mockResolvedValue(1);

    const res = await GET(createGetRequest());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].filename).toBe('test.pdf');
    expect(body.pagination).toEqual({ page: 1, limit: 50, total: 1, totalPages: 1 });
  });
});
