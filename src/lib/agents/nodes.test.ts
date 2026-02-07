import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.hoisted(() => {
    process.env.GOOGLE_API_KEY = 'test-key';
});

import { riskScorerNode, linguisticAnalysisNode } from './nodes';
import { AuditState } from './types';

// Hoist mocks
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

describe('riskScorerNode', () => {
    it('should correctly aggregate scores and include new fields', async () => {
        const state: AuditState = {
            documentId: 'doc-1',
            originalContent: 'test content',
            biasAnalysis: [],
            noiseStats: { mean: 80, stdDev: 2, variance: 4 },
            factCheckResult: { score: 90, flags: [] },
            compliance: {
                status: 'WARN',
                riskScore: 50,
                summary: 'Warning',
                regulations: [],
                searchQueries: []
            },
            preMortem: { failureScenarios: ['Fail 1'], preventiveMeasures: ['Prevent 1'] },
            sentimentAnalysis: { score: 0.5, label: 'Positive' },
            speakers: ['Speaker A']
        };

        const result = await riskScorerNode(state);
        const report = result.finalReport;

        expect(report).toBeDefined();
        if (!report) return;

        expect(report.compliance).toEqual(state.compliance);
        expect(report.preMortem).toEqual(state.preMortem);
        expect(report.sentiment).toEqual(state.sentimentAnalysis);

        // formula: Score = Base(100) - Noise(2*5=10) - Trust((100-90)*0.3=3) = 87
        expect(report.overallScore).toBe(87);
    });

    it('should handle missing fields gracefully', async () => {
        const state: AuditState = {
            documentId: 'doc-1',
            originalContent: 'test content',
            // Missing compliance, preMortem, sentimentAnalysis
        };

        const result = await riskScorerNode(state);
        const report = result.finalReport;

        expect(report).toBeDefined();
        if (!report) return;

        // Check defaults
        expect(report.compliance).toEqual({ status: 'WARN', details: 'Compliance check unavailable.' });
        expect(report.preMortem).toBeUndefined();
        expect(report.sentiment).toBeUndefined();
        expect(report.overallScore).toBe(100);
    });
});

describe('linguisticAnalysisNode', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should parse valid JSON response for both sentiment and fallacies', async () => {
        mockGenerateContent.mockResolvedValueOnce({
            response: {
                text: () => JSON.stringify({
                    sentiment: { score: 0.8, label: 'Positive' },
                    logicalAnalysis: { score: 100, fallacies: [] }
                })
            }
        });

        const state: AuditState = {
            documentId: 'doc-1',
            originalContent: 'I am very happy and logical.',
            structuredContent: '',
            biasAnalysis: [],
            noiseStats: { mean: 0, stdDev: 0, variance: 0 },
            speakers: []
        };

        const result = await linguisticAnalysisNode(state);
        expect(result.sentimentAnalysis).toEqual({ score: 0.8, label: 'Positive' });
        expect(result.logicalAnalysis).toEqual({ score: 100, fallacies: [] });
    });

    it('should fallback to defaults on error', async () => {
        mockGenerateContent.mockRejectedValueOnce(new Error('API Error'));

        const state: AuditState = {
            documentId: 'doc-1',
            originalContent: 'content',
            structuredContent: '',
            biasAnalysis: [],
            noiseStats: { mean: 0, stdDev: 0, variance: 0 },
            speakers: []
        };

        const result = await linguisticAnalysisNode(state);
        expect(result.sentimentAnalysis).toEqual({ score: 0, label: 'Neutral' });
        expect(result.logicalAnalysis).toEqual({ score: 100, fallacies: [] });
    });
});
