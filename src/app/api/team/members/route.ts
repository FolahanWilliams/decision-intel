/**
 * Team Members API
 *
 * PUT    /api/team/members — Update a member's role
 * DELETE /api/team/members?userId=xxx — Remove a member
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { createLogger } from '@/lib/utils/logger';
import { z } from 'zod';

const log = createLogger('TeamMembers');

const UpdateRoleSchema = z.object({
  memberId: z.string(),
  role: z.enum(['admin', 'member', 'viewer']),
});

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { memberId, role } = UpdateRoleSchema.parse(body);

    // Fetch the target member
    const target = await prisma.teamMember.findUnique({ where: { id: memberId } });
    if (!target) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Requester must be owner or admin of same org
    const requester = await prisma.teamMember.findFirst({
      where: { userId: user.id, orgId: target.orgId, role: { in: ['owner', 'admin'] } },
    });
    if (!requester) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Can't change the owner's role
    if (target.role === 'owner') {
      return NextResponse.json({ error: "Cannot change the owner's role" }, { status: 403 });
    }

    // Admins can't promote to admin (only owners can)
    if (role === 'admin' && requester.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can promote to admin' }, { status: 403 });
    }

    const updated = await prisma.teamMember.update({
      where: { id: memberId },
      data: { role },
    });

    await logAudit({
      action: 'TEAM_MEMBER_ROLE_CHANGED',
      resource: 'team_member',
      resourceId: target.userId,
      orgId: target.orgId,
      details: { email: target.email, from: target.role, to: role },
    });

    log.info(`Member ${memberId} role updated to ${role} by ${user.id}`);
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }
    log.error('Failed to update member role:', error);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
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
    const targetUserId = searchParams.get('userId');
    const orgId = searchParams.get('orgId');

    if (!targetUserId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    // Find requester's membership IN THE TARGETED ORG. Scoped to the org the
    // client is displaying when provided, so a multi-org user's remove/leave
    // hits the right org instead of a non-deterministic findFirst (the same
    // cross-org hole fixed on the invite routes). Back-compat: falls back to
    // the single-org lookup when orgId is omitted.
    const requester = await prisma.teamMember.findFirst({
      where: { userId: user.id, ...(orgId ? { orgId } : {}) },
    });
    if (!requester) {
      return NextResponse.json({ error: 'You are not in a team' }, { status: 404 });
    }

    // Self-removal: any member can leave
    if (targetUserId === user.id) {
      if (requester.role === 'owner') {
        return NextResponse.json(
          { error: 'Owner cannot leave. Transfer ownership first.' },
          { status: 403 }
        );
      }

      await prisma.teamMember.delete({ where: { id: requester.id } });

      await logAudit({
        action: 'TEAM_MEMBER_REMOVED',
        resource: 'team_member',
        resourceId: requester.userId,
        orgId: requester.orgId,
        details: { email: requester.email, role: requester.role, selfRemoved: true },
      });

      return NextResponse.json({ success: true });
    }

    // Removing someone else: must be owner or admin
    if (!['owner', 'admin'].includes(requester.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const target = await prisma.teamMember.findFirst({
      where: { userId: targetUserId, orgId: requester.orgId },
    });
    if (!target) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Can't remove owner
    if (target.role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove the owner' }, { status: 403 });
    }

    // Admins can't remove other admins
    if (target.role === 'admin' && requester.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can remove admins' }, { status: 403 });
    }

    await prisma.teamMember.delete({ where: { id: target.id } });

    await logAudit({
      action: 'TEAM_MEMBER_REMOVED',
      resource: 'team_member',
      resourceId: target.userId,
      orgId: requester.orgId,
      details: { email: target.email, role: target.role, selfRemoved: false },
    });

    log.info(`Member ${targetUserId} removed from org ${requester.orgId} by ${user.id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Failed to remove member:', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
