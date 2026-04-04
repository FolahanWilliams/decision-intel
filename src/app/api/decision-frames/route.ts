import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { isSchemaDrift } from '@/lib/utils/error';

// Decision framing is encouraged but never mandatory — the only hard
// requirement is a non-empty decisionStatement so the record can be listed.
// All other fields (default action, success/failure criteria, stakeholders)
// are optional so enterprise users can capture a frame in one line and
// enrich it later.
const DecisionFrameSchema = z.object({
  decisionStatement: z.string().min(1, 'Decision statement is required').max(2000),
  defaultAction: z.string().max(2000).optional().default(''),
  successCriteria: z
    .array(z.string().min(1).max(500))
    .max(20)
    .optional()
    .default([]),
  failureCriteria: z
    .array(z.string().min(1).max(500))
    .max(20)
    .optional()
    .default([]),
  stakeholders: z.array(z.string().min(1).max(200)).max(50).optional().default([]),
});

const log = createLogger('DecisionFramesRoute');

/**
 * POST /api/decision-frames
 * Creates a decision frame for outcomes-first workflow (Moat 4).
 *
 * Body: { decisionStatement, defaultAction, successCriteria[], failureCriteria[], stakeholders[] }
 */
export async function POST(request: NextRequest) {
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

    const parsed = DecisionFrameSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { decisionStatement, defaultAction, successCriteria, failureCriteria, stakeholders } =
      parsed.data;

    // Look up user's org membership
    let orgId: string | null = null;
    try {
      const membership = await prisma.teamMember.findFirst({
        where: { userId: user.id },
        select: { orgId: true },
      });
      orgId = membership?.orgId || null;
    } catch {
      // Schema drift — TeamMember may not exist
    }

    const frame = await prisma.decisionFrame.create({
      data: {
        userId: user.id,
        orgId,
        decisionStatement,
        defaultAction,
        successCriteria,
        failureCriteria,
        stakeholders,
      },
    });

    log.info(`Decision frame created: ${frame.id} by user ${user.id}`);
    return NextResponse.json({ id: frame.id });
  } catch (error) {
    if (isSchemaDrift(error)) {
      log.debug('DecisionFrame table not available (schema drift)');
      return NextResponse.json({ id: 'schema-drift-noop' });
    }
    const msg = error instanceof Error ? error.message : String(error);
    log.error('Failed to create decision frame:', msg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/decision-frames?id=<frameId>
 * Fetch a decision frame by ID.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const frameId = request.nextUrl.searchParams.get('id');
    if (!frameId) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    const frame = await prisma.decisionFrame.findUnique({
      where: { id: frameId },
    });

    if (!frame || frame.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(frame);
  } catch (error) {
    if (isSchemaDrift(error)) {
      return NextResponse.json({ error: 'Feature not yet available' }, { status: 501 });
    }
    const msg = error instanceof Error ? error.message : String(error);
    log.error('Failed to fetch decision frame:', msg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
