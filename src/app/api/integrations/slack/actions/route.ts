/**
 * POST /api/integrations/slack/actions — Slack Interactive Actions handler
 *
 * Receives interactive component payloads (button clicks, menus) from
 * Slack Block Kit messages — specifically nudge feedback buttons
 * (helpful / not helpful).
 *
 * Security: Verifies Slack request signatures (HMAC-SHA256)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/utils/logger';
import { verifySlackSignature } from '@/lib/integrations/slack/handler';
import { prisma } from '@/lib/prisma';

const log = createLogger('SlackActions');

interface SlackActionPayload {
  type: string;
  actions: Array<{
    action_id: string;
    value?: string;
    block_id?: string;
  }>;
  user: { id: string; name?: string };
  team?: { id: string };
  channel?: { id: string };
  message?: { ts: string; thread_ts?: string };
  trigger_id?: string;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // Verify Slack signature
    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    if (!signingSecret) {
      log.error('SLACK_SIGNING_SECRET not configured — rejecting');
      return NextResponse.json({ error: 'Not configured' }, { status: 503 });
    }

    const signature = req.headers.get('x-slack-signature') || '';
    const timestamp = req.headers.get('x-slack-request-timestamp') || '';

    if (!verifySlackSignature(signingSecret, signature, timestamp, rawBody)) {
      log.warn('Invalid Slack signature on actions endpoint');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Slack sends interactive payloads as application/x-www-form-urlencoded
    // with a "payload" field containing JSON
    const params = new URLSearchParams(rawBody);
    const payloadStr = params.get('payload');
    if (!payloadStr) {
      return NextResponse.json({ error: 'Missing payload' }, { status: 400 });
    }

    const payload: SlackActionPayload = JSON.parse(payloadStr);

    if (payload.type !== 'block_actions') {
      return NextResponse.json({ ok: true });
    }

    for (const action of payload.actions) {
      const actionId = action.action_id;
      const nudgeId = action.value;

      if (!nudgeId) continue;

      if (actionId === 'nudge_helpful' || actionId === 'nudge_not_helpful') {
        const wasHelpful = actionId === 'nudge_helpful';

        try {
          await prisma.nudge.update({
            where: { id: nudgeId },
            data: {
              acknowledgedAt: new Date(),
              wasHelpful,
            },
          });

          log.info(
            `Nudge ${nudgeId} marked as ${wasHelpful ? 'helpful' : 'not helpful'} by Slack user ${payload.user.id}`
          );

          // Fire-and-forget: adjust graph edge weights from feedback
          try {
            const { adjustEdgeWeightsFromNudgeFeedback } =
              await import('@/lib/graph/edge-learning');
            void adjustEdgeWeightsFromNudgeFeedback(nudgeId, wasHelpful).catch(err => {
              log.warn('Edge weight adjustment from nudge feedback failed:', err);
            });
          } catch {
            // edge-learning module not available — skip
          }
        } catch (updateErr) {
          const code = (updateErr as { code?: string }).code;
          if (code === 'P2025') {
            log.warn(`Nudge ${nudgeId} not found — may have been deleted`);
          } else if (code !== 'P2021' && code !== 'P2022') {
            log.error('Failed to update nudge from Slack action:', updateErr);
          }
        }
      }
    }

    // Return empty 200 to replace the original message's buttons with confirmation
    return new NextResponse(
      JSON.stringify({
        response_type: 'ephemeral',
        replace_original: false,
        text: 'Thanks for the feedback — it helps calibrate your nudges.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    log.error('Slack actions handler error:', error);
    // Always return 200 to prevent Slack retries
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
