/**
 * Autonomous Outcome Detection Engine
 *
 * Detects decision outcomes from 3 channels:
 *   1. New documents (semantic matching via RAG embeddings)
 *   2. Slack messages (outcome language patterns)
 *   3. Web intelligence (news search for public outcomes)
 *
 * All detections create DraftOutcomes requiring human confirmation —
 * never auto-submits to the calibration engine. This preserves data
 * quality while reducing the friction that breaks the feedback loop.
 */

import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { searchSimilarDocuments } from '@/lib/rag/embeddings';
const log = createLogger('OutcomeInference');

// ─── Types ──────────────────────────────────────────────────────────────────

export interface OutcomeInferenceResult {
  outcomeDetected: boolean;
  outcome: 'success' | 'partial_success' | 'failure' | 'inconclusive';
  confidence: number; // 0-1
  evidence: string[]; // quotes or article titles supporting inference
  matchedCriteria: string[]; // which success/failure criteria were matched
  source: 'document' | 'slack' | 'web_intelligence';
  sourceRef: string; // document ID, slack message ts, or article URL
}

export interface DraftOutcomeData {
  analysisId: string;
  inference: OutcomeInferenceResult;
  status: 'pending_review' | 'confirmed' | 'dismissed';
}

// ─── LLM Setup ──────────────────────────────────────────────────────────────

function getModel() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_API_KEY not set');
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = process.env.GEMINI_MODEL_NAME || 'gemini-2.0-flash';
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: 'application/json',
      maxOutputTokens: 4096,
    },
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ],
  });
}

// ─── Shared Prompt Builder ──────────────────────────────────────────────────

function buildOutcomeInferencePrompt(
  decisionStatement: string,
  successCriteria: string[],
  failureCriteria: string[],
  evidence: string,
  source: 'document' | 'slack' | 'web_intelligence',
): string {
  return `You are an outcome detection specialist. Analyze the provided evidence to determine whether a prior decision's outcome has become apparent.

PRIOR DECISION:
"${decisionStatement}"

SUCCESS CRITERIA:
${successCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

FAILURE CRITERIA:
${failureCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

EVIDENCE SOURCE: ${source.replace(/_/g, ' ')}

EVIDENCE:
${evidence}

INSTRUCTIONS:
1. Compare the evidence against the success and failure criteria
2. Determine if the evidence reveals the decision's outcome
3. Extract specific quotes or facts that support your assessment
4. Be conservative — only flag an outcome if the evidence is clear

Respond with this JSON structure:
{
  "outcomeDetected": boolean,
  "outcome": "success" | "partial_success" | "failure" | "inconclusive",
  "confidence": number (0-1, be conservative; >0.7 for documents, >0.6 for slack, >0.8 for web),
  "evidence": ["quote or fact 1", "quote or fact 2"],
  "matchedCriteria": ["criterion text that was matched"],
  "reasoning": "brief explanation of your assessment"
}`;
}

// ─── Channel 1: Document-Based Outcome Detection ────────────────────────────

/**
 * After a new document is analyzed, check if it contains outcome information
 * for any prior decisions in the same org.
 *
 * Uses RAG embeddings to find semantically similar prior analyses, then
 * checks the new document against their success/failure criteria.
 */
