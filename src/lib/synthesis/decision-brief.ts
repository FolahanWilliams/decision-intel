/**
 * Decision Brief Synthesis Engine
 *
 * Aggregates all analyses for a deal's documents and generates a comprehensive
 * decision brief via Gemini streaming. Results are validated with Zod and
 * persisted to DecisionBriefRecord.
 */

import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { getRequiredEnvVar, getOptionalEnvVar } from '@/lib/env';
import { parseJSON } from '@/lib/utils/json';
import { Prisma } from '@prisma/client';
import { DecisionBriefSchema, type DecisionBrief } from '@/lib/schemas/decision-brief';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('DecisionBrief');

export interface BriefStreamEvent {
  type: 'metadata' | 'chunk' | 'done' | 'error';
  text?: string;
  brief?: DecisionBrief;
  metadata?: {
    dealName: string;
    documentCount: number;
    analysisCount: number;
  };
  error?: string;
}

// ---------------------------------------------------------------------------
// Gemini model for synthesis
// ---------------------------------------------------------------------------

function getSynthesisModel() {
  const apiKey = getRequiredEnvVar('GOOGLE_API_KEY');
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = getOptionalEnvVar('GEMINI_MODEL_NAME', 'gemini-3-flash-preview');

  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: 'application/json',
      maxOutputTokens: 16384,
    },
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ],
  });
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

const DECISION_BRIEF_PROMPT = `You are a senior decision analyst synthesizing multiple document analyses into a comprehensive Decision Brief.

Given the analyses below, produce a single JSON object with this structure:
{
  "executiveSummary": "2-3 paragraph executive summary synthesizing all documents",
  "keyFindings": [
    { "finding": "description", "severity": "critical|high|medium|low", "sources": ["filename1", "filename2"] }
  ],
  "biasLandscape": {
    "topBiases": [{ "type": "bias name", "frequency": <count across docs>, "avgSeverity": "high|medium|low" }],
    "crossDocPatterns": ["Pattern seen across multiple documents"]
  },
  "riskAssessment": {
    "overallRisk": "low|medium|high|critical",
    "topRisks": [{ "risk": "description", "likelihood": "high|medium|low", "impact": "high|medium|low" }]
  },
  "recommendation": {
    "action": "proceed|proceed_with_caution|delay|reject",
    "rationale": "Explain the recommendation based on evidence from all documents",
    "conditions": ["Condition that must be met before proceeding"]
  },
  "documentScorecard": [
    { "filename": "doc name", "score": 85, "topBiases": ["Anchoring", "Overconfidence"], "keyInsight": "brief insight" }
  ]
}

CRITICAL RULES:
- Base every finding on specific evidence from the analyses. Do not speculate.
- Cross-reference findings across documents — identify corroborating or contradicting signals.
- Weight recent analyses higher than older ones.
- The executive summary should be actionable, not just descriptive.
- Ensure documentScorecard includes ALL analyzed documents.
- Return ONLY valid JSON. No markdown, no code fences.`;

// ---------------------------------------------------------------------------
// Data assembly
// ---------------------------------------------------------------------------

interface AnalysisData {
  filename: string;
  overallScore: number;
  summary: string;
  biases: Array<{ biasType: string; severity: string; explanation: string }>;
  preMortem: unknown;
  compliance: unknown;
  factCheck: unknown;
  simulation: unknown;
  recognitionCues: unknown;
  narrativePreMortem: unknown;
  createdAt: Date;
}

