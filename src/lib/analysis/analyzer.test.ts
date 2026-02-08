
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runAnalysis } from './analyzer';

// Mock the graph module
const streamEventsMock = vi.fn();
const invokeMock = vi.fn();

vi.mock('@/lib/agents/graph', () => ({
  auditGraph: {
    invoke: invokeMock, // Keep for fallback test if needed
    streamEvents: streamEventsMock
  }
}));

// Mock safeJsonClone to be identity for simplicity
vi.mock('@/lib/utils/json', () => ({
  safeJsonClone: (obj: unknown) => obj
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

  it('should lazily load auditGraph and capture result from streamEvents', async () => {
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

    // Mock async generator for streamEvents
    async function* mockStream() {
      yield { event: 'on_chain_start', name: 'structurer' };
      yield { event: 'on_chain_end', name: 'structurer' };
      // Simulate root graph end event
      yield {
        event: 'on_chain_end',
        name: 'LangGraph',
        data: { output: { finalReport: mockReport } }
      };
    }

    streamEventsMock.mockReturnValue(mockStream());

    const result = await runAnalysis('test content', 'test-doc-id');

    expect(streamEventsMock).toHaveBeenCalledWith(expect.objectContaining({
      originalContent: 'test content',
      documentId: 'test-doc-id'
    }), expect.anything());

    // Should NOT call invoke anymore in the happy path
    expect(invokeMock).not.toHaveBeenCalled();

    expect(result).toEqual(expect.objectContaining({
      overallScore: 90
    }));
  });
});
