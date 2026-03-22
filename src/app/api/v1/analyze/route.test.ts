/**
 * Tests for API v1 Analyze Endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { validateApiKey } from '@/lib/api/auth';
import { analyzeDocument } from '@/lib/analysis/analyzer';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/api/auth');
vi.mock('@/lib/analysis/analyzer');
vi.mock('@/lib/prisma', () => ({
  prisma: {
    document: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    analysis: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('@/lib/utils/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('API v1 Analyze Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/v1/analyze', () => {
    const mockApiContext = {
      userId: 'user_123',
      orgId: 'org_123',
      keyId: 'key_123',
      scopes: ['write:analyses', 'read:documents'],
      rateLimit: 100,
    };

    const mockDocument = {
      id: 'doc_123',
      title: 'Test Document',
      content: 'This is a test document content',
      userId: 'user_123',
      orgId: 'org_123',
      createdAt: new Date(),
    };

    const mockAnalysis = {
      id: 'analysis_123',
      documentId: 'doc_123',
      userId: 'user_123',
      orgId: 'org_123',
      overallScore: 7.5,
      biases: {
        confirmatoryBias: {
          score: 6,
          instances: ['Example instance'],
        },
        groupthink: {
          score: 8,
          instances: ['Group pressure detected'],
        },
      },
      recommendations: [
        'Consider alternative viewpoints',
        'Seek diverse opinions',
      ],
      createdAt: new Date(),
    };

    it('should analyze a document by ID', async () => {
      vi.mocked(validateApiKey).mockResolvedValue({
        success: true,
        context: mockApiContext,
      });

      vi.mocked(prisma.document.findFirst).mockResolvedValue(mockDocument as any);
      vi.mocked(analyzeDocument).mockResolvedValue(mockAnalysis as any);
      vi.mocked(prisma.analysis.findFirst)
        .mockResolvedValueOnce(null as any) // Check for existing
        .mockResolvedValueOnce(mockAnalysis as any); // Retrieve newly saved
      vi.mocked(prisma.analysis.create).mockResolvedValue(mockAnalysis as any);

      const request = new NextRequest('http://localhost:3000/api/v1/analyze', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer di_live_test123',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: 'doc_123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.analysisId).toBe('analysis_123');
      expect(data.data.overallScore).toBe(7.5);
      expect(data.data.biases).toHaveProperty('confirmatoryBias');
      expect(data.data.recommendations).toHaveLength(2);
    });

    it('should analyze raw content', async () => {
      vi.mocked(validateApiKey).mockResolvedValue({
        success: true,
        context: mockApiContext,
      });

      vi.mocked(analyzeDocument).mockResolvedValue(mockAnalysis as any);
      vi.mocked(prisma.document.create).mockResolvedValue(mockDocument as any);
      vi.mocked(prisma.analysis.findFirst).mockResolvedValue(mockAnalysis as any);
      vi.mocked(prisma.analysis.create).mockResolvedValue(mockAnalysis as any);

      const request = new NextRequest('http://localhost:3000/api/v1/analyze', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer di_live_test123',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: 'This is raw content to analyze',
          title: 'Raw Analysis',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(analyzeDocument).toHaveBeenCalledWith(mockDocument);
    });

    it('should require write:analyses scope', async () => {
      vi.mocked(validateApiKey).mockResolvedValue({
        success: true,
        context: {
          ...mockApiContext,
          scopes: ['read:documents'], // Missing write:analyses
        },
      });

      const request = new NextRequest('http://localhost:3000/api/v1/analyze', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer di_live_test123',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: 'Test content',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Insufficient permissions');
    });

    it('should validate request body', async () => {
      vi.mocked(validateApiKey).mockResolvedValue({
        success: true,
        context: mockApiContext,
      });

      const request = new NextRequest('http://localhost:3000/api/v1/analyze', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer di_live_test123',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Missing required fields
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('documentId or content');
    });

    it('should handle authentication failure', async () => {
      vi.mocked(validateApiKey).mockResolvedValue({
        success: false,
        error: 'Invalid API key',
        status: 401,
      });

      const request = new NextRequest('http://localhost:3000/api/v1/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: 'Test content',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid API key');
    });

    it('should check document ownership', async () => {
      vi.mocked(validateApiKey).mockResolvedValue({
        success: true,
        context: mockApiContext,
      });

      vi.mocked(prisma.document.findFirst).mockResolvedValue(null); // Document not found or no access

      const request = new NextRequest('http://localhost:3000/api/v1/analyze', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer di_live_test123',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: 'doc_999',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Document not found');
    });

    it('should prevent duplicate analyses', async () => {
      vi.mocked(validateApiKey).mockResolvedValue({
        success: true,
        context: mockApiContext,
      });

      vi.mocked(prisma.document.findFirst).mockResolvedValue(mockDocument as any);
      vi.mocked(prisma.analysis.findFirst).mockResolvedValue(mockAnalysis as any); // Existing analysis

      const request = new NextRequest('http://localhost:3000/api/v1/analyze', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer di_live_test123',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: 'doc_123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.cached).toBe(true); // Should return cached result
      expect(analyzeDocument).not.toHaveBeenCalled(); // Should not re-analyze
    });

    it('should handle analysis errors gracefully', async () => {
      vi.mocked(validateApiKey).mockResolvedValue({
        success: true,
        context: mockApiContext,
      });

      vi.mocked(prisma.document.findFirst).mockResolvedValue(mockDocument as any);
      vi.mocked(prisma.analysis.findFirst).mockResolvedValueOnce(null as any);
      vi.mocked(analyzeDocument).mockRejectedValue(new Error('LLM API error'));

      const request = new NextRequest('http://localhost:3000/api/v1/analyze', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer di_live_test123',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: 'doc_123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Analysis failed');
    });

    it('should respect rate limits from API key', async () => {
      vi.mocked(validateApiKey).mockResolvedValue({
        success: false,
        error: 'Rate limit exceeded',
        status: 429,
        headers: {
          'Retry-After': '60',
        },
      });

      const request = new NextRequest('http://localhost:3000/api/v1/analyze', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer di_live_test123',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: 'Test content',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('60');
      expect(data.error).toBe('Rate limit exceeded');
    });

    it('should include metadata in response', async () => {
      vi.mocked(validateApiKey).mockResolvedValue({
        success: true,
        context: mockApiContext,
      });

      vi.mocked(analyzeDocument).mockResolvedValue(mockAnalysis as any);
      vi.mocked(prisma.document.create).mockResolvedValue(mockDocument as any);
      vi.mocked(prisma.analysis.findFirst).mockResolvedValue(mockAnalysis as any);
      vi.mocked(prisma.analysis.create).mockResolvedValue(mockAnalysis as any);

      const request = new NextRequest('http://localhost:3000/api/v1/analyze', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer di_live_test123',
          'Content-Type': 'application/json',
          'X-Request-ID': 'req_123',
        },
        body: JSON.stringify({
          content: 'Test content',
          metadata: {
            source: 'api_test',
            tags: ['test', 'demo'],
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metadata).toEqual({
        requestId: 'req_123',
        timestamp: expect.any(String),
        apiVersion: 'v1',
      });
    });
  });
});