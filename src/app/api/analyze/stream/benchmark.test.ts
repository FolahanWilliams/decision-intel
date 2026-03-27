import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const DB_LATENCY = 50;
  return {
    document: {
      findFirst: vi.fn().mockResolvedValue({
        id: 'doc_123',
        userId: 'user_123',
        content:
          'This is a test content that needs to be at least fifty characters long to pass the validation check.',
        status: 'pending',
        updatedAt: new Date(),
        filename: 'test-document.txt',
        orgId: null,
      }),
      update: vi.fn().mockImplementation(async () => {
        await delay(DB_LATENCY);
        return { id: 'doc_123' };
      }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    analysis: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockImplementation(async () => {
        await delay(DB_LATENCY);
        return { id: 'analysis_123' };
      }),
      update: vi.fn().mockResolvedValue({ id: 'analysis_123' }),
    },
    analysisVersion: {
      create: vi.fn().mockResolvedValue({ id: 'version_123' }),
    },
    rateLimit: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue({ count: 1, resetAt: new Date(Date.now() + 3600000) }),
      update: vi.fn().mockResolvedValue({ count: 2, resetAt: new Date(Date.now() + 3600000) }),
    },
    cacheEntry: {
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
    },
    failedAnalysis: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
    },
  };
});

vi.mock('next/server', () => {
  return {
    NextRequest: class {},
    NextResponse: class {
      body: unknown;
      status: number;
      constructor(body: unknown, options?: { status?: number; headers?: Record<string, string> }) {
        this.body = body;
        this.status = options?.status || 200;
      }
      static json(body: unknown, options?: { status?: number; headers?: Record<string, string> }) {
        return { body, status: options?.status || 200, json: async () => body };
      }
    },
  };
});

vi.mock('@/utils/supabase/server', () => ({
  createClient: () =>
    Promise.resolve({
      auth: {
        getUser: () =>
          Promise.resolve({ data: { user: { id: 'user_123', email: 'test@example.com' } } }),
      },
    }),
}));

vi.mock('@/lib/analysis/analyzer', () => ({
  runAnalysis: vi
    .fn()
    .mockImplementation(
      async (content: string, documentId: string, onProgress: (u: unknown) => void) => {
        if (onProgress) onProgress({ type: 'progress', progress: 50 });
        return {
          overallScore: 85,
          noiseScore: 10,
          summary: 'Test summary',
          biases: [
            {
              found: true,
              biasType: 'TestBias',
              severity: 'High',
              excerpt: 'text',
              suggestion: 'fix',
            },
          ],
          structuredContent: '{}',
          noiseStats: {},
          factCheck: {},
          compliance: {},
          speakers: [],
        };
      }
    ),
  getGraph: vi.fn().mockResolvedValue({
    streamEvents: vi.fn().mockImplementation(async function* () {
      yield { event: 'on_chain_start', name: 'structurer' };
      yield { event: 'on_chain_end', name: 'structurer', data: {} };
      yield {
        event: 'on_chain_end',
        name: 'LangGraph',
        data: {
          output: {
            finalReport: {
              overallScore: 85,
              noiseScore: 10,
              summary: 'Test summary',
              biases: [],
              structuredContent: '',
              noiseStats: { mean: 0, stdDev: 0, variance: 0 },
              factCheck: { score: 0, summary: 'N/A', verifications: [], flags: [] },
              compliance: { status: 'WARN', riskScore: 0, summary: 'N/A', regulations: [] },
              speakers: [],
            },
          },
        },
      };
    }),
  }),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    ...mocks,
    $transaction: vi
      .fn()
      .mockImplementation(async (cb: (tx: typeof mocks) => Promise<unknown>) => cb(mocks)),
  },
}));

vi.mock('@/lib/sse', () => ({
  formatSSE: (data: unknown) => JSON.stringify(data),
  formatSSEHeartbeat: () => ':heartbeat\n\n',
}));

vi.mock('@/lib/utils/json', () => ({
  safeJsonClone: (obj: unknown) => obj,
}));

vi.mock('@/lib/utils/prisma-json', () => ({
  toPrismaJson: (obj: unknown) => obj,
}));

vi.mock('@/lib/utils/error', () => ({
  getSafeErrorMessage: (err: unknown) => (err instanceof Error ? err.message : String(err)),
}));

vi.mock('@/lib/utils/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({
    success: true,
    limit: 5,
    remaining: 4,
    reset: Math.floor(Date.now() / 1000) + 3600,
  }),
}));

vi.mock('@/lib/utils/plan-limits', () => ({
  checkAnalysisLimit: vi.fn().mockResolvedValue({
    allowed: true,
    used: 1,
    limit: 100,
    plan: 'pro',
  }),
}));

vi.mock('@/lib/utils/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

vi.mock('@/lib/utils/cost-tracker', () => ({
  trackApiUsage: vi.fn(),
  estimateCost: vi.fn().mockReturnValue(0.001),
}));

vi.mock('@/lib/learning/outcome-gate', () => ({
  checkOutcomeGate: vi.fn().mockResolvedValue({
    allowed: true,
    pendingCount: 0,
    pendingAnalysisIds: [],
    message: null,
  }),
  formatOutcomeReminder: vi.fn().mockReturnValue(null),
}));

vi.mock('@/lib/rag/embeddings', () => ({
  storeAnalysisEmbedding: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/learning/toxic-combinations', () => ({
  detectToxicCombinations: vi.fn().mockResolvedValue({
    flaggedCount: 0,
    combinations: [],
  }),
}));

vi.mock('@/lib/notifications/email', () => ({
  notifyAnalysisComplete: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/schemas/analysis', () => {
  const mockSchema = {
    safeParse: () => ({ success: true }),
    parse: (v: unknown) => v ?? {},
  };
  return {
    NoiseStatsSchema: mockSchema,
    FactCheckSchema: mockSchema,
    ComplianceSchema: mockSchema,
    SentimentSchema: mockSchema,
    LogicalSchema: mockSchema,
    SwotSchema: mockSchema,
    CognitiveSchema: mockSchema,
    SimulationSchema: mockSchema,
    MemorySchema: mockSchema,
  };
});

vi.mock('@prisma/client', () => ({
  Prisma: {},
}));

// Import after mocks
import { POST } from './route';

describe('Performance Benchmark', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('measures execution time of POST handler', async () => {
    const req = {
      json: async () => ({ documentId: 'doc_123' }),
      headers: { get: () => null },
    } as unknown as NextRequest;

    const start = performance.now();
    const response = await POST(req);

    if ((response as unknown as { status: number }).status !== 200) {
      console.error(
        'Stream test failed with status:',
        (response as unknown as { status: number }).status,
        response.body
      );
    }

    // Consume stream to ensure all async work completes
    const reader =
      typeof response.body?.getReader === 'function' ? response.body.getReader() : null;
    if (reader) {
      while (true) {
        const { done } = await reader.read();
        if (done) break;
      }
    }

    const end = performance.now();
    console.log(`Execution time: ${(end - start).toFixed(2)}ms`);

    // Check status (depending on mock implementation)
    // The mocked NextResponse returns an object with status
    expect((response as unknown as { status: number }).status).toBe(200);
    // Ensure we are hitting the DB
    expect(mocks.document.findFirst).toHaveBeenCalled();
  });
});
