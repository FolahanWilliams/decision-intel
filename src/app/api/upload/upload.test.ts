import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — declared before imports
// ---------------------------------------------------------------------------

// Shared Supabase mock factory — see @/test-utils/supabase-server-mock.
const { supabaseServerMockFactory } = await vi.hoisted(async () => ({
  supabaseServerMockFactory: (await import('@/test-utils/supabase-server-mock'))
    .supabaseServerMockFactory,
}));

const mockHeaders = new Map<string, string>();

vi.mock('next/server', () => ({
  NextRequest: class {
    url: string;
    headers = {
      get: (key: string) => mockHeaders.get(key) || null,
    };
    formData: () => Promise<FormData>;
    constructor(input?: string | URL) {
      this.url =
        typeof input === 'string' ? input : input?.toString() || 'http://localhost/api/upload';
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
  // after() is a no-op in tests; the route calls it with a promise that
  // we don't need to resolve during unit testing of the response shape.
  after: (_promise: unknown) => undefined,
}));

const mockGetUser = vi.fn();
vi.mock('@/utils/supabase/server', () => supabaseServerMockFactory(() => mockGetUser));

const mockCheckRateLimit = vi.fn();
vi.mock('@/lib/utils/rate-limit', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
}));

const mockCheckAnalysisLimit = vi.fn();
const mockGetUserPlan = vi.fn();
vi.mock('@/lib/utils/plan-limits', () => ({
  checkAnalysisLimit: (...args: unknown[]) => mockCheckAnalysisLimit(...args),
  // getUserPlan added 2026-05-26 (soft-limit pass) — the upload route
  // now uses it to look up per-plan maxUploadMB. Default mock returns
  // 'pro' so tests exercise the wedge-tier 100MB cap by default; the
  // size-rejection test bumps to 100MB+ to fire the gate cleanly.
  getUserPlan: (...args: unknown[]) => mockGetUserPlan(...args),
}));

const mockParseFile = vi.fn();
const mockExtractTypeAwareStructuredData = vi.fn();
vi.mock('@/lib/utils/file-parser', () => ({
  parseFile: (...args: unknown[]) => mockParseFile(...args),
  // Type-aware structured-data extraction was added to the upload route
  // in the 2026-05-09 synergy-parser ship. The test mock factory replaces
  // the whole module, so the export must be stubbed here too — otherwise
  // the call site throws and every upload test 400s. Default returns
  // null (no structured parser matched / not applicable).
  extractTypeAwareStructuredData: (...args: unknown[]) =>
    mockExtractTypeAwareStructuredData(...args),
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
  mockCheckAnalysisLimit.mockResolvedValue({
    allowed: true,
    plan: 'free',
    used: 0,
    limit: 10,
  });
  // Default plan = 'pro' (the wedge tier, 100MB cap). Per-test
  // overrides cover the size-rejection edge case (Free 25MB cap)
  // and the 'team' tier sanity check.
  mockGetUserPlan.mockResolvedValue('pro');
  mockDocFindFirst.mockResolvedValue(null); // no cache hit
  mockSupabaseUpload.mockResolvedValue({ error: null });
  // Default: no structured-data extraction matched (covers every test
  // except the synergy-model upload path, which can override per-test).
  mockExtractTypeAwareStructuredData.mockResolvedValue(null);
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

  it('returns 413 when file exceeds the Free-tier 25MB cap', async () => {
    // Per-plan ladder locked 2026-05-26 (soft-limit pass) — Free 25MB
    // / Pro 100MB / Team 250MB / Enterprise 500MB. Override the default
    // 'pro' plan mock to 'free' to exercise the 25MB cap cleanly.
    mockGetUserPlan.mockResolvedValueOnce('free');
    const bigContent = new Uint8Array(26 * 1024 * 1024); // 26MB
    const file = new File([bigContent], 'big.txt', { type: 'text/plain' });

    const req = createMockRequest(file);
    const res = await POST(req);

    expect(res.status).toBe(413);
    const body = await res.json();
    expect(body.error).toContain('File too large');
    expect(body.error).toContain('Free plan cap is 25MB');
    expect(body.error).toContain('Upgrade to Individual');
  });

  it('returns 413 when file exceeds the Pro-tier 100MB cap', async () => {
    // Pro tier accepts files up to 100MB; bumping to 101MB triggers
    // the gate. Default mock = 'pro' so no override needed.
    const bigContent = new Uint8Array(101 * 1024 * 1024); // 101MB
    const file = new File([bigContent], 'big.txt', { type: 'text/plain' });

    const req = createMockRequest(file);
    const res = await POST(req);

    expect(res.status).toBe(413);
    const body = await res.json();
    expect(body.error).toContain('Individual plan cap is 100MB');
    expect(body.error).toContain('Upgrade to Strategy');
  });

  it('accepts files up to the Pro-tier 100MB cap', async () => {
    // Boundary case: a 90MB file should pass the size gate for a Pro
    // user. The test intentionally uses raw bytes that aren't parseable
    // by parseFile() so it'll fail downstream — what we're verifying
    // here is the size check no longer rejects 25-100MB files for Pro.
    const content = new Uint8Array(90 * 1024 * 1024); // 90MB
    const file = new File([content], 'big.txt', { type: 'text/plain' });

    const req = createMockRequest(file);
    const res = await POST(req);

    // Won't be 413 — past the size gate. Downstream may 400/500 on parse,
    // but the size gate is the contract this test locks.
    expect(res.status).not.toBe(413);
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

  it('allows uploads even when monthly analysis limit is exceeded', async () => {
    // Uploads are now decoupled from the analysis quota — users can store
    // documents freely and only hit the plan limit at analysis time.
    mockCheckAnalysisLimit.mockResolvedValue({
      allowed: false,
      plan: 'free',
      used: 3,
      limit: 3,
    });
    mockParseFile.mockResolvedValue('Valid content for analysis');
    mockDocCreate.mockResolvedValue({
      id: 'doc_over_quota',
      filename: 'test.txt',
      status: 'pending',
    });

    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const req = createMockRequest(file);
    const res = await POST(req);

    // Must not return a plan-limit rejection — upload succeeds regardless.
    expect(res.status).not.toBe(429);
    if (res.status >= 400) {
      const body = await res.json().catch(() => ({}));
      expect(body.code).not.toBe('PLAN_LIMIT');
    }
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
