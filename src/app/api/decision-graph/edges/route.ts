/**
 * Decision Graph Edge Management API
 *
 * POST   /api/decision-graph/edges — Create a manual edge
 * DELETE /api/decision-graph/edges — Remove an edge
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { addManualEdge } from '@/lib/graph/edge-inference';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('DecisionGraphEdgesAPI');

/**
 * Returns the set of orgIds the user belongs to (may be empty).
 * Personal-scope rows (orgId = null) are always owned by their creator
 * and must be verified separately via createdBy.
 */
async function getUserOrgIds(userId: string): Promise<string[]> {
  try {
    const memberships = await prisma.teamMember.findMany({
      where: { userId },
      select: { orgId: true },
    });
    return memberships.map(m => m.orgId);
  } catch (err) {
    log.warn('getUserOrgIds failed (returning empty fallback):', err);
    return [];
  }
}

const VALID_EDGE_TYPES = [
  'influenced_by',
  'escalated_from',
  'reversed',
  'depends_on',
  'similar_to',
  'shared_bias',
  'same_participants',
] as const;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { orgId, sourceType, sourceId, targetType, targetId, edgeType, description } = body;

    if (!sourceType || !sourceId || !targetType || !targetId || !edgeType) {
      return NextResponse.json(
        { error: 'sourceType, sourceId, targetType, targetId, and edgeType are required' },
        { status: 400 }
      );
    }

    if (!VALID_EDGE_TYPES.includes(edgeType)) {
      return NextResponse.json(
        { error: `Invalid edgeType. Must be one of: ${VALID_EDGE_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const edge = await addManualEdge({
      orgId: orgId ?? null,
      sourceType,
      sourceId,
      targetType,
      targetId,
      edgeType,
      description,
      userId: user.id,
    });

    return NextResponse.json(edge, { status: 201 });
  } catch (error) {
    log.error('Failed to create edge:', error);
    return NextResponse.json({ error: 'Failed to create edge' }, { status: 500 });
  }
}

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
    const { id, strength, confidence, description, metadata } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Verify the edge exists and user has access (same org, or personal edge they created)
    const existing = await prisma.decisionEdge.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Edge not found' }, { status: 404 });
    }

    const userOrgIds = await getUserOrgIds(user.id);
    const hasAccess = existing.orgId
      ? userOrgIds.includes(existing.orgId)
      : existing.createdBy === user.id;
    if (!hasAccess) {
      return NextResponse.json({ error: 'Edge not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (typeof strength === 'number') updateData.strength = Math.max(0, Math.min(1, strength));
    if (typeof confidence === 'number')
      updateData.confidence = Math.max(0, Math.min(1, confidence));
    if (typeof description === 'string') updateData.description = description;
    if (metadata !== undefined) updateData.metadata = metadata;

    // "Confirm" pattern: setting confidence to 1.0 marks as manually confirmed
    if (confidence === 1.0) {
      updateData.isManual = true;
      updateData.createdBy = user.id;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No update fields provided' }, { status: 400 });
    }

    const updated = await prisma.decisionEdge.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    log.error('Failed to update edge:', error);
    return NextResponse.json({ error: 'Failed to update edge' }, { status: 500 });
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

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  try {
    const existing = await prisma.decisionEdge.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Edge not found' }, { status: 404 });
    }

    const userOrgIds = await getUserOrgIds(user.id);
    const hasAccess = existing.orgId
      ? userOrgIds.includes(existing.orgId)
      : existing.createdBy === user.id;
    if (!hasAccess) {
      return NextResponse.json({ error: 'Edge not found' }, { status: 404 });
    }

    await prisma.decisionEdge.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Failed to delete edge:', error);
    return NextResponse.json({ error: 'Failed to delete edge' }, { status: 500 });
  }
}
