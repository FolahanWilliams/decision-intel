/**
 * POST /api/integrations/slack/events — Slack Events API webhook handler
 *
 * Receives Slack events (messages, reactions) and routes decision-relevant
 * messages into the human cognitive audit pipeline.
 *
 * Handles:
 * - url_verification (Slack challenge handshake)
 * - event_callback (message events)
 *
 * Security:
 * - Verifies Slack request signatures (HMAC-SHA256)
 * - Rejects replay attacks (5-minute timestamp window)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/utils/logger';
import { verifySlackSignature, slackEventToDecisionInput } from '@/lib/integrations/slack/handler';
import { prisma } from '@/lib/prisma';
import { toPrismaStringArray, toPrismaJson } from '@/lib/utils/prisma-json';
import { analyzeHumanDecision } from '@/lib/human-audit/analyzer';
import { generateNudges } from '@/lib/nudges/engine';
import {
  BiasFindings,
  CognitiveAuditNoiseStats,
  CognitiveAuditSentiment,
} from '@/lib/schemas/human-audit';
import crypto from 'crypto';
import type { SlackWebhookPayload } from '@/types/human-audit';

const log = createLogger('SlackEvents');

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // Verify Slack signature — require signing secret to prevent unsigned requests
    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    if (!signingSecret) {
      log.error('SLACK_SIGNING_SECRET not configured — rejecting all Slack events');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
    }

    const signature = req.headers.get('x-slack-signature') || '';
    const timestamp = req.headers.get('x-slack-request-timestamp') || '';

    if (!verifySlackSignature(signingSecret, signature, timestamp, rawBody)) {
      log.warn('Invalid Slack signature — rejecting request');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload: SlackWebhookPayload = JSON.parse(rawBody);

    // Handle Slack URL verification challenge
    if (payload.type === 'url_verification' && payload.challenge) {
      return NextResponse.json({ challenge: payload.challenge });
    }

    // Handle event callbacks
    if (payload.type === 'event_callback') {
      const decisionInput = slackEventToDecisionInput(payload);

      if (!decisionInput) {
        // Not a decision-relevant message — acknowledge silently
        return NextResponse.json({ ok: true });
      }

      // Deduplicate
      const contentHash = crypto.createHash('sha256').update(decisionInput.content).digest('hex');

      const existing = await prisma.humanDecision.findUnique({
        where: { contentHash },
        select: { id: true },
      });

      if (existing) {
        return NextResponse.json({ ok: true, deduplicated: true });
      }

      // Create decision record (use a system user ID for Slack-ingested decisions)
      const systemUserId = process.env.SLACK_SYSTEM_USER_ID || 'system-slack';

      const humanDecision = await prisma.humanDecision.create({
        data: {
          userId: systemUserId,
          orgId: payload.team_id,
          source: 'slack',
          sourceRef: decisionInput.sourceRef,
          channel: decisionInput.channel,
          decisionType: decisionInput.decisionType,
          participants: toPrismaStringArray(decisionInput.participants),
          content: decisionInput.content,
          contentHash,
          status: 'pending',
        },
      });

      // Run audit in background (don't block Slack's 3-second timeout)
      processSlackDecision(humanDecision.id, decisionInput).catch(err => {
        log.error(`Background Slack audit failed for ${humanDecision.id}:`, err);
      });

      return NextResponse.json({ ok: true, decisionId: humanDecision.id });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error('Slack events handler error:', error);
    // Always return 200 to Slack to prevent retries
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 200 });
  }
}

async function processSlackDecision(
  decisionId: string,
  input: Parameters<typeof analyzeHumanDecision>[0]
) {
  try {
    const auditResult = await analyzeHumanDecision(input);

    // Validate LLM outputs with Zod before persisting
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

    // Schema drift protection — separate fallback transaction
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
        log.warn('Schema drift in Slack audit persistence: ' + prismaError.code);
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

    // Generate and persist nudges
    const nudges = generateNudges({ decision: input, auditResult });
    for (const nudge of nudges) {
      await prisma.nudge
        .create({
          data: {
            humanDecisionId: decisionId,
            nudgeType: nudge.nudgeType,
            triggerReason: nudge.triggerReason,
            message: nudge.message,
            severity: nudge.severity,
            channel: 'slack',
          },
        })
        .catch(err => log.error('Nudge persist failed:', err));
    }

    log.info(`Slack decision ${decisionId} audited: score=${auditResult.decisionQualityScore}`);
  } catch (error) {
    log.error(`Slack decision audit failed for ${decisionId}:`, error);
    await prisma.humanDecision
      .update({ where: { id: decisionId }, data: { status: 'error' } })
      .catch(() => {});
  }
}
