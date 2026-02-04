import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

// Mock dependencies
const mockGenerateContent = vi.fn();
const mockGetGenerativeModel = vi.fn(() => ({
    generateContent: mockGenerateContent
}));

vi.mock('@google/generative-ai', () => {
    return {
        GoogleGenerativeAI: vi.fn(function() {
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

describe('sentimentAnalyzerNode', () => {
    let sentimentAnalyzerNode: any;

    beforeAll(async () => {
        // Set env var before importing the module
        process.env.GOOGLE_API_KEY = 'test-key';

        // Dynamically import the module
        const module = await import('./nodes');
        sentimentAnalyzerNode = module.sentimentAnalyzerNode;
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should wrap input content in <input_text> tags to prevent prompt injection', async () => {
        mockGenerateContent.mockResolvedValue({
            response: {
                text: () => JSON.stringify({ score: 0.8, label: 'Positive' })
            }
        });

        const state: any = {
            structuredContent: 'This is a test content.'
        };

        await sentimentAnalyzerNode(state);

        expect(mockGenerateContent).toHaveBeenCalledTimes(1);
        const args = mockGenerateContent.mock.calls[0][0];
        const userPromptPart = args[1];

        expect(userPromptPart).toContain('<input_text>');
        expect(userPromptPart).toContain('This is a test content.');
        expect(userPromptPart).toContain('</input_text>');
    });

    it('should handle JSON parsing errors gracefully', async () => {
        mockGenerateContent.mockResolvedValue({
            response: {
                text: () => 'Invalid JSON'
            }
        });

        const state: any = {
            structuredContent: 'Test content'
        };

        const result = await sentimentAnalyzerNode(state);
        expect(result.sentimentAnalysis).toEqual({ score: 0, label: 'Neutral' });
    });
});
