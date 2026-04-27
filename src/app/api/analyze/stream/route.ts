import { NextRequest, NextResponse } from 'next/server';
import { getGraph, ProgressUpdate } from '@/lib/analysis/analyzer';
import { formatSSE, formatSSEHeartbeat } from '@/lib/sse';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getSafeErrorMessage } from '@/lib/utils/error';
import { safeJsonClone } from '@/lib/utils/json';
import { buildDocumentAccessWhere } from '@/lib/utils/document-access';
import { toPrismaJson } from '@/lib/utils/prisma-json';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { checkAnalysisLimit } from '@/lib/utils/plan-limits';
import { createLogger } from '@/lib/utils/logger';
import { logAudit } from '@/lib/audit';
import { trackApiUsage, estimateCost } from '@/lib/utils/cost-tracker';
import { checkOutcomeGate, formatOutcomeReminder } from '@/lib/learning/outcome-gate';
import { getDocumentContent } from '@/lib/utils/encryption';
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
    description: 'Analyzing for 20 cognitive biases with research verification…',
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
  rpdRecognitionNode: {
    label: 'Pattern Recognition',
    description: 'Identifying recognition cues from historical decisions using Klein RPD…',
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

    // RBAC (3.5): visibility-aware. The streaming pipeline is the most
    // sensitive read path — it decrypts and ships raw content into Gemini,
    // so any leak here is a procurement-grade incident.
    const access = await buildDocumentAccessWhere(documentId, userId);
    const doc = await prisma.document.findFirst({ where: access.where });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Decrypt document content transparently (supports both encrypted and legacy plaintext)
    const docContent = getDocumentContent(doc);

    // ── Outcome Gate ──────────────────────────────────────────────────
    // Two modes (locked 2026-04-26 — closes the cathedral-of-code trap
    // identified by NotebookLM strategic synthesis Q6 pre-mortem):
    //
    //   1. Default (org.enforceOutcomeGate = false): non-blocking. SSE
    //      reminder fires at SOFT/HARD thresholds; user can always run
    //      a new audit. Preserves the legacy free / individual experience.
    //
    //   2. Enforced (org.enforceOutcomeGate = true, set per-org as a
    //      design-partner contractual term): hard-blocks at HARD threshold
    //      (5+ pending past 30 days). Returns HTTP 409 with code
    //      'OUTCOME_GATE_BLOCKED' and the pending analysis IDs so the
    //      client can route the user to the outcome reporter.
    //
    // The org's enforcement flag is the org of any Document the user owns
    // (or null for personal accounts). Non-throwing: any DB error falls
    // back to enforce=false (permissive).
    let enforceGate = false;
    try {
      // Find any org the user is a member of via TeamMember; if multiple,
      // any one with enforceOutcomeGate=true triggers enforcement.
      const orgs = await prisma.organization.findMany({
        where: {
          members: { some: { userId } },
          enforceOutcomeGate: true,
        },
        select: { id: true },
        take: 1,
      });
      enforceGate = orgs.length > 0;
    } catch (err) {
      log.warn('Outcome gate enforcement lookup failed (defaulting to non-enforced):', err);
    }

    const outcomeGate = await checkOutcomeGate(userId, enforceGate);

    if (!outcomeGate.allowed) {
      return NextResponse.json(
        {
          error: outcomeGate.message ?? 'Outcome Gate blocked.',
          code: 'OUTCOME_GATE_BLOCKED',
          pendingCount: outcomeGate.pendingCount,
          pendingAnalysisIds: outcomeGate.pendingAnalysisIds,
          // D11 Phase 3 deep (2026-04-27): the rich pending-analysis array
          // lets the OutcomeGateModal render real filenames + decisionStatement
          // subtitles + /documents/[documentId] deep-links instead of
          // "Analysis #N" placeholders.
          pendingAnalyses: outcomeGate.pendingAnalyses,
          level: outcomeGate.level,
        },
        { status: 409 }
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
    const parsedEventId = lastEventId ? parseInt(lastEventId, 10) : 0;
    const resumeFromId = Number.isNaN(parsedEventId) ? 0 : parsedEventId;

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

          // Resolve project context for analysis
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
              originalContent: docContent,
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

          // Pre-compute version outside the transaction so it's available
          // to both the primary and schema-drift fallback paths.
          const existingAnalysesForVersion = await prisma.analysis.findMany({
            where: { documentId },
            orderBy: { version: 'desc' },
            take: 1,
            select: { id: true, version: true, overallScore: true, noiseScore: true },
          });
          const previousAnalysis = existingAnalysesForVersion[0];
          const nextVersion = previousAnalysis ? previousAnalysis.version + 1 : 1;

          // Cross-document version-delta link (Plan 2.3): when this document
          // is part of a multi-version chain, find the immediate predecessor
          // document's latest Analysis and persist it as
          // `previousAnalysisId`. The VersionDeltaCard on the detail page
          // renders DQI delta + bias diff when this is set.
          let previousAnalysisIdAcrossVersions: string | null = null;
          try {
            const docForVersionLookup = await prisma.document.findUnique({
              where: { id: documentId },
              select: { id: true, parentDocumentId: true, versionNumber: true },
            });
            if (
              docForVersionLookup?.parentDocumentId &&
              (docForVersionLookup.versionNumber ?? 1) > 1
            ) {
              // Predecessor = a doc in the same chain (id = root OR
              // parentDocumentId = root) with versionNumber one less than
              // the current doc.
              const prevDoc = await prisma.document.findFirst({
                where: {
                  OR: [
                    { id: docForVersionLookup.parentDocumentId },
                    { parentDocumentId: docForVersionLookup.parentDocumentId },
                  ],
                  versionNumber: docForVersionLookup.versionNumber - 1,
                  deletedAt: null,
                },
                select: {
                  analyses: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { id: true },
                  },
                },
              });
              previousAnalysisIdAcrossVersions = prevDoc?.analyses[0]?.id ?? null;
            }
          } catch (lookupErr) {
            // Schema drift on parentDocumentId — fall through with a null
            // link rather than failing the whole analysis.
            log.warn('previousAnalysisId lookup failed (non-fatal):', lookupErr);
          }

          try {
            await prisma.$transaction(async tx => {
              const newAnalysis = await tx.analysis.create({
                data: {
                  documentId,
                  version: nextVersion,
                  ...(previousAnalysisIdAcrossVersions
                    ? { previousAnalysisId: previousAnalysisIdAcrossVersions }
                    : {}),
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
                    ...(report.calibration ? { calibration: report.calibration } : {}),
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
                  recognitionCues: toPrismaJson(
                    report.recognitionCues
                      ? RecognitionCuesSchema.safeParse(report.recognitionCues).success
                        ? report.recognitionCues
                        : undefined
                      : undefined
                  ),
                  narrativePreMortem: toPrismaJson(
                    report.narrativePreMortem
                      ? NarrativePreMortemSchema.safeParse(report.narrativePreMortem).success
                        ? report.narrativePreMortem
                        : undefined
                      : undefined
                  ),
                  forgottenQuestions: toPrismaJson(report.forgottenQuestions || undefined),
                  marketContextApplied: toPrismaJson(report.marketContextApplied || undefined),
                  // 1.1 deep — granular per-judge variance summary for the
                  // Decision Provenance Record. Keeps prompts/raw outputs
                  // out (procurement won't accept those server-side) but
                  // captures the metadata needed to demonstrate convergence
                  // between the bias detective, noise judge, statistical
                  // jury, fact-checker, and meta-judge.
                  judgeOutputs: toPrismaJson({
                    biasDetective: {
                      flagCount: Array.isArray(report.biases) ? report.biases.length : 0,
                      severeFlagCount: Array.isArray(report.biases)
                        ? (report.biases as Array<{ severity?: string }>).filter(
                            b => b.severity === 'high' || b.severity === 'critical'
                          ).length
                        : 0,
                      biasTypes: Array.isArray(report.biases)
                        ? Array.from(
                            new Set(
                              (report.biases as Array<{ biasType?: string }>).map(
                                b => b.biasType ?? ''
                              )
                            )
                          )
                            .filter(Boolean)
                            .slice(0, 12)
                        : [],
                    },
                    noiseJudge: (() => {
                      const ns = report.noiseStats as
                        | { mean?: number; stdDev?: number; variance?: number }
                        | undefined;
                      return {
                        mean: ns?.mean ?? null,
                        stdDev: ns?.stdDev ?? null,
                        variance: ns?.variance ?? null,
                        sampleCount: Array.isArray(report.noiseBenchmarks)
                          ? report.noiseBenchmarks.length
                          : null,
                      };
                    })(),
                    factChecker: (() => {
                      const fc = report.factCheck as
                        | {
                            score?: number;
                            verifications?: Array<{ verdict?: string }>;
                          }
                        | undefined;
                      if (!fc) return null;
                      const verifications = Array.isArray(fc.verifications) ? fc.verifications : [];
                      return {
                        score: fc.score ?? null,
                        totalClaims: verifications.length,
                        verified: verifications.filter(v => v.verdict === 'VERIFIED').length,
                        contradicted: verifications.filter(v => v.verdict === 'CONTRADICTED')
                          .length,
                      };
                    })(),
                    metaJudge: {
                      verdict:
                        typeof report.metaVerdict === 'string'
                          ? report.metaVerdict.slice(0, 800)
                          : null,
                    },
                    preMortem: (() => {
                      const pm = report.preMortem as
                        | {
                            failureScenarios?: unknown[];
                            redTeam?: unknown[];
                            inversion?: unknown[];
                          }
                        | undefined;
                      if (!pm) return null;
                      return {
                        failureScenarioCount: Array.isArray(pm.failureScenarios)
                          ? pm.failureScenarios.length
                          : 0,
                        redTeamCount: Array.isArray(pm.redTeam) ? pm.redTeam.length : 0,
                        inversionCount: Array.isArray(pm.inversion) ? pm.inversion.length : 0,
                      };
                    })(),
                    capturedAt: new Date().toISOString(),
                  }),
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
              const fallbackAnalysis = await tx.analysis.create({
                data: {
                  documentId,
                  overallScore: (report.overallScore as number) || 0,
                  noiseScore: (report.noiseScore as number) || 0,
                  summary: (report.summary as string) || '',
                  modelVersion: process.env.GEMINI_MODEL_NAME ?? 'gemini-3-flash-preview',
                  version: nextVersion,
                  ...(previousAnalysisIdAcrossVersions
                    ? { previousAnalysisId: previousAnalysisIdAcrossVersions }
                    : {}),
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

              createdAnalysisId = fallbackAnalysis.id;

              await tx.document.update({
                where: { id: documentId },
                data: { status: 'complete' },
              });
            });
          }

          // Register prompt version and link to analysis (fire and forget)
          if (createdAnalysisId) {
            const analysisIdForPrompt = createdAnalysisId;
            import('@/lib/prompts/registry')
              .then(async ({ registerPrompt }) => {
                const promptContent = `model:${process.env.GEMINI_MODEL_NAME ?? 'gemini-3-flash-preview'}|nodes:${Object.keys(NODE_LABELS).join(',')}`;
                const { id: promptVersionId } = await registerPrompt(
                  'analysis_pipeline',
                  promptContent
                );
                await prisma.analysis
                  .update({
                    where: { id: analysisIdForPrompt },
                    data: { promptVersionId },
                  })
                  .catch(() => {}); // Schema drift — column may not exist
              })
              .catch((err: unknown) => {
                log.warn(
                  'Prompt registration failed (non-critical): ' +
                    (err instanceof Error ? err.message : String(err))
                );
              });
          }

          // 1.3a deep — auto-fire the Dalio structural-assumptions audit
          // as a background step right after the main analysis lands. Runs
          // outside the 12-node pipeline (avoids DQI drift) but persists
          // findings so the analysis detail page renders the macro layer
          // without the user clicking "Run audit." Fire-and-forget; never
          // blocks the SSE pipeline.
          if (createdAnalysisId) {
            const analysisIdForStructural = createdAnalysisId;
            // Best-effort POST through the existing route so RBAC, prompt
            // assembly, and persistence all live in one place.
            (async () => {
              try {
                const baseUrl =
                  process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || '';
                if (!baseUrl) return;
                // Pass the auth cookie so the in-band POST resolves the
                // same Supabase user context as the original SSE call.
                const cookie = request.headers.get('cookie') ?? '';
                await fetch(
                  `${baseUrl}/api/analysis/${analysisIdForStructural}/structural-assumptions`,
                  {
                    method: 'POST',
                    headers: cookie ? { cookie } : undefined,
                  }
                );
              } catch (err) {
                log.warn(
                  'Auto structural-assumptions run failed (non-critical): ' +
                    (err instanceof Error ? err.message : String(err))
                );
              }
            })().catch(() => null);
          }

          // 3.1 deep — auto-trigger cross-document review when this doc is
          // attached to a deal that now has ≥2 analyzed documents. Runs in
          // the background; never blocks the SSE pipeline. Uses the same
          // RBAC + agent path as the manual button on the deal page.
          //
          // 30-minute cooldown (added 2026-04-26 for parity with the
          // package-side auto-trigger below): prevents a burst-fire when a
          // deal team uploads several docs back-to-back, which would
          // otherwise burn ~£0.40 per Gemini call × N. The manual button
          // on the deal page bypasses this cooldown via its own rate
          // limiter.
          if (doc.dealId) {
            const dealIdForCrossRef = doc.dealId;
            (async () => {
              try {
                const analyzedCount = await prisma.document.count({
                  where: {
                    dealId: dealIdForCrossRef,
                    deletedAt: null,
                    analyses: { some: {} },
                  },
                });
                if (analyzedCount < 2) return;

                const RECENT_DEAL_RUN_MS = 30 * 60 * 1000;
                const recent = await prisma.dealCrossReference
                  .findFirst({
                    where: {
                      dealId: dealIdForCrossRef,
                      runAt: { gt: new Date(Date.now() - RECENT_DEAL_RUN_MS) },
                    },
                    select: { id: true },
                  })
                  .catch(() => null);
                if (recent) {
                  log.info(
                    `Auto cross-reference for deal ${dealIdForCrossRef} skipped: recent run within ${RECENT_DEAL_RUN_MS / 60_000} minutes`
                  );
                  return;
                }

                // Pull all analyzed docs on the deal — owner-context run, not
                // teammate-context, so we use the document owner's userId.
                // The auto-trigger represents the OWNER's action (their doc
                // just landed). Visibility filtering is handled implicitly
                // because we read all docs on the deal regardless and the
                // agent doesn't expose results until the user opens the
                // deal page (which is itself RBAC-gated).
                const docs = await prisma.document.findMany({
                  where: { dealId: dealIdForCrossRef, deletedAt: null },
                  select: {
                    id: true,
                    filename: true,
                    content: true,
                    contentEncrypted: true,
                    contentIv: true,
                    contentTag: true,
                    contentKeyVersion: true,
                    analyses: {
                      orderBy: { createdAt: 'desc' },
                      take: 1,
                      select: {
                        id: true,
                        overallScore: true,
                        biases: {
                          select: { biasType: true, severity: true },
                          take: 5,
                        },
                      },
                    },
                  },
                });

                const { runCrossReferenceAgent } = await import('@/lib/agents/cross-reference');
                const { getDocumentContent: decrypt } = await import('@/lib/utils/encryption');
                const inputs = docs
                  .map(d => {
                    const a = d.analyses?.[0];
                    if (!a) return null;
                    const content = decrypt(d as Parameters<typeof decrypt>[0]);
                    if (!content || content.trim().length < 200) return null;
                    return {
                      documentId: d.id,
                      documentName: d.filename,
                      analysisId: a.id,
                      overallScore: a.overallScore,
                      content,
                      topBiases: a.biases.map(b => ({
                        biasType: b.biasType,
                        severity: b.severity ?? null,
                      })),
                    };
                  })
                  .filter((x): x is NonNullable<typeof x> => x !== null);
                if (inputs.length < 2) return;

                const output = await runCrossReferenceAgent(inputs);
                const conflictCount = output.findings.length;
                const highSeverityCount = output.findings.filter(
                  f => f.severity === 'critical' || f.severity === 'high'
                ).length;

                await prisma.dealCrossReference.create({
                  data: {
                    dealId: dealIdForCrossRef,
                    documentSnapshot: output.documentSnapshot as unknown as Prisma.InputJsonValue,
                    findings: output as unknown as Prisma.InputJsonValue,
                    conflictCount,
                    highSeverityCount,
                    status: 'complete',
                  },
                });
                log.info(
                  `Auto cross-reference run complete for deal ${dealIdForCrossRef}: ${conflictCount} conflicts, ${highSeverityCount} high-severity`
                );
              } catch (err) {
                log.warn(
                  'Auto cross-reference run failed (non-critical): ' +
                    (err instanceof Error ? err.message : String(err))
                );
              }
            })().catch(() => null);
          }

          // 4.4 deep — DecisionPackage auto-recompute + cross-reference. Same
          // shape as the deal hook above, but for non-deal contexts. A doc
          // can sit in 0..n packages; we recompute every package the doc is
          // in, then auto-fire the cross-ref agent for each that has ≥2
          // analyzed members and no run in the last 30 minutes (avoids a
          // burst-fire when a CSO uploads several docs sequentially).
          (async () => {
            try {
              const memberships = await prisma.decisionPackageDocument
                .findMany({
                  where: { documentId },
                  select: { packageId: true },
                })
                .catch(() => [] as Array<{ packageId: string }>);
              if (memberships.length === 0) return;

              const { recomputePackageMetrics } = await import('@/lib/scoring/package-aggregation');
              const { runCrossReferenceAgent } = await import('@/lib/agents/cross-reference');
              const { getDocumentContent: decrypt } = await import('@/lib/utils/encryption');

              const RECENT_RUN_MS = 30 * 60 * 1000;
              for (const m of memberships) {
                await recomputePackageMetrics(m.packageId);

                // Cross-ref auto-trigger: ≥2 analyzed docs AND no run in
                // the last 30min. Mirrors the deal hook's "fresh material
                // arrived" semantics.
                const analyzedCount = await prisma.decisionPackageDocument.count({
                  where: {
                    packageId: m.packageId,
                    document: { deletedAt: null, analyses: { some: {} } },
                  },
                });
                if (analyzedCount < 2) continue;
                const recent = await prisma.decisionPackageCrossReference
                  .findFirst({
                    where: { packageId: m.packageId },
                    orderBy: { runAt: 'desc' },
                    select: { runAt: true },
                  })
                  .catch(() => null);
                if (recent && Date.now() - recent.runAt.getTime() < RECENT_RUN_MS) continue;

                const docs = await prisma.decisionPackageDocument.findMany({
                  where: {
                    packageId: m.packageId,
                    document: { deletedAt: null },
                  },
                  select: {
                    document: {
                      select: {
                        id: true,
                        filename: true,
                        content: true,
                        contentEncrypted: true,
                        contentIv: true,
                        contentTag: true,
                        contentKeyVersion: true,
                        analyses: {
                          orderBy: { createdAt: 'desc' },
                          take: 1,
                          select: {
                            id: true,
                            overallScore: true,
                            biases: {
                              select: { biasType: true, severity: true },
                              take: 5,
                            },
                          },
                        },
                      },
                    },
                  },
                });

                const inputs = docs
                  .map(row => {
                    const a = row.document.analyses[0];
                    if (!a) return null;
                    const content = decrypt(row.document as Parameters<typeof decrypt>[0]);
                    if (!content || content.trim().length < 200) return null;
                    return {
                      documentId: row.document.id,
                      documentName: row.document.filename,
                      analysisId: a.id,
                      overallScore: a.overallScore,
                      content,
                      topBiases: a.biases.map(b => ({
                        biasType: b.biasType,
                        severity: b.severity ?? null,
                      })),
                    };
                  })
                  .filter((x): x is NonNullable<typeof x> => x !== null);
                if (inputs.length < 2) continue;

                const output = await runCrossReferenceAgent(inputs);
                const conflictCount = output.findings.length;
                const highSeverityCount = output.findings.filter(
                  f => f.severity === 'critical' || f.severity === 'high'
                ).length;

                await prisma.decisionPackageCrossReference.create({
                  data: {
                    packageId: m.packageId,
                    documentSnapshot: output.documentSnapshot as unknown as Prisma.InputJsonValue,
                    findings: output as unknown as Prisma.InputJsonValue,
                    conflictCount,
                    highSeverityCount,
                    status: 'complete',
                  },
                });
                await recomputePackageMetrics(m.packageId);
                log.info(
                  `Auto package cross-reference for ${m.packageId}: ${conflictCount} conflicts, ${highSeverityCount} high-severity`
                );
              }
            } catch (err) {
              log.warn(
                'Auto package recompute failed (non-critical): ' +
                  (err instanceof Error ? err.message : String(err))
              );
            }
          })().catch(() => null);

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
            tokens: docContent.length, // Approximate token count from content length
            cost: estimateCost(
              process.env.GEMINI_MODEL_NAME ?? 'gemini-3-flash-preview',
              docContent.length,
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

          // M6.4 — Analysis-path nudge generation (Bias Detective → Nudges)
          //
          // Previously nudges only fired from /api/human-decisions and the
          // Slack/meeting paths. The analysis completion path was silent —
          // meaning a user could upload a memo, see detected biases, and
          // never receive an actionable follow-up. This closes that gap.
          //
          // Non-blocking: failures here must not fail the analysis.
          if (createdAnalysisId && detectedBiases.length > 0) {
            try {
              const { generateNudges } = await import('@/lib/nudges/engine');
              // Every document uploaded through the analysis pipeline is by
              // definition a strategic decision (IC memo, pitch deck, board
              // proposal). The nudge engine's highStakesTypes check expects
              // DecisionType enum values ('strategic' | 'vendor_eval' |
              // 'approval'), NOT document-type values ('ic_memo' |
              // 'pitch_deck'). Hardcoding 'strategic' ensures pre-mortem and
              // shallow-verification nudges fire correctly for analysis-path
              // decisions. (BUG-2 fix)
              const analysisPathDecision = {
                source: 'manual' as const, // closest valid DecisionSource for analysis path
                sourceRef: createdAnalysisId,
                channel: undefined,
                content: (report.summary as string) || '',
                decisionType: 'strategic' as const,
                participants: (report.speakers as string[]) || [],
              };
              const auditResultForNudges = {
                decisionQualityScore: (report.overallScore as number) || 0,
                biasFindings: detectedBiases.map((b: Record<string, unknown>) => ({
                  biasType: String(b.biasType ?? ''),
                  severity: String(b.severity ?? 'low'),
                  confidence: typeof b.confidence === 'number' ? b.confidence : 0.5,
                  evidence: String(b.excerpt ?? ''),
                })),
                summary: (report.metaVerdict as string) || (report.summary as string) || '',
                dissenterCount: 0,
                noiseLevel:
                  typeof (report.noiseStats as { stdDev?: number })?.stdDev === 'number'
                    ? (report.noiseStats as { stdDev: number }).stdDev
                    : 0,
              };

              const nudges = await generateNudges({
                decision: analysisPathDecision as unknown as Parameters<
                  typeof generateNudges
                >[0]['decision'],
                auditResult: auditResultForNudges as unknown as Parameters<
                  typeof generateNudges
                >[0]['auditResult'],
              });

              // Persist nudges with analysisId linkage (M6 schema addition)
              for (const nudge of nudges) {
                try {
                  await prisma.nudge.create({
                    data: {
                      analysisId: createdAnalysisId,
                      targetUserId: userId,
                      orgId: doc.orgId ?? null,
                      nudgeType: nudge.nudgeType,
                      triggerReason: nudge.triggerReason,
                      message: nudge.message,
                      severity: nudge.severity,
                      channel: nudge.channel,
                      ...(nudge.experimentId && { experimentId: nudge.experimentId }),
                      ...(nudge.variantId && { variantId: nudge.variantId }),
                    },
                  });
                } catch (nudgeErr) {
                  log.debug(
                    'Failed to persist analysis-path nudge (non-critical):',
                    nudgeErr instanceof Error ? nudgeErr.message : String(nudgeErr)
                  );
                }
              }

              if (nudges.length > 0) {
                log.info(
                  `Analysis-path nudges created: ${nudges.length} for analysis ${createdAnalysisId}`
                );
              }
            } catch (nudgeErr) {
              log.warn(
                'Analysis-path nudge generation failed (non-critical): ' +
                  (nudgeErr instanceof Error ? nudgeErr.message : String(nudgeErr))
              );
            }
          }

          // Send email notification (fire and forget)
          if (user?.email) {
            const userEmail = user.email;
            import('@/lib/notifications/email')
              .then(({ notifyAnalysisComplete }) =>
                notifyAnalysisComplete(
                  userId,
                  userEmail,
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

          // Send final complete. Inject analysisId into the payload so
          // the client (InlineAnalysisResultCard, CounterfactualPanel)
          // can skip a follow-up round-trip to /api/documents/[id] and
          // render the counterfactual + DPR buttons immediately.
          const completePayload =
            createdAnalysisId && result.finalReport && typeof result.finalReport === 'object'
              ? {
                  ...(result.finalReport as Record<string, unknown>),
                  analysisId: createdAnalysisId,
                }
              : result.finalReport;
          sendUpdate({ type: 'complete', progress: 100, result: completePayload });

          // Emit webhook event (non-blocking, fire-and-forget)
          try {
            const { emitWebhookEvent } = await import('@/lib/integrations/webhooks/engine');
            if (createdAnalysisId) {
              emitWebhookEvent(
                'analysis.completed',
                {
                  analysisId: createdAnalysisId,
                  documentId,
                  score: report.overallScore ?? 0,
                  biasCount: detectedBiases.length,
                },
                doc.orgId || userId!
              );
            }
          } catch {
            // Non-critical — webhook table may not exist
          }

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
                    content: docContent.slice(0, 5000), // Truncate for storage
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
