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
    return NextResponse.json(
      { error: 'Failed to create edge' },
      { status: 500 }
    );
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
    await prisma.decisionEdge.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Failed to delete edge:', error);
    return NextResponse.json(
      { error: 'Failed to delete edge' },
      { status: 500 }
    );
  }
}
