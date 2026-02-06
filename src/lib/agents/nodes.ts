
import { AuditState } from "./types";
import { parseJSON } from '../utils/json';
import { AnalysisResult } from '../../types';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerativeModel } from "@google/generative-ai";
import { BIAS_DETECTIVE_PROMPT, NOISE_JUDGE_PROMPT } from "./prompts";
import { executeDataRequests, DataRequest } from "../tools/financial";

// ============================================================
// AI MODEL CONFIGURATION
// ============================================================

// Lazy singleton for the standard model (Fast, no tools)
let modelInstance: GenerativeModel | null = null;
let groundedModelInstance: GenerativeModel | null = null;

function getModel(): GenerativeModel {
    if (modelInstance) return modelInstance;

    if (!process.env.GOOGLE_API_KEY) {
        throw new Error("Missing GOOGLE_API_KEY env variable");
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    // Using gemini-3-flash-preview - cost-effective model for analysis tasks
    modelInstance = genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
        generationConfig: {
            responseMimeType: "application/json",
            maxOutputTokens: 16384
        },
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
        ]
    });

    return modelInstance;
}

// Grounded Model (With Google Search capability)
function getGroundedModel(): GenerativeModel {
    if (groundedModelInstance) return groundedModelInstance;

    if (!process.env.GOOGLE_API_KEY) {
        throw new Error("Missing GOOGLE_API_KEY env variable");
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    groundedModelInstance = genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
        tools: [
            // @ts-ignore - googleSearch is supported in v1beta but missing in some SDK types
            { googleSearch: {} }
        ],
        generationConfig: {
            responseMimeType: "application/json",
            maxOutputTokens: 16384
        },
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
        ]
    });

    return groundedModelInstance;
}

// Timeout wrapper for LLM calls to prevent hanging
const LLM_TIMEOUT_MS = 90000; // 90 seconds - increased for complex analysis

async function withTimeout<T>(promise: Promise<T>, ms: number = LLM_TIMEOUT_MS): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`LLM timeout after ${ms}ms`)), ms)
    );
    return Promise.race([promise, timeout]);
}

// Text truncation to prevent timeouts on large documents
const MAX_INPUT_CHARS = 25000; // ~6K tokens
function truncateText(text: string): string {
    if (text.length <= MAX_INPUT_CHARS) return text;
    console.log(`Truncating text from ${text.length} to ${MAX_INPUT_CHARS} chars`);
    return text.slice(0, MAX_INPUT_CHARS) + "\n\n[... text truncated for analysis ...]";
}

// ============================================================
// NODES
// ============================================================

export async function structurerNode(state: AuditState): Promise<Partial<AuditState>> {
    console.log("--- Structurer Node (Pass-through mode) ---");
    return {
        structuredContent: state.structuredContent || state.originalContent,
        speakers: []
    };
}

export async function biasDetectiveNode(state: AuditState): Promise<Partial<AuditState>> {
    console.log("--- Bias Detective Node (Gemini) ---");
    try {
        const content = truncateText(state.structuredContent || state.originalContent);

        const result = await withTimeout(getModel().generateContent([
            BIAS_DETECTIVE_PROMPT,
            `Text to Analyze: \n<input_text>\n${content} \n </input_text>`
        ]));

        const response = result.response?.text ? result.response.text() : "";
        const data = parseJSON(response);
        const biases = data?.biases || [];

        return { biasAnalysis: biases };
    } catch (e) {
        console.error("Bias Detective failed:", e instanceof Error ? e.message : String(e));
        return { biasAnalysis: [] };
    }
}

