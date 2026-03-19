/**
 * Team Activity API
 *
 * GET /api/team/activity — Get recent team documents and analyses
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('TeamActivity');

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find user's org membership
    const membership = await prisma.teamMember.findFirst({
      where: { userId: user.id },
    });

    if (!membership) {
      return NextResponse.json({ documents: [], activity: [] });
    }

    // Get all team member user IDs
    const members = await prisma.teamMember.findMany({
      where: { orgId: membership.orgId },
      select: { userId: true, displayName: true, email: true },
    });
    const memberUserIds = members.map((m) => m.userId);
    const memberMap = new Map(
      members.map((m) => [m.userId, m.displayName || m.email.split('@')[0]])
    );

    // Fetch recent team documents (shared across org)
    const documents = await prisma.document.findMany({
      where: {
        OR: [
          { orgId: membership.orgId },
          { userId: { in: memberUserIds } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      include: {
        analyses: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { overallScore: true, createdAt: true },
        },
      },
    });

    // Fetch recent audit log activity for team
    const activity = await prisma.auditLog.findMany({
      where: {
        OR: [
          { orgId: membership.orgId },
          { userId: { in: memberUserIds } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    // Enrich activity with display names
    const enrichedActivity = activity.map((a) => ({
      ...a,
      displayName: memberMap.get(a.userId) || 'Unknown',
    }));

    const enrichedDocuments = documents.map((d) => ({
      id: d.id,
      filename: d.filename,
      status: d.status,
      uploadedAt: d.uploadedAt,
      updatedAt: d.updatedAt,
      uploadedBy: memberMap.get(d.userId) || 'Unknown',
      latestScore: d.analyses[0]?.overallScore ?? null,
    }));

    return NextResponse.json({
      documents: enrichedDocuments,
      activity: enrichedActivity,
    });
  } catch (error) {
    log.error('Failed to fetch team activity:', error);
    return NextResponse.json({ error: 'Failed to fetch team activity' }, { status: 500 });
  }
}
