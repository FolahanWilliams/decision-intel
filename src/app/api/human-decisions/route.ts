/**
 * POST /api/human-decisions — Submit a human decision for cognitive auditing
 * GET  /api/human-decisions — List human decisions for the authenticated user
 *
 * This is the main ingestion endpoint for Product B.
 * Accepts decisions from manual submission, meeting transcripts, or email threads.
 * (Slack decisions are ingested via /api/integrations/slack/events)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { toPrismaJson, toPrismaStringArray } from '@/lib/utils/prisma-json';
import { createLogger } from '@/lib/utils/logger';
import { getSafeErrorMessage } from '@/lib/utils/error';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { analyzeHumanDecision } from '@/lib/human-audit/analyzer';
import { storeHumanDecisionEmbedding } from '@/lib/rag/embeddings';
import { generateNudges } from '@/lib/nudges/engine';
import { formatNudgeForSlack, deliverSlackNudge } from '@/lib/integrations/slack/handler';
import { logAudit } from '@/lib/audit';
import {
  BiasFindings,
  CognitiveAuditNoiseStats,
  CognitiveAuditSentiment,
  CognitiveAuditCompliance,
  CognitiveAuditPreMortem,
  CognitiveAuditLogicalAnalysis,
  CognitiveAuditSwot,
} from '@/lib/schemas/human-audit';
import crypto from 'crypto';
import type { HumanDecisionInput } from '@/types/human-audit';

const log = createLogger('HumanDecisionAPI');

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting (same budget as document uploads — 5/hour)
    const rateLimitResult = await checkRateLimit(user.id, '/api/human-decisions');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. You can submit up to 5 decisions per hour.',
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

    let body: HumanDecisionInput;
    try {
      body = (await req.json()) as HumanDecisionInput;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Validate required fields
    if (!body.content || !body.source) {
      return NextResponse.json(
        { error: 'Missing required fields: content, source' },
        { status: 400 }
      );
    }

    // Validate content length to prevent unbounded storage
    const MAX_CONTENT_LENGTH = 100_000;
    if (typeof body.content !== 'string' || body.content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: `Content must be a string of at most ${MAX_CONTENT_LENGTH} characters` },
        { status: 400 }
      );
    }

    const validSources = ['slack', 'meeting_transcript', 'email', 'jira', 'manual'];
    if (!validSources.includes(body.source)) {
      return NextResponse.json(
        { error: `Invalid source. Must be one of: ${validSources.join(', ')}` },
        { status: 400 }
      );
    }

    // Deduplicate by content hash
    const contentHash = crypto.createHash('sha256').update(body.content).digest('hex');

    try {
      const existing = await prisma.humanDecision.findUnique({
        where: { contentHash },
        select: { id: true },
      });

      if (existing) {
        return NextResponse.json(
          { id: existing.id, deduplicated: true, message: 'Decision already submitted' },
          { status: 200 }
        );
      }
    } catch (dbError: unknown) {
      const prismaError = dbError as { code?: string; message?: string };
      if (
        prismaError.code === 'P2021' ||
        prismaError.code === 'P2022' ||
        prismaError.message?.includes('does not exist')
      ) {
        log.warn('Schema drift in dedup check (' + prismaError.code + '), table not migrated');
        return NextResponse.json(
          {
            error: 'Database schema not yet migrated. Run: npm run prisma:migrate',
            code: 'SCHEMA_DRIFT',
          },
          { status: 503 }
        );
      }
      throw dbError;
    }

    // Create the human decision record
    let schemaDrift = false;
    let humanDecision;

    try {
      humanDecision = await prisma.humanDecision.create({
        data: {
          userId: user.id,
          source: body.source,
          sourceRef: body.sourceRef,
          channel: body.channel,
          decisionType: body.decisionType,
          participants: toPrismaStringArray(body.participants),
          content: body.content,
          contentHash,
          linkedAnalysisId: body.linkedAnalysisId,
          status: 'pending',
        },
      });
    } catch (dbError: unknown) {
      const prismaError = dbError as { code?: string; message?: string };
      if (
        prismaError.code === 'P2021' ||
        prismaError.code === 'P2022' ||
        prismaError.message?.includes('does not exist')
      ) {
        schemaDrift = true;
      } else {
        throw dbError;
      }
    }

    if (schemaDrift) {
      log.warn('Schema drift detected for HumanDecision — table may not be migrated yet');
      return NextResponse.json(
        {
          error: 'Database schema not yet migrated. Run: npm run prisma:migrate',
          code: 'SCHEMA_DRIFT',
        },
        { status: 503 }
      );
    }

    // Run cognitive audit in the background (fire-and-forget for fast response)
    runCognitiveAudit(humanDecision!.id, body, user.id).catch(err => {
      log.error(`Background audit failed for ${humanDecision!.id}:`, err);
    });

    // Audit log (fire-and-forget)
    logAudit({
      action: 'SUBMIT_HUMAN_DECISION',
      resource: 'HumanDecision',
      resourceId: humanDecision!.id,
      details: { source: body.source, channel: body.channel },
    }).catch(() => {});

    return NextResponse.json(
      {
        id: humanDecision!.id,
        status: 'pending',
        message: 'Decision submitted for cognitive audit',
      },
      { status: 201 }
    );
  } catch (error) {
    log.error('Human Decision API error:', error);
    return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const page = Math.max(1, Math.min(parseInt(searchParams.get('page') || '1', 10), 1000));
    const offset = (page - 1) * limit;
    const source = searchParams.get('source');

    const where: Record<string, unknown> = { userId: user.id };
    if (source) where.source = source;

    let decisions: unknown[] = [];
    let total = 0;

    try {
      [decisions, total] = await Promise.all([
        prisma.humanDecision.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
          include: {
            cognitiveAudit: {
              select: {
                id: true,
                decisionQualityScore: true,
                noiseScore: true,
                sentimentScore: true,
                biasFindings: true,
                summary: true,
                teamConsensusFlag: true,
                dissenterCount: true,
                createdAt: true,
              },
            },
            nudges: {
              select: {
                id: true,
                nudgeType: true,
                message: true,
                severity: true,
                channel: true,
                triggerReason: true,
                acknowledgedAt: true,
                wasHelpful: true,
                createdAt: true,
              },
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        }),
        prisma.humanDecision.count({ where }),
      ]);
    } catch (dbError: unknown) {
      const prismaError = dbError as { code?: string; message?: string };
      if (
        prismaError.code === 'P2021' ||
        prismaError.code === 'P2022' ||
        prismaError.message?.includes('does not exist')
      ) {
        log.warn(
          'Schema drift in HumanDecision list: table not migrated yet (' + prismaError.code + ')'
        );
        return NextResponse.json({
          decisions: [],
          total: 0,
          page,
          totalPages: 0,
        });
      }
      throw dbError;
    }

    return NextResponse.json({
      decisions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    log.error('Human Decision List error:', error);
    return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 });
  }
}

// ─── Background Audit ────────────────────────────────────────────────────────

async function runCognitiveAudit(decisionId: string, input: HumanDecisionInput, userId: string) {
  try {
    log.info(`Starting cognitive audit for decision ${decisionId}`);

    const auditResult = await analyzeHumanDecision(input, { userId, decisionId });

    // Validate LLM outputs with Zod before persisting (matches existing pattern)
    const validatedBiases = BiasFindings.safeParse(auditResult.biasFindings).success
      ? auditResult.biasFindings
      : BiasFindings.parse([]);
    const validatedNoiseStats = CognitiveAuditNoiseStats.safeParse(auditResult.noiseStats).success
      ? auditResult.noiseStats
      : CognitiveAuditNoiseStats.parse({});
    const validatedSentiment = CognitiveAuditSentiment.safeParse(auditResult.sentimentDetail)
      .success
      ? auditResult.sentimentDetail
      : CognitiveAuditSentiment.parse({});
    const validatedCompliance = auditResult.complianceResult
      ? CognitiveAuditCompliance.safeParse(auditResult.complianceResult).success
        ? auditResult.complianceResult
        : undefined
      : undefined;
    const validatedPreMortem = auditResult.preMortem
      ? CognitiveAuditPreMortem.safeParse(auditResult.preMortem).success
        ? auditResult.preMortem
        : undefined
      : undefined;
    const validatedLogicalAnalysis = auditResult.logicalAnalysis
      ? CognitiveAuditLogicalAnalysis.safeParse(auditResult.logicalAnalysis).success
        ? auditResult.logicalAnalysis
        : undefined
      : undefined;
    const validatedSwot = auditResult.swotAnalysis
      ? CognitiveAuditSwot.safeParse(auditResult.swotAnalysis).success
        ? auditResult.swotAnalysis
        : undefined
      : undefined;

    // Persist cognitive audit with schema drift protection
    let schemaDrift = false;
    try {
      await prisma.$transaction(async tx => {
        await tx.cognitiveAudit.create({
          data: {
            humanDecisionId: decisionId,
            decisionQualityScore: auditResult.decisionQualityScore,
            noiseScore: auditResult.noiseScore,
            sentimentScore: auditResult.sentimentScore,
            biasFindings: toPrismaJson(validatedBiases),
            noiseStats: toPrismaJson(validatedNoiseStats),
            sentimentDetail: toPrismaJson(validatedSentiment),
            complianceResult: validatedCompliance ? toPrismaJson(validatedCompliance) : undefined,
            preMortem: validatedPreMortem ? toPrismaJson(validatedPreMortem) : undefined,
            logicalAnalysis: validatedLogicalAnalysis
              ? toPrismaJson(validatedLogicalAnalysis)
              : undefined,
            swotAnalysis: validatedSwot ? toPrismaJson(validatedSwot) : undefined,
            teamConsensusFlag: auditResult.teamConsensusFlag,
            dissenterCount: auditResult.dissenterCount,
            summary: auditResult.summary,
          },
        });

        await tx.humanDecision.update({
          where: { id: decisionId },
          data: { status: 'analyzed' },
        });
      });
    } catch (dbError: unknown) {
      const prismaError = dbError as { code?: string; message?: string };
      if (
        prismaError.code === 'P2021' ||
        prismaError.code === 'P2022' ||
        prismaError.message?.includes('does not exist')
      ) {
        schemaDrift = true;
        log.warn('Schema drift in cognitive audit persistence: ' + prismaError.code);
      } else {
        throw dbError;
      }
    }

    if (schemaDrift) {
      await prisma.humanDecision
        .update({ where: { id: decisionId }, data: { status: 'error' } })
        .catch(() => {});
      return;
    }

    // Embed the decision content for future RAG recall (fire-and-forget)
    // Only works when decision is linked to an existing Document (FK constraint)
    storeHumanDecisionEmbedding(
      decisionId,
      input.content,
      userId,
      auditResult.summary,
      input.linkedAnalysisId
    ).catch(err => log.error('Human decision embedding failed:', err));

    // Generate nudges
    const nudges = generateNudges({
      decision: input,
      auditResult,
    });

    // Persist nudges and deliver via Slack if applicable
    for (const nudge of nudges) {
      try {
        const persisted = await prisma.nudge.create({
          data: {
            humanDecisionId: decisionId,
            nudgeType: nudge.nudgeType,
            triggerReason: nudge.triggerReason,
            message: nudge.message,
            severity: nudge.severity,
            channel: nudge.channel,
          },
        });

        // Deliver critical Slack nudges back to the source channel
        if (nudge.channel === 'slack' && input.channel) {
          const sourceRef = input.sourceRef; // e.g. "C12345:1234567890.123456"
          const threadTs = sourceRef?.includes(':') ? sourceRef.split(':')[1] : undefined;
          const payload = formatNudgeForSlack(nudge, threadTs);
          payload.channel = input.channel;

          deliverSlackNudge(payload)
            .then(async delivered => {
              if (delivered) {
                await prisma.nudge
                  .update({
                    where: { id: persisted.id },
                    data: { deliveredAt: new Date() },
                  })
                  .catch(() => {});
              }
            })
            .catch(err => log.error('Slack nudge delivery failed:', err));
        }

        // Deliver nudges via email for critical/warning severity
        if (nudge.severity === 'critical' || nudge.severity === 'warning') {
          import('@/lib/notifications/email')
            .then(async ({ deliverEmailNudge }) => {
              // Resolve user email from team membership
              const member = await prisma.teamMember.findFirst({
                where: { userId },
                select: { email: true },
              });
              if (member?.email) {
                await deliverEmailNudge(userId, member.email, nudge.message, nudge.nudgeType, nudge.severity);
                await prisma.nudge
                  .update({ where: { id: persisted.id }, data: { deliveredAt: new Date() } })
                  .catch(() => {});
              }
            })
            .catch(err => log.error('Email nudge delivery failed:', err));
        }
      } catch (err) {
        log.error('Failed to persist nudge:', err);
      }
    }

    log.info(
      `Cognitive audit complete for ${decisionId}: score=${auditResult.decisionQualityScore}, nudges=${nudges.length}`
    );
  } catch (error) {
    log.error(`Cognitive audit failed for ${decisionId}:`, error);
    await prisma.humanDecision
      .update({ where: { id: decisionId }, data: { status: 'error' } })
      .catch(() => {});
  }
}
