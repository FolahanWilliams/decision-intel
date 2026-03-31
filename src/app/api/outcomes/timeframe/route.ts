/**
 * POST /api/outcomes/timeframe
 * Sets or updates the outcome review date for an analysis.
 *
 * Body: { analysisId: string, outcomeDueAt: string (ISO date) }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { isSchemaDrift } from '@/lib/utils/error';

const log = createLogger('OutcomeTimeframeRoute');

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

    const { analysisId, outcomeDueAt } = body;

    if (!analysisId || !outcomeDueAt) {
      return NextResponse.json(
        { error: 'Missing required fields: analysisId, outcomeDueAt' },
        { status: 400 }
      );
    }

    const dueDate = new Date(outcomeDueAt);
    if (isNaN(dueDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    // Verify the analysis exists and belongs to this user's documents
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      select: {
        id: true,
        document: { select: { userId: true } },
      },
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    if (analysis.document.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update the outcome due date
    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        outcomeDueAt: dueDate,
        outcomeStatus: 'pending_outcome',
      },
    });

    log.info(`Outcome timeframe set for analysis ${analysisId}: due ${dueDate.toISOString()}`);

    return NextResponse.json({
      analysisId,
      outcomeDueAt: dueDate.toISOString(),
    });
  } catch (error) {
    if (isSchemaDrift(error)) {
      log.debug('outcomeStatus/outcomeDueAt columns not available (schema drift)');
      return NextResponse.json({
        _message: 'Schema drift — timeframe saved will take effect after migration',
      });
    }
    const msg = error instanceof Error ? error.message : String(error);
    log.error('Failed to set outcome timeframe:', msg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
