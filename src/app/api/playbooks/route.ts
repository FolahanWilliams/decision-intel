/**
 * Decision Playbooks CRUD
 *
 * GET  - List playbooks (built-in + user/org custom)
 * POST - Create a custom playbook
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { BUILT_IN_PLAYBOOKS, PLAYBOOK_CATEGORIES } from '@/lib/playbooks/templates';
import { Prisma } from '@prisma/client';

const log = createLogger('PlaybooksAPI');

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const category = request.nextUrl.searchParams.get('category');

    // Fetch user/org custom playbooks
    let customPlaybooks: Array<Record<string, unknown>> = [];
    try {
      const where: Prisma.DecisionPlaybookWhereInput = {
        OR: [{ userId: user.id }, { isPublic: true }],
        ...(category ? { category } : {}),
      };

      customPlaybooks = await prisma.decisionPlaybook.findMany({
        where,
        orderBy: [{ usageCount: 'desc' }, { createdAt: 'desc' }],
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('P2021') || msg.includes('P2022')) {
        log.debug('DecisionPlaybook table not yet migrated — returning built-in only');
      } else {
        throw err;
      }
    }

    // Merge built-in templates (always available)
    const builtIn = BUILT_IN_PLAYBOOKS.filter(p => !category || p.category === category).map(
      (p, i) => ({
        id: `builtin_${i}`,
        ...p,
        isBuiltIn: true,
        isPublic: true,
        usageCount: 0,
        createdAt: null,
        updatedAt: null,
      })
    );

    return NextResponse.json({
      playbooks: [...builtIn, ...customPlaybooks],
      categories: PLAYBOOK_CATEGORIES,
    });
  } catch (error) {
    log.error('Failed to fetch playbooks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      category,
      industry,
      documentType,
      complianceFrameworks,
      biasFocus,
      personaConfig,
      templateData,
      isPublic,
    } = body;

    if (!name || typeof name !== 'string' || name.length < 2) {
      return NextResponse.json({ error: 'Name is required (min 2 characters)' }, { status: 400 });
    }

    if (!description || typeof description !== 'string') {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    const validCategories = PLAYBOOK_CATEGORIES.map(c => c.value);
    if (!category || !validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // Limit custom playbooks per user
    try {
      const existingCount = await prisma.decisionPlaybook.count({
        where: { userId: user.id, isBuiltIn: false },
      });
      if (existingCount >= 20) {
        return NextResponse.json(
          { error: 'Maximum 20 custom playbooks per user' },
          { status: 400 }
        );
      }
    } catch {
      // Table may not exist yet — will fail on create below
    }

    const playbook = await prisma.decisionPlaybook.create({
      data: {
        userId: user.id,
        orgId: user.id,
        name,
        description,
        category,
        industry: industry || null,
        documentType: documentType || null,
        complianceFrameworks: complianceFrameworks || [],
        biasFocus: biasFocus || [],
        personaConfig: personaConfig || null,
        templateData: templateData || null,
        isPublic: isPublic === true,
        isBuiltIn: false,
      },
    });

    log.info(`Created playbook "${name}" for user ${user.id}`);
    return NextResponse.json({ playbook }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('P2021') || msg.includes('P2022')) {
      return NextResponse.json(
        { error: 'Playbooks feature requires a database migration. Run: npx prisma db push' },
        { status: 503 }
      );
    }
    log.error('Failed to create playbook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
