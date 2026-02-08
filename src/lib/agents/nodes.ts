
import { AuditState } from "./types";
import { parseJSON } from '../utils/json';
import { AnalysisResult, BiasDetectionResult, NoiseBenchmark } from '../../types';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerativeModel } from "@google/generative-ai";
import { BIAS_DETECTIVE_PROMPT, NOISE_JUDGE_PROMPT, COGNITIVE_DIVERSITY_PROMPT, INSTITUTIONAL_MEMORY_PROMPT, COMPLIANCE_CHECKER_PROMPT, LINGUISTIC_ANALYSIS_PROMPT, STRATEGIC_ANALYSIS_PROMPT } from "./prompts";
import { searchSimilarDocuments } from "../rag/embeddings";
import { executeDataRequests, DataRequest } from "../tools/financial";
import { getRequiredEnvVar } from '../env';

// ============================================================
// AI MODEL CONFIGURATION
// ============================================================

// Lazy singleton for the standard model (Fast, no tools)
let modelInstance: GenerativeModel | null = null;
let groundedModelInstance: GenerativeModel | null = null;

function getModel(): GenerativeModel {
    if (modelInstance) return modelInstance;

    const apiKey = getRequiredEnvVar('GOOGLE_API_KEY');
    const genAI = new GoogleGenerativeAI(apiKey);
    // Using gemini-3-flash-preview - cost-effective model for analysis tasks
    modelInstance = genAI.getGenerativeModel({
        model: "models/gemini-3-flash-preview",
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

    const apiKey = getRequiredEnvVar('GOOGLE_API_KEY');
    const genAI = new GoogleGenerativeAI(apiKey);
    groundedModelInstance = genAI.getGenerativeModel({
        model: "models/gemini-3-flash-preview",
        tools: [
            // @ts-expect-error - googleSearch is supported in v1beta but missing in some SDK types
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
    return text.slice(0, MAX_INPUT_CHARS) + "\n\n[... text truncated for analysis ...]";
}

// ============================================================
// NODES
// ============================================================

export async function structurerNode(state: AuditState): Promise<Partial<AuditState>> {

    return {
        structuredContent: state.structuredContent || state.originalContent,
        speakers: []
    };
}

export async function biasDetectiveNode(state: AuditState): Promise<Partial<AuditState>> {

    try {
        const content = truncateText(state.structuredContent || state.originalContent);

        // Use Grounded Model for primary detection to allow real-world context verification
        const result = await withTimeout(getGroundedModel().generateContent([
            BIAS_DETECTIVE_PROMPT,
            `Text to Analyze: \n<input_text>\n${content} \n </input_text>`,
            `CRITICAL: If the document mentions modern events, public figures, or statistical claims, verify their accuracy using Google Search BEFORE flagging them as biased or unbiased.`
        ]));

        const response = result.response?.text ? result.response.text() : "";
        const data = parseJSON(response);
        const biases = data?.biases || [];

        // Educational Insight (Dynamic Retrieval)
        // For HIGH/CRITICAL biases, fetch scientific context
        const severeBiases = biases.filter((b: BiasDetectionResult) =>
            (b.severity === 'high' || b.severity === 'critical') && b.biasType
        );

        if (severeBiases.length > 0) {
            console.log(`Fetching educational insights for ${severeBiases.length} severe biases...`);

            // Allow up to 3 parallel searches to avoid rate limits
            const insightPromises = severeBiases.slice(0, 3).map(async (bias: BiasDetectionResult) => {
                try {
                    const searchResult = await getGroundedModel().generateContent([
                        `You are a Cognitive Psychology Tutor.
                        TASK: Find a specific scientific study or "HBR" (Harvard Business Review) article that explains the following bias: "${bias.biasType}".
                        
                        OUTPUT JSON:
                        {
                            "title": "The Hidden Traps in Decision Making (HBR)",
                            "summary": "1-sentence explanation of why this bias occurs based on the study.",
                            "sourceUrl": "https://hbr.org/..."
                        }`,
                        `Bias: ${bias.biasType}`
                    ]);

                    const insightText = searchResult.response.text();
                    const insightData = parseJSON(insightText);

                    // Extract Source
                    const metadata = searchResult.response.candidates?.[0]?.groundingMetadata;
                    const searchSource = metadata?.groundingChunks?.find((c: { web?: { uri?: string } }) => c.web?.uri)?.web?.uri;

                    if (insightData) {
                        bias.researchInsight = {
                            ...insightData,
                            sourceUrl: insightData.sourceUrl || searchSource || ""
                        };
                    }
                } catch (e) {
                    console.error(`Failed to fetch insight for ${bias.biasType}`, e);
                }
            });

            await Promise.all(insightPromises);
        }

        return { biasAnalysis: biases };
    } catch (e) {
        console.error("Bias Detective failed:", e instanceof Error ? e.message : String(e));
        return { biasAnalysis: [] };
    }
}

export async function noiseJudgeNode(state: AuditState): Promise<Partial<AuditState>> {

    const content = truncateText(state.structuredContent || state.originalContent);

    try {
        // Parallel Judges for Noise Scoring
        const promises = [1, 2, 3].map(() =>
            withTimeout(getModel().generateContent([
                NOISE_JUDGE_PROMPT,
                `Decision Text to Rate:\n<input_text>\n${content}\n</input_text>`,
                `\n(Random Seed: ${Math.random()})`
            ]))
        );

        const results = await Promise.all(promises);

        let extractedBenchmarks: NoiseBenchmark[] = [];
        const scores = results.map(r => {
            const text = r.response?.text ? r.response.text() : "";
            const data = parseJSON(text);
            // Capture benchmarks from the first successful judge
            if (data?.benchmarks?.length > 0 && extractedBenchmarks.length === 0) {
                extractedBenchmarks = data.benchmarks;
            }
            return typeof data?.score === 'number' ? data.score : 0;
        });

        // Calculate Stats
        const validScores = scores.filter(s => typeof s === 'number' && isFinite(s));
        const mean = validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : 0;
        const variance = validScores.length > 0 ? validScores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / validScores.length : 0;
        const stdDev = Math.sqrt(variance);

        // Dynamic Retrieval: Verify Benchmarks if found
        let noiseBenchmarks = [];
        if (extractedBenchmarks.length > 0) {
            console.log(`Verifying ${extractedBenchmarks.length} benchmarks with Google Search...`);
            const benchmarkResult = await getGroundedModel().generateContent([
                `You are a Market Research validator.
                TASK:
                1. Take the provided internal metrics.
                2. Use Google Search to find EXTERNAL consensus data for 2024/2025.
                3. Compare internal vs external.
                
                METRICS TO VERIFY:
                ${JSON.stringify(extractedBenchmarks)}

                OUTPUT JSON:
                [
                    {
                        "metric": "Projected Market Growth",
                        "documentValue": "15%",
                        "marketValue": "12% (Gartner Report)",
                        "variance": "Medium",
                        "explanation": "Document is slightly optimistic compared to industry avg.",
                        "sourceUrl": "https://..."
                    }
                ]`,
                `Context: Global Market`
            ]);

            const benchmarkText = benchmarkResult.response.text();
            noiseBenchmarks = parseJSON(benchmarkText) || [];

            // Add sources from metadata
            const metadata = benchmarkResult.response.candidates?.[0]?.groundingMetadata;
            const searchSources: string[] = metadata?.groundingChunks
                ?.map((c: { web?: { uri?: string } }) => c.web?.uri)
                .filter((u: unknown): u is string => typeof u === 'string') || [];

            noiseBenchmarks = noiseBenchmarks.map((b: NoiseBenchmark, i: number) => ({
                ...b,
                sourceUrl: b.sourceUrl || searchSources[i % searchSources.length]
            }));
        }

        return {
            noiseScores: validScores,
            noiseStats: { mean: Number(mean.toFixed(1)), stdDev: Number(stdDev.toFixed(1)), variance: Number(variance.toFixed(1)) },
            noiseBenchmarks
        };
    } catch (e) {
        console.error("Noise Judges failed", e);
        return { noiseScores: [], noiseStats: { mean: 0, stdDev: 0, variance: 0 } };
    }
}

export async function gdprAnonymizerNode(state: AuditState): Promise<Partial<AuditState>> {

    return { structuredContent: state.originalContent };
}

// Fact Checker Node with Two-Pass Architecture and Search Grounding
export async function factCheckerNode(state: AuditState): Promise<Partial<AuditState>> {

    const content = truncateText(state.structuredContent || state.originalContent);

    try {
        // PASS 1: Identify Claims + Grounded Verification
        // Use Grounded Model here so it can identify which claims NEED searching immediately
        const analysisResult = await getGroundedModel().generateContent([
            `You are an Expert Fact Checker. Identify specific factual claims that can be verified externally.
            These can be financial, technical, historical, or statistical.
            
            Return JSON: 
            { 
                "primaryTopic": "string", 
                "claims": [
                    { "id": 1, "claim": "Exact quote or statement", "category": "technical|financial|historical" }
                ],
                "dataRequests": [
                    { "ticker": "Optional ticker", "dataType": "price|profile|news", "reason": "why", "claimToVerify": "related claim" }
                ]
            }`,
            `Document:\n${content}`
        ]);

        const analysisText = analysisResult.response?.text ? analysisResult.response.text() : "";
        const analysis = parseJSON(analysisText);

        const companyName = analysis?.primaryTopic || null;
        if (companyName) console.log(`Identified primary topic: ${companyName}`);
        const claims = analysis?.claims || [];
        const dataRequests = analysis?.dataRequests || [];

        // Fetch Data (Finnhub)
        let fetchedData: Record<string, unknown> = {};
        if (dataRequests.length > 0) {
            const validRequests: DataRequest[] = dataRequests
                .filter((r: { ticker?: unknown }) => r && r.ticker && typeof r.ticker === 'string')
                .map((r: { ticker: string; dataType: string; reason: string; claimToVerify: string }) => ({
                    ticker: r.ticker.toUpperCase(),
                    dataType: r.dataType,
                    reason: r.reason,
                    claimToVerify: r.claimToVerify
                }));

            // Deduplicate requests by ticker to save API calls
            const uniqueRequests = Array.from(new Map(validRequests.map(item => [item.ticker, item])).values());

            if (uniqueRequests.length > 0) {
                fetchedData = await executeDataRequests(uniqueRequests);
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
            
            Return valid JSON matching this schema:
            {
                "score": 0-100,
                "summary": "overall verification summary",
                "verifications": [
                    { 
                        "claim": "string", 
                        "verdict": "VERIFIED" | "CONTRADICTED" | "UNVERIFIABLE", 
                        "explanation": "concise rationale",
                        "sourceUrl": "EXACT URL used for this specific claim"
                    }
                ]
            }`,
            `Topic: ${companyName}`
        ]);

        const verificationText = verificationResult.response?.text ? verificationResult.response.text() : "";
        const verification = parseJSON(verificationText);

        // Extract Search Sources (Grounding Metadata)
        // Extract Search Sources (Grounding Metadata)
        const metadata = verificationResult.response.candidates?.[0]?.groundingMetadata;
        const searchSources: string[] = metadata?.groundingChunks
            ?.map((c: { web?: { uri?: string } }) => c.web?.uri)
            .filter((u: unknown): u is string => typeof u === 'string') || [];

        console.log(`Found ${searchSources.length} search sources.`);

        const enrichedResult = {
            score: verification?.score || 0,
            summary: verification?.summary || "Verification completed",
            verifications: (verification?.verifications || []).map((v: any, i: number) => ({
                ...v,
                // Fallback to general search sources if specific URL missing
                sourceUrl: v.sourceUrl || searchSources[i % searchSources.length] || ""
            })),
            primaryTopic: companyName,
            dataFetchedAt: new Date().toISOString(),
            flags: [],
            searchSources
        };

        return { factCheckResult: enrichedResult };
    } catch (e) {
        console.error("Fact Checker failed", e);
        return { factCheckResult: { score: 0, flags: ["Error: Fact Check Unavailable"] } };
    }
}

export async function complianceMapperNode(state: AuditState): Promise<Partial<AuditState>> {
    const content = truncateText(state.structuredContent || state.originalContent);
    try {
        console.log("Running Compliance Check with Google Search Grounding...");
        const result = await getGroundedModel().generateContent([
            COMPLIANCE_CHECKER_PROMPT,
            `Document Content:\n${content}`
        ]);

        const text = result.response.text();
        const data = parseJSON(text);

        return { compliance: data };
    } catch (e) {
        console.error("Compliance Node failed", e);
        return {
            compliance: {
                status: "WARN",
                riskScore: 50,
                summary: "Compliance check failed due to technical error.",
                regulations: [],
                searchQueries: []
            }
        };
    }
}

export async function riskScorerNode(state: AuditState): Promise<Partial<AuditState>> {
    // 1. Bias Deductions (Weighted by Severity)
    const biasDeductions = (state.biasAnalysis || []).reduce((acc: number, b: { severity?: string }) => {
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

    // 4. Logic Penalty
    const logicScore = state.logicalAnalysis?.score || 100;
    const logicPenalty = (100 - logicScore) * 0.4;

    // 5. Echo Chamber Penalty (Cognitive Diversity)
    // If blindSpotGap is low (0 = Tunnel Vision), penalty increases.
    const diversityScore = state.cognitiveAnalysis?.blindSpotGap || 100;
    const diversityPenalty = (100 - diversityScore) * 0.3;

    // Calculate Base
    const baseScore = 100;
    let overallScore = baseScore - biasDeductions - noisePenalty - trustPenalty - logicPenalty - diversityPenalty;

    // Clamp 0-100
    overallScore = Math.max(0, Math.min(100, Math.round(overallScore)));

    console.log(`Scoring: Base(100) - Biases(${biasDeductions}) - Noise(${noisePenalty.toFixed(1)}) - Trust(${trustPenalty.toFixed(1)}) - Logic(${logicPenalty.toFixed(1)}) = ${overallScore}`);

    return {
        finalReport: {
            overallScore,
            noiseScore: Math.min(100, (state.noiseStats?.stdDev || 0) * 10),
            summary: `Audit complete. Detected ${(state.biasAnalysis || []).length} biases. Trust Score: ${trustScore}%.`,
            biases: state.biasAnalysis || [],
            noiseStats: state.noiseStats,
            factCheck: state.factCheckResult,
            compliance: state.compliance || { status: 'WARN', details: 'Compliance check unavailable.' },
            preMortem: state.preMortem,
            sentiment: state.sentimentAnalysis,
            logicalAnalysis: state.logicalAnalysis,
            swotAnalysis: state.swotAnalysis,
            cognitiveAnalysis: state.cognitiveAnalysis,
            speakers: [],
            createdAt: new Date(),
            analyses: []
        } as AnalysisResult
    };
}

export async function linguisticAnalysisNode(state: AuditState): Promise<Partial<AuditState>> {
    const content = truncateText(state.structuredContent || state.originalContent);
    try {
        const result = await getModel().generateContent([
            LINGUISTIC_ANALYSIS_PROMPT,
            `Text:\n${content}`
        ]);
        const data = parseJSON(result.response.text());
        return {
            sentimentAnalysis: data?.sentiment || { score: 0, label: 'Neutral' },
            logicalAnalysis: data?.logicalAnalysis || { score: 100, fallacies: [] }
        };
    } catch (e) {
        console.error("Linguistic Analysis Node failed", e);
        return {
            sentimentAnalysis: { score: 0, label: 'Neutral' },
            logicalAnalysis: { score: 100, fallacies: [] }
        };
    }
}

export async function strategicAnalysisNode(state: AuditState): Promise<Partial<AuditState>> {
    const content = truncateText(state.structuredContent || state.originalContent);
    try {
        const result = await getGroundedModel().generateContent([
            STRATEGIC_ANALYSIS_PROMPT,
            `Text:\n${content}`
        ]);
        const data = parseJSON(result.response.text());
        return {
            swotAnalysis: data?.swot,
            preMortem: data?.preMortem
        };
    } catch (e) {
        console.error("Strategic Analysis Node failed", e);
        return {
            swotAnalysis: undefined,
            preMortem: undefined
        };
    }
}

export async function cognitiveDiversityNode(state: AuditState): Promise<Partial<AuditState>> {

    const content = truncateText(state.structuredContent || state.originalContent);

    try {
        console.log("Searching for counter-arguments...");
        const result = await getGroundedModel().generateContent([
            COGNITIVE_DIVERSITY_PROMPT,
            `Text to Analysis:\n${content}`
        ]);

        const text = result.response.text();
        const data = parseJSON(text);

        // Extract Search Sources from Grounding Metadata
        const metadata = result.response.candidates?.[0]?.groundingMetadata;
        const searchSources: string[] = metadata?.groundingChunks
            ?.map((c: { web?: { uri?: string } }) => c.web?.uri)
            .filter((u: unknown): u is string => typeof u === 'string') || [];

        console.log(`Found ${searchSources.length} external perspectives.`);

        // Inject search sources into counter-arguments if missing
        if (data && data.counterArguments) {
            data.counterArguments = data.counterArguments.map((arg: { sourceUrl?: string }, index: number) => ({
                ...arg,
                sourceUrl: arg.sourceUrl || searchSources[index % searchSources.length]
            }));
        }

        return { cognitiveAnalysis: data };
    } catch (e) {
        console.error("Cognitive Diversity Node failed", e);
        return {};
    }
}

export async function decisionTwinNode(state: AuditState): Promise<Partial<AuditState>> {
    const content = truncateText(state.structuredContent || state.originalContent);

    try {
        const { DECISION_TWIN_PROMPT } = await import('./prompts');

        console.log("Running Decision Twin Simulation with Live Market Data...");

        const result = await getGroundedModel().generateContent([
            DECISION_TWIN_PROMPT,
            `Proposal to Vote On:\n${content}`,
            `CRITICAL INSTRUCTION:
            You have access to Google Search.
            BEFORE voting, the "Adversarial CFO" and "Market Skeptic" MUST search for:
            1. Current market volatility (VIX, Bond Yields).
            2. Recent competitor announcements.
            3. Macroeconomic risks relevant to this proposal.
            
            Cite these specific data points in their "rationale".`
        ]);

        const text = result.response.text();
        const data = parseJSON(text);

        return { simulation: data };
    } catch (e) {
        console.error("Decision Twin Node failed", e);
        return { simulation: undefined };
    }
}

export async function memoryRecallNode(state: AuditState): Promise<Partial<AuditState>> {
    const content = truncateText(state.structuredContent || state.originalContent);

    try {
        // 1. Vector Search for Similar Docs
        // Using "system" or "global" as userId wildcard since we lack context here.
        // In a real app, this should come from state.
        const similarDocs = await searchSimilarDocuments(content, "system", 3);

        // 2. LLM Analysis
        const result = await getModel().generateContent([
            INSTITUTIONAL_MEMORY_PROMPT,
            `Current Document Summary:\n${content.slice(0, 2000)}`,
            `Similar Past Cases Found:\n${JSON.stringify(similarDocs)}`
        ]);

        const text = result.response.text();
        const data = parseJSON(text);

        return { institutionalMemory: data };
    } catch (e) {
        console.error("Memory Recall Node failed", e);
        return { institutionalMemory: undefined };
    }
}
