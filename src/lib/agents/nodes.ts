import { AuditState } from "./types";
import { parseJSON } from '../utils/json';
import { AnalysisResult, BiasDetectionResult, NoiseBenchmark } from '../../types';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerativeModel, type Tool } from "@google/generative-ai";
import { BIAS_DETECTIVE_PROMPT, NOISE_JUDGE_PROMPT, STRUCTURER_PROMPT } from "./prompts";
import { searchSimilarDocuments } from "../rag/embeddings";
import { executeDataRequests, DataRequest } from "../tools/financial";
import { getRequiredEnvVar, getOptionalEnvVar } from '../env';
import { withRetry, smartTruncate, batchProcess } from '../utils/resilience';
import { getCachedBiasInsight, cacheBiasInsight } from '../utils/cache';
import { createLogger } from '../utils/logger';

// ============================================================
// CONSTANTS
// ============================================================

const log = createLogger('Agents');

// Severity levels for bias detection - use these instead of hardcoded strings
const SEVERITY_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
} as const;

// ============================================================
// AI MODEL CONFIGURATION
// ============================================================

type SafetyLevel = 'relaxed' | 'standard';

interface ModelOptions {
    grounded?: boolean;
    /**
     * 'relaxed' — BLOCK_NONE. Required for bias detection, compliance checking,
     *   and other nodes that must analyse potentially harmful content in documents.
     * 'standard' — BLOCK_MEDIUM_AND_ABOVE. Suitable for simulation/creative nodes.
     */
    safetyLevel?: SafetyLevel;
}

function createModelInstance(options: ModelOptions = {}): GenerativeModel {
    const apiKey = getRequiredEnvVar('GOOGLE_API_KEY');
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = getOptionalEnvVar('GEMINI_MODEL_NAME', 'gemini-3-flash-preview');

    const safetySettings = options.safetyLevel === 'standard'
        ? [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }
        ]
        : [
            // Relaxed: needed to analyse documents containing sensitive language
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
        ];

    const tools = options.grounded
        ? [
            { googleSearch: {} } as Tool
        ]
        : undefined;

    return genAI.getGenerativeModel({
        model: modelName,
        ...(tools ? { tools } : {}),
        generationConfig: {
            responseMimeType: "application/json",
            maxOutputTokens: 16384
        },
        safetySettings
    });
}

// Lazy singletons
let modelInstance: GenerativeModel | null = null;
let groundedModelInstance: GenerativeModel | null = null;
let standardSafetyGroundedInstance: GenerativeModel | null = null;

function getModel(): GenerativeModel {
    if (!modelInstance) {
        modelInstance = createModelInstance({ safetyLevel: 'relaxed' });
    }
    return modelInstance;
}

function getGroundedModel(): GenerativeModel {
    if (!groundedModelInstance) {
        groundedModelInstance = createModelInstance({ grounded: true, safetyLevel: 'relaxed' });
    }
    return groundedModelInstance;
}

/** Model with standard safety filters — used for simulation/creative nodes. */
function getStandardSafetyGroundedModel(): GenerativeModel {
    if (!standardSafetyGroundedInstance) {
        standardSafetyGroundedInstance = createModelInstance({ grounded: true, safetyLevel: 'standard' });
    }
    return standardSafetyGroundedInstance;
}

// ============================================================
// SHARED UTILITIES
// ============================================================

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
    return smartTruncate(text, MAX_INPUT_CHARS);
}

/**
 * Extract verified search source URLs from Gemini grounding metadata.
 * Consolidates the duplicated metadata extraction pattern used by multiple nodes.
 */
function extractSearchSources(
    response: { candidates?: Array<{ groundingMetadata?: { groundingChunks?: Array<{ web?: { uri?: string } }> } }> }
): string[] {
    const metadata = response.candidates?.[0]?.groundingMetadata;
    return metadata?.groundingChunks
        ?.map((c: { web?: { uri?: string } }) => c.web?.uri)
        .filter((u: unknown): u is string => typeof u === 'string') || [];
}

/**
 * Wrap external (untrusted) data in clearly delimited XML blocks before
 * embedding it in an LLM prompt. This reduces the surface area for prompt
 * injection by making it unambiguous where external data starts and ends.
 *
 * XML special characters are escaped so that crafted data cannot break out
 * of the delimiter tags (e.g. a value of "</external_data>inject..." would
 * otherwise prematurely close the block).
 */
