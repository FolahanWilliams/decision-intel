import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/server to avoid environment dependency issues
vi.mock('next/server', () => {
    return {
        NextRequest: class {
            url: string;
            bodyUsed = false;
            constructor(input: any, init?: any) {
                this.url = typeof input === 'string' ? input : input.url || '';
            }
            async json() { return {}; } // Mocked in test
        },
        NextResponse: class {
            body: any;
            status: number;
            headers: Headers;
            constructor(body?: any, init?: any) {
                this.body = body;
                this.status = init?.status || 200;
                this.headers = new Headers(init?.headers);
            }
            static json(body: any, init?: any) {
                return {
                    body,
                    status: init?.status || 200,
                    json: async () => body
                };
            }
        }
    };
});

// Global Headers polyfill if needed (Vitest node env might miss it)
if (!global.Headers) {
    global.Headers = class extends Map {
        append(key: string, value: string) { this.set(key, value); }
    } as any;
}

const mocks = vi.hoisted(() => {
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const DB_LATENCY = 50;
    return {
        document: {
            findFirst: vi.fn().mockResolvedValue({ id: 'doc_123', content: 'test content' }),
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

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user_123' }),
}));

vi.mock('@/lib/analysis/analyzer', () => ({
  runAnalysis: vi.fn().mockImplementation(async (content, onProgress) => {
    // Simulate some work/progress
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
}));

vi.mock('@/lib/prisma', () => ({
  prisma: mocks
}));

vi.mock('@/lib/sse', () => ({
  formatSSE: (data: unknown) => JSON.stringify(data)
}));

vi.mock('@/lib/utils/json', () => ({
  safeJsonClone: (obj: unknown) => obj
}));

// Import after mocks
import { POST } from './route';
import { NextRequest } from 'next/server';

describe('Performance Benchmark', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('measures execution time of POST handler', async () => {
    const req = {
      json: async () => ({ documentId: 'doc_123' }),
    } as unknown as NextRequest;

    const start = performance.now();
    const response = await POST(req);

    // Consume stream to ensure all async work completes
    // In our mock, body is the stream
    const stream = response.body as ReadableStream;
    if (stream && stream.getReader) {
        const reader = stream.getReader();
        while (true) {
            const { done } = await reader.read();
            if (done) break;
        }
    }

    const end = performance.now();
    console.log(`Execution time: ${(end - start).toFixed(2)}ms`);

    expect(response.status).toBe(200);
    // Ensure we are hitting the DB
    expect(mocks.document.findFirst).toHaveBeenCalled();
  });
});
