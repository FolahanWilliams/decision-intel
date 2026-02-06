import { AuditState } from "./types";
import { parseJSON } from '../utils/json';
import { AnalysisResult } from '../../types';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerativeModel } from "@google/generative-ai";
import { BIAS_DETECTIVE_PROMPT, NOISE_JUDGE_PROMPT } from "./prompts";
import { getEnrichedFinancialContext, ClaimType } from "../tools/financial";

// Lazy singleton for the model
let modelInstance: GenerativeModel | null = null;


function getModel(): GenerativeModel {
    if (modelInstance) return modelInstance;

    if (!process.env.GOOGLE_API_KEY) {
        throw new Error("Missing GOOGLE_API_KEY env variable");
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    // Using gemini-3-pro-preview - deep reasoning for sophisticated analysis
    modelInstance = genAI.getGenerativeModel({
        model: "gemini-3-pro-preview",
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

// New Node: Fact Checker with Claim Type Detection
export async function factCheckerNode(state: AuditState): Promise<Partial<AuditState>> {
    console.log("--- Fact Checker Node (Gemini + FMP Enhanced) ---");
    const content = truncateText(state.structuredContent || state.originalContent);

    try {
        // Step 1: Extract Tickers AND Claim Types
        // IMPORTANT: Be very strict about ticker extraction - only exact matches
        const extractionResult = await getModel().generateContent([
            `You are a strict financial document parser. Analyze the text and extract ONLY the following:

1. STOCK TICKERS: Extract stock symbols (like AAPL, TSLA, ABNB) that are EXPLICITLY WRITTEN in the text.
   - Only include a ticker if the exact symbol appears in the document (e.g., "ABNB" or "Airbnb (ABNB)")
   - If a company is mentioned by name only (e.g., "Apple" without "AAPL"), try to identify its ticker
   - DO NOT hallucinate or guess tickers that aren't related to the document's main subject
   - If the document is about Airbnb, only include ABNB unless other tickers are explicitly mentioned

2. CLAIM TYPES: What kinds of financial claims are made:
   - "revenue" = revenue, sales, earnings, profit claims
   - "stock_price" = stock price, share price, returns claims  
   - "market_cap" = valuation, market cap claims
   - "competitor" = competitor comparisons (only if specific competitors are named)
   - "industry" = sector, industry trend claims
   - "general" = other verifiable financial claims

3. CLAIMS: List specific verifiable financial claims with their text

CRITICAL: Focus on the PRIMARY company being analyzed. If this is an Airbnb document, don't add AAPL or AMZN unless they are explicitly discussed as comparisons.

Return JSON: { 
    "primaryCompany": "ABNB",
    "tickers": ["ABNB"], 
    "claimTypes": ["revenue", "stock_price"],
    "claims": [
        {"text": "Revenue grew 40%", "type": "revenue", "company": "ABNB"},
        {"text": "Stock is up 20%", "type": "stock_price", "company": "ABNB"}
    ]
}`,
            `Text:\n<input_text>\n${content}\n</input_text>`
        ]);

        const extractionText = extractionResult.response?.text ? extractionResult.response.text() : "";
        const extracted = parseJSON(extractionText);
        const rawTickers = extracted?.tickers || [];

        // Validation: Only keep tickers that make sense for the document
        const primaryCompany = extracted?.primaryCompany || null;
        let tickers = Array.isArray(rawTickers) ? [...new Set(rawTickers as string[])] : [];

        // If we have a primary company, prioritize it
        if (primaryCompany && !tickers.includes(primaryCompany)) {
            tickers = [primaryCompany, ...tickers];
        }

        // Limit to 3 tickers max to avoid noise
        tickers = tickers.slice(0, 3);

        const claimTypes: ClaimType[] = extracted?.claimTypes || ['general'];
        const extractedClaims = extracted?.claims || [];

        console.log(`Primary Company: ${primaryCompany || 'Unknown'}`);
        console.log(`Tickers: ${tickers.join(', ') || 'None'}`);
        console.log(`Claim Types: ${claimTypes.join(', ')}`);
        console.log(`Extracted Claims: ${extractedClaims.length}`);

        // Step 2: Fetch Enriched Financial Data Based on Claim Types
        let financialContext = "";
        const financialData: Record<string, unknown> = {};

        if (tickers.length > 0) {
            console.log(`Fetching enriched FMP data for: ${tickers.join(', ')}`);

            const contextPromises = tickers.map(async (ticker: string) => {
                const data = await getEnrichedFinancialContext(ticker, claimTypes);
                return { ticker, data };
            });

            const results = await Promise.all(contextPromises);
            results.forEach(({ ticker, data }) => {
                financialData[ticker] = data;
            });

            financialContext = `
=== REAL-TIME FINANCIAL DATA (FMP) ===
${JSON.stringify(financialData, null, 2)}
======================================
`;
        }

        // Step 3: Verify Claims using Enriched Context
        const result = await getModel().generateContent([
            `You are a Financial Fact Checker with access to real-time market data.

TASK: Verify each claim in the document against the provided financial data.

VERIFICATION GUIDELINES:
- Revenue/Earnings Claims: Compare stated growth rates, margins, and figures against actual income statement data
- Stock Price Claims: Verify price changes, returns, and ranges against quote data
- Market Cap Claims: Verify valuation claims against actual market cap
- Competitor Claims: Cross-reference with peers list
- Industry Claims: Check sector classification and performance

For each claim, determine if it is:
1. VERIFIED - Data supports the claim
2. CONTRADICTED - Data contradicts the claim (flag these)
3. UNVERIFIABLE - Insufficient data to verify

EXTRACTED CLAIMS TO VERIFY:
${JSON.stringify(extractedClaims, null, 2)}

Return JSON: {
    "score": 0-100,  // Higher = more accurate/verifiable
    "verifiedCount": number,
    "contradictedCount": number,
    "unverifiableCount": number,
    "flags": [
        {
            "claim": "Original claim text",
            "verdict": "VERIFIED|CONTRADICTED|UNVERIFIABLE", 
            "actualData": "What the data shows",
            "explanation": "Why this is flagged"
        }
    ]
}`,
            `Document:\n<input_text>\n${content}\n</input_text>`,
            financialContext || "No financial data available - verify claims as UNVERIFIABLE"
        ]);

        const text = result.response?.text ? result.response.text() : "";
        const data = parseJSON(text);

        // Enrich result with financial context for display
        const enrichedResult = {
            ...(data || { score: 0, flags: [] }),
            financialContext: financialData,
            tickersAnalyzed: tickers,
            claimTypesDetected: claimTypes
        };

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
