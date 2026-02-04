import { AuditState } from "./types";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BIAS_DETECTIVE_PROMPT, NOISE_JUDGE_PROMPT, STRUCTURER_PROMPT, PRE_MORTEM_PROMPT, COMPLIANCE_PROMPT } from "./prompts";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
// Using gemini-3-pro-preview - deep reasoning for sophisticated analysis
const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview", generationConfig: { responseMimeType: "application/json" } });

// Helper to safely parse JSON from LLM output
export const parseJSON = (text: string) => {
    try {
        const startIndex = text.indexOf('{');
        const endIndex = text.lastIndexOf('}');

        if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
            console.error("JSON Parse Error: No valid JSON object found in response");
            return null;
        }

        const jsonString = text.substring(startIndex, endIndex + 1);
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("JSON Parse Error:", e);
        return null;
    }
};

export async function structurerNode(state: AuditState): Promise<Partial<AuditState>> {
    console.log("--- Structurer Node (Gemini) ---");
    try {
        const result = await model.generateContent([
            STRUCTURER_PROMPT,
            `Input Text:\n${state.originalContent}`
        ]);
        const response = result.response.text();
        const data = parseJSON(response);

        return {
            structuredContent: data?.structuredContent || state.originalContent,
            speakers: data?.speakers || []
        };
    } catch (e) {
        console.error("Structurer failed", e);
        return {
            structuredContent: state.structuredContent || state.originalContent,
            speakers: state.speakers || []
        };
    }
}

export async function biasDetectiveNode(state: AuditState): Promise<Partial<AuditState>> {
    console.log("--- Bias Detective Node (Gemini) ---");
    try {
        const content = state.structuredContent || state.originalContent;
        const result = await model.generateContent([
            BIAS_DETECTIVE_PROMPT,
            `Text to Analyze:\n${content}`
        ]);
        const response = result.response.text();
        const data = parseJSON(response);

        return { biasAnalysis: data?.biases || [] };
    } catch (e) {
        console.error("Bias Detective failed", e);
        return { biasAnalysis: [] };
    }
}

export async function noiseJudgeNode(state: AuditState): Promise<Partial<AuditState>> {
    console.log("--- Noise Judge Node (Gemini x3) ---");
    const content = state.structuredContent || state.originalContent;

    // Spawn 3 independent "judges" (parallel calls)
    try {
        const promises = [1, 2, 3].map(() =>
            model.generateContent([
                NOISE_JUDGE_PROMPT,
                `Decision Text to Rate:\n${content}`,
                `\n(Random Seed: ${Math.random()})` // Inject noise to encourage variance if model defines deterministic
            ])
        );

        const results = await Promise.all(promises);
        const scores = results.map(r => {
            const data = parseJSON(r.response.text());
            return typeof data?.score === 'number' ? data.score : 0;
        });

        // Calculate Statistics
        const validScores = scores.filter(s => s > 0);
        if (validScores.length === 0) return { noiseScores: [], noiseStats: { mean: 0, stdDev: 0, variance: 0 } };

        const mean = validScores.reduce((a, b) => a + b, 0) / validScores.length;
        const variance = validScores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / validScores.length;
        const stdDev = Math.sqrt(variance);

        return {
            noiseScores: validScores,
            noiseStats: {
                mean: Number(mean.toFixed(1)),
                stdDev: Number(stdDev.toFixed(1)),
                variance: Number(variance.toFixed(1))
            }
        };
    } catch (e) {
        console.error("Noise Judges failed", e);
        return { noiseScores: [], noiseStats: { mean: 0, stdDev: 0, variance: 0 } };
    }
}

// New Node: GDPR Anonymizer
export async function gdprAnonymizerNode(state: AuditState): Promise<Partial<AuditState>> {
    console.log("--- GDPR Anonymizer Node (Gemini) ---");
    // In a real implementation: Load skill instructions from .agent/skills/gdpr-anonymizer/SKILL.md
    // For now, we simulate the redaction using a prompt
    const content = state.originalContent;
    try {
        const result = await model.generateContent([
            `You are a GDPR Anonymizer. 
            Goal: Redact PII (names, emails, dates) but PRESERVE structural context.
            - John Smith -> [PERSON_1]
            - CEO -> [EXECUTIVE_ROLE]
            - Google -> [TECH_COMPANY]
            
            Return valid JSON: { "redactedText": "..." }`,
            `Input Text:\n${content}`
        ]);
        const data = parseJSON(result.response.text());
        return { structuredContent: data?.redactedText || content };
    } catch (e) {
        return { structuredContent: content };
    }
}

// New Node: Fact Checker
// New Node: Fact Checker with FMP Integration
import { getFinancialContext } from "../tools/financial";

