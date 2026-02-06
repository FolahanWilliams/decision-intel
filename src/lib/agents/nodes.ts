import { AuditState } from "./types";
import { parseJSON } from '../utils/json';
import { AnalysisResult } from '../../types';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerativeModel } from "@google/generative-ai";
import { BIAS_DETECTIVE_PROMPT, NOISE_JUDGE_PROMPT } from "./prompts";
import { executeDataRequests, DataRequest } from "../tools/financial";

// Lazy singleton for the model
let modelInstance: GenerativeModel | null = null;


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
            maxOutputTokens: 16384  // Increased to prevent JSON truncation
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

// Timeout wrapper for LLM calls to prevent hanging
const LLM_TIMEOUT_MS = 90000; // 90 seconds - increased for complex analysis

async function withTimeout<T>(promise: Promise<T>, ms: number = LLM_TIMEOUT_MS): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`LLM timeout after ${ms}ms`)), ms)
    );
    return Promise.race([promise, timeout]);
}

// Helper to safely parse JSON from LLM output - Imported from utils/json

// Text truncation to prevent timeouts on large documents
const MAX_INPUT_CHARS = 25000; // ~6K tokens, safe for most models
function truncateText(text: string): string {
    if (text.length <= MAX_INPUT_CHARS) return text;
    console.log(`Truncating text from ${text.length} to ${MAX_INPUT_CHARS} chars`);
    return text.slice(0, MAX_INPUT_CHARS) + "\n\n[... text truncated for analysis ...]";
}

// Structurer Node - Simplified to pass-through for faster analysis
// The bias detection works well with raw content
export async function structurerNode(state: AuditState): Promise<Partial<AuditState>> {
    console.log("--- Structurer Node (Pass-through mode) ---");
    // Skip LLM structuring to avoid timeouts - raw content works well for bias detection
    return {
        structuredContent: state.structuredContent || state.originalContent,
        speakers: []
    };
}

export async function biasDetectiveNode(state: AuditState): Promise<Partial<AuditState>> {
    console.log("--- Bias Detective Node (Gemini) ---");
    try {
        const content = truncateText(state.structuredContent || state.originalContent);
        console.log(`Analyzing ${content.length} chars for biases...`);

        const result = await withTimeout(getModel().generateContent([
            BIAS_DETECTIVE_PROMPT,
            `Text to Analyze:\n<input_text>\n${content}\n</input_text>`
        ]));

        const response = result.response?.text ? result.response.text() : "";
        console.log(`Bias Detective response length: ${response.length}`);

        const data = parseJSON(response);
        const biases = data?.biases || [];

        console.log(`Detected ${biases.length} biases`);

        // If no biases found, this might indicate an issue - log for debugging
        if (biases.length === 0) {
            console.warn("No biases detected - response preview:", response.slice(0, 500));
        }

        return { biasAnalysis: biases };
    } catch (e) {
        console.error("Bias Detective failed:", e instanceof Error ? e.message : e);
        return { biasAnalysis: [] };
    }
}

