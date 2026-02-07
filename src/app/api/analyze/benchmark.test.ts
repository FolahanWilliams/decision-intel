import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/server before importing it anywhere
vi.mock('next/server', () => {
    return {
        NextRequest: class {
            constructor(public body: unknown) { }
            json() { return this.body; }
        },
        NextResponse: {
            json: (body: unknown, init?: { status?: number }) => {
                return {
                    json: async () => body,
                    status: init?.status || 200,
                    body: body
                };
            }
        }
    };
});

// Import after mocks
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => {
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const DB_LATENCY = 50;
    return {
        document: {
            findFirst: vi.fn().mockImplementation(async () => {
                await delay(DB_LATENCY);
                return { id: 'doc_123', userId: 'user_123', content: 'test content' };
            }),
            findUnique: vi.fn().mockImplementation(async () => {
                await delay(DB_LATENCY);
                return { id: 'doc_123', userId: 'user_123', content: 'test content' };
            }),
            update: vi.fn().mockImplementation(async () => {
                await delay(DB_LATENCY);
                return { id: 'doc_123' };
            }),
            create: vi.fn().mockImplementation(async () => {
                await delay(DB_LATENCY);
                return { id: 'doc_123' };
            })
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

vi.mock('@/lib/agents/graph', () => ({
    auditGraph: {
        invoke: vi.fn().mockResolvedValue({
            finalReport: {
                overallScore: 85,
                noiseScore: 10,
                summary: 'Test summary',
                biases: []
            }
        })
    }
}));

vi.mock('@/lib/prisma', () => ({
    prisma: mocks
}));

vi.mock('@/lib/utils/json', () => ({
    safeJsonClone: (obj: unknown) => obj
}));

import { POST } from './route';

describe('Performance Benchmark', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.document.findFirst.mockClear();
        mocks.document.findUnique.mockClear();
    });

    it('measures execution time of POST handler', async () => {
        const req = {
            json: async () => ({ documentId: 'doc_123' }),
            headers: { get: () => null }
        } as unknown as NextRequest;

        const start = performance.now();
        const response = await POST(req);
        const json = await response.json();
        const end = performance.now();

        console.log(`Execution time: ${(end - start).toFixed(2)}ms`);

        expect(response.status).toBe(200);
        expect(json.success).toBe(true);

        console.log('findFirst calls:', mocks.document.findFirst.mock.calls.length);
        console.log('findUnique calls:', mocks.document.findUnique.mock.calls.length);
    });
});
