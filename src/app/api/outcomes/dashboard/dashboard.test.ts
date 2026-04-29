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
      public nextUrl: URL;
      constructor(url: string) {
        this.url = url;
        this.nextUrl = new URL(url);
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

const mockFindFirst = vi.fn();
const mockFindMany = vi.fn();
const mockGroupBy = vi.fn();
const mockAggregate = vi.fn();
const mockQueryRaw = vi.fn();
vi.mock('@/lib/prisma', () => ({
  prisma: {
    teamMember: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
    decisionOutcome: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      groupBy: (...args: unknown[]) => mockGroupBy(...args),
      aggregate: (...args: unknown[]) => mockAggregate(...args),
    },
    decisionPrior: { findMany: vi.fn().mockResolvedValue([]) },
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
  },
}));

vi.mock('@/lib/utils/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { NextRequest } from 'next/server';
import { GET } from './route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/outcomes/dashboard');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new NextRequest(url.toString()) as unknown as Parameters<typeof GET>[0];
}

function makeOutcome(overrides: Record<string, unknown> = {}) {
  return {
    analysisId: `a-${Math.random().toString(36).slice(2)}`,
    outcome: 'success',
    impactScore: 75,
    confirmedBiases: [],
    falsePositiveBiases: [],
    mostAccurateTwin: null,
    reportedAt: new Date(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/outcomes/dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockFindFirst.mockResolvedValue({ orgId: 'org-1' });
    mockFindMany.mockResolvedValue([]);
    mockGroupBy.mockResolvedValue([]);
    mockAggregate.mockResolvedValue({ _avg: { impactScore: null } });
    mockQueryRaw.mockResolvedValue([]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await GET(makeRequest());
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns correct DashboardData shape with empty data', async () => {
    const res = await GET(makeRequest());
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toHaveProperty('kpis');
    expect(body).toHaveProperty('calibration');
    expect(body).toHaveProperty('biasCosts');
    expect(body).toHaveProperty('personaLeaderboard');
    expect(body).toHaveProperty('pendingOutcomes');
    expect(body.kpis).toEqual({
      accuracyRate: 0,
      avgImpactScore: 0,
      decisionsTracked: 0,
      biasDetectionAccuracy: 0,
    });
    expect(body.calibration).toEqual([]);
    expect(body.biasCosts).toEqual([]);
    expect(body.personaLeaderboard).toEqual([]);
    expect(body.pendingOutcomes).toBe(0);
  });

  it('computes KPIs correctly', async () => {
    // groupBy returns per-outcome counts
    mockGroupBy.mockImplementation(async (args: Record<string, unknown>) => {
      const by = args.by as string[];
      if (by.includes('mostAccurateTwin')) return []; // twin leaderboard call
      return [
        { outcome: 'success', _count: { id: 1 } },
        { outcome: 'failure', _count: { id: 1 } },
        { outcome: 'partial_success', _count: { id: 1 } },
        { outcome: 'too_early', _count: { id: 1 } },
      ];
    });
    mockAggregate.mockResolvedValue({ _avg: { impactScore: 56.6667 } });
    mockFindMany.mockResolvedValue([
      makeOutcome({
        outcome: 'success',
        impactScore: 80,
        confirmedBiases: ['anchoring'],
        falsePositiveBiases: ['sunk_cost'],
      }),
      makeOutcome({
        outcome: 'failure',
        impactScore: 30,
        confirmedBiases: ['anchoring'],
        falsePositiveBiases: [],
      }),
      makeOutcome({
        outcome: 'partial_success',
        impactScore: 60,
        confirmedBiases: [],
        falsePositiveBiases: [],
      }),
      makeOutcome({
        outcome: 'too_early',
        impactScore: null,
        confirmedBiases: [],
        falsePositiveBiases: [],
      }),
    ]);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.kpis.decisionsTracked).toBe(4);
    // success + partial_success = 2 out of 4 = 50%
    expect(body.kpis.accuracyRate).toBe(50);
    // (80 + 30 + 60) / 3 = 56.67 → 57
    expect(body.kpis.avgImpactScore).toBe(57);
    // confirmed: 2, false positive: 1 → 2/3 = 66.67 → 67%
    expect(body.kpis.biasDetectionAccuracy).toBe(67);
  });

  it('computes bias cost deltas correctly', async () => {
    mockGroupBy.mockImplementation(async (args: Record<string, unknown>) => {
      const by = args.by as string[];
      if (by.includes('mostAccurateTwin')) return [];
      return [
        { outcome: 'success', _count: { id: 2 } },
        { outcome: 'failure', _count: { id: 2 } },
      ];
    });
    mockAggregate.mockResolvedValue({ _avg: { impactScore: null } });
    mockFindMany.mockResolvedValue([
      makeOutcome({ outcome: 'success', confirmedBiases: [] }),
      makeOutcome({ outcome: 'success', confirmedBiases: [] }),
      makeOutcome({ outcome: 'failure', confirmedBiases: ['anchoring'] }),
      makeOutcome({ outcome: 'failure', confirmedBiases: ['anchoring'] }),
    ]);

    const res = await GET(makeRequest());
    const body = await res.json();

    // Overall success rate: 2/4 = 50%
    // Anchoring success rate: 0/2 = 0%
    // Delta: 0 - 50 = -50
    expect(body.biasCosts).toHaveLength(1);
    expect(body.biasCosts[0].bias).toBe('anchoring');
    expect(body.biasCosts[0].successRateDelta).toBe(-50);
    expect(body.biasCosts[0].failedCount).toBe(2);
    expect(body.biasCosts[0].totalCount).toBe(2);
  });

  it('builds persona leaderboard from twin data', async () => {
    // The route uses groupBy for twin leaderboard
    mockGroupBy.mockImplementation(async (args: Record<string, unknown>) => {
      const by = args.by as string[];
      if (by.includes('mostAccurateTwin')) {
        return [
          { mostAccurateTwin: 'Alice', outcome: 'success', _count: { id: 2 } },
          { mostAccurateTwin: 'Bob', outcome: 'failure', _count: { id: 1 } },
          { mostAccurateTwin: 'Bob', outcome: 'success', _count: { id: 1 } },
        ];
      }
      return [
        { outcome: 'success', _count: { id: 3 } },
        { outcome: 'failure', _count: { id: 1 } },
      ];
    });
    mockAggregate.mockResolvedValue({ _avg: { impactScore: null } });
    mockFindMany.mockResolvedValue([
      makeOutcome({ outcome: 'success', mostAccurateTwin: 'Alice' }),
      makeOutcome({ outcome: 'success', mostAccurateTwin: 'Alice' }),
      makeOutcome({ outcome: 'failure', mostAccurateTwin: 'Bob' }),
      makeOutcome({ outcome: 'success', mostAccurateTwin: 'Bob' }),
    ]);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.personaLeaderboard).toHaveLength(2);
    // Alice: 2/2 = 100%, Bob: 1/2 = 50% → sorted desc
    expect(body.personaLeaderboard[0]).toEqual({ name: 'Alice', accuracy: 100, timesSelected: 2 });
    expect(body.personaLeaderboard[1]).toEqual({ name: 'Bob', accuracy: 50, timesSelected: 2 });
  });

  it('accepts explicit orgId query parameter', async () => {
    mockFindMany.mockResolvedValue([]);
    const res = await GET(makeRequest({ orgId: 'explicit-org' }));
    await res.json();

    expect(res.status).toBe(200);
    // findFirst should NOT have been called when explicit orgId is provided
    expect(mockFindFirst).not.toHaveBeenCalled();
  });

  it('returns pendingOutcomes as a count', async () => {
    mockQueryRaw.mockResolvedValue([
      { analysisId: 'a1' },
      { analysisId: 'a2' },
      { analysisId: 'a3' },
    ]);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.pendingOutcomes).toBe(3);
  });

  it('returns schema drift fallback with correct shape', async () => {
    mockGroupBy.mockRejectedValue({ code: 'P2021' });

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.kpis.decisionsTracked).toBe(0);
    expect(body.calibration).toEqual([]);
    expect(body.biasCosts).toEqual([]);
    expect(body.personaLeaderboard).toEqual([]);
    expect(body.pendingOutcomes).toBe(0);
    expect(body._message).toBeDefined();
  });
});
