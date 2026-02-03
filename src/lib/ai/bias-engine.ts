import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { BiasDetectionResult, BIAS_CATEGORIES, BiasCategory } from '@/types';
import { BIAS_PROMPTS } from './prompts';

type LLMProvider = 'openai' | 'anthropic';

interface LLMConfig {
    provider: LLMProvider;
    openai?: OpenAI;
    anthropic?: Anthropic;
}

let llmConfig: LLMConfig | null = null;

export function initializeLLM(): LLMConfig {
    if (llmConfig) return llmConfig;

    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (openaiKey) {
        llmConfig = {
            provider: 'openai',
            openai: new OpenAI({ apiKey: openaiKey }),
        };
    } else if (anthropicKey) {
        llmConfig = {
            provider: 'anthropic',
            anthropic: new Anthropic({ apiKey: anthropicKey }),
        };
    } else {
        throw new Error('No LLM API key found. Set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env');
    }

    return llmConfig;
}

async function queryLLM(prompt: string): Promise<string> {
    const config = initializeLLM();

    if (config.provider === 'openai' && config.openai) {
        const response = await config.openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert in cognitive psychology and decision-making analysis. You analyze documents for cognitive biases and decision-making errors. Always respond with valid JSON.'
                },
                { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            response_format: { type: 'json_object' }
        });
        return response.choices[0].message.content || '{}';
    } else if (config.provider === 'anthropic' && config.anthropic) {
        const response = await config.anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            system: 'You are an expert in cognitive psychology and decision-making analysis. You analyze documents for cognitive biases and decision-making errors. Always respond with valid JSON only, no additional text.',
            messages: [{ role: 'user', content: prompt }]
        });
        const textBlock = response.content.find(block => block.type === 'text');
        return textBlock && textBlock.type === 'text' ? textBlock.text : '{}';
    }

    throw new Error('LLM not configured');
}

export async function detectBias(
    content: string,
    biasType: BiasCategory
): Promise<BiasDetectionResult> {
    const biasInfo = BIAS_CATEGORIES[biasType];
    const promptTemplate = BIAS_PROMPTS[biasType];

    const prompt = promptTemplate.replace('{content}', content);

    try {
        const response = await queryLLM(prompt);
        const result = JSON.parse(response);

        return {
            biasType: biasInfo.name,
            found: result.found ?? false,
            severity: result.severity ?? 'low',
            excerpts: result.excerpts ?? [],
            suggestion: result.suggestion ?? ''
        };
    } catch (error) {
        console.error(`Error detecting ${biasType}:`, error);
        throw error;
    }
}

export async function detectNoise(content: string): Promise<{ score: number; issues: string[] }> {
    const prompt = `
Analyze the following decision document for "noise" - unwanted variability and inconsistency in decision-making.

Look for:
1. Inconsistent reasoning or logic
2. Contradictory statements or recommendations
3. Variability in risk assessments for similar situations
4. Subjective judgments that could vary between evaluators
5. Ambiguous language that could be interpreted differently
6. Missing criteria or unclear standards

Document:
${content}

Respond in JSON format:
{
  "score": number between 0-100 (0 = no noise, 100 = extremely noisy),
  "issues": [array of specific noise issues found]
}
`;

    try {
        const response = await queryLLM(prompt);
        const result = JSON.parse(response);
        return {
            score: result.score ?? 0,
            issues: result.issues ?? []
        };
    } catch (error) {
        console.error('Error detecting noise:', error);
        throw error;
    }
}

export async function generateSummary(
    content: string,
    biases: BiasDetectionResult[],
    noiseScore: number
): Promise<string> {
    const foundBiases = biases.filter(b => b.found);

    const prompt = `
Based on the following analysis of a decision document, generate a brief executive summary (2-3 sentences).

Document excerpt (first 1000 chars):
${content.slice(0, 1000)}

Biases Found:
${foundBiases.map(b => `- ${b.biasType} (${b.severity})`).join('\n') || 'None'}

Noise Score: ${noiseScore}/100

Generate a summary that:
1. States the overall quality of the decision-making
2. Highlights the most concerning issues if any
3. Is professional and actionable

Respond in JSON format:
{
  "summary": "your summary here"
}
`;

    try {
        const response = await queryLLM(prompt);
        const result = JSON.parse(response);
        return result.summary || 'Analysis complete.';
    } catch (error) {
        console.error('Error generating summary:', error);
        throw error;
    }
}
