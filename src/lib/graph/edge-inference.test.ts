import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    analysis: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    decisionEdge: {
      upsert: vi.fn(),
      create: vi.fn(),
    },
    decisionFrame: {
      findMany: vi.fn(),
    },
    decisionOutcome: {
      findMany: vi.fn(),
    },
  },
}));

// Mock RAG embeddings
vi.mock('@/lib/rag/embeddings', () => ({
  searchSimilarWithOutcomes: vi.fn(),
}));

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { inferEdgesForAnalysis, inferTemporalEdges, addManualEdge } from './edge-inference';
import { prisma } from '@/lib/prisma';
import { searchSimilarWithOutcomes } from '@/lib/rag/embeddings';

const mockPrisma = prisma as unknown as {
  analysis: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
  decisionEdge: {
    upsert: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  decisionFrame: {
    findMany: ReturnType<typeof vi.fn>;
  };
  decisionOutcome: {
    findMany: ReturnType<typeof vi.fn>;
  };
};

const mockSearchSimilar = searchSimilarWithOutcomes as ReturnType<typeof vi.fn>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeAnalysis(overrides: Record<string, unknown> = {}) {
  return {
    id: 'analysis-1',
    createdAt: new Date(),
    biases: [
      { biasType: 'confirmation_bias', severity: 'high' },
      { biasType: 'anchoring_bias', severity: 'medium' },
      { biasType: 'sunk_cost', severity: 'low' },
    ],
    document: {
      id: 'doc-1',
      userId: 'user-1',
      content: 'Some decision content for analysis',
      filename: 'decision.pdf',
      orgId: 'org-1',
      decisionFrame: {
        stakeholders: ['Alice', 'Bob', 'Charlie'],
      },
    },
    outcome: null,
    ...overrides,
  };
}

// ─── inferEdgesForAnalysis ──────────────────────────────────────────────────

describe('inferEdgesForAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no results from sub-queries
    mockPrisma.analysis.findMany.mockResolvedValue([]);
    mockPrisma.decisionFrame.findMany.mockResolvedValue([]);
    mockPrisma.decisionOutcome.findMany.mockResolvedValue([]);
    mockPrisma.decisionEdge.upsert.mockResolvedValue({ id: 'edge-1' });
    mockSearchSimilar.mockResolvedValue([]);
  });

  it('should return 0 when analysis is not found', async () => {
    mockPrisma.analysis.findUnique.mockResolvedValue(null);

    const result = await inferEdgesForAnalysis('missing-id', 'org-1');

    expect(result).toBe(0);
    expect(mockPrisma.decisionEdge.upsert).not.toHaveBeenCalled();
  });

  it('should create shared_bias edges when 2+ biases overlap with another analysis', async () => {
    const analysis = makeAnalysis();
    mockPrisma.analysis.findUnique.mockResolvedValue(analysis);

    // Another analysis shares 2 biases
    mockPrisma.analysis.findMany.mockResolvedValue([
      {
        id: 'analysis-2',
        biases: [{ biasType: 'confirmation_bias' }, { biasType: 'anchoring_bias' }],
      },
    ]);

    const result = await inferEdgesForAnalysis('analysis-1', 'org-1');

    expect(result).toBeGreaterThanOrEqual(1);
    expect(mockPrisma.decisionEdge.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          edgeType: 'shared_bias',
          sourceId: 'analysis-1',
          targetId: 'analysis-2',
        }),
      })
    );
  });

  it('should skip shared_bias edges when fewer than 2 biases overlap', async () => {
    const analysis = makeAnalysis();
    mockPrisma.analysis.findUnique.mockResolvedValue(analysis);

    // Only 1 shared bias
    mockPrisma.analysis.findMany.mockResolvedValue([
      {
        id: 'analysis-2',
        biases: [{ biasType: 'confirmation_bias' }],
      },
    ]);

    await inferEdgesForAnalysis('analysis-1', 'org-1');

    // No shared_bias edges should be created (other strategies may still produce 0)
    const sharedBiasCalls = mockPrisma.decisionEdge.upsert.mock.calls.filter(
      (call: unknown[]) =>
        (call[0] as { create: { edgeType: string } }).create.edgeType === 'shared_bias'
    );
    expect(sharedBiasCalls).toHaveLength(0);
  });

  it('should create similar_to edges from RAG results with similarity >= 0.7', async () => {
    const analysis = makeAnalysis();
    mockPrisma.analysis.findUnique.mockResolvedValue(analysis);

    mockSearchSimilar.mockResolvedValue([
      {
        documentId: 'doc-2',
        similarity: 0.85,
        filename: 'other-decision.pdf',
        biases: ['anchoring_bias'],
      },
    ]);

    mockPrisma.analysis.findFirst.mockResolvedValue({ id: 'analysis-2' });

    const result = await inferEdgesForAnalysis('analysis-1', 'org-1');

    expect(result).toBeGreaterThanOrEqual(1);
    expect(mockPrisma.decisionEdge.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          edgeType: 'similar_to',
          sourceId: 'analysis-1',
          targetId: 'analysis-2',
        }),
      })
    );
  });

  it('should skip self-matches in similarity results', async () => {
    const analysis = makeAnalysis();
    mockPrisma.analysis.findUnique.mockResolvedValue(analysis);

    // Self-match: same documentId as the analysis's document
    mockSearchSimilar.mockResolvedValue([
      {
        documentId: 'doc-1', // same as analysis.document.id
        similarity: 0.99,
        filename: 'decision.pdf',
        biases: [],
      },
    ]);

    await inferEdgesForAnalysis('analysis-1', 'org-1');

    // No similar_to edges should be created for self-match
    const similarCalls = mockPrisma.decisionEdge.upsert.mock.calls.filter(
      (call: unknown[]) =>
        (call[0] as { create: { edgeType: string } }).create.edgeType === 'similar_to'
    );
    expect(similarCalls).toHaveLength(0);
  });

  it('should create same_participants edges when stakeholder overlap >= 50%', async () => {
    const analysis = makeAnalysis();
    mockPrisma.analysis.findUnique.mockResolvedValue(analysis);

    // Another decision frame with 2/3 overlapping stakeholders (67%)
    mockPrisma.decisionFrame.findMany.mockResolvedValue([
      {
        stakeholders: ['Alice', 'Bob', 'Dave'],
        document: {
          analyses: [{ id: 'analysis-3' }],
        },
      },
    ]);

    const result = await inferEdgesForAnalysis('analysis-1', 'org-1');

    expect(result).toBeGreaterThanOrEqual(1);
    expect(mockPrisma.decisionEdge.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          edgeType: 'same_participants',
          sourceId: 'analysis-1',
          targetId: 'analysis-3',
        }),
      })
    );
  });

  it('should create escalated_from edges for recent failures with shared biases', async () => {
    const analysis = makeAnalysis();
    mockPrisma.analysis.findUnique.mockResolvedValue(analysis);

    mockPrisma.decisionOutcome.findMany.mockResolvedValue([
      {
        analysisId: 'failed-analysis',
        outcome: 'failure',
        reportedAt: new Date(),
        analysis: {
          id: 'failed-analysis',
          summary: 'A failed decision',
          biases: [{ biasType: 'confirmation_bias' }],
        },
      },
    ]);

    const result = await inferEdgesForAnalysis('analysis-1', 'org-1');

    expect(result).toBeGreaterThanOrEqual(1);
    expect(mockPrisma.decisionEdge.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          edgeType: 'escalated_from',
          sourceId: 'analysis-1',
          targetId: 'failed-analysis',
        }),
      })
    );
  });

  it('should handle RAG import failure gracefully (returns 0 similarity edges)', async () => {
    const analysis = makeAnalysis();
    mockPrisma.analysis.findUnique.mockResolvedValue(analysis);

    // RAG throws on import
    mockSearchSimilar.mockRejectedValue(new Error('RAG unavailable'));

    await inferEdgesForAnalysis('analysis-1', 'org-1');

    // Should not throw, and no similar_to edges
    const similarCalls = mockPrisma.decisionEdge.upsert.mock.calls.filter(
      (call: unknown[]) =>
        (call[0] as { create: { edgeType: string } }).create.edgeType === 'similar_to'
    );
    expect(similarCalls).toHaveLength(0);
  });

  it('should aggregate results from all 4 strategies', async () => {
    const analysis = makeAnalysis();
    mockPrisma.analysis.findUnique.mockResolvedValue(analysis);

    // 1. Shared bias edge
    mockPrisma.analysis.findMany.mockResolvedValue([
      {
        id: 'analysis-2',
        biases: [
          { biasType: 'confirmation_bias' },
          { biasType: 'anchoring_bias' },
          { biasType: 'sunk_cost' },
        ],
      },
    ]);

    // 2. Similarity edge
    mockSearchSimilar.mockResolvedValue([
      {
        documentId: 'doc-3',
        similarity: 0.9,
        filename: 'related.pdf',
        biases: [],
      },
    ]);
    mockPrisma.analysis.findFirst.mockResolvedValue({ id: 'analysis-3' });

    // 3. Participant edge
    mockPrisma.decisionFrame.findMany.mockResolvedValue([
      {
        stakeholders: ['Alice', 'Bob', 'Charlie'],
        document: {
          analyses: [{ id: 'analysis-4' }],
        },
      },
    ]);

    // 4. Cascade edge
    mockPrisma.decisionOutcome.findMany.mockResolvedValue([
      {
        analysisId: 'analysis-5',
        outcome: 'failure',
        reportedAt: new Date(),
        analysis: {
          id: 'analysis-5',
          summary: 'Failed',
          biases: [{ biasType: 'confirmation_bias' }],
        },
      },
    ]);

    mockPrisma.decisionEdge.upsert.mockResolvedValue({ id: 'edge-x' });

    const result = await inferEdgesForAnalysis('analysis-1', 'org-1');

    // Should have edges from all 4 strategies
    expect(result).toBe(4);

    const edgeTypes = mockPrisma.decisionEdge.upsert.mock.calls.map(
      (call: unknown[]) => (call[0] as { create: { edgeType: string } }).create.edgeType
    );
    expect(edgeTypes).toContain('shared_bias');
    expect(edgeTypes).toContain('similar_to');
    expect(edgeTypes).toContain('same_participants');
    expect(edgeTypes).toContain('escalated_from');
  });
});

