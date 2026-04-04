import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — declared before imports
// ---------------------------------------------------------------------------

const mockHeaders = new Map<string, string>();
let mockBodyJson: unknown = {};
let mockBodyShouldFail = false;

vi.mock('next/server', () => ({
  NextRequest: class {
    url: string;
    headers = {
      get: (key: string) => mockHeaders.get(key) || null,
    };
    json: () => Promise<unknown>;
    constructor(input?: string | URL) {
      this.url =
        typeof input === 'string'
          ? input
          : input?.toString() || 'http://localhost/api/analyze/stream';
      this.json = async () => {
        if (mockBodyShouldFail) throw new SyntaxError('Unexpected token');
        return mockBodyJson;
      };
    }
  },
  NextResponse: {
    json: (body: unknown, init?: { status?: number; headers?: Record<string, string> }) => ({
      json: async () => body,
      status: init?.status || 200,
      body,
      headers: new Map(Object.entries(init?.headers || {})),
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

const mockCheckAnalysisLimit = vi.fn();
vi.mock('@/lib/utils/plan-limits', () => ({
  checkAnalysisLimit: (...args: unknown[]) => mockCheckAnalysisLimit(...args),
}));

const mockCheckOutcomeGate = vi.fn();
vi.mock('@/lib/learning/outcome-gate', () => ({
  checkOutcomeGate: (...args: unknown[]) => mockCheckOutcomeGate(...args),
  formatOutcomeReminder: vi.fn().mockReturnValue('Please report outcomes'),
}));

const mockDocFindFirst = vi.fn();
const mockDocUpdateMany = vi.fn();
const mockAnalysisFindMany = vi.fn();
const mockCacheEntryFindUnique = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    document: {
      findFirst: (...args: unknown[]) => mockDocFindFirst(...args),
      updateMany: (...args: unknown[]) => mockDocUpdateMany(...args),
      update: vi.fn().mockResolvedValue({}),
    },
    analysis: {
      findMany: (...args: unknown[]) => mockAnalysisFindMany(...args),
      create: vi.fn().mockResolvedValue({ id: 'analysis_1', version: 1 }),
      update: vi.fn().mockResolvedValue({}),
    },
    biasInstance: { createMany: vi.fn().mockResolvedValue({ count: 0 }) },
    cacheEntry: {
      findUnique: (...args: unknown[]) => mockCacheEntryFindUnique(...args),
      upsert: vi.fn().mockResolvedValue({}),
    },
    failedAnalysis: { create: vi.fn().mockResolvedValue({}) },
    decisionEmbedding: { create: vi.fn().mockResolvedValue({}) },
    $transaction: vi.fn().mockImplementation((fn: unknown) => {
      if (typeof fn === 'function') return fn();
      if (Array.isArray(fn)) return Promise.all(fn);
      return Promise.resolve([]);
    }),
  },
}));

vi.mock('@/lib/utils/encryption', () => ({
  getDocumentContent: vi.fn().mockReturnValue('Mock document content for analysis'),
}));

// Mock the AI pipeline — return a minimal graph that won't actually run
vi.mock('@/lib/analysis/analyzer', () => ({
  getGraph: vi.fn().mockReturnValue({
    stream: vi.fn().mockImplementation(async function* () {
      yield { event: 'on_chain_end', data: { output: { overallScore: 75 } } };
    }),
    invoke: vi.fn().mockResolvedValue({ overallScore: 75 }),
  }),
  ProgressUpdate: class {},
}));

vi.mock('@/lib/sse', () => ({
  formatSSE: vi.fn().mockReturnValue('data: {}\n\n'),
  formatSSEHeartbeat: vi.fn().mockReturnValue(': heartbeat\n\n'),
}));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/utils/cost-tracker', () => ({
  trackApiUsage: vi.fn().mockResolvedValue(undefined),
  estimateCost: vi.fn().mockReturnValue(0.01),
}));

vi.mock('@/lib/utils/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

vi.mock('@/lib/utils/error', () => ({
  getSafeErrorMessage: vi.fn().mockReturnValue('An error occurred'),
}));

vi.mock('@/lib/utils/json', () => ({
  safeJsonClone: vi.fn().mockImplementation((v: unknown) => JSON.parse(JSON.stringify(v))),
}));

vi.mock('@/lib/utils/prisma-json', () => ({
  toPrismaJson: vi.fn().mockImplementation((v: unknown) => v),
}));

// Mock all analysis schemas as passthrough
vi.mock('@/lib/schemas/analysis', () => ({
  NoiseStatsSchema: { safeParse: vi.fn().mockReturnValue({ success: true, data: {} }) },
  FactCheckSchema: { safeParse: vi.fn().mockReturnValue({ success: true, data: {} }) },
  ComplianceSchema: { safeParse: vi.fn().mockReturnValue({ success: true, data: {} }) },
  SentimentSchema: { safeParse: vi.fn().mockReturnValue({ success: true, data: {} }) },
  LogicalSchema: { safeParse: vi.fn().mockReturnValue({ success: true, data: {} }) },
  SwotSchema: { safeParse: vi.fn().mockReturnValue({ success: true, data: {} }) },
  CognitiveSchema: { safeParse: vi.fn().mockReturnValue({ success: true, data: {} }) },
  SimulationSchema: { safeParse: vi.fn().mockReturnValue({ success: true, data: {} }) },
  MemorySchema: { safeParse: vi.fn().mockReturnValue({ success: true, data: {} }) },
  RecognitionCuesSchema: { safeParse: vi.fn().mockReturnValue({ success: true, data: {} }) },
  NarrativePreMortemSchema: { safeParse: vi.fn().mockReturnValue({ success: true, data: {} }) },
}));

import { POST } from './route';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body?: unknown) {
  mockBodyJson = body ?? {};
  const req = new NextRequest('http://localhost/api/analyze/stream');
  return req;
}

