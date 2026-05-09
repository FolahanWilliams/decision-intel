/**
 * /api/containers/[id]/links — manage cognitive-lineage edges between
 * DecisionContainers. POST creates a new link from {id} → toId; GET
 * lists every outbound + inbound link for {id}; DELETE removes via
 * ?linkId=. Edge endpoint validation is permission-aware: the caller
 * must own OR share an org with BOTH endpoints.
 *
 * Phase 3.5 ship — see container-link-types.ts SSOT for the four
 * canonical linkType values.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { logAudit } from '@/lib/audit';
import {
  CONTAINER_LINK_TYPES,
  isValidLinkType,
  type ContainerLinkType,
} from '@/lib/data/container-link-types';

const log = createLogger('ContainerLinksRoute');

async function resolveOrgId(userId: string): Promise<string | null> {
  try {
    const m = await prisma.teamMember.findFirst({
      where: { userId },
      select: { orgId: true },
    });
    return m?.orgId ?? null;
  } catch {
    return null;
  }
}

async function userHasContainerAccess(
  containerId: string,
  userId: string,
  orgId: string | null
): Promise<boolean> {
  try {
    const c = await prisma.decisionContainer.findFirst({
      where: {
        id: containerId,
        OR: [{ ownerUserId: userId }, { orgId: orgId ?? undefined }],
      },
      select: { id: true },
    });
    return c != null;
  } catch {
    return false;
  }
}

// ─── GET — list outbound + inbound links for {id} ──────────────────────────

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orgId = await resolveOrgId(user.id);
    if (!(await userHasContainerAccess(id, user.id, orgId))) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 });
    }

    const [outbound, inbound] = await Promise.all([
      prisma.decisionContainerLink.findMany({
        where: { fromId: id },
        include: { to: { select: { id: true, name: true, kind: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.decisionContainerLink.findMany({
        where: { toId: id },
        include: { from: { select: { id: true, name: true, kind: true } } },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return NextResponse.json({
      outbound: outbound.map(l => ({
        id: l.id,
        fromId: l.fromId,
        toId: l.toId,
        toName: l.to.name,
        toKind: l.to.kind,
        linkType: l.linkType,
        note: l.note,
        createdAt: l.createdAt.toISOString(),
      })),
      inbound: inbound.map(l => ({
        id: l.id,
        fromId: l.fromId,
        toId: l.toId,
        fromName: l.from.name,
        fromKind: l.from.kind,
        linkType: l.linkType,
        note: l.note,
        createdAt: l.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    log.error('GET /api/containers/[id]/links failed:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ─── POST — create a new link from {id} → toId ─────────────────────────────

interface CreateLinkBody {
  toId: string;
  linkType: ContainerLinkType;
  note?: string | null;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: fromId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await request.json().catch(() => null)) as CreateLinkBody | null;
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    if (typeof body.toId !== 'string' || body.toId.trim().length === 0) {
      return NextResponse.json({ error: 'toId required' }, { status: 400 });
    }
    if (body.toId === fromId) {
      return NextResponse.json({ error: 'A container cannot link to itself' }, { status: 400 });
    }
    if (!isValidLinkType(body.linkType)) {
      return NextResponse.json(
        { error: `Invalid linkType. Must be one of: ${CONTAINER_LINK_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const orgId = await resolveOrgId(user.id);
    const [fromAccess, toAccess] = await Promise.all([
      userHasContainerAccess(fromId, user.id, orgId),
      userHasContainerAccess(body.toId, user.id, orgId),
    ]);
    if (!fromAccess || !toAccess) {
      return NextResponse.json({ error: 'One or both containers not accessible' }, { status: 404 });
    }

    const created = await prisma.decisionContainerLink.create({
      data: {
        fromId,
        toId: body.toId,
        linkType: body.linkType,
        note: body.note?.trim() || null,
        createdBy: user.id,
      },
    });

    await logAudit({
      action: 'CONTAINER_LINK_CREATED',
      resource: 'decision_container_link',
      resourceId: created.id,
      details: { fromId, toId: body.toId, linkType: body.linkType },
    }).catch(err => log.warn('Audit log for link create failed:', err));

    return NextResponse.json({ id: created.id });
  } catch (error: unknown) {
    // P2002 = unique constraint (same edge already exists). Idempotent
    // — return 200 with a clear note rather than blowing up.
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'This link already exists between these two containers' },
        { status: 409 }
      );
    }
    log.error('POST /api/containers/[id]/links failed:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ─── DELETE — remove via ?linkId= ──────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: fromId } = await params;
    const url = new URL(request.url);
    const linkId = url.searchParams.get('linkId');
    if (!linkId) {
      return NextResponse.json({ error: 'linkId query param required' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orgId = await resolveOrgId(user.id);
    if (!(await userHasContainerAccess(fromId, user.id, orgId))) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 });
    }

    // Verify the link actually originates from {id} (defense-in-depth).
    const link = await prisma.decisionContainerLink.findFirst({
      where: { id: linkId, fromId },
    });
    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    await prisma.decisionContainerLink.delete({ where: { id: linkId } });

    await logAudit({
      action: 'CONTAINER_LINK_DELETED',
      resource: 'decision_container_link',
      resourceId: linkId,
      details: { fromId, toId: link.toId, linkType: link.linkType },
    }).catch(err => log.warn('Audit log for link delete failed:', err));

    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error('DELETE /api/containers/[id]/links failed:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
