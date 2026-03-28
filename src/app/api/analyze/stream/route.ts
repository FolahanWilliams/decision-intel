import { NextRequest, NextResponse } from 'next/server';
import { getGraph, ProgressUpdate } from '@/lib/analysis/analyzer';
import { formatSSE, formatSSEHeartbeat } from '@/lib/sse';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getSafeErrorMessage } from '@/lib/utils/error';
import { safeJsonClone } from '@/lib/utils/json';
import { toPrismaJson } from '@/lib/utils/prisma-json';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { checkAnalysisLimit } from '@/lib/utils/plan-limits';
import { createLogger } from '@/lib/utils/logger';
import { logAudit } from '@/lib/audit';
import { trackApiUsage, estimateCost } from '@/lib/utils/cost-tracker';
import { checkOutcomeGate, formatOutcomeReminder } from '@/lib/learning/outcome-gate';
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
} from '@/lib/schemas/analysis';

const log = createLogger('StreamRoute');

// Allow up to 240 seconds for the streaming analysis pipeline.
// Without this, Vercel defaults to 25s which is far too short for
// multi-agent LLM pipelines.
export const maxDuration = 240;

// Map agent node names to human-readable labels with dynamic descriptions
const NODE_LABELS: Record<string, { label: string; description: string }> = {
  gdprAnonymizer: {
    label: 'Privacy Shield',
    description: 'Scanning for personal data and applying GDPR redactions…',
  },
  structurer: {
    label: 'Document Intelligence',
    description: 'Parsing structure, identifying speakers and key sections…',
  },
  biasDetective: {
    label: 'Bias Detection',
    description: 'Analyzing for 15 cognitive biases with research verification…',
  },
  noiseJudge: {
    label: 'Noise Analysis',
    description: 'Running 3 independent judges to measure decision consistency…',
  },
  verificationNode: {
    label: 'Fact & Compliance Check',
    description: 'Verifying claims via Google Search and checking regulatory compliance…',
  },
  deepAnalysisNode: {
    label: 'Deep Analysis',
    description: 'Performing sentiment, logic, SWOT, and cognitive diversity analysis…',
  },
  simulationNode: {
    label: 'Boardroom Simulation',
    description: 'Running decision twin simulation with institutional memory…',
  },
  riskScorer: { label: 'Risk Scoring', description: 'Calculating final decision quality score…' },
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit by authenticated user (not IP)
    const rateLimitResult = await checkRateLimit(userId, '/api/analyze/stream');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. You can analyze up to 5 documents per hour.',
          limit: rateLimitResult.limit,
          reset: rateLimitResult.reset,
          remaining: 0,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimitResult.reset - Math.floor(Date.now() / 1000)) },
        }
      );
    }

    // Enforce monthly plan limits
    const planCheck = await checkAnalysisLimit(userId);
    if (!planCheck.allowed) {
      return NextResponse.json(
        {
          error: `Monthly analysis limit reached (${planCheck.used}/${planCheck.limit}). Upgrade your plan for more.`,
          code: 'PLAN_LIMIT',
          plan: planCheck.plan,
          used: planCheck.used,
          limit: planCheck.limit,
        },
        { status: 429 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    const { documentId } = body;
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Verify ownership
    const doc = await prisma.document.findFirst({
      where: { id: documentId, userId },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // ── Outcome enforcement gate ──────────────────────────────────────
    // The behavioral data flywheel only works when users close the loop.
    // Soft-gate: warn when 3+ analyses lack outcomes (>30 days old).
    // Hard-gate: block new analyses when 5+ outcomes are overdue.
    const outcomeGate = await checkOutcomeGate(userId);

    if (!outcomeGate.allowed) {
      log.info(
        `Outcome gate: blocking user ${userId} with ${outcomeGate.pendingCount} unreported outcomes`
      );
      return NextResponse.json(
        {
          error: 'Outcome reporting required before new analyses',
          code: 'OUTCOME_GATE',
          pendingOutcomes: outcomeGate.pendingCount,
          pendingAnalysisIds: outcomeGate.pendingAnalysisIds,
          message: outcomeGate.message,
        },
        { status: 423 }
      );
    }

    // Guard against concurrent analysis with atomic check-and-set.
    // Uses updateMany with a predicate to avoid TOCTOU race conditions:
    // only sets status to 'analyzing' if it's NOT already 'analyzing'
    // (or if it's been stuck for >10 minutes, indicating a crashed run).
    if (doc.status === 'analyzing') {
      const STALE_THRESHOLD_MS = 10 * 60 * 1000;
      const elapsed = Date.now() - new Date(doc.updatedAt).getTime();
      if (elapsed < STALE_THRESHOLD_MS) {
        return NextResponse.json(
          { error: 'Analysis already in progress', status: doc.status },
          { status: 409 }
        );
      }
      log.warn(
        `Document ${documentId} stuck in 'analyzing' for ${Math.round(elapsed / 60000)}m — allowing re-analysis`
      );
    }

    // Atomic lock: only one request can transition a document to 'analyzing'
    const lockResult = await prisma.document.updateMany({
      where: {
        id: documentId,
        OR: [
          { status: { not: 'analyzing' } },
          { updatedAt: { lt: new Date(Date.now() - 10 * 60 * 1000) } },
        ],
      },
      data: { status: 'analyzing' },
    });
    if (lockResult.count === 0) {
      return NextResponse.json(
        { error: 'Analysis already in progress', status: 'analyzing' },
        { status: 409 }
      );
    }

    // Check for resumption with Last-Event-ID header
    const lastEventId = request.headers.get('Last-Event-ID');
    const resumeFromId = lastEventId ? parseInt(lastEventId, 10) : 0;

    // Check for cached checkpoint state if resuming
    let checkpoint: Record<string, unknown> | null = null;
    if (resumeFromId > 0) {
      const cacheKey = `stream:${documentId}:${userId}`;
      const cached = await prisma.cacheEntry.findUnique({
        where: { key: cacheKey },
        select: { value: true, expiresAt: true },
      });
      if (cached && new Date(cached.expiresAt) > new Date()) {
        try {
          checkpoint = JSON.parse(cached.value);
          log.info(`Resuming stream from event ID ${resumeFromId} for document ${documentId}`);
        } catch (e) {
          log.warn('Failed to parse checkpoint cache', e);
        }
      }
    }

    const encoder = new TextEncoder();
    let eventCounter = resumeFromId;
    let heartbeatInterval: NodeJS.Timeout | null = null;

    const stream = new ReadableStream({
      async start(controller) {
        const sendUpdate = (update: ProgressUpdate, skipIncrement = false) => {
          if (!skipIncrement) {
            eventCounter++;
          }
          const sseString = formatSSE(update, String(eventCounter));
          controller.enqueue(encoder.encode(sseString));
        };

        // Start heartbeat to keep connection alive
        heartbeatInterval = setInterval(() => {
          controller.enqueue(encoder.encode(formatSSEHeartbeat()));
        }, 15000); // Send heartbeat every 15 seconds

        // Emit outcome reminder as first event if user has pending outcomes
        const outcomeReminder = formatOutcomeReminder(outcomeGate);
        if (outcomeReminder) {
          sendUpdate(outcomeReminder as unknown as ProgressUpdate);
        }

        // Track completed nodes for progress calculation
        const completedNodes = checkpoint?.completedNodes
          ? new Set<string>(checkpoint.completedNodes as string[])
          : new Set<string>();
        const totalNodes = Object.keys(NODE_LABELS).length;

        let streamAbsoluteTimeout: ReturnType<typeof setTimeout> | undefined;
        try {
          // Status already set to 'analyzing' by atomic lock above

          sendUpdate({
            type: 'step',
            step: 'Initializing audit pipeline',
            status: 'running',
            progress: 5,
          });

          // Resolve deal context for PE/VC investment vertical
          let documentType = '';
          let dealId = '';
          let dealType = '';
          let dealStage = '';
          try {
            const docAny = doc as Record<string, unknown>;
            documentType = (docAny.documentType as string) || '';
            dealId = (docAny.dealId as string) || '';
            if (dealId) {
              // Verify deal belongs to same org as the document
              const deal = await prisma.deal.findFirst({
                where: { id: dealId, orgId: doc.orgId || userId },
                select: { dealType: true, stage: true },
              });
              if (deal) {
                dealType = deal.dealType;
                dealStage = deal.stage;
              } else {
                log.warn(
                  `Deal ${dealId} referenced by document ${documentId} not found or access denied`
                );
                dealId = '';
              }
            }
          } catch {
            // Schema drift — documentType/dealId or Deal table may not exist yet
          }

          const auditGraph = await getGraph();
          const eventStream = auditGraph.streamEvents(
            {
              originalContent: doc.content,
              documentId,
              userId,
              orgId: doc.orgId || '',
              documentType,
              dealId,
              dealType,
              dealStage,
            },
            { version: 'v2' }
          );

          let result: Record<string, unknown> | null = null;

          // Safety timeout: close stream 5s before Vercel maxDuration
          // Declared as let so it's accessible in the catch block
          streamAbsoluteTimeout = setTimeout(() => {
            log.error('Stream absolute timeout (235s) exceeded — closing');
            sendUpdate({
              type: 'error',
              message: 'Analysis timeout exceeded. Please try again with a shorter document.',
              progress: 0,
            });
            controller.close();
          }, 235_000);

          for await (const event of eventStream) {
            // Track node start events
            if (event.event === 'on_chain_start' && event.name && NODE_LABELS[event.name]) {
              const { label, description } = NODE_LABELS[event.name];
              sendUpdate({
                type: 'step',
                step: label,
                description,
                status: 'running',
                progress: Math.round((completedNodes.size / totalNodes) * 80) + 10,
              });
            }

            // Track node end events
            if (event.event === 'on_chain_end') {
              if (event.name === 'LangGraph') {
                result = event.data.output;
              } else if (event.name && NODE_LABELS[event.name]) {
                completedNodes.add(event.name);
                const { label, description } = NODE_LABELS[event.name];
                const progress = Math.round((completedNodes.size / totalNodes) * 80) + 10;
                sendUpdate({
                  type: 'step',
                  step: label,
                  description,
                  status: 'complete',
                  progress,
                });

                // Save checkpoint state for resumption
                const cacheKey = `stream:${documentId}:${userId}`;
                const checkpointData = {
                  completedNodes: Array.from(completedNodes),
                  lastEventId: eventCounter,
                  progress,
                };
                prisma.cacheEntry
                  .upsert({
                    where: { key: cacheKey },
                    update: {
                      value: JSON.stringify(checkpointData),
                      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min TTL
                    },
                    create: {
                      key: cacheKey,
                      value: JSON.stringify(checkpointData),
                      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
                    },
                  })
                  .catch((err: unknown) => {
                    log.warn('Failed to save checkpoint:', err);
                  });

                // Send bias detection updates
                if (event.name === 'biasDetective' && event.data?.output?.biasAnalysis) {
                  const biases = event.data.output.biasAnalysis;
                  for (const bias of biases) {
                    if (bias.biasType) {
                      sendUpdate({
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
                  sendUpdate({
                    type: 'noise',
                    progress,
                    result: { score: event.data.output.noiseStats.mean },
                  });
                }
              }
            }
          }

          if (!result || !result.finalReport) {
            throw new Error('Audit Pipeline failed to generate a report');
          }

          // Normalize result
          result.finalReport = safeJsonClone(result.finalReport);

          // Save to DB
          const report = result.finalReport as Record<string, unknown>;
          const detectedBiases = (report.biases as Array<Record<string, unknown>>) || [];

          // Try saving with ALL fields first. If the DB is missing
          // newer columns (schema drift / P2022), the transaction is
          // poisoned — PostgreSQL rejects every subsequent command in
          // the same transaction block. So the fallback MUST run in a
          // separate transaction instead of inside the same one.
          let schemaDrift = false;
          let createdAnalysisId: string | null = null;

          try {
            await prisma.$transaction(async tx => {
              // Check for existing analyses to determine version
              const existingAnalyses = await tx.analysis.findMany({
                where: { documentId },
                orderBy: { version: 'desc' },
                take: 1,
                select: { id: true, version: true, overallScore: true, noiseScore: true },
              });

              const previousAnalysis = existingAnalyses[0];
              const nextVersion = previousAnalysis ? previousAnalysis.version + 1 : 1;

              const newAnalysis = await tx.analysis.create({
                data: {
                  documentId,
                  version: nextVersion,
                  overallScore: (report.overallScore as number) || 0,
                  noiseScore: (report.noiseScore as number) || 0,
                  summary: (report.summary as string) || '',
                  modelVersion: process.env.GEMINI_MODEL_NAME ?? 'gemini-3-flash-preview',
                  biases: {
                    create: detectedBiases.map(bias => ({
                      biasType: bias.biasType as string,
                      severity: bias.severity as string,
                      excerpt: typeof bias.excerpt === 'string' ? bias.excerpt : '',
                      explanation: (bias.explanation as string) || '',
                      suggestion: (bias.suggestion as string) || '',
                      confidence: (bias.confidence as number) || 0.0,
                    })),
                  },
                  // New Fields
                  structuredContent: (report.structuredContent as string) || '',
                  noiseStats: toPrismaJson(
                    NoiseStatsSchema.safeParse(report.noiseStats).success
                      ? report.noiseStats
                      : NoiseStatsSchema.parse({})
                  ),
                  noiseBenchmarks: toPrismaJson(report.noiseBenchmarks ?? []),
                  factCheck: toPrismaJson(
                    FactCheckSchema.safeParse(report.factCheck).success
                      ? report.factCheck
                      : FactCheckSchema.parse({})
                  ),
                  compliance: toPrismaJson({
                    ...(ComplianceSchema.safeParse(report.compliance).success
                      ? (report.compliance as Record<string, unknown>)
                      : ComplianceSchema.parse({})),
                    ...(report.compoundScoring ? { compoundScoring: report.compoundScoring } : {}),
                    ...(report.bayesianPriors ? { bayesianPriors: report.bayesianPriors } : {}),
                  }),
                  preMortem: toPrismaJson(report.preMortem),
                  sentiment: toPrismaJson(
                    SentimentSchema.safeParse(report.sentiment).success
                      ? report.sentiment
                      : SentimentSchema.parse({})
                  ),
                  speakers: (report.speakers as string[]) || [],
                  // Phase 4 Extensions
                  logicalAnalysis: toPrismaJson(
                    LogicalSchema.safeParse(report.logicalAnalysis).success
                      ? report.logicalAnalysis
                      : LogicalSchema.parse({})
                  ),
                  swotAnalysis: toPrismaJson(
                    report.swotAnalysis
                      ? SwotSchema.safeParse(report.swotAnalysis).success
                        ? report.swotAnalysis
                        : undefined
                      : undefined
                  ),
                  cognitiveAnalysis: toPrismaJson(
                    report.cognitiveAnalysis
                      ? CognitiveSchema.safeParse(report.cognitiveAnalysis).success
                        ? report.cognitiveAnalysis
                        : undefined
                      : undefined
                  ),
                  simulation: toPrismaJson(
                    report.simulation
                      ? SimulationSchema.safeParse(report.simulation).success
                        ? report.simulation
                        : undefined
                      : undefined
                  ),
                  institutionalMemory: toPrismaJson(
                    report.institutionalMemory
                      ? MemorySchema.safeParse(report.institutionalMemory).success
                        ? report.institutionalMemory
                        : undefined
                      : undefined
                  ),
                  metaVerdict: (report.metaVerdict as string) || null,
                } satisfies Prisma.AnalysisUncheckedCreateInput,
              });

              createdAnalysisId = newAnalysis.id;

              // Create version snapshot if this is a new version
              if (nextVersion > 1 && previousAnalysis) {
                await tx.analysisVersion.create({
                  data: {
                    analysisId: newAnalysis.id,
                    version: nextVersion,
                    overallScore: (report.overallScore as number) || 0,
                    noiseScore: (report.noiseScore as number) || 0,
                    summary: (report.summary as string) || '',
                    biases: detectedBiases as Prisma.InputJsonValue,
                    fullSnapshot: report as Prisma.InputJsonValue,
                  },
                });

                // Log score difference for monitoring
                const scoreDiff =
                  ((report.overallScore as number) || 0) - previousAnalysis.overallScore;
                if (Math.abs(scoreDiff) > 10) {
                  log.info(
                    `Significant score change for document ${documentId}: ${scoreDiff.toFixed(1)} (v${nextVersion})`
                  );
                }
              }

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
              log.warn(
                'Schema drift detected. Retrying save with CORE fields only: ' + prismaError.code
              );
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
                  overallScore: (report.overallScore as number) || 0,
                  noiseScore: (report.noiseScore as number) || 0,
                  summary: (report.summary as string) || '',
                  modelVersion: process.env.GEMINI_MODEL_NAME ?? 'gemini-3-flash-preview',
                  biases: {
                    create: detectedBiases.map(bias => ({
                      biasType: bias.biasType as string,
                      severity: bias.severity as string,
                      excerpt: typeof bias.excerpt === 'string' ? bias.excerpt : '',
                      explanation: (bias.explanation as string) || '',
                      suggestion: (bias.suggestion as string) || '',
                      confidence: (bias.confidence as number) || 0.0,
                    })),
                  },
                },
                select: { id: true },
              });

              await tx.document.update({
                where: { id: documentId },
                data: { status: 'complete' },
              });
            });
          }

          // Store embedding (fire and forget)
          try {
            const { storeAnalysisEmbedding } = await import('@/lib/rag/embeddings');
            await storeAnalysisEmbedding(
              documentId,
              doc.filename,
              (report.summary as string) || '',
              detectedBiases.map(b => ({
                biasType: b.biasType as string,
                severity: b.severity as string,
                explanation: (b.explanation as string) || '',
              })),
              (report.overallScore as number) || 0
            );
          } catch (embError) {
            log.warn(
              'Embedding storage failed: ' +
                (embError instanceof Error ? embError.message : String(embError))
            );
          }

          // Log audit event (fire and forget)
          logAudit({
            action: 'SCAN_DOCUMENT',
            resource: 'Document',
            resourceId: documentId,
            details: { filename: doc.filename, overallScore: (report.overallScore as number) || 0 },
          }).catch((err: unknown) => {
            log.warn(
              'Audit log failed (non-critical): ' +
                (err instanceof Error ? err.message : String(err))
            );
          });

          // Track LLM cost (fire and forget)
          trackApiUsage({
            userId,
            provider: 'google',
            operation: 'analyze_document',
            tokens: doc.content.length, // Approximate token count from content length
            cost: estimateCost(
              process.env.GEMINI_MODEL_NAME ?? 'gemini-3-flash-preview',
              doc.content.length,
              4000
            ),
            metadata: { documentId, filename: doc.filename },
          });

          // Auto-create outcome tracking stub (fire and forget).
          // Sets outcomeDueAt to 30 days from now as the default review date.
          // Users can adjust via the OutcomeTimeframePicker on the detail page.
          try {
            if (createdAnalysisId) {
              const outcomeDueAt = new Date();
              outcomeDueAt.setDate(outcomeDueAt.getDate() + 30);

              await prisma.analysis
                .update({
                  where: { id: createdAnalysisId },
                  data: {
                    outcomeStatus: 'pending_outcome',
                    outcomeDueAt,
                  },
                })
                .catch(() => {}); // Schema drift — column may not exist yet
            }
          } catch (stubErr) {
            log.warn(
              'Outcome stub creation failed (non-critical): ' +
                (stubErr instanceof Error ? stubErr.message : String(stubErr))
            );
          }

          // Toxic Combination Detection (non-blocking)
          try {
            if (createdAnalysisId) {
              const { detectToxicCombinations } = await import('@/lib/learning/toxic-combinations');
              const toxicResult = await detectToxicCombinations(
                createdAnalysisId,
                doc.orgId ?? null
              );
              if (toxicResult.flaggedCount > 0) {
                log.info(
                  `Detected ${toxicResult.flaggedCount} toxic combination(s) for analysis ${createdAnalysisId}`
                );
                sendUpdate({
                  type: 'step',
                  step: `Toxic Combinations: ${toxicResult.flaggedCount} compound risk pattern(s) detected`,
                  status: 'complete',
                  progress: 99,
                } as ProgressUpdate);

                // Emit toxic combinations detail for client rendering
                sendUpdate({
                  type: 'toxicCombinations',
                  combinations: toxicResult.combinations.slice(0, 5).map(c => ({
                    patternLabel: c.patternLabel,
                    patternDescription: c.patternDescription,
                    biasTypes: c.biasTypes,
                    toxicScore: c.toxicScore,
                    historicalFailRate: c.historicalFailRate,
                    sampleSize: c.sampleSize,
                  })),
                } as unknown as ProgressUpdate);
              }
            }
          } catch (toxicError) {
            log.warn(
              'Failed to detect toxic combinations (non-critical): ' +
                (toxicError instanceof Error ? toxicError.message : String(toxicError))
            );
          }

          // Send email notification (fire and forget)
          if (user?.email) {
            import('@/lib/notifications/email')
              .then(({ notifyAnalysisComplete }) =>
                notifyAnalysisComplete(
                  userId,
                  user.email!,
                  doc.filename,
                  (report.overallScore as number) || 0,
                  documentId
                )
              )
              .catch((err: unknown) => {
                log.warn(
                  'Email notification failed (non-critical): ' +
                    (err instanceof Error ? err.message : String(err))
                );
              });
          }

          // Send final complete
          sendUpdate({ type: 'complete', progress: 100, result: result.finalReport });

          // Clean up checkpoint cache on completion
          const cacheKey = `stream:${documentId}:${userId}`;
          await prisma.cacheEntry.delete({ where: { key: cacheKey } }).catch(() => {}); // Ignore errors

          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            clearTimeout(streamAbsoluteTimeout);
          }
          controller.close();
        } catch (error) {
          log.error('Stream processing error:', error);

          // Update document status
          try {
            await prisma.document.update({
              where: { id: documentId },
              data: { status: 'error' },
            });
          } catch (updateErr) {
            log.error('Failed to update document status to error:', updateErr);
          }

          // Save to dead letter queue for retry
          try {
            const errorMessage = getSafeErrorMessage(error);
            const errorCode = (error as Error & { code?: string })?.code || null;

            // Check if a failed analysis record already exists
            const existingFailed = await prisma.failedAnalysis.findFirst({
              where: {
                documentId,
                resolvedAt: null, // Only check unresolved failures
              },
            });

            if (existingFailed) {
              // Update existing record with incremented retry count
              const nextRetryDelay = Math.min(
                5 * 60 * 1000 * Math.pow(2, existingFailed.retryCount), // Exponential backoff
                2 * 60 * 60 * 1000 // Max 2 hours
              );

              await prisma.failedAnalysis.update({
                where: { id: existingFailed.id },
                data: {
                  retryCount: { increment: 1 },
                  error: errorMessage,
                  errorCode,
                  nextRetryAt: new Date(Date.now() + nextRetryDelay),
                },
              });
            } else {
              // Create new failed analysis record
              await prisma.failedAnalysis.create({
                data: {
                  documentId,
                  userId,
                  error: errorMessage,
                  errorCode,
                  input: {
                    content: doc.content.slice(0, 5000), // Truncate for storage
                    filename: doc.filename,
                    options: { documentId, userId },
                  },
                  nextRetryAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min initial retry
                },
              });
            }

            log.info(`Failed analysis saved to dead letter queue for document ${documentId}`);
          } catch (dlqError) {
            log.error('Failed to save to dead letter queue:', dlqError);
          }

          const errorMessage = getSafeErrorMessage(error);
          sendUpdate({ type: 'error', message: errorMessage, progress: 0 });

          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            clearTimeout(streamAbsoluteTimeout);
          }
          controller.close();
        }
      },
      cancel() {
        // Clean up on stream cancellation
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    log.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