// ─── inferTemporalEdges ─────────────────────────────────────────────────────

describe('inferTemporalEdges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create influenced_by edges for same-user analyses within 14 days sharing 2+ biases', async () => {
    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    mockPrisma.analysis.findMany.mockResolvedValue([
      {
        id: 'a1',
        createdAt: fiveDaysAgo,
        biases: [{ biasType: 'confirmation_bias' }, { biasType: 'anchoring_bias' }],
        document: {
          id: 'doc-a',
          userId: 'user-1',
          filename: 'first.pdf',
          decisionFrame: null,
        },
        outcome: null,
      },
      {
        id: 'a2',
        createdAt: now,
        biases: [{ biasType: 'confirmation_bias' }, { biasType: 'anchoring_bias' }],
        document: {
          id: 'doc-b',
          userId: 'user-1',
          filename: 'second.pdf',
          decisionFrame: null,
        },
        outcome: null,
      },
    ]);

    mockPrisma.decisionEdge.upsert.mockResolvedValue({ id: 'temporal-edge-1' });

    const result = await inferTemporalEdges('org-1');

    expect(result).toBe(1);
    expect(mockPrisma.decisionEdge.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          edgeType: 'influenced_by',
          sourceId: 'a2',
          targetId: 'a1',
          orgId: 'org-1',
        }),
      })
    );
  });

  it('should skip analyses by different users', async () => {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    mockPrisma.analysis.findMany.mockResolvedValue([
      {
        id: 'a1',
        createdAt: twoDaysAgo,
        biases: [{ biasType: 'confirmation_bias' }, { biasType: 'anchoring_bias' }],
        document: { id: 'doc-a', userId: 'user-1', filename: 'a.pdf', decisionFrame: null },
        outcome: null,
      },
      {
        id: 'a2',
        createdAt: now,
        biases: [{ biasType: 'confirmation_bias' }, { biasType: 'anchoring_bias' }],
        document: { id: 'doc-b', userId: 'user-2', filename: 'b.pdf', decisionFrame: null },
        outcome: null,
      },
    ]);

    const result = await inferTemporalEdges('org-1');

    expect(result).toBe(0);
    expect(mockPrisma.decisionEdge.upsert).not.toHaveBeenCalled();
  });

  it('should return 0 for empty org', async () => {
    mockPrisma.analysis.findMany.mockResolvedValue([]);

    const result = await inferTemporalEdges('empty-org');

    expect(result).toBe(0);
    expect(mockPrisma.decisionEdge.upsert).not.toHaveBeenCalled();
  });
});

// ─── addManualEdge ──────────────────────────────────────────────────────────

describe('addManualEdge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create edge with strength=1.0 and isManual=true', async () => {
    mockPrisma.decisionEdge.create.mockResolvedValue({ id: 'manual-edge-1' });

    const result = await addManualEdge({
      orgId: 'org-1',
      sourceType: 'analysis',
      sourceId: 'a1',
      targetType: 'analysis',
      targetId: 'a2',
      edgeType: 'depends_on',
      description: 'A depends on B',
      userId: 'user-1',
    });

    expect(result).toEqual({ id: 'manual-edge-1' });
    expect(mockPrisma.decisionEdge.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        strength: 1.0,
        confidence: 1.0,
        isManual: true,
        createdBy: 'user-1',
        edgeType: 'depends_on',
        sourceType: 'analysis',
        sourceId: 'a1',
        targetType: 'analysis',
        targetId: 'a2',
        description: 'A depends on B',
        orgId: 'org-1',
      }),
      select: { id: true },
    });
  });
});