const MOCK_DOC = {
  id: 'doc_123',
  userId: 'user_123',
  filename: 'test.pdf',
  content: 'Some document content',
  status: 'pending',
  updatedAt: new Date(),
  contentEncrypted: null,
  contentIv: null,
  contentTag: null,
  dealId: null,
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockHeaders.clear();
  mockBodyJson = { documentId: 'doc_123' };
  mockBodyShouldFail = false;

  // Default: authenticated user
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user_123' } } });

  // Default: rate limit passes
  mockCheckRateLimit.mockResolvedValue({
    success: true,
    limit: 5,
    remaining: 4,
    reset: Math.floor(Date.now() / 1000) + 3600,
  });

  // Default: plan limit passes
  mockCheckAnalysisLimit.mockResolvedValue({
    allowed: true,
    plan: 'pro',
    used: 2,
    limit: 50,
  });

  // Default: outcome gate passes
  mockCheckOutcomeGate.mockResolvedValue({
    allowed: true,
    pendingCount: 0,
    pendingAnalysisIds: [],
    message: null,
  });

  // Default: document found
  mockDocFindFirst.mockResolvedValue({ ...MOCK_DOC });

  // Default: lock succeeds
  mockDocUpdateMany.mockResolvedValue({ count: 1 });

  // Default: no previous analyses
  mockAnalysisFindMany.mockResolvedValue([]);

  // Default: no cache
  mockCacheEntryFindUnique.mockResolvedValue(null);
});

// ---------------------------------------------------------------------------
// Tests — Gatekeeping layers
// ---------------------------------------------------------------------------

describe('POST /api/analyze/stream', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const res = await POST(makeRequest({ documentId: 'doc_123' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 429 when rate limited', async () => {
    mockCheckRateLimit.mockResolvedValue({
      success: false,
      limit: 5,
      remaining: 0,
      reset: Math.floor(Date.now() / 1000) + 3600,
    });

    const res = await POST(makeRequest({ documentId: 'doc_123' }));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain('Rate limit');
  });

  it('returns 429 with PLAN_LIMIT when monthly limit exceeded', async () => {
    mockCheckAnalysisLimit.mockResolvedValue({
      allowed: false,
      plan: 'free',
      used: 3,
      limit: 3,
    });

    const res = await POST(makeRequest({ documentId: 'doc_123' }));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.code).toBe('PLAN_LIMIT');
    expect(body.used).toBe(3);
    expect(body.limit).toBe(3);
  });

  it('returns 400 for invalid JSON body', async () => {
    mockBodyShouldFail = true;

    const res = await POST(makeRequest());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Invalid JSON');
  });

  it('returns 400 when documentId is missing', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Document ID');
  });

  it('returns 404 when document not found or not owned by user', async () => {
    mockDocFindFirst.mockResolvedValue(null);

    const res = await POST(makeRequest({ documentId: 'doc_nonexistent' }));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain('not found');
  });

  it('returns 423 with OUTCOME_GATE when too many unreported outcomes', async () => {
    mockCheckOutcomeGate.mockResolvedValue({
      allowed: false,
      pendingCount: 6,
      pendingAnalysisIds: ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'],
      message: 'You have 6 unreported outcomes',
    });

    const res = await POST(makeRequest({ documentId: 'doc_123' }));
    expect(res.status).toBe(423);
    const body = await res.json();
    expect(body.code).toBe('OUTCOME_GATE');
    expect(body.pendingOutcomes).toBe(6);
  });

  it('returns 409 when analysis is already in progress (fresh)', async () => {
    mockDocFindFirst.mockResolvedValue({
      ...MOCK_DOC,
      status: 'analyzing',
      updatedAt: new Date(), // just started
    });
    mockDocUpdateMany.mockResolvedValue({ count: 0 }); // lock fails

    const res = await POST(makeRequest({ documentId: 'doc_123' }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain('already in progress');
  });

  it('allows re-analysis when previous analysis is stale (>10min)', async () => {
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
    mockDocFindFirst.mockResolvedValue({
      ...MOCK_DOC,
      status: 'analyzing',
      updatedAt: fifteenMinAgo,
    });
    mockDocUpdateMany.mockResolvedValue({ count: 1 }); // lock succeeds (stale recovery)

    const res = await POST(makeRequest({ documentId: 'doc_123' }));

    // Should not be 409 — the stale analysis should be recovered
    // It should proceed to streaming (200 with ReadableStream)
    expect(res.status).not.toBe(409);
  });
});
