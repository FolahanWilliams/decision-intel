import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to ensure env var is set before imports
vi.hoisted(() => {
    process.env.GOOGLE_API_KEY = 'test-key';
});

import { factCheckerNode } from './nodes';
import { AuditState } from './types';

// Hoist mocks for GoogleGenerativeAI
const { mockGenerateContent, mockGetGenerativeModel } = vi.hoisted(() => {
    const generateContent = vi.fn();
    const getGenerativeModel = vi.fn(() => ({
        generateContent: generateContent
    }));
    return { mockGenerateContent: generateContent, mockGetGenerativeModel: getGenerativeModel };
});

vi.mock('@google/generative-ai', () => {
    return {
        GoogleGenerativeAI: vi.fn().mockImplementation(function () {
            return {
                getGenerativeModel: mockGetGenerativeModel
            };
        }),
        HarmCategory: {
            HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT',
            HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH',
            HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT'
        },
        HarmBlockThreshold: {
            BLOCK_NONE: 'BLOCK_NONE'
        }
    };
});

// Mock getFinancialContext
const { mockGetFinancialContext } = vi.hoisted(() => {
    return { mockGetFinancialContext: vi.fn() };
});

vi.mock('../tools/financial', () => ({
    getFinancialContext: mockGetFinancialContext,
    executeDataRequests: vi.fn(async (requests) => {
        for (const req of requests) {
            await mockGetFinancialContext(req.ticker);
        }
        return {};
    })
}));

describe('factCheckerNode Performance', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should deduplicate API calls for duplicate tickers (optimized)', async () => {
        // 1. Mock Extraction Result (Duplicate Tickers)
        mockGenerateContent.mockResolvedValueOnce({
            response: {
                text: () => JSON.stringify({
                    dataRequests: [
                        { ticker: "AAPL", dataType: "financials", reason: "test", claimToVerify: "A" },
                        { ticker: "AAPL", dataType: "financials", reason: "test", claimToVerify: "A" },
                        { ticker: "MSFT", dataType: "financials", reason: "test", claimToVerify: "M" }
                    ]
                })
            }
        });

        // 2. Mock Fact Check Result (Final step)
        mockGenerateContent.mockResolvedValueOnce({
            response: {
                text: () => JSON.stringify({ score: 100, flags: [] })
            }
        });

        // Mock Financial Context implementation
        mockGetFinancialContext.mockResolvedValue("Mock Financial Data");

        const state: AuditState = {
            documentId: 'doc-1',
            originalContent: 'Apple and Microsoft are tech companies.',
            biasAnalysis: [],
            noiseStats: { mean: 0, stdDev: 0, variance: 0 },
            speakers: []
        };

        await factCheckerNode(state);

        // Expect 2 calls because duplicate "AAPL" is deduplicated
        expect(mockGetFinancialContext).toHaveBeenCalledTimes(2);
        expect(mockGetFinancialContext).toHaveBeenCalledWith('AAPL');
        expect(mockGetFinancialContext).toHaveBeenCalledWith('MSFT');
    });
});
