import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    getCachedAnalysis,
    cacheAnalysis,
    getCachedEmbedding,
    cacheEmbedding,
    getCachedBiasInsight,
    cacheBiasInsight,
    getCachedFinancialData,
    cacheFinancialData,
    clearAnalysisCache,
    getCacheStats,
    pruneExpiredEntries,
    generateAnalysisCacheKey,
    CACHE_KEYS,
    CACHE_TTL,
} from './cache';

// ---------------------------------------------------------------------------
// Prisma mock
// ---------------------------------------------------------------------------

const mockFindUnique = vi.fn();
const mockUpsert = vi.fn();
const mockDeleteWhere = vi.fn();
const mockDeleteMany = vi.fn();
const mockCount = vi.fn();

vi.mock('@/lib/prisma', () => ({
    prisma: {
        cacheEntry: {
            findUnique: (...args: unknown[]) => mockFindUnique(...args),
            upsert: (...args: unknown[]) => mockUpsert(...args),
            delete: (...args: unknown[]) => mockDeleteWhere(...args),
            deleteMany: (...args: unknown[]) => mockDeleteMany(...args),
            count: (...args: unknown[]) => mockCount(...args),
        },
    },
}));

vi.mock('./resilience', () => ({
    hashContent: (s: string) => `hash_${s}`,
}));

beforeEach(() => {
    vi.clearAllMocks();
    mockUpsert.mockResolvedValue({});
    mockDeleteWhere.mockResolvedValue({});
    mockDeleteMany.mockResolvedValue({ count: 0 });
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('CACHE_KEYS', () => {
    it('has expected prefixes', () => {
        expect(CACHE_KEYS.ANALYSIS).toBe('analysis:');
        expect(CACHE_KEYS.EMBEDDING).toBe('embedding:');
        expect(CACHE_KEYS.FINANCIAL_DATA).toBe('financial:');
    });
});

describe('CACHE_TTL', () => {
    it('has sensible TTL values', () => {
        expect(CACHE_TTL.ANALYSIS).toBe(7 * 24 * 60 * 60);
        expect(CACHE_TTL.FINANCIAL_DATA).toBe(60 * 60);
        expect(CACHE_TTL.RATE_LIMIT).toBe(60);
    });
});

// ---------------------------------------------------------------------------
// Analysis cache
// ---------------------------------------------------------------------------

describe('getCachedAnalysis', () => {
    it('returns parsed result on cache hit', async () => {
        const data = { overallScore: 75 };
        mockFindUnique.mockResolvedValue({
            value: JSON.stringify(data),
            expiresAt: new Date(Date.now() + 60_000),
        });

        const result = await getCachedAnalysis('abc123');
        expect(result).toEqual(data);
    });

    it('returns null on cache miss', async () => {
        mockFindUnique.mockResolvedValue(null);
        const result = await getCachedAnalysis('missing');
        expect(result).toBeNull();
    });

    it('returns null and deletes expired entries', async () => {
        mockFindUnique.mockResolvedValue({
            value: '{}',
            expiresAt: new Date(Date.now() - 1000), // expired
        });

        const result = await getCachedAnalysis('expired');
        expect(result).toBeNull();
        expect(mockDeleteWhere).toHaveBeenCalled();
    });

    it('returns null on DB error', async () => {
        mockFindUnique.mockRejectedValue(new Error('DB error'));
        const result = await getCachedAnalysis('err');
        expect(result).toBeNull();
    });
});

describe('cacheAnalysis', () => {
    it('upserts with correct key and TTL', async () => {
        await cacheAnalysis('abc123', { overallScore: 80 });

        expect(mockUpsert).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { key: 'analysis:abc123' },
            })
        );
    });
});

// ---------------------------------------------------------------------------
// Embedding cache
// ---------------------------------------------------------------------------