export async function detectOutcomeFromDocument(
  newDocumentId: string,
  newDocContent: string,
  userId: string,
  orgId: string | null,
): Promise<OutcomeInferenceResult[]> {
  const results: OutcomeInferenceResult[] = [];

  try {
    // Find similar prior documents via RAG
    const similar = await searchSimilarDocuments(
      newDocContent.slice(0, 2000), // Limit query length
      userId,
      10,
      newDocumentId, // Exclude self
    );

    if (similar.length === 0) return results;

    // Get analyses with pending outcomes for these documents
    const documentIds = similar.map(s => s.documentId);
    const pendingAnalyses = await prisma.analysis.findMany({
      where: {
        documentId: { in: documentIds },
        outcomeStatus: 'pending_outcome',
        outcome: null, // No outcome yet
      },
      select: {
        id: true,
        documentId: true,
        summary: true,
        document: {
          select: {
            filename: true,
            orgId: true,
            decisionFrame: {
              select: {
                decisionStatement: true,
                successCriteria: true,
                failureCriteria: true,
              },
            },
          },
        },
      },
    });

    // Filter to same org
    const orgFiltered = pendingAnalyses.filter(a =>
      orgId ? a.document.orgId === orgId : true,
    );

    if (orgFiltered.length === 0) return results;

    // For each pending analysis with a decision frame, run inference
    const model = getModel();

    for (const analysis of orgFiltered) {
      const frame = analysis.document.decisionFrame;
      if (!frame || frame.successCriteria.length === 0) continue;

      // Check similarity threshold — need strong semantic match
      const similarity = similar.find(s => s.documentId === analysis.documentId)?.similarity ?? 0;
      if (similarity < 0.70) continue;

      try {
        const prompt = buildOutcomeInferencePrompt(
          frame.decisionStatement,
          frame.successCriteria,
          frame.failureCriteria,
          newDocContent.slice(0, 4000),
          'document',
        );

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = JSON.parse(text);

        if (parsed.outcomeDetected && parsed.confidence >= 0.7) {
          const inference: OutcomeInferenceResult = {
            outcomeDetected: true,
            outcome: parsed.outcome,
            confidence: parsed.confidence,
            evidence: parsed.evidence || [],
            matchedCriteria: parsed.matchedCriteria || [],
            source: 'document',
            sourceRef: newDocumentId,
          };

          results.push(inference);

          // Save draft outcome
          await saveDraftOutcome(analysis.id, inference);

          log.info(
            `Document outcome detected for analysis ${analysis.id}: ${parsed.outcome} (confidence: ${parsed.confidence})`,
          );
        }
      } catch (err) {
        log.warn(`Failed to infer outcome for analysis ${analysis.id}:`, err);
      }
    }
  } catch (err) {
    log.error('Document outcome detection failed:', err);
  }

  return results;
}

// ─── Channel 2: Slack Outcome Detection ─────────────────────────────────────

/** Outcome language patterns — success signals */
const SUCCESS_SIGNALS = [
  /\b(worked\s+out|great\s+results?|exceeded?\s+expectations?|on\s+track|delivered|shipped)\b/i,
  /\b(successful|nailed\s+it|big\s+win|above\s+target|hit\s+our\s+goal|strong\s+performance)\b/i,
  /\b(revenue\s+up|profit\s+(increased?|grew)|roi\s+positive|ahead\s+of\s+schedule)\b/i,
];

