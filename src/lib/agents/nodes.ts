import { AuditState } from "./types";
import { parseJSON } from '../utils/json';
import { sanitizeInput } from '../utils/text';
import { AnalysisResult } from '../../types';
import { GEMINI_MODEL_NAME } from '../config';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import {
    BIAS_DETECTIVE_PROMPT,
    NOISE_JUDGE_PROMPT,
    STRUCTURER_PROMPT,
    GDPR_ANONYMIZER_PROMPT,
    FACT_CHECKER_EXTRACTION_PROMPT,
    FACT_CHECKER_VERIFICATION_PROMPT,
    PRE_MORTEM_PROMPT,
    COMPLIANCE_MAPPER_PROMPT,
    SENTIMENT_ANALYZER_PROMPT
} from "./prompts";

if (!process.env.GOOGLE_API_KEY) {
    throw new Error("Missing GOOGLE_API_KEY env variable");
}
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
// Using gemini-3-pro-preview - deep reasoning for sophisticated analysis
const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL_NAME,
    generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 8192
    },
    safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
    ]
});

// Timeout wrapper for LLM calls to prevent hanging
const LLM_TIMEOUT_MS = 45000; // 45 seconds

async function withTimeout<T>(promise: Promise<T>, ms: number = LLM_TIMEOUT_MS): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`LLM timeout after ${ms}ms`)), ms)
    );
    return Promise.race([promise, timeout]);
}

// Helper to safely parse JSON from LLM output - Imported from utils/json

