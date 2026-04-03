import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { createLogger } from '@/lib/utils/logger';
import { z } from 'zod';

const log = createLogger('DealsRoute');

async function resolveOrgId(userId: string): Promise<string | null> {
  const membership = await prisma.teamMember.findFirst({
    where: { userId },
    select: { orgId: true },
  });
  return membership?.orgId || null;
}

const CreateDealSchema = z.object({
  name: z.string().min(1).max(200),
  dealType: z.enum([
    'buyout',
    'growth_equity',
    'venture',
    'secondary',
    'add_on',
    'recapitalization',
  ]),
  stage: z
    .enum(['screening', 'due_diligence', 'ic_review', 'closing', 'portfolio', 'exited'])
    .default('screening'),
  sector: z.string().max(100).optional(),
  ticketSize: z.number().positive().optional(),
  currency: z.string().length(3).default('USD'),
  fundName: z.string().max(200).optional(),
  vintage: z.number().int().min(1990).max(2100).optional(),
  targetCompany: z.string().max(200).optional(),
});

const UpdateDealSchema = CreateDealSchema.partial().extend({
  status: z.enum(['active', 'passed', 'invested', 'written_off', 'exited']).optional(),
  exitDate: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: 20 deal creations per hour
    const rateLimitResult = await checkRateLimit(user.id, '/api/deals', {
      windowMs: 60 * 60 * 1000,
      maxRequests: 20,
    });
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Resolve org membership
    let orgId: string | null = null;
    try {
      orgId = await resolveOrgId(user.id);
    } catch {
      // Schema drift
    }

    if (!orgId) {
      // Use userId as fallback orgId for solo users
      orgId = user.id;
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = CreateDealSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const deal = await prisma.deal.create({
      data: {
        orgId,
        name: parsed.data.name,
        dealType: parsed.data.dealType,
        stage: parsed.data.stage,
        sector: parsed.data.sector,
        ticketSize: parsed.data.ticketSize,
        currency: parsed.data.currency,
        fundName: parsed.data.fundName,
        vintage: parsed.data.vintage,
        targetCompany: parsed.data.targetCompany,
      },
    });

    log.info(`Deal created: ${deal.id} (${deal.name}) by user ${user.id}`);

    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    log.error('Failed to create deal:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve org membership
    let orgId: string | null = null;
    try {
      orgId = await resolveOrgId(user.id);
    } catch {
      // Schema drift
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const stage = searchParams.get('stage');
    const dealType = searchParams.get('dealType');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1);
    const skip = (page - 1) * limit;

    const VALID_STATUSES = ['active', 'passed', 'invested', 'written_off', 'exited'];
    const VALID_STAGES = ['screening', 'due_diligence', 'ic_review', 'closing', 'portfolio', 'exited'];
    const VALID_DEAL_TYPES = ['buyout', 'growth_equity', 'venture', 'secondary', 'add_on', 'recapitalization'];

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
    }
    if (stage && !VALID_STAGES.includes(stage)) {
      return NextResponse.json({ error: `Invalid stage. Valid values: ${VALID_STAGES.join(', ')}` }, { status: 400 });
    }
    if (dealType && !VALID_DEAL_TYPES.includes(dealType)) {
      return NextResponse.json({ error: `Invalid dealType. Valid values: ${VALID_DEAL_TYPES.join(', ')}` }, { status: 400 });
    }

    const where: Record<string, unknown> = {
      orgId: orgId || user.id,
    };
    if (status) where.status = status;
    if (stage) where.stage = stage;
    if (dealType) where.dealType = dealType;

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: { select: { documents: true } },
        },
      }),
      prisma.deal.count({ where }),
    ]);

    return NextResponse.json({
      data: deals,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    log.error('Failed to fetch deals:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ error: 'Deal ID required' }, { status: 400 });
    }

    const parsed = UpdateDealSchema.safeParse(updates);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Verify ownership via org
    let orgId: string | null = null;
    try {
      orgId = await resolveOrgId(user.id);
    } catch {
      // Schema drift
    }

    const effectiveOrgId = orgId || user.id;
    const deal = await prisma.deal.findFirst({
      where: { id, orgId: effectiveOrgId },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // Use updateMany with orgId predicate to ensure ownership at DB level
    const updateResult = await prisma.deal.updateMany({
      where: { id, orgId: effectiveOrgId },
      data: {
        ...parsed.data,
        ...(parsed.data.exitDate ? { exitDate: new Date(parsed.data.exitDate) } : {}),
      },
    });

    if (updateResult.count === 0) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const updated = await prisma.deal.findUnique({ where: { id } });

    return NextResponse.json(updated);
  } catch (error) {
    log.error('Failed to update deal:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
