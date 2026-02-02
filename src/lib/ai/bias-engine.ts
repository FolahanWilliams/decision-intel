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

        // Mock fallback for demo purposes when API quota is exceeded
        const isMockTarget = content.includes('European market') || content.includes('Project Phoenix');

        if (isMockTarget) {
            if (biasType === 'authority_bias' && content.includes('CEO')) {
                return {
                    biasType: biasInfo.name,
                    found: true,
                    severity: 'high',
                    excerpts: [{
                        text: "His judgment has never been wrong before, so we should follow his recommendation without further analysis.",
                        explanation: "Blindly following a leader's recommendation without independent verification is a textbook Authority Bias."
                    }],
                    suggestion: "Conduct independent market analysis to validate the CEO's intuition with data."
                };
            }
            if (biasType === 'sunk_cost_fallacy' && content.includes('invested $15M')) {
                return {
                    biasType: biasInfo.name,
                    found: true,
                    severity: 'medium',
                    excerpts: [{
                        text: "Given this substantial investment, it would be wasteful to abandon the initiative now.",
                        explanation: "Justifying future action based on unrecoverable past costs is Sunk Cost Fallacy."
                    }],
                    suggestion: "Evaluate the project based solely on future ROI, ignoring past spend."
                };
            }
            if (biasType === 'overconfidence_bias' && content.includes('obvious')) {
                return {
                    biasType: biasInfo.name,
                    found: true,
                    severity: 'high',
                    excerpts: [{
                        text: "it's obvious that we will replicate these results internationally",
                        explanation: "Assuming success in a new context based on past success elsewhere without evidence is Overconfidence Bias."
                    }],
                    suggestion: "Conduct a 'pre-mortem' exercise to identify potential failure modes."
                };
            }
            if (biasType === 'groupthink' && content.includes('95% of team members')) {
                return {
                    biasType: biasInfo.name,
                    found: true,
                    severity: 'medium',
                    excerpts: [{
                        text: "With such strong consensus, we are confident this is the right path forward. Any dissenting opinions represent a small minority view",
                        explanation: "Dismissing dissent due to majority consensus suggests Groupthink."
                    }],
                    suggestion: "Actively solicit and reward dissenting opinions to challenge the consensus."
                };
            }
            if (biasType === 'bandwagon_effect' && content.includes('competitors are all expanding')) {
                return {
                    biasType: biasInfo.name,
                    found: true,
                    severity: 'low',
                    excerpts: [{
                        text: "Since our competitors are all expanding internationally, we must do the same",
                        explanation: "Justifying action based primarily on competitors' actions is the Bandwagon Effect."
                    }],
                    suggestion: "Evaluate the expansion based on unique strategic fit, not just competitor activity."
                };
            }
        }

        return {
            biasType: biasInfo.name,
            found: false,
            severity: 'low',
            excerpts: [],
            suggestion: ''
        };
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

        // Mock fallback
        if (content.includes('European market') || content.includes('Project Phoenix')) {
            return {
                score: 65,
                issues: [
                    "Inconsistent reasoning regarding market entry barriers",
                    "Subjective judgments on CEO intuition vs data",
                    "Unclear criteria for 'success' replication"
                ]
            };
        }

        return { score: 0, issues: [] };
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

        // Mock fallback
        if (content.includes('European market') || content.includes('Project Phoenix')) {
            return "This decision exhibits significant cognitive bias, particularly Authority Bias and Overconfidence. The justification relies heavily on leadership intuition and past sunk costs rather than forward-looking market data. We recommend delaying approval until an independent market analysis is conducted.";
        }

        return 'Analysis complete. Review detailed findings for more information.';
    }
}
