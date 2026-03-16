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
import { generateNudges } from '@/lib/nudges/engine';
import { logAudit } from '@/lib/audit';
import {
  BiasFindings,
  CognitiveAuditNoiseStats,
  CognitiveAuditSentiment,
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

    const validSources = ['slack', 'meeting_transcript', 'email', 'jira', 'manual'];
    if (!validSources.includes(body.source)) {
      return NextResponse.json(
        { error: `Invalid source. Must be one of: ${validSources.join(', ')}` },
        { status: 400 }
      );
    }

    // Deduplicate by content hash
    const contentHash = crypto
      .createHash('sha256')
      .update(body.content)
      .digest('hex');

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
    runCognitiveAudit(humanDecision!.id, body, user.id).catch((err) => {
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
    return NextResponse.json(
      { error: getSafeErrorMessage(error) },
      { status: 500 }
    );
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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const offset = (page - 1) * limit;
    const source = searchParams.get('source');

    const where: Record<string, unknown> = { userId: user.id };
    if (source) where.source = source;

    const [decisions, total] = await Promise.all([
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
              acknowledgedAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      }),
      prisma.humanDecision.count({ where }),
    ]);

    return NextResponse.json({
      decisions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    log.error('Human Decision List error:', error);
    return NextResponse.json(
      { error: getSafeErrorMessage(error) },
      { status: 500 }
    );
  }
}

// ─── Background Audit ────────────────────────────────────────────────────────

async function runCognitiveAudit(
  decisionId: string,
  input: HumanDecisionInput,
  userId: string
) {
  try {
    log.info(`Starting cognitive audit for decision ${decisionId}`);

    const auditResult = await analyzeHumanDecision(input, { userId });

    // Validate LLM outputs with Zod before persisting (matches existing pattern)
    const validatedBiases = BiasFindings.safeParse(auditResult.biasFindings).success
      ? auditResult.biasFindings
      : BiasFindings.parse([]);
    const validatedNoiseStats = CognitiveAuditNoiseStats.safeParse(auditResult.noiseStats).success
      ? auditResult.noiseStats
      : CognitiveAuditNoiseStats.parse({});
    const validatedSentiment = CognitiveAuditSentiment.safeParse(auditResult.sentimentDetail).success
      ? auditResult.sentimentDetail
      : CognitiveAuditSentiment.parse({});

    // Persist cognitive audit with schema drift protection
    let schemaDrift = false;
    try {
      await prisma.$transaction(async (tx) => {
        await tx.cognitiveAudit.create({
          data: {
            humanDecisionId: decisionId,
            decisionQualityScore: auditResult.decisionQualityScore,
            noiseScore: auditResult.noiseScore,
            sentimentScore: auditResult.sentimentScore,
            biasFindings: toPrismaJson(validatedBiases),
            noiseStats: toPrismaJson(validatedNoiseStats),
            sentimentDetail: toPrismaJson(validatedSentiment),
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

    // Generate nudges
    const nudges = generateNudges({
      decision: input,
      auditResult,
    });

    // Persist nudges (fire-and-forget)
    for (const nudge of nudges) {
      await prisma.nudge
        .create({
          data: {
            humanDecisionId: decisionId,
            nudgeType: nudge.nudgeType,
            triggerReason: nudge.triggerReason,
            message: nudge.message,
            severity: nudge.severity,
            channel: nudge.channel,
          },
        })
        .catch((err) => {
          log.error('Failed to persist nudge:', err);
        });
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
