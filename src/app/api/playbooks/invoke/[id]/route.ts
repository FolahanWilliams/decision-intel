/**
 * PATCH /api/playbooks/invoke/[id] — capture effectiveness rating (M6.5)
 *
 * Called when the user closes the loop on a playbook invocation by rating
 * how helpful the session was. The rating feeds the feedback loop: over
 * time, causal-learning can weigh which playbooks actually move outcomes
 * for THIS specific org.
 *
 * GET    — fetch a single invocation (for the follow-up UI)
 * PATCH  — rate effectiveness, add notes, mark complete/abandoned
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('PlaybookInvokeDetailAPI');

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const invocation = await prisma.playbookInvocation.findFirst({
      where: { id, userId: user.id },
    });
    if (!invocation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ invocation });
  } catch (err) {
    log.error('GET /api/playbooks/invoke/[id] failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json()) as {
      effectivenessRating?: number;
      notes?: string;
      status?: 'started' | 'completed' | 'abandoned';
    };

    // Ownership check (findFirst, not findUnique — never use id alone on mutations)
    const existing = await prisma.playbookInvocation.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Validate rating range if provided
    if (body.effectivenessRating !== undefined) {
      if (
        typeof body.effectivenessRating !== 'number' ||
        !Number.isInteger(body.effectivenessRating) ||
        body.effectivenessRating < 1 ||
        body.effectivenessRating > 5
      ) {
        return NextResponse.json(
          { error: 'effectivenessRating must be an integer between 1 and 5' },
          { status: 400 }
        );
      }
    }

    // Validate status if provided
    if (body.status && !['started', 'completed', 'abandoned'].includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Truncate notes at 2000 chars to prevent abuse
    const notes = typeof body.notes === 'string' ? body.notes.slice(0, 2000) : undefined;

    const updated = await prisma.playbookInvocation.update({
      where: { id },
      data: {
        ...(body.effectivenessRating !== undefined && {
          effectivenessRating: body.effectivenessRating,
        }),
        ...(notes !== undefined && { notes }),
        ...(body.status && { status: body.status }),
        ...(body.status === 'completed' && { completedAt: new Date() }),
      },
    });

    log.info(
      `Playbook invocation ${id} updated: rating=${body.effectivenessRating ?? 'unchanged'}, status=${body.status ?? 'unchanged'}`
    );

    // Audit trail
    await prisma.auditLog
      .create({
        data: {
          userId: user.id,
          orgId: existing.orgId ?? 'personal',
          action: 'playbook.rate',
          resource: 'playbook_invocation',
          resourceId: id,
          details: {
            playbookId: existing.playbookId,
            playbookName: existing.playbookName,
            effectivenessRating: body.effectivenessRating,
            status: body.status,
          },
        },
      })
      .catch(err => log.warn('Audit log write failed for playbook_invocation update:', err));

    return NextResponse.json({ invocation: updated });
  } catch (err) {
    log.error('PATCH /api/playbooks/invoke/[id] failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