function sanitizeForPrompt(data: unknown, label: string = 'external_data'): string {
    const json = JSON.stringify(data, null, 2)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    return `<${label}>\n${json}\n</${label}>`;
}

// ============================================================
// NODES
// ============================================================

export async function structurerNode(state: AuditState): Promise<Partial<AuditState>> {
    // SECURITY: Only use anonymized content. If structuredContent is empty the
    // graph routing guard should have prevented us from reaching this node.
    if (!state.structuredContent) {
        throw new Error('structurerNode: structuredContent is empty — anonymization may have been bypassed');
    }
    const content = state.structuredContent;

    try {
        log.info("Running document structuring...");

        const result = await withTimeout(getModel().generateContent([
            STRUCTURER_PROMPT,
            `<input_text>\n${content}\n</input_text>`
        ]));

        const responseText = result.response?.text ? result.response.text() : "";
        const data = parseJSON(responseText);

        if (data?.structuredContent) {
            log.info(`Structuring complete. Identified ${data.speakers?.length || 0} speakers.`);
            return {
                structuredContent: data.structuredContent,
                speakers: data.speakers || []
            };
        }
    } catch (e) {
        log.error("Structurer node failed:", e instanceof Error ? e.message : String(e));
    }

    // Fallback: return content as-is
    return {
        structuredContent: content,
        speakers: []
    };
}

export async function biasDetectiveNode(state: AuditState): Promise<Partial<AuditState>> {

    try {
        // SECURITY: Never fall back to originalContent — only use anonymized content
        const content = truncateText(state.structuredContent || '');

        // Use Grounded Model for primary detection with retry logic
        const result = await withRetry(
            () => withTimeout(getGroundedModel().generateContent([
                BIAS_DETECTIVE_PROMPT,
                `Text to Analyze: \n<input_text>\n${content} \n </input_text>`,
                `CRITICAL: If the document mentions modern events, public figures, or statistical claims, verify their accuracy using Google Search BEFORE flagging them as biased or unbiased.`
            ])),
            2, // 2 retries
            1000, // 1 second base delay
            10000 // 10 second max delay
        );

        const response = result.response?.text ? result.response.text() : "";
        const data = parseJSON(response);
        const biases = data?.biases || [];

        // Educational Insight (Dynamic Retrieval) with caching
        // For HIGH/CRITICAL biases, fetch scientific context
        const severeBiases = biases.filter((b: BiasDetectionResult) =>
            (b.severity === SEVERITY_LEVELS.HIGH || b.severity === SEVERITY_LEVELS.CRITICAL) && b.biasType
        );

        if (severeBiases.length > 0) {
            log.info(`Fetching educational insights for ${severeBiases.length} severe biases...`);

            // Process insights with concurrency control and caching
            await batchProcess(
                severeBiases.slice(0, 3),
                async (bias: BiasDetectionResult) => {
                    // Check cache first
                    const cachedInsight = await getCachedBiasInsight(bias.biasType);
                    if (cachedInsight) {
                        log.debug(`Cache hit for bias insight: ${bias.biasType}`);
                        bias.researchInsight = JSON.parse(cachedInsight);
                        return;
                    }

                    try {
                        const searchResult = await withRetry(
                            () => withTimeout(getGroundedModel().generateContent([
                                `You are a Cognitive Psychology Tutor.
                                TASK: Find a specific scientific study or "HBR" (Harvard Business Review) article that explains the following bias: "${bias.biasType}".

                                OUTPUT JSON:
                                {
                                    "title": "The Hidden Traps in Decision Making (HBR)",
                                    "summary": "1-sentence explanation of why this bias occurs based on the study.",
                                    "sourceUrl": "https://hbr.org/..."
                                }`,
                                `Bias: ${bias.biasType}`
                            ]), 30000), // 30 second timeout for insights
                            2, // 2 retries
                            1000,
                            5000
                        );

                        const insightText = searchResult.response?.text ? searchResult.response.text() : "";
                        const insightData = parseJSON(insightText);

                        // Extract Source
                        const searchSources = searchResult.response ? extractSearchSources(searchResult.response) : [];
                        const searchSource = searchSources[0];

                        if (insightData) {
                            const researchInsight = {
                                ...insightData,
                                sourceUrl: insightData.sourceUrl || searchSource || ""
                            };
                            bias.researchInsight = researchInsight;

                            // Cache the insight for future use
                            await cacheBiasInsight(bias.biasType, JSON.stringify(researchInsight));
                        }
                    } catch (e) {
                        log.error(`Failed to fetch insight for ${bias.biasType}`, e);
                    }
                },
                2 // Process 2 at a time to avoid rate limits
            );
        }

        return { biasAnalysis: biases };
    } catch (e) {
        log.error("Bias Detective failed:", e instanceof Error ? e.message : String(e));
        return { biasAnalysis: [] };
    }
}

