/**
 * Single Playbook Operations
 *
 * GET    - Get playbook details (including built-in templates)
 * PATCH  - Update a custom playbook
 * DELETE - Delete a custom playbook
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { BUILT_IN_PLAYBOOKS } from '@/lib/playbooks/templates';

const log = createLogger('PlaybookDetailAPI');

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check for built-in template
    if (id.startsWith('builtin_')) {
      const index = parseInt(id.replace('builtin_', ''), 10);
      const template = BUILT_IN_PLAYBOOKS[index];
      if (!template) {
        return NextResponse.json({ error: 'Playbook not found' }, { status: 404 });
      }
      return NextResponse.json({
        playbook: {
          id,
          ...template,
          isBuiltIn: true,
          isPublic: true,
          usageCount: 0,
        },
      });
    }

    const playbook = await prisma.decisionPlaybook.findUnique({
      where: { id },
    });

    if (!playbook) {
      return NextResponse.json({ error: 'Playbook not found' }, { status: 404 });
    }

    // Check access
    if (playbook.userId !== user.id && !playbook.isPublic) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ playbook });
  } catch (error) {
    log.error('Failed to fetch playbook:', error);
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

    if (id.startsWith('builtin_')) {
      return NextResponse.json({ error: 'Cannot modify built-in playbooks' }, { status: 400 });
    }

    const existing = await prisma.decisionPlaybook.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Playbook not found' }, { status: 404 });
    }
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const allowedFields = [
      'name',
      'description',
      'category',
      'industry',
      'documentType',
      'complianceFrameworks',
      'biasFocus',
      'personaConfig',
      'templateData',
      'isPublic',
    ] as const;

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const playbook = await prisma.decisionPlaybook.update({
      where: { id },
      data: updateData,
    });

    log.info(`Updated playbook ${id} by user ${user.id}`);
    return NextResponse.json({ playbook });
  } catch (error) {
    log.error('Failed to update playbook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (id.startsWith('builtin_')) {
      return NextResponse.json({ error: 'Cannot delete built-in playbooks' }, { status: 400 });
    }

    const existing = await prisma.decisionPlaybook.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Playbook not found' }, { status: 404 });
    }
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await prisma.decisionPlaybook.delete({ where: { id } });

    log.info(`Deleted playbook ${id} by user ${user.id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Failed to delete playbook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
