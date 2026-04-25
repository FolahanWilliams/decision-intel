import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/lib/utils/api-response';
import { isAdminUserId } from '@/lib/utils/admin';
import { logAudit } from '@/lib/audit';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('SsoAdmin');

// SSO provider management.
// - GET  /api/sso/admin/providers?orgId=X  → list
// - POST /api/sso/admin/providers          → create new (status defaults 'pending')
//
// Access: super-admin (ADMIN_USER_IDS) OR a TeamMember with role='admin'
// in the targeted org.

async function authoriseOrgAdmin(
  userId: string,
  orgId: string
): Promise<boolean> {
  if (isAdminUserId(userId)) return true;
  const membership = await prisma.teamMember
    .findFirst({
      where: { userId, orgId, role: 'admin' },
      select: { id: true },
    })
    .catch(() => null);
  return !!membership;
}

function normaliseDomain(raw: string): string | null {
  const d = raw.trim().toLowerCase().replace(/^@+/, '').replace(/\/+$/, '');
  if (!d.match(/^[a-z0-9.-]+\.[a-z]{2,}$/)) return null;
  return d;
}

function normaliseProviderId(raw: string): string | null {
  // Supabase returns a UUID; accept anything UUID-shaped.
  const s = raw.trim();
  return s.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)
    ? s
    : null;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return apiError({ error: 'Unauthorized', status: 401 });
    }

    const orgId = req.nextUrl.searchParams.get('orgId');
    if (!orgId) {
      return apiError({ error: 'orgId query param required', status: 400 });
    }

    if (!(await authoriseOrgAdmin(user.id, orgId))) {
      return apiError({ error: 'Forbidden', status: 403 });
    }

    const configs = await prisma.ssoConfiguration.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        domain: true,
        providerId: true,
        protocol: true,
        displayName: true,
        status: true,
        activatedAt: true,
        notes: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ configs });
  } catch (err) {
    log.error('sso admin GET failed', err as Error);
    return apiError({ error: 'Request failed', status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return apiError({ error: 'Unauthorized', status: 401 });
    }

    const body = (await req.json().catch(() => null)) as {
      orgId?: string;
      domain?: string;
      providerId?: string;
      displayName?: string;
      notes?: string;
    } | null;
    if (!body?.orgId || !body?.domain || !body?.providerId) {
      return apiError({
        error: 'orgId, domain and providerId are required',
        status: 400,
      });
    }

    if (!(await authoriseOrgAdmin(user.id, body.orgId))) {
      return apiError({ error: 'Forbidden', status: 403 });
    }

    const domain = normaliseDomain(body.domain);
    if (!domain) {
      return apiError({ error: 'Invalid domain format', status: 400 });
    }
    const providerId = normaliseProviderId(body.providerId);
    if (!providerId) {
      return apiError({
        error: 'providerId must be the UUID returned by `supabase sso add`',
        status: 400,
      });
    }

    // Domain is globally unique; catch the collision explicitly with a
    // helpful error rather than a raw P2002.
    const existing = await prisma.ssoConfiguration.findUnique({
      where: { domain },
      select: { id: true, orgId: true },
    });
    if (existing) {
      return apiError({
        error:
          existing.orgId === body.orgId
            ? 'This domain is already registered for your org.'
            : 'This domain is already claimed by another organisation. Contact support if you own it.',
        status: 409,
      });
    }

    const config = await prisma.ssoConfiguration.create({
      data: {
        orgId: body.orgId,
        domain,
        providerId,
        displayName:
          typeof body.displayName === 'string' && body.displayName.trim().length > 0
            ? body.displayName.trim().slice(0, 120)
            : null,
        notes:
          typeof body.notes === 'string' && body.notes.trim().length > 0
            ? body.notes.trim().slice(0, 2000)
            : null,
        status: 'pending',
        createdByUserId: user.id,
      },
    });

    logAudit({
      action: 'SSO_CONFIGURATION_CREATED',
      resource: 'sso_configuration',
      resourceId: config.id,
      details: { orgId: body.orgId, domain, providerId, protocol: 'saml' },
    }).catch(err => log.warn('audit log write failed:', err));

    return NextResponse.json({ config }, { status: 201 });
  } catch (err) {
    log.error('sso admin POST failed', err as Error);
    return apiError({ error: 'Request failed', status: 500 });
  }
}