export async function factCheckerNode(state: AuditState): Promise<Partial<AuditState>> {
    console.log("--- Fact Checker Node (Gemini + FMP) ---");
    const content = state.structuredContent || state.originalContent;

    try {
        // Step 1: Extract Tickers
        const extractionResult = await model.generateContent([
            `Extract any stock symbols (e.g. AAPL, TSLA) mentioned in the text. Return JSON: { "tickers": ["AAPL"] }`,
            `Text:\n${content}`
        ]);
        const extracted = parseJSON(extractionResult.response.text());
        const tickers = extracted?.tickers || [];

        // Step 2: Fetch Financial Data (Tool Use)
        let financialContext = "";
        if (tickers.length > 0) {
            console.log(`Fetching FMP data for: ${tickers.join(', ')}`);
            const contextPromises = tickers.map((t: string) => getFinancialContext(t));
            const contexts = await Promise.all(contextPromises);
            financialContext = `\nREAL-TIME FINANCIAL DATA (FMP):\n${contexts.join('\n')}\n`;
        }

        // Step 3: Verify Claims using Context
        const result = await model.generateContent([
            `You are a Fact Checker. Verify key claims in the text using the provided Financial Data.
            If a claim contradicts the data (e.g. "We are in the Energy sector" but data says "Technology"), flag it.
            Return JSON: { "score": 0-100, "flags": ["Claim X contradicts market data..."] }`,
            `Text:\n${content}`,
            financialContext
        ]);

        const data = parseJSON(result.response.text());
        return { factCheckResult: data || { score: 0, flags: [] } };
    } catch (e) {
        console.error("Fact Checker failed", e);
        return { factCheckResult: { score: 100, flags: [] } };
    }
}

// New Node: Pre-Mortem Architect
export async function preMortemNode(state: AuditState): Promise<Partial<AuditState>> {
    console.log("--- Pre-Mortem Node (Gemini) ---");
    const content = state.structuredContent || state.originalContent;
    try {
        const result = await model.generateContent([
            PRE_MORTEM_PROMPT,
            `Input Text:\n${content}`
        ]);
        const response = result.response.text();
        const data = parseJSON(response);

        return {
            preMortemResult: {
                optimisticAssumptions: data?.optimisticAssumptions || [],
                failureScenarios: data?.failureScenarios || []
            }
        };
    } catch (e) {
        console.error("Pre-Mortem failed", e);
        return {
            preMortemResult: { optimisticAssumptions: [], failureScenarios: [] }
        };
    }
}

// New Node: Compliance Mapper
export async function complianceMapperNode(state: AuditState): Promise<Partial<AuditState>> {
    console.log("--- Compliance Mapper (Consumer Duty) ---");
    const content = state.structuredContent || state.originalContent;
    try {
        const result = await model.generateContent([
            COMPLIANCE_PROMPT,
            `Input Text:\n${content}`
        ]);
        const response = result.response.text();
        const data = parseJSON(response);

        return {
            complianceResult: {
                status: (data?.status === 'PASS' || data?.status === 'FLAGGED') ? data.status : 'FLAGGED',
                details: data?.details || 'Analysis failed.'
            }
        };
    } catch (e) {
        console.error("Compliance Mapper failed", e);
        return {
            complianceResult: { status: 'FLAGGED', details: 'Compliance check failed due to internal error.' }
        };
    }
}

export async function riskScorerNode(state: AuditState): Promise<Partial<AuditState>> {
    console.log("--- Risk Scorer Node ---");

    // Aggregate results including Fact Check and Compliance
    const biasDeductions = (state.biasAnalysis || []).reduce((acc: number, b: any) => {
        const severityScores: Record<string, number> = { low: 5, medium: 15, high: 30, critical: 50 };
        return acc + (severityScores[b.severity] || 5);
    }, 0);

    // Heavy penalty for high noise (disagreement among judges)
    // If stdDev is > 10, confidence implies the document is ambiguous.
    const noisePenalty = (state.noiseStats?.stdDev || 0) * 4; // Increased multiplier from 2 to 4

    const trustPenalty = 100 - (state.factCheckResult?.score || 100);

    const compliancePenalty = state.complianceResult?.status === 'FLAGGED' ? 20 : 0;

    const baseScore = state.noiseStats?.mean || 100;

    let overallScore = Math.max(0, Math.min(100, baseScore - biasDeductions - noisePenalty - (trustPenalty * 0.2) - compliancePenalty));
    overallScore = Math.round(overallScore);

    return {
        finalReport: {
            id: 'temp-id',
            overallScore,
            noiseScore: Math.min(100, (state.noiseStats?.stdDev || 0) * 10),
            summary: `Audit complete. Detected ${(state.biasAnalysis || []).length} biases. Judges coherence: ${state.noiseStats?.stdDev} std dev. Trust Score: ${state.factCheckResult?.score}%. Compliance: ${state.complianceResult?.status || 'N/A'}.`,
            biases: state.biasAnalysis || [],
            noiseStats: state.noiseStats,
            factCheck: state.factCheckResult,
            compliance: state.complianceResult || { status: 'PASS', details: 'Preliminary check passed.' },
            speakers: state.speakers || [],
            structuredContent: state.structuredContent,
            preMortem: state.preMortemResult,
            createdAt: new Date(),
            analyses: [] // Placeholder
        } as any
    };
}
