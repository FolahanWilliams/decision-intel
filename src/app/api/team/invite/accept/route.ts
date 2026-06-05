/**
 * Accept Team Invite API
 *
 * POST /api/team/invite/accept — Accept an invitation by token
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { getOrgPlan } from '@/lib/utils/plan-limits';
import { PLANS } from '@/lib/stripe';
import { logAudit } from '@/lib/audit';

const log = createLogger('TeamInviteAccept');

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Please sign in to accept this invitation' },
      { status: 401 }
    );
  }

  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Missing invite token' }, { status: 400 });
    }

    const invite = await prisma.teamInvite.findUnique({
      where: { token },
      include: { organization: true },
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invite.status !== 'pending') {
      return NextResponse.json(
        { error: `This invitation has been ${invite.status}` },
        { status: 410 }
      );
    }

    if (invite.expiresAt < new Date()) {
      await prisma.teamInvite.update({
        where: { id: invite.id },
        data: { status: 'expired' },
      });
      return NextResponse.json({ error: 'This invitation has expired' }, { status: 410 });
    }

    // Check if user is already a member
    const existingMember = await prisma.teamMember.findFirst({
      where: { orgId: invite.orgId, userId: user.id },
    });
    if (existingMember) {
      // Mark invite as accepted anyway
      await prisma.teamInvite.update({
        where: { id: invite.id },
        data: { status: 'accepted' },
      });
      return NextResponse.json({
        success: true,
        orgName: invite.organization.name,
        message: 'You are already a member of this team',
      });
    }

    // Resolve the org's CURRENT plan seat ceiling. The invite may have been
    // created weeks ago under a higher plan that has since been downgraded —
    // enforcement at accept time (not just invite time) is what stops a stale
    // invite from pushing an org past its current cap. We deliberately do NOT
    // auto-remove existing members on downgrade; we only block new growth.
    const plan = await getOrgPlan(invite.orgId);
    const seatLimit = PLANS[plan].maxTeamMembers;

    // Create membership + mark invite accepted atomically. The member COUNT and
    // the insert live in the same interactive transaction so two simultaneous
    // accepts can't both slip past a cap-1 check (the count→insert race).
    try {
      await prisma.$transaction(async tx => {
        // Serialize seat mutations for this org. Under Postgres READ COMMITTED
        // a bare count-then-insert is NOT atomic — two concurrent accepts both
        // read the same member count and both insert, exceeding the cap.
        // Locking the org row makes concurrent seat-mutating transactions queue.
        await tx.$queryRaw`SELECT id FROM "Organization" WHERE id = ${invite.orgId} FOR UPDATE`;

        // Re-read inside the tx to defend against a double-accept race.
        const fresh = await tx.teamInvite.findUnique({
          where: { id: invite.id },
          select: { status: true },
        });
        if (!fresh || fresh.status !== 'pending') {
          throw new Error('INVITE_NOT_PENDING');
        }

        const memberCount = await tx.teamMember.count({ where: { orgId: invite.orgId } });
        if (memberCount >= seatLimit) {
          throw new Error('SEAT_LIMIT');
        }

        await tx.teamMember.create({
          data: {
            orgId: invite.orgId,
            userId: user.id,
            email: user.email || invite.email,
            displayName:
              (user.user_metadata as Record<string, string> | undefined)?.full_name ||
              user.email?.split('@')[0] ||
              'Member',
            role: invite.role,
          },
        });
        await tx.teamInvite.update({
          where: { id: invite.id },
          data: { status: 'accepted' },
        });
      });
    } catch (txError) {
      if (txError instanceof Error && txError.message === 'SEAT_LIMIT') {
        const limitLabel = Number.isFinite(seatLimit) ? String(seatLimit) : 'its';
        return NextResponse.json(
          {
            error: `This team is at its seat limit (${limitLabel} on the ${PLANS[plan].name} plan). Ask an admin to upgrade or remove a member before joining.`,
            code: 'SEAT_LIMIT_REACHED',
          },
          { status: 403 }
        );
      }
      if (txError instanceof Error && txError.message === 'INVITE_NOT_PENDING') {
        return NextResponse.json(
          { error: 'This invitation is no longer pending' },
          { status: 410 }
        );
      }
      throw txError;
    }

    // Org-scoped audit entry so the join survives in the Team Activity feed +
    // AdminAuditLog even if this member later leaves.
    await logAudit({
      action: 'TEAM_MEMBER_JOINED',
      resource: 'team_member',
      resourceId: user.id,
      orgId: invite.orgId,
      details: { email: user.email || invite.email, role: invite.role },
    });

    log.info(`User ${user.id} accepted invite to org ${invite.orgId}`);

    return NextResponse.json({
      success: true,
      orgName: invite.organization.name,
      role: invite.role,
    });
  } catch (error) {
    log.error('Failed to accept invite:', error);
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
  }
}