/** Outcome language patterns — failure signals */
const FAILURE_SIGNALS = [
  /\b(didn'?t\s+work|failed|lost\s+money|missed\s+target|pulled\s+the\s+plug)\b/i,
  /\b(shut\s+down|write[\s-]?off|underperformed?|below\s+expectations?|behind\s+schedule)\b/i,
  /\b(cancelled|abandoned|scrapped|post[\s-]?mortem|lessons?\s+learned)\b/i,
];

/** Outcome language patterns — mixed signals */
const MIXED_SIGNALS = [
  /\b(partially\s+worked|mixed\s+results?|some\s+wins?\s+some\s+loss)/i,
  /\b(hit\s+and\s+miss|room\s+for\s+improvement|not\s+what\s+we\s+expected)\b/i,
];

/**
 * Determine if a Slack message contains outcome language.
 */
export function isOutcomeMessage(text: string): boolean {
  if (!text || text.length < 15) return false;
  return (
    SUCCESS_SIGNALS.some(p => p.test(text)) ||
    FAILURE_SIGNALS.some(p => p.test(text)) ||
    MIXED_SIGNALS.some(p => p.test(text))
  );
}

/**
 * Quick-classify outcome direction from Slack text without LLM.
 */
function classifyOutcomeDirection(text: string): 'success' | 'failure' | 'partial_success' | 'inconclusive' {
  const hasSuccess = SUCCESS_SIGNALS.some(p => p.test(text));
  const hasFailure = FAILURE_SIGNALS.some(p => p.test(text));
  const hasMixed = MIXED_SIGNALS.some(p => p.test(text));

  if (hasMixed) return 'partial_success';
  if (hasSuccess && !hasFailure) return 'success';
  if (hasFailure && !hasSuccess) return 'failure';
  return 'inconclusive';
}

/**
 * Detect outcome from a Slack message in a channel/thread where
 * a prior decision was captured.
 */
export async function detectOutcomeFromSlack(
  messageText: string,
  channel: string,
  threadTs: string | undefined,
  _teamId: string,
): Promise<OutcomeInferenceResult[]> {
  const results: OutcomeInferenceResult[] = [];

  if (!isOutcomeMessage(messageText)) return results;

  try {
    // Find prior decisions captured from this Slack channel via HumanDecision
    const priorHumanDecisions = await prisma.humanDecision.findMany({
      where: {
        channel,
        source: 'slack',
        linkedAnalysisId: { not: null },
      },
      select: {
        id: true,
        linkedAnalysisId: true,
      },
      take: 10,
    });

    // Get linked analyses that are pending outcome
    const linkedAnalysisIds = priorHumanDecisions
      .map(d => d.linkedAnalysisId)
      .filter((id): id is string => id !== null);

    const pendingAnalyses = linkedAnalysisIds.length > 0
      ? await prisma.analysis.findMany({
          where: {
            id: { in: linkedAnalysisIds },
            outcomeStatus: 'pending_outcome',
            outcome: null,
          },
          select: {
            id: true,
            summary: true,
            document: {
              select: {
                decisionFrame: {
                  select: {
                    decisionStatement: true,
                    successCriteria: true,
                    failureCriteria: true,
                  },
                },
              },
            },
          },
          take: 5,
        })
      : [];

    if (pendingAnalyses.length === 0) return results;

    const sourceRef = threadTs ? `slack:${channel}:${threadTs}` : `slack:${channel}`;

    for (const analysis of pendingAnalyses) {
        const frame = analysis.document.decisionFrame;

        if (frame && frame.successCriteria.length > 0) {
          // Use LLM for high-quality inference
          try {
            const model = getModel();
            const prompt = buildOutcomeInferencePrompt(
              frame.decisionStatement,
              frame.successCriteria,
              frame.failureCriteria,
              messageText,
              'slack',
            );

            const result = await model.generateContent(prompt);
            const text = result.response.text();
            const parsed = JSON.parse(text);

            if (parsed.outcomeDetected && parsed.confidence >= 0.6) {
              const inference: OutcomeInferenceResult = {
                outcomeDetected: true,
                outcome: parsed.outcome,
                confidence: parsed.confidence,
                evidence: parsed.evidence || [],
                matchedCriteria: parsed.matchedCriteria || [],
                source: 'slack',
                sourceRef,
              };

              results.push(inference);
              await saveDraftOutcome(analysis.id, inference);

              log.info(
                `Slack outcome detected for analysis ${analysis.id}: ${parsed.outcome} (confidence: ${parsed.confidence})`,
              );
            }
          } catch (err) {
            log.warn(`Failed LLM inference for Slack outcome, falling back to pattern match`, err);

            // Fallback: pattern-based classification (lower confidence)
            const direction = classifyOutcomeDirection(messageText);
            if (direction !== 'inconclusive') {
              const inference: OutcomeInferenceResult = {
                outcomeDetected: true,
                outcome: direction,
                confidence: 0.5, // Lower confidence for pattern-only
                evidence: [messageText.slice(0, 200)],
                matchedCriteria: [],
                source: 'slack',
                sourceRef,
              };

              results.push(inference);
              await saveDraftOutcome(analysis.id, inference);
            }
          }
        } else {
          // No decision frame — use pattern matching only
          const direction = classifyOutcomeDirection(messageText);
          if (direction !== 'inconclusive') {
            const inference: OutcomeInferenceResult = {
              outcomeDetected: true,
              outcome: direction,
              confidence: 0.45,
              evidence: [messageText.slice(0, 200)],
              matchedCriteria: [],
              source: 'slack',
              sourceRef,
            };

            results.push(inference);
            await saveDraftOutcome(analysis.id, inference);
          }
        }
    }
  } catch (err) {
    log.error('Slack outcome detection failed:', err);
  }

  return results;
}

// ─── Channel 3: Web Intelligence Outcome Detection ──────────────────────────

/**
 * Search for public outcome signals for decisions involving named entities.
 *
 * Called by the cron job. Rate-limited to maxSearches per run.
 */
export async function detectOutcomesFromWeb(
  maxSearches: number = 10,
): Promise<OutcomeInferenceResult[]> {
  const results: OutcomeInferenceResult[] = [];

  try {
    // Find overdue or near-due analyses with decision frames
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

    const pendingAnalyses = await prisma.analysis.findMany({
      where: {
        outcomeStatus: 'pending_outcome',
        outcome: null,
        outcomeDueAt: { lte: twoWeeksFromNow },
        document: {
          decisionFrame: { isNot: null },
        },
      },
      select: {
        id: true,
        summary: true,
        document: {
          select: {
            orgId: true,
            decisionFrame: {
              select: {
                decisionStatement: true,
                successCriteria: true,
                failureCriteria: true,
                monetaryValue: true,
              },
            },
          },
        },
      },
      orderBy: [
        { outcomeDueAt: 'asc' }, // Most overdue first
      ],
      take: maxSearches * 2, // Fetch more than needed, filter below
    });

    // Prioritize: highest monetary value and most overdue
    const candidates = pendingAnalyses
      .filter(a => a.document.decisionFrame)
      .slice(0, maxSearches);

    if (candidates.length === 0) return results;

    for (const analysis of candidates) {
      const frame = analysis.document.decisionFrame!;

      // Extract search query from decision statement
      const searchQuery = buildWebSearchQuery(frame.decisionStatement);
      if (!searchQuery) continue;

      try {
        // Use Gemini with Google Search grounding for web results
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) break;

        const genAI = new GoogleGenerativeAI(apiKey);
        const groundedModel = genAI.getGenerativeModel({
          model: process.env.GEMINI_MODEL_NAME || 'gemini-2.0-flash',
          tools: [{ googleSearch: {} } as import('@google/generative-ai').Tool],
          generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: 4096,
          },
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          ],
        });

        const prompt = `Search the web for recent news about: "${searchQuery}"

Then analyze whether this news reveals the outcome of the following decision:

DECISION: "${frame.decisionStatement}"

SUCCESS CRITERIA:
${frame.successCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

FAILURE CRITERIA:
${frame.failureCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Respond with JSON:
{
  "outcomeDetected": boolean,
  "outcome": "success" | "partial_success" | "failure" | "inconclusive",
  "confidence": number (0-1, require >0.8 for web-sourced conclusions),
  "evidence": ["article title or key fact 1", "article title or key fact 2"],
  "matchedCriteria": ["criterion that was matched"],
  "reasoning": "brief explanation",
  "sourceUrls": ["url1", "url2"]
}`;

        const result = await groundedModel.generateContent(prompt);
        const text = result.response.text();
        const parsed = JSON.parse(text);

        if (parsed.outcomeDetected && parsed.confidence >= 0.8) {
          const inference: OutcomeInferenceResult = {
            outcomeDetected: true,
            outcome: parsed.outcome,
            confidence: parsed.confidence,
            evidence: parsed.evidence || [],
            matchedCriteria: parsed.matchedCriteria || [],
            source: 'web_intelligence',
            sourceRef: (parsed.sourceUrls?.[0] as string) || searchQuery,
          };

          results.push(inference);
          await saveDraftOutcome(analysis.id, inference);

          log.info(
            `Web outcome detected for analysis ${analysis.id}: ${parsed.outcome} (confidence: ${parsed.confidence})`,
          );
        }
      } catch (err) {
        log.warn(`Web search failed for analysis ${analysis.id}:`, err);
      }
    }
  } catch (err) {
    log.error('Web outcome detection failed:', err);
  }

  return results;
}

