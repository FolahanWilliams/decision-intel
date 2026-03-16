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
import { analyzeHumanDecision } from '@/lib/human-audit/analyzer';
import { generateNudges } from '@/lib/nudges/engine';
import { logAudit } from '@/lib/audit';
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
      const code = (dbError as { code?: string })?.code;
      if (code === 'P2021' || code === 'P2022') {
        schemaDrift = true;
      } else {
        throw dbError;
      }
    }

    if (schemaDrift) {
      // Schema drift: the HumanDecision table may not exist yet
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
    // The analysis updates the record status when complete
    runCognitiveAudit(humanDecision!.id, body, user.id).catch((err) => {
      log.error(`Background audit failed for ${humanDecision!.id}:`, err);
    });

    // Audit log
    logAudit({
      action: 'SCAN_DOCUMENT',
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
      { error: 'Failed to submit decision' },
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
    const offset = parseInt(searchParams.get('offset') || '0', 10);
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
              decisionQualityScore: true,
              noiseScore: true,
              summary: true,
              teamConsensusFlag: true,
              createdAt: true,
            },
          },
          nudges: {
            select: {
              id: true,
              nudgeType: true,
              message: true,
              severity: true,
              deliveredAt: true,
              acknowledgedAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      }),
      prisma.humanDecision.count({ where }),
    ]);

    return NextResponse.json({ decisions, total, limit, offset });
  } catch (error) {
    log.error('Human Decision List error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch decisions' },
      { status: 500 }
    );
  }
}

// ─── Background Audit ────────────────────────────────────────────────────────

async function runCognitiveAudit(
  decisionId: string,
  input: HumanDecisionInput,
  _userId: string
) {
  try {
    log.info(`Starting cognitive audit for decision ${decisionId}`);

    // Run the analysis
    const auditResult = await analyzeHumanDecision(input);

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
            biasFindings: toPrismaJson(auditResult.biasFindings),
            noiseStats: toPrismaJson(auditResult.noiseStats),
            sentimentDetail: toPrismaJson(auditResult.sentimentDetail),
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
      const code = (dbError as { code?: string })?.code;
      if (code === 'P2021' || code === 'P2022') {
        schemaDrift = true;
        log.warn('Schema drift in cognitive audit persistence');
      } else {
        throw dbError;
      }
    }

    if (schemaDrift) {
      // Mark decision as error if we can't persist the audit
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
