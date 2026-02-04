import {
    structurerNode,
    biasDetectiveNode,
    noiseJudgeNode,
    gdprAnonymizerNode,
    factCheckerNode,
    riskScorerNode,
    preMortemNode,
    complianceMapperNode
} from '../nodes';
import { AuditState } from '../types';
import { getFinancialContext } from '../../tools/financial';

// Define mocks before importing the module under test
jest.mock('@google/generative-ai', () => {
    const mockGen = jest.fn();
    return {
        GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
            getGenerativeModel: jest.fn().mockReturnValue({
                generateContent: mockGen
            })
        })),
        __mockGenerateContent: mockGen
    };
});

jest.mock('../../tools/financial', () => ({
    getFinancialContext: jest.fn()
}));

// Access the internal mock function
const { __mockGenerateContent } = require('@google/generative-ai') as any;
const mockGenerateContent = __mockGenerateContent as jest.Mock;

// Helper to mock LLM text response
const mockLLMResponse = (text: string) => {
    return {
        response: {
            text: () => text
        }
    };
};

describe('Agent Nodes', () => {
    let initialState: AuditState;

    beforeEach(() => {
        jest.clearAllMocks();
        mockGenerateContent.mockReset(); // Reset the specific mock
        initialState = {
            documentId: 'test-doc',
            originalContent: 'Test content',
        };
        // Default mock implementation to avoid errors if not specified
        mockGenerateContent.mockResolvedValue(mockLLMResponse('{}'));
    });

    describe('structurerNode', () => {
        it('should return structured content and speakers when LLM returns valid JSON', async () => {
            const mockOutput = {
                structuredContent: 'Clean content',
                speakers: ['Speaker A']
            };
            mockGenerateContent.mockResolvedValue(mockLLMResponse(JSON.stringify(mockOutput)));

            const result = await structurerNode(initialState);

            expect(mockGenerateContent).toHaveBeenCalledWith([
                expect.stringContaining('You are a Data Structurer'),
                expect.stringContaining('Input Text:\nTest content')
            ]);
            expect(result).toEqual(mockOutput);
        });

        it('should handle JSON wrapped in markdown code blocks', async () => {
            const mockOutput = {
                structuredContent: 'Clean content',
                speakers: ['Speaker A']
            };
            const text = `Here is the JSON:\n\`\`\`json\n${JSON.stringify(mockOutput)}\n\`\`\``;
            mockGenerateContent.mockResolvedValue(mockLLMResponse(text));

            const result = await structurerNode(initialState);

            expect(result).toEqual(mockOutput);
        });

        it('should return original content if LLM returns invalid JSON', async () => {
            mockGenerateContent.mockResolvedValue(mockLLMResponse('Not JSON'));

            const result = await structurerNode(initialState);

            expect(result).toEqual({
                structuredContent: initialState.originalContent,
                speakers: []
            });
        });

        it('should return original content if LLM throws an error', async () => {
            mockGenerateContent.mockRejectedValue(new Error('API Error'));

            const result = await structurerNode(initialState);

            expect(result).toEqual({
                structuredContent: initialState.originalContent,
                speakers: []
            });
        });
    });

    describe('biasDetectiveNode', () => {
        it('should return bias analysis when LLM returns valid JSON', async () => {
            const mockBiases = [{ biasType: 'Confirmation Bias', severity: 'high' }];
            mockGenerateContent.mockResolvedValue(mockLLMResponse(JSON.stringify({ biases: mockBiases })));

            const result = await biasDetectiveNode(initialState);

            expect(mockGenerateContent).toHaveBeenCalledWith([
                expect.stringContaining('Psycholinguistic Detective'),
                expect.stringContaining('Text to Analyze:\nTest content')
            ]);
            expect(result).toEqual({ biasAnalysis: mockBiases });
        });

        it('should return empty list if LLM fails', async () => {
            mockGenerateContent.mockRejectedValue(new Error('API Error'));

            const result = await biasDetectiveNode(initialState);

            expect(result).toEqual({ biasAnalysis: [] });
        });
    });

    describe('noiseJudgeNode', () => {
        it('should calculate statistics correctly from 3 judges', async () => {
            // Mock 3 different responses
            mockGenerateContent
                .mockResolvedValueOnce(mockLLMResponse(JSON.stringify({ score: 80 })))
                .mockResolvedValueOnce(mockLLMResponse(JSON.stringify({ score: 90 })))
                .mockResolvedValueOnce(mockLLMResponse(JSON.stringify({ score: 70 })));

            const result = await noiseJudgeNode(initialState);

            expect(mockGenerateContent).toHaveBeenCalledTimes(3);
            expect(result.noiseScores).toEqual([80, 90, 70]);

            // Mean: (80+90+70)/3 = 80
            // Variance: ((0)^2 + (10)^2 + (-10)^2)/3 = 200/3 = 66.66... -> 66.7
            // StdDev: sqrt(66.66...) = 8.16... -> 8.2

            expect(result.noiseStats?.mean).toBe(80);
            expect(result.noiseStats?.variance).toBeCloseTo(66.7, 1);
            expect(result.noiseStats?.stdDev).toBeCloseTo(8.2, 1);
        });

        it('should filter out invalid scores', async () => {
            mockGenerateContent
                .mockResolvedValueOnce(mockLLMResponse(JSON.stringify({ score: 80 })))
                .mockResolvedValueOnce(mockLLMResponse('Invalid JSON'))
                .mockResolvedValueOnce(mockLLMResponse(JSON.stringify({ score: 0 }))); // 0 is filtered out in code: s > 0

            const result = await noiseJudgeNode(initialState);

            expect(result.noiseScores).toEqual([80]);
            expect(result.noiseStats?.mean).toBe(80);
            expect(result.noiseStats?.stdDev).toBe(0);
        });

        it('should handle all judges failing', async () => {
            mockGenerateContent.mockRejectedValue(new Error('API Error'));

            const result = await noiseJudgeNode(initialState);

            expect(result.noiseScores).toEqual([]);
            expect(result.noiseStats).toEqual({ mean: 0, stdDev: 0, variance: 0 });
        });
    });

    describe('gdprAnonymizerNode', () => {
        it('should return redacted text on success', async () => {
            const mockOutput = { redactedText: 'Redacted content' };
            mockGenerateContent.mockResolvedValue(mockLLMResponse(JSON.stringify(mockOutput)));

            const result = await gdprAnonymizerNode(initialState);

            expect(result).toEqual({ structuredContent: 'Redacted content' });
        });

        it('should return original content on failure', async () => {
            mockGenerateContent.mockRejectedValue(new Error('Error'));

            const result = await gdprAnonymizerNode(initialState);

            expect(result).toEqual({ structuredContent: initialState.originalContent });
        });
    });

    describe('factCheckerNode', () => {
        it('should handle case with no tickers found', async () => {
            // Step 1: Extract tickers -> empty
            mockGenerateContent.mockResolvedValueOnce(mockLLMResponse(JSON.stringify({ tickers: [] })));

            // Step 3: Verify claims (Step 2 skipped)
            mockGenerateContent.mockResolvedValueOnce(mockLLMResponse(JSON.stringify({ score: 95, flags: [] })));

            const result = await factCheckerNode(initialState);

            expect(getFinancialContext).not.toHaveBeenCalled();
            expect(result.factCheckResult).toEqual({ score: 95, flags: [] });
        });

        it('should fetch financial data when tickers are found', async () => {
            // Step 1: Extract tickers
            mockGenerateContent.mockResolvedValueOnce(mockLLMResponse(JSON.stringify({ tickers: ['AAPL'] })));

            // Mock financial tool
            (getFinancialContext as jest.Mock).mockResolvedValue('AAPL Price: 150');

            // Step 3: Verify claims
            mockGenerateContent.mockResolvedValueOnce(mockLLMResponse(JSON.stringify({ score: 80, flags: ['Flag'] })));

            const result = await factCheckerNode(initialState);

            expect(getFinancialContext).toHaveBeenCalledWith('AAPL');
            expect(mockGenerateContent).toHaveBeenLastCalledWith([
                expect.stringContaining('Fact Checker'),
                expect.stringContaining('Test content'),
                expect.stringContaining('AAPL Price: 150')
            ]);
            expect(result.factCheckResult).toEqual({ score: 80, flags: ['Flag'] });
        });

        it('should return default score on failure', async () => {
            mockGenerateContent.mockRejectedValue(new Error('Error'));

            const result = await factCheckerNode(initialState);

            expect(result.factCheckResult).toEqual({ score: 100, flags: [] });
        });
    });

    describe('riskScorerNode', () => {
        it('should calculate risk score correctly', async () => {
            const state: AuditState = {
                ...initialState,
                biasAnalysis: [
                    { severity: 'high' }, // 30 points
                    { severity: 'low' }   // 5 points
                ], // Total bias deduction: 35
                noiseStats: {
                    mean: 90,
                    stdDev: 5,
                    variance: 25
                },
                factCheckResult: {
                    score: 80, // Trust penalty: 100 - 80 = 20. 20 * 0.2 = 4
                    flags: []
                }
            };

            // Noise penalty: stdDev * 4 = 5 * 4 = 20

            // Calculation:
            // Base = 90
            // Deductions = 35 (bias) + 20 (noise) + 4 (trust) = 59
            // Score = 90 - 59 = 31

            const result = await riskScorerNode(state);

            expect(result.finalReport?.overallScore).toBe(31);
            expect(result.finalReport?.noiseScore).toBe(50); // stdDev(5) * 10
        });

        it('should clamp score between 0 and 100', async () => {
             const state: AuditState = {
                ...initialState,
                biasAnalysis: [],
                noiseStats: { mean: 150, stdDev: 0, variance: 0 }, // Base > 100
                factCheckResult: { score: 100, flags: [] }
            };

            const result = await riskScorerNode(state);
            expect(result.finalReport?.overallScore).toBe(100);

            const lowState: AuditState = {
                ...initialState,
                biasAnalysis: [{ severity: 'critical' }, { severity: 'critical' }, { severity: 'critical' }], // 150 deduction
                noiseStats: { mean: 50, stdDev: 0, variance: 0 },
                factCheckResult: { score: 100, flags: [] }
            };

            const lowResult = await riskScorerNode(lowState);
            expect(lowResult.finalReport?.overallScore).toBe(0);
        });

        it('should use default mean 100 if missing', async () => {
             const state: AuditState = {
                ...initialState,
                biasAnalysis: [],
                noiseStats: undefined,
                factCheckResult: undefined
            };

            // Base: 100
            // Deductions: 0
            // Noise penalty: 0
            // Trust penalty: 100 - 100 = 0 -> 0
            // Result: 100

            const result = await riskScorerNode(state);
            expect(result.finalReport?.overallScore).toBe(100);
        });
    });

    describe('Placeholder Nodes', () => {
        it('preMortemNode should return empty object', async () => {
            const result = await preMortemNode(initialState);
            expect(result).toEqual({});
        });

        it('complianceMapperNode should return empty object', async () => {
            const result = await complianceMapperNode(initialState);
            expect(result).toEqual({});
        });
    });
});