export async function noiseJudgeNode(state: AuditState): Promise<Partial<AuditState>> {
    console.log("--- Noise Judge Node (Gemini x3) ---");
    const content = truncateText(state.structuredContent || state.originalContent);

    try {
        const promises = [1, 2, 3].map(() =>
            withTimeout(getModel().generateContent([
                NOISE_JUDGE_PROMPT,
                `Decision Text to Rate:\n<input_text>\n${content}\n</input_text>`,
                `\n(Random Seed: ${Math.random()})`
            ]))
        );

        const results = await Promise.all(promises);
        const scores = results.map(r => {
            const text = r.response?.text ? r.response.text() : "";
            const data = parseJSON(text);
            return typeof data?.score === 'number' ? data.score : 0;
        });

        const validScores = scores.filter(s => typeof s === 'number' && isFinite(s));
        if (validScores.length === 0) return { noiseScores: [], noiseStats: { mean: 0, stdDev: 0, variance: 0 } };

        const mean = validScores.reduce((a, b) => a + b, 0) / validScores.length;
        const variance = validScores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / validScores.length;
        const stdDev = Math.sqrt(variance);

        return {
            noiseScores: validScores,
            noiseStats: { mean: Number(mean.toFixed(1)), stdDev: Number(stdDev.toFixed(1)), variance: Number(variance.toFixed(1)) }
        };
    } catch (e) {
        console.error("Noise Judges failed", e);
        return { noiseScores: [], noiseStats: { mean: 0, stdDev: 0, variance: 0 } };
    }
}

export async function gdprAnonymizerNode(state: AuditState): Promise<Partial<AuditState>> {
    console.log("--- GDPR Anonymizer Node (Pass-through mode) ---");
    return { structuredContent: state.originalContent };
}

// Fact Checker Node with Two-Pass Architecture and Search Grounding
export async function factCheckerNode(state: AuditState): Promise<Partial<AuditState>> {
    console.log("--- Fact Checker Node (Search Grounded) ---");
    const content = truncateText(state.structuredContent || state.originalContent);

    try {
        // PASS 1: Identify Claims (using Standard Model)
        const analysisResult = await getModel().generateContent([
            `You are a Financial Analyst. Identify claims and data needs.
            Return JSON: { "primaryTicker": "ABNB", "companyName": "Airbnb", "claims": [...], "dataRequests": [...] }
            See previous instructions for schema.`,
            `Document:\n${content}`
        ]);

        const analysisText = analysisResult.response?.text ? analysisResult.response.text() : "";
        const analysis = parseJSON(analysisText);

        const primaryTicker = analysis?.primaryTicker || null;
        const companyName = analysis?.companyName || null;
        const claims = analysis?.claims || [];
        const dataRequests = analysis?.dataRequests || [];

        // Fetch Data (Finnhub)
        let fetchedData: Record<string, unknown> = {};
        if (dataRequests.length > 0) {
            const validRequests: DataRequest[] = dataRequests
                .filter((r: any) => r && r.ticker && typeof r.ticker === 'string')
                .map((r: any) => ({
                    ticker: r.ticker.toUpperCase(),
                    dataType: r.dataType,
                    reason: r.reason,
                    claimToVerify: r.claimToVerify
                }));

            if (validRequests.length > 0) {
                fetchedData = await executeDataRequests(validRequests);
            }
        }

        // PASS 2: Verify with Grounding (Using Grounded Model)
        console.log("Verifying with Google Search Grounding...");
        const verificationResult = await getGroundedModel().generateContent([
            `You are a Financial Fact Checker with access to Google Search.

            CORE INSTRUCTION:
            1. ANALYZE the "REAL-TIME FINANCIAL DATA" provided below.
            2. IF A CLAIM IS NOT FULLY SUPPORTED by that data, you **MUST** use Google Search to verify it.
            3. **NEVER** mark a claim as "UNVERIFIABLE" due to "missing data" without searching first. 
            4. **EXAMPLE**: If claim is "Revenue dropped 80% in 2020" and API data is empty for 2020, DELETE the excuse "data provided is insufficient" and SEARCH "Airbnb 2020 revenue drop".
            5. Cite your sources (Search or API).

            CLAIMS TO VERIFY:
            ${JSON.stringify(claims, null, 2)}

            REAL-TIME FINANCIAL DATA (Finnhub):
            ${JSON.stringify(fetchedData, null, 2)}
            
            Return JSON schema (score, verifications array).`,
            `Primary Company: ${companyName}`
        ]);

        const verificationText = verificationResult.response?.text ? verificationResult.response.text() : "";
        const verification = parseJSON(verificationText);

        // Extract Search Sources (Grounding Metadata)
        // @ts-ignore - groundingMetadata is in v1beta SDK but might miss types
        const metadata = verificationResult.response.candidates?.[0]?.groundingMetadata;
        const searchSources: string[] = metadata?.groundingChunks
            ?.map((c: any) => c.web?.uri)
            .filter((u: string) => typeof u === 'string') || [];

        console.log(`Found ${searchSources.length} search sources.`);

        const enrichedResult = {
            score: verification?.score || 0,
            summary: verification?.summary || "Verification completed",
            verifications: verification?.verifications || [],
            primaryCompany: { ticker: primaryTicker, name: companyName },
            dataFetchedAt: new Date().toISOString(),
            flags: [],
            searchSources: searchSources // New Field: Actable Sources!
        };

        return { factCheckResult: enrichedResult };
    } catch (e) {
        console.error("Fact Checker failed", e);
        return { factCheckResult: { score: 0, flags: ["Error: Fact Check Unavailable"] } };
    }
}

