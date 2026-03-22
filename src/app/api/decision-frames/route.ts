import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

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

    const { decisionStatement, defaultAction, successCriteria, failureCriteria, stakeholders } =
      body;

    if (!decisionStatement || !defaultAction) {
      return NextResponse.json(
        { error: 'Missing required fields: decisionStatement, defaultAction' },
        { status: 400 }
      );
    }

    if (!Array.isArray(successCriteria) || successCriteria.length === 0) {
      return NextResponse.json(
        { error: 'At least one success criterion is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(failureCriteria) || failureCriteria.length === 0) {
      return NextResponse.json(
        { error: 'At least one failure criterion is required' },
        { status: 400 }
      );
    }

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
        stakeholders: stakeholders || [],
      },
    });

    log.info(`Decision frame created: ${frame.id} by user ${user.id}`);
    return NextResponse.json({ id: frame.id });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('P2021') || msg.includes('P2022')) {
      log.debug('DecisionFrame table not available (schema drift)');
      return NextResponse.json({ id: 'schema-drift-noop' });
    }
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
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('P2021') || msg.includes('P2022')) {
      return NextResponse.json({ error: 'Feature not yet available' }, { status: 501 });
    }
    log.error('Failed to fetch decision frame:', msg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