export async function structurerNode(state: AuditState): Promise<Partial<AuditState>> {
    console.log("--- Structurer Node (Gemini) ---");
    try {
        const content = sanitizeInput(state.structuredContent || state.originalContent);
        const result = await withTimeout(model.generateContent([
            STRUCTURER_PROMPT,
            `Input Text:\n<input_text>\n${content}\n</input_text>`
        ]));
        const response = result.response.text();
        const data = parseJSON(response);

        return {
            structuredContent: data?.structuredContent || content,
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
        const content = sanitizeInput(state.structuredContent || state.originalContent);
        const result = await withTimeout(model.generateContent([
            BIAS_DETECTIVE_PROMPT,
            `Text to Analyze:\n<input_text>\n${content}\n</input_text>`
        ]));
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
    const content = sanitizeInput(state.structuredContent || state.originalContent);

    // Spawn 3 independent "judges" (parallel calls)
    try {
        const promises = [1, 2, 3].map(() =>
            withTimeout(model.generateContent([
                NOISE_JUDGE_PROMPT,
                `Decision Text to Rate:\n<input_text>\n${content}\n</input_text>`,
                `\n(Random Seed: ${Math.random()})` // Inject noise to encourage variance if model defines deterministic
            ]))
        );

        const results = await Promise.all(promises);
        const scores = results.map(r => {
            const data = parseJSON(r.response.text());
            return typeof data?.score === 'number' ? data.score : 0;
        });

        // Calculate Statistics
        const validScores = scores.filter(s => typeof s === 'number' && isFinite(s));
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
    const content = sanitizeInput(state.originalContent);
    try {
        const result = await withTimeout(model.generateContent([
            GDPR_ANONYMIZER_PROMPT,
            `Input Text:\n<input_text>\n${content}\n</input_text>`
        ]));
        const data = parseJSON(result.response.text());
        return { structuredContent: data?.redactedText || content };
    } catch (e) {
        // FAIL SAFE: Do not return raw content if redaction failed.
        return { structuredContent: "[REDACTION_FAILED_ERROR] Processing halted to protect PII." };
    }
}

// New Node: Fact Checker
// New Node: Fact Checker with FMP Integration
import { getFinancialContext } from "../tools/financial";

export async function factCheckerNode(state: AuditState): Promise<Partial<AuditState>> {
    console.log("--- Fact Checker Node (Gemini + FMP) ---");
    const content = sanitizeInput(state.structuredContent || state.originalContent);

    try {
        // Step 1: Extract Tickers
        const extractionResult = await model.generateContent([
            FACT_CHECKER_EXTRACTION_PROMPT,
            `Text:\n<input_text>\n${content}\n</input_text>`
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
            FACT_CHECKER_VERIFICATION_PROMPT,
            `Text:\n<input_text>\n${content}\n</input_text>`,
            financialContext
        ]);

        const data = parseJSON(result.response.text());
        return { factCheckResult: data || { score: 0, flags: [] } };
    } catch (e) {
        console.error("Fact Checker failed", e);
        // FAIL SAFE: Return 0 score on error, not 100.
        return { factCheckResult: { score: 0, flags: ["Error: Fact Check Service Unavailable"] } };
    }
}

// New Node: Pre-Mortem Architect
export async function preMortemNode(state: AuditState): Promise<Partial<AuditState>> {
    console.log("--- Pre-Mortem Node (Gemini) ---");
    const content = sanitizeInput(state.structuredContent || state.originalContent);
    try {
        const result = await model.generateContent([
            PRE_MORTEM_PROMPT,
            `Text:\n<input_text>\n${content}\n</input_text>`
        ]);
        const data = parseJSON(result.response.text());
        return { preMortem: data || { failureScenarios: [], preventiveMeasures: [] } }; // Note: Update AuditState type if needed, or store in 'analyses'
    } catch (e) {
        console.error("Pre-Mortem failed", e);
        return {};
    }
}

// New Node: Compliance Mapper
export async function complianceMapperNode(state: AuditState): Promise<Partial<AuditState>> {
    console.log("--- Compliance Mapper (Consumer Duty) ---");
    const content = sanitizeInput(state.structuredContent || state.originalContent);
    try {
        const result = await model.generateContent([
            COMPLIANCE_MAPPER_PROMPT,
            `Text:\n<input_text>\n${content}\n</input_text>`
        ]);
        const data = parseJSON(result.response.text());
        return { compliance: data || { status: "WARN", details: "Compliance check failed to parse." } };
    } catch (e) {
        console.error("Compliance failed", e);
        return { compliance: { status: "WARN", details: "Compliance service unavailable." } };
    }
}

export async function riskScorerNode(state: AuditState): Promise<Partial<AuditState>> {
    console.log("--- Risk Scorer Node ---");

    // Aggregate results including Fact Check and Compliance
    const biasDeductions = (state.biasAnalysis || []).reduce((acc: number, b) => {
        const severityScores: Record<string, number> = { low: 5, medium: 15, high: 30, critical: 50 };
        return acc + (severityScores[b.severity] || 5);
    }, 0);

    // Heavy penalty for high noise (disagreement among judges)
    // If stdDev is > 10, confidence implies the document is ambiguous.
    const noisePenalty = (state.noiseStats?.stdDev || 0) * 4; // Increased multiplier from 2 to 4

    const trustPenalty = 100 - (state.factCheckResult?.score || 100);

    const baseScore = state.noiseStats?.mean || 100;

    let overallScore = Math.max(0, Math.min(100, baseScore - biasDeductions - noisePenalty - (trustPenalty * 0.2)));
    overallScore = Math.round(overallScore);

    return {
        finalReport: {
            // id: generated by DB
            overallScore,
            noiseScore: Math.min(100, (state.noiseStats?.stdDev || 0) * 10),
            summary: `Audit complete. Detected ${(state.biasAnalysis || []).length} biases. Judges coherence: ${state.noiseStats?.stdDev} std dev. Trust Score: ${state.factCheckResult?.score}%`,
            biases: state.biasAnalysis || [],
            noiseStats: state.noiseStats,
            factCheck: state.factCheckResult,
            compliance: state.compliance || { status: 'WARN', details: 'Compliance check unavailable.' },
            preMortem: state.preMortem,
            sentiment: state.sentimentAnalysis,
            speakers: state.speakers || [],
            createdAt: new Date(),
            analyses: [] // Placeholder
        } as AnalysisResult
    };
}

export async function sentimentAnalyzerNode(state: AuditState): Promise<Partial<AuditState>> {
    console.log("--- Sentiment Analyzer Node (Gemini) ---");
    try {
        const content = sanitizeInput(state.structuredContent || state.originalContent);
        const result = await withTimeout(model.generateContent([
            SENTIMENT_ANALYZER_PROMPT,
            `Text to Analyze:\n<input_text>\n${content}\n</input_text>`
        ]));
        const response = result.response.text();
        const data = parseJSON(response);

        return { sentimentAnalysis: data || { score: 0, label: 'Neutral' } };
    } catch (e) {
        console.error("Sentiment Analyzer failed", e);
        return { sentimentAnalysis: { score: 0, label: 'Neutral' } };
    }
}
