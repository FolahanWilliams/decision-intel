import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { AnalysisResult, BiasDetectionResult } from '@/types';
import { safeJsonClone } from '@/lib/utils/json';
import { toPrismaJson } from '@/lib/utils/prisma-json';
type Document = NonNullable<Awaited<ReturnType<typeof prisma.document.findUnique>>>;
import { getCachedAnalysis, cacheAnalysis, generateAnalysisCacheKey } from '@/lib/utils/cache';
import { validateContent } from '@/lib/utils/resilience';
import { createLogger } from '@/lib/utils/logger';
import { getDocumentContent } from '@/lib/utils/encryption';
import { checkAnalysisLimit } from '@/lib/utils/plan-limits';

import {
  NoiseStatsSchema,
  FactCheckSchema,
  ComplianceSchema,
  SentimentSchema,
  LogicalSchema,
  SwotSchema,
  CognitiveSchema,
  SimulationSchema,
  MemorySchema,
  RecognitionCuesSchema,
  NarrativePreMortemSchema,
} from '@/lib/schemas/analysis';

const log = createLogger('Analyzer');

export interface ProgressUpdate {
  type: 'step' | 'bias' | 'noise' | 'summary' | 'complete' | 'error' | 'toxicCombinations';
  step?: string;
  description?: string;
  status?: 'running' | 'complete' | 'error';
  biasType?: string;
  result?: unknown;
  message?: string;
  progress: number;
  combinations?: Array<{
    patternLabel: string;
    patternDescription: string;
    biasTypes: string[];
    toxicScore: number;
    historicalFailRate: number;
    sampleSize: number;
  }>;
}

