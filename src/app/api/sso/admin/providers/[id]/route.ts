import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/lib/utils/api-response';
import { isAdminUserId } from '@/lib/utils/admin';
import { logAudit } from '@/lib/audit';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('SsoAdminProvider');

// PATCH /api/sso/admin/providers/:id  → change status / displayName / notes
// DELETE /api/sso/admin/providers/:id → remove (domain is freed)
//
// Access: super-admin OR TeamMember role='admin' in the owning Org.

async function authoriseOrgAdmin(userId: string, orgId: string): Promise<boolean> {
  if (isAdminUserId(userId)) return true;
  const membership = await prisma.teamMember
    .findFirst({
      where: { userId, orgId, role: 'admin' },
      select: { id: true },
    })
    .catch(() => null);
  return !!membership;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return apiError({ error: 'Unauthorized', status: 401 });

    const { id } = await params;

    const existing = await prisma.ssoConfiguration.findUnique({
      where: { id },
      select: { id: true, orgId: true, domain: true, status: true },
    });
    if (!existing) return apiError({ error: 'Not found', status: 404 });

    if (!(await authoriseOrgAdmin(user.id, existing.orgId))) {
      return apiError({ error: 'Forbidden', status: 403 });
    }

    const body = (await req.json().catch(() => null)) as {
      status?: 'pending' | 'active' | 'disabled';
      displayName?: string | null;
      notes?: string | null;
    } | null;
    if (!body) return apiError({ error: 'Request body required', status: 400 });

    const data: Record<string, unknown> = {};
    if (body.status && ['pending', 'active', 'disabled'].includes(body.status)) {
      data.status = body.status;
      if (body.status === 'active' && !existing.status) {
        data.activatedAt = new Date();
      }
    }
    if (body.displayName !== undefined) {
      data.displayName =
        body.displayName && body.displayName.trim().length > 0
          ? body.displayName.trim().slice(0, 120)
          : null;
    }
    if (body.notes !== undefined) {
      data.notes =
        body.notes && body.notes.trim().length > 0 ? body.notes.trim().slice(0, 2000) : null;
    }

    if (Object.keys(data).length === 0) {
      return apiError({ error: 'No fields to update', status: 400 });
    }

    const updated = await prisma.ssoConfiguration.update({
      where: { id },
      data,
    });

    logAudit({
      action: 'SSO_CONFIGURATION_UPDATED',
      resource: 'sso_configuration',
      resourceId: id,
      details: { orgId: existing.orgId, domain: existing.domain, changes: data },
    }).catch(err => log.warn('audit log write failed:', err));

    return NextResponse.json({ config: updated });
  } catch (err) {
    log.error('sso admin PATCH failed', err as Error);
    return apiError({ error: 'Request failed', status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return apiError({ error: 'Unauthorized', status: 401 });

    const { id } = await params;

    const existing = await prisma.ssoConfiguration.findUnique({
      where: { id },
      select: { id: true, orgId: true, domain: true, providerId: true },
    });
    if (!existing) return apiError({ error: 'Not found', status: 404 });

    if (!(await authoriseOrgAdmin(user.id, existing.orgId))) {
      return apiError({ error: 'Forbidden', status: 403 });
    }

    await prisma.ssoConfiguration.delete({ where: { id } });

    logAudit({
      action: 'SSO_CONFIGURATION_DELETED',
      resource: 'sso_configuration',
      resourceId: id,
      details: {
        orgId: existing.orgId,
        domain: existing.domain,
        providerId: existing.providerId,
      },
    }).catch(err => log.warn('audit log write failed:', err));

    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error('sso admin DELETE failed', err as Error);
    return apiError({ error: 'Request failed', status: 500 });
  }
}