/**
 * Extract a web-searchable query from a decision statement.
 * Returns null if the statement doesn't contain searchable entities.
 */
function buildWebSearchQuery(decisionStatement: string): string | null {
  // Look for proper nouns, company names, product names
  const words = decisionStatement.split(/\s+/);
  const properNouns = words.filter(w =>
    /^[A-Z][a-z]+/.test(w) && !['The', 'This', 'That', 'When', 'Where', 'What', 'How', 'Why', 'Our', 'Their', 'We', 'Should', 'Whether', 'If'].includes(w)
  );

  if (properNouns.length === 0) return null;

  // Build a query from the decision statement, focusing on entities
  const query = decisionStatement
    .replace(/^(should we |whether to |decision to )/i, '')
    .slice(0, 150);

  return `${query} outcome results`;
}

// ─── Draft Outcome Persistence ──────────────────────────────────────────────

/**
 * Save a draft outcome for user review.
 * Uses schema-drift protection in case DraftOutcome table doesn't exist yet.
 */
export async function saveDraftOutcome(
  analysisId: string,
  inference: OutcomeInferenceResult,
): Promise<void> {
  try {
    // Check for existing draft for this analysis + source combo
    const existing = await prisma.draftOutcome.findFirst({
      where: {
        analysisId,
        source: inference.source,
        status: 'pending_review',
      },
    });

    if (existing) {
      // Update if new inference has higher confidence
      if (inference.confidence > (existing.confidence ?? 0)) {
        await prisma.draftOutcome.update({
          where: { id: existing.id },
          data: {
            outcome: inference.outcome,
            confidence: inference.confidence,
            evidence: inference.evidence,
            matchedCriteria: inference.matchedCriteria,
            sourceRef: inference.sourceRef,
          },
        });
        log.info(`Updated draft outcome ${existing.id} with higher confidence`);
      }
      return;
    }

    await prisma.draftOutcome.create({
      data: {
        analysisId,
        outcome: inference.outcome,
        confidence: inference.confidence,
        evidence: inference.evidence,
        matchedCriteria: inference.matchedCriteria,
        source: inference.source,
        sourceRef: inference.sourceRef,
        status: 'pending_review',
      },
    });

    log.info(`Created draft outcome for analysis ${analysisId} (source: ${inference.source})`);
  } catch (err) {
    // Schema drift protection — DraftOutcome table may not exist yet
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.includes('P2021') || errMsg.includes('P2022') || errMsg.includes('does not exist')) {
      log.warn('DraftOutcome table not yet migrated, skipping save');
    } else {
      throw err;
    }
  }
}