describe('getCachedEmbedding', () => {
    it('returns parsed embedding on hit', async () => {
        const embedding = [0.1, 0.2, 0.3];
        mockFindUnique.mockResolvedValue({
            value: JSON.stringify(embedding),
            expiresAt: new Date(Date.now() + 60_000),
        });

        const result = await getCachedEmbedding('hash1');
        expect(result).toEqual(embedding);
    });

    it('returns null on miss', async () => {
        mockFindUnique.mockResolvedValue(null);
        const result = await getCachedEmbedding('missing');
        expect(result).toBeNull();
    });
});

describe('cacheEmbedding', () => {
    it('stores embedding with correct prefix', async () => {
        await cacheEmbedding('hash1', [0.1, 0.2]);

        expect(mockUpsert).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { key: 'embedding:hash1' },
            })
        );
    });
});

// ---------------------------------------------------------------------------
// Bias insight cache
// ---------------------------------------------------------------------------

describe('getCachedBiasInsight / cacheBiasInsight', () => {
    it('round-trips bias insight', async () => {
        mockFindUnique.mockResolvedValue({
            value: 'Anchoring bias is...',
            expiresAt: new Date(Date.now() + 60_000),
        });

        const result = await getCachedBiasInsight('anchoring');
        expect(result).toBe('Anchoring bias is...');
    });

    it('stores with correct key', async () => {
        await cacheBiasInsight('anchoring', 'insight text');
        expect(mockUpsert).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { key: 'bias_insight:anchoring' },
            })
        );
    });
});

// ---------------------------------------------------------------------------
// Financial data cache
// ---------------------------------------------------------------------------

describe('getCachedFinancialData / cacheFinancialData', () => {
    it('returns parsed data on hit', async () => {
        const data = { price: 150.25 };
        mockFindUnique.mockResolvedValue({
            value: JSON.stringify(data),
            expiresAt: new Date(Date.now() + 60_000),
        });

        const result = await getCachedFinancialData('AAPL', 'quote');
        expect(result).toEqual(data);
    });

    it('stores with ticker:dataType key', async () => {
        await cacheFinancialData('AAPL', 'quote', { price: 150 });
        expect(mockUpsert).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { key: 'financial:AAPL:quote' },
            })
        );
    });
});

// ---------------------------------------------------------------------------
// clearAnalysisCache
// ---------------------------------------------------------------------------

describe('clearAnalysisCache', () => {
    it('deletes entries with analysis prefix', async () => {
        mockDeleteMany.mockResolvedValue({ count: 5 });
        await clearAnalysisCache();

        expect(mockDeleteMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { key: { startsWith: 'analysis:' } },
            })
        );
    });

    it('handles errors gracefully', async () => {
        mockDeleteMany.mockRejectedValue(new Error('DB error'));
        // Should not throw
        await expect(clearAnalysisCache()).resolves.toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// getCacheStats
// ---------------------------------------------------------------------------

describe('getCacheStats', () => {
    it('returns counts for each category', async () => {
        mockCount
            .mockResolvedValueOnce(10)  // analyses
            .mockResolvedValueOnce(20)  // embeddings
            .mockResolvedValueOnce(5)   // biasInsights
            .mockResolvedValueOnce(3);  // financialData

        const stats = await getCacheStats();
        expect(stats).toEqual({
            analyses: 10,
            embeddings: 20,
            biasInsights: 5,
            financialData: 3,
        });
    });

    it('returns null on error', async () => {
        mockCount.mockRejectedValue(new Error('DB error'));
        const stats = await getCacheStats();
        expect(stats).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// pruneExpiredEntries
// ---------------------------------------------------------------------------

describe('pruneExpiredEntries', () => {
    it('deletes expired entries and returns count', async () => {
        mockDeleteMany.mockResolvedValue({ count: 12 });
        const count = await pruneExpiredEntries();
        expect(count).toBe(12);
    });
});

// ---------------------------------------------------------------------------
// generateAnalysisCacheKey
// ---------------------------------------------------------------------------

describe('generateAnalysisCacheKey', () => {
    it('returns hash of content', () => {
        const key = generateAnalysisCacheKey('test content');
        expect(key).toBe('hash_test content');
    });

    it('appends userId when provided', () => {
        const key = generateAnalysisCacheKey('test content', 'user123');
        expect(key).toBe('hash_test content:user123');
    });
});
