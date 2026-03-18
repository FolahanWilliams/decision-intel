/**
 * Boardroom Personas API
 *
 * GET    /api/personas — List personas for current user's org
 * POST   /api/personas — Create a new custom persona
 * PUT    /api/personas — Update an existing persona
 * DELETE /api/personas?id=xxx — Delete a persona
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('Personas');

const MAX_PERSONAS_PER_ORG = 10;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const personas = await prisma.boardroomPersona.findMany({
      where: {
        OR: [{ userId: user.id }, { orgId: user.id }],
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(personas);
  } catch (error) {
    log.error('Failed to fetch personas:', error);
    return NextResponse.json([]);
  }
}

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
    const { name, role, focus, values, bias, riskTolerance } = body;

    if (!name || !role || !focus || !values || !bias) {
      return NextResponse.json(
        { error: 'name, role, focus, values, and bias are required' },
        { status: 400 }
      );
    }

    // Check limit
    const count = await prisma.boardroomPersona.count({
      where: { userId: user.id, isActive: true },
    });

    if (count >= MAX_PERSONAS_PER_ORG) {
      return NextResponse.json(
        { error: `Maximum ${MAX_PERSONAS_PER_ORG} personas allowed` },
        { status: 400 }
      );
    }

    const persona = await prisma.boardroomPersona.create({
      data: {
        userId: user.id,
        orgId: user.id,
        name,
        role,
        focus,
        values,
        bias,
        riskTolerance: riskTolerance || 'moderate',
        sortOrder: count,
      },
    });

    log.info(`Persona "${name}" created by ${user.id}`);
    return NextResponse.json(persona, { status: 201 });
  } catch (error) {
    log.error('Failed to create persona:', error);
    return NextResponse.json({ error: 'Failed to create persona' }, { status: 500 });
  }
}

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
    const { id, name, role, focus, values, bias, riskTolerance, sortOrder } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.boardroomPersona.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Not found or not authorized' }, { status: 404 });
    }

    const persona = await prisma.boardroomPersona.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(role && { role }),
        ...(focus && { focus }),
        ...(values && { values }),
        ...(bias && { bias }),
        ...(riskTolerance && { riskTolerance }),
        ...(sortOrder != null && { sortOrder }),
      },
    });

    return NextResponse.json(persona);
  } catch (error) {
    log.error('Failed to update persona:', error);
    return NextResponse.json({ error: 'Failed to update persona' }, { status: 500 });
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

  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  try {
    const existing = await prisma.boardroomPersona.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Not found or not authorized' }, { status: 404 });
    }

    await prisma.boardroomPersona.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error('Failed to delete persona:', error);
    return NextResponse.json({ error: 'Failed to delete persona' }, { status: 500 });
  }
}
