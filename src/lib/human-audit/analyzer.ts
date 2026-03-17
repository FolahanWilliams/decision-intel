/**
 * Human Decision Analyzer
 *
 * Reuses the same cognitive engine (bias detection, noise jury, compliance)
 * that powers AI decision auditing (Product A), but adapted for human
 * decision inputs from Slack, meeting transcripts, emails, and tickets.
 *
 * The key insight: the cognitive biases that corrupt AI reasoning are the
 * same biases that corrupt human reasoning. The engine doesn't change —
 * only the input channel changes.
 */

import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  type GenerativeModel,
} from '@google/generative-ai';
import { getRequiredEnvVar, getOptionalEnvVar } from '@/lib/env';
import { createLogger } from '@/lib/utils/logger';
import { withRetry, validateContent, smartTruncate } from '@/lib/utils/resilience';
import { parseJSON } from '@/lib/utils/json';
import {
  BIAS_DETECTIVE_PROMPT,
  NOISE_JUDGE_PROMPT,
  VERIFICATION_SUPER_PROMPT,
  SIMULATION_SUPER_PROMPT,
} from '@/lib/agents/prompts';
import { searchSimilarDocuments } from '@/lib/rag/embeddings';
import type { HumanDecisionInput, CognitiveAuditResult } from '@/types/human-audit';
import type { BiasDetectionResult, ComplianceResult, LogicalAnalysisResult } from '@/types';

const log = createLogger('HumanAudit');

// ─── AI Model Configuration (matches nodes.ts pattern) ──────────────────────

let modelInstance: GenerativeModel | null = null;

function getModel(): GenerativeModel {
  if (!modelInstance) {
    const apiKey = getRequiredEnvVar('GOOGLE_API_KEY');
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = getOptionalEnvVar('GEMINI_MODEL_NAME', 'gemini-3-flash-preview');

    modelInstance = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: 16384,
      },
      safetySettings: [
        // Relaxed: human decisions may contain sensitive language (incident reports, etc.)
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });
  }
  return modelInstance;
}

// ─── GDPR Anonymization (reuses same approach as gdprAnonymizerNode) ─────────