/**
 * Confirm a draft outcome — creates a real DecisionOutcome and triggers recalibration.
 */
export async function confirmDraftOutcome(
  draftId: string,
  userId: string,
): Promise<{ success: boolean; outcomeId?: string }> {
  try {
    const draft = await prisma.draftOutcome.findUnique({
      where: { id: draftId },
      include: {
        analysis: {
          select: {
            id: true,
            document: { select: { orgId: true } },
          },
        },
      },
    });

    if (!draft) return { success: false };
    if (draft.status !== 'pending_review') return { success: false };

    // Create real DecisionOutcome
    const outcome = await prisma.decisionOutcome.create({
      data: {
        analysisId: draft.analysisId,
        userId,
        orgId: draft.analysis.document.orgId,
        outcome: draft.outcome,
        notes: `Auto-detected via ${draft.source.replace(/_/g, ' ')}. Evidence: ${draft.evidence.join('; ')}`,
        confirmedBiases: [],
        falsPositiveBiases: [],
      },
    });

    // Mark analysis as outcome logged
    await prisma.analysis.update({
      where: { id: draft.analysisId },
      data: { outcomeStatus: 'outcome_logged' },
    });

    // Mark draft as confirmed
    await prisma.draftOutcome.update({
      where: { id: draftId },
      data: {
        status: 'confirmed',
        reviewedAt: new Date(),
      },
    });

    // Trigger recalibration (fire-and-forget)
    try {
      const { runFullRecalibration } = await import('@/lib/learning/feedback-loop');
      const orgId = draft.analysis.document.orgId;
      if (orgId) {
        runFullRecalibration(orgId).catch(err =>
          log.warn('Recalibration after outcome confirmation failed:', err),
        );
      }
    } catch {
      log.warn('Recalibration module not available');
    }

    log.info(`Draft outcome ${draftId} confirmed, created outcome ${outcome.id}`);
    return { success: true, outcomeId: outcome.id };
  } catch (err) {
    log.error('Failed to confirm draft outcome:', err);
    return { success: false };
  }
}

/**
 * Dismiss a draft outcome.
 */
export async function dismissDraftOutcome(draftId: string): Promise<boolean> {
  try {
    await prisma.draftOutcome.update({
      where: { id: draftId },
      data: {
        status: 'dismissed',
        reviewedAt: new Date(),
      },
    });
    log.info(`Draft outcome ${draftId} dismissed`);
    return true;
  } catch (err) {
    log.error('Failed to dismiss draft outcome:', err);
    return false;
  }
}

/**
 * Get pending draft outcomes for a user/org.
 */
export async function getPendingDraftOutcomes(
  userId: string,
  orgId?: string | null,
): Promise<Array<{
  id: string;
  analysisId: string;
  outcome: string;
  confidence: number;
  evidence: string[];
  source: string;
  sourceRef: string;
  createdAt: Date;
  analysisTitle: string;
  decisionStatement: string | null;
}>> {
  try {
    const drafts = await prisma.draftOutcome.findMany({
      where: {
        status: 'pending_review',
        analysis: {
          document: {
            ...(orgId ? { orgId } : { userId }),
          },
        },
      },
      include: {
        analysis: {
          select: {
            id: true,
            summary: true,
            document: {
              select: {
                filename: true,
                decisionFrame: {
                  select: { decisionStatement: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return drafts.map(d => ({
      id: d.id,
      analysisId: d.analysisId,
      outcome: d.outcome,
      confidence: d.confidence,
      evidence: d.evidence,
      source: d.source,
      sourceRef: d.sourceRef,
      createdAt: d.createdAt,
      analysisTitle: d.analysis.document.filename,
      decisionStatement: d.analysis.document.decisionFrame?.decisionStatement ?? null,
    }));
  } catch (err) {
    // Schema drift protection
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.includes('P2021') || errMsg.includes('P2022') || errMsg.includes('does not exist')) {
      return [];
    }
    throw err;
  }
}
