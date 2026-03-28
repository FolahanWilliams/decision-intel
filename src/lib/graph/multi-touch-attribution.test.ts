import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    decisionEdge: { findMany: vi.fn() },
    decisionAttribution: { upsert: vi.fn() },
    $transaction: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { computeMultiTouchAttribution } from './multi-touch-attribution';
import { prisma } from '@/lib/prisma';

const mockFindMany = prisma.decisionEdge.findMany as ReturnType<typeof vi.fn>;
const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockTransaction.mockResolvedValue([]);
});

describe('computeMultiTouchAttribution', () => {
  it('returns empty array when no edges exist', async () => {
    mockFindMany.mockResolvedValue([]);
    const result = await computeMultiTouchAttribution('analysis-1', 'org-1');
    expect(result).toEqual([]);
  });

  it('finds direct contributors via influenced_by edges', async () => {
    mockFindMany.mockResolvedValue([
      {
        sourceType: 'analysis',
        sourceId: 'source-1',
        targetType: 'analysis',
        targetId: 'analysis-1',
        edgeType: 'influenced_by',
        strength: 0.8,
      },
    ]);
    const result = await computeMultiTouchAttribution('analysis-1', 'org-1');
    expect(result.length).toBe(1);
    expect(result[0].sourceAnalysisId).toBe('source-1');
    expect(result[0].contributionPct).toBe(100); // only contributor = 100%
    expect(result[0].pathLength).toBe(1);
  });

  it('distributes attribution across multiple sources', async () => {
    mockFindMany.mockResolvedValue([
      {
        sourceType: 'analysis',
        sourceId: 'source-1',
        targetType: 'analysis',
        targetId: 'analysis-1',
        edgeType: 'influenced_by',
        strength: 0.8,
      },
      {
        sourceType: 'analysis',
        sourceId: 'source-2',
        targetType: 'analysis',
        targetId: 'analysis-1',
        edgeType: 'shared_bias',
        strength: 0.4,
      },
    ]);
    const result = await computeMultiTouchAttribution('analysis-1', 'org-1');
    expect(result.length).toBe(2);
    // Total should sum to ~100%
    const total = result.reduce((s, r) => s + r.contributionPct, 0);
    expect(total).toBeCloseTo(100, 0);
    // Stronger edge should get more credit
    const source1 = result.find(r => r.sourceAnalysisId === 'source-1');
    const source2 = result.find(r => r.sourceAnalysisId === 'source-2');
    expect(source1!.contributionPct).toBeGreaterThan(source2!.contributionPct);
  });

  it('follows multi-hop paths', async () => {
    mockFindMany.mockResolvedValue([
      {
        sourceType: 'analysis',
        sourceId: 'source-1',
        targetType: 'analysis',
        targetId: 'analysis-1',
        edgeType: 'influenced_by',
        strength: 0.7,
      },
      {
        sourceType: 'analysis',
        sourceId: 'source-2',
        targetType: 'analysis',
        targetId: 'source-1',
        edgeType: 'escalated_from',
        strength: 0.6,
      },
    ]);
    const result = await computeMultiTouchAttribution('analysis-1', 'org-1');
    // Should find both direct (source-1) and indirect (source-2)
    expect(result.length).toBe(2);
    const hop2 = result.find(r => r.sourceAnalysisId === 'source-2');
    expect(hop2!.pathLength).toBe(2);
  });

  it('filters out contributions below 2%', async () => {
    mockFindMany.mockResolvedValue([
      {
        sourceType: 'analysis',
        sourceId: 'strong',
        targetType: 'analysis',
        targetId: 'analysis-1',
        edgeType: 'influenced_by',
        strength: 0.95,
      },
      {
        sourceType: 'analysis',
        sourceId: 'weak',
        targetType: 'analysis',
        targetId: 'analysis-1',
        edgeType: 'shared_bias',
        strength: 0.01,
      },
    ]);
    const result = await computeMultiTouchAttribution('analysis-1', 'org-1');
    const weakSource = result.find(r => r.sourceAnalysisId === 'weak');
    // Weak source should be filtered out (< 2% contribution)
    if (weakSource) {
      expect(weakSource.contributionPct).toBeGreaterThanOrEqual(2);
    }
  });

  it('ignores non-analysis source types', async () => {
    mockFindMany.mockResolvedValue([
      {
        sourceType: 'human_decision',
        sourceId: 'hd-1',
        targetType: 'analysis',
        targetId: 'analysis-1',
        edgeType: 'influenced_by',
        strength: 0.8,
      },
    ]);
    const result = await computeMultiTouchAttribution('analysis-1', 'org-1');
    expect(result).toEqual([]);
  });
});
