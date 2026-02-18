import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const DB_LATENCY = 50;
  return {
    document: {
      findFirst: vi.fn().mockResolvedValue({ id: 'doc_123', userId: 'user_123', content: 'test content' }),
      update: vi.fn().mockImplementation(async () => {
        await delay(DB_LATENCY);
        return { id: 'doc_123' };
      }),
    },
    analysis: {
      create: vi.fn().mockImplementation(async () => {
        await delay(DB_LATENCY);
        return { id: 'analysis_123' };
      }),
    }
  }
});

vi.mock('next/server', () => {
  return {
    NextRequest: class { },
    NextResponse: class {
      body: unknown;
      status: number;
      constructor(body: unknown, options: { status?: number }) {
        this.body = body;
        this.status = options?.status || 200;
      }
      static json(body: unknown, options: { status?: number }) {
        return { body, status: options?.status || 200, json: async () => body };
      }
    }
  }
});

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user_123' }),
}));

vi.mock('@/lib/analysis/analyzer', () => ({
  runAnalysis: vi.fn().mockImplementation(async (content: string, documentId: string, onProgress: (u: unknown) => void) => {
    if (onProgress) onProgress({ type: 'progress', progress: 50 });
    return {
      overallScore: 85,
      noiseScore: 10,
      summary: 'Test summary',
      biases: [{ found: true, biasType: 'TestBias', severity: 'High', excerpt: 'text', suggestion: 'fix' }],
      structuredContent: '{}',
      noiseStats: {},
      factCheck: {},
      compliance: {},
      speakers: []
    };
  }),
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
              speakers: []
            }
          }
        }
      };
    })
  })
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    ...mocks,
    $transaction: vi.fn().mockImplementation(async (cb: (tx: typeof mocks) => Promise<unknown>) => cb(mocks))
  }
}));

vi.mock('@/lib/sse', () => ({
  formatSSE: (data: unknown) => JSON.stringify(data)
}));

vi.mock('@/lib/utils/json', () => ({
  safeJsonClone: (obj: unknown) => obj
}));

vi.mock('@/lib/utils/prisma-json', () => ({
  toPrismaJson: (obj: unknown) => obj
}));

vi.mock('@/lib/utils/error', () => ({
  getSafeErrorMessage: (err: unknown) => err instanceof Error ? err.message : String(err)
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

    // Consume stream to ensure all async work completes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reader = (response.body as any)?.getReader?.();
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
