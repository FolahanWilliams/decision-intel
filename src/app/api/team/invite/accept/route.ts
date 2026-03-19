/**
 * Accept Team Invite API
 *
 * POST /api/team/invite/accept — Accept an invitation by token
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('TeamInviteAccept');

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Please sign in to accept this invitation' }, { status: 401 });
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
      return NextResponse.json({ error: `This invitation has been ${invite.status}` }, { status: 410 });
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

    // Create membership and mark invite accepted in a transaction
    await prisma.$transaction([
      prisma.teamMember.create({
        data: {
          orgId: invite.orgId,
          userId: user.id,
          email: user.email || invite.email,
          displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Member',
          role: invite.role,
        },
      }),
      prisma.teamInvite.update({
        where: { id: invite.id },
        data: { status: 'accepted' },
      }),
    ]);

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
