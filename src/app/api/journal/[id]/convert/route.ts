/**
 * Journal Entry Conversion API
 *
 * POST /api/journal/[id]/convert — Convert a journal entry into a HumanDecision
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { isSchemaDrift } from '@/lib/utils/error';
import { analyzeHumanDecision } from '@/lib/human-audit/analyzer';
import { toPrismaJson } from '@/lib/utils/prisma-json';
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
import type { HumanDecisionInput } from '@/types/human-audit';

const log = createLogger('JournalConvertRoute');

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: entryId } = await params;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { decisionStatement, decisionType } = body;

    if (
      !decisionStatement ||
      typeof decisionStatement !== 'string' ||
      decisionStatement.trim().length === 0
    ) {
      return NextResponse.json(
        { error: 'Missing required field: decisionStatement' },
        { status: 400 }
      );
    }

    // Fetch the journal entry and verify ownership
    const entry = await prisma.journalEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 });
    }

    if (entry.userId !== user.id) {
      return NextResponse.json({ error: 'Not authorized to convert this entry' }, { status: 403 });
    }

    if (entry.linkedDecisionId) {
      return NextResponse.json(
        {
          error: 'This journal entry has already been converted',
          linkedDecisionId: entry.linkedDecisionId,
        },
        { status: 409 }
      );
    }

    // Map journal source to a valid DecisionSource
    const sourceMap: Record<string, HumanDecisionInput['source']> = {
      email_forward: 'email',
      calendar_webhook: 'manual',
      manual: 'manual',
      slack_digest: 'slack',
    };
    const decisionSource = sourceMap[entry.source] || 'manual';

    // Create the HumanDecision
    const humanDecision = await prisma.humanDecision.create({
      data: {
        userId: user.id,
        orgId: entry.orgId,
        source: decisionSource,
        sourceRef: entry.sourceRef,
        decisionType: decisionType || entry.decisionType || null,
        participants: entry.participants,
        content: decisionStatement.trim(),
        status: 'pending',
      },
    });

    // Link the journal entry back to the decision
    await prisma.journalEntry.update({
      where: { id: entryId },
      data: {
        linkedDecisionId: humanDecision.id,
        status: 'processed',
        processedAt: new Date(),
      },
    });

    // Fire-and-forget: cognitive audit
    runCognitiveAudit(
      humanDecision.id,
      {
        source: decisionSource,
        sourceRef: entry.sourceRef || undefined,
        decisionType: (decisionType ||
          entry.decisionType ||
          undefined) as HumanDecisionInput['decisionType'],
        participants: entry.participants,
        content: decisionStatement.trim(),
      },
      user.id
    ).catch(err => {
      log.error(`Background audit failed for converted journal entry ${entryId}:`, err);
    });

    // Audit log (fire-and-forget)
    logAudit({
      action: 'SUBMIT_HUMAN_DECISION',
      resource: 'JournalEntry',
      resourceId: entryId,
      details: { convertedTo: humanDecision.id, source: entry.source },
    }).catch(err => log.warn('logAudit SUBMIT_HUMAN_DECISION failed:', err));

    log.info(`Journal entry ${entryId} converted to HumanDecision ${humanDecision.id}`);
    return NextResponse.json(
      {
        humanDecisionId: humanDecision.id,
        journalEntryId: entryId,
        status: 'pending',
        message: 'Journal entry converted to decision and submitted for cognitive audit',
      },
      { status: 201 }
    );
  } catch (error) {
    if (isSchemaDrift(error)) {
      log.debug('Table not available (schema drift)');
      return NextResponse.json({ error: 'Feature not available (schema drift)' }, { status: 503 });
    }
    const msg = error instanceof Error ? error.message : String(error);
    log.error('Failed to convert journal entry:', msg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── Background Audit (mirrors human-decisions/route.ts pattern) ──────────

async function runCognitiveAudit(decisionId: string, input: HumanDecisionInput, userId: string) {
  try {
    log.info(`Starting cognitive audit for converted journal decision ${decisionId}`);

    const auditResult = await analyzeHumanDecision(input, { userId, decisionId });

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
      if (isSchemaDrift(dbError)) {
        schemaDrift = true;
        const prismaError = dbError as { code?: string };
        log.warn('Schema drift in cognitive audit persistence: ' + prismaError.code);
      } else {
        throw dbError;
      }
    }

    if (schemaDrift) {
      await prisma.humanDecision
        .update({ where: { id: decisionId }, data: { status: 'error' } })
        .catch(err => log.warn('Failed to mark HumanDecision status=error after schema drift:', err));
      return;
    }

    log.info(
      `Cognitive audit complete for journal conversion ${decisionId}: score=${auditResult.decisionQualityScore}`
    );
  } catch (error) {
    log.error(`Cognitive audit failed for journal conversion ${decisionId}:`, error);
    await prisma.humanDecision
      .update({ where: { id: decisionId }, data: { status: 'error' } })
      .catch(err => log.warn('Failed to mark HumanDecision status=error after audit failure:', err));
  }
}
