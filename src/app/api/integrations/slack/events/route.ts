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
import {
  verifySlackSignature,
  slackEventToDecisionInput,
  slackEventToPreDecisionInput,
  isDecisionMessage,
  detectMessageBiases,
  generatePreDecisionNudge,
  getEscalatedSeverity,
  formatAuditSummaryForSlack,
  publishAppHome,
} from '@/lib/integrations/slack/handler';
import { prisma } from '@/lib/prisma';
import { toPrismaStringArray, toPrismaJson } from '@/lib/utils/prisma-json';
import { analyzeHumanDecision } from '@/lib/human-audit/analyzer';
import { generateNudges } from '@/lib/nudges/engine';
import { deliverSlackNudge, formatNudgeForSlack } from '@/lib/integrations/slack/handler';
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
      // App Home tab opened
      if (payload.event?.type === 'app_home_opened' && payload.event?.tab === 'home') {
        void publishAppHome(payload.event.user, payload.team_id).catch(err => {
          log.warn('App Home publish failed:', err);
        });
        return NextResponse.json({ ok: true });
      }

      const decisionInput = slackEventToDecisionInput(payload);

      if (!decisionInput) {
        // ── Thread Monitoring: check if this message is in a tracked DecisionFrame thread ──
        const event = payload.event;
        const threadChannel = event?.channel;
        const threadTs = event?.thread_ts || event?.ts;

        if (threadChannel && threadTs) {
          try {
            const existingFrame = await prisma.decisionFrame.findFirst({
              where: { channelId: threadChannel, threadTs },
              select: {
                id: true,
                escalationLevel: true,
                nudgeCount: true,
                linkedDecisionId: true,
                accumulatedBiases: true,
                orgId: true,
              },
            });

            if (existingFrame && !existingFrame.linkedDecisionId) {
              const messageText = event?.text || '';

              // Check if deliberation has escalated to a commitment
              if (isDecisionMessage(messageText)) {
                const teamId = payload.team_id;
                let frameInstallation: { installedByUserId: string; orgId: string | null } | null =
                  null;
                if (teamId) {
                  frameInstallation = await prisma.slackInstallation.findFirst({
                    where: { teamId, status: 'active' },
                    select: { installedByUserId: true, orgId: true },
                  });
                }
                const frameUserId =
                  frameInstallation?.installedByUserId ||
                  process.env.SLACK_SYSTEM_USER_ID ||
                  'system-slack';
                const frameOrgId = frameInstallation?.orgId || teamId || null;

                // Create HumanDecision from the commitment message
                const contentHash = (await import('crypto'))
                  .createHash('sha256')
                  .update(messageText)
                  .digest('hex');
                const existingDecision = await prisma.humanDecision.findUnique({
                  where: { contentHash },
                  select: { id: true },
                });

                if (!existingDecision) {
                  const humanDecision = await prisma.humanDecision.create({
                    data: {
                      userId: frameUserId,
                      orgId: frameOrgId,
                      source: 'slack',
                      sourceRef: `${threadChannel}:${event?.ts}`,
                      channel: threadChannel,
                      participants: toPrismaStringArray([event?.user || '']),
                      content: messageText,
                      contentHash,
                      status: 'pending',
                    },
                  });

                  // Link DecisionFrame → HumanDecision
                  await prisma.decisionFrame.update({
                    where: { id: existingFrame.id },
                    data: { linkedDecisionId: humanDecision.id },
                  });

                  log.info(
                    `Pre-decision thread resolved to decision ${humanDecision.id} in frame ${existingFrame.id}`
                  );

                  // Run audit in background, then post summary card to thread
                  const decisionInputForAudit = slackEventToDecisionInput(payload);
                  if (decisionInputForAudit) {
                    processSlackDecision(humanDecision.id, decisionInputForAudit, teamId)
                      .then(auditResult => {
                        if (auditResult) {
                          const summaryCard = formatAuditSummaryForSlack(
                            {
                              decisionQualityScore: auditResult.decisionQualityScore,
                              noiseScore: auditResult.noiseScore,
                              biasFindings:
                                (auditResult.biasFindings as Array<{
                                  biasType: string;
                                  severity: string;
                                }>) || [],
                              summary: auditResult.summary,
                              analysisUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com'}/dashboard`,
                            },
                            event?.ts
                          );
                          summaryCard.channel = threadChannel;
                          deliverSlackNudge(summaryCard, teamId).catch(() => {});
                        }
                      })
                      .catch(err => {
                        log.error(`Background audit for linked decision failed:`, err);
                      });
                  }
                }
              } else {
                // Thread-aware bias accumulation: only nudge for NEW biases not seen before
                const allDetected = detectMessageBiases(messageText);
                const existingBiasTypes = new Set(
                  ((existingFrame.accumulatedBiases as Array<{ bias: string }>) ?? []).map(
                    b => b.bias
                  )
                );
                const newBiases = allDetected.filter(b => !existingBiasTypes.has(b.bias));

                if (newBiases.length > 0) {
                  const escalated = getEscalatedSeverity(existingFrame.escalationLevel, newBiases);
                  const nudge = await generatePreDecisionNudge(
                    messageText,
                    newBiases,
                    existingFrame.orgId
                  );

                  if (nudge) {
                    const severity = escalated || nudge.severity;
                    const slackPayload = formatNudgeForSlack(
                      {
                        nudgeType: 'pre_decision_coaching',
                        triggerReason: `New biases: ${newBiases.map(b => b.bias).join(', ')}`,
                        message: nudge.message,
                        severity,
                        channel: 'slack',
                      },
                      threadTs
                    );
                    slackPayload.channel = threadChannel;
                    deliverSlackNudge(slackPayload, payload.team_id).catch(err => {
                      log.error('Thread nudge delivery failed:', err);
                    });
                  }

                  // Accumulate biases on the frame
                  const updatedBiases = [
                    ...((existingFrame.accumulatedBiases as Array<unknown>) ?? []),
                    ...newBiases.map(b => ({
                      ...b,
                      detectedAt: new Date().toISOString(),
                    })),
                  ];

                  await prisma.decisionFrame.update({
                    where: { id: existingFrame.id },
                    data: {
                      accumulatedBiases: updatedBiases,
                      escalationLevel: escalated || existingFrame.escalationLevel,
                      nudgeCount: { increment: 1 },
                    },
                  });

                  log.info(
                    `Thread bias accumulation: ${newBiases.length} new bias(es) in frame ${existingFrame.id}`
                  );
                }
              }
            }
          } catch (frameErr) {
            const msg = frameErr instanceof Error ? frameErr.message : String(frameErr);
            if (!msg.includes('P2021') && !msg.includes('P2022')) {
              log.warn('Thread monitoring failed (non-critical):', msg);
            }
          }
        }

        // Check for pre-decision deliberation messages and deliver coaching nudges
        // Resolve org context for calibrated nudges
        let preDecisionOrgId: string | null = null;
        if (payload.team_id) {
          try {
            const inst = await prisma.slackInstallation.findFirst({
              where: { teamId: payload.team_id, status: 'active' },
              select: { orgId: true },
            });
            preDecisionOrgId = inst?.orgId ?? null;
          } catch {
            /* schema drift */
          }
        }
        const preDecision = await slackEventToPreDecisionInput(payload, preDecisionOrgId);
        if (preDecision?.nudge) {
          const teamId = payload.team_id;
          const [channel, threadTs] = (preDecision.input.sourceRef ?? '').split(':');
          if (channel) {
            const slackPayload = formatNudgeForSlack(
              {
                nudgeType: 'pre_decision_coaching',
                triggerReason: preDecision.biases.map(b => b.bias).join(', '),
                message: preDecision.nudge.message,
                severity: preDecision.nudge.severity,
                channel: 'slack',
              },
              threadTs
            );
            slackPayload.channel = channel;
            deliverSlackNudge(slackPayload, teamId).catch(err => {
              log.error('Pre-decision nudge delivery failed:', err);
            });
          }

          // Auto-create DecisionFrame from pre-decision message
          if (preDecision.frame) {
            try {
              const frameTeamId = payload.team_id;
              let frameInstallation: { installedByUserId: string; orgId: string | null } | null =
                null;
              if (frameTeamId) {
                frameInstallation = await prisma.slackInstallation.findFirst({
                  where: { teamId: frameTeamId, status: 'active' },
                  select: { installedByUserId: true, orgId: true },
                });
              }
              const frameUserId =
                frameInstallation?.installedByUserId ||
                process.env.SLACK_SYSTEM_USER_ID ||
                'system-slack';
              const frameOrgId = frameInstallation?.orgId || frameTeamId || null;

              const [frameChannel, frameThreadTs] = (preDecision.input.sourceRef ?? '').split(':');
              await prisma.decisionFrame.create({
                data: {
                  userId: frameUserId,
                  orgId: frameOrgId,
                  decisionStatement: preDecision.frame.decisionStatement,
                  defaultAction: preDecision.input.content.slice(0, 500),
                  successCriteria: [],
                  failureCriteria: [],
                  stakeholders: preDecision.frame.stakeholders,
                  channelId: frameChannel || null,
                  threadTs: frameThreadTs || null,
                  nudgeCount: 1,
                  escalationLevel: preDecision.nudge?.severity ?? 'info',
                  accumulatedBiases: preDecision.biases.map(b => ({
                    ...b,
                    detectedAt: new Date().toISOString(),
                  })),
                },
              });

              // Ask for prior confidence in the Slack thread
              const [priorChannel, priorThreadTs] = (preDecision.input.sourceRef ?? '').split(':');
              if (priorChannel) {
                const priorPrompt = formatNudgeForSlack(
                  {
                    nudgeType: 'pre_decision_coaching',
                    triggerReason: 'Decision frame captured — collecting prior',
                    message: `Decision captured: "${preDecision.frame.decisionStatement.slice(0, 100)}"\n\nBefore the AI audit, reply in this thread with your position and confidence (e.g. "approve 80%" or "reject 30%") to build your calibration curve.`,
                    severity: 'info',
                    channel: 'slack',
                  },
                  priorThreadTs
                );
                priorPrompt.channel = priorChannel;
                deliverSlackNudge(priorPrompt, frameTeamId).catch(() => {});
              }

              log.info(`DecisionFrame auto-created from Slack pre-decision in channel ${channel}`);
            } catch (frameErr) {
              const msg = frameErr instanceof Error ? frameErr.message : String(frameErr);
              if (!msg.includes('P2021') && !msg.includes('P2022')) {
                log.error('DecisionFrame auto-creation failed:', msg);
              }
            }
          }

          // Capture DecisionPrior from Slack thread replies
          // If a user replies in the thread with their position (e.g. "approve 80%" or "reject, 40%"),
          // we parse it and create a DecisionPrior record directly from Slack.
          try {
            const event = payload.event;
            const replyText = event?.text?.toLowerCase()?.trim() || '';
            const threadTs = event?.thread_ts;

            // Only process thread replies (not top-level messages)
            if (threadTs && replyText.length > 0) {
              // Parse confidence from reply: look for patterns like "approve 80", "reject 30%", "pass, high confidence"
              const confidenceMatch = replyText.match(/(\d{1,3})\s*%?/);
              const actionMatch = replyText.match(/\b(approve|reject|pass|abstain|yes|no)\b/i);

              if (actionMatch || confidenceMatch) {
                const confidence = confidenceMatch
                  ? Math.min(100, parseInt(confidenceMatch[1]))
                  : 50;
                const action = actionMatch?.[1] || 'undecided';

                // Find the HumanDecision for this thread (created from the pre-decision message)
                const sourceRef = `${event?.channel}:${threadTs}`;
                const humanDecision = await prisma.humanDecision.findFirst({
                  where: { source: 'slack', sourceRef },
                  select: { id: true, userId: true, linkedAnalysisId: true },
                  orderBy: { createdAt: 'desc' },
                });

                if (humanDecision?.linkedAnalysisId) {
                  await prisma.decisionPrior.upsert({
                    where: { analysisId: humanDecision.linkedAnalysisId },
                    create: {
                      analysisId: humanDecision.linkedAnalysisId,
                      userId: humanDecision.userId,
                      defaultAction: action,
                      confidence,
                      evidenceToChange: replyText,
                    },
                    update: {
                      defaultAction: action,
                      confidence,
                      evidenceToChange: replyText,
                    },
                  });
                  log.info(
                    `DecisionPrior captured from Slack thread reply (confidence: ${confidence}%, action: ${action})`
                  );
                }
              }
            }
          } catch (priorErr) {
            const msg = priorErr instanceof Error ? priorErr.message : String(priorErr);
            if (!msg.includes('P2021') && !msg.includes('P2022')) {
              log.warn('DecisionPrior capture from Slack failed (non-critical):', msg);
            }
          }

          return NextResponse.json({ ok: true, preDecision: true });
        }

        // Check for outcome signals in non-decision messages (fire-and-forget)
        try {
          const { processSlackOutcomeSignal } = await import('@/lib/integrations/slack/handler');
          processSlackOutcomeSignal(payload).catch(err => {
            log.warn('Slack outcome signal processing failed (non-critical):', err);
          });
        } catch {
          // outcome-inference module not available — skip silently
        }

        // Not a decision-relevant message — acknowledge silently
        return NextResponse.json({ ok: true });
      }

      // Look up workspace installation for multi-tenant support
      const teamId = payload.team_id;
      let installation: { installedByUserId: string; orgId: string | null } | null = null;

      if (teamId) {
        installation = await prisma.slackInstallation.findUnique({
          where: { teamId, status: 'active' },
          select: { installedByUserId: true, orgId: true },
        });
      }

      if (!installation && !process.env.SLACK_BOT_TOKEN) {
        // No installation record and no legacy env var — reject
        log.warn(`No active Slack installation for team ${teamId}`);
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

      // Use installation context or fall back to legacy env vars
      const userId =
        installation?.installedByUserId || process.env.SLACK_SYSTEM_USER_ID || 'system-slack';
      const orgId = installation?.orgId || teamId;

      const humanDecision = await prisma.humanDecision.create({
        data: {
          userId,
          orgId,
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
      processSlackDecision(humanDecision.id, decisionInput, teamId).catch(err => {
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
  input: Parameters<typeof analyzeHumanDecision>[0],
  teamId?: string
): Promise<{
  decisionQualityScore: number;
  noiseScore: number;
  biasFindings: unknown;
  summary: string;
} | null> {
  try {
    const auditResult = await analyzeHumanDecision(input, { decisionId });

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

    // Generate and persist nudges, deliver critical ones back to Slack
    const nudges = await generateNudges({ decision: input, auditResult });
    const sourceRef = input.sourceRef; // e.g. "C12345:1234567890.123456"

    for (const nudge of nudges) {
      const nudgeRecord = await prisma.nudge
        .create({
          data: {
            humanDecisionId: decisionId,
            nudgeType: nudge.nudgeType,
            triggerReason: nudge.triggerReason,
            message: nudge.message,
            severity: nudge.severity,
            channel: 'slack',
            ...(nudge.experimentId && { experimentId: nudge.experimentId }),
            ...(nudge.variantId && { variantId: nudge.variantId }),
          },
        })
        .catch(err => {
          log.error('Nudge persist failed:', err);
          return null;
        });

      // Deliver critical/warning nudges back to the Slack thread
      if (
        nudgeRecord &&
        (nudge.severity === 'critical' || nudge.severity === 'warning') &&
        sourceRef
      ) {
        const [channel, threadTs] = sourceRef.split(':');
        if (channel) {
          const slackPayload = formatNudgeForSlack(nudge, threadTs);
          slackPayload.channel = channel;
          const delivered = await deliverSlackNudge(slackPayload, teamId);
          if (delivered) {
            await prisma.nudge
              .update({
                where: { id: nudgeRecord.id },
                data: { deliveredAt: new Date() },
              })
              .catch(() => {});
          }
        }
      }
    }

    log.info(`Slack decision ${decisionId} audited: score=${auditResult.decisionQualityScore}`);
    return {
      decisionQualityScore: auditResult.decisionQualityScore,
      noiseScore: auditResult.noiseScore,
      biasFindings: auditResult.biasFindings,
      summary: auditResult.summary,
    };
  } catch (error) {
    log.error(`Slack decision audit failed for ${decisionId}:`, error);
    await prisma.humanDecision
      .update({ where: { id: decisionId }, data: { status: 'error' } })
      .catch(() => {});
    return null;
  }
}
