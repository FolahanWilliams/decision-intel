/**
 * Admin API for Prompt Management
 *
 * GET /api/admin/prompts - List all prompts and versions
 * POST /api/admin/prompts - Update a prompt (creates new version)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import {
  registerPrompt,
  getPromptHistory,
  detectPromptDrift,
  initializePromptRegistry,
} from '@/lib/prompts/registry';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('AdminPrompts');

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'drift') {
      // Check for prompt drift
      const drift = await detectPromptDrift();
      return NextResponse.json(drift);
    }

    if (action === 'initialize') {
      // Initialize all prompts
      await initializePromptRegistry();
      return NextResponse.json({ message: 'Prompt registry initialized' });
    }

    // Get specific prompt history
    const promptName = searchParams.get('name');
    if (promptName) {
      const history = await getPromptHistory(promptName);
      return NextResponse.json({ name: promptName, history });
    }

    // List all prompts with their active versions
    const prompts = await prisma.promptVersion.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        version: true,
        hash: true,
        createdAt: true,
      },
    });

    // Get version counts
    const versionCounts = await prisma.promptVersion.groupBy({
      by: ['name'],
      _count: true,
    });

    const promptsWithCounts = prompts.map(p => ({
      ...p,
      totalVersions: versionCounts.find(v => v.name === p.name)?._count || 1,
    }));

    return NextResponse.json({ prompts: promptsWithCounts });
  } catch (error) {
    log.error('Failed to fetch prompts:', error);
    return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, content } = body;

    if (!name || !content) {
      return NextResponse.json({ error: 'Name and content are required' }, { status: 400 });
    }

    // Register the new prompt version
    const result = await registerPrompt(name, content);

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'prompt.update',
        resource: 'prompt',
        resourceId: result.id,
        details: {
          name,
          version: result.version,
          isNew: result.isNew,
        },
      },
    });

    return NextResponse.json({
      message: result.isNew ? 'New prompt version created' : 'Prompt unchanged',
      ...result,
    });
  } catch (error) {
    log.error('Failed to update prompt:', error);
    return NextResponse.json({ error: 'Failed to update prompt' }, { status: 500 });
  }
}

/**
 * Rollback to a previous prompt version
 */
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, version } = body;

    if (!name || !version) {
      return NextResponse.json({ error: 'Name and version are required' }, { status: 400 });
    }

    // Find the specific version
    const targetPrompt = await prisma.promptVersion.findUnique({
      where: {
        name_version: {
          name,
          version,
        },
      },
    });

    if (!targetPrompt) {
      return NextResponse.json({ error: 'Prompt version not found' }, { status: 404 });
    }

    // Deactivate all versions
    await prisma.promptVersion.updateMany({
      where: { name },
      data: { isActive: false },
    });

    // Activate the target version
    await prisma.promptVersion.update({
      where: { id: targetPrompt.id },
      data: { isActive: true },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'prompt.rollback',
        resource: 'prompt',
        resourceId: targetPrompt.id,
        details: {
          name,
          rolledBackTo: version,
        },
      },
    });

    return NextResponse.json({
      message: `Rolled back ${name} to version ${version}`,
      prompt: targetPrompt,
    });
  } catch (error) {
    log.error('Failed to rollback prompt:', error);
    return NextResponse.json({ error: 'Failed to rollback prompt' }, { status: 500 });
  }
}