export async function preMortemNode(state: AuditState): Promise<Partial<AuditState>> {
    const content = truncateText(state.structuredContent || state.originalContent);
    try {
        const result = await getModel().generateContent([
            `Pre-Mortem Architect. List 3 Failure Scenarios and 3 Preventive Measures. Output JSON.`,
            `Text:\n${content}`
        ]);
        const data = parseJSON(result.response.text());
        return { preMortem: data || { failureScenarios: [], preventiveMeasures: [] } };
    } catch (e) { return {}; }
}

export async function complianceMapperNode(state: AuditState): Promise<Partial<AuditState>> {
    const content = state.structuredContent || state.originalContent;
    try {
        const result = await getModel().generateContent([
            `Compliance Officer. Check for Unclear Info, Harm, Poor Value. Output JSON.`,
            `Text:\n${content}`
        ]);
        const data = parseJSON(result.response.text());
        return { compliance: data || { status: "WARN", details: "Failed to parse." } };
    } catch (e) { return { compliance: { status: "WARN", details: "Unavailable." } }; }
}

export async function riskScorerNode(state: AuditState): Promise<Partial<AuditState>> {
    console.log("--- Risk Scorer Node (Aggressive) ---");

    // 1. Bias Deductions (Weighted by Severity)
    const biasDeductions = (state.biasAnalysis || []).reduce((acc: number, b: any) => {
        const severityScores: Record<string, number> = {
            low: 5,
            medium: 15,
            high: 30,
            critical: 50
        };
        const severity = (b.severity || 'low').toLowerCase();
        return acc + (severityScores[severity] || 5);
    }, 0);

    // 2. Noise Penalty (StdDev * 5)
    // If Judges disagree (High Variance), confidence drops.
    const noisePenalty = (state.noiseStats?.stdDev || 0) * 5;

    // 3. Trust Penalty (Fact Check)
    // If Truth Score is low, decision quality suffers proportionally.
    // If Truth=0, Penalty = 30 points.
    const trustScore = state.factCheckResult?.score || 100;
    const trustPenalty = (100 - trustScore) * 0.3;

    // Calculate Base
    const baseScore = 100;
    let overallScore = baseScore - biasDeductions - noisePenalty - trustPenalty;

    // Clamp 0-100
    overallScore = Math.max(0, Math.min(100, Math.round(overallScore)));

    console.log(`Scoring: Base(100) - Biases(${biasDeductions}) - Noise(${noisePenalty.toFixed(1)}) - Trust(${trustPenalty.toFixed(1)}) = ${overallScore}`);

    return {
        finalReport: {
            overallScore,
            noiseScore: Math.min(100, (state.noiseStats?.stdDev || 0) * 10),
            summary: `Audit complete. Detected ${(state.biasAnalysis || []).length} biases. Trust Score: ${trustScore}%.`,
            biases: state.biasAnalysis || [],
            noiseStats: state.noiseStats,
            factCheck: state.factCheckResult,
            compliance: state.compliance,
            preMortem: state.preMortem,
            sentiment: state.sentimentAnalysis,
            speakers: [],
            createdAt: new Date(),
            analyses: []
        } as AnalysisResult
    };
}

export async function sentimentAnalyzerNode(state: AuditState): Promise<Partial<AuditState>> {
    try {
        const result = await getModel().generateContent([
            `Sentiment Analyzer. Output JSON { "score": number, "label": string }`,
            `Text:\n${state.originalContent}`
        ]);
        const data = parseJSON(result.response.text());
        return { sentimentAnalysis: data || { score: 0, label: 'Neutral' } };
    } catch (e) { return { sentimentAnalysis: { score: 0, label: 'Neutral' } }; }
}
