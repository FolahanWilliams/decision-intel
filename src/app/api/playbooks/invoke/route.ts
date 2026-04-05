/**
 * Playbook Invocation API (M6.3)
 *
 * POST   /api/playbooks/invoke        — User clicks "Run this Playbook" in
 *                                       the Act-on-this panel. Creates a
 *                                       PlaybookInvocation row and schedules
 *                                       a 48h follow-up nudge.
 *
 * The matching PATCH /api/playbooks/invoke/[id] handler lives in
 * `./[id]/route.ts` and captures the effectiveness rating when the user
 * closes the loop ("Went well" / "Didn't help" / "Changed my mind").
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { BUILT_IN_PLAYBOOKS } from '@/lib/playbooks/templates';

const log = createLogger('PlaybookInvokeAPI');

interface InvokeBody {
  playbookId: string;
  analysisId?: string;
  humanDecisionId?: string;
  matchedToxicCombo?: string;
  source?: 'suggestion' | 'manual' | 'nudge';
}

function resolveBuiltinPlaybook(
  playbookId: string
): { name: string; category: string } | null {
  if (!playbookId.startsWith('builtin_')) return null;
  const idx = parseInt(playbookId.slice('builtin_'.length), 10);
  if (!Number.isFinite(idx) || idx < 0 || idx >= BUILT_IN_PLAYBOOKS.length) return null;
  const p = BUILT_IN_PLAYBOOKS[idx];
  return { name: p.name, category: p.category };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rate = await checkRateLimit(user.id, '/api/playbooks/invoke', {
      windowMs: 60 * 60 * 1000,
      maxRequests: 60,
    });
    if (!rate.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = (await req.json()) as InvokeBody;
    if (!body.playbookId || typeof body.playbookId !== 'string') {
      return NextResponse.json({ error: 'playbookId is required' }, { status: 400 });
    }

    // Resolve playbook metadata — built-in or custom
    let playbookName: string;
    let playbookCategory: string | null = null;
    const builtin = resolveBuiltinPlaybook(body.playbookId);
    if (builtin) {
      playbookName = builtin.name;
      playbookCategory = builtin.category;
    } else {
      const custom = await prisma.decisionPlaybook.findUnique({
        where: { id: body.playbookId },
        select: { name: true, category: true, userId: true, isPublic: true, orgId: true },
      });
      if (!custom) {
        return NextResponse.json({ error: 'Playbook not found' }, { status: 404 });
      }
      // Ownership check for custom playbooks
      if (!custom.isPublic && custom.userId !== user.id) {
        return NextResponse.json({ error: 'Playbook not found' }, { status: 404 });
      }
      playbookName = custom.name;
      playbookCategory = custom.category;
    }

    // Verify analysisId ownership if provided
    let orgId: string | null = null;
    if (body.analysisId) {
      const analysis = await prisma.analysis.findUnique({
        where: { id: body.analysisId },
        include: { document: true },
      });
      if (!analysis) {
        return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
      }
      if (analysis.document.userId !== user.id) {
        const membership = await prisma.teamMember.findFirst({
          where: { userId: user.id, orgId: analysis.document.orgId ?? undefined },
        });
        if (!membership) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
      }
      orgId = analysis.document.orgId;
    }

    const invocation = await prisma.playbookInvocation.create({
      data: {
        userId: user.id,
        orgId,
        analysisId: body.analysisId ?? null,
        humanDecisionId: body.humanDecisionId ?? null,
        playbookId: body.playbookId,
        playbookName,
        playbookCategory,
        matchedToxicCombo: body.matchedToxicCombo ?? null,
        source: body.source ?? 'suggestion',
        status: 'started',
      },
    });

    log.info(
      `Playbook invoked: ${body.playbookId} (${playbookName}) by user ${user.id}` +
        (body.analysisId ? ` on analysis ${body.analysisId}` : '') +
        (body.matchedToxicCombo ? ` — toxic combo: ${body.matchedToxicCombo}` : '')
    );

    // Schedule a 48-hour follow-up nudge asking how the session went.
    // Fire-and-forget; failure is non-fatal to the invocation itself.
    scheduleFollowUpNudge({
      userId: user.id,
      orgId,
      invocationId: invocation.id,
      playbookName,
      analysisId: body.analysisId,
    }).catch(err => log.warn('Follow-up nudge scheduling failed (non-critical):', err));

    // Increment usage counter on custom playbooks (built-ins don't have a row)
    if (!builtin) {
      prisma.decisionPlaybook
        .update({
          where: { id: body.playbookId },
          data: { usageCount: { increment: 1 }, lastUsedAt: new Date() },
        })
        .catch(() => {});
    }

    // Audit trail
    await prisma.auditLog
      .create({
        data: {
          userId: user.id,
          orgId: orgId ?? 'personal',
          action: 'playbook.invoke',
          resource: 'playbook',
          resourceId: body.playbookId,
          details: {
            invocationId: invocation.id,
            playbookName,
            analysisId: body.analysisId,
            matchedToxicCombo: body.matchedToxicCombo,
            source: body.source ?? 'suggestion',
          },
        },
      })
      .catch(() => {});

    return NextResponse.json({ invocation }, { status: 201 });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') {
      log.warn('Schema drift: PlaybookInvocation table not yet migrated');
      return NextResponse.json(
        { error: 'Playbook tracking not yet available. Database migration pending.' },
        { status: 503, headers: { 'Retry-After': '300' } }
      );
    }
    log.error('POST /api/playbooks/invoke failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Creates a "playbook_followup" nudge scheduled for ~48h from now. Uses
 * the existing Nudge table so the follow-up benefits from the same
 * delivery infrastructure (dashboard, email, Slack). No new plumbing.
 */
async function scheduleFollowUpNudge(args: {
  userId: string;
  orgId: string | null;
  invocationId: string;
  playbookName: string;
  analysisId: string | undefined;
}) {
  const twoDaysFromNow = new Date(Date.now() + 48 * 60 * 60 * 1000);
  await prisma.nudge.create({
    data: {
      targetUserId: args.userId,
      orgId: args.orgId,
      analysisId: args.analysisId ?? null,
      nudgeType: 'playbook_followup',
      severity: 'info',
      channel: 'dashboard',
      message: `You ran "${args.playbookName}" two days ago. How did the session go? [Went well] [Didn't help] [Changed my mind]`,
      triggerReason: `Playbook invocation ${args.invocationId} — 48h follow-up loop`,
      phase: 'post_decision',
      nextRetryAt: twoDaysFromNow, // Reused as "scheduled delivery" marker
    },
  });
}
