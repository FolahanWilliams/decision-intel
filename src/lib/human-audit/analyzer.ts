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

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createLogger } from '@/lib/utils/logger';
import { withRetry } from '@/lib/utils/resilience';
import { parseJSON } from '@/lib/utils/json';
import {
  BIAS_DETECTIVE_PROMPT,
  NOISE_JUDGE_PROMPT,
} from '@/lib/agents/prompts';
import type {
  HumanDecisionInput,
  CognitiveAuditResult,
} from '@/types/human-audit';
import type { BiasDetectionResult } from '@/types';

const log = createLogger('HumanAudit');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

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
  input: HumanDecisionInput
): Promise<CognitiveAuditResult> {
  log.info(`Analyzing human decision from ${input.source}${input.channel ? ` (${input.channel})` : ''}`);

  const content = input.content;

  // Run bias detection + noise jury + sentiment in parallel
  const [biasResult, noiseResult, sentimentResult] = await Promise.allSettled([
    detectHumanBiases(content, input),
    measureDecisionNoise(content),
    analyzeSentiment(content),
  ]);

  // Extract results with safe fallbacks
  const biasData = biasResult.status === 'fulfilled' ? biasResult.value : null;
  const noiseData = noiseResult.status === 'fulfilled' ? noiseResult.value : null;
  const sentimentData = sentimentResult.status === 'fulfilled' ? sentimentResult.value : null;

  if (biasResult.status === 'rejected') {
    log.error('Bias detection failed:', biasResult.reason);
  }
  if (noiseResult.status === 'rejected') {
    log.error('Noise measurement failed:', noiseResult.reason);
  }
  if (sentimentResult.status === 'rejected') {
    log.error('Sentiment analysis failed:', sentimentResult.reason);
  }

  // Calculate decision quality score
  const biasDeductions = (biasData?.biases ?? []).reduce((sum, b) => {
    const weight = { low: 2, medium: 5, high: 10, critical: 20 }[b.severity] ?? 5;
    return sum + weight;
  }, 0);

  const noisePenalty = noiseData?.noiseStats
    ? noiseData.noiseStats.stdDev * 5
    : 0;

  const decisionQualityScore = Math.max(
    0,
    Math.min(100, Math.round(100 - biasDeductions - noisePenalty))
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
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const contextPrefix = [
    `Decision Source: ${input.source}`,
    input.channel ? `Channel: ${input.channel}` : null,
    input.decisionType ? `Decision Type: ${input.decisionType}` : null,
    input.participants?.length
      ? `Participants: ${input.participants.length} people`
      : null,
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
    2, 1000
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

  const biases: BiasDetectionResult[] = parsed.biases.map((b) => ({
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
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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
      1, 1000
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
  const variance =
    scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
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
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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
    1, 1000
  );

  const parsed = parseJSON(result) as { score: number; label: string } | null;

  if (!parsed || typeof parsed.score !== 'number') {
    return { score: 0, label: 'Neutral' };
  }

  const score = Math.max(-1, Math.min(1, parsed.score));
  const label =
    score > 0.2 ? 'Positive' : score < -0.2 ? 'Negative' : 'Neutral';

  return { score, label };
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

  const sourceLabel = {
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
    const critical = biases.filter((b) => b.severity === 'critical' || b.severity === 'high');
    if (critical.length > 0) {
      parts.push(
        `${critical.length} high-severity bias${critical.length > 1 ? 'es' : ''} detected: ${critical.map((b) => b.biasType).join(', ')}.`
      );
    } else {
      parts.push(`${biases.length} cognitive bias${biases.length > 1 ? 'es' : ''} detected (moderate severity).`);
    }
  }

  if (consensusFlag) {
    parts.push(
      'Unanimous agreement detected — consider assigning a Devil\'s Advocate to challenge assumptions.'
    );
  }

  if (noiseScore < 40) {
    parts.push(
      `Decision consistency is low (${noiseScore}/100) — similar decisions may receive inconsistent treatment.`
    );
  }

  return parts.join(' ');
}
