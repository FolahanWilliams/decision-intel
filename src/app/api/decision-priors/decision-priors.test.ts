import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
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
      public nextUrl: URL;
      private _body: string | null;
      constructor(url: string, init?: { method?: string; body?: string }) {
        this.url = url;
        this.method = init?.method || 'GET';
        this.nextUrl = new URL(url);
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

const mockFindUnique = vi.fn();
const mockUpsert = vi.fn();
const mockUpdate = vi.fn();
const mockAnalysisFindUnique = vi.fn();
vi.mock('@/lib/prisma', () => ({
  prisma: {
    decisionPrior: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      upsert: (...args: unknown[]) => mockUpsert(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    analysis: {
      findUnique: (...args: unknown[]) => mockAnalysisFindUnique(...args),
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

import { NextRequest } from 'next/server';
import { GET, POST, PATCH } from './route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/decision-priors');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new NextRequest(url.toString()) as unknown as Parameters<typeof GET>[0];
}

function makePostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/decision-priors', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0];
}

function makePatchRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/decision-priors', {
    method: 'PATCH',
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof PATCH>[0];
}

// ---------------------------------------------------------------------------
// Tests — GET
// ---------------------------------------------------------------------------

describe('GET /api/decision-priors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  });

  it('returns prior when found and owned by user', async () => {
    const prior = {
      id: 'prior-1',
      analysisId: 'analysis-1',
      userId: 'user-1',
      defaultAction: 'proceed',
      confidence: 80,
      evidenceToChange: null,
    };
    mockFindUnique.mockResolvedValue(prior);

    const res = await GET(makeGetRequest({ analysisId: 'analysis-1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.prior).toEqual(prior);
  });

  it('returns { prior: null } when not found', async () => {
    mockFindUnique.mockResolvedValue(null);

    const res = await GET(makeGetRequest({ analysisId: 'analysis-1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.prior).toBeNull();
  });

  it('returns { prior: null } when owned by different user', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'prior-1',
      analysisId: 'analysis-1',
      userId: 'other-user',
      defaultAction: 'proceed',
      confidence: 80,
    });

    const res = await GET(makeGetRequest({ analysisId: 'analysis-1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.prior).toBeNull();
  });

  it('returns 400 when analysisId missing', async () => {
    const res = await GET(makeGetRequest());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('analysisId');
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const res = await GET(makeGetRequest({ analysisId: 'analysis-1' }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('handles schema drift (P2021 error)', async () => {
    const err = new Error('The table does not exist in the current database');
    (err as unknown as Record<string, string>).code = 'P2021';
    mockFindUnique.mockRejectedValue(err);

    const res = await GET(makeGetRequest({ analysisId: 'analysis-1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.prior).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tests — POST
// ---------------------------------------------------------------------------

describe('POST /api/decision-priors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  });

  it('creates prior with valid data, returns { id }', async () => {
    mockAnalysisFindUnique.mockResolvedValue({ document: { userId: 'user-1' } });
    mockUpsert.mockResolvedValue({ id: 'prior-1' });

    const res = await POST(
      makePostRequest({
        analysisId: 'analysis-1',
        defaultAction: 'proceed',
        confidence: 75,
        evidenceToChange: 'strong data showing otherwise',
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('prior-1');
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { analysisId: 'analysis-1' },
        create: expect.objectContaining({
          analysisId: 'analysis-1',
          userId: 'user-1',
          defaultAction: 'proceed',
          confidence: 75,
          evidenceToChange: 'strong data showing otherwise',
        }),
      })
    );
  });

  it('returns 400 when required fields missing', async () => {
    const res = await POST(makePostRequest({ analysisId: 'analysis-1' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Missing required fields');
  });

  it('returns 400 when confidence out of range', async () => {
    const res = await POST(
      makePostRequest({
        analysisId: 'analysis-1',
        defaultAction: 'proceed',
        confidence: 150,
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('confidence');
  });
});

// ---------------------------------------------------------------------------
// Tests — PATCH
// ---------------------------------------------------------------------------

describe('PATCH /api/decision-priors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  });

  it('updates with postAnalysisAction, returns beliefDelta', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'prior-1',
      analysisId: 'analysis-1',
      userId: 'user-1',
      defaultAction: 'proceed',
      confidence: 80,
    });
    mockUpdate.mockResolvedValue({ id: 'prior-1', beliefDelta: 80 });

    const res = await PATCH(
      makePatchRequest({
        analysisId: 'analysis-1',
        postAnalysisAction: 'abort',
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('prior-1');
    expect(body.beliefDelta).toBe(80);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { analysisId: 'analysis-1' },
        data: { postAnalysisAction: 'abort', beliefDelta: 80 },
      })
    );
  });

  it('returns 404 when no prior exists', async () => {
    mockFindUnique.mockResolvedValue(null);

    const res = await PATCH(
      makePatchRequest({
        analysisId: 'analysis-1',
        postAnalysisAction: 'abort',
      })
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain('No prior found');
  });
});