export async function analyzeDocument(
  documentOrId: string | Document,
  onProgress?: (update: ProgressUpdate) => void
): Promise<AnalysisResult> {
  let document: Document;
  let documentId: string;

  if (typeof documentOrId === 'string') {
    documentId = documentOrId;
    const fetched = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!fetched) {
      throw new Error(`Document ${documentId} not found`);
    }
    document = fetched;
  } else {
    document = documentOrId;
    documentId = document.id;
  }

  const content = getDocumentContent(document);

  // Validate content before analysis
  const validation = validateContent(content);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Check cache first
  const cacheKey = generateAnalysisCacheKey(content, document.userId);
  const cached = await getCachedAnalysis(cacheKey);

  if (cached) {
    log.info('Cache hit for analysis: ' + cacheKey.substring(0, 16));
    if (onProgress) {
      onProgress({ type: 'step', step: 'Retrieved from cache', status: 'complete', progress: 100 });
    }
    return cached as unknown as AnalysisResult;
  }

  // Enforce plan analysis limit before running the expensive pipeline.
  // dealId is a newer column — cast defensively against schema drift.
  const dealId = (document as Record<string, unknown>).dealId as string | undefined;
  const planCheck = await checkAnalysisLimit(document.userId, dealId ?? null);
  if (!planCheck.allowed) {
    const err = new Error(
      `Analysis limit reached (${planCheck.used}/${planCheck.limit} this month on the ${planCheck.plan} plan)`
    );
    (err as NodeJS.ErrnoException).code = 'PLAN_LIMIT_EXCEEDED';
    throw err;
  }

  // Run analysis within a transaction for atomicity
  try {
    // Resolve project context for analysis
    let dealContext:
      | { documentType?: string; dealId?: string; dealType?: string; dealStage?: string }
      | undefined;
    try {
      const docType = (document as Record<string, unknown>).documentType as string | undefined;
      const docDealId = (document as Record<string, unknown>).dealId as string | undefined;
      if (docType || docDealId) {
        dealContext = { documentType: docType || undefined, dealId: docDealId || undefined };
        if (docDealId) {
          const deal = await prisma.deal.findUnique({
            where: { id: docDealId },
            select: { dealType: true, stage: true },
          });
          if (deal) {
            dealContext.dealType = deal.dealType;
            dealContext.dealStage = deal.stage;
          }
        }
      }
    } catch {
      // Schema drift — documentType/dealId columns or Deal table may not exist yet
    }

    const result = await runAnalysis(
      content,
      documentId,
      document.userId,
      update => {
        if (onProgress) onProgress(update);
      },
      document.orgId ?? undefined,
      dealContext
    );

    // Store analysis in database with Schema Drift Protection
    const foundBiases = result.biases.filter(b => b.found);

    // Visualization URLs no longer generated (static images replaced
    // with interactive BiasNetwork component in the frontend)
    const biasWebImageUrl: string | null = null;
    const preMortemImageUrl: string | null = null;

    // Try saving with ALL fields first. If the DB is missing newer
    // columns (schema drift / P2022), the transaction is poisoned —
    // PostgreSQL rejects every subsequent command in the same transaction
    // block. So the fallback MUST run in a separate transaction.
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'analyzing' },
    });

    let schemaDrift = false;
    try {
      await prisma.$transaction(async tx => {
        await tx.analysis.create({
          data: {
            documentId,
            overallScore: result.overallScore,
            noiseScore: result.noiseScore,
            summary: result.summary,
            modelVersion: process.env.GEMINI_MODEL_NAME ?? 'gemini-3-flash-preview',
            biases: {
              create: foundBiases.map(bias => ({
                biasType: bias.biasType,
                severity: bias.severity,
                excerpt: typeof bias.excerpt === 'string' ? bias.excerpt : '',
                explanation: bias.explanation || '',
                suggestion: bias.suggestion || '',
                confidence: bias.confidence || 0.0,
              })),
            },
            // New Fields (May cause P2022 if DB not migrated)
            structuredContent: result.structuredContent || '',
            noiseStats: toPrismaJson(
              NoiseStatsSchema.safeParse(result.noiseStats).success
                ? result.noiseStats
                : NoiseStatsSchema.parse({})
            ),
            noiseBenchmarks: toPrismaJson(result.noiseBenchmarks ?? []),
            factCheck: toPrismaJson(
              FactCheckSchema.safeParse(result.factCheck).success
                ? result.factCheck
                : FactCheckSchema.parse({})
            ),
            compliance: toPrismaJson({
              ...(ComplianceSchema.safeParse(result.compliance).success
                ? result.compliance
                : ComplianceSchema.parse({})),
              ...(result.compoundScoring ? { compoundScoring: result.compoundScoring } : {}),
              ...(result.bayesianPriors ? { bayesianPriors: result.bayesianPriors } : {}),
            }),
            preMortem: toPrismaJson(result.preMortem),
            sentiment: toPrismaJson(
              SentimentSchema.safeParse(result.sentiment).success
                ? result.sentiment
                : SentimentSchema.parse({})
            ),
            speakers: result.speakers || [],
            biasWebImageUrl,
            preMortemImageUrl,
            // Phase 4 Extensions
            logicalAnalysis: toPrismaJson(
              LogicalSchema.safeParse(result.logicalAnalysis).success
                ? result.logicalAnalysis
                : LogicalSchema.parse({})
            ),
            swotAnalysis: toPrismaJson(
              result.swotAnalysis
                ? SwotSchema.safeParse(result.swotAnalysis).success
                  ? result.swotAnalysis
                  : undefined
                : undefined
            ),
            cognitiveAnalysis: toPrismaJson(
              result.cognitiveAnalysis
                ? CognitiveSchema.safeParse(result.cognitiveAnalysis).success
                  ? result.cognitiveAnalysis
                  : undefined
                : undefined
            ),
            simulation: toPrismaJson(
              result.simulation
                ? SimulationSchema.safeParse(result.simulation).success
                  ? result.simulation
                  : undefined
                : undefined
            ),
            institutionalMemory: toPrismaJson(
              result.institutionalMemory
                ? MemorySchema.safeParse(result.institutionalMemory).success
                  ? result.institutionalMemory
                  : undefined
                : undefined
            ),
            intelligenceContext: toPrismaJson(result.intelligenceContext || undefined),
            recognitionCues: toPrismaJson(
              result.recognitionCues
                ? RecognitionCuesSchema.safeParse(result.recognitionCues).success
                  ? result.recognitionCues
                  : undefined
                : undefined
            ),
            narrativePreMortem: toPrismaJson(
              result.narrativePreMortem
                ? NarrativePreMortemSchema.safeParse(result.narrativePreMortem).success
                  ? result.narrativePreMortem
                  : undefined
                : undefined
            ),
            forgottenQuestions: toPrismaJson(result.forgottenQuestions || undefined),
          } satisfies Prisma.AnalysisUncheckedCreateInput,
        });

        await tx.document.update({
          where: { id: documentId },
          data: { status: 'complete' },
        });
      });
    } catch (dbError: unknown) {
      const prismaError = dbError as { code?: string; message?: string };
      if (
        prismaError.code === 'P2021' ||
        prismaError.code === 'P2022' ||
        prismaError.message?.includes('does not exist')
      ) {
        log.warn('Schema drift detected. Retrying save with CORE fields only: ' + prismaError.code);
        schemaDrift = true;
      } else {
        throw dbError;
      }
    }

    if (schemaDrift) {
      await prisma.$transaction(async tx => {
        await tx.analysis.create({
          data: {
            documentId,
            overallScore: result.overallScore,
            noiseScore: result.noiseScore,
            summary: result.summary,
            biases: {
              create: foundBiases.map(bias => ({
                biasType: bias.biasType,
                severity: bias.severity,
                excerpt: typeof bias.excerpt === 'string' ? bias.excerpt : '',
                explanation: bias.explanation || '',
                suggestion: bias.suggestion || '',
                confidence: bias.confidence || 0.0,
              })),
            },
            // Note: biasWebImageUrl/preMortemImageUrl omitted from fallback
            // because they are also new columns that may trigger P2022.
          },
          select: { id: true },
        });

        await tx.document.update({
          where: { id: documentId },
          data: { status: 'complete' },
        });
      });
    }

    // Store embedding for RAG (non-blocking)
    try {
      const { storeAnalysisEmbedding } = await import('@/lib/rag/embeddings');
      await storeAnalysisEmbedding(
        documentId,
        document.filename,
        result.summary,
        foundBiases.map(b => ({
          biasType: b.biasType,
          severity: b.severity,
          explanation: b.explanation || '',
        })),
        result.overallScore
      );
    } catch (embeddingError) {
      log.warn(
        'Failed to store embedding (non-critical): ' +
          (embeddingError instanceof Error ? embeddingError.message : String(embeddingError))
      );
    }

    // Store section-level embeddings for cross-document RAG (non-blocking)
    try {
      const { chunkIntoSections, storeSectionEmbeddings } =
        await import('@/lib/rag/section-embeddings');
      const plainContent = getDocumentContent(document);
      const sections = chunkIntoSections(plainContent, document.filename);
      await storeSectionEmbeddings(documentId, sections);
    } catch (sectionError) {
      log.warn(
        'Failed to store section embeddings (non-critical): ' +
          (sectionError instanceof Error ? sectionError.message : String(sectionError))
      );
    }

    // Toxic Combination Detection (non-blocking, fire-and-forget)
    try {
      const savedAnalysis = await prisma.analysis.findFirst({
        where: { documentId },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      if (savedAnalysis) {
        const { detectToxicCombinations } = await import('@/lib/learning/toxic-combinations');
        const toxicResult = await detectToxicCombinations(savedAnalysis.id, document.orgId ?? null);
        if (toxicResult.flaggedCount > 0) {
          log.info(
            `Detected ${toxicResult.flaggedCount} toxic combination(s) for analysis ${savedAnalysis.id}`
          );
          if (onProgress) {
            onProgress({
              type: 'step',
              step: `Toxic Combinations: ${toxicResult.flaggedCount} compound risk pattern(s) detected`,
              status: 'complete',
              progress: 99,
            });
          }
          // Emit toxic combinations via progress callback for SSE streaming
          if (onProgress) {
            onProgress({
              type: 'toxicCombinations',
              progress: 99,
              combinations: toxicResult.combinations.slice(0, 5).map(c => ({
                patternLabel: c.patternLabel ?? 'Unknown Pattern',
                patternDescription: c.patternDescription ?? '',
                biasTypes: c.biasTypes,
                toxicScore: c.toxicScore,
                historicalFailRate: c.historicalFailRate ?? 0,
                sampleSize: c.sampleSize,
              })),
            });
          }

          // Push Slack alert for critical toxic combinations
          if (document.orgId) {
            const topCombo = toxicResult.combinations[0];
            if (topCombo && topCombo.toxicScore >= 70) {
              const alertChannel = process.env.SLACK_ALERT_CHANNEL;
              if (alertChannel) {
                void (async () => {
                  try {
                    const install = await prisma.slackInstallation.findFirst({
                      where: { orgId: document.orgId!, status: 'active' },
                      select: { teamId: true },
                    });
                    if (install) {
                      const { deliverSlackNudge } =
                        await import('@/lib/integrations/slack/handler');
                      const severity = topCombo.toxicScore >= 85 ? ':rotating_light:' : ':warning:';
                      await deliverSlackNudge(
                        {
                          channel: alertChannel,
                          text: `${severity} *Compound Risk Detected*\n"${topCombo.patternLabel}" (score: ${Math.round(topCombo.toxicScore)}/100) in "${document.filename}"\nBiases: ${topCombo.biasTypes.join(', ')}`,
                        },
                        install.teamId
                      );
                    }
                  } catch (err) {
                    log.warn(
                      'Slack toxic alert failed (non-fatal):',
                      err instanceof Error ? err.message : String(err)
                    );
                  }
                })();
              }
            }
          }
        }
      }
    } catch (toxicError) {
      log.warn(
        'Failed to detect toxic combinations (non-critical): ' +
          (toxicError instanceof Error ? toxicError.message : String(toxicError))
      );
    }

    // Fingerprint Predictive Warnings (non-blocking)
    try {
      if (document.orgId && document.documentType) {
        const savedForFp = await prisma.analysis.findFirst({
          where: { documentId },
          orderBy: { createdAt: 'desc' },
          select: { id: true },
        });
        if (savedForFp) {
          const { generatePredictiveWarnings } = await import('@/lib/learning/fingerprint-engine');
          const deal = document.dealId
            ? await prisma.deal.findUnique({
                where: { id: document.dealId },
                select: { dealType: true },
              })
            : null;
          await generatePredictiveWarnings(
            savedForFp.id,
            document.orgId,
            document.documentType,
            deal?.dealType ?? undefined
          );
        }
      }
    } catch (fpErr) {
      log.debug(
        'Fingerprint warnings unavailable:',
        fpErr instanceof Error ? fpErr.message : String(fpErr)
      );
    }

    // Decision Graph edge inference (non-blocking)
    try {
      const savedForGraph = await prisma.analysis.findFirst({
        where: { documentId },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      if (savedForGraph) {
        const { inferEdgesForAnalysis } = await import('@/lib/graph/edge-inference');
        const edgeCount = await inferEdgesForAnalysis(savedForGraph.id, document.orgId ?? null);
        if (edgeCount > 0) {
          log.info(`Inferred ${edgeCount} graph edge(s) for analysis ${savedForGraph.id}`);

          // Check graph patterns for nudges (after edges exist)
          try {
            const { checkGraphNudgesForAnalysis } = await import('@/lib/nudges/engine');
            const nudgeCount = await checkGraphNudgesForAnalysis(
              savedForGraph.id,
              document.orgId ?? null
            );
            if (nudgeCount > 0) {
              log.info(
                `Created ${nudgeCount} graph-pattern nudge(s) for analysis ${savedForGraph.id}`
              );
            }
          } catch (nudgeErr) {
            log.warn('Graph nudge check failed (non-critical):', nudgeErr);
          }
        }
      }
    } catch (edgeError) {
      log.warn(
        'Failed to infer graph edges (non-critical): ' +
          (edgeError instanceof Error ? edgeError.message : String(edgeError))
      );
    }

    // Autonomous Outcome Detection — Channel 1: Document Upload (non-blocking)
    try {
      const { detectOutcomeFromDocument } = await import('@/lib/learning/outcome-inference');
      const draftOutcomes = await detectOutcomeFromDocument(
        documentId,
        content.slice(0, 6000),
        document.userId,
        document.orgId ?? null
      );
      if (draftOutcomes.length > 0) {
        log.info(
          `Detected ${draftOutcomes.length} potential outcome(s) from document ${documentId}`
        );
      }
    } catch (outcomeError) {
      log.warn(
        'Failed to detect outcomes from document (non-critical): ' +
          (outcomeError instanceof Error ? outcomeError.message : String(outcomeError))
      );
    }

    // Webhook notification (non-blocking, fire-and-forget)
    try {
      const { emitWebhookEvent } = await import('@/lib/integrations/webhooks/engine');
      const savedForWebhook = await prisma.analysis.findFirst({
        where: { documentId },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      if (savedForWebhook) {
        emitWebhookEvent(
          'analysis.completed',
          {
            analysisId: savedForWebhook.id,
            documentId,
            score: result.overallScore,
            biasCount: foundBiases.length,
          },
          document.orgId ?? document.userId
        );
      }
    } catch (webhookError) {
      log.warn(
        'Failed to emit webhook (non-critical): ' +
          (webhookError instanceof Error ? webhookError.message : String(webhookError))
      );
    }

    // Cache the result for future use (non-blocking)
    try {
      await cacheAnalysis(cacheKey, result as unknown as Record<string, unknown>);
    } catch (cacheError) {
      log.warn(
        'Failed to cache analysis (non-critical): ' +
          (cacheError instanceof Error ? cacheError.message : String(cacheError))
      );
    }

    if (onProgress) {
      onProgress({ type: 'complete', progress: 100, result });
    }

    return result;
  } catch (error) {
    // Update document status to error — wrapped in try/catch to prevent
    // masking the original error if the DB update itself fails
    try {
      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'error' },
      });
    } catch (statusError) {
      log.error(
        'Failed to set document error status:',
        statusError instanceof Error ? statusError.message : String(statusError)
      );
    }
    throw error;
  }
}

// Lazy singleton for the graph
let graphInstance: typeof import('@/lib/agents/graph').auditGraph | null = null;

export async function getGraph() {
  if (!graphInstance) {
    // Lazy load graph to avoid circular deps or init issues
    const { auditGraph } = await import('@/lib/agents/graph');
    graphInstance = auditGraph;
  }
  return graphInstance;
}

export async function runAnalysis(
  content: string,
  documentId: string,
  userId: string,
  onProgress?: (update: ProgressUpdate) => void,
  orgId?: string,
  dealContext?: { documentType?: string; dealId?: string; dealType?: string; dealStage?: string }
): Promise<AnalysisResult> {
  const auditGraph = await getGraph();

  // Send step-by-step progress updates
  const sendStep = (step: string, status: 'running' | 'complete', progress: number) => {
    if (onProgress) onProgress({ type: 'step', step, status, progress });
  };

  // Map agent node names to human-readable labels (must match graph.ts nodes)
  const NODE_LABELS: Record<string, string> = {
    gdprAnonymizer: 'Privacy Protection',
    structurer: 'Document Parsing',
    biasDetective: 'Bias Detection',
    noiseJudge: 'Noise Analysis',
    factChecker: 'Financial Fact Check',
    complianceMapper: 'Compliance Check',
    cognitiveDiversity: 'Cognitive Diversity (Red Team)',
    decisionTwin: 'Decision Simulation',
    memoryRecall: 'Institutional Memory',
    linguisticAnalysis: 'Sentiment & Logic Analysis',
    strategicAnalysis: 'Strategic Analysis',
    riskScorer: 'Final Risk Scoring',
  };

  // Initial step
  sendStep('Initializing audit pipeline', 'running', 5);

  let result;
  try {
    // Use streamEvents for real-time node tracking (Check if method exists for test resilience)
    const eventStream =
      typeof auditGraph.streamEvents === 'function'
        ? auditGraph.streamEvents(
            {
              originalContent: content,
              documentId,
              userId,
              orgId: orgId || '',
              documentType: dealContext?.documentType || '',
              dealId: dealContext?.dealId || '',
              dealType: dealContext?.dealType || '',
              dealStage: dealContext?.dealStage || '',
            },
            { version: 'v2' }
          )
        : null;

    if (eventStream) {
      // Track completed nodes for progress calculation
      const completedNodes = new Set<string>();
      const totalNodes = Object.keys(NODE_LABELS).length;

      // Capture the final output from the root graph end event
      for await (const event of eventStream) {
        // Track node start events
        if (event.event === 'on_chain_start' && event.name && NODE_LABELS[event.name]) {
          const label = NODE_LABELS[event.name];
          sendStep(label, 'running', Math.round((completedNodes.size / totalNodes) * 80) + 10);
        }

        // Track node end events
        if (event.event === 'on_chain_end') {
          // Check for root graph completion
          if (event.name === 'LangGraph') {
            result = event.data.output;
          } else if (event.name && NODE_LABELS[event.name]) {
            completedNodes.add(event.name);
            const label = NODE_LABELS[event.name];
            const progress = Math.round((completedNodes.size / totalNodes) * 80) + 10;
            sendStep(label, 'complete', progress);

            // Send bias detection updates specifically
            if (event.name === 'biasDetective' && event.data?.output?.biasAnalysis) {
              const biases = event.data.output.biasAnalysis;
              for (const bias of biases) {
                if (bias.biasType && onProgress) {
                  onProgress({
                    type: 'bias',
                    biasType: bias.biasType,
                    progress,
                    result: { found: true, severity: bias.severity },
                  });
                }
              }
            }

            // Send noise analysis updates
            if (event.name === 'noiseJudge' && event.data?.output?.noiseStats) {
              if (onProgress) {
                onProgress({
                  type: 'noise',
                  progress,
                  result: { score: event.data.output.noiseStats.mean },
                });
              }
            }
          }
        }
      }
    }

    if (!result) {
      // Fallback to non-streaming invoke if stream didn't yield result
      throw new Error('Stream did not return a final result');
    }
  } catch (error) {
    log.error('Streaming error, falling back to invoke:', error);
    // Fallback to non-streaming invoke if streaming fails
    sendStep('Processing document', 'running', 50);

    // Fallback timeout: 250s — leaves 50s margin before Vercel 300s maxDuration
    const FALLBACK_TIMEOUT_MS = 250000; // 250 seconds
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Analysis timed out after ${FALLBACK_TIMEOUT_MS / 1000} seconds`)),
        FALLBACK_TIMEOUT_MS
      )
    );

    try {
      result = (await Promise.race([
        auditGraph.invoke({
          originalContent: content,
          documentId,
          userId,
          orgId: orgId || '',
          documentType: dealContext?.documentType || '',
          dealId: dealContext?.dealId || '',
          dealType: dealContext?.dealType || '',
          dealStage: dealContext?.dealStage || '',
        }),
        timeoutPromise,
      ])) as { finalReport: Record<string, unknown> };
    } catch (timeoutError) {
      log.error('Analysis timeout:', timeoutError);
      throw new Error(
        'Analysis timed out. Please try again or contact support if the issue persists.'
      );
    }
  }

  sendStep('Finalizing report', 'running', 95);

  if (!result.finalReport) {
    throw new Error('Audit Pipeline failed to generate a report');
  }

  // Ensure plain serializable object (removes Map, Set, Circular refs)
  result.finalReport = safeJsonClone(result.finalReport);

  if (!result.finalReport) {
    throw new Error('Report corrupted during normalization');
  }

  // Adapt to UI expected structure
  // Ensure all biased findings are marked as "found"
  const finalReport = {
    ...result.finalReport,
    overallScore: result.finalReport.overallScore || 0,
    biases: (result.finalReport.biases || []).map((b: BiasDetectionResult) => ({
      ...b,
      found: true,
    })),
  };

  return finalReport;
}
