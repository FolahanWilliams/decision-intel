/**
 * Tests for Causal Learning Service
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  computeOrgCausalWeights,
  applyOrgWeights,
  getCausalInsights,
  updateCausalModel,
  type CausalWeight,
  type OrgCausalProfile,
} from './causal-learning';
import { prisma } from '@/lib/prisma';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    decisionOutcome: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    analysis: {
      findMany: vi.fn(),
    },
    orgCausalModel: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Helper: convert the old `{ biasName: { score } }` fixture shape into the
// real Prisma shape `BiasInstance[]`. Keeps the existing fixtures readable
// while matching the schema the production code now uses.
const biasArr = (biases: Record<string, unknown>) =>
  Object.keys(biases).map(biasType => ({ biasType, severity: 'medium' }));

vi.mock('@/lib/utils/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('Causal Learning Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('computeOrgCausalWeights', () => {
    it('should compute causal weights from outcome data', async () => {
      const mockOutcomes = [
        {
          id: '1',
          analysisId: 'a1',
          outcome: 'success',
          actualValue: 100,
          analysis: {
            biases: {
              confirmatoryBias: { score: 8, instances: [] },
              availabilityHeuristic: { score: 3, instances: [] },
            },
          },
        },
        {
          id: '2',
          analysisId: 'a2',
          outcome: 'failure',
          actualValue: -50,
          analysis: {
            biases: {
              confirmatoryBias: { score: 9, instances: [] },
              groupthink: { score: 7, instances: [] },
            },
          },
        },
        {
          id: '3',
          analysisId: 'a3',
          outcome: 'success',
          actualValue: 200,
          analysis: {
            biases: {
              availabilityHeuristic: { score: 2, instances: [] },
              groupthink: { score: 1, instances: [] },
            },
          },
        },
      ];

      const mapped = mockOutcomes.map(o => ({
        ...o,
        analysis: { ...o.analysis, biases: biasArr(o.analysis.biases as Record<string, unknown>) },
      }));
      vi.mocked((prisma as any).decisionOutcome.findMany).mockResolvedValue(mapped as any);

      const result = await computeOrgCausalWeights('org_123');

      expect(result).toHaveLength(3);

      const confirmatoryBias = result.find(w => w.biasType === 'confirmatoryBias');
      expect(confirmatoryBias).toBeDefined();
      expect(confirmatoryBias?.failureCount).toBe(1);
      expect(confirmatoryBias?.successCount).toBe(1);
      expect(confirmatoryBias?.sampleSize).toBe(2);

      const groupthink = result.find(w => w.biasType === 'groupthink');
      expect(groupthink).toBeDefined();
      expect(groupthink?.failureCount).toBe(1);
      expect(groupthink?.successCount).toBe(1);
    });

    it('should handle empty outcome data', async () => {
      vi.mocked((prisma as any).decisionOutcome.findMany).mockResolvedValue([]);

      const result = await computeOrgCausalWeights('org_123');

      expect(result).toEqual([]);
    });

    it('should calculate danger multipliers correctly', async () => {
      const mockOutcomes = [
        {
          id: '1',
          analysisId: 'a1',
          outcome: 'failure',
          actualValue: -100,
          analysis: {
            biases: {
              confirmatoryBias: { score: 10, instances: [] },
            },
          },
        },
        {
          id: '2',
          analysisId: 'a2',
          outcome: 'failure',
          actualValue: -200,
          analysis: {
            biases: {
              confirmatoryBias: { score: 9, instances: [] },
            },
          },
        },
        {
          id: '3',
          analysisId: 'a3',
          outcome: 'success',
          actualValue: 50,
          analysis: {
            biases: {
              availabilityHeuristic: { score: 2, instances: [] },
            },
          },
        },
      ];

      const mapped = mockOutcomes.map(o => ({
        ...o,
        analysis: { ...o.analysis, biases: biasArr(o.analysis.biases as Record<string, unknown>) },
      }));
      vi.mocked((prisma as any).decisionOutcome.findMany).mockResolvedValue(mapped as any);

      const result = await computeOrgCausalWeights('org_123');

      const confirmatoryBias = result.find(w => w.biasType === 'confirmatoryBias');
      expect(confirmatoryBias?.dangerMultiplier).toBeGreaterThan(1);
      expect(confirmatoryBias?.outcomeCorrelation).toBeLessThan(0); // Negative correlation with success
    });

    it('should filter by date range', async () => {
      const from = new Date('2024-01-01');
      const to = new Date('2024-12-31');
      vi.mocked((prisma as any).decisionOutcome.findMany).mockResolvedValue([] as any);

      await computeOrgCausalWeights('org_123', from, to);

      expect((prisma as any).decisionOutcome.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ orgId: 'org_123' }, { userId: 'org_123' }],
          reportedAt: {
            gte: from,
            lte: to,
          },
        },
        include: {
          analysis: {
            include: {
              biases: { select: { biasType: true, severity: true } },
              document: {
                select: { documentType: true, deal: { select: { sector: true } } },
              },
            },
          },
        },
      });
    });
  });

  describe('applyOrgWeights', () => {
    it('should adjust bias scores based on org weights', async () => {
      const biases = {
        confirmatoryBias: { score: 7, instances: ['example'] },
        groupthink: { score: 5, instances: ['example'] },
        availabilityHeuristic: { score: 3, instances: ['example'] },
      };

      const mockModel = {
        weights: [
          {
            biasType: 'confirmatoryBias',
            dangerMultiplier: 1.5,
            outcomeCorrelation: -0.8,
            failureCount: 10,
            successCount: 2,
            sampleSize: 12,
          },
          {
            biasType: 'groupthink',
            dangerMultiplier: 1.2,
            outcomeCorrelation: -0.6,
            failureCount: 8,
            successCount: 4,
            sampleSize: 12,
          },
          {
            biasType: 'availabilityHeuristic',
            dangerMultiplier: 0.8,
            outcomeCorrelation: 0.1,
            failureCount: 3,
            successCount: 7,
            sampleSize: 10,
          },
        ],
      };

      vi.mocked((prisma as any).orgCausalModel.findUnique).mockResolvedValue(mockModel as any);

      const result = await applyOrgWeights('org_123', biases);

      // Confirmatory bias should be amplified (7 * 1.5 = 10.5, capped at 10)
      expect(result.confirmatoryBias.score).toBe(10);
      expect(result.confirmatoryBias.adjusted).toBe(true);
      expect(result.confirmatoryBias.orgMultiplier).toBe(1.5);

      // Groupthink should be slightly amplified
      expect(result.groupthink.score).toBe(6);
      expect(result.groupthink.adjusted).toBe(true);

      // Availability heuristic should be dampened
      expect(result.availabilityHeuristic.score).toBe(2);
      expect(result.availabilityHeuristic.adjusted).toBe(true);
    });

    it('should return original scores when no model exists', async () => {
      const biases = {
        confirmatoryBias: { score: 7, instances: ['example'] },
      };

      vi.mocked((prisma as any).orgCausalModel.findUnique).mockResolvedValue(null);

      const result = await applyOrgWeights('org_123', biases);

      expect(result).toEqual(biases);
    });

    it('should handle stale models gracefully', async () => {
      const biases = {
        confirmatoryBias: { score: 7, instances: ['example'] },
      };

      const staleModel = {
        weights: [],
        updatedAt: new Date('2020-01-01'), // Very old
      };

      vi.mocked((prisma as any).orgCausalModel.findUnique).mockResolvedValue(staleModel as any);

      const result = await applyOrgWeights('org_123', biases);

      expect(result.confirmatoryBias.score).toBe(7); // Unchanged
    });
  });

  describe('getCausalInsights', () => {
    it('should generate insights from causal weights', () => {
      const weights: CausalWeight[] = [
        {
          biasType: 'confirmatoryBias',
          outcomeCorrelation: -0.85,
          failureCount: 25,
          successCount: 3,
          dangerMultiplier: 2.1,
          sampleSize: 28,
        },
        {
          biasType: 'groupthink',
          outcomeCorrelation: -0.6,
          failureCount: 15,
          successCount: 10,
          dangerMultiplier: 1.3,
          sampleSize: 25,
        },
        {
          biasType: 'availabilityHeuristic',
          outcomeCorrelation: 0.1,
          failureCount: 8,
          successCount: 12,
          dangerMultiplier: 0.9,
          sampleSize: 20,
        },
        {
          biasType: 'anchoringBias',
          outcomeCorrelation: -0.05,
          failureCount: 2,
          successCount: 1,
          dangerMultiplier: 1.0,
          sampleSize: 3,
        },
      ];

      const insights = getCausalInsights(weights, 100);

      // Should identify confirmatory bias as dangerous
      const dangerInsight = insights.find(
        i => i.type === 'danger' && i.biasType === 'confirmatoryBias'
      );
      expect(dangerInsight).toBeDefined();
      expect(dangerInsight?.confidence).toBeGreaterThan(0.8);

      // Should identify availability heuristic as safe
      const safeInsight = insights.find(
        i => i.type === 'safe' && i.biasType === 'availabilityHeuristic'
      );
      expect(safeInsight).toBeDefined();

      // Should identify anchoring bias as noise (low sample size)
      const noiseInsight = insights.find(i => i.type === 'noise' && i.biasType === 'anchoringBias');
      expect(noiseInsight).toBeDefined();
    });

    it('should identify digital twin predictions', () => {
      const weights: CausalWeight[] = [
        {
          biasType: 'confirmatoryBias',
          outcomeCorrelation: -0.9,
          failureCount: 50,
          successCount: 5,
          dangerMultiplier: 2.5,
          sampleSize: 55,
        },
      ];

      const insights = getCausalInsights(weights, 200);

      const twinInsight = insights.find(i => i.type === 'twin');
      expect(twinInsight).toBeDefined();
      expect(twinInsight?.message).toContain('digital twin');
    });

    it('should handle empty weights', () => {
      const insights = getCausalInsights([], 0);

      expect(insights).toHaveLength(1);
      expect(insights[0].type).toBe('noise');
      expect(insights[0].message).toContain('Not enough data');
    });
  });

  describe('updateCausalModel', () => {
    it('should update the causal model for an organization', async () => {
      const mockOutcomes = [
        {
          id: '1',
          analysisId: 'a1',
          outcome: 'success',
          actualValue: 100,
          analysis: {
            biases: {
              confirmatoryBias: { score: 3, instances: [] },
            },
          },
        },
      ];

      const mapped = mockOutcomes.map(o => ({
        ...o,
        analysis: { ...o.analysis, biases: biasArr(o.analysis.biases as Record<string, unknown>) },
      }));
      vi.mocked((prisma as any).decisionOutcome.findMany).mockResolvedValue(mapped as any);
      vi.mocked((prisma as any).decisionOutcome.count).mockResolvedValue(mapped.length as any);
      vi.mocked((prisma as any).orgCausalModel.upsert).mockResolvedValue({
        id: 'model_1',
        orgId: 'org_123',
        weights: [],
        insights: [],
        totalOutcomes: 1,
        updatedAt: new Date(),
      } as any);

      const result = await updateCausalModel('org_123');

      expect(result).toBeDefined();
      expect((prisma as any).orgCausalModel.upsert).toHaveBeenCalledWith({
        where: { orgId: 'org_123' },
        create: expect.objectContaining({
          orgId: 'org_123',
          weights: expect.any(Array),
          insights: expect.any(Array),
          totalOutcomes: 1,
        }),
        update: expect.objectContaining({
          weights: expect.any(Array),
          insights: expect.any(Array),
          totalOutcomes: 1,
        }),
      });
    });

    it('should handle errors gracefully', async () => {
      vi.mocked((prisma as any).decisionOutcome.findMany).mockRejectedValue(
        new Error('Database error')
      );
      vi.mocked((prisma as any).decisionOutcome.count).mockRejectedValue(
        new Error('Database error')
      );

      const result = await updateCausalModel('org_123');

      expect(result).toBeNull();
    });
  });

  describe('OrgCausalProfile', () => {
    it('should create a complete causal profile', async () => {
      const mockOutcomes = [
        {
          id: '1',
          analysisId: 'a1',
          outcome: 'failure',
          actualValue: -100,
          analysis: {
            biases: {
              confirmatoryBias: { score: 9, instances: [] },
              groupthink: { score: 8, instances: [] },
            },
          },
        },
        {
          id: '2',
          analysisId: 'a2',
          outcome: 'success',
          actualValue: 200,
          analysis: {
            biases: {
              availabilityHeuristic: { score: 2, instances: [] },
            },
          },
        },
      ];

      const mapped = mockOutcomes.map(o => ({
        ...o,
        analysis: { ...o.analysis, biases: biasArr(o.analysis.biases as Record<string, unknown>) },
      }));
      vi.mocked((prisma as any).decisionOutcome.findMany).mockResolvedValue(mapped as any);

      const weights = await computeOrgCausalWeights('org_123');
      const insights = getCausalInsights(weights, 2);

      const profile: OrgCausalProfile = {
        orgId: 'org_123',
        totalOutcomes: 2,
        weights,
        insights,
        lastUpdated: new Date().toISOString(),
      };

      expect(profile.totalOutcomes).toBe(2);
      expect(profile.weights.length).toBeGreaterThan(0);
      expect(profile.insights.length).toBeGreaterThan(0);
    });
  });
});
