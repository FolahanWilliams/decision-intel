/**
 * Team Invite API
 *
 * POST   /api/team/invite — Send an invite
 * DELETE /api/team/invite?id=xxx — Revoke an invite
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { checkTeamSizeLimit } from '@/lib/utils/plan-limits';
import { PLANS } from '@/lib/stripe';
import { createLogger } from '@/lib/utils/logger';
import { z } from 'zod';

const log = createLogger('TeamInvite');

const InviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit: 10 invites per hour
  const rateLimitResult = await checkRateLimit(user.id, '/api/team/invite', {
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
  });
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: {
          'Retry-After': '3600',
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  try {
    const body = await req.json();
    const { email, role } = InviteSchema.parse(body);

    // Must be owner or admin — include org to avoid extra query when sending invite email
    const membership = await prisma.teamMember.findFirst({
      where: { userId: user.id, role: { in: ['owner', 'admin'] } },
      include: { organization: { select: { id: true, name: true } } },
    });
    if (!membership) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Can't invite yourself
    if (email === user.email) {
      return NextResponse.json({ error: 'You cannot invite yourself' }, { status: 400 });
    }

    // Check if already a member
    const existingMember = await prisma.teamMember.findFirst({
      where: { orgId: membership.orgId, email },
    });
    if (existingMember) {
      return NextResponse.json({ error: 'This person is already a team member' }, { status: 409 });
    }

    // Check for existing pending invite
    const existingInvite = await prisma.teamInvite.findFirst({
      where: { orgId: membership.orgId, email, status: 'pending' },
    });
    if (existingInvite) {
      return NextResponse.json(
        { error: 'An invite is already pending for this email' },
        { status: 409 }
      );
    }

    // Enforce plan-based team size tier. Limits come from PLANS in
    // src/lib/stripe.ts (Starter 3 / Professional 10 / Team 50 / Enterprise ∞).
    // Pending invites count against the limit so the cap can't be bypassed.
    const seatCheck = await checkTeamSizeLimit(membership.orgId);
    if (!seatCheck.allowed) {
      const planName = PLANS[seatCheck.plan].name;
      const limitLabel = Number.isFinite(seatCheck.limit) ? String(seatCheck.limit) : 'unlimited';
      return NextResponse.json(
        {
          error: `Team size limit reached for the ${planName} plan (${seatCheck.used}/${limitLabel} seats, including pending invites). Upgrade your plan to add more teammates.`,
          code: 'TEAM_SIZE_LIMIT',
          plan: seatCheck.plan,
          used: seatCheck.used,
          limit: seatCheck.limit,
        },
        { status: 403 }
      );
    }

    const invite = await prisma.teamInvite.create({
      data: {
        orgId: membership.orgId,
        email,
        role,
        invitedByUserId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Send invite email (fire and forget) — org already loaded with membership query
    import('@/lib/notifications/email')
      .then(({ notifyTeamInvite }) =>
        notifyTeamInvite(
          email,
          (user.user_metadata as Record<string, string> | undefined)?.full_name ||
            user.email ||
            'A teammate',
          membership.organization?.name || 'a team',
          invite.token
        )
      )
      .catch(err => log.error('Invite email failed:', err));

    log.info(`Invite sent to ${email} for org ${membership.orgId}`);
    return NextResponse.json(invite, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }
    log.error('Failed to create invite:', error);
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 });
  }
}

/**
 * PATCH /api/team/invite — Resend an invite (resets expiry and re-sends email)
 */
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const inviteId = body?.id;

    if (!inviteId || typeof inviteId !== 'string') {
      return NextResponse.json({ error: 'Missing invite ID' }, { status: 400 });
    }

    const invite = await prisma.teamInvite.findUnique({
      where: { id: inviteId },
    });
    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    // Must be owner or admin
    const membership = await prisma.teamMember.findFirst({
      where: { userId: user.id, orgId: invite.orgId, role: { in: ['owner', 'admin'] } },
    });
    if (!membership) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    if (invite.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending invites can be resent' }, { status: 400 });
    }

    // Reset expiry to 7 days from now
    const updated = await prisma.teamInvite.update({
      where: { id: inviteId },
      data: { expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    // Re-send email
    const org = await prisma.organization.findUnique({ where: { id: invite.orgId } });
    import('@/lib/notifications/email')
      .then(({ notifyTeamInvite }) =>
        notifyTeamInvite(
          invite.email,
          (user.user_metadata as Record<string, string> | undefined)?.full_name ||
            user.email ||
            'A teammate',
          org?.name || 'a team',
          invite.token
        )
      )
      .catch(err => log.error('Resend invite email failed:', err));

    log.info(`Invite resent to ${invite.email} for org ${invite.orgId}`);
    return NextResponse.json(updated);
  } catch (error) {
    log.error('Failed to resend invite:', error);
    return NextResponse.json({ error: 'Failed to resend invite' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const inviteId = searchParams.get('id');

    if (!inviteId) {
      return NextResponse.json({ error: 'Missing invite ID' }, { status: 400 });
    }

    // Must be owner or admin of the org that owns this invite
    const invite = await prisma.teamInvite.findUnique({
      where: { id: inviteId },
    });
    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    const membership = await prisma.teamMember.findFirst({
      where: { userId: user.id, orgId: invite.orgId, role: { in: ['owner', 'admin'] } },
    });
    if (!membership) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await prisma.teamInvite.update({
      where: { id: inviteId },
      data: { status: 'revoked' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Failed to revoke invite:', error);
    return NextResponse.json({ error: 'Failed to revoke invite' }, { status: 500 });
  }
}
