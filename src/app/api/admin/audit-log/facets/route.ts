import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { isAdminUserId } from '@/lib/utils/admin';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('AdminAuditLogFacets');

/**
 * GET /api/admin/audit-log/facets
 *
 * Distinct facets for the filter UI: every action value in the table,
 * the most-active userIds, and the most-active orgIds. Used to populate
 * the filter dropdowns on /dashboard/admin/audit-log without the client
 * needing to scroll through 10,000 rows to find out what's available.
 */

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAdminUserId(user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // groupBy + _count from Prisma gives us the top-N per facet without
    // pulling every row into memory.
    const [actionGroups, userGroups, orgGroups, resourceGroups] = await Promise.all([
      prisma.auditLog.groupBy({
        by: ['action'],
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 40,
      }),
      prisma.auditLog.groupBy({
        by: ['userId'],
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 20,
      }),
      prisma.auditLog.groupBy({
        by: ['orgId'],
        _count: { orgId: true },
        where: { orgId: { not: null } },
        orderBy: { _count: { orgId: 'desc' } },
        take: 20,
      }),
      prisma.auditLog.groupBy({
        by: ['resource'],
        _count: { resource: true },
        orderBy: { _count: { resource: 'desc' } },
        take: 20,
      }),
    ]);

    return NextResponse.json({
      actions: actionGroups.map(g => ({ value: g.action, count: g._count.action })),
      users: userGroups.map(g => ({ value: g.userId, count: g._count.userId })),
      orgs: orgGroups
        .map(g => ({ value: g.orgId, count: g._count.orgId }))
        .filter((g): g is { value: string; count: number } => !!g.value),
      resources: resourceGroups.map(g => ({
        value: g.resource,
        count: g._count.resource,
      })),
    });
  } catch (error) {
    log.error('Admin audit-log facets failed:', error);
    return NextResponse.json({ error: 'Failed to load facets' }, { status: 500 });
  }
}