async function anonymizeContent(content: string): Promise<string> {
  try {
    const model = getModel();
    const result = await withRetry(
      async () => {
        const response = await model.generateContent([
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
- Slack user IDs (e.g., "<@U12345>" -> "[USER_1]")

INSTRUCTIONS:
1. Replace each PII instance with a numbered placeholder in format [TYPE_NUMBER]
2. Maintain the structure and meaning of the text
3. DO NOT redact generic terms like "the company", "our team", etc.
4. Return the complete redacted text

OUTPUT FORMAT: Return ONLY valid JSON.
{
  "redactedContent": "redacted text with [PLACEHOLDERS]",
  "redactionCount": 0
}`,
          `Text to anonymize:\n${content}`,
        ]);
        return response.response.text();
      },
      2,
      1000
    );

    const parsed = parseJSON(result) as {
      redactedContent?: string;
      redactionCount?: number;
    } | null;

    if (parsed?.redactedContent) {
      // Validate that redaction actually happened for substantial content
      const hasPlaceholders = /\[(PERSON|EMAIL|PHONE|ADDRESS|COMPANY|IP|USER|FINANCIAL)_\d+\]/.test(
        parsed.redactedContent
      );
      if (!hasPlaceholders && content.length > 200) {
        log.warn(
          'GDPR anonymizer returned no placeholders for substantial content — blocking to prevent PII leakage'
        );
        throw new Error('GDPR anonymization produced no redactions for substantial content');
      }
      log.info(`GDPR anonymization complete: ${parsed.redactionCount ?? 0} redactions`);
      return parsed.redactedContent;
    }
  } catch (e) {
    log.error('GDPR anonymization failed:', e instanceof Error ? e.message : String(e));
  }

  // On failure, block the pipeline to prevent PII leakage to external LLMs
  // (matches Product A behavior in nodes.ts which sets anonymizationStatus: 'failed')
  log.error('GDPR anonymization unavailable — blocking content to prevent PII leakage');
  throw new Error('GDPR anonymization failed — cannot proceed with un-anonymized content');
}

/** Adapted bias detection prompt for human conversational inputs */
const HUMAN_BIAS_PROMPT = `
${BIAS_DETECTIVE_PROMPT}

ADDITIONAL CONTEXT: You are analyzing a HUMAN DECISION captured from enterprise communication.
This may be a Slack conversation, meeting transcript, email thread, or ticket.

Pay special attention to:
- Group dynamics: Groupthink, Authority Bias, Bandwagon Effect
- Decision pressure: Availability Heuristic (recent incidents dominating), Anchoring (first data point)
- Consensus patterns: Was there genuine deliberation or instant agreement?
- Emotional reasoning: Loss Aversion, Framing Effect under pressure

Also detect:
- teamConsensusFlag: true if all participants agree without visible deliberation
- dissenterCount: number of participants who expressed a different view
`;

/**
 * Analyze a human decision for cognitive biases, noise, and quality.
 *
 * This is the core Product B pipeline — it runs the same analysis engine
 * on human communication that Product A runs on documents.
 */
export async function analyzeHumanDecision(
  input: HumanDecisionInput,
  options?: { userId?: string }
): Promise<CognitiveAuditResult> {
  log.info(
    `Analyzing human decision from ${input.source}${input.channel ? ` (${input.channel})` : ''}`
  );

  // Validate content length (matches existing validateContent pattern)
  const validation = validateContent(input.content);
  if (!validation.valid) {
    log.warn(`Content validation failed: ${validation.error}`);
    return {
      decisionQualityScore: 0,
      noiseScore: 50,
      summary: `Analysis skipped: ${validation.error}`,
      biasFindings: [],
      teamConsensusFlag: false,
      dissenterCount: 0,
    };
  }

  // GDPR anonymization — strip PII before any LLM calls
  let anonymizedContent: string;
  try {
    anonymizedContent = await anonymizeContent(input.content);
  } catch (anonError) {
    log.error('GDPR anonymization blocked pipeline:', anonError instanceof Error ? anonError.message : String(anonError));
    return {
      decisionQualityScore: 0,
      noiseScore: 50,
      summary: 'Analysis blocked: content could not be anonymized. PII protection prevented analysis.',
      biasFindings: [],
      teamConsensusFlag: false,
      dissenterCount: 0,
    };
  }

  // Truncate if very long (same as existing pipeline)
  const content = smartTruncate(anonymizedContent, 50000);

  // Determine which deep analyses to run based on decision type/source
  const isHighStakes = input.decisionType === 'strategic' || input.source === 'meeting_transcript';
  const runCompliance = true; // Always run compliance check
  const runDecisionTwin = isHighStakes;

  // Phase 1: Core analyses (always run in parallel)
  const [biasResult, noiseResult, sentimentResult, complianceResult] = await Promise.allSettled([
    detectHumanBiases(content, input),
    measureDecisionNoise(content),
    analyzeSentiment(content),
    runCompliance ? analyzeComplianceAndPreMortem(content, input) : Promise.resolve(null),
  ]);

  // Extract results with safe fallbacks
  const biasData = biasResult.status === 'fulfilled' ? biasResult.value : null;
  const noiseData = noiseResult.status === 'fulfilled' ? noiseResult.value : null;
  const sentimentData = sentimentResult.status === 'fulfilled' ? sentimentResult.value : null;
  const complianceData = complianceResult.status === 'fulfilled' ? complianceResult.value : null;

  if (biasResult.status === 'rejected') {
    log.error('Bias detection failed:', biasResult.reason);
  }
  if (noiseResult.status === 'rejected') {
    log.error('Noise measurement failed:', noiseResult.reason);
  }
  if (sentimentResult.status === 'rejected') {
    log.error('Sentiment analysis failed:', sentimentResult.reason);
  }
  if (complianceResult.status === 'rejected') {
    log.error('Compliance/pre-mortem analysis failed:', complianceResult.reason);
  }

  // Phase 2: Decision twin simulation (only for high-stakes decisions, runs after phase 1)
  let simulationData: DecisionTwinResult | null = null;
  if (runDecisionTwin) {
    try {
      simulationData = await simulateDecisionTwin(content, input, options?.userId);
    } catch (e) {
      log.error('Decision twin simulation failed:', e instanceof Error ? e.message : String(e));
    }
  }

  // Calculate decision quality score (same formula as riskScorerNode)
  const biasDeductions = (biasData?.biases ?? []).reduce((sum, b) => {
    const weight = { low: 2, medium: 5, high: 10, critical: 20 }[b.severity] ?? 5;
    return sum + weight;
  }, 0);

  const noisePenalty = noiseData?.noiseStats ? noiseData.noiseStats.stdDev * 5 : 0;

  // Compliance violations add to deductions
  const complianceDeductions = complianceData?.complianceResult
    ? complianceData.complianceResult.regulations.filter(
        r => r.riskLevel === 'critical' || r.riskLevel === 'high'
      ).length * 8
    : 0;

  const decisionQualityScore = Math.max(
    0,
    Math.min(100, Math.round(100 - biasDeductions - noisePenalty - complianceDeductions))
  );

  const noiseScore = noiseData?.noiseStats
    ? Math.round(100 - noiseData.noiseStats.stdDev * 10)
    : 50;

  // Generate summary
  const summary = buildAuditSummary(
    biasData?.biases ?? [],
    decisionQualityScore,
    noiseScore,
    biasData?.teamConsensusFlag ?? false,
    input
  );

  return {
    decisionQualityScore,
    noiseScore: Math.max(0, Math.min(100, noiseScore)),
    sentimentScore: sentimentData?.score ?? undefined,
    summary,
    biasFindings: biasData?.biases ?? [],
    noiseStats: noiseData?.noiseStats,
    complianceResult: complianceData?.complianceResult ?? undefined,
    preMortem: complianceData?.preMortem ?? undefined,
    logicalAnalysis: simulationData?.logicalAnalysis ?? undefined,
    sentimentDetail: sentimentData
      ? { score: sentimentData.score, label: sentimentData.label }
      : undefined,
    teamConsensusFlag: biasData?.teamConsensusFlag ?? false,
    dissenterCount: biasData?.dissenterCount ?? 0,
  };
}

// ─── Internal Analysis Functions ─────────────────────────────────────────────

interface HumanBiasResult {
  biases: BiasDetectionResult[];
  teamConsensusFlag: boolean;
  dissenterCount: number;
}

async function detectHumanBiases(
  content: string,
  input: HumanDecisionInput
): Promise<HumanBiasResult> {
  const model = getModel();

  const contextPrefix = [
    `Decision Source: ${input.source}`,
    input.channel ? `Channel: ${input.channel}` : null,
    input.decisionType ? `Decision Type: ${input.decisionType}` : null,
    input.participants?.length ? `Participants: ${input.participants.length} people` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const prompt = `${HUMAN_BIAS_PROMPT}

<context>
${contextPrefix}
</context>

<decision_text>
${content}
</decision_text>

Return JSON with this schema:
{
  "biases": [{ "biasType": "...", "severity": "...", "excerpt": "...", "explanation": "...", "suggestion": "...", "confidence": 0.0-1.0 }],
  "teamConsensusFlag": true/false,
  "dissenterCount": 0
}`;

  const result = await withRetry(
    async () => {
      const response = await model.generateContent(prompt);
      return response.response.text();
    },
    2,
    1000
  );

  const parsed = parseJSON(result) as {
    biases: Array<{
      biasType: string;
      severity: string;
      excerpt: string;
      explanation: string;
      suggestion: string;
      confidence?: number;
    }>;
    teamConsensusFlag?: boolean;
    dissenterCount?: number;
  } | null;

  if (!parsed || !Array.isArray(parsed.biases)) {
    log.warn('Failed to parse bias detection result, returning empty');
    return { biases: [], teamConsensusFlag: false, dissenterCount: 0 };
  }

  const biases: BiasDetectionResult[] = parsed.biases.map(b => ({
    biasType: b.biasType,
    found: true,
    severity: (['low', 'medium', 'high', 'critical'].includes(b.severity)
      ? b.severity
      : 'medium') as BiasDetectionResult['severity'],
    excerpt: b.excerpt || '',
    explanation: b.explanation || '',
    suggestion: b.suggestion || '',
    confidence: b.confidence ?? 0.7,
  }));

  return {
    biases,
    teamConsensusFlag: parsed.teamConsensusFlag ?? false,
    dissenterCount: parsed.dissenterCount ?? 0,
  };
}

async function measureDecisionNoise(content: string): Promise<{
  noiseStats: { mean: number; stdDev: number; variance: number };
}> {
  const model = getModel();

  // Spawn 3 parallel judges (Kahneman's noise measurement methodology)
  const judgePromises = Array.from({ length: 3 }, (_, i) => {
    const seed = Math.floor(Math.random() * 10000);
    const prompt = `${NOISE_JUDGE_PROMPT}

Random Seed: ${seed} (use this to vary your perspective — Judge #${i + 1})

<decision_text>
${content}
</decision_text>`;

    return withRetry(
      async () => {
        const response = await model.generateContent(prompt);
        return response.response.text();
      },
      1,
      1000
    );
  });

  const results = await Promise.allSettled(judgePromises);
  const scores: number[] = [];

  for (const r of results) {
    if (r.status === 'fulfilled') {
      const parsed = parseJSON(r.value) as { score: number } | null;
      if (parsed && typeof parsed.score === 'number') {
        scores.push(Math.max(0, Math.min(100, parsed.score)));
      }
    }
  }

  if (scores.length === 0) {
    return { noiseStats: { mean: 50, stdDev: 25, variance: 625 } };
  }

  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  return {
    noiseStats: {
      mean: Math.round(mean * 100) / 100,
      stdDev: Math.round(stdDev * 100) / 100,
      variance: Math.round(variance * 100) / 100,
    },
  };
}

async function analyzeSentiment(
  content: string
): Promise<{ score: number; label: 'Positive' | 'Negative' | 'Neutral' }> {
  const model = getModel();

  const prompt = `Analyze the emotional temperature of this enterprise decision communication.
Score from -1 (very negative/hostile) to +1 (very positive/enthusiastic).
Label as Positive, Negative, or Neutral.

Consider: pressure, urgency, defensiveness, enthusiasm, fear, confidence.

<text>
${content}
</text>

Return JSON only: { "score": 0.0, "label": "Neutral" }`;

  const result = await withRetry(
    async () => {
      const response = await model.generateContent(prompt);
      return response.response.text();
    },
    1,
    1000
  );

  const parsed = parseJSON(result) as { score: number; label: string } | null;

  if (!parsed || typeof parsed.score !== 'number') {
    return { score: 0, label: 'Neutral' };
  }

  const score = Math.max(-1, Math.min(1, parsed.score));
  const label = score > 0.2 ? 'Positive' : score < -0.2 ? 'Negative' : 'Neutral';

  return { score, label };
}

// ─── Compliance + Pre-Mortem Analysis ────────────────────────────────────────

interface CompliancePreMortemResult {
  complianceResult: ComplianceResult;
  preMortem: {
    failureScenarios: string[];
    preventiveMeasures: string[];
  };
}

async function analyzeComplianceAndPreMortem(
  content: string,
  input: HumanDecisionInput
): Promise<CompliancePreMortemResult | null> {
  const model = getModel();

  const prompt = `${VERIFICATION_SUPER_PROMPT}

CONTEXT: This is a HUMAN DECISION from ${input.source}${input.channel ? ` (${input.channel})` : ''}.
Decision type: ${input.decisionType || 'general'}.

Additionally, perform a Pre-Mortem analysis:
Imagine this decision has FAILED 6 months from now. Identify:
- Top 3 failure scenarios specific to this decision
- Preventive measures for each scenario

<decision_text>
${content}
</decision_text>

Return JSON:
{
  "compliance": {
    "overallStatus": "compliant" | "non_compliant" | "needs_review",
    "findings": [{ "regulation": "...", "status": "compliant" | "violation" | "warning", "severity": "low" | "medium" | "high" | "critical", "detail": "...", "recommendation": "..." }],
    "riskScore": 0-100
  },
  "preMortem": {
    "failureScenarios": ["scenario 1", "scenario 2", "scenario 3"],
    "preventiveMeasures": ["measure 1", "measure 2", "measure 3"]
  }
}`;

  const result = await withRetry(
    async () => {
      const response = await model.generateContent(prompt);
      return response.response.text();
    },
    2,
    1000
  );

  const parsed = parseJSON(result) as {
    compliance?: {
      overallStatus?: string;
      findings?: Array<{
        regulation: string;
        status: string;
        severity: string;
        detail: string;
        recommendation: string;
      }>;
      riskScore?: number;
    };
    preMortem?: {
      failureScenarios?: string[];
      preventiveMeasures?: string[];
    };
  } | null;

  if (!parsed) {
    log.warn('Failed to parse compliance/pre-mortem result');
    return null;
  }

  // Map to existing ComplianceResult interface
  const statusMap: Record<string, 'PASS' | 'WARN' | 'FAIL'> = {
    compliant: 'PASS',
    non_compliant: 'FAIL',
    needs_review: 'WARN',
  };
  const findingStatusMap: Record<string, 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL'> = {
    compliant: 'COMPLIANT',
    violation: 'NON_COMPLIANT',
    warning: 'PARTIAL',
  };

  const complianceResult: ComplianceResult = {
    status: statusMap[parsed.compliance?.overallStatus ?? ''] ?? 'WARN',
    riskScore: Math.max(0, Math.min(100, parsed.compliance?.riskScore ?? 50)),
    summary:
      (parsed.compliance?.findings ?? [])
        .map(f => f.detail)
        .filter(Boolean)
        .join('; ') || 'No compliance issues detected.',
    regulations: (parsed.compliance?.findings ?? []).map(f => ({
      name: f.regulation || 'Unknown',
      status: findingStatusMap[f.status] ?? 'PARTIAL',
      description: f.detail || '',
      riskLevel: (['low', 'medium', 'high', 'critical'].includes(f.severity)
        ? f.severity
        : 'medium') as 'low' | 'medium' | 'high' | 'critical',
    })),
    searchQueries: [],
  };

  const preMortem = {
    failureScenarios: Array.isArray(parsed.preMortem?.failureScenarios)
      ? parsed.preMortem!.failureScenarios
      : [],
    preventiveMeasures: Array.isArray(parsed.preMortem?.preventiveMeasures)
      ? parsed.preMortem!.preventiveMeasures
      : [],
  };

  return { complianceResult, preMortem };
}

// ─── Decision Twin Simulation ────────────────────────────────────────────────

interface DecisionTwinResult {
  logicalAnalysis: LogicalAnalysisResult;
}

async function simulateDecisionTwin(
  content: string,
  input: HumanDecisionInput,
  userId?: string
): Promise<DecisionTwinResult | null> {
  const model = getModel();

  // Fetch institutional memory via RAG if user ID is available
  let similarCasesContext = 'No similar past cases available.';
  if (userId) {
    try {
      const similarDocs = await searchSimilarDocuments(content, userId, 3);
      if (similarDocs.length > 0) {
        similarCasesContext = similarDocs
          .map(
            (doc, i) =>
              `Past Case ${i + 1} (similarity: ${(doc.similarity * 100).toFixed(0)}%):\n${doc.content.slice(0, 2000)}`
          )
          .join('\n\n');
        log.info(`Institutional memory: found ${similarDocs.length} similar past decisions`);
      }
    } catch (e) {
      log.warn(
        'RAG search failed, proceeding without institutional memory:',
        e instanceof Error ? e.message : String(e)
      );
    }
  }

  const prompt = `${SIMULATION_SUPER_PROMPT}

CONTEXT: This is a HUMAN DECISION from ${input.source}.
Decision type: ${input.decisionType || 'strategic'}.
${input.participants?.length ? `Participants: ${input.participants.length} people` : ''}

<decision_text>
${content}
</decision_text>

<similar_past_cases>
${similarCasesContext}
</similar_past_cases>`;

  const result = await withRetry(
    async () => {
      const response = await model.generateContent(prompt);
      return response.response.text();
    },
    2,
    1000
  );

  const parsed = parseJSON(result) as {
    simulation?: {
      overallVerdict?: string;
      twins?: Array<{
        name: string;
        role: string;
        vote: string;
        confidence: number;
        rationale: string;
        keyRiskIdentified: string;
      }>;
    };
    institutionalMemory?: {
      recallScore?: number;
      similarEvents?: Array<{
        documentId?: string;
        title: string;
        summary: string;
        outcome: string;
        similarity: number;
        lessonLearned: string;
      }>;
      strategicAdvice?: string;
    };
  } | null;

  if (!parsed?.simulation) {
    log.warn('Failed to parse decision twin simulation');
    return null;
  }

  const logicalAnalysis: LogicalAnalysisResult = {
    score: parsed.simulation.twins
      ? Math.round(
          parsed.simulation.twins.reduce((sum, t) => sum + (t.confidence || 50), 0) /
            parsed.simulation.twins.length
        )
      : 50,
    fallacies: [],
    assumptions: parsed.simulation.twins?.map(t => t.keyRiskIdentified).filter(Boolean) ?? [],
    conclusion:
      parsed.institutionalMemory?.strategicAdvice ??
      `Boardroom verdict: ${parsed.simulation.overallVerdict ?? 'MIXED'}`,
    verdict: (parsed.simulation.overallVerdict as LogicalAnalysisResult['verdict']) ?? 'MIXED',
    twins: parsed.simulation.twins?.map(t => ({
      name: t.name,
      role: t.role,
      vote: t.vote as 'APPROVE' | 'REJECT' | 'REVISE',
      confidence: t.confidence,
      rationale: t.rationale,
      keyRiskIdentified: t.keyRiskIdentified,
    })),
    institutionalMemory: parsed.institutionalMemory
      ? {
          recallScore: parsed.institutionalMemory.recallScore ?? 0,
          similarEvents: parsed.institutionalMemory.similarEvents ?? [],
          strategicAdvice: parsed.institutionalMemory.strategicAdvice ?? '',
        }
      : undefined,
  };

  return { logicalAnalysis };
}

// ─── Summary Generation ──────────────────────────────────────────────────────

function buildAuditSummary(
  biases: BiasDetectionResult[],
  qualityScore: number,
  noiseScore: number,
  consensusFlag: boolean,
  input: HumanDecisionInput
): string {
  const parts: string[] = [];

  const sourceLabel =
    {
      slack: 'Slack conversation',
      meeting_transcript: 'meeting transcript',
      email: 'email thread',
      jira: 'ticket decision',
      manual: 'manually submitted decision',
    }[input.source] || 'decision';

  parts.push(
    `Cognitive audit of ${sourceLabel}${input.channel ? ` in ${input.channel}` : ''}: Decision Quality Score ${qualityScore}/100.`
  );

  if (biases.length > 0) {
    const critical = biases.filter(b => b.severity === 'critical' || b.severity === 'high');
    if (critical.length > 0) {
      parts.push(
        `${critical.length} high-severity bias${critical.length > 1 ? 'es' : ''} detected: ${critical.map(b => b.biasType).join(', ')}.`
      );
    } else {
      parts.push(
        `${biases.length} cognitive bias${biases.length > 1 ? 'es' : ''} detected (moderate severity).`
      );
    }
  }

  if (consensusFlag) {
    parts.push(
      "Unanimous agreement detected — consider assigning a Devil's Advocate to challenge assumptions."
    );
  }

  if (noiseScore < 40) {
    parts.push(
      `Decision consistency is low (${noiseScore}/100) — similar decisions may receive inconsistent treatment.`
    );
  }

  return parts.join(' ');
}