export async function noiseJudgeNode(state: AuditState): Promise<Partial<AuditState>> {

    // SECURITY: Never fall back to originalContent — only use anonymized content
    const content = truncateText(state.structuredContent || '');

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
            log.info(`Verifying ${extractedBenchmarks.length} benchmarks with Google Search...`);
            const benchmarkResult = await getGroundedModel().generateContent([
                `You are a Market Research validator.
                TASK:
                1. Take the provided internal metrics.
                2. Use Google Search to find EXTERNAL consensus data for 2024/2025.
                3. Compare internal vs external.

                METRICS TO VERIFY:
                ${sanitizeForPrompt(extractedBenchmarks, 'internal_metrics')}

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
            const searchSources = extractSearchSources(benchmarkResult.response);

            noiseBenchmarks = noiseBenchmarks.map((b: NoiseBenchmark, i: number) => ({
                ...b,
                // Guard against empty searchSources: modulo by 0 produces NaN.
                sourceUrl: b.sourceUrl || (searchSources.length > 0 ? searchSources[i % searchSources.length] : undefined)
            }));
        }

        return {
            noiseScores: validScores,
            noiseStats: { mean: Number(mean.toFixed(1)), stdDev: Number(stdDev.toFixed(1)), variance: Number(variance.toFixed(1)) },
            noiseBenchmarks
        };
    } catch (e) {
        log.error("Noise Judges failed", e);
        return { noiseScores: [], noiseStats: { mean: 0, stdDev: 0, variance: 0 } };
    }
}

export async function gdprAnonymizerNode(state: AuditState): Promise<Partial<AuditState>> {
    const content = state.originalContent;

    try {
        log.info("Running GDPR Anonymization...");

        // Use the model to identify and redact PII
        const result = await withTimeout(getModel().generateContent([
            `You are a GDPR Privacy Compliance Expert.

            TASK: Identify and redact ALL Personally Identifiable Information (PII) from the text below.

            PII to redact includes:
            - Full names of individuals (e.g., "John Smith" -> "[PERSON_1]")
            - Email addresses (e.g., "john@example.com" -> "[EMAIL_1]")
            - Phone numbers (e.g., "+1-555-0123" -> "[PHONE_1]")
            - Physical addresses (e.g., "123 Main St" -> "[ADDRESS_1]")
            - Company names (e.g., "Acme Corp" -> "[COMPANY_1]")
            - Job titles with names (e.g., "CEO John" -> "CEO [PERSON_1]")
            - IP addresses (e.g., "192.168.1.1" -> "[IP_1]")
            - SSN/National ID numbers
            - Financial account numbers

            INSTRUCTIONS:
            1. Replace each PII instance with a numbered placeholder in format [TYPE_NUMBER]
            2. Maintain the structure and meaning of the document
            3. DO NOT redact generic terms like "the company", "our team", etc.
            4. Return the complete redacted text

            OUTPUT FORMAT: Return ONLY valid JSON.
            {
                "structuredContent": "redacted text with [PLACEHOLDERS]",
                "redactions": [
                    {"type": "PERSON", "index": 1, "original": "John Smith"},
                    {"type": "EMAIL", "index": 1, "original": "john@example.com"}
                ]
            }`,
            `Text to anonymize:\n${content}`
        ]));

        const responseText = result.response?.text ? result.response.text() : "";
        const data = parseJSON(responseText);

        if (data?.structuredContent) {
            log.info(`GDPR Anonymization complete. Redacted ${data.redactions?.length || 0} PII instances.`);
            return {
                anonymizationStatus: 'success',
                structuredContent: data.structuredContent,
                speakers: [] // Will be populated by structurer node
            };
        }

        // LLM returned unexpected shape — treat as failure
        log.error("GDPR Anonymizer returned invalid response shape");
    } catch (e) {
        log.error("GDPR Anonymizer failed:", e instanceof Error ? e.message : String(e));
    }

    // SECURITY: Do NOT pass original PII through the pipeline on failure.
    // Set a placeholder and mark anonymization as failed so the graph can
    // short-circuit to riskScorer with an error report.
    return {
        anonymizationStatus: 'failed',
        structuredContent: '[REDACTION_FAILED — content withheld to protect PII]',
        speakers: []
    };
}

// ============================================================
// VERIFICATION SUPER-NODE (factChecker + complianceMapper)
// ============================================================

export async function verificationNode(state: AuditState): Promise<Partial<AuditState>> {
    // SECURITY: Never fall back to originalContent — only use anonymized content
    const content = truncateText(state.structuredContent || '');

    try {
        log.info("Running combined Fact Check + Compliance verification...");

        // Import super-prompt
        const { VERIFICATION_SUPER_PROMPT } = await import('./prompts');

        // Single grounded LLM call for both fact-check and compliance
        const result = await withRetry(
            () => withTimeout(
                getGroundedModel().generateContent([
                    VERIFICATION_SUPER_PROMPT,
                    `Document to analyze:\n<input_text>\n${content}\n</input_text>`
                ]),
                90000 // 90 second timeout for combined verification
            ),
            2, // 2 retries
            1000,
            10000
        );

        const responseText = result.response?.text ? result.response.text() : "";
        const data = parseJSON(responseText);

        // Extract fact-check result
        const factCheckData = data?.factCheck;
        const companyName = factCheckData?.primaryTopic || null;
        if (companyName) log.info(`Identified primary topic: ${companyName}`);

        // Fetch financial data if needed (preserves Finnhub integration)
        const dataRequests = factCheckData?.dataRequests || [];
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

            const uniqueRequests = Array.from(new Map(validRequests.map(item => [item.ticker, item])).values());
            if (uniqueRequests.length > 0) {
                fetchedData = await executeDataRequests(uniqueRequests);
            }
        }

        // If financial data was fetched, do a verification pass
        let enrichedFactCheck;
        if (Object.keys(fetchedData).length > 0 && factCheckData?.verifications?.length > 0) {
            log.info("Refining fact-check with Finnhub financial data...");
            const refinementResult = await withTimeout(getGroundedModel().generateContent([
                `You are a Financial Fact Checker. Refine the verification verdicts below using the REAL-TIME FINANCIAL DATA provided.
                If a claim was marked UNVERIFIABLE but the data now supports or contradicts it, update the verdict.

                CURRENT VERIFICATIONS:
                ${sanitizeForPrompt(factCheckData.verifications, 'verifications')}

                REAL-TIME FINANCIAL DATA (Finnhub):
                ${sanitizeForPrompt(fetchedData, 'financial_data')}

                Return valid JSON: { "score": 0-100, "verifications": [...updated...] }`,
                `Topic: ${companyName}`
            ]), 45000);

            const refinedText = refinementResult.response?.text ? refinementResult.response.text() : "";
            const refined = parseJSON(refinedText);

            if (refined?.verifications) {
                const searchSources = extractSearchSources(refinementResult.response);
                enrichedFactCheck = {
                    status: 'success' as const,
                    score: typeof refined.score === 'number' ? refined.score : (typeof factCheckData.score === 'number' ? factCheckData.score : 50),
                    summary: factCheckData.summary || "Verification completed",
                    verifications: refined.verifications.map((v: { sourceUrl?: string }, i: number) => ({
                        ...v,
                        sourceUrl: v.sourceUrl || (searchSources.length > 0 ? searchSources[i % searchSources.length] : "")
                    })),
                    primaryTopic: companyName,
                    flags: [],
                    searchSources
                };
            }
        }

        // Fall back to the initial fact-check if no refinement was needed
        if (!enrichedFactCheck) {
            const searchSources = extractSearchSources(result.response);
            enrichedFactCheck = {
                status: 'success' as const,
                score: typeof factCheckData?.score === 'number' ? factCheckData.score : 50,
                summary: factCheckData?.summary || "Verification completed",
                verifications: (factCheckData?.verifications || []).map((v: { sourceUrl?: string }, i: number) => ({
                    ...v,
                    sourceUrl: v.sourceUrl || (searchSources.length > 0 ? searchSources[i % searchSources.length] : "")
                })),
                primaryTopic: companyName,
                flags: [],
                searchSources
            };
        }

        // Extract compliance result
        const complianceData = data?.compliance || {
            status: "WARN",
            riskScore: 50,
            summary: "Compliance data unavailable from combined analysis.",
            regulations: [],
            searchQueries: []
        };

        log.info(`Verification complete. Fact score: ${enrichedFactCheck.score}, Compliance: ${complianceData.status}`);

        return {
            factCheckResult: enrichedFactCheck,
            compliance: complianceData
        };
    } catch (e) {
        log.error("Verification Node failed:", e instanceof Error ? e.message : String(e));
        return {
            factCheckResult: { status: 'error', score: 0, flags: ["Error: Verification Unavailable"] },
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

// ============================================================
// DEEP ANALYSIS SUPER-NODE (linguistic + strategic + cognitiveDiversity)
// ============================================================

export async function deepAnalysisNode(state: AuditState): Promise<Partial<AuditState>> {
    // SECURITY: Never fall back to originalContent — only use anonymized content
    const content = truncateText(state.structuredContent || '');

    try {
        log.info("Running deep multi-dimensional analysis (sentiment, logic, SWOT, cognitive diversity)...");

        const { DEEP_ANALYSIS_SUPER_PROMPT } = await import('./prompts');

        const result = await withRetry(
            () => withTimeout(
                getGroundedModel().generateContent([
                    DEEP_ANALYSIS_SUPER_PROMPT,
                    `Text to analyze:\n<input_text>\n${content}\n</input_text>`
                ]),
                90000 // 90 second timeout
            ),
            2,
            1000,
            10000
        );

        const responseText = result.response?.text ? result.response.text() : "";
        const data = parseJSON(responseText);

        // Extract search sources for counter-arguments
        const searchSources = extractSearchSources(result.response);

        // Enrich counter-arguments with search sources
        const cognitiveData = data?.cognitiveAnalysis;
        if (cognitiveData?.counterArguments) {
            cognitiveData.counterArguments = cognitiveData.counterArguments.map(
                (arg: { sourceUrl?: string }, index: number) => ({
                    ...arg,
                    sourceUrl: arg.sourceUrl || (searchSources.length > 0 ? searchSources[index % searchSources.length] : undefined)
                })
            );
        }

        log.info(`Deep analysis complete. Sentiment: ${data?.sentiment?.label || 'N/A'}, Logic score: ${data?.logicalAnalysis?.score ?? 'N/A'}, BlindSpotGap: ${cognitiveData?.blindSpotGap ?? 'N/A'}`);

        return {
            sentimentAnalysis: data?.sentiment || { score: 0, label: 'Neutral' },
            logicalAnalysis: data?.logicalAnalysis || { score: 100, fallacies: [] },
            swotAnalysis: data?.swot,
            preMortem: data?.preMortem,
            cognitiveAnalysis: cognitiveData
        };
    } catch (e) {
        log.error("Deep Analysis Node failed:", e instanceof Error ? e.message : String(e));
        return {
            sentimentAnalysis: { score: 0, label: 'Neutral' },
            logicalAnalysis: { score: 100, fallacies: [] },
            swotAnalysis: undefined,
            preMortem: undefined,
            cognitiveAnalysis: undefined
        };
    }
}

// ============================================================
// SIMULATION SUPER-NODE (decisionTwin + memoryRecall)
// ============================================================

export async function simulationNode(state: AuditState): Promise<Partial<AuditState>> {
    // SECURITY: Never fall back to originalContent — only use anonymized content
    const content = truncateText(state.structuredContent || '');

    try {
        log.info("Running boardroom simulation with institutional memory...");

        // Step 1: RAG vector search for similar past documents
        const userId = state.userId || 'system';
        let similarDocs: unknown[] = [];
        try {
            similarDocs = await searchSimilarDocuments(content, userId, 3);
            log.info(`Found ${similarDocs.length} similar past cases for context.`);
        } catch (ragError) {
            log.warn("RAG search failed, proceeding without institutional memory:", ragError instanceof Error ? ragError.message : String(ragError));
        }

        // Step 2: Combined simulation + memory prompt
        const { SIMULATION_SUPER_PROMPT } = await import('./prompts');

        const result = await withTimeout(
            getStandardSafetyGroundedModel().generateContent([
                SIMULATION_SUPER_PROMPT,
                `Proposal to Vote On:\n<input_text>\n${content}\n</input_text>`,
                `Similar Past Cases Found (via Vector Search):\n${sanitizeForPrompt(similarDocs, 'past_cases')}`
            ]),
            90000
        );

        const text = result.response?.text ? result.response.text() : "";
        const data = parseJSON(text);

        log.info(`Simulation complete. Verdict: ${data?.simulation?.overallVerdict || 'N/A'}, Memory recall: ${data?.institutionalMemory?.recallScore ?? 'N/A'}`);

        return {
            simulation: data?.simulation,
            institutionalMemory: data?.institutionalMemory
        };
    } catch (e) {
        log.error("Simulation Node failed:", e instanceof Error ? e.message : String(e));
        return {
            simulation: undefined,
            institutionalMemory: undefined
        };
    }
}

// ============================================================
// RISK SCORER (unchanged — aggregates all state into final report)
// ============================================================

export async function riskScorerNode(state: AuditState): Promise<Partial<AuditState>> {
    // SECURITY: If GDPR anonymization failed, short-circuit with error report
    if (state.anonymizationStatus === 'failed') {
        log.warn("Anonymization failed — generating error report without analysing PII content");
        return {
            finalReport: {
                overallScore: 0,
                noiseScore: 0,
                summary: 'Analysis aborted: GDPR anonymization failed. Document content was not processed to protect PII.',
                biases: [],
                noiseStats: { mean: 0, stdDev: 0, variance: 0 },
                factCheck: { score: 0, flags: ['Anonymization failure — fact check skipped'] },
                compliance: {
                    status: 'FAIL',
                    riskScore: 100,
                    summary: 'Skipped due to anonymization failure.',
                    regulations: [],
                    searchQueries: []
                },
                speakers: []
            } satisfies AnalysisResult
        };
    }

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
    // Distinguish between successful check (use score) and error/null (neutral penalty).
    const factCheck = state.factCheckResult;
    let trustScore: number;
    if (!factCheck || factCheck.status === 'error') {
        // Unknown trust — apply moderate penalty instead of assuming perfect (100)
        trustScore = 50;
    } else {
        trustScore = factCheck.score;
    }
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

    log.info(`Scoring: Base(100) - Biases(${biasDeductions}) - Noise(${noisePenalty.toFixed(1)}) - Trust(${trustPenalty.toFixed(1)}) - Logic(${logicPenalty.toFixed(1)}) = ${overallScore}`);

    return {
        finalReport: {
            overallScore,
            noiseScore: Math.min(100, (state.noiseStats?.stdDev || 0) * 10),
            summary: `Audit complete. Detected ${(state.biasAnalysis || []).length} biases. Trust Score: ${trustScore}%.`,
            structuredContent: state.structuredContent,
            biases: state.biasAnalysis || [],
            noiseStats: state.noiseStats,
            noiseBenchmarks: state.noiseBenchmarks,
            factCheck: state.factCheckResult ?? undefined,
            compliance: state.compliance || {
                status: 'WARN',
                riskScore: 50,
                summary: 'Compliance check unavailable.',
                regulations: [],
                searchQueries: []
            },
            preMortem: state.preMortem,
            sentiment: state.sentimentAnalysis,
            logicalAnalysis: state.logicalAnalysis,
            swotAnalysis: state.swotAnalysis,
            cognitiveAnalysis: state.cognitiveAnalysis,
            simulation: state.simulation ?? undefined,
            institutionalMemory: state.institutionalMemory ?? undefined,
            speakers: []
        } satisfies AnalysisResult
    };
}