async function assembleAnalysisData(dealId: string): Promise<{
  dealName: string;
  analyses: AnalysisData[];
}> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      name: true,
      documents: {
        select: {
          id: true,
          filename: true,
          content: true,
          contentEncrypted: true,
          contentIv: true,
          contentTag: true,
          analyses: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              overallScore: true,
              summary: true,
              preMortem: true,
              compliance: true,
              factCheck: true,
              simulation: true,
              recognitionCues: true,
              narrativePreMortem: true,
              createdAt: true,
              biases: {
                select: {
                  biasType: true,
                  severity: true,
                  explanation: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!deal) throw new Error('Deal not found');

  const analyses: AnalysisData[] = [];

  for (const doc of deal.documents) {
    const analysis = doc.analyses[0];
    if (!analysis) continue;

    analyses.push({
      filename: doc.filename,
      overallScore: analysis.overallScore,
      summary: analysis.summary,
      biases: analysis.biases.map(b => ({
        biasType: b.biasType,
        severity: b.severity,
        explanation: b.explanation,
      })),
      preMortem: analysis.preMortem,
      compliance: analysis.compliance,
      factCheck: analysis.factCheck,
      simulation: analysis.simulation,
      recognitionCues: analysis.recognitionCues,
      narrativePreMortem: analysis.narrativePreMortem,
      createdAt: analysis.createdAt,
    });
  }

  return { dealName: deal.name, analyses };
}

function buildAnalysisContext(analyses: AnalysisData[]): string {
  return analyses
    .map((a, i) => {
      const biasStr = a.biases
        .slice(0, 5)
        .map(b => `${b.biasType} (${b.severity}): ${b.explanation.slice(0, 150)}`)
        .join('\n    ');

      const preMortems =
        a.preMortem && typeof a.preMortem === 'object'
          ? JSON.stringify(a.preMortem).slice(0, 500)
          : 'N/A';

      const complianceSummary =
        a.compliance && typeof a.compliance === 'object'
          ? JSON.stringify(a.compliance).slice(0, 300)
          : 'N/A';

      return `
--- DOCUMENT ${i + 1}: ${a.filename} ---
Score: ${a.overallScore}/100
Summary: ${a.summary.slice(0, 800)}
Biases (${a.biases.length} detected):
    ${biasStr || 'None detected'}
Pre-Mortem: ${preMortems}
Compliance: ${complianceSummary}
Analyzed: ${a.createdAt.toISOString().split('T')[0]}`;
    })
    .join('\n');
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function* generateDecisionBrief(
  dealId: string,
  userId: string,
  orgId: string
): AsyncGenerator<BriefStreamEvent> {
  try {
    // Step 1: Assemble data
    const { dealName, analyses } = await assembleAnalysisData(dealId);

    if (analyses.length === 0) {
      yield {
        type: 'error',
        error: 'No analyzed documents found for this deal. Analyze documents first.',
      };
      return;
    }

    yield {
      type: 'metadata',
      metadata: {
        dealName,
        documentCount: analyses.length,
        analysisCount: analyses.length,
      },
    };

    // Step 2: Build context and call Gemini
    const analysisContext = buildAnalysisContext(analyses);
    const model = getSynthesisModel();

    const result = await model.generateContentStream([
      DECISION_BRIEF_PROMPT,
      `Deal: ${dealName}\nNumber of documents: ${analyses.length}\n\nANALYSIS DATA:\n${analysisContext}`,
    ]);

    // Step 3: Stream chunks
    let accumulated = '';
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        accumulated += text;
        yield { type: 'chunk', text };
      }
    }

    // Step 4: Validate with Zod
    const parsed = parseJSON(accumulated);
    if (!parsed) {
      yield { type: 'error', error: 'Failed to parse brief output as JSON' };
      return;
    }

    const validated = DecisionBriefSchema.safeParse(parsed);
    if (!validated.success) {
      log.warn('Brief validation warnings:', validated.error.issues);
      // Use partial data with defaults
      const fallback = DecisionBriefSchema.parse(parsed);
      yield { type: 'done', brief: fallback };

      // Persist
      await persistBrief(dealId, userId, orgId, fallback);
      return;
    }

    yield { type: 'done', brief: validated.data };

    // Step 5: Persist to database
    await persistBrief(dealId, userId, orgId, validated.data);
  } catch (error) {
    log.error('Decision brief generation failed:', error);
    yield {
      type: 'error',
      error: error instanceof Error ? error.message : 'Brief generation failed',
    };
  }
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

async function persistBrief(
  dealId: string,
  userId: string,
  orgId: string,
  brief: DecisionBrief
): Promise<void> {
  try {
    // Get next version number
    const latest = await prisma.decisionBriefRecord.findFirst({
      where: { dealId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const nextVersion = (latest?.version ?? 0) + 1;

    await prisma.decisionBriefRecord.create({
      data: {
        dealId,
        userId,
        orgId,
        brief: JSON.parse(JSON.stringify(brief)) as Prisma.InputJsonValue,
        version: nextVersion,
      },
    });

    log.info(`Persisted decision brief v${nextVersion} for deal ${dealId}`);
  } catch (error) {
    log.error('Failed to persist decision brief:', error);
    // Non-critical — brief was already streamed to client
  }
}

// ---------------------------------------------------------------------------
// Load existing brief
// ---------------------------------------------------------------------------

export async function getLatestBrief(
  dealId: string
): Promise<{ brief: DecisionBrief; version: number; createdAt: Date } | null> {
  try {
    const record = await prisma.decisionBriefRecord.findFirst({
      where: { dealId },
      orderBy: { version: 'desc' },
      select: { brief: true, version: true, createdAt: true },
    });

    if (!record) return null;

    const validated = DecisionBriefSchema.safeParse(record.brief);
    if (!validated.success) {
      log.warn('Stored brief failed validation:', validated.error.issues);
      return null;
    }

    return {
      brief: validated.data,
      version: record.version,
      createdAt: record.createdAt,
    };
  } catch (error) {
    log.error('Failed to load latest brief:', error);
    return null;
  }
}
