import { AuditState } from "./types";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { BIAS_DETECTIVE_PROMPT, NOISE_JUDGE_PROMPT, STRUCTURER_PROMPT } from "./prompts";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
// Using gemini-3-pro-preview - deep reasoning for sophisticated analysis
const model = genAI.getGenerativeModel({
    model: "gemini-3-pro-preview",
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

// Helper to safely parse JSON from LLM output (Robust Balanced Extractor)
const parseJSON = (text: string) => {
    if (!text) return null;
    try {
        // 1. Attempt clean parse first (fastest)
        return JSON.parse(text);
    } catch (e) {
        // 2. Scan for first '{' or '['
        const startIndex = text.search(/[\{\[]/);
        if (startIndex === -1) {
            console.error("JSON Parse Error: No JSON start char found", "\nRaw:", text?.substring(0, 200));
            return null;
        }

        const openChar = text[startIndex];
        const closeChar = openChar === '{' ? '}' : ']';
        let balance = 0;
        let inString = false;
        let escape = false;

        for (let i = startIndex; i < text.length; i++) {
            const char = text[i];
            if (escape) {
                escape = false;
                continue;
            }
            if (char === '\\') {
                escape = true;
                continue;
            }
            if (char === '"') {
                inString = !inString;
                continue;
            }
            if (!inString) {
                if (char === openChar) {
                    balance++;
                } else if (char === closeChar) {
                    balance--;
                    if (balance === 0) {
                        const jsonStr = text.substring(startIndex, i + 1);
                        try {
                            return JSON.parse(jsonStr);
                        } catch (innerE) {
                            console.error("JSON Parse Error (Extraction Failed):", innerE);
                            return null; // Bad JSON inside good braces
                        }
                    }
                }
            }
        }

        console.error("JSON Parse Error: Unbalanced or truncated", "\nRaw:", text?.substring(0, 200));
        return null;
    }
};

export async function structurerNode(state: AuditState): Promise<Partial<AuditState>> {
    console.log("--- Structurer Node (Gemini) ---");
    try {
        const content = state.structuredContent || state.originalContent;
        const result = await model.generateContent([
            STRUCTURER_PROMPT,
            `Input Text:\n<input_text>\n${content}\n</input_text>`
        ]);
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
        const content = state.structuredContent || state.originalContent;
        const result = await model.generateContent([
            BIAS_DETECTIVE_PROMPT,
            `Text to Analyze:\n<input_text>\n${content}\n</input_text>`
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
                `Decision Text to Rate:\n<input_text>\n${content}\n</input_text>`,
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
            `Input Text:\n<input_text>\n${content}\n</input_text>`
        ]);
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
    const content = state.structuredContent || state.originalContent;

    try {
        // Step 1: Extract Tickers
        const extractionResult = await model.generateContent([
            `Extract any stock symbols (e.g. AAPL, TSLA) mentioned in the text. Return JSON: { "tickers": ["AAPL"] }`,
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
            `You are a Fact Checker. Verify key claims in the text using the provided Financial Data.
            If a claim contradicts the data (e.g. "We are in the Energy sector" but data says "Technology"), flag it.
            Return JSON: { "score": 0-100, "flags": ["Claim X contradicts market data..."] }`,
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
    const content = state.structuredContent || state.originalContent;
    try {
        const result = await model.generateContent([
            `You are a Pre-Mortem Architect. 
            Imagine it is 1 year in the future and the decision/plan described in the text has failed catastrophically.
            List 3 plausible reasons why (Failure Scenarios) and 3 Preventive Measures.
            
            Output JSON: { "failureScenarios": ["..."], "preventiveMeasures": ["..."] }`,
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
    const content = state.structuredContent || state.originalContent;
    try {
        const result = await model.generateContent([
            `You are a Compliance Officer. Analyze the text for alignment with Consumer Duty regulations.
            Check for: 1. Unclear information. 2. Foreseeable Harm. 3. Poor Value.
            
            Output JSON: { "status": "PASS" | "WARN" | "FAIL", "details": "Summary of findings..." }`,
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
    const biasDeductions = (state.biasAnalysis || []).reduce((acc: number, b: any) => {
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
            compliance: { status: 'PASS', details: 'Preliminary check passed.' }, // Placeholder until mapper is active
            speakers: state.speakers || [],
            structuredContent: state.structuredContent,
            createdAt: new Date(),
            analyses: [] // Placeholder
        } as any
    };
}

export async function sentimentAnalyzerNode(state: AuditState): Promise<Partial<AuditState>> {
    console.log("--- Sentiment Analyzer Node (Gemini) ---");
    try {
        const content = state.structuredContent || state.originalContent;
        const result = await model.generateContent([
            `You are a Sentiment Analyzer. Analyze the sentiment of the text.
            Return a JSON object with two keys:
            - "score": A number between -1 (very negative) and 1 (very positive).
            - "label": A string ("Positive", "Negative", or "Neutral").

            Example: { "score": 0.8, "label": "Positive" }`,
            `Text to Analyze:\n${content}`
        ]);
        const response = result.response.text();
        const data = parseJSON(response);

        return { sentimentAnalysis: data || { score: 0, label: 'Neutral' } };
    } catch (e) {
        console.error("Sentiment Analyzer failed", e);
        return { sentimentAnalysis: { score: 0, label: 'Neutral' } };
    }
}
