/**
 * Tests for API key authentication system
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  hashApiKey,
  generateApiKey,
  validateApiKey,
  revokeApiKey,
  listApiKeys,
  getApiKeyStats,
} from './auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/utils/rate-limit';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    apiKey: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    apiKeyUsage: {
      create: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/utils/rate-limit', () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock('@/lib/utils/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('API Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hashApiKey', () => {
    it('should hash API keys consistently', () => {
      const key = 'di_live_1234567890abcdef1234567890abcdef';
      const hash1 = hashApiKey(key);
      const hash2 = hashApiKey(key);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex chars
    });

    it('should produce different hashes for different keys', () => {
      const key1 = 'di_live_1234567890abcdef1234567890abcdef';
      const key2 = 'di_live_fedcba0987654321fedcba0987654321';

      expect(hashApiKey(key1)).not.toBe(hashApiKey(key2));
    });
  });

  describe('generateApiKey', () => {
    it('should generate a new API key with correct format', async () => {
      const mockKey: any = {
        id: 'key_123',
        name: 'Test API Key',
        keyHash: 'hashed_value',
        userId: 'user_123',
        orgId: 'org_123',
        scopes: ['read:documents', 'write:analyses'],
        rateLimit: 100,
        expiresAt: null,
        lastUsedAt: null,
        createdAt: new Date(),
      };

      vi.mocked((prisma as any).apiKey.create).mockResolvedValue(mockKey);

      const result = await generateApiKey({
        userId: 'user_123',
        orgId: 'org_123',
        name: 'Test API Key',
        scopes: ['read:documents', 'write:analyses'],
        rateLimit: 100,
      });

      expect(result.key).toMatch(/^di_live_[0-9a-f]{32}$/);
      expect(result.keyId).toBe('key_123');
      expect(result.name).toBe('Test API Key');
      expect(result.scopes).toEqual(['read:documents', 'write:analyses']);
    });

    it('should handle expiration dates', async () => {
      const expiresAt = new Date('2025-12-31');
      const mockKey: any = {
        id: 'key_123',
        name: 'Expiring Key',
        keyHash: 'hashed_value',
        userId: 'user_123',
        orgId: null,
        scopes: ['read:documents'],
        rateLimit: 50,
        expiresAt,
        lastUsedAt: null,
        createdAt: new Date(),
      };

      vi.mocked((prisma as any).apiKey.create).mockResolvedValue(mockKey);

      const result = await generateApiKey({
        userId: 'user_123',
        name: 'Expiring Key',
        scopes: ['read:documents'],
        expiresAt,
      });

      expect(result.expiresAt).toBe(expiresAt.toISOString());
    });
  });

  describe('validateApiKey', () => {
    it('should validate a correct API key', async () => {
      const key = 'di_live_1234567890abcdef1234567890abcdef';
      const keyHash = hashApiKey(key);

      const mockApiKey: any = {
        id: 'key_123',
        userId: 'user_123',
        orgId: 'org_123',
        scopes: ['read:documents'],
        rateLimit: 100,
        expiresAt: null,
        revokedAt: null,
        keyHash,
        name: 'Test Key',
        lastUsedAt: null,
        createdAt: new Date(),
      };

      vi.mocked((prisma as any).apiKey.findUnique).mockResolvedValue(mockApiKey);
      vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true } as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
        if (typeof fn === 'function') {
          return fn(prisma);
        }
        return [];
      });

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          Authorization: `Bearer ${key}`,
        },
      });

      const result = await validateApiKey(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.context.userId).toBe('user_123');
        expect(result.context.orgId).toBe('org_123');
        expect(result.context.scopes).toEqual(['read:documents']);
      }
    });

    it('should reject missing API key', async () => {
      const request = new NextRequest('http://localhost:3000/api/test');

      const result = await validateApiKey(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('API key required');
        expect(result.status).toBe(401);
      }
    });

    it('should reject invalid API key format', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          Authorization: 'Bearer invalid_key',
        },
      });

      const result = await validateApiKey(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid API key format');
        expect(result.status).toBe(401);
      }
    });

    it('should reject non-existent API key', async () => {
      const key = 'di_live_1234567890abcdef1234567890abcdef';

      vi.mocked((prisma as any).apiKey.findUnique).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          Authorization: `Bearer ${key}`,
        },
      });

      const result = await validateApiKey(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid API key');
        expect(result.status).toBe(401);
      }
    });

    it('should reject revoked API key', async () => {
      const key = 'di_live_1234567890abcdef1234567890abcdef';
      const keyHash = hashApiKey(key);

      const mockApiKey: any = {
        id: 'key_123',
        userId: 'user_123',
        orgId: null,
        scopes: ['read:documents'],
        rateLimit: 100,
        expiresAt: null,
        revokedAt: new Date('2024-01-01'),
        keyHash,
        name: 'Revoked Key',
        lastUsedAt: null,
        createdAt: new Date(),
      };

      vi.mocked((prisma as any).apiKey.findUnique).mockResolvedValue(mockApiKey);

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          Authorization: `Bearer ${key}`,
        },
      });

      const result = await validateApiKey(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('API key has been revoked');
        expect(result.status).toBe(401);
      }
    });

    it('should reject expired API key', async () => {
      const key = 'di_live_1234567890abcdef1234567890abcdef';
      const keyHash = hashApiKey(key);

      const mockApiKey: any = {
        id: 'key_123',
        userId: 'user_123',
        orgId: null,
        scopes: ['read:documents'],
        rateLimit: 100,
        expiresAt: new Date('2020-01-01'),
        revokedAt: null,
        keyHash,
        name: 'Expired Key',
        lastUsedAt: null,
        createdAt: new Date(),
      };

      vi.mocked((prisma as any).apiKey.findUnique).mockResolvedValue(mockApiKey);

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          Authorization: `Bearer ${key}`,
        },
      });

      const result = await validateApiKey(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('API key has expired');
        expect(result.status).toBe(401);
      }
    });

    it('should enforce rate limits', async () => {
      const key = 'di_live_1234567890abcdef1234567890abcdef';
      const keyHash = hashApiKey(key);

      const mockApiKey: any = {
        id: 'key_123',
        userId: 'user_123',
        orgId: null,
        scopes: ['read:documents'],
        rateLimit: 10,
        expiresAt: null,
        revokedAt: null,
        keyHash,
        name: 'Rate Limited Key',
        lastUsedAt: null,
        createdAt: new Date(),
      };

      vi.mocked((prisma as any).apiKey.findUnique).mockResolvedValue(mockApiKey);
      vi.mocked(checkRateLimit).mockResolvedValue({
        allowed: false,
        retryAfter: 60,
      } as any);

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          Authorization: `Bearer ${key}`,
        },
      });

      const result = await validateApiKey(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Rate limit exceeded');
        expect(result.status).toBe(429);
        expect(result.headers?.['Retry-After']).toBe('60');
      }
    });
  });

  describe('revokeApiKey', () => {
    it('should revoke an API key', async () => {
      const mockKey = {
        id: 'key_123',
        revokedAt: new Date(),
      };

      vi.mocked((prisma as any).apiKey.update).mockResolvedValue(mockKey as any);

      const result = await revokeApiKey('key_123');

      expect(result).toBe(true);
      expect((prisma as any).apiKey.update).toHaveBeenCalledWith({
        where: { id: 'key_123' },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe('listApiKeys', () => {
    it('should list API keys for a user', async () => {
      const mockKeys = [
        {
          id: 'key_1',
          name: 'Production Key',
          scopes: ['read:documents'],
          rateLimit: 100,
          lastUsedAt: new Date('2024-01-15'),
          createdAt: new Date('2024-01-01'),
          expiresAt: null,
          revokedAt: null,
        },
        {
          id: 'key_2',
          name: 'Development Key',
          scopes: ['read:documents', 'write:analyses'],
          rateLimit: 50,
          lastUsedAt: null,
          createdAt: new Date('2024-01-10'),
          expiresAt: new Date('2025-01-01'),
          revokedAt: null,
        },
      ];

      vi.mocked((prisma as any).apiKey.findMany).mockResolvedValue(mockKeys as any);

      const result = await listApiKeys('user_123');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Production Key');
      expect(result[1].name).toBe('Development Key');
    });

    it('should filter by organization', async () => {
      await listApiKeys('user_123', 'org_456');

      expect((prisma as any).apiKey.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user_123',
          orgId: 'org_456',
        },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getApiKeyStats', () => {
    it('should return usage statistics for an API key', async () => {
      vi.mocked((prisma as any).apiKeyUsage.count).mockResolvedValue(150);
      vi.mocked((prisma as any).apiKeyUsage.aggregate).mockResolvedValue({
        _avg: { responseTime: 250 },
        _count: { id: 150 },
        _max: null as any,
        _min: null as any,
        _sum: null as any,
      });

      const result = await getApiKeyStats('key_123');

      expect(result.totalRequests).toBe(150);
      expect(result.averageResponseTime).toBe(250);
    });

    it('should handle date range filters', async () => {
      const from = new Date('2024-01-01');
      const to = new Date('2024-01-31');

      await getApiKeyStats('key_123', from, to);

      expect((prisma as any).apiKeyUsage.count).toHaveBeenCalledWith({
        where: {
          keyId: 'key_123',
          createdAt: {
            gte: from,
            lte: to,
          },
        },
      });
    });
  });
});