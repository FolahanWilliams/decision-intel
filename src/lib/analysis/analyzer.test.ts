
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runAnalysis } from './analyzer';

// Mock the graph module
const invokeMock = vi.fn();
vi.mock('@/lib/agents/graph', () => ({
  auditGraph: {
    invoke: invokeMock
  }
}));

// Mock safeJsonClone to be identity for simplicity
vi.mock('@/lib/utils/json', () => ({
  safeJsonClone: (obj: any) => obj
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        document: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        analysis: {
            create: vi.fn(),
        }
    }
}));

describe('runAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should lazily load auditGraph and invoke it', async () => {
    const mockReport = {
      overallScore: 90,
      biases: [],
      noiseScore: 0,
      summary: 'Test',
      structuredContent: '',
      noiseStats: {},
      factCheck: {},
      compliance: {},
      preMortem: {},
      sentiment: {},
      speakers: []
    };

    invokeMock.mockResolvedValue({ finalReport: mockReport });

    const result = await runAnalysis('test content', 'test-doc-id');

    expect(invokeMock).toHaveBeenCalledWith(expect.objectContaining({
      originalContent: 'test content',
      documentId: 'test-doc-id'
    }));
    expect(result).toEqual(expect.objectContaining({
      overallScore: 90
    }));
  });
});