export async function noiseJudgeNode(state: AuditState): Promise<Partial<AuditState>> {
    console.log("--- Noise Judge Node (Gemini x3) ---");
    const content = truncateText(state.structuredContent || state.originalContent);

    // Spawn 3 independent "judges" (parallel calls)
    try {
        const promises = [1, 2, 3].map(() =>
            withTimeout(getModel().generateContent([
                NOISE_JUDGE_PROMPT,
                `Decision Text to Rate:\n<input_text>\n${content}\n</input_text>`,
                `\n(Random Seed: ${Math.random()})` // Inject noise to encourage variance if model defines deterministic
            ]))
        );

        const results = await Promise.all(promises);
        const scores = results.map(r => {
            const text = r.response?.text ? r.response.text() : "";
            const data = parseJSON(text);
            return typeof data?.score === 'number' ? data.score : 0;
        });

        console.log(`Noise Judge scores: ${scores.join(', ')}`);

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

// GDPR Anonymizer - Simplified to pass through content for faster analysis
// Full anonymization can be enabled for production compliance needs
export async function gdprAnonymizerNode(state: AuditState): Promise<Partial<AuditState>> {
    console.log("--- GDPR Anonymizer Node (Pass-through mode) ---");
    // For bias detection, we need full context - skip heavy LLM anonymization
    // Original content is passed directly to preserve context for analysis
    return { structuredContent: state.originalContent };
}

// New Node: Fact Checker with Two-Pass AI-Driven Data Fetching
export async function factCheckerNode(state: AuditState): Promise<Partial<AuditState>> {
    console.log("--- Fact Checker Node (Two-Pass Architecture) ---");
    const content = truncateText(state.structuredContent || state.originalContent);

    try {
        // ================================================================
        // PASS 1: AI analyzes document and requests specific data it needs
        // ================================================================
        console.log("Pass 1: Analyzing document and identifying data requirements...");

        const analysisResult = await getModel().generateContent([
            `You are a Financial Analyst preparing to fact-check a document. Your task is to:

1. Identify the PRIMARY COMPANY this document is about
2. Extract SPECIFIC CLAIMS that can be verified with financial data
3. REQUEST THE EXACT DATA you need to verify each claim

AVAILABLE DATA TYPES you can request:
- profile: Company info (name, sector, industry, market cap)
- quote: Current stock price, change%, P/E ratio, EPS, 52-week range
- income_annual: Annual revenue, profit, margins, YoY growth
- income_quarterly: Quarterly financials with YoY comparison (last 4 quarters)
- key_metrics: Valuation ratios (P/E, P/S, EV/EBITDA, ROE, ROA)
- historical_price: Stock price history (current, week ago, month ago)
- peers: List of competitor stock tickers
- sector_performance: Performance of all market sectors

RULES:
- Only request data for companies EXPLICITLY mentioned in the document
- Be SPECIFIC about which data type you need for each claim
- Don't request data you don't need

Return JSON:
{
    "primaryTicker": "ABNB",
    "companyName": "Airbnb",
    "claims": [
        {
            "id": 1,
            "text": "Revenue grew 18% YoY to $2.5B",
            "category": "revenue",
            "needsVerification": true
        }
    ],
    "dataRequests": [
        {
            "ticker": "ABNB",
            "dataType": "income_quarterly",
            "reason": "To verify Q3 revenue and YoY growth rate",
            "forClaimIds": [1]
        },
        {
            "ticker": "ABNB",
            "dataType": "profile",
            "reason": "To verify company basics and sector"
        }
    ]
}`,
            `Document to analyze:\n<document>\n${content}\n</document>`
        ]);

        const analysisText = analysisResult.response?.text ? analysisResult.response.text() : "";
        const analysis = parseJSON(analysisText);

        const primaryTicker = analysis?.primaryTicker || null;
        const companyName = analysis?.companyName || null;
        const claims = analysis?.claims || [];
        const dataRequests = analysis?.dataRequests || [];

        console.log(`Primary Company: ${companyName} (${primaryTicker})`);
        console.log(`Claims identified: ${claims.length}`);
        console.log(`Data requests: ${dataRequests.length}`);

        // ================================================================
        // DATA FETCHING: Execute the AI's data requests
        // ================================================================
        let fetchedData: Record<string, unknown> = {};

        if (dataRequests.length > 0) {
            console.log("Executing AI data requests...");

            // Validate and limit requests to prevent abuse
            const validRequests: DataRequest[] = dataRequests
                .slice(0, 5) // Max 5 requests
                .filter((r: { ticker: string; dataType: string; reason: string }) =>
                    r.ticker && r.dataType && typeof r.ticker === 'string'
                )
                .map((r: { ticker: string; dataType: string; reason: string; claimToVerify?: string }) => ({
                    ticker: r.ticker.toUpperCase(),
                    dataType: r.dataType as DataRequest['dataType'],
                    reason: r.reason || 'Verification',
                    claimToVerify: r.claimToVerify
                }));

            console.log(`Executing ${validRequests.length} validated requests:`,
                validRequests.map(r => `${r.ticker}:${r.dataType}`).join(', '));

            fetchedData = await executeDataRequests(validRequests);
        }

        // ================================================================
        // PASS 2: AI verifies claims using the fetched data
        // ================================================================
        console.log("Pass 2: Verifying claims with fetched data...");

        const verificationResult = await getModel().generateContent([
            `You are a Financial Fact Checker. Verify each claim using ONLY the provided real-time data.

CLAIMS TO VERIFY:
${JSON.stringify(claims, null, 2)}

REAL-TIME FINANCIAL DATA (from Finnhub API):
${JSON.stringify(fetchedData, null, 2)}

VERIFICATION RULES:
1. VERIFIED: The data directly supports the claim (within reasonable margin, e.g., "revenue grew 18%" when data shows 17.5% is still verified)
2. CONTRADICTED: The data clearly contradicts the claim (e.g., claim says 30% growth but data shows 10%)
3. UNVERIFIABLE: Can't verify because data is missing or claim is too vague

For each claim, you MUST cite the EXACT source data used including:
- The ticker symbol
- The data endpoint (e.g., "income_quarterly", "key_metrics", "quote")
- The specific field and value from the data

Return JSON:
{
    "score": 0-100,
    "summary": "Brief summary of verification results",
    "verifiedCount": number,
    "contradictedCount": number,
    "unverifiableCount": number,
    "verifications": [
        {
            "claimId": 1,
            "claim": "Original claim text",
            "verdict": "VERIFIED|CONTRADICTED|UNVERIFIABLE",
            "explanation": "Your reasoning",
            "source": {
                "ticker": "AAPL",
                "endpoint": "income_quarterly",
                "field": "revenue",
                "value": 94836000000,
                "displayValue": "$94.8B",
                "period": "2024-Q3"
            }
        }
    ]
}`,
            `Primary Company: ${companyName} (${primaryTicker})`
        ]);

        const verificationText = verificationResult.response?.text ? verificationResult.response.text() : "";
        const verification = parseJSON(verificationText);

        // Build enriched result with source citations
        const enrichedResult = {
            score: verification?.score || 0,
            summary: verification?.summary || "Verification completed",
            verifiedCount: verification?.verifiedCount || 0,
            contradictedCount: verification?.contradictedCount || 0,
            unverifiableCount: verification?.unverifiableCount || 0,
            verifications: verification?.verifications || [],
            flags: (verification?.verifications || []).filter(
                (v: { verdict: string }) => v.verdict === 'CONTRADICTED'
            ).map((v: { claim: string }) => v.claim),
            // Metadata for transparency
            primaryCompany: { ticker: primaryTicker, name: companyName },
            claimsAnalyzed: claims.length,
            dataRequestsMade: dataRequests.length,
            dataFetchedAt: new Date().toISOString()
        };

        console.log(`Verification complete: Score ${enrichedResult.score}, ` +
            `${enrichedResult.verifiedCount} verified, ` +
            `${enrichedResult.contradictedCount} contradicted, ` +
            `${enrichedResult.unverifiableCount} unverifiable`);

        return { factCheckResult: enrichedResult };
    } catch (e) {
        console.error("Fact Checker failed", e);
        return { factCheckResult: { score: 0, flags: ["Error: Fact Check Service Unavailable"] } };
    }
}

// New Node: Pre-Mortem Architect
export async function preMortemNode(state: AuditState): Promise<Partial<AuditState>> {
    console.log("--- Pre-Mortem Node (Gemini) ---");
    const content = truncateText(state.structuredContent || state.originalContent);
    try {
        const result = await getModel().generateContent([
            `You are a Pre-Mortem Architect. 
            Imagine it is 1 year in the future and the decision/plan described in the text has failed catastrophically.
            List 3 plausible reasons why (Failure Scenarios) and 3 Preventive Measures.
            
            Output JSON: { "failureScenarios": ["..."], "preventiveMeasures": ["..."] }`,
            `Text:\n<input_text>\n${content}\n</input_text>`
        ]);
        const text = result.response?.text ? result.response.text() : "";
        const data = parseJSON(text);
        return { preMortem: data || { failureScenarios: [], preventiveMeasures: [] } }; // Note: Update AuditState type if needed, or store in 'analyses'
    } catch (e) {
        console.error("Pre-Mortem failed", e);
        return {};
    }
}

// New Node: Compliance Mapper
export async function complianceMapperNode(state: AuditState): Promise<Partial<AuditState>> {
    console.log("--- Compliance Mapper (Consumer Duty) ---");
    const content = state.structuredContent || state.originalContent;
    try {
        const result = await getModel().generateContent([
            `You are a Compliance Officer. Analyze the text for alignment with Consumer Duty regulations.
            Check for: 1. Unclear information. 2. Foreseeable Harm. 3. Poor Value.
            
            Output JSON: { "status": "PASS" | "WARN" | "FAIL", "details": "Summary of findings..." }`,
            `Text:\n<input_text>\n${content}\n</input_text>`
        ]);
        const text = result.response?.text ? result.response.text() : "";
        const data = parseJSON(text);
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
        const content = state.structuredContent || state.originalContent;
        const result = await getModel().generateContent([
            `You are a Sentiment Analyzer. ONLY return raw JSON with two keys:
            - "score": A number between -1 and 1.
            - "label": "Positive" | "Negative" | "Neutral".
            Example: { "score": 0.8, "label": "Positive" }`,
            `Text to Analyze:\n${content}`
        ]);
        const response = result.response?.text ? result.response.text() : "";
        const data = parseJSON(response);

        return { sentimentAnalysis: data || { score: 0, label: 'Neutral' } };
    } catch (e) {
        console.error("Sentiment Analyzer failed", e);
        return { sentimentAnalysis: { score: 0, label: 'Neutral' } };
    }
}
